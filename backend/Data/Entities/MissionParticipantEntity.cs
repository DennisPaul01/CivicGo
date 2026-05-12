namespace CivicGo.Api.Data.Entities;

public sealed class MissionParticipantEntity
{
    public Guid Id { get; set; }
    public Guid MissionId { get; set; }
    public MissionEntity? Mission { get; set; }
    public Guid UserId { get; set; }
    public UserEntity? User { get; set; }
    public DateTimeOffset JoinedAt { get; set; }
    public required string Status { get; set; }
    public int PointsEarned { get; set; }
}
