namespace CivicGo.Api.Dashboard;

public sealed record DashboardAiSummaryResponse(
    string Headline,
    string Summary,
    string PriorityArea,
    string SuggestedAction,
    string ConfidenceLabel,
    bool IsFallback,
    DateTimeOffset GeneratedAt
);
