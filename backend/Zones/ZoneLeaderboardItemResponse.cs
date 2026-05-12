namespace CivicGo.Api.Zones;

public sealed record ZoneLeaderboardItemResponse(
    Guid Id,
    int Rank,
    string Name,
    string Description,
    int Score,
    int ScoreDelta,
    int CleanlinessScore,
    int CommunityScore,
    int SafetyScore,
    int EngagementScore,
    double Latitude,
    double Longitude,
    int OpenIssues,
    int ResolvedIssues,
    int ActiveMissions,
    DateTimeOffset UpdatedAt,
    DateTimeOffset? CalculatedAt
);
