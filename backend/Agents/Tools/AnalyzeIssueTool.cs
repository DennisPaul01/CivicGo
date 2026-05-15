using CivicGo.Api.Agents.Runtime;
using CivicGo.Api.Ai;

namespace CivicGo.Api.Agents.Tools;

public sealed class AnalyzeIssueTool(IssueAiAnalysisService analysisService)
{
    public const string ToolName = "analyze_issue";

    public async Task<AgentToolResult> ExecuteAsync(
        Guid issueId,
        IReadOnlyDictionary<string, RuntimeAgentConfig> agentConfigs,
        CancellationToken cancellationToken
    )
    {
        var analysis = await analysisService.AnalyzeIssueAsync(
            issueId,
            agentConfigs,
            cancellationToken
        );

        return new AgentToolResult(ToolName, true, analysis);
    }
}
