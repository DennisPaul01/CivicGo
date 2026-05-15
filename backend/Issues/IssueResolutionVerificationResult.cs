namespace CivicGo.Api.Issues;

public sealed record IssueResolutionVerificationResult(
    bool IsResolved,
    double Confidence,
    string Summary,
    string SuggestedAction,
    bool UsedFallback,
    string Source,
    string RawResponseJson
);
