namespace CivicGo.Api.Auth;

public sealed record LocalUserProfile(
    Guid Id,
    string SupabaseUserId,
    string Email,
    string FullName,
    string Role,
    int Points,
    string RankName,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt
);
