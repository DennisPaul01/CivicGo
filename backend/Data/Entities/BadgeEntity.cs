namespace CivicGo.Api.Data.Entities;

public sealed class BadgeEntity
{
    public Guid Id { get; set; }
    public required string Name { get; set; }
    public required string Description { get; set; }
    public required string Icon { get; set; }
    public required string Category { get; set; }
    public required string RuleType { get; set; }
    public required string RuleValue { get; set; }
    public int PointsBonus { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}
