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
            mission is null
                ? "Raportul nu necesita o actiune comunitara; poate fi rezolvat individual sau trimis catre autoritatea potrivita."
                : null
        );
    }
}
