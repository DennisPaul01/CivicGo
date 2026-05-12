namespace CivicGo.Api.Data.Entities;

public sealed class ZoneEntity
{
    public Guid Id { get; set; }
    public required string Name { get; set; }
    public required string Description { get; set; }
    public int Score { get; set; }
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public string? PolygonGeoJson { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
    public List<ZoneScoreEntity> Scores { get; set; } = [];
}
