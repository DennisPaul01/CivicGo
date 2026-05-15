namespace CivicGo.Api.Agents.Runtime;

public sealed record AgentToolCall(
    string ToolName,
    string AgentName,
    object Input
);
