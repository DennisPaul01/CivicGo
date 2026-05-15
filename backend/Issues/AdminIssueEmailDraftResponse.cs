namespace CivicGo.Api.Issues;

public sealed record AdminIssueEmailDraftResponse(
    string AgentName,
    string RecipientName,
    string RecipientEmail,
    string Subject,
    string Body,
    string ImageUrl,
    string SeverityRationale,
    DateTimeOffset GeneratedAt
);
