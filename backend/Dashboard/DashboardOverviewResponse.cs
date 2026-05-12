namespace CivicGo.Api.Dashboard;

public sealed record DashboardOverviewResponse(
    int TotalIssues,
    int NewIssues,
    int InProgressIssues,
    int ResolvedIssues,
    int ActiveMissions,
    int RewardsClaimed,
    IReadOnlyList<DashboardBreakdownItemResponse> IssuesByStatus,
    IReadOnlyList<DashboardBreakdownItemResponse> IssuesByCategory,
    DateTimeOffset GeneratedAt
);
