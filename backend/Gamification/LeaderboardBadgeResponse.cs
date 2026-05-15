namespace CivicGo.Api.Gamification;

public sealed record LeaderboardBadgeResponse(
    Guid Id,
    string Name,
    string Description,
    string Icon,
    DateTimeOffset UnlockedAt
);
