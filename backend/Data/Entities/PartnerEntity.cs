namespace CivicGo.Api.Data.Entities;

public sealed class PartnerEntity
{
    public Guid Id { get; set; }
    public required string Name { get; set; }
    public string? LogoUrl { get; set; }
    public required string Description { get; set; }
    public string? WebsiteUrl { get; set; }
    public string? ContactEmail { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
    public List<RewardEntity> Rewards { get; set; } = [];
}
