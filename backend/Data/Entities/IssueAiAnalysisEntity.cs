namespace CivicGo.Api.Data.Entities;

public sealed class IssueAiAnalysisEntity
{
    public Guid Id { get; set; }
    public Guid IssueId { get; set; }
    public IssueEntity? Issue { get; set; }
    public required string Category { get; set; }
    public required string Severity { get; set; }
    public required string Summary { get; set; }
    public required string ResponsibleActor { get; set; }
    public required string SuggestedAction { get; set; }
    public double Confidence { get; set; }
    public bool IsUrgent { get; set; }
    public bool RewardEligible { get; set; }
    public required string RawResponseJson { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}
