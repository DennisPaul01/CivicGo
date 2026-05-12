namespace CivicGo.Api.Gamification;

public sealed record RankProgressResponse(
    Guid Id,
    string Name,
    int MinPoints,
    int MaxPoints,
    string Icon,
    string Description,
    int Order,
    int ProgressPercent,
    int PointsToNext
);
