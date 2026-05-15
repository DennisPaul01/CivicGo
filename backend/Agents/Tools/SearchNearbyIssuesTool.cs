using CivicGo.Api.Agents.Runtime;
using CivicGo.Api.Data;
using CivicGo.Api.Duplicates;
using Microsoft.EntityFrameworkCore;

namespace CivicGo.Api.Agents.Tools;

public sealed class SearchNearbyIssuesTool(
    IServiceScopeFactory scopeFactory,
    ILogger<SearchNearbyIssuesTool> logger
)
{
    public const string ToolName = "search_nearby_issues";
    private const double RadiusMeters = 300;
    private const double EarthRadiusMeters = 6_371_000;
    private const string MatchPolicy =
        "MVP read-only duplicate scan: active reports inside 300m are similar civic signals; exact image hash increases confidence.";

    public async Task<AgentToolResult> ExecuteAsync(
        Guid issueId,
        RuntimeAgentConfig agentConfig,
        CancellationToken cancellationToken
    )
    {
        try
        {
            using var scope = scopeFactory.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<CivicGoDbContext>();
            var result = await SearchReadOnlyAsync(dbContext, issueId, cancellationToken);

            return new AgentToolResult(ToolName, true, result);
        }
        catch (Exception exception)
        {
            logger.LogWarning(
                exception,
                "Duplicate Agent fallback used for issue {IssueId}. Continuing mission flow.",
                issueId
            );

            return new AgentToolResult(
                ToolName,
                false,
                new DuplicateDetectionResult(
                    0,
                    null,
                    new DuplicateDetectionDiagnostics(
                        0,
                        0,
                        null,
                        (int)RadiusMeters,
                        "Fallback: duplicate search was unavailable, so the mission flow continues without blocking."
                    )
                ),
                "Duplicate search failed; continuing without a duplicate match."
            );
        }
    }

    private static async Task<DuplicateDetectionResult> SearchReadOnlyAsync(
        CivicGoDbContext dbContext,
        Guid issueId,
        CancellationToken cancellationToken
    )
    {
        var issue = await dbContext.Issues
            .AsNoTracking()
            .Include(item => item.Images)
            .FirstOrDefaultAsync(item => item.Id == issueId, cancellationToken);

        if (issue is null)
        {
            throw new KeyNotFoundException($"Issue {issueId} was not found.");
        }

        var issueImageHashes = issue.Images
            .Select(image => image.ContentHash)
            .Where(hash => !string.IsNullOrWhiteSpace(hash))
            .ToHashSet(StringComparer.OrdinalIgnoreCase);
        var latitudeDelta = RadiusMeters / 111_320;
        var longitudeScale = Math.Cos(ToRadians(issue.Latitude));
        var longitudeDelta = longitudeScale == 0
            ? latitudeDelta
            : RadiusMeters / (111_320 * Math.Abs(longitudeScale));
        var candidates = (await dbContext.Issues
                .AsNoTracking()
                .Include(candidate => candidate.Images)
                .Where(candidate =>
                    candidate.Id != issue.Id &&
                    candidate.Status != "resolved" &&
                    candidate.Status != "issue_resolved" &&
                    candidate.Status != "rejected" &&
                    candidate.Latitude >= issue.Latitude - latitudeDelta &&
                    candidate.Latitude <= issue.Latitude + latitudeDelta &&
                    candidate.Longitude >= issue.Longitude - longitudeDelta &&
                    candidate.Longitude <= issue.Longitude + longitudeDelta
                )
                .ToListAsync(cancellationToken))
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
            .Where(candidate => candidate.DistanceMeters <= RadiusMeters || candidate.HasMatchingImageHash)
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

        return new DuplicateDetectionResult(
            matches.Length,
            nearest is null
                ? null
                : new NearestDuplicateIssueResponse(
                    nearest.Issue.Id,
                    nearest.Issue.Title,
                    (int)Math.Round(nearest.DistanceMeters),
                    nearest.Issue.Status
                ),
            new DuplicateDetectionDiagnostics(
                candidates.Length,
                matches.Length,
                nearestCandidateResponse,
                (int)RadiusMeters,
                MatchPolicy
            )
        );
    }

    private static bool HasMatchingImageHash(
        Data.Entities.IssueEntity candidate,
        IReadOnlySet<string> issueImageHashes
    )
    {
        return issueImageHashes.Count > 0 &&
            candidate.Images.Any(image =>
                !string.IsNullOrWhiteSpace(image.ContentHash) &&
                !image.ContentHash.StartsWith("legacy:", StringComparison.OrdinalIgnoreCase) &&
                issueImageHashes.Contains(image.ContentHash)
            );
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

    private sealed record DuplicateCandidate(
        Data.Entities.IssueEntity Issue,
        double DistanceMeters,
        bool HasMatchingImageHash
    );
}
