using CivicGo.Api.Rewards;

namespace CivicGo.Api.Missions;

public sealed record MissionResponse(
    Guid Id,
    string Title,
    string Description,
    string Status,
    Guid? ZoneId,
    string? ZoneName,
    double Latitude,
    double Longitude,
    Guid? CreatedFromIssueId,
    DateTimeOffset? StartsAt,
    DateTimeOffset? EndsAt,
    int ParticipantsNeeded,
    int ParticipantsJoined,
    int ImpactPoints,
    bool CreatedByAi,
    DateTimeOffset CreatedAt,
    DateTimeOffset? CompletedAt,
    IReadOnlyList<Guid> RelatedIssueIds,
    RewardSummaryResponse? Reward
);
