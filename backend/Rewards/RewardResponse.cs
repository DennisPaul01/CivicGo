namespace CivicGo.Api.Rewards;

public sealed record RewardResponse(
    Guid Id,
    string Type,
    PartnerResponse? Partner,
    string Title,
    string Description,
    int RequiredPoints,
    int Quantity,
    int ClaimedCount,
    DateTimeOffset? ExpiresAt,
    string Status,
    Guid? MissionId,
    Guid? ZoneId,
    string? ZoneName,
    DateTimeOffset CreatedAt
);
