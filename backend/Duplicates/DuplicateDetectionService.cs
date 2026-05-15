using System.Text.Json;
using CivicGo.Api.Agents;
using CivicGo.Api.Data;
using CivicGo.Api.Data.Entities;
using CivicGo.Api.Issues;
using Microsoft.EntityFrameworkCore;

namespace CivicGo.Api.Duplicates;

public sealed class DuplicateDetectionService(
    CivicGoDbContext dbContext,
    ILogger<DuplicateDetectionService> logger
)
{
    private const double RadiusMeters = 300;
    private const double SameSpotRadiusMeters = 95;
    private const double SameZoneLocationRadiusMeters = 225;
    private const double UnknownCategoryRadiusMeters = 250;
    private const double EarthRadiusMeters = 6_371_000;
    private const string MatchPolicy =
        "MVP: any active report inside 300m is treated as a similar civic signal; image hash/category/zone increase confidence.";

    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        WriteIndented = false
    };

    private static readonly string[] ClosedStatuses =
    [
        "resolved",
        "issue_resolved",
        "rejected"
    ];

    public async Task<DuplicateDetectionResult> CheckIssueAsync(
        Guid issueId,
        RuntimeAgentConfig? agentConfig,
        CancellationToken cancellationToken
    )
    {
        var issue = await dbContext.Issues
            .Include(item => item.Zone)
            .Include(item => item.Images)
            .Include(item => item.AgentRuns)
                .ThenInclude(run => run.AgentSteps)
            .FirstOrDefaultAsync(item => item.Id == issueId, cancellationToken);

        if (issue is null)
        {
            throw new KeyNotFoundException($"Issue {issueId} was not found.");
        }

        var latestRun = EnsureAgentRun(issue);

        var existingNearestDuplicate = IssueDuplicateMapper.GetNearestDuplicate(issue);
        if (existingNearestDuplicate is not null)
        {
            return new DuplicateDetectionResult(
                issue.DuplicateCount,
                existingNearestDuplicate,
                new DuplicateDetectionDiagnostics(
                    issue.DuplicateCount,
                    issue.DuplicateCount,
                    existingNearestDuplicate,
                    (int)RadiusMeters,
                    MatchPolicy
                )
            );
        }

        var issueImageHashes = issue.Images
            .Select(image => image.ContentHash)
            .Where(hash => !string.IsNullOrWhiteSpace(hash))
            .ToHashSet(StringComparer.OrdinalIgnoreCase);
        var candidates = (await GetCandidateIssuesAsync(issue, cancellationToken))
            .Select(candidate => new DuplicateCandidate(
                candidate,
                CalculateDistanceMeters(
                    issue.Latitude,
                    issue.Longitude,
                    candidate.Latitude,
                    candidate.Longitude
                ),
                HasMatchingImageHash(candidate, issueImageHashes)
            ))
            .OrderBy(candidate => candidate.DistanceMeters)
            .ToArray();
        var matches = candidates
            .Where(candidate => IsDuplicateMatch(issue, candidate))
            .OrderBy(candidate => candidate.DistanceMeters)
            .ToArray();
        var nearest = matches.FirstOrDefault();
        var nearestCandidate = candidates.FirstOrDefault();
        var nearestCandidateResponse = nearestCandidate is null
            ? null
            : new NearestDuplicateIssueResponse(
                nearestCandidate.Issue.Id,
                nearestCandidate.Issue.Title,
                (int)Math.Round(nearestCandidate.DistanceMeters),
                nearestCandidate.Issue.Status
            );
        var diagnostics = new DuplicateDetectionDiagnostics(
            candidates.Length,
            matches.Length,
            nearestCandidateResponse,
            (int)RadiusMeters,
            MatchPolicy
        );
        var now = DateTimeOffset.UtcNow;

        AddAgentStep(issue, latestRun, candidates, matches, nearest, diagnostics, agentConfig, now);

        if (nearest is null)
        {
            issue.UpdatedAt = now;
            await TrySaveDuplicateDetectionAsync(issue.Id, cancellationToken);

            return new DuplicateDetectionResult(issue.DuplicateCount, null, diagnostics);
        }

        issue.DuplicateCount = Math.Max(issue.DuplicateCount, matches.Length);
        issue.UpdatedAt = now;

        foreach (var match in matches)
        {
            match.Issue.DuplicateCount += 1;
            match.Issue.UpdatedAt = now;
        }

        dbContext.PublicActivityFeedItems.Add(new PublicActivityFeedItemEntity
        {
            Id = Guid.NewGuid(),
            Type = "duplicate_detected",
            Title = "Posibil duplicat detectat",
            Message = $"AI a gasit un raport apropiat de tip {HumanizeCategoryRo(issue.Category)} in {issue.Zone?.Name ?? "Timisoara"}.",
            RelatedIssueId = issue.Id,
            RelatedZoneId = issue.ZoneId,
            CreatedAt = now
        });

        logger.LogInformation(
            "Duplicate Agent found {DuplicateCount} nearby issue(s) for {IssueId}. Nearest: {NearestIssueId} at {DistanceMeters}m.",
            matches.Length,
            issue.Id,
            nearest.Issue.Id,
            Math.Round(nearest.DistanceMeters)
        );

        await TrySaveDuplicateDetectionAsync(issue.Id, cancellationToken);

        return new DuplicateDetectionResult(
            issue.DuplicateCount,
            new NearestDuplicateIssueResponse(
                nearest.Issue.Id,
                nearest.Issue.Title,
                (int)Math.Round(nearest.DistanceMeters),
                nearest.Issue.Status
            ),
            diagnostics
        );
    }

    public Task<DuplicateDetectionResult> CheckIssueAsync(
        Guid issueId,
        CancellationToken cancellationToken
    )
    {
        return CheckIssueAsync(issueId, null, cancellationToken);
    }

    private async Task<bool> TrySaveDuplicateDetectionAsync(
        Guid issueId,
        CancellationToken cancellationToken
    )
    {
        try
        {
            await dbContext.SaveChangesAsync(cancellationToken);

            return true;
        }
        catch (DbUpdateConcurrencyException exception)
        {
            logger.LogWarning(
                exception,
                "Duplicate detection skipped persistence for issue {IssueId} because tracked data changed before save.",
                issueId
            );
            dbContext.ChangeTracker.Clear();

            return false;
        }
        catch (DbUpdateException exception)
        {
            logger.LogWarning(
                exception,
                "Duplicate detection skipped persistence for issue {IssueId} because the duplicate update could not be saved.",
                issueId
            );
            dbContext.ChangeTracker.Clear();

            return false;
        }
    }

    private async Task<List<IssueEntity>> GetCandidateIssuesAsync(
        IssueEntity issue,
        CancellationToken cancellationToken
    )
    {
        var latitudeDelta = RadiusMeters / 111_320;
        var longitudeScale = Math.Cos(ToRadians(issue.Latitude));
        var longitudeDelta = longitudeScale == 0
            ? latitudeDelta
            : RadiusMeters / (111_320 * Math.Abs(longitudeScale));

        return await dbContext.Issues
            .Include(candidate => candidate.Images)
            .Where(candidate =>
                candidate.Id != issue.Id &&
                !ClosedStatuses.Contains(candidate.Status) &&
                candidate.Latitude >= issue.Latitude - latitudeDelta &&
                candidate.Latitude <= issue.Latitude + latitudeDelta &&
                candidate.Longitude >= issue.Longitude - longitudeDelta &&
                candidate.Longitude <= issue.Longitude + longitudeDelta
            )
            .ToListAsync(cancellationToken);
    }

    private static bool IsDuplicateMatch(IssueEntity issue, DuplicateCandidate candidate)
    {
        if (candidate.HasMatchingImageHash)
        {
            return true;
        }

        if (candidate.DistanceMeters <= RadiusMeters)
        {
            return true;
        }

        if (candidate.DistanceMeters > RadiusMeters)
        {
            return false;
        }

        if (candidate.DistanceMeters <= SameSpotRadiusMeters)
        {
            return true;
        }

        if (string.Equals(candidate.Issue.Category, issue.Category, StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        if (candidate.Issue.ZoneId == issue.ZoneId &&
            candidate.DistanceMeters <= SameZoneLocationRadiusMeters)
        {
            return true;
        }

        return (IsUnknownCategory(issue.Category) || IsUnknownCategory(candidate.Issue.Category)) &&
            candidate.DistanceMeters <= UnknownCategoryRadiusMeters;
    }

    private static bool IsUnknownCategory(string value)
    {
        return string.IsNullOrWhiteSpace(value) ||
            value.Equals("other", StringComparison.OrdinalIgnoreCase);
    }

    private static bool HasMatchingImageHash(
        IssueEntity candidate,
        IReadOnlySet<string> issueImageHashes
    )
    {
        if (issueImageHashes.Count == 0)
        {
            return false;
        }

        return candidate.Images.Any(image =>
            !string.IsNullOrWhiteSpace(image.ContentHash) &&
            !image.ContentHash.StartsWith("legacy:", StringComparison.OrdinalIgnoreCase) &&
            issueImageHashes.Contains(image.ContentHash)
        );
    }

    private static AgentRunEntity EnsureAgentRun(IssueEntity issue)
    {
        var latestRun = issue.AgentRuns
            .OrderByDescending(run => run.CreatedAt)
            .FirstOrDefault();

        if (latestRun is not null)
        {
            return latestRun;
        }

        var now = DateTimeOffset.UtcNow;
        latestRun = new AgentRunEntity
        {
            Id = Guid.NewGuid(),
            IssueId = issue.Id,
            Status = "completed",
            StartedAt = now,
            CompletedAt = now,
            CreatedAt = now
        };
        issue.AgentRuns.Add(latestRun);

        return latestRun;
    }

    private static void AddAgentStep(
        IssueEntity issue,
        AgentRunEntity run,
        IReadOnlyCollection<DuplicateCandidate> candidates,
        IReadOnlyCollection<DuplicateCandidate> matches,
        DuplicateCandidate? nearest,
        DuplicateDetectionDiagnostics diagnostics,
        RuntimeAgentConfig? agentConfig,
        DateTimeOffset now
    )
    {
        var nextOrder = run.AgentSteps.Count == 0
            ? 1
            : run.AgentSteps.Max(step => step.Order) + 1;

        run.AgentSteps.Add(new AgentStepEntity
        {
            Id = Guid.NewGuid(),
            AgentRunId = run.Id,
            AgentName = "Duplicate Agent",
            Status = "completed",
            InputJson = JsonSerializer.Serialize(new
            {
                issue.Id,
                issue.Category,
                issue.Status,
                radiusMeters = RadiusMeters,
                issue.Latitude,
                issue.Longitude,
                matchPolicy = MatchPolicy,
                adminInstructions = agentConfig?.Instructions,
                configuredModel = agentConfig?.Model,
                fallbackMode = agentConfig?.FallbackMode,
                isEnabled = agentConfig?.IsEnabled ?? true
            }, JsonOptions),
            OutputJson = JsonSerializer.Serialize(new
            {
                mode = agentConfig?.FallbackMode ?? "Numeric latitude/longitude radius check.",
                diagnostics,
                candidateCount = candidates.Count,
                duplicateCount = matches.Count,
                nearestIssueId = nearest?.Issue.Id,
                nearestTitle = nearest?.Issue.Title,
                nearestStatus = nearest?.Issue.Status,
                nearestDistanceMeters = nearest is null
                    ? null
                    : (int?)Math.Round(nearest.DistanceMeters),
                nearestCandidateIssueId = diagnostics.NearestCandidate?.IssueId,
                nearestCandidateTitle = diagnostics.NearestCandidate?.Title,
                nearestCandidateDistanceMeters = diagnostics.NearestCandidate?.DistanceMeters,
                matchingIssueIds = matches.Select(match => match.Issue.Id).ToArray(),
                matchingImageHashIssueIds = matches
                    .Where(match => match.HasMatchingImageHash)
                    .Select(match => match.Issue.Id)
                    .ToArray()
            }, JsonOptions),
            Message = nearest is null
                ? "A verificat rapoartele din apropiere: nu a gasit duplicat."
                : "A detectat un posibil duplicat in apropiere.",
            StartedAt = now.AddMilliseconds(-220),
            CompletedAt = now,
            Order = nextOrder
        });
        run.CompletedAt = now;
    }

    private static double CalculateDistanceMeters(
        double firstLatitude,
        double firstLongitude,
        double secondLatitude,
        double secondLongitude
    )
    {
        var latitudeDelta = ToRadians(secondLatitude - firstLatitude);
        var longitudeDelta = ToRadians(secondLongitude - firstLongitude);
        var firstLatitudeRadians = ToRadians(firstLatitude);
        var secondLatitudeRadians = ToRadians(secondLatitude);
        var haversine =
            Math.Pow(Math.Sin(latitudeDelta / 2), 2) +
            Math.Cos(firstLatitudeRadians) *
            Math.Cos(secondLatitudeRadians) *
            Math.Pow(Math.Sin(longitudeDelta / 2), 2);
        var angularDistance = 2 * Math.Atan2(Math.Sqrt(haversine), Math.Sqrt(1 - haversine));

        return EarthRadiusMeters * angularDistance;
    }

    private static double ToRadians(double value)
    {
        return value * Math.PI / 180;
    }

    private static string HumanizeCategoryRo(string value)
    {
        return value switch
        {
            _ => IssueCategories.HumanizeRo(value)
        };
    }

    private sealed record DuplicateCandidate(
        IssueEntity Issue,
        double DistanceMeters,
        bool HasMatchingImageHash
    );
}
