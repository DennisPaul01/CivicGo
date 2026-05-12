namespace CivicGo.Api.Data.Entities;

public sealed class IssueEntity
{
    public Guid Id { get; set; }
    public required string Title { get; set; }
    public string? Description { get; set; }
    public required string Category { get; set; }
    public required string Severity { get; set; }
    public required string Status { get; set; }
    public required string ResponsibleActor { get; set; }
    public required string ImageUrl { get; set; }
    public string? AfterImageUrl { get; set; }
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public string? LocationPoint { get; set; }
    public Guid? ZoneId { get; set; }
    public ZoneEntity? Zone { get; set; }
    public Guid CreatedByUserId { get; set; }
    public UserEntity? CreatedByUser { get; set; }
    public List<IssueAiAnalysisEntity> AiAnalyses { get; set; } = [];
    public List<AgentRunEntity> AgentRuns { get; set; } = [];
    public List<MissionIssueEntity> MissionIssues { get; set; } = [];
    public int ConfirmedCount { get; set; }
    public int DuplicateCount { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
    public DateTimeOffset? ResolvedAt { get; set; }
}
