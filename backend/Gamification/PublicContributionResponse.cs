namespace CivicGo.Api.Gamification;

public sealed record PublicContributionResponse(
    string Type,
    string Title,
    string Detail,
    DateTimeOffset CreatedAt
);
