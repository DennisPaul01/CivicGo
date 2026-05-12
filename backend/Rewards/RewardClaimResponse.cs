namespace CivicGo.Api.Rewards;

public sealed record RewardClaimResponse(
    Guid Id,
    Guid RewardId,
    string RewardTitle,
    string? PartnerName,
    Guid? MissionId,
    DateTimeOffset ClaimedAt,
    string Status,
    string Code
);
