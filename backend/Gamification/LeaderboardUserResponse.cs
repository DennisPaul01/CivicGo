namespace CivicGo.Api.Gamification;

public sealed record LeaderboardUserResponse(
    Guid Id,
    int Rank,
    int OverallRank,
    int ThirtyDayRank,
    string FullName,
    string? AvatarUrl,
    int Points,
    int PeriodPoints,
    string RankName,
    int TrustScore,
    int BadgeCount,
    int ReportCount,
    int MissionCount,
    IReadOnlyList<LeaderboardBadgeResponse> Badges
);
