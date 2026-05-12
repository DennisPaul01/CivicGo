using CivicGo.Api.Rewards;

namespace CivicGo.Api.Missions;

public sealed record MissionSummaryResponse(
    Guid Id,
    string Title,
    string Status,
    int ParticipantsNeeded,
    int ParticipantsJoined,
    int ImpactPoints,
    RewardSummaryResponse? Reward
);
