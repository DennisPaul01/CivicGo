using CivicGo.Api.Data.Entities;

namespace CivicGo.Api.Rewards;

public static class RewardMapper
{
    public static PartnerResponse? ToPartnerResponse(PartnerEntity? partner)
    {
        return partner is null
            ? null
            : new PartnerResponse(
                partner.Id,
                partner.Name,
                partner.LogoUrl,
                partner.Description,
                partner.WebsiteUrl
            );
    }

    public static RewardSummaryResponse? ToSummary(RewardEntity? reward)
    {
        return reward is null
            ? null
            : new RewardSummaryResponse(
                reward.Id,
                reward.Type,
                reward.Title,
                reward.Partner?.Name,
                reward.RequiredPoints,
                reward.Status
            );
    }

    public static RewardResponse ToResponse(RewardEntity reward)
    {
        return new RewardResponse(
            reward.Id,
            reward.Type,
            ToPartnerResponse(reward.Partner),
            reward.Title,
            reward.Description,
            reward.RequiredPoints,
            reward.Quantity,
            reward.ClaimedCount,
            reward.ExpiresAt,
            reward.Status,
            reward.MissionId,
            reward.ZoneId,
            reward.Zone?.Name,
            reward.CreatedAt
        );
    }

    public static RewardClaimResponse ToClaimResponse(RewardClaimEntity claim)
    {
        return new RewardClaimResponse(
            claim.Id,
            claim.RewardId,
            claim.Reward.Title,
            claim.Reward.Partner?.Name,
            claim.MissionId,
            claim.ClaimedAt,
            claim.Status,
            claim.Code
        );
    }
}
