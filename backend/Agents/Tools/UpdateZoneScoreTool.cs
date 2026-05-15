using CivicGo.Api.Agents.Runtime;
using CivicGo.Api.Data;
using CivicGo.Api.Live;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace CivicGo.Api.Agents.Tools;

public sealed class UpdateZoneScoreTool(
    CivicGoDbContext dbContext,
    IHubContext<CivicHub> civicHub,
    IssueEventStreamService eventStream
)
{
    public const string ToolName = "update_zone_score";

    public async Task<AgentToolResult> ExecuteAsync(
        Guid issueId,
        CancellationToken cancellationToken
    )
    {
        var issue = await dbContext.Issues
            .AsNoTracking()
            .Include(item => item.Zone)
            .FirstOrDefaultAsync(item => item.Id == issueId, cancellationToken);

        if (issue?.ZoneId is null)
        {
            return new AgentToolResult(ToolName, false, null, "Issue has no zone.");
        }

        var payload = new
        {
            issueId,
            zoneId = issue.ZoneId,
            zoneName = issue.Zone?.Name,
            score = issue.Zone?.Score
        };

        await civicHub.Clients.All.SendAsync(
            "ZoneScoreUpdated",
            payload,
            cancellationToken
        );
        await eventStream.PublishAsync(issueId, "zone.score.updated", payload, cancellationToken);

        return new AgentToolResult(ToolName, true, payload);
    }
}
