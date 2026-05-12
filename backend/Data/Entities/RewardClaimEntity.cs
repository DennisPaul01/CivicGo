namespace CivicGo.Api.Data.Entities;

public sealed class RewardClaimEntity
{
    public Guid Id { get; set; }
    public Guid RewardId { get; set; }
    public RewardEntity Reward { get; set; } = null!;
    public Guid UserId { get; set; }
    public UserEntity User { get; set; } = null!;
    public Guid? MissionId { get; set; }
    public MissionEntity? Mission { get; set; }
    public DateTimeOffset ClaimedAt { get; set; }
    public required string Status { get; set; }
    public required string Code { get; set; }
}
