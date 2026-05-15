namespace CivicGo.Api.Zones;

public sealed record ZoneIssueSummaryResponse(
    Guid Id,
    string Title,
    string Category,
    string Severity,
    string Status,
    string ResponsibleActor,
    string ImageUrl,
    int DuplicateCount,
    DateTimeOffset CreatedAt
);
