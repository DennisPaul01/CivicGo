namespace CivicGo.Api.Data.Entities;

public sealed class PublicActivityFeedItemEntity
{
    public Guid Id { get; set; }
    public required string Type { get; set; }
    public required string Title { get; set; }
    public required string Message { get; set; }
    public Guid? RelatedIssueId { get; set; }
    public Guid? RelatedMissionId { get; set; }
    public Guid? RelatedRewardId { get; set; }
    public Guid? RelatedZoneId { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}
