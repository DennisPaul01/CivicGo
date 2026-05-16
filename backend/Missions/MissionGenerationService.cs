using CivicGo.Api.Agents;
using CivicGo.Api.Data;
using CivicGo.Api.Data.Entities;
using CivicGo.Api.Issues;
using Microsoft.EntityFrameworkCore;

namespace CivicGo.Api.Missions;

public sealed class MissionGenerationService(
    CivicGoDbContext dbContext,
    ILogger<MissionGenerationService> logger
)
{
    private static readonly HashSet<string> LargeWasteMissionCategories = new(StringComparer.OrdinalIgnoreCase)
    {
        IssueCategories.SanitationPestSnow,
        "waste",
        "abandoned_object"
    };

    private static readonly string[] LargeWasteSignals =
    [
        "moloz",
        "sac",
        "saci",
        "gramada",
        "gramezi",
        "deseuri voluminoase",
        "deseuri mari",
        "gunoi mult",
        "gunoaie multe",
        "mobila",
        "canapea",
        "saltea",
        "dulap",
        "frigider",
        "electrocasnice",
        "containere pline",
        "container plin",
        "cosuri pline",
        "depozit ilegal",
        "depozitare ilegala",
        "resturi constructii",
        "resturi de constructii",
        "morman",
        "abandonate",
        "abandonata",
        "abandonat"
    ];

    private static readonly string[] SmallWasteSignals =
    [
        "o sticla",
        "sticla pe",
        "un ambalaj",
        "ambalaj",
        "hartie",
        "hirtie",
        "o hartie",
        "doza",
        "o doza",
        "gunoi mic",
        "un gunoi",
        "un pet",
        "pet pe",
        "mucuri",
        "muc de tigara",
        "punga",
        "servetel"
    ];

    public async Task<MissionResponse?> EnsureMissionForIssueAsync(
        Guid issueId,
        RuntimeAgentConfig? agentConfig,
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

        existingMission = await dbContext.Missions
            .Include(mission => mission.Zone)
            .Include(mission => mission.Reward)
                .ThenInclude(reward => reward!.Partner)
            .Include(mission => mission.Participants)
            .Include(mission => mission.MissionIssues)
            .Where(mission => mission.CreatedFromIssueId == issue.Id)
            .OrderByDescending(mission => mission.CreatedAt)
            .FirstOrDefaultAsync(cancellationToken);

        if (existingMission is not null)
        {
            if (existingMission.MissionIssues.All(link => link.IssueId != issue.Id))
            {
                var linkCreatedAt = DateTimeOffset.UtcNow;
                dbContext.MissionIssues.Add(new MissionIssueEntity
                {
                    Id = Guid.NewGuid(),
                    MissionId = existingMission.Id,
                    IssueId = issue.Id,
                    CreatedAt = linkCreatedAt
                });
                existingMission.UpdatedAt = linkCreatedAt;
                await dbContext.SaveChangesAsync(cancellationToken);
            }

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

        var missionPlan = CreateMissionPlan(issue, agentConfig);
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
        issue.Status = "mission_created";
        issue.UpdatedAt = now;

        dbContext.Missions.Add(mission);
        dbContext.MissionIssues.Add(missionIssue);
        dbContext.PublicActivityFeedItems.Add(new PublicActivityFeedItemEntity
        {
            Id = Guid.NewGuid(),
            Type = "mission_created",
            Title = "Misiune creata",
            Message = $"{mission.Title} este acum activa in {issue.Zone?.Name ?? "Timisoara"}.",
            RelatedIssueId = issue.Id,
            RelatedMissionId = mission.Id,
            RelatedZoneId = issue.ZoneId,
            CreatedAt = now
        });

        if (!await TrySaveMissionAsync(issue.Id, cancellationToken))
        {
            return null;
        }

        return MissionMapper.ToResponse(mission);
    }

    public Task<MissionResponse?> EnsureMissionForIssueAsync(
        Guid issueId,
        CancellationToken cancellationToken
    )
    {
        return EnsureMissionForIssueAsync(issueId, null, cancellationToken);
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

        if (issue.Severity == "critical" ||
            issue.ResponsibleActor is not ("community" or "community_and_city_hall"))
        {
            return false;
        }

        return IsLargeWasteIssue(issue);
    }

    private static bool IsLargeWasteIssue(IssueEntity issue)
    {
        if (!LargeWasteMissionCategories.Contains(issue.Category))
        {
            return false;
        }

        var text = $"{issue.Title} {issue.Description}".ToLowerInvariant();
        var hasLargeWasteSignal = ContainsAny(text, LargeWasteSignals);

        if (issue.Category.Equals("abandoned_object", StringComparison.OrdinalIgnoreCase) &&
            !hasLargeWasteSignal)
        {
            return false;
        }

        if (ContainsAny(text, SmallWasteSignals) && !hasLargeWasteSignal)
        {
            return false;
        }

        return issue.Severity switch
        {
            "high" => true,
            "medium" => hasLargeWasteSignal,
            _ => false
        };
    }

    private static MissionPlan CreateMissionPlan(
        IssueEntity issue,
        RuntimeAgentConfig? agentConfig
    )
    {
        var zoneName = issue.Zone?.Name ?? "Timisoara";
        var title = issue.Category switch
        {
            "waste" => $"Curatenie comunitara in {zoneName}",
            "abandoned_object" => $"Ridicare deseuri voluminoase in {zoneName}",
            IssueCategories.SanitationPestSnow =>
                $"Curatenie comunitara in {zoneName}",
            _ => $"Verificare civica in {zoneName}"
        };
        var description = issue.Category switch
        {
            "waste" or "abandoned_object" or IssueCategories.SanitationPestSnow =>
                $"Misiune comunitara de curatenie generata din raportul de deseuri mari din {zoneName}. Voluntarii pot documenta zona, strange deseuri vizibile unde este sigur si pregati cazul pentru primarie.",
            _ =>
                $"Misiune comunitara generata dintr-o problema mare de salubrizare in {zoneName}. Participantii pot verifica locatia, adauga context si ajuta problema sa avanseze spre rezolvare."
        };
        var configuredInstructions = agentConfig?.Instructions?.Trim();
        if (!string.IsNullOrWhiteSpace(configuredInstructions))
        {
            description = $"{description} Nota admin pentru agent: {Truncate(configuredInstructions, 220)}";
        }

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
            "medium" => 8,
            _ => 6
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

    private sealed record MissionPlan(
        string Title,
        string Description,
        int ParticipantsNeeded,
        int ImpactPoints,
        DateTimeOffset StartsAt,
        DateTimeOffset EndsAt
    );

    private static string Truncate(string value, int maxLength)
    {
        if (value.Length <= maxLength)
        {
            return value;
        }

        return $"{value[..Math.Max(0, maxLength - 1)]}.";
    }

    private static bool ContainsAny(string value, IEnumerable<string> signals)
    {
        return signals.Any(signal => value.Contains(signal, StringComparison.OrdinalIgnoreCase));
    }
}
