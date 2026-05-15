namespace CivicGo.Api.Agents;

public sealed record AdminAgentResponse(
    Guid Id,
    string Key,
    string Name,
    string Role,
    string Description,
    string Instructions,
    string Model,
    string FallbackMode,
    bool IsEnabled,
    int SortOrder,
    int TotalSteps,
    int CompletedSteps,
    int FallbackSteps,
    int FailedSteps,
    int SkippedSteps,
    DateTimeOffset? LastRunAt,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt
);
