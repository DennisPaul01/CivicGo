namespace CivicGo.Api.Gamification;

public sealed record BadgeResponse(
    Guid Id,
    string Name,
    string Description,
    string Icon
);
