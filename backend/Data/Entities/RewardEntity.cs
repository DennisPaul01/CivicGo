namespace CivicGo.Api.Data.Entities;

public sealed class RewardEntity
{
    public Guid Id { get; set; }
    public required string Type { get; set; }
    public Guid? PartnerId { get; set; }
    public PartnerEntity? Partner { get; set; }
    public required string Title { get; set; }
    public required string Description { get; set; }
    public int RequiredPoints { get; set; }
    public int Quantity { get; set; }
    public int ClaimedCount { get; set; }
    public DateTimeOffset? ExpiresAt { get; set; }
    public required string Status { get; set; }
    public Guid? MissionId { get; set; }
    public MissionEntity? Mission { get; set; }
    public Guid? ZoneId { get; set; }
    public ZoneEntity? Zone { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}
