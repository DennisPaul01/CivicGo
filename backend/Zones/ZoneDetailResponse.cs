using CivicGo.Api.Missions;

namespace CivicGo.Api.Zones;

public sealed record ZoneDetailResponse(
    ZoneLeaderboardItemResponse Zone,
    IReadOnlyList<ZoneIssueSummaryResponse> Issues,
    IReadOnlyList<MissionSummaryResponse> Missions
);
