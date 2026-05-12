namespace CivicGo.Api.Duplicates;

public sealed record DuplicateDetectionResult(
    int DuplicateCount,
    NearestDuplicateIssueResponse? NearestDuplicate
);
