namespace CivicGo.Api.Data.Entities;

public sealed class UserBadgeEntity
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public UserEntity? User { get; set; }
    public Guid BadgeId { get; set; }
    public BadgeEntity? Badge { get; set; }
    public DateTimeOffset UnlockedAt { get; set; }
    public required string SourceEvent { get; set; }
    public Guid? SourceId { get; set; }
}
