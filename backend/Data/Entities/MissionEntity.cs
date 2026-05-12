namespace CivicGo.Api.Data.Entities;

public sealed class MissionEntity
{
    public Guid Id { get; set; }
    public required string Title { get; set; }
    public required string Description { get; set; }
    public Guid? ZoneId { get; set; }
    public ZoneEntity? Zone { get; set; }
    public required string Status { get; set; }
    public Guid? CreatedFromIssueId { get; set; }
    public IssueEntity? CreatedFromIssue { get; set; }
    public Guid? RewardId { get; set; }
    public RewardEntity? Reward { get; set; }
    public DateTimeOffset? StartsAt { get; set; }
    public DateTimeOffset? EndsAt { get; set; }
    public int ParticipantsNeeded { get; set; }
    public int ImpactPoints { get; set; }
    public bool CreatedByAi { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
    public DateTimeOffset? CompletedAt { get; set; }
    public List<MissionIssueEntity> MissionIssues { get; set; } = [];
    public List<MissionParticipantEntity> Participants { get; set; } = [];
}
