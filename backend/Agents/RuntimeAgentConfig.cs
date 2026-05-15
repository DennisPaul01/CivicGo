namespace CivicGo.Api.Agents;

public sealed record RuntimeAgentConfig(
    string Key,
    string Name,
    string Instructions,
    string Model,
    string FallbackMode,
    bool IsEnabled
)
{
    public static RuntimeAgentConfig Default(
        string key,
        string name,
        string instructions = "",
        string model = "deterministic",
        string fallbackMode = "Built-in deterministic fallback."
    )
    {
        return new RuntimeAgentConfig(
            key,
            name,
            instructions,
            model,
            fallbackMode,
            true
        );
    }
}
