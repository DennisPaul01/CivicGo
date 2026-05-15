namespace CivicGo.Api.Agents;

public sealed record UpdateAdminAgentRequest(
    string Name,
    string Role,
    string Description,
    string Instructions,
    string Model,
    string FallbackMode,
    bool IsEnabled
);
