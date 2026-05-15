using CivicGo.Api.Agents.Runtime;
using CivicGo.Api.Missions;

namespace CivicGo.Api.Agents.Tools;

public sealed class CreateMissionTool(MissionGenerationService missionGenerationService)
{
    public const string ToolName = "create_mission";

    public async Task<AgentToolResult> ExecuteAsync(
        Guid issueId,
        RuntimeAgentConfig agentConfig,
        CancellationToken cancellationToken
    )
    {
        var mission = await missionGenerationService.EnsureMissionForIssueAsync(
            issueId,
            agentConfig,
            cancellationToken
        );

        return new AgentToolResult(
            ToolName,
            true,
            mission,
            mission is null ? "Issue was not eligible for a community mission." : null
        );
    }
}
