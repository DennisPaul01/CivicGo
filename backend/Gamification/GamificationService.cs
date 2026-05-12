using CivicGo.Api.Data;
using CivicGo.Api.Data.Entities;
using Microsoft.EntityFrameworkCore;

namespace CivicGo.Api.Gamification;

public sealed class GamificationService(CivicGoDbContext dbContext)
{
    private const int ValidReportPoints = 20;
    private const int AiAcceptedReportPoints = 10;

    public async Task<GamificationAwardResponse> ApplyReportRewardsAsync(
        Guid issueId,
        CancellationToken cancellationToken
    )
    {
        var issue = await dbContext.Issues
            .Include(item => item.CreatedByUser)
            .Include(item => item.AiAnalyses)
            .FirstOrDefaultAsync(item => item.Id == issueId, cancellationToken);

        if (issue is null)
        {
            throw new KeyNotFoundException($"Issue {issueId} was not found.");
        }

        var user = issue.CreatedByUser ??
            await dbContext.Users.FirstAsync(
                item => item.Id == issue.CreatedByUserId,
                cancellationToken
            );
        var pointAwards = new List<PointAwardResponse>();
        var unlockedBadges = new List<BadgeResponse>();
        var now = DateTimeOffset.UtcNow;

        if (await TryAddPointsAsync(
            user,
            ValidReportPoints,
            "Valid report",
            "valid_report",
            issue.Id,
            now,
            cancellationToken
        ))
        {
            pointAwards.Add(new PointAwardResponse(
                ValidReportPoints,
                "Valid report",
                "valid_report"
            ));
        }

        if (issue.AiAnalyses.Count > 0 &&
            await TryAddPointsAsync(
                user,
                AiAcceptedReportPoints,
                "AI accepted report",
                "ai_accepted_report",
                issue.Id,
                now,
                cancellationToken
            ))
        {
            pointAwards.Add(new PointAwardResponse(
                AiAcceptedReportPoints,
                "AI accepted report",
                "ai_accepted_report"
            ));
        }

        var firstReporterBadge = await TryUnlockFirstReporterAsync(
            user.Id,
            issue.Id,
            now,
            cancellationToken
        );

        if (firstReporterBadge is not null)
        {
            unlockedBadges.Add(firstReporterBadge);
        }

        var ranks = await dbContext.Ranks
            .OrderBy(rank => rank.MinPoints)
            .ToListAsync(cancellationToken);
        var currentRank = ResolveRank(ranks, user.Points);

        if (currentRank is not null && user.RankId != currentRank.Id)
        {
            user.RankId = currentRank.Id;
            user.UpdatedAt = now;
        }

        await dbContext.SaveChangesAsync(cancellationToken);

        currentRank ??= await EnsureFallbackRankAsync(cancellationToken);
        var nextRank = ranks
            .Where(rank => rank.MinPoints > user.Points)
            .OrderBy(rank => rank.MinPoints)
            .FirstOrDefault();

        return new GamificationAwardResponse(
            pointAwards.Sum(award => award.Points),
            user.Points,
            ToRankProgress(currentRank, nextRank, user.Points),
            nextRank is null ? null : ToRankProgress(nextRank, null, user.Points),
            unlockedBadges,
            pointAwards
        );
    }

    private async Task<bool> TryAddPointsAsync(
        UserEntity user,
        int points,
        string reason,
        string sourceType,
        Guid sourceId,
        DateTimeOffset now,
        CancellationToken cancellationToken
    )
    {
        var alreadyAwarded = await dbContext.UserPointsHistory.AnyAsync(
            history =>
                history.UserId == user.Id &&
                history.SourceType == sourceType &&
                history.SourceId == sourceId,
            cancellationToken
        );

        if (alreadyAwarded)
        {
            return false;
        }

        user.Points += points;
        user.UpdatedAt = now;
        dbContext.UserPointsHistory.Add(new UserPointsHistoryEntity
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            Points = points,
            Reason = reason,
            SourceType = sourceType,
            SourceId = sourceId,
            CreatedAt = now
        });

        return true;
    }

    private async Task<BadgeResponse?> TryUnlockFirstReporterAsync(
        Guid userId,
        Guid issueId,
        DateTimeOffset now,
        CancellationToken cancellationToken
    )
    {
        var badge = await dbContext.Badges
            .FirstOrDefaultAsync(item => item.Name == "First Reporter", cancellationToken);

        if (badge is null)
        {
            return null;
        }

        var alreadyUnlocked = await dbContext.UserBadges.AnyAsync(
            item => item.UserId == userId && item.BadgeId == badge.Id,
            cancellationToken
        );

        if (alreadyUnlocked)
        {
            return null;
        }

        var validReportCount = await dbContext.UserPointsHistory.CountAsync(
            item => item.UserId == userId && item.SourceType == "valid_report",
            cancellationToken
        );
        var pendingValidReportCount = dbContext.UserPointsHistory.Local.Count(
            item => item.UserId == userId && item.SourceType == "valid_report"
        );

        if (validReportCount + pendingValidReportCount == 0)
        {
            return null;
        }

        dbContext.UserBadges.Add(new UserBadgeEntity
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            BadgeId = badge.Id,
            UnlockedAt = now,
            SourceEvent = "valid_report",
            SourceId = issueId
        });

        return ToBadgeResponse(badge);
    }

    private static RankEntity? ResolveRank(IReadOnlyList<RankEntity> ranks, int points)
    {
        return ranks
            .Where(rank => points >= rank.MinPoints)
            .OrderByDescending(rank => rank.MinPoints)
            .FirstOrDefault();
    }

    private async Task<RankEntity> EnsureFallbackRankAsync(CancellationToken cancellationToken)
    {
        var fallbackRank = await dbContext.Ranks
            .OrderBy(rank => rank.MinPoints)
            .FirstOrDefaultAsync(cancellationToken);

        if (fallbackRank is not null)
        {
            return fallbackRank;
        }

        fallbackRank = new RankEntity
        {
            Id = Guid.NewGuid(),
            Name = "New Citizen",
            MinPoints = 0,
            MaxPoints = 99,
            Icon = "leaf",
            Description = "Fresh civic profile, ready for the first city action.",
            Order = 1
        };
        dbContext.Ranks.Add(fallbackRank);
        await dbContext.SaveChangesAsync(cancellationToken);

        return fallbackRank;
    }

    private static RankProgressResponse ToRankProgress(
        RankEntity rank,
        RankEntity? nextRank,
        int totalPoints
    )
    {
        var pointsToNext = nextRank is null ? 0 : Math.Max(0, nextRank.MinPoints - totalPoints);
        var progressPercent = nextRank is null
            ? 100
            : (int)Math.Clamp(
                Math.Round(
                    (double)(totalPoints - rank.MinPoints) /
                    Math.Max(1, nextRank.MinPoints - rank.MinPoints) *
                    100
                ),
                0,
                100
            );

        return new RankProgressResponse(
            rank.Id,
            rank.Name,
            rank.MinPoints,
            rank.MaxPoints,
            rank.Icon,
            rank.Description,
            rank.Order,
            progressPercent,
            pointsToNext
        );
    }

    private static BadgeResponse ToBadgeResponse(BadgeEntity badge)
    {
        return new BadgeResponse(
            badge.Id,
            badge.Name,
            badge.Description,
            badge.Icon
        );
    }
}
