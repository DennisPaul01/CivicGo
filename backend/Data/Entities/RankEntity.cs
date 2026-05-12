namespace CivicGo.Api.Data.Entities;

public sealed class RankEntity
{
    public Guid Id { get; set; }
    public required string Name { get; set; }
    public int MinPoints { get; set; }
    public int MaxPoints { get; set; }
    public required string Icon { get; set; }
    public required string Description { get; set; }
    public int Order { get; set; }
}
