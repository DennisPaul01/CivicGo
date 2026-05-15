using CivicGo.Api.Agents.Runtime;
using CivicGo.Api.Rewards;

namespace CivicGo.Api.Agents.Tools;

public sealed class MatchRewardTool(RewardMatchingService rewardMatchingService)
{
    public const string ToolName = "match_reward";

    public async Task<AgentToolResult> ExecuteAsync(
        Guid missionId,
        RuntimeAgentConfig agentConfig,
        CancellationToken cancellationToken
    )
    {
        var reward = await rewardMatchingService.MatchRewardForMissionAsync(
            missionId,
            agentConfig,
            cancellationToken
        );

        return new AgentToolResult(
            ToolName,
            true,
            reward,
            reward is null ? "No reward candidate was available." : null
        );
    }
}
