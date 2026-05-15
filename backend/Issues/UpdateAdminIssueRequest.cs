namespace CivicGo.Api.Issues;

public sealed record UpdateAdminIssueRequest(
    string? Title,
    string? Description,
    string? Category,
    string? Severity,
    string? Status,
    string? ResponsibleActor,
    string? ZoneName,
    double? Latitude,
    double? Longitude
);
