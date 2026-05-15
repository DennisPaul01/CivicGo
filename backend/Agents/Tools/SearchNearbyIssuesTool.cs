using CivicGo.Api.Agents.Runtime;
using CivicGo.Api.Duplicates;

namespace CivicGo.Api.Agents.Tools;

public sealed class SearchNearbyIssuesTool(DuplicateDetectionService duplicateDetectionService)
{
    public const string ToolName = "search_nearby_issues";

    public async Task<AgentToolResult> ExecuteAsync(
        Guid issueId,
        RuntimeAgentConfig agentConfig,
        CancellationToken cancellationToken
    )
    {
        var result = await duplicateDetectionService.CheckIssueAsync(
            issueId,
            agentConfig,
            cancellationToken
        );

        return new AgentToolResult(ToolName, true, result);
    }
}
