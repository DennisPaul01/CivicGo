using CivicGo.Api.Ai;
using CivicGo.Api.Data;
using CivicGo.Api.Duplicates;
using CivicGo.Api.Gamification;
using CivicGo.Api.Live;
using CivicGo.Api.Missions;
using CivicGo.Api.Rewards;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace CivicGo.Api.Agents;

public sealed class IssueAgentPipelineService(
    IServiceScopeFactory scopeFactory,
    IHubContext<CivicHub> civicHub,
    IssueEventStreamService eventStream,
    ILogger<IssueAgentPipelineService> logger
)
{
    public void Enqueue(Guid issueId)
    {
        _ = Task.Run(() => RunAsync(issueId, CancellationToken.None));
    }

    private async Task RunAsync(Guid issueId, CancellationToken cancellationToken)
    {
        try
        {
            using var scope = scopeFactory.CreateScope();
            var aiAnalysisService = scope.ServiceProvider.GetRequiredService<IssueAiAnalysisService>();
            var duplicateDetectionService = scope.ServiceProvider.GetRequiredService<DuplicateDetectionService>();
            var missionGenerationService = scope.ServiceProvider.GetRequiredService<MissionGenerationService>();
            var rewardMatchingService = scope.ServiceProvider.GetRequiredService<RewardMatchingService>();
            var gamificationService = scope.ServiceProvider.GetRequiredService<GamificationService>();
            var dbContext = scope.ServiceProvider.GetRequiredService<CivicGoDbContext>();
            var agentConfigs = await LoadAgentConfigsAsync(dbContext, cancellationToken);

            var createdIssue = await dbContext.Issues
                .AsNoTracking()
                .Include(item => item.Zone)
                .FirstOrDefaultAsync(item => item.Id == issueId, cancellationToken);

            if (createdIssue is not null)
            {
                var payload = new
                {
                    issueId,
                    status = createdIssue.Status,
                    zoneId = createdIssue.ZoneId,
                    zoneName = createdIssue.Zone?.Name,
                    createdIssue.CreatedAt
                };

                await civicHub.Clients.All.SendAsync(
                    "IssueCreated",
                    payload,
                    cancellationToken
                );
                await eventStream.PublishAsync(issueId, "issue.created", payload, cancellationToken);
            }

            await SendStepStartedAsync(dbContext, issueId, "Vision Agent", null, cancellationToken);
            var analysis = await aiAnalysisService.AnalyzeIssueAsync(
                issueId,
                agentConfigs,
                cancellationToken
            );
            await SendStepCompletedAsync(dbContext, issueId, "Vision Agent", cancellationToken);
            await SendStepStartedAsync(dbContext, issueId, "Triage Agent", "Vision Agent", cancellationToken);
            await SendStepCompletedAsync(dbContext, issueId, "Triage Agent", cancellationToken);
            var analyzedPayload = new
            {
                issueId,
                analysis.Category,
                analysis.Severity,
                analysis.IsUrgent,
                analysis.CreatedAt
            };

            await civicHub.Clients.All.SendAsync(
                "IssueAnalyzed",
                analyzedPayload,
                cancellationToken
            );
            await eventStream.PublishAsync(issueId, "issue.analyzed", analyzedPayload, cancellationToken);

            var duplicateAgent = GetAgentConfig(agentConfigs, "duplicate", "Duplicate Agent");
            await SendStepStartedAsync(dbContext, issueId, "Duplicate Agent", "Triage Agent", cancellationToken);
            var duplicateResult = duplicateAgent.IsEnabled
                ? await duplicateDetectionService.CheckIssueAsync(issueId, duplicateAgent, cancellationToken)
                : await AddSkippedStepAsync(
                    dbContext,
                    issueId,
                    duplicateAgent,
                    "Duplicate Agent",
                    "Duplicate Agent este oprit din configuratia admin.",
                    "Triage Agent",
                    cancellationToken
                );
            await SendStepCompletedAsync(dbContext, issueId, "Duplicate Agent", cancellationToken);
            if (duplicateResult.NearestDuplicate is not null)
            {
                var duplicatePayload = new
                {
                    issueId,
                    duplicateResult.DuplicateCount,
                    duplicateResult.NearestDuplicate
                };

                await civicHub.Clients.All.SendAsync(
                    "DuplicateDetected",
                    duplicatePayload,
                    cancellationToken
                );
                await eventStream.PublishAsync(
                    issueId,
                    "duplicate.detected",
                    duplicatePayload,
                    cancellationToken
                );
            }

            var missionAgent = GetAgentConfig(agentConfigs, "mission", "Mission Agent");
            await SendStepStartedAsync(dbContext, issueId, "Mission Agent", "Duplicate Agent", cancellationToken);
            var mission = missionAgent.IsEnabled
                ? await missionGenerationService.EnsureMissionForIssueAsync(
                    issueId,
                    missionAgent,
                    cancellationToken
                )
                : await SkipMissionAgentAsync(
                    dbContext,
                    issueId,
                    missionAgent,
                    "Mission Agent",
                    cancellationToken
                );
            await SendStepCompletedAsync(dbContext, issueId, "Mission Agent", cancellationToken);

            if (mission is not null)
            {
                var missionPayload = new
                {
                    issueId,
                    missionId = mission.Id,
                    mission.Title,
                    mission.ZoneId,
                    mission.ImpactPoints
                };

                await civicHub.Clients.All.SendAsync(
                    "MissionCreated",
                    missionPayload,
                    cancellationToken
                );
                await eventStream.PublishAsync(
                    issueId,
                    "mission.created",
                    missionPayload,
                    cancellationToken
                );

                var rewardAgent = GetAgentConfig(agentConfigs, "reward", "Reward Agent");
                await SendStepStartedAsync(dbContext, issueId, "Reward Agent", "Mission Agent", cancellationToken);
                var reward = rewardAgent.IsEnabled
                    ? await rewardMatchingService.MatchRewardForMissionAsync(
                        mission.Id,
                        rewardAgent,
                        cancellationToken
                    )
                    : await SkipRewardAgentAsync(
                        dbContext,
                        issueId,
                        rewardAgent,
                        "Reward Agent",
                        cancellationToken
                    );
                await SendStepCompletedAsync(dbContext, issueId, "Reward Agent", cancellationToken);

                if (reward is not null)
                {
                    var rewardPayload = new
                    {
                        issueId,
                        missionId = mission.Id,
                        rewardId = reward.Id,
                        reward.Title,
                        reward.PartnerName
                    };

                    await civicHub.Clients.All.SendAsync(
                        "RewardMatched",
                        rewardPayload,
                        cancellationToken
                    );
                    await eventStream.PublishAsync(
                        issueId,
                        "reward.matched",
                        rewardPayload,
                        cancellationToken
                    );
                }
            }

            var gamification = await gamificationService.ApplyReportRewardsAsync(issueId, cancellationToken);
            if (gamification.PointsAwarded > 0)
            {
                var pointsPayload = new
                {
                    issueId,
                    gamification.PointsAwarded,
                    gamification.TotalPoints,
                    rankName = gamification.CurrentRank.Name,
                    badges = gamification.UnlockedBadges.Select(badge => badge.Name).ToArray()
                };

                await civicHub.Clients.All.SendAsync(
                    "PointsAwarded",
                    pointsPayload,
                    cancellationToken
                );
                await eventStream.PublishAsync(issueId, "points.awarded", pointsPayload, cancellationToken);

                foreach (var badge in gamification.UnlockedBadges)
                {
                    var badgePayload = new
                    {
                        issueId,
                        badge.Id,
                        badge.Name,
                        badge.Description,
                        badge.Icon,
                        gamification.TotalPoints
                    };

                    await civicHub.Clients.All.SendAsync(
                        "BadgeUnlocked",
                        badgePayload,
                        cancellationToken
                    );
                    await eventStream.PublishAsync(
                        issueId,
                        "badge.unlocked",
                        badgePayload,
                        cancellationToken
                    );
                }

                var rankPayload = new
                {
                    issueId,
                    rankId = gamification.CurrentRank.Id,
                    rankName = gamification.CurrentRank.Name,
                    gamification.CurrentRank.MinPoints,
                    gamification.CurrentRank.MaxPoints,
                    gamification.CurrentRank.ProgressPercent,
                    gamification.TotalPoints,
                    nextRankName = gamification.NextRank?.Name
                };

                await civicHub.Clients.All.SendAsync(
                    "RankChanged",
                    rankPayload,
                    cancellationToken
                );
                await eventStream.PublishAsync(issueId, "rank.changed", rankPayload, cancellationToken);
            }

            var issue = await dbContext.Issues
                .AsNoTracking()
                .Include(item => item.Zone)
                .FirstOrDefaultAsync(item => item.Id == issueId, cancellationToken);

            if (issue?.ZoneId is not null)
            {
                var cityAgent = GetAgentConfig(agentConfigs, "city", "City Agent");
                if (!cityAgent.IsEnabled)
                {
                    await AddSkippedStepAsync(
                        dbContext,
                        issueId,
                        cityAgent,
                        "City Agent",
                        "City Agent este oprit din configuratia admin.",
                        "Reward Agent",
                        cancellationToken
                    );
                }

                var zonePayload = new
                {
                    issueId,
                    zoneId = issue.ZoneId,
                    zoneName = issue.Zone?.Name,
                    score = issue.Zone?.Score
                };

                await civicHub.Clients.All.SendAsync(
                    "ZoneScoreUpdated",
                    zonePayload,
                    cancellationToken
                );
                await eventStream.PublishAsync(issueId, "zone.score.updated", zonePayload, cancellationToken);
            }
        }
        catch (Exception exception)
        {
            logger.LogError(exception, "Issue agent pipeline failed for issue {IssueId}.", issueId);
            var failedPayload = new
            {
                issueId,
                message = "Agent pipeline failed before finishing."
            };

            await civicHub.Clients.All.SendAsync(
                "AgentPipelineFailed",
                failedPayload,
                CancellationToken.None
            );
            await eventStream.PublishAsync(issueId, "agent.pipeline.failed", failedPayload);
        }
    }

    private static async Task<IReadOnlyDictionary<string, RuntimeAgentConfig>> LoadAgentConfigsAsync(
        CivicGoDbContext dbContext,
        CancellationToken cancellationToken
    )
    {
        return await dbContext.AgentConfigs
            .AsNoTracking()
            .ToDictionaryAsync(
                agent => agent.Key,
                agent => new RuntimeAgentConfig(
                    agent.Key,
                    agent.Name,
                    agent.Instructions,
                    agent.Model,
                    agent.FallbackMode,
                    agent.IsEnabled
                ),
                StringComparer.OrdinalIgnoreCase,
                cancellationToken
            );
    }

    private static RuntimeAgentConfig GetAgentConfig(
        IReadOnlyDictionary<string, RuntimeAgentConfig> agentConfigs,
        string key,
        string fallbackName
    )
    {
        return agentConfigs.TryGetValue(key, out var config)
            ? config
            : RuntimeAgentConfig.Default(key, fallbackName);
    }

    private static async Task<DuplicateDetectionResult> AddSkippedStepAsync(
        CivicGoDbContext dbContext,
        Guid issueId,
        RuntimeAgentConfig agentConfig,
        string stepName,
        string message,
        string? receivesFromAgent,
        CancellationToken cancellationToken
    )
    {
        await AddSkippedAgentStepAsync(
            dbContext,
            issueId,
            agentConfig,
            stepName,
            message,
            receivesFromAgent,
            cancellationToken
        );

        var issue = await dbContext.Issues
            .AsNoTracking()
            .FirstOrDefaultAsync(item => item.Id == issueId, cancellationToken);

        return new DuplicateDetectionResult(issue?.DuplicateCount ?? 0, null);
    }

    private static async Task<MissionResponse?> SkipMissionAgentAsync(
        CivicGoDbContext dbContext,
        Guid issueId,
        RuntimeAgentConfig agentConfig,
        string stepName,
        CancellationToken cancellationToken
    )
    {
        await AddSkippedAgentStepAsync(
            dbContext,
            issueId,
            agentConfig,
            stepName,
            "Mission Agent este oprit din configuratia admin; nu se genereaza misiune noua.",
            "Duplicate Agent",
            cancellationToken
        );

        return null;
    }

    private static async Task<RewardSummaryResponse?> SkipRewardAgentAsync(
        CivicGoDbContext dbContext,
        Guid issueId,
        RuntimeAgentConfig agentConfig,
        string stepName,
        CancellationToken cancellationToken
    )
    {
        await AddSkippedAgentStepAsync(
            dbContext,
            issueId,
            agentConfig,
            stepName,
            "Reward Agent este oprit din configuratia admin; nu se potriveste recompensa.",
            "Mission Agent",
            cancellationToken
        );

        return null;
    }

    private static async Task AddSkippedAgentStepAsync(
        CivicGoDbContext dbContext,
        Guid issueId,
        RuntimeAgentConfig agentConfig,
        string stepName,
        string message,
        string? receivesFromAgent,
        CancellationToken cancellationToken
    )
    {
        var issue = await dbContext.Issues
            .Include(item => item.AgentRuns)
                .ThenInclude(run => run.AgentSteps)
            .FirstOrDefaultAsync(item => item.Id == issueId, cancellationToken);

        if (issue is null)
        {
            return;
        }

        var now = DateTimeOffset.UtcNow;
        var latestRun = issue.AgentRuns
            .OrderByDescending(run => run.CreatedAt)
            .FirstOrDefault();

        if (latestRun is null)
        {
            latestRun = new Data.Entities.AgentRunEntity
            {
                Id = Guid.NewGuid(),
                IssueId = issue.Id,
                Status = "completed",
                StartedAt = now,
                CompletedAt = now,
                CreatedAt = now
            };
            issue.AgentRuns.Add(latestRun);
        }

        if (latestRun.AgentSteps.Any(step => step.AgentName == stepName))
        {
            return;
        }

        var nextOrder = latestRun.AgentSteps.Count == 0
            ? 1
            : latestRun.AgentSteps.Max(step => step.Order) + 1;

        latestRun.AgentSteps.Add(new Data.Entities.AgentStepEntity
        {
            Id = Guid.NewGuid(),
            AgentRunId = latestRun.Id,
            AgentName = stepName,
            Status = "skipped",
            InputJson = System.Text.Json.JsonSerializer.Serialize(new
            {
                issue.Id,
                receivesFromAgent,
                agentConfig.Key,
                agentConfig.Model,
                agentConfig.Instructions,
                agentConfig.FallbackMode,
                agentConfig.IsEnabled
            }),
            OutputJson = System.Text.Json.JsonSerializer.Serialize(new
            {
                skipped = true,
                reason = "disabled_by_admin_config"
            }),
            Message = message,
            StartedAt = now,
            CompletedAt = now,
            Order = nextOrder
        });
        latestRun.CompletedAt = now;
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private async Task SendStepStartedAsync(
        CivicGoDbContext dbContext,
        Guid issueId,
        string agentName,
        string? receivesFromAgent,
        CancellationToken cancellationToken
    )
    {
        var payload = new
        {
            issueId,
            agentName,
            receivesFromAgent,
            received = receivesFromAgent is null
                ? null
                : await GetLatestStepOutputAsync(dbContext, issueId, receivesFromAgent, cancellationToken)
        };

        await civicHub.Clients.All.SendAsync(
            "AgentStepStarted",
            payload,
            cancellationToken
        );
        await eventStream.PublishAsync(issueId, "agent.step.started", payload, cancellationToken);
    }

    private async Task SendStepCompletedAsync(
        CivicGoDbContext dbContext,
        Guid issueId,
        string agentName,
        CancellationToken cancellationToken
    )
    {
        var step = await dbContext.AgentSteps
            .AsNoTracking()
            .Where(item => item.AgentRun!.IssueId == issueId && item.AgentName == agentName)
            .OrderByDescending(item => item.CompletedAt ?? item.StartedAt)
            .FirstOrDefaultAsync(cancellationToken);

        var payload = new
        {
            issueId,
            agentName,
            step = step is null ? null : AgentRunMapper.ToResponse(step)
        };

        await civicHub.Clients.All.SendAsync(
            "AgentStepCompleted",
            payload,
            cancellationToken
        );
        await eventStream.PublishAsync(issueId, "agent.step.completed", payload, cancellationToken);
    }

    private static async Task<string?> GetLatestStepOutputAsync(
        CivicGoDbContext dbContext,
        Guid issueId,
        string agentName,
        CancellationToken cancellationToken
    )
    {
        return await dbContext.AgentSteps
            .AsNoTracking()
            .Where(item => item.AgentRun!.IssueId == issueId && item.AgentName == agentName)
            .OrderByDescending(item => item.CompletedAt ?? item.StartedAt)
            .Select(item => item.OutputJson)
            .FirstOrDefaultAsync(cancellationToken);
    }
}
