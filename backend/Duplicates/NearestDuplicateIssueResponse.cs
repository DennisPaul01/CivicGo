namespace CivicGo.Api.Duplicates;

public sealed record NearestDuplicateIssueResponse(
    Guid IssueId,
    string Title,
    int DistanceMeters,
    string Status
);
