using CivicGo.Api.Data;
using CivicGo.Api.Data.Entities;
using CivicGo.Api.Missions;
using Microsoft.EntityFrameworkCore;

namespace CivicGo.Api.Zones;

public static class ZoneEndpoints
{
    public static RouteGroupBuilder MapZoneEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/zones").WithTags("Zones");

        group.MapGet("/", async (
            CivicGoDbContext dbContext,
            CancellationToken cancellationToken
        ) =>
        {
            var zones = await GetRankedZonesAsync(dbContext, cancellationToken);

            return Results.Ok(zones);
        })
        .WithName("GetZones");

        group.MapGet("/leaderboard", async (
            CivicGoDbContext dbContext,
            CancellationToken cancellationToken
        ) =>
        {
            var rankedZones = await GetRankedZonesAsync(dbContext, cancellationToken);

            return Results.Ok(rankedZones);
        })
        .WithName("GetZoneLeaderboard");

        group.MapGet("/{id:guid}", async (
            Guid id,
            CivicGoDbContext dbContext,
            CancellationToken cancellationToken
        ) =>
        {
            var rankedZones = await GetRankedZonesAsync(dbContext, cancellationToken);
            var zone = rankedZones.FirstOrDefault(item => item.Id == id);

            if (zone is null)
            {
                return Results.NotFound();
            }

            var issues = await GetZoneIssuesAsync(dbContext, id, cancellationToken);
            var missions = await GetZoneMissionsAsync(dbContext, id, cancellationToken);

            return Results.Ok(new ZoneDetailResponse(zone, issues, missions));
        })
        .WithName("GetZoneById");

        group.MapGet("/{id:guid}/issues", async (
            Guid id,
            CivicGoDbContext dbContext,
            CancellationToken cancellationToken
        ) =>
        {
            var zoneExists = await dbContext.Zones
                .AsNoTracking()
                .AnyAsync(zone => zone.Id == id, cancellationToken);

            return zoneExists
                ? Results.Ok(await GetZoneIssuesAsync(dbContext, id, cancellationToken))
                : Results.NotFound();
        })
        .WithName("GetZoneIssues");

        group.MapGet("/{id:guid}/missions", async (
            Guid id,
            CivicGoDbContext dbContext,
            CancellationToken cancellationToken
        ) =>
        {
            var zoneExists = await dbContext.Zones
                .AsNoTracking()
                .AnyAsync(zone => zone.Id == id, cancellationToken);

            return zoneExists
                ? Results.Ok(await GetZoneMissionsAsync(dbContext, id, cancellationToken))
                : Results.NotFound();
        })
        .WithName("GetZoneMissions");

        return group;
    }

    private static async Task<IReadOnlyList<ZoneLeaderboardItemResponse>> GetRankedZonesAsync(
        CivicGoDbContext dbContext,
        CancellationToken cancellationToken
    )
    {
        var zones = await dbContext.Zones
            .AsNoTracking()
            .Include(zone => zone.Scores)
            .OrderByDescending(zone => zone.Score)
            .ThenBy(zone => zone.Name)
            .ToListAsync(cancellationToken);
        var zoneIds = zones.Select(zone => zone.Id).ToArray();
        var issueCounts = await dbContext.Issues
            .AsNoTracking()
            .Where(issue => issue.ZoneId.HasValue && zoneIds.Contains(issue.ZoneId.Value))
            .GroupBy(issue => issue.ZoneId!.Value)
            .Select(grouped => new
            {
                ZoneId = grouped.Key,
                OpenIssues = grouped.Count(issue =>
                    issue.ResolvedAt == null &&
                    issue.Status != "resolved" &&
                    issue.Status != "issue_resolved"
                ),
                ResolvedIssues = grouped.Count(issue =>
                    issue.ResolvedAt != null ||
                    issue.Status == "resolved" ||
                    issue.Status == "issue_resolved"
                )
            })
            .ToDictionaryAsync(item => item.ZoneId, cancellationToken);
        var activeMissionCounts = await dbContext.Missions
            .AsNoTracking()
            .Where(mission =>
                mission.ZoneId.HasValue &&
                zoneIds.Contains(mission.ZoneId.Value) &&
                mission.Status == "active"
            )
            .GroupBy(mission => mission.ZoneId!.Value)
            .Select(grouped => new
            {
                ZoneId = grouped.Key,
                Count = grouped.Count()
            })
            .ToDictionaryAsync(item => item.ZoneId, cancellationToken);

        return zones
            .Select((zone, index) => ToLeaderboardItem(
                zone,
                index + 1,
                issueCounts.GetValueOrDefault(zone.Id)?.OpenIssues ?? 0,
                issueCounts.GetValueOrDefault(zone.Id)?.ResolvedIssues ?? 0,
                activeMissionCounts.GetValueOrDefault(zone.Id)?.Count ?? 0
            ))
            .ToList();
    }

    private static async Task<IReadOnlyList<ZoneIssueSummaryResponse>> GetZoneIssuesAsync(
        CivicGoDbContext dbContext,
        Guid zoneId,
        CancellationToken cancellationToken
    )
    {
        return await dbContext.Issues
            .AsNoTracking()
            .Where(issue => issue.ZoneId == zoneId)
            .OrderByDescending(issue => issue.CreatedAt)
            .Take(50)
            .Select(issue => new ZoneIssueSummaryResponse(
                issue.Id,
                issue.Title,
                issue.Category,
                issue.Severity,
                issue.Status,
                issue.ResponsibleActor,
                issue.ImageUrl,
                issue.DuplicateCount,
                issue.CreatedAt
            ))
            .ToListAsync(cancellationToken);
    }

    private static async Task<IReadOnlyList<MissionSummaryResponse>> GetZoneMissionsAsync(
        CivicGoDbContext dbContext,
        Guid zoneId,
        CancellationToken cancellationToken
    )
    {
        var missions = await dbContext.Missions
            .AsNoTracking()
            .Include(mission => mission.Participants)
            .Include(mission => mission.Reward)
                .ThenInclude(reward => reward!.Partner)
            .Where(mission => mission.ZoneId == zoneId)
            .OrderByDescending(mission => mission.CreatedAt)
            .Take(50)
            .ToListAsync(cancellationToken);

        return missions.Select(MissionMapper.ToSummary).ToList();
    }

    private static ZoneLeaderboardItemResponse ToLeaderboardItem(
        ZoneEntity zone,
        int rank,
        int openIssues,
        int resolvedIssues,
        int activeMissions
    )
    {
        var latestScores = zone.Scores
            .OrderByDescending(score => score.CalculatedAt)
            .Take(2)
            .ToArray();
        var latestScore = latestScores.FirstOrDefault();
        var previousScore = latestScores.Skip(1).FirstOrDefault();
        var scoreBreakdown = latestScore is null
            ? ZoneScoreBreakdown.FromZone(zone)
            : ZoneScoreBreakdown.FromScore(latestScore);
        var totalScore = latestScore?.TotalScore ?? zone.Score;
        var scoreDelta = previousScore is null
            ? 0
            : totalScore - previousScore.TotalScore;

        return new ZoneLeaderboardItemResponse(
            zone.Id,
            rank,
            zone.Name,
            zone.Description,
            totalScore,
            scoreDelta,
            scoreBreakdown.CleanlinessScore,
            scoreBreakdown.CommunityScore,
            scoreBreakdown.SafetyScore,
            scoreBreakdown.EngagementScore,
            zone.Latitude,
            zone.Longitude,
            openIssues,
            resolvedIssues,
            activeMissions,
            zone.UpdatedAt,
            latestScore?.CalculatedAt
        );
    }

    private readonly record struct ZoneScoreBreakdown(
        int CleanlinessScore,
        int CommunityScore,
        int SafetyScore,
        int EngagementScore
    )
    {
        public static ZoneScoreBreakdown FromZone(ZoneEntity zone)
        {
            var cleanlinessScore = (int)Math.Round(zone.Score * 0.30);
            var communityScore = (int)Math.Round(zone.Score * 0.25);
            var safetyScore = (int)Math.Round(zone.Score * 0.25);
            var engagementScore = Math.Max(
                0,
                zone.Score - cleanlinessScore - communityScore - safetyScore
            );

            return new ZoneScoreBreakdown(
                cleanlinessScore,
                communityScore,
                safetyScore,
                engagementScore
            );
        }

        public static ZoneScoreBreakdown FromScore(ZoneScoreEntity score)
        {
            return new ZoneScoreBreakdown(
                score.CleanlinessScore,
                score.CommunityScore,
                score.SafetyScore,
                score.EngagementScore
            );
        }
    }
}
