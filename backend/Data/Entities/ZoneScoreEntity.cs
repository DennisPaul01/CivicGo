namespace CivicGo.Api.Data.Entities;

public sealed class ZoneScoreEntity
{
    public Guid Id { get; set; }
    public Guid ZoneId { get; set; }
    public ZoneEntity? Zone { get; set; }
    public int CleanlinessScore { get; set; }
    public int CommunityScore { get; set; }
    public int SafetyScore { get; set; }
    public int EngagementScore { get; set; }
    public int TotalScore { get; set; }
    public DateTimeOffset CalculatedAt { get; set; }
}
