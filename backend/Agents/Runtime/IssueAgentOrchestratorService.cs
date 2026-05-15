using CivicGo.Api.Agents.Tools;
using CivicGo.Api.Ai;
using CivicGo.Api.Data;
using CivicGo.Api.Data.Entities;
using CivicGo.Api.Duplicates;
using CivicGo.Api.Gamification;
using CivicGo.Api.Missions;
using CivicGo.Api.Rewards;
using Microsoft.EntityFrameworkCore;

namespace CivicGo.Api.Agents.Runtime;

public sealed class IssueAgentOrchestratorService(
    IServiceScopeFactory scopeFactory,
    ILogger<IssueAgentOrchestratorService> logger
)
{
    public void Enqueue(Guid issueId)
    {
        _ = Task.Run(() => RunAsync(issueId, CancellationToken.None));
    }

    private async Task RunAsync(Guid issueId, CancellationToken cancellationToken)
    {
        var currentAgentName = "Agent Pipeline";
        var currentPhase = "starting";

        try
        {
            using var scope = scopeFactory.CreateScope();
            var writer = scope.ServiceProvider.GetRequiredService<IssueAgentStepWriter>();
            var analyzeIssueTool = scope.ServiceProvider.GetRequiredService<AnalyzeIssueTool>();
            var searchNearbyIssuesTool = scope.ServiceProvider.GetRequiredService<SearchNearbyIssuesTool>();
            var createMissionTool = scope.ServiceProvider.GetRequiredService<CreateMissionTool>();
            var matchRewardTool = scope.ServiceProvider.GetRequiredService<MatchRewardTool>();
            var updateZoneScoreTool = scope.ServiceProvider.GetRequiredService<UpdateZoneScoreTool>();
            var gamificationService = scope.ServiceProvider.GetRequiredService<GamificationService>();
            var context = new AgentWorkContext(issueId);
            var agentConfigs = await writer.LoadAgentConfigsAsync(cancellationToken);

            currentPhase = "publish_issue_created";
            await writer.PublishIssueCreatedAsync(issueId, cancellationToken);

            var visionAgent = IssueAgentStepWriter.GetAgentConfig(
                agentConfigs,
                "vision",
                "Vision Agent"
            );
            var triageAgent = IssueAgentStepWriter.GetAgentConfig(
                agentConfigs,
                "triage",
                "Triage Agent"
            );

            currentAgentName = "Vision Agent";
            currentPhase = "start_step";
            await writer.StartStepAsync(issueId, "Vision Agent", null, cancellationToken);
            currentPhase = "execute";
            var analysisToolResult = await analyzeIssueTool.ExecuteAsync(
                issueId,
                agentConfigs,
                cancellationToken
            );
            context.Analysis = (IssueAiAnalysisResponse)analysisToolResult.Data!;
            context.NextAction = "Run Triage Agent";
            currentPhase = "complete_step";
            await writer.CompleteStepAsync(
                issueId,
                "Vision Agent",
                CreateVisionDecision(context.Analysis, analysisToolResult),
                new
                {
                    issueId,
                    tool = AnalyzeIssueTool.ToolName,
                    visionAgent.Model,
                    visionAgent.Instructions,
                    visionAgent.FallbackMode,
                    visionAgent.IsEnabled
                },
                null,
                context.Analysis.IsUrgent
                    ? "A identificat problema si a marcat semnalul ca urgent."
                    : !context.Analysis.IsValidIssue
                    ? "Nu a confirmat o problema civica reala in fotografie."
                    : "A identificat problema din fotografie si descriere.",
                cancellationToken
            );

            if (!context.Analysis.IsValidIssue)
            {
                await writer.PublishIssueAnalyzedAsync(
                    issueId,
                    new
                    {
                        issueId,
                        context.Analysis.Category,
                        context.Analysis.Severity,
                        context.Analysis.Summary,
                        context.Analysis.Confidence,
                        context.Analysis.IsUrgent,
                        context.Analysis.IsValidIssue,
                        context.Analysis.InvalidReason,
                        context.Analysis.ResponsibleActor,
                        context.Analysis.RewardEligible,
                        context.Analysis.SuggestedAction,
                        status = "rejected",
                        context.Analysis.CreatedAt
                    },
                    cancellationToken
                );
                await writer.PublishEventAsync(
                    issueId,
                    "IssueStatusChanged",
                    "issue.status.changed",
                    new
                    {
                        issueId,
                        status = "rejected",
                        context.Analysis.InvalidReason
                    },
                    cancellationToken
                );
                await SkipRemainingForInvalidIssueAsync(
                    writer,
                    agentConfigs,
                    issueId,
                    context.Analysis.InvalidReason,
                    cancellationToken
                );

                return;
            }

            currentAgentName = "Triage Agent";
            currentPhase = "start_step";
            await writer.StartStepAsync(issueId, "Triage Agent", "Vision Agent", cancellationToken);
            var triageDecision = CreateTriageDecision(context.Analysis);
            context.IsEscalationPath =
                context.Analysis.IsUrgent ||
                context.Analysis.Severity.Equals("critical", StringComparison.OrdinalIgnoreCase) ||
                context.Analysis.ResponsibleActor.Equals("emergency", StringComparison.OrdinalIgnoreCase);
            context.NextAction = context.IsEscalationPath
                ? "Escalate the report and skip community mission generation."
                : "Run Duplicate Agent";
            currentPhase = "complete_step";
            await writer.CompleteStepAsync(
                issueId,
                "Triage Agent",
                triageDecision,
                new
                {
                    issueId,
                    tool = "choose_responsible_actor",
                    context.Analysis.Category,
                    context.Analysis.Severity,
                    context.Analysis.IsUrgent,
                    triageAgent.Model,
                    triageAgent.Instructions,
                    triageAgent.FallbackMode,
                    triageAgent.IsEnabled
                },
                null,
                context.IsEscalationPath
                    ? "A directionat cazul catre escaladare rapida."
                    : $"A directionat cazul catre {context.Analysis.ResponsibleActor}.",
                cancellationToken
            );

            await writer.PublishIssueAnalyzedAsync(
                issueId,
                new
                {
                    issueId,
                    context.Analysis.Category,
                    context.Analysis.Severity,
                    context.Analysis.Summary,
                    context.Analysis.Confidence,
                    context.Analysis.IsUrgent,
                    context.Analysis.IsValidIssue,
                    context.Analysis.ResponsibleActor,
                    context.Analysis.RewardEligible,
                    context.Analysis.SuggestedAction,
                    context.Analysis.CreatedAt
                },
                cancellationToken
            );

            if (context.IsEscalationPath)
            {
                await SkipDuplicateMissionRewardForEscalationAsync(
                    writer,
                    agentConfigs,
                    issueId,
                    cancellationToken
                );
            }
            else
            {
                currentAgentName = "Duplicate/Mission/Reward Agents";
                currentPhase = "run_downstream_agents";
                await RunDuplicateMissionRewardPathAsync(
                    writer,
                    searchNearbyIssuesTool,
                    createMissionTool,
                    matchRewardTool,
                    agentConfigs,
                    context,
                    cancellationToken
                );
            }

            currentAgentName = "Gamification";
            currentPhase = "apply_report_rewards";
            context.Gamification = await gamificationService.ApplyReportRewardsAsync(
                issueId,
                cancellationToken
            );
            currentPhase = "publish_gamification_events";
            await PublishGamificationEventsAsync(writer, context, cancellationToken);

            currentAgentName = "City Agent";
            currentPhase = "run_city_agent";
            await RunCityAgentAsync(
                writer,
                updateZoneScoreTool,
                agentConfigs,
                context,
                cancellationToken
            );
        }
        catch (Exception exception)
        {
            logger.LogError(exception, "Issue agent runtime failed for issue {IssueId}.", issueId);

            using var scope = scopeFactory.CreateScope();
            var writer = scope.ServiceProvider.GetRequiredService<IssueAgentStepWriter>();
            var failedPayload = new
            {
                issueId,
                agentName = currentAgentName,
                phase = currentPhase,
                exceptionType = exception.GetType().Name,
                message = "Agent runtime failed before finishing."
            };

            await writer.PublishEventAsync(
                issueId,
                "AgentPipelineFailed",
                "agent.pipeline.failed",
                failedPayload,
                CancellationToken.None
            );
        }
    }

    private async Task RunDuplicateMissionRewardPathAsync(
        IssueAgentStepWriter writer,
        SearchNearbyIssuesTool searchNearbyIssuesTool,
        CreateMissionTool createMissionTool,
        MatchRewardTool matchRewardTool,
        IReadOnlyDictionary<string, RuntimeAgentConfig> agentConfigs,
        AgentWorkContext context,
        CancellationToken cancellationToken
    )
    {
        var duplicateAgent = IssueAgentStepWriter.GetAgentConfig(
            agentConfigs,
            "duplicate",
            "Duplicate Agent"
        );
        await writer.StartStepAsync(
            context.IssueId,
            "Duplicate Agent",
            "Triage Agent",
            cancellationToken
        );

        if (!duplicateAgent.IsEnabled)
        {
            await writer.SkipStepAsync(
                context.IssueId,
                duplicateAgent,
                "Duplicate Agent",
                "Duplicate Agent este oprit din configuratia admin.",
                "Continue to mission eligibility.",
                "Triage Agent",
                cancellationToken
            );
        }
        else
        {
            var duplicateToolResult = await searchNearbyIssuesTool.ExecuteAsync(
                context.IssueId,
                duplicateAgent,
                cancellationToken
            );
            context.DuplicateResult = (DuplicateDetectionResult)duplicateToolResult.Data!;
            context.IsDuplicatePath = context.DuplicateResult.NearestDuplicate is not null;
            await writer.CompleteStepAsync(
                context.IssueId,
                "Duplicate Agent",
                CreateDuplicateDecision(context.DuplicateResult, duplicateToolResult),
                new
                {
                    context.IssueId,
                    tool = SearchNearbyIssuesTool.ToolName,
                    duplicateAgent.Model,
                    duplicateAgent.Instructions,
                    duplicateAgent.FallbackMode,
                    duplicateAgent.IsEnabled
                },
                duplicateToolResult.Succeeded ? null : "fallback",
                !duplicateToolResult.Succeeded
                    ? "Verificarea duplicatelor a folosit fallback si continua fara blocaj."
                    : context.IsDuplicatePath
                    ? "A detectat un posibil duplicat in apropiere."
                    : "A verificat rapoartele din apropiere: nu a gasit duplicat.",
                cancellationToken
            );

            if (context.IsDuplicatePath)
            {
                await writer.PublishEventAsync(
                    context.IssueId,
                    "DuplicateDetected",
                    "duplicate.detected",
                    new
                    {
                        issueId = context.IssueId,
                        context.DuplicateResult.DuplicateCount,
                        context.DuplicateResult.NearestDuplicate
                    },
                    cancellationToken
                );
                await PersistDuplicateSignalAsync(
                    context.IssueId,
                    context.DuplicateResult,
                    cancellationToken
                );
            }
        }

        await RunMissionAndRewardAsync(
            writer,
            createMissionTool,
            matchRewardTool,
            agentConfigs,
            context,
            cancellationToken
        );
    }

    private async Task PersistDuplicateSignalAsync(
        Guid issueId,
        DuplicateDetectionResult result,
        CancellationToken cancellationToken
    )
    {
        if (result.DuplicateCount <= 0 && result.NearestDuplicate is null)
        {
            return;
        }

        try
        {
            using var scope = scopeFactory.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<CivicGoDbContext>();
            var issue = await dbContext.Issues
                .AsNoTracking()
                .Include(item => item.Zone)
                .FirstOrDefaultAsync(item => item.Id == issueId, cancellationToken);

            if (issue is null)
            {
                return;
            }

            var now = DateTimeOffset.UtcNow;
            await dbContext.Issues
                .Where(item => item.Id == issueId)
                .ExecuteUpdateAsync(
                    setters => setters
                        .SetProperty(
                            item => item.DuplicateCount,
                            item => item.DuplicateCount < result.DuplicateCount
                                ? result.DuplicateCount
                                : item.DuplicateCount
                        )
                        .SetProperty(item => item.UpdatedAt, now),
                    cancellationToken
                );

            var existingFeedItem = await dbContext.PublicActivityFeedItems.AnyAsync(
                item => item.Type == "duplicate_detected" && item.RelatedIssueId == issueId,
                cancellationToken
            );

            if (!existingFeedItem)
            {
                dbContext.PublicActivityFeedItems.Add(new PublicActivityFeedItemEntity
                {
                    Id = Guid.NewGuid(),
                    Type = "duplicate_detected",
                    Title = "Posibil duplicat detectat",
                    Message = result.NearestDuplicate is null
                        ? $"AI a gasit semnale apropiate pentru raportul din {issue.Zone?.Name ?? "Timisoara"}."
                        : $"AI a gasit un raport apropiat la {result.NearestDuplicate.DistanceMeters}m in {issue.Zone?.Name ?? "Timisoara"}.",
                    RelatedIssueId = issue.Id,
                    RelatedZoneId = issue.ZoneId,
                    CreatedAt = now
                });

                await dbContext.SaveChangesAsync(cancellationToken);
            }
        }
        catch (Exception exception)
        {
            logger.LogWarning(
                exception,
                "Duplicate signal persistence failed for issue {IssueId}. Continuing agent runtime.",
                issueId
            );
        }
    }

    private static async Task RunMissionAndRewardAsync(
        IssueAgentStepWriter writer,
        CreateMissionTool createMissionTool,
        MatchRewardTool matchRewardTool,
        IReadOnlyDictionary<string, RuntimeAgentConfig> agentConfigs,
        AgentWorkContext context,
        CancellationToken cancellationToken
    )
    {
        var missionAgent = IssueAgentStepWriter.GetAgentConfig(
            agentConfigs,
            "mission",
            "Mission Agent"
        );
        await writer.StartStepAsync(
            context.IssueId,
            "Mission Agent",
            "Duplicate Agent",
            cancellationToken
        );

        if (!missionAgent.IsEnabled)
        {
            await writer.SkipStepAsync(
                context.IssueId,
                missionAgent,
                "Mission Agent",
                "Mission Agent este oprit din configuratia admin; nu se genereaza misiune noua.",
                "Skip Reward Agent and update city signal.",
                "Duplicate Agent",
                cancellationToken
            );
            await SkipRewardAfterMissingMissionAsync(
                writer,
                agentConfigs,
                context.IssueId,
                "Mission Agent did not create a mission.",
                cancellationToken
            );

            return;
        }

        var missionToolResult = await createMissionTool.ExecuteAsync(
            context.IssueId,
            missionAgent,
            cancellationToken
        );
        context.Mission = (MissionResponse?)missionToolResult.Data;
        await writer.CompleteStepAsync(
            context.IssueId,
            "Mission Agent",
            CreateMissionDecision(context.Mission, missionToolResult),
            new
            {
                context.IssueId,
                tool = CreateMissionTool.ToolName,
                missionAgent.Model,
                missionAgent.Instructions,
                missionAgent.FallbackMode,
                missionAgent.IsEnabled
            },
            null,
            context.Mission is null
                ? "Raportul nu necesita o actiune comunitara; poate fi rezolvat individual sau trimis catre autoritatea potrivita."
                : $"A creat misiunea {context.Mission.Title}.",
            cancellationToken
        );

        if (context.Mission is null)
        {
            await SkipRewardAfterMissingMissionAsync(
                writer,
                agentConfigs,
                context.IssueId,
                "Raportul nu necesita o actiune comunitara, asa ca reward matching nu se aplica.",
                cancellationToken
            );

            return;
        }

        await writer.PublishEventAsync(
            context.IssueId,
            "MissionCreated",
            "mission.created",
            new
            {
                issueId = context.IssueId,
                missionId = context.Mission.Id,
                context.Mission.Title,
                context.Mission.ZoneId,
                context.Mission.ImpactPoints
            },
            cancellationToken
        );

        var rewardAgent = IssueAgentStepWriter.GetAgentConfig(
            agentConfigs,
            "reward",
            "Reward Agent"
        );
        await writer.StartStepAsync(
            context.IssueId,
            "Reward Agent",
            "Mission Agent",
            cancellationToken
        );

        if (!rewardAgent.IsEnabled)
        {
            await writer.SkipStepAsync(
                context.IssueId,
                rewardAgent,
                "Reward Agent",
                "Reward Agent este oprit din configuratia admin; nu se potriveste recompensa.",
                "Update city signal.",
                "Mission Agent",
                cancellationToken
            );

            return;
        }

        var rewardToolResult = await matchRewardTool.ExecuteAsync(
            context.Mission.Id,
            rewardAgent,
            cancellationToken
        );
        context.Reward = (RewardSummaryResponse?)rewardToolResult.Data;
        await writer.CompleteStepAsync(
            context.IssueId,
            "Reward Agent",
            CreateRewardDecision(context.Reward, rewardToolResult),
            new
            {
                context.IssueId,
                missionId = context.Mission.Id,
                tool = MatchRewardTool.ToolName,
                rewardAgent.Model,
                rewardAgent.Instructions,
                rewardAgent.FallbackMode,
                rewardAgent.IsEnabled
            },
            null,
            context.Reward is null
                ? "Nu a gasit o recompensa disponibila pentru aceasta misiune."
                : $"A potrivit recompensa {context.Reward.Title}.",
            cancellationToken
        );

        if (context.Reward is not null)
        {
            await writer.PublishEventAsync(
                context.IssueId,
                "RewardMatched",
                "reward.matched",
                new
                {
                    issueId = context.IssueId,
                    missionId = context.Mission.Id,
                    rewardId = context.Reward.Id,
                    context.Reward.Title,
                    context.Reward.PartnerName
                },
                cancellationToken
            );
        }
    }

    private static async Task RunCityAgentAsync(
        IssueAgentStepWriter writer,
        UpdateZoneScoreTool updateZoneScoreTool,
        IReadOnlyDictionary<string, RuntimeAgentConfig> agentConfigs,
        AgentWorkContext context,
        CancellationToken cancellationToken
    )
    {
        var cityAgent = IssueAgentStepWriter.GetAgentConfig(agentConfigs, "city", "City Agent");
        await writer.StartStepAsync(context.IssueId, "City Agent", GetCityReceivesFrom(context), cancellationToken);

        if (!cityAgent.IsEnabled)
        {
            await writer.SkipStepAsync(
                context.IssueId,
                cityAgent,
                "City Agent",
                "City Agent este oprit din configuratia admin.",
                "Finish agent runtime.",
                GetCityReceivesFrom(context),
                cancellationToken
            );

            return;
        }

        var cityToolResult = await updateZoneScoreTool.ExecuteAsync(context.IssueId, cancellationToken);
        await writer.CompleteStepAsync(
            context.IssueId,
            "City Agent",
            new AgentDecision(
                cityToolResult.Succeeded
                    ? "Updated the live city signal for this issue zone."
                    : cityToolResult.Message ?? "The issue has no zone signal to update.",
                UpdateZoneScoreTool.ToolName,
                cityToolResult.Succeeded
                    ? "Refresh the live map and zone impact state."
                    : "Keep the report timeline visible without a zone update.",
                "Finish agent runtime.",
                null,
                true,
                cityToolResult
            ),
            new
            {
                context.IssueId,
                tool = UpdateZoneScoreTool.ToolName,
                cityAgent.Model,
                cityAgent.Instructions,
                cityAgent.FallbackMode,
                cityAgent.IsEnabled
            },
            cityToolResult.Succeeded ? "completed" : "skipped",
            cityToolResult.Succeeded
                ? "A actualizat semnalul de impact pentru harta live."
                : "Nu a gasit o zona pentru actualizarea impactului.",
            cancellationToken
        );
    }

    private static async Task PublishGamificationEventsAsync(
        IssueAgentStepWriter writer,
        AgentWorkContext context,
        CancellationToken cancellationToken
    )
    {
        if (context.Gamification is null || context.Gamification.PointsAwarded <= 0)
        {
            return;
        }

        var pointsPayload = new
        {
            issueId = context.IssueId,
            context.Gamification.PointsAwarded,
            context.Gamification.TotalPoints,
            rankName = context.Gamification.CurrentRank.Name,
            badges = context.Gamification.UnlockedBadges.Select(badge => badge.Name).ToArray()
        };

        await writer.PublishEventAsync(
            context.IssueId,
            "PointsAwarded",
            "points.awarded",
            pointsPayload,
            cancellationToken
        );

        foreach (var badge in context.Gamification.UnlockedBadges)
        {
            await writer.PublishEventAsync(
                context.IssueId,
                "BadgeUnlocked",
                "badge.unlocked",
                new
                {
                    issueId = context.IssueId,
                    badge.Id,
                    badge.Name,
                    badge.Description,
                    badge.Icon,
                    context.Gamification.TotalPoints
                },
                cancellationToken
            );
        }

        await writer.PublishEventAsync(
            context.IssueId,
            "RankChanged",
            "rank.changed",
            new
            {
                issueId = context.IssueId,
                rankId = context.Gamification.CurrentRank.Id,
                rankName = context.Gamification.CurrentRank.Name,
                context.Gamification.CurrentRank.MinPoints,
                context.Gamification.CurrentRank.MaxPoints,
                context.Gamification.CurrentRank.ProgressPercent,
                context.Gamification.TotalPoints,
                nextRankName = context.Gamification.NextRank?.Name
            },
            cancellationToken
        );
    }

    private static async Task SkipDuplicateMissionRewardForEscalationAsync(
        IssueAgentStepWriter writer,
        IReadOnlyDictionary<string, RuntimeAgentConfig> agentConfigs,
        Guid issueId,
        CancellationToken cancellationToken
    )
    {
        var duplicateAgent = IssueAgentStepWriter.GetAgentConfig(agentConfigs, "duplicate", "Duplicate Agent");
        var missionAgent = IssueAgentStepWriter.GetAgentConfig(agentConfigs, "mission", "Mission Agent");
        var rewardAgent = IssueAgentStepWriter.GetAgentConfig(agentConfigs, "reward", "Reward Agent");

        await writer.StartStepAsync(issueId, "Duplicate Agent", "Triage Agent", cancellationToken);
        await writer.SkipStepAsync(
            issueId,
            duplicateAgent,
            "Duplicate Agent",
            "Semnalul este urgent, asa ca verificarea duplicatelor este sarita pentru escaladare.",
            "Skip mission flow and update city signal.",
            "Triage Agent",
            cancellationToken
        );
        await writer.StartStepAsync(issueId, "Mission Agent", "Duplicate Agent", cancellationToken);
        await writer.SkipStepAsync(
            issueId,
            missionAgent,
            "Mission Agent",
            "Semnalul necesita escaladare, nu o misiune comunitara.",
            "Skip Reward Agent and update city signal.",
            "Duplicate Agent",
            cancellationToken
        );
        await writer.StartStepAsync(issueId, "Reward Agent", "Mission Agent", cancellationToken);
        await writer.SkipStepAsync(
            issueId,
            rewardAgent,
            "Reward Agent",
            "Nu se potriveste recompensa pentru un semnal escaladat.",
            "Update city signal.",
            "Mission Agent",
            cancellationToken
        );
    }

    private static async Task SkipRemainingForInvalidIssueAsync(
        IssueAgentStepWriter writer,
        IReadOnlyDictionary<string, RuntimeAgentConfig> agentConfigs,
        Guid issueId,
        string? invalidReason,
        CancellationToken cancellationToken
    )
    {
        var triageAgent = IssueAgentStepWriter.GetAgentConfig(agentConfigs, "triage", "Triage Agent");
        var duplicateAgent = IssueAgentStepWriter.GetAgentConfig(agentConfigs, "duplicate", "Duplicate Agent");
        var missionAgent = IssueAgentStepWriter.GetAgentConfig(agentConfigs, "mission", "Mission Agent");
        var rewardAgent = IssueAgentStepWriter.GetAgentConfig(agentConfigs, "reward", "Reward Agent");
        var cityAgent = IssueAgentStepWriter.GetAgentConfig(agentConfigs, "city", "City Agent");
        var reason = string.IsNullOrWhiteSpace(invalidReason)
            ? "Vision Agent nu a confirmat o problema civica raportabila."
            : invalidReason;

        await writer.StartStepAsync(issueId, "Triage Agent", "Vision Agent", cancellationToken);
        await writer.SkipStepAsync(
            issueId,
            triageAgent,
            "Triage Agent",
            $"Raport respins: {reason}",
            "Skip duplicate, mission, reward and city impact.",
            "Vision Agent",
            cancellationToken
        );
        await writer.StartStepAsync(issueId, "Duplicate Agent", "Triage Agent", cancellationToken);
        await writer.SkipStepAsync(
            issueId,
            duplicateAgent,
            "Duplicate Agent",
            "Raportul nu este valid, asa ca nu cauta duplicate.",
            "Skip mission flow.",
            "Triage Agent",
            cancellationToken
        );
        await writer.StartStepAsync(issueId, "Mission Agent", "Duplicate Agent", cancellationToken);
        await writer.SkipStepAsync(
            issueId,
            missionAgent,
            "Mission Agent",
            "Raportul respins nu genereaza misiune.",
            "Skip Reward Agent.",
            "Duplicate Agent",
            cancellationToken
        );
        await writer.StartStepAsync(issueId, "Reward Agent", "Mission Agent", cancellationToken);
        await writer.SkipStepAsync(
            issueId,
            rewardAgent,
            "Reward Agent",
            "Raportul respins nu primeste recompensa.",
            "Skip city impact.",
            "Mission Agent",
            cancellationToken
        );
        await writer.StartStepAsync(issueId, "City Agent", "Reward Agent", cancellationToken);
        await writer.SkipStepAsync(
            issueId,
            cityAgent,
            "City Agent",
            "Raportul respins nu actualizeaza scorul zonei.",
            "Finish agent runtime.",
            "Reward Agent",
            cancellationToken
        );
    }

    private static async Task SkipMissionAndRewardForDuplicateAsync(
        IssueAgentStepWriter writer,
        IReadOnlyDictionary<string, RuntimeAgentConfig> agentConfigs,
        Guid issueId,
        CancellationToken cancellationToken
    )
    {
        var missionAgent = IssueAgentStepWriter.GetAgentConfig(agentConfigs, "mission", "Mission Agent");
        var rewardAgent = IssueAgentStepWriter.GetAgentConfig(agentConfigs, "reward", "Reward Agent");

        await writer.StartStepAsync(issueId, "Mission Agent", "Duplicate Agent", cancellationToken);
        await writer.SkipStepAsync(
            issueId,
            missionAgent,
            "Mission Agent",
            "Raportul pare duplicat, asa ca agentul nu creeaza o misiune noua.",
            "Skip Reward Agent and update city signal.",
            "Duplicate Agent",
            cancellationToken
        );
        await writer.StartStepAsync(issueId, "Reward Agent", "Mission Agent", cancellationToken);
        await writer.SkipStepAsync(
            issueId,
            rewardAgent,
            "Reward Agent",
            "Fara misiune noua, agentul nu potriveste o recompensa separata.",
            "Update city signal.",
            "Mission Agent",
            cancellationToken
        );
    }

    private static async Task SkipRewardAfterMissingMissionAsync(
        IssueAgentStepWriter writer,
        IReadOnlyDictionary<string, RuntimeAgentConfig> agentConfigs,
        Guid issueId,
        string reason,
        CancellationToken cancellationToken
    )
    {
        var rewardAgent = IssueAgentStepWriter.GetAgentConfig(agentConfigs, "reward", "Reward Agent");
        await writer.StartStepAsync(issueId, "Reward Agent", "Mission Agent", cancellationToken);
        await writer.SkipStepAsync(
            issueId,
            rewardAgent,
            "Reward Agent",
            reason,
            "Update city signal.",
            "Mission Agent",
            cancellationToken
        );
    }

    private static AgentDecision CreateVisionDecision(
        IssueAiAnalysisResponse analysis,
        AgentToolResult toolResult
    )
    {
        return new AgentDecision(
            analysis.IsValidIssue
                ? $"Photo and description indicate {analysis.Category} with {analysis.Severity} severity."
                : $"Photo did not confirm a civic issue: {analysis.InvalidReason ?? "no reportable city problem detected"}.",
            AnalyzeIssueTool.ToolName,
            !analysis.IsValidIssue
                ? "Reject report and skip downstream civic actions."
                : analysis.IsUrgent
                ? "Mark as urgent and send to triage for escalation."
                : "Send categorized issue to triage.",
            analysis.IsValidIssue ? "Run Triage Agent" : "Skip remaining agents",
            analysis.Confidence,
            true,
            toolResult
        );
    }

    private static AgentDecision CreateTriageDecision(IssueAiAnalysisResponse analysis)
    {
        var isEscalation =
            analysis.IsUrgent ||
            analysis.Severity.Equals("critical", StringComparison.OrdinalIgnoreCase) ||
            analysis.ResponsibleActor.Equals("emergency", StringComparison.OrdinalIgnoreCase);

        return new AgentDecision(
            $"Responsible actor selected: {analysis.ResponsibleActor}.",
            "choose_responsible_actor",
            isEscalation
                ? "Escalate instead of creating a community mission."
                : "Continue with duplicate detection before mission planning.",
            isEscalation ? "Skip mission flow and update city signal." : "Run Duplicate Agent",
            analysis.Confidence,
            true,
            new
            {
                analysis.ResponsibleActor,
                analysis.SuggestedAction,
                analysis.RewardEligible
            }
        );
    }

    private static AgentDecision CreateDuplicateDecision(
        DuplicateDetectionResult result,
        AgentToolResult toolResult
    )
    {
        if (!toolResult.Succeeded)
        {
            return new AgentDecision(
                toolResult.Message ?? "Duplicate search used fallback.",
                SearchNearbyIssuesTool.ToolName,
                "Continue to mission eligibility using duplicate fallback.",
                "Run Mission Agent",
                0.52,
                true,
                toolResult
            );
        }

        var hasDuplicate = result.NearestDuplicate is not null;

        return new AgentDecision(
            hasDuplicate
                ? $"Found {result.DuplicateCount} nearby unresolved report(s)."
                : "No nearby unresolved duplicate was found.",
            SearchNearbyIssuesTool.ToolName,
            hasDuplicate
                ? "Mark as possible duplicate and stop new mission generation."
                : "Continue to mission eligibility.",
            hasDuplicate ? "Skip mission flow and update city signal." : "Run Mission Agent",
            hasDuplicate ? 0.88 : 0.8,
            true,
            toolResult
        );
    }

    private static AgentDecision CreateMissionDecision(
        MissionResponse? mission,
        AgentToolResult toolResult
    )
    {
        return new AgentDecision(
            mission is null
                ? "Raportul nu necesita o actiune comunitara; poate fi rezolvat individual sau trimis catre autoritatea potrivita."
                : $"Created mission {mission.Title}.",
            CreateMissionTool.ToolName,
            mission is null
                ? "Do not create mission for this issue."
                : "Publish mission and check reward match.",
            mission is null ? "Skip Reward Agent and update city signal." : "Run Reward Agent",
            mission is null ? 0.74 : 0.86,
            true,
            toolResult
        );
    }

    private static AgentDecision CreateRewardDecision(
        RewardSummaryResponse? reward,
        AgentToolResult toolResult
    )
    {
        return new AgentDecision(
            reward is null
                ? "No available reward matched this mission."
                : $"Matched reward {reward.Title}.",
            MatchRewardTool.ToolName,
            reward is null
                ? "Continue without partner reward."
                : "Attach reward to mission.",
            "Update city signal.",
            reward is null ? 0.66 : 0.84,
            true,
            toolResult
        );
    }

    private static string GetCityReceivesFrom(AgentWorkContext context)
    {
        if (context.Reward is not null)
        {
            return "Reward Agent";
        }

        if (context.Mission is not null)
        {
            return "Mission Agent";
        }

        if (context.IsDuplicatePath || context.DuplicateResult is not null)
        {
            return "Reward Agent";
        }

        return context.IsEscalationPath ? "Reward Agent" : "Mission Agent";
    }
}
