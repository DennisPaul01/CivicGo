namespace CivicGo.Api.Agents.Runtime;

public sealed record AgentDecision(
    string Observation,
    string ToolUsed,
    string Decision,
    string NextAction,
    double? Confidence,
    bool ShouldContinue,
    object? ToolResult = null
);
