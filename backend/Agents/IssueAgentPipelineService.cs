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
            var analysis = await aiAnalysisService.AnalyzeIssueAsync(issueId, cancellationToken);
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

            await SendStepStartedAsync(dbContext, issueId, "Duplicate Agent", "Triage Agent", cancellationToken);
            var duplicateResult = await duplicateDetectionService.CheckIssueAsync(issueId, cancellationToken);
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

            await SendStepStartedAsync(dbContext, issueId, "Mission Agent", "Duplicate Agent", cancellationToken);
            var mission = await missionGenerationService.EnsureMissionForIssueAsync(issueId, cancellationToken);
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

                await SendStepStartedAsync(dbContext, issueId, "Reward Agent", "Mission Agent", cancellationToken);
                var reward = await rewardMatchingService.MatchRewardForMissionAsync(
                    mission.Id,
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
            }

            var issue = await dbContext.Issues
                .AsNoTracking()
                .Include(item => item.Zone)
                .FirstOrDefaultAsync(item => item.Id == issueId, cancellationToken);

            if (issue?.ZoneId is not null)
            {
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
