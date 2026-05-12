using System.Text.Json;
using CivicGo.Api.Data;
using CivicGo.Api.Data.Entities;
using Microsoft.EntityFrameworkCore;

namespace CivicGo.Api.Missions;

public sealed class MissionGenerationService(
    CivicGoDbContext dbContext,
    ILogger<MissionGenerationService> logger
)
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        WriteIndented = false
    };

    private static readonly HashSet<string> MissionFriendlyCategories = new(StringComparer.OrdinalIgnoreCase)
    {
        "waste",
        "graffiti",
        "green_space_issue",
        "blocked_sidewalk",
        "accessibility_issue",
        "broken_lighting",
        "road_damage",
        "damaged_public_furniture"
    };

    public async Task<MissionResponse?> EnsureMissionForIssueAsync(
        Guid issueId,
        CancellationToken cancellationToken
    )
    {
        var issue = await dbContext.Issues
            .Include(item => item.Zone)
            .Include(item => item.AiAnalyses)
            .Include(item => item.AgentRuns)
                .ThenInclude(run => run.AgentSteps)
            .Include(item => item.MissionIssues)
                .ThenInclude(link => link.Mission)
                    .ThenInclude(mission => mission!.Participants)
            .Include(item => item.MissionIssues)
                .ThenInclude(link => link.Mission)
                    .ThenInclude(mission => mission!.Zone)
            .Include(item => item.MissionIssues)
                .ThenInclude(link => link.Mission)
                    .ThenInclude(mission => mission!.Reward)
                        .ThenInclude(reward => reward!.Partner)
            .FirstOrDefaultAsync(item => item.Id == issueId, cancellationToken);

        if (issue is null)
        {
            throw new KeyNotFoundException($"Issue {issueId} was not found.");
        }

        var existingMission = issue.MissionIssues
            .Select(link => link.Mission)
            .Where(mission => mission is not null)
            .OrderByDescending(mission => mission!.CreatedAt)
            .FirstOrDefault();

        if (existingMission is not null)
        {
            return MissionMapper.ToResponse(existingMission);
        }

        if (!IsMissionEligible(issue))
        {
            logger.LogInformation(
                "Issue {IssueId} is not mission eligible. Status: {Status}, category: {Category}, actor: {Actor}.",
                issue.Id,
                issue.Status,
                issue.Category,
                issue.ResponsibleActor
            );

            return null;
        }

        var missionPlan = CreateMissionPlan(issue);
        var now = DateTimeOffset.UtcNow;
        var mission = new MissionEntity
        {
            Id = Guid.NewGuid(),
            Title = missionPlan.Title,
            Description = missionPlan.Description,
            ZoneId = issue.ZoneId,
            Status = "active",
            CreatedFromIssueId = issue.Id,
            StartsAt = missionPlan.StartsAt,
            EndsAt = missionPlan.EndsAt,
            ParticipantsNeeded = missionPlan.ParticipantsNeeded,
            ImpactPoints = missionPlan.ImpactPoints,
            CreatedByAi = true,
            CreatedAt = now,
            UpdatedAt = now
        };
        var missionIssue = new MissionIssueEntity
        {
            Id = Guid.NewGuid(),
            MissionId = mission.Id,
            Mission = mission,
            IssueId = issue.Id,
            Issue = issue,
            CreatedAt = now
        };

        mission.MissionIssues.Add(missionIssue);
        issue.MissionIssues.Add(missionIssue);
        if (issue.Status != "duplicate_detected")
        {
            issue.Status = "mission_created";
        }

        issue.UpdatedAt = now;

        dbContext.Missions.Add(mission);
        dbContext.MissionIssues.Add(missionIssue);
        dbContext.PublicActivityFeedItems.Add(new PublicActivityFeedItemEntity
        {
            Id = Guid.NewGuid(),
            Type = "mission_created",
            Title = "Mission created",
            Message = $"{mission.Title} is now active in {issue.Zone?.Name ?? "Timisoara"}.",
            RelatedIssueId = issue.Id,
            RelatedMissionId = mission.Id,
            RelatedZoneId = issue.ZoneId,
            CreatedAt = now
        });

        AddMissionAgentStep(issue, mission, missionPlan, now);

        if (!await TrySaveMissionAsync(issue.Id, cancellationToken))
        {
            return null;
        }

        return MissionMapper.ToResponse(mission);
    }

    private async Task<bool> TrySaveMissionAsync(Guid issueId, CancellationToken cancellationToken)
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
                "Mission generation skipped persistence for issue {IssueId} because tracked data changed before save.",
                issueId
            );
            dbContext.ChangeTracker.Clear();

            return false;
        }
    }

    private static bool IsMissionEligible(IssueEntity issue)
    {
        if (issue.Status is not "ai_analyzed" and not "duplicate_detected" and not "mission_created")
        {
            return false;
        }

        if (issue.ResponsibleActor == "emergency" || issue.Severity == "critical")
        {
            return false;
        }

        return MissionFriendlyCategories.Contains(issue.Category) ||
            issue.ResponsibleActor.Contains("community", StringComparison.OrdinalIgnoreCase) ||
            issue.AiAnalyses
                .OrderByDescending(analysis => analysis.CreatedAt)
                .FirstOrDefault()
                ?.RewardEligible == true;
    }

    private static MissionPlan CreateMissionPlan(IssueEntity issue)
    {
        var zoneName = issue.Zone?.Name ?? "Timisoara";
        var title = issue.Category switch
        {
            "waste" => $"Clean-up {zoneName}",
            "graffiti" => $"Graffiti cleanup {zoneName}",
            "green_space_issue" => $"Green space check {zoneName}",
            "blocked_sidewalk" or "accessibility_issue" => $"Accessibility check {zoneName}",
            "broken_lighting" => $"Safety walk {zoneName}",
            "road_damage" => $"Road safety check {zoneName}",
            "damaged_public_furniture" => $"Public furniture check {zoneName}",
            _ => $"Civic check {zoneName}"
        };
        var description = issue.Category switch
        {
            "waste" =>
                $"A community cleanup mission generated from the reported waste issue in {zoneName}. Volunteers can document the area, collect visible litter where safe and prepare the issue for city follow-up.",
            "broken_lighting" =>
                $"A safety walk generated from a lighting report in {zoneName}. Participants can verify nearby lights, document dark spots and help prioritize the city service request.",
            "road_damage" =>
                $"A road safety check generated from the report in {zoneName}. Citizens can collect supporting photos and map the affected segment for city hall review.",
            "blocked_sidewalk" or "accessibility_issue" =>
                $"An accessibility check generated from the report in {zoneName}. The mission focuses on documenting the obstruction and confirming pedestrian impact.",
            _ =>
                $"A lightweight civic mission generated from the issue reported in {zoneName}. Participants can verify the location, add context and help move the problem toward resolution."
        };
        var startsAt = NextSaturdayAtTen(DateTimeOffset.UtcNow);

        return new MissionPlan(
            title,
            description,
            GetParticipantsNeeded(issue),
            GetImpactPoints(issue),
            startsAt,
            startsAt.AddHours(2)
        );
    }

    private static int GetParticipantsNeeded(IssueEntity issue)
    {
        return issue.Severity switch
        {
            "high" => 10,
            "medium" => issue.Category is "waste" or "graffiti" ? 8 : 6,
            _ => 4
        };
    }

    private static int GetImpactPoints(IssueEntity issue)
    {
        return issue.Severity switch
        {
            "high" => 180,
            "medium" => 120,
            _ => 70
        };
    }

    private static DateTimeOffset NextSaturdayAtTen(DateTimeOffset now)
    {
        var daysUntilSaturday = ((int)DayOfWeek.Saturday - (int)now.DayOfWeek + 7) % 7;

        if (daysUntilSaturday == 0 && now.Hour >= 10)
        {
            daysUntilSaturday = 7;
        }

        return new DateTimeOffset(
            now.Date.AddDays(daysUntilSaturday).AddHours(10),
            TimeSpan.Zero
        );
    }

    private static void AddMissionAgentStep(
        IssueEntity issue,
        MissionEntity mission,
        MissionPlan plan,
        DateTimeOffset now
    )
    {
        var latestRun = issue.AgentRuns
            .OrderByDescending(run => run.CreatedAt)
            .FirstOrDefault();

        if (latestRun is null ||
            latestRun.AgentSteps.Any(step => step.AgentName == "Mission Agent"))
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
            AgentName = "Mission Agent",
            Status = "completed",
            InputJson = JsonSerializer.Serialize(new
            {
                issue.Id,
                issue.Category,
                issue.Severity,
                issue.ResponsibleActor,
                zone = issue.Zone?.Name
            }, JsonOptions),
            OutputJson = JsonSerializer.Serialize(new
            {
                mission.Id,
                mission.Title,
                mission.ParticipantsNeeded,
                mission.ImpactPoints,
                plan.StartsAt
            }, JsonOptions),
            Message = $"Created {mission.Title}.",
            StartedAt = now.AddMilliseconds(-180),
            CompletedAt = now,
            Order = nextOrder
        });
        latestRun.CompletedAt = now;
    }

    private sealed record MissionPlan(
        string Title,
        string Description,
        int ParticipantsNeeded,
        int ImpactPoints,
        DateTimeOffset StartsAt,
        DateTimeOffset EndsAt
    );
}
