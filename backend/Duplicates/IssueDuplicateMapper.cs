using System.Text.Json;
using CivicGo.Api.Data.Entities;

namespace CivicGo.Api.Duplicates;

public static class IssueDuplicateMapper
{
    public static NearestDuplicateIssueResponse? GetNearestDuplicate(IssueEntity issue)
    {
        var duplicateStep = issue.AgentRuns
            .OrderByDescending(run => run.CreatedAt)
            .SelectMany(run => run.AgentSteps)
            .Where(step => step.AgentName == "Duplicate Agent")
            .OrderByDescending(step => step.CompletedAt ?? step.StartedAt ?? DateTimeOffset.MinValue)
            .FirstOrDefault();

        if (duplicateStep is null || string.IsNullOrWhiteSpace(duplicateStep.OutputJson))
        {
            return null;
        }

        try
        {
            using var document = JsonDocument.Parse(duplicateStep.OutputJson);
            var root = document.RootElement;

            if (!root.TryGetProperty("nearestIssueId", out var idElement) ||
                idElement.ValueKind == JsonValueKind.Null ||
                !Guid.TryParse(idElement.GetString(), out var issueId))
            {
                return null;
            }

            var title = root.TryGetProperty("nearestTitle", out var titleElement) &&
                titleElement.ValueKind == JsonValueKind.String
                    ? titleElement.GetString() ?? "Nearby report"
                    : "Nearby report";
            var status = root.TryGetProperty("nearestStatus", out var statusElement) &&
                statusElement.ValueKind == JsonValueKind.String
                    ? statusElement.GetString() ?? "open"
                    : "open";
            var distanceMeters = root.TryGetProperty("nearestDistanceMeters", out var distanceElement) &&
                distanceElement.TryGetInt32(out var distance)
                    ? distance
                    : 0;

            return new NearestDuplicateIssueResponse(issueId, title, distanceMeters, status);
        }
        catch (JsonException)
        {
            return null;
        }
    }
}
