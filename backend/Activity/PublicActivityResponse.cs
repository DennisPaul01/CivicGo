namespace CivicGo.Api.Activity;

public sealed record PublicActivityResponse(
    Guid Id,
    string Type,
    string Title,
    string Message,
    Guid? RelatedIssueId,
    Guid? RelatedMissionId,
    Guid? RelatedRewardId,
    Guid? RelatedZoneId,
    DateTimeOffset CreatedAt
);
