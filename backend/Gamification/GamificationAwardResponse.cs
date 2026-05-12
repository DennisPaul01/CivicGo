namespace CivicGo.Api.Gamification;

public sealed record GamificationAwardResponse(
    int PointsAwarded,
    int TotalPoints,
    RankProgressResponse CurrentRank,
    RankProgressResponse? NextRank,
    IReadOnlyList<BadgeResponse> UnlockedBadges,
    IReadOnlyList<PointAwardResponse> PointAwards
);
