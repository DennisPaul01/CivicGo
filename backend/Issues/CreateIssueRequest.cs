namespace CivicGo.Api.Issues;

public sealed class CreateIssueRequest
{
    public required IFormFile Image { get; init; }
    public string? Description { get; init; }
    public required double Latitude { get; init; }
    public required double Longitude { get; init; }
    public required string ZoneName { get; init; }
}
