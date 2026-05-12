namespace CivicGo.Api.Rewards;

public sealed record RewardSummaryResponse(
    Guid Id,
    string Type,
    string Title,
    string? PartnerName,
    int RequiredPoints,
    string Status
);
