using CivicGo.Api.Data.Entities;
using CivicGo.Api.Rewards;

namespace CivicGo.Api.Missions;

public static class MissionMapper
{
    public static MissionSummaryResponse ToSummary(MissionEntity mission)
    {
        return new MissionSummaryResponse(
            mission.Id,
            mission.Title,
            mission.Status,
            mission.ParticipantsNeeded,
            mission.Participants.Count(participant => participant.Status == "joined"),
            mission.ImpactPoints,
            RewardMapper.ToSummary(mission.Reward)
        );
    }

    public static MissionResponse ToResponse(MissionEntity mission)
    {
        return new MissionResponse(
            mission.Id,
            mission.Title,
            mission.Description,
            mission.Status,
            mission.ZoneId,
            mission.Zone?.Name,
            mission.Zone?.Latitude ?? 45.7489,
            mission.Zone?.Longitude ?? 21.2087,
            mission.CreatedFromIssueId,
            mission.StartsAt,
            mission.EndsAt,
            mission.ParticipantsNeeded,
            mission.Participants.Count(participant => participant.Status == "joined"),
            mission.ImpactPoints,
            mission.CreatedByAi,
            mission.CreatedAt,
            mission.CompletedAt,
            mission.MissionIssues
                .Select(missionIssue => missionIssue.IssueId)
                .Distinct()
                .ToArray(),
            RewardMapper.ToSummary(mission.Reward)
        );
    }
}
