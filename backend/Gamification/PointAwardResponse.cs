namespace CivicGo.Api.Gamification;

public sealed record PointAwardResponse(
    int Points,
    string Reason,
    string SourceType
);
