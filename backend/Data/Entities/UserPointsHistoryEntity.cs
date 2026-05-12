namespace CivicGo.Api.Data.Entities;

public sealed class UserPointsHistoryEntity
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public UserEntity? User { get; set; }
    public int Points { get; set; }
    public required string Reason { get; set; }
    public required string SourceType { get; set; }
    public Guid? SourceId { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}
