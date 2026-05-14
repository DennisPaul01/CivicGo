using System.Text.Json;
using CivicGo.Api.Data;
using CivicGo.Api.Data.Entities;
using Microsoft.EntityFrameworkCore;

namespace CivicGo.Api.Rewards;

public sealed class RewardMatchingService(
    CivicGoDbContext dbContext,
    ILogger<RewardMatchingService> logger
)
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        WriteIndented = false
    };

    public async Task<RewardSummaryResponse?> MatchRewardForMissionAsync(
        Guid missionId,
        CancellationToken cancellationToken
    )
    {
        var mission = await dbContext.Missions
            .Include(item => item.Zone)
            .Include(item => item.Reward)
                .ThenInclude(reward => reward!.Partner)
            .Include(item => item.CreatedFromIssue)
                .ThenInclude(issue => issue!.AgentRuns)
                    .ThenInclude(run => run.AgentSteps)
            .Include(item => item.CreatedFromIssue)
                .ThenInclude(issue => issue!.AiAnalyses)
            .FirstOrDefaultAsync(item => item.Id == missionId, cancellationToken);

        if (mission is null)
        {
            throw new KeyNotFoundException($"Mission {missionId} was not found.");
        }

        if (mission.Reward is not null)
        {
            return RewardMapper.ToSummary(mission.Reward);
        }

        var now = DateTimeOffset.UtcNow;
        var candidates = await dbContext.Rewards
            .Include(reward => reward.Partner)
            .Include(reward => reward.Zone)
            .Where(reward =>
                reward.Status == "available" &&
                (reward.ExpiresAt == null || reward.ExpiresAt > now) &&
                (reward.Quantity <= 0 || reward.ClaimedCount < reward.Quantity)
            )
            .ToListAsync(cancellationToken);
        var selectedReward = SelectReward(candidates, mission);

        if (selectedReward is null)
        {
            logger.LogWarning("No reward candidate was available for mission {MissionId}.", mission.Id);
            return null;
        }

        mission.RewardId = selectedReward.Id;
        mission.UpdatedAt = now;

        dbContext.PublicActivityFeedItems.Add(new PublicActivityFeedItemEntity
        {
            Id = Guid.NewGuid(),
            Type = "reward_matched",
            Title = "Recompensa potrivita",
            Message = CreateFeedMessage(mission, selectedReward),
            RelatedIssueId = mission.CreatedFromIssueId,
            RelatedMissionId = mission.Id,
            RelatedRewardId = selectedReward.Id,
            RelatedZoneId = mission.ZoneId,
            CreatedAt = now
        });

        AddRewardAgentStep(mission, selectedReward, now);

        if (!await TrySaveRewardMatchAsync(mission.Id, cancellationToken))
        {
            return null;
        }

        return RewardMapper.ToSummary(selectedReward);
    }

    private async Task<bool> TrySaveRewardMatchAsync(
        Guid missionId,
        CancellationToken cancellationToken
    )
    {
        try
        {
            await dbContext.SaveChangesAsync(cancellationToken);

            return true;
        }
        catch (DbUpdateConcurrencyException exception)
        {
            logger.LogWarning(
                exception,
                "Reward matching skipped persistence for mission {MissionId} because tracked data changed before save.",
                missionId
            );
            dbContext.ChangeTracker.Clear();

            return false;
        }
    }

    private static RewardEntity? SelectReward(
        IReadOnlyCollection<RewardEntity> candidates,
        MissionEntity mission
    )
    {
        var partnerRewards = candidates
            .Where(reward => reward.Type == "partner")
            .OrderByDescending(reward => GetPartnerScore(reward, mission))
            .ThenBy(reward => reward.RequiredPoints)
            .ToArray();

        if (partnerRewards.Length > 0)
        {
            return partnerRewards[0];
        }

        return candidates
            .Where(reward => reward.Type == "system")
            .OrderBy(reward => reward.RequiredPoints)
            .FirstOrDefault();
    }

    private static int GetPartnerScore(RewardEntity reward, MissionEntity mission)
    {
        var partnerName = reward.Partner?.Name ?? string.Empty;
        var missionText = $"{mission.Title} {mission.Description} {mission.CreatedFromIssue?.Category}"
            .ToLowerInvariant();
        var zoneName = mission.Zone?.Name ?? string.Empty;
        var score = reward.Zone?.Name == zoneName ? 10 : 0;

        if (partnerName.Equals("CoffeeLab", StringComparison.OrdinalIgnoreCase) &&
            (missionText.Contains("clean-up", StringComparison.Ordinal) ||
             missionText.Contains("cleanup", StringComparison.Ordinal) ||
             missionText.Contains("waste", StringComparison.Ordinal) ||
             missionText.Contains("curatenie", StringComparison.Ordinal) ||
             missionText.Contains("deseuri", StringComparison.Ordinal) ||
             missionText.Contains("salubrizare", StringComparison.Ordinal) ||
             missionText.Contains("sanitation_pest_snow", StringComparison.Ordinal)))
        {
            score += 40;
        }

        if (partnerName.Equals("Local Gym", StringComparison.OrdinalIgnoreCase) &&
            (missionText.Contains("green", StringComparison.Ordinal) ||
             missionText.Contains("walk", StringComparison.Ordinal) ||
             missionText.Contains("spatiu verde", StringComparison.Ordinal) ||
             missionText.Contains("locuri de joaca", StringComparison.Ordinal) ||
             missionText.Contains("environment_playgrounds_green_spaces", StringComparison.Ordinal) ||
             missionText.Contains("tur", StringComparison.Ordinal)))
        {
            score += 25;
        }

        if (partnerName.Equals("Bookstore", StringComparison.OrdinalIgnoreCase) &&
            (missionText.Contains("accessibility", StringComparison.Ordinal) ||
             missionText.Contains("check", StringComparison.Ordinal) ||
             missionText.Contains("accesibilitate", StringComparison.Ordinal) ||
             missionText.Contains("verificare", StringComparison.Ordinal)))
        {
            score += 18;
        }

        return score;
    }

    private static string CreateFeedMessage(MissionEntity mission, RewardEntity reward)
    {
        var sponsor = reward.Partner?.Name ?? "CivicGO";

        return $"{sponsor} a potrivit {reward.Title} cu {mission.Title}.";
    }

    private static void AddRewardAgentStep(
        MissionEntity mission,
        RewardEntity reward,
        DateTimeOffset now
    )
    {
        var issue = mission.CreatedFromIssue;
        var latestRun = issue?.AgentRuns
            .OrderByDescending(run => run.CreatedAt)
            .FirstOrDefault();

        if (latestRun is null ||
            latestRun.AgentSteps.Any(step => step.AgentName == "Reward Agent"))
        {
            return;
        }

        var nextOrder = latestRun.AgentSteps.Count == 0
            ? 1
            : latestRun.AgentSteps.Max(step => step.Order) + 1;
        latestRun.AgentSteps.Add(new AgentStepEntity
        {
            Id = Guid.NewGuid(),
            AgentRunId = latestRun.Id,
            AgentName = "Reward Agent",
            Status = "completed",
            InputJson = JsonSerializer.Serialize(new
            {
                mission.Id,
                mission.Title,
                mission.Zone?.Name,
                issue?.Category,
                mission.ImpactPoints
            }, JsonOptions),
            OutputJson = JsonSerializer.Serialize(new
            {
                reward.Id,
                reward.Type,
                reward.Title,
                partner = reward.Partner?.Name,
                reward.RequiredPoints
            }, JsonOptions),
            Message = $"A potrivit recompensa {reward.Title}.",
            StartedAt = now.AddMilliseconds(-160),
            CompletedAt = now,
            Order = nextOrder
        });
        latestRun.CompletedAt = now;
    }
}
