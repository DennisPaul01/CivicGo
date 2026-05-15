namespace CivicGo.Api.Duplicates;

public sealed record DuplicateDetectionResult(
    int DuplicateCount,
    NearestDuplicateIssueResponse? NearestDuplicate,
    DuplicateDetectionDiagnostics? Diagnostics = null
);

public sealed record DuplicateDetectionDiagnostics(
    int CandidateCount,
    int MatchCount,
    NearestDuplicateIssueResponse? NearestCandidate,
    int RadiusMeters,
    string MatchPolicy
);
