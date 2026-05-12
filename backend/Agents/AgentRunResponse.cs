namespace CivicGo.Api.Agents;

public sealed record AgentRunResponse(
    Guid Id,
    Guid IssueId,
    string Status,
    DateTimeOffset StartedAt,
    DateTimeOffset? CompletedAt,
    DateTimeOffset CreatedAt,
    IReadOnlyList<AgentStepResponse> Steps
);
