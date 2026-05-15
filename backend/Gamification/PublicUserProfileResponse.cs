namespace CivicGo.Api.Gamification;

public sealed record PublicUserProfileResponse(
    Guid Id,
    string FullName,
    string? AvatarUrl,
    int Points,
    int ThirtyDayPoints,
    string RankName,
    int TrustScore,
    int BadgeCount,
    int ReportCount,
    int MissionCount,
    int OverallRank,
    int ThirtyDayRank,
    IReadOnlyList<LeaderboardBadgeResponse> Badges,
    IReadOnlyList<PublicContributionResponse> RecentContributions
);
