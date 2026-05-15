using CivicGo.Api.Ai;
using CivicGo.Api.Duplicates;
using CivicGo.Api.Gamification;
using CivicGo.Api.Missions;
using CivicGo.Api.Rewards;

namespace CivicGo.Api.Agents.Runtime;

public sealed class AgentWorkContext(Guid issueId)
{
    public Guid IssueId { get; } = issueId;
    public IssueAiAnalysisResponse? Analysis { get; set; }
    public DuplicateDetectionResult? DuplicateResult { get; set; }
    public MissionResponse? Mission { get; set; }
    public RewardSummaryResponse? Reward { get; set; }
    public GamificationAwardResponse? Gamification { get; set; }
    public string NextAction { get; set; } = "Run Vision Agent";
    public bool IsEscalationPath { get; set; }
    public bool IsDuplicatePath { get; set; }
}
