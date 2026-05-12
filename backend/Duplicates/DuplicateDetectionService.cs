using System.Text.Json;
using CivicGo.Api.Data;
using CivicGo.Api.Data.Entities;
using Microsoft.EntityFrameworkCore;

namespace CivicGo.Api.Duplicates;

public sealed class DuplicateDetectionService(
    CivicGoDbContext dbContext,
    ILogger<DuplicateDetectionService> logger
)
{
    private const double RadiusMeters = 300;
    private const double EarthRadiusMeters = 6_371_000;

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
        CancellationToken cancellationToken
    )
    {
        var issue = await dbContext.Issues
            .Include(item => item.Zone)
            .Include(item => item.AgentRuns)
                .ThenInclude(run => run.AgentSteps)
            .FirstOrDefaultAsync(item => item.Id == issueId, cancellationToken);

        if (issue is null)
        {
            throw new KeyNotFoundException($"Issue {issueId} was not found.");
        }

        var latestRun = EnsureAgentRun(issue);

        if (latestRun.AgentSteps.Any(step => step.AgentName == "Duplicate Agent"))
        {
            return new DuplicateDetectionResult(
                issue.DuplicateCount,
                IssueDuplicateMapper.GetNearestDuplicate(issue)
            );
        }

        var candidates = await GetCandidateIssuesAsync(issue, cancellationToken);
        var matches = candidates
            .Select(candidate => new DuplicateCandidate(
                candidate,
                CalculateDistanceMeters(
                    issue.Latitude,
                    issue.Longitude,
                    candidate.Latitude,
                    candidate.Longitude
                )
            ))
            .Where(candidate => candidate.DistanceMeters <= RadiusMeters)
            .OrderBy(candidate => candidate.DistanceMeters)
            .ToArray();
        var nearest = matches.FirstOrDefault();
        var now = DateTimeOffset.UtcNow;

        AddAgentStep(issue, latestRun, matches, nearest, now);

        if (nearest is null)
        {
            issue.UpdatedAt = now;
            await TrySaveDuplicateDetectionAsync(issue.Id, cancellationToken);

            return new DuplicateDetectionResult(issue.DuplicateCount, null);
        }

        issue.Status = "duplicate_detected";
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
            Title = "Possible duplicate detected",
            Message = $"AI found a nearby {issue.Category.Replace('_', ' ')} report in {issue.Zone?.Name ?? "Timisoara"}.",
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
            )
        );
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
            .Where(candidate =>
                candidate.Id != issue.Id &&
                candidate.Category == issue.Category &&
                !ClosedStatuses.Contains(candidate.Status) &&
                candidate.Latitude >= issue.Latitude - latitudeDelta &&
                candidate.Latitude <= issue.Latitude + latitudeDelta &&
                candidate.Longitude >= issue.Longitude - longitudeDelta &&
                candidate.Longitude <= issue.Longitude + longitudeDelta
            )
            .ToListAsync(cancellationToken);
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
        IReadOnlyCollection<DuplicateCandidate> matches,
        DuplicateCandidate? nearest,
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
                issue.Longitude
            }, JsonOptions),
            OutputJson = JsonSerializer.Serialize(new
            {
                duplicateCount = matches.Count,
                nearestIssueId = nearest?.Issue.Id,
                nearestTitle = nearest?.Issue.Title,
                nearestStatus = nearest?.Issue.Status,
                nearestDistanceMeters = nearest is null
                    ? null
                    : (int?)Math.Round(nearest.DistanceMeters),
                matchingIssueIds = matches.Select(match => match.Issue.Id).ToArray()
            }, JsonOptions),
            Message = nearest is null
                ? "Checked nearby reports: no duplicate found."
                : "Possible duplicate detected nearby.",
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

    private sealed record DuplicateCandidate(IssueEntity Issue, double DistanceMeters);
}
