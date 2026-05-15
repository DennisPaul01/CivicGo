using CivicGo.Api.Gamification;

namespace CivicGo.Api.Issues;

public sealed record ResolveIssueResponse(
    bool Verified,
    string Message,
    IssueResponse Issue,
    IssueResolutionVerificationResponse Verification,
    GamificationAwardResponse? Gamification
);

public sealed record IssueResolutionVerificationResponse(
    bool IsResolved,
    double Confidence,
    string Summary,
    string SuggestedAction,
    bool UsedFallback,
    string Source
);
