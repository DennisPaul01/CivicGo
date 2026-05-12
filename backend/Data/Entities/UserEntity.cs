namespace CivicGo.Api.Data.Entities;

public sealed class UserEntity
{
    public Guid Id { get; set; }
    public required string SupabaseUserId { get; set; }
    public required string Email { get; set; }
    public required string FullName { get; set; }
    public string? AvatarUrl { get; set; }
    public required string Role { get; set; }
    public int Points { get; set; }
    public Guid? RankId { get; set; }
    public RankEntity? Rank { get; set; }
    public int TrustScore { get; set; }
    public Guid? FavoriteZoneId { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}
