namespace CivicGo.Api.Data.Entities;

public sealed class AgentStepEntity
{
    public Guid Id { get; set; }
    public Guid AgentRunId { get; set; }
    public AgentRunEntity? AgentRun { get; set; }
    public required string AgentName { get; set; }
    public required string Status { get; set; }
    public required string InputJson { get; set; }
    public required string OutputJson { get; set; }
    public required string Message { get; set; }
    public DateTimeOffset? StartedAt { get; set; }
    public DateTimeOffset? CompletedAt { get; set; }
    public int Order { get; set; }
}
