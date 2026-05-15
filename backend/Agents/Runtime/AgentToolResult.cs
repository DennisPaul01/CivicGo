namespace CivicGo.Api.Agents.Runtime;

public sealed record AgentToolResult(
    string ToolName,
    bool Succeeded,
    object? Data,
    string? Message = null
);
