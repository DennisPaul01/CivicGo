namespace CivicGo.Api.Data.Entities;

public sealed class IssueImageEntity
{
    public Guid Id { get; set; }
    public Guid IssueId { get; set; }
    public IssueEntity? Issue { get; set; }
    public required string Url { get; set; }
    public required string ContentHash { get; set; }
    public string? FileName { get; set; }
    public string? ContentType { get; set; }
    public int SortOrder { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}
