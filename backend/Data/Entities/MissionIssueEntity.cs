namespace CivicGo.Api.Data.Entities;

public sealed class MissionIssueEntity
{
    public Guid Id { get; set; }
    public Guid MissionId { get; set; }
    public MissionEntity? Mission { get; set; }
    public Guid IssueId { get; set; }
    public IssueEntity? Issue { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}
