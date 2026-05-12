namespace CivicGo.Api.Data.Entities;

public sealed class AgentRunEntity
{
    public Guid Id { get; set; }
    public Guid IssueId { get; set; }
    public IssueEntity? Issue { get; set; }
    public required string Status { get; set; }
    public DateTimeOffset StartedAt { get; set; }
    public DateTimeOffset? CompletedAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public List<AgentStepEntity> AgentSteps { get; set; } = [];
}
