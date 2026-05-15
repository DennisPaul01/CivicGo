namespace CivicGo.Api.Data.Entities;

public sealed class AgentConfigEntity
{
    public Guid Id { get; set; }
    public required string Key { get; set; }
    public required string Name { get; set; }
    public required string Role { get; set; }
    public required string Description { get; set; }
    public required string Instructions { get; set; }
    public required string Model { get; set; }
    public required string FallbackMode { get; set; }
    public bool IsEnabled { get; set; }
    public int SortOrder { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}
