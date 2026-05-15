using CivicGo.Api.Agents;
using CivicGo.Api.Duplicates;
using CivicGo.Api.Gamification;
using CivicGo.Api.Missions;
using CivicGo.Api.Rewards;

namespace CivicGo.Api.Issues;

public sealed record IssueResponse(
    Guid Id,
    string Title,
    string? Description,
    string Category,
    string Severity,
    string Status,
    string ResponsibleActor,
    string ImageUrl,
    IReadOnlyList<string> ImageUrls,
    string? AfterImageUrl,
    double Latitude,
    double Longitude,
    string? ZoneName,
    string? AiSummary,
    double? AiConfidence,
    bool IsUrgent,
    bool RewardEligible,
    bool IsValidIssue,
    string? InvalidReason,
    DateTimeOffset? AiAnalyzedAt,
    int DuplicateCount,
    NearestDuplicateIssueResponse? NearestDuplicate,
    AgentRunResponse? AgentRun,
    MissionSummaryResponse? RelatedMission,
    RewardSummaryResponse? RelatedReward,
    GamificationAwardResponse? Gamification,
    Guid CreatedByUserId,
    DateTimeOffset CreatedAt
);
