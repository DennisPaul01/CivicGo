namespace CivicGo.Api.Ai;

public sealed record IssueAiAnalysisResponse(
    Guid Id,
    Guid IssueId,
    string Category,
    string Severity,
    string Summary,
    string ResponsibleActor,
    string SuggestedAction,
    double Confidence,
    bool IsUrgent,
    bool RewardEligible,
    DateTimeOffset CreatedAt
);
