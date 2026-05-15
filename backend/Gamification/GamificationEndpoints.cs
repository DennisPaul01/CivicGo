using CivicGo.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace CivicGo.Api.Gamification;

public static class GamificationEndpoints
{
    private const int DefaultLimit = 50;
    private const int MaxLimit = 100;

    public static RouteGroupBuilder MapGamificationEndpoints(this IEndpointRouteBuilder app)
    {
        var gamification = app.MapGroup("/api/gamification").WithTags("Gamification");

        gamification.MapGet("/leaderboard", async (
            string? period,
            int? limit,
            CivicGoDbContext dbContext,
            CancellationToken cancellationToken
        ) =>
        {
            var normalizedPeriod = NormalizePeriod(period);
            var safeLimit = Math.Clamp(limit ?? DefaultLimit, 1, MaxLimit);
            var rankedUsers = await GetRankedUsersAsync(dbContext, cancellationToken);
            var leaderboard = normalizedPeriod == "overall"
                ? rankedUsers
                    .OrderBy(item => item.OverallRank)
                    .Take(safeLimit)
                    .Select(item => ToLeaderboardUser(item, item.OverallRank, item.Points))
                    .ToList()
                : rankedUsers
                    .OrderBy(item => item.ThirtyDayRank)
                    .Take(safeLimit)
                    .Select(item => ToLeaderboardUser(item, item.ThirtyDayRank, item.ThirtyDayPoints))
                    .ToList();

            return Results.Ok(leaderboard);
        })
        .WithName("GetGamificationLeaderboard");

        app.MapGet("/api/users/{id:guid}/public-profile", async (
            Guid id,
            CivicGoDbContext dbContext,
            CancellationToken cancellationToken
        ) =>
        {
            var rankedUsers = await GetRankedUsersAsync(dbContext, cancellationToken);
            var rankedUser = rankedUsers.FirstOrDefault(user => user.Id == id);

            if (rankedUser is null)
            {
                return Results.NotFound();
            }

            var recentIssues = await dbContext.Issues
                .AsNoTracking()
                .Where(issue => issue.CreatedByUserId == id)
                .OrderByDescending(issue => issue.CreatedAt)
                .Take(5)
                .Select(issue => new PublicContributionResponse(
                    "issue",
                    issue.Title,
                    issue.Status,
                    issue.CreatedAt
                ))
                .ToListAsync(cancellationToken);
            var recentMissions = await dbContext.MissionParticipants
                .AsNoTracking()
                .Include(participant => participant.Mission)
                .Where(participant => participant.UserId == id && participant.Mission != null)
                .OrderByDescending(participant => participant.JoinedAt)
                .Take(5)
                .Select(participant => new PublicContributionResponse(
                    "mission",
                    participant.Mission!.Title,
                    participant.Status,
                    participant.JoinedAt
                ))
                .ToListAsync(cancellationToken);
            var recentContributions = recentIssues
                .Concat(recentMissions)
                .OrderByDescending(contribution => contribution.CreatedAt)
                .Take(6)
                .ToList();

            return Results.Ok(new PublicUserProfileResponse(
                rankedUser.Id,
                rankedUser.FullName,
                rankedUser.AvatarUrl,
                rankedUser.Points,
                rankedUser.ThirtyDayPoints,
                rankedUser.RankName,
                rankedUser.TrustScore,
                rankedUser.BadgeCount,
                rankedUser.ReportCount,
                rankedUser.MissionCount,
                rankedUser.OverallRank,
                rankedUser.ThirtyDayRank,
                rankedUser.Badges,
                recentContributions
            ));
        })
        .WithName("GetPublicUserProfile");

        return gamification;
    }

    private static string NormalizePeriod(string? period)
    {
        return string.Equals(period, "overall", StringComparison.OrdinalIgnoreCase)
            ? "overall"
            : "30d";
    }

    private static async Task<IReadOnlyList<RankedUser>> GetRankedUsersAsync(
        CivicGoDbContext dbContext,
        CancellationToken cancellationToken
    )
    {
        var now = DateTimeOffset.UtcNow;
        var thirtyDaysAgo = now.AddDays(-30);
        var users = await dbContext.Users
            .AsNoTracking()
            .Include(user => user.Rank)
            .OrderBy(user => user.FullName)
            .ToListAsync(cancellationToken);
        var userIds = users.Select(user => user.Id).ToArray();
        var thirtyDayPoints = await dbContext.UserPointsHistory
            .AsNoTracking()
            .Where(history => userIds.Contains(history.UserId) && history.CreatedAt >= thirtyDaysAgo)
            .GroupBy(history => history.UserId)
            .Select(grouped => new
            {
                UserId = grouped.Key,
                Points = grouped.Sum(history => history.Points)
            })
            .ToDictionaryAsync(item => item.UserId, item => item.Points, cancellationToken);
        var reportCounts = await dbContext.Issues
            .AsNoTracking()
            .Where(issue => userIds.Contains(issue.CreatedByUserId))
            .GroupBy(issue => issue.CreatedByUserId)
            .Select(grouped => new
            {
                UserId = grouped.Key,
                Count = grouped.Count()
            })
            .ToDictionaryAsync(item => item.UserId, item => item.Count, cancellationToken);
        var missionCounts = await dbContext.MissionParticipants
            .AsNoTracking()
            .Where(participant => userIds.Contains(participant.UserId))
            .GroupBy(participant => participant.UserId)
            .Select(grouped => new
            {
                UserId = grouped.Key,
                Count = grouped.Count()
            })
            .ToDictionaryAsync(item => item.UserId, item => item.Count, cancellationToken);
        var badges = await dbContext.UserBadges
            .AsNoTracking()
            .Include(userBadge => userBadge.Badge)
            .Where(userBadge => userIds.Contains(userBadge.UserId) && userBadge.Badge != null)
            .OrderByDescending(userBadge => userBadge.UnlockedAt)
            .ToListAsync(cancellationToken);
        var badgesByUserId = badges
            .GroupBy(userBadge => userBadge.UserId)
            .ToDictionary(
                grouped => grouped.Key,
                grouped => grouped
                    .Select(userBadge => new LeaderboardBadgeResponse(
                        userBadge.BadgeId,
                        userBadge.Badge!.Name,
                        userBadge.Badge.Description,
                        userBadge.Badge.Icon,
                        userBadge.UnlockedAt
                    ))
                    .ToList()
            );
        var rankedUsers = users
            .Select(user => new RankedUser(
                user.Id,
                user.FullName,
                user.AvatarUrl,
                user.Points,
                thirtyDayPoints.GetValueOrDefault(user.Id),
                user.Rank?.Name ?? "New Citizen",
                user.TrustScore,
                badgesByUserId.GetValueOrDefault(user.Id) ?? [],
                reportCounts.GetValueOrDefault(user.Id),
                missionCounts.GetValueOrDefault(user.Id)
            ))
            .Where(user => user.Points > 0 || user.ThirtyDayPoints > 0)
            .ToList();

        var overallRanks = rankedUsers
            .OrderByDescending(user => user.Points)
            .ThenByDescending(user => user.ThirtyDayPoints)
            .ThenBy(user => user.FullName)
            .Select((user, index) => new { user.Id, Rank = index + 1 })
            .ToDictionary(item => item.Id, item => item.Rank);
        var thirtyDayRanks = rankedUsers
            .OrderByDescending(user => user.ThirtyDayPoints)
            .ThenByDescending(user => user.Points)
            .ThenBy(user => user.FullName)
            .Select((user, index) => new { user.Id, Rank = index + 1 })
            .ToDictionary(item => item.Id, item => item.Rank);

        return rankedUsers
            .Select(user => user with
            {
                OverallRank = overallRanks[user.Id],
                ThirtyDayRank = thirtyDayRanks[user.Id]
            })
            .ToList();
    }

    private static LeaderboardUserResponse ToLeaderboardUser(
        RankedUser user,
        int rank,
        int periodPoints
    )
    {
        return new LeaderboardUserResponse(
            user.Id,
            rank,
            user.OverallRank,
            user.ThirtyDayRank,
            user.FullName,
            user.AvatarUrl,
            user.Points,
            periodPoints,
            user.RankName,
            user.TrustScore,
            user.Badges.Count,
            user.ReportCount,
            user.MissionCount,
            user.Badges.Take(3).ToList()
        );
    }

    private sealed record RankedUser(
        Guid Id,
        string FullName,
        string? AvatarUrl,
        int Points,
        int ThirtyDayPoints,
        string RankName,
        int TrustScore,
        IReadOnlyList<LeaderboardBadgeResponse> Badges,
        int ReportCount,
        int MissionCount
    )
    {
        public int OverallRank { get; init; }
        public int ThirtyDayRank { get; init; }
        public int BadgeCount => Badges.Count;
    }
}
