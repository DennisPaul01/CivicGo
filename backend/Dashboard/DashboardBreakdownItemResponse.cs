namespace CivicGo.Api.Dashboard;

public sealed record DashboardBreakdownItemResponse(
    string Key,
    string Label,
    int Count
);
