namespace CivicGo.Api.Agents;

public sealed record AgentStepResponse(
    Guid Id,
    Guid AgentRunId,
    string AgentName,
    string Status,
    string Message,
    string InputJson,
    string OutputJson,
    DateTimeOffset? StartedAt,
    DateTimeOffset? CompletedAt,
    int Order
);
