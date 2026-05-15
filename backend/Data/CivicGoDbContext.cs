using CivicGo.Api.Data.Entities;
using CivicGo.Api.Issues;
using Microsoft.EntityFrameworkCore;

namespace CivicGo.Api.Data;

public sealed class CivicGoDbContext(DbContextOptions<CivicGoDbContext> options) : DbContext(options)
{
    public DbSet<UserEntity> Users => Set<UserEntity>();
    public DbSet<IssueEntity> Issues => Set<IssueEntity>();
    public DbSet<IssueImageEntity> IssueImages => Set<IssueImageEntity>();
    public DbSet<IssueAiAnalysisEntity> IssueAiAnalyses => Set<IssueAiAnalysisEntity>();
    public DbSet<AgentConfigEntity> AgentConfigs => Set<AgentConfigEntity>();
    public DbSet<AgentRunEntity> AgentRuns => Set<AgentRunEntity>();
    public DbSet<AgentStepEntity> AgentSteps => Set<AgentStepEntity>();
    public DbSet<MissionEntity> Missions => Set<MissionEntity>();
    public DbSet<MissionIssueEntity> MissionIssues => Set<MissionIssueEntity>();
    public DbSet<MissionParticipantEntity> MissionParticipants => Set<MissionParticipantEntity>();
    public DbSet<PartnerEntity> Partners => Set<PartnerEntity>();
    public DbSet<RewardEntity> Rewards => Set<RewardEntity>();
    public DbSet<RewardClaimEntity> RewardClaims => Set<RewardClaimEntity>();
    public DbSet<RankEntity> Ranks => Set<RankEntity>();
    public DbSet<BadgeEntity> Badges => Set<BadgeEntity>();
    public DbSet<UserBadgeEntity> UserBadges => Set<UserBadgeEntity>();
    public DbSet<UserPointsHistoryEntity> UserPointsHistory => Set<UserPointsHistoryEntity>();
    public DbSet<ZoneEntity> Zones => Set<ZoneEntity>();
    public DbSet<ZoneScoreEntity> ZoneScores => Set<ZoneScoreEntity>();
    public DbSet<PublicActivityFeedItemEntity> PublicActivityFeedItems => Set<PublicActivityFeedItemEntity>();

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        var zoneScoreDeltas = CollectZoneScoreDeltas();

        if (zoneScoreDeltas.Count > 0)
        {
            await ApplyZoneScoreDeltasAsync(zoneScoreDeltas, cancellationToken);
        }

        return await base.SaveChangesAsync(cancellationToken);
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<UserEntity>(entity =>
        {
            entity.ToTable("Users");
            entity.HasKey(user => user.Id);
            entity.HasIndex(user => user.SupabaseUserId).IsUnique();
            entity.Property(user => user.SupabaseUserId).HasMaxLength(120).IsRequired();
            entity.Property(user => user.Email).HasMaxLength(320).IsRequired();
            entity.Property(user => user.FullName).HasMaxLength(160).IsRequired();
            entity.Property(user => user.AvatarUrl).HasMaxLength(1024);
            entity.Property(user => user.Role).HasMaxLength(40).IsRequired();
            entity.HasOne(user => user.Rank).WithMany().HasForeignKey(user => user.RankId);
        });

        modelBuilder.Entity<RankEntity>(entity =>
        {
            entity.ToTable("Ranks");
            entity.HasKey(rank => rank.Id);
            entity.HasIndex(rank => rank.Name).IsUnique();
            entity.Property(rank => rank.Name).HasMaxLength(120).IsRequired();
            entity.Property(rank => rank.Icon).HasMaxLength(80).IsRequired();
            entity.Property(rank => rank.Description).HasMaxLength(500).IsRequired();
        });

        modelBuilder.Entity<BadgeEntity>(entity =>
        {
            entity.ToTable("Badges");
            entity.HasKey(badge => badge.Id);
            entity.HasIndex(badge => badge.Name).IsUnique();
            entity.Property(badge => badge.Name).HasMaxLength(120).IsRequired();
            entity.Property(badge => badge.Description).HasMaxLength(500).IsRequired();
            entity.Property(badge => badge.Icon).HasMaxLength(80).IsRequired();
            entity.Property(badge => badge.Category).HasMaxLength(80).IsRequired();
            entity.Property(badge => badge.RuleType).HasMaxLength(120).IsRequired();
            entity.Property(badge => badge.RuleValue).HasMaxLength(120).IsRequired();
        });

        modelBuilder.Entity<UserBadgeEntity>(entity =>
        {
            entity.ToTable("UserBadges");
            entity.HasKey(userBadge => userBadge.Id);
            entity.Property(userBadge => userBadge.SourceEvent).HasMaxLength(120).IsRequired();
            entity.HasIndex(userBadge => new { userBadge.UserId, userBadge.BadgeId }).IsUnique();
            entity.HasOne(userBadge => userBadge.User)
                .WithMany()
                .HasForeignKey(userBadge => userBadge.UserId);
            entity.HasOne(userBadge => userBadge.Badge)
                .WithMany()
                .HasForeignKey(userBadge => userBadge.BadgeId);
        });

        modelBuilder.Entity<UserPointsHistoryEntity>(entity =>
        {
            entity.ToTable("UserPointsHistory");
            entity.HasKey(history => history.Id);
            entity.Property(history => history.Reason).HasMaxLength(180).IsRequired();
            entity.Property(history => history.SourceType).HasMaxLength(120).IsRequired();
            entity.HasIndex(history => new { history.UserId, history.SourceType, history.SourceId }).IsUnique();
            entity.HasOne(history => history.User)
                .WithMany()
                .HasForeignKey(history => history.UserId);
        });

        modelBuilder.Entity<ZoneEntity>(entity =>
        {
            entity.ToTable("Zones");
            entity.HasKey(zone => zone.Id);
            entity.HasIndex(zone => zone.Name).IsUnique();
            entity.Property(zone => zone.Name).HasMaxLength(120).IsRequired();
            entity.Property(zone => zone.Description).HasMaxLength(500).IsRequired();
            entity.Property(zone => zone.PolygonGeoJson).HasColumnType("jsonb");
        });

        modelBuilder.Entity<ZoneScoreEntity>(entity =>
        {
            entity.ToTable("ZoneScores");
            entity.HasKey(score => score.Id);
            entity.HasIndex(score => new { score.ZoneId, score.CalculatedAt });
            entity.HasOne(score => score.Zone)
                .WithMany(zone => zone.Scores)
                .HasForeignKey(score => score.ZoneId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<IssueEntity>(entity =>
        {
            entity.ToTable("Issues");
            entity.HasKey(issue => issue.Id);
            entity.Property(issue => issue.Title).HasMaxLength(180).IsRequired();
            entity.Property(issue => issue.Description).HasMaxLength(1200);
            entity.Property(issue => issue.Category).HasMaxLength(80).IsRequired();
            entity.Property(issue => issue.Severity).HasMaxLength(40).IsRequired();
            entity.Property(issue => issue.Status).HasMaxLength(40).IsRequired();
            entity.Property(issue => issue.ResponsibleActor).HasMaxLength(80).IsRequired();
            entity.Property(issue => issue.ImageUrl).HasMaxLength(2048).IsRequired();
            entity.Property(issue => issue.AfterImageUrl).HasMaxLength(2048);
            entity.Property(issue => issue.LocationPoint).HasMaxLength(120);
            entity.HasOne(issue => issue.Zone).WithMany().HasForeignKey(issue => issue.ZoneId);
            entity.HasOne(issue => issue.CreatedByUser).WithMany().HasForeignKey(issue => issue.CreatedByUserId);
        });

        modelBuilder.Entity<IssueImageEntity>(entity =>
        {
            entity.ToTable("IssueImages");
            entity.HasKey(image => image.Id);
            entity.Property(image => image.Url).HasMaxLength(2048).IsRequired();
            entity.Property(image => image.ContentHash).HasMaxLength(128).IsRequired();
            entity.Property(image => image.FileName).HasMaxLength(260);
            entity.Property(image => image.ContentType).HasMaxLength(120);
            entity.HasIndex(image => image.ContentHash);
            entity.HasIndex(image => new { image.IssueId, image.SortOrder });
            entity.HasOne(image => image.Issue)
                .WithMany(issue => issue.Images)
                .HasForeignKey(image => image.IssueId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<IssueAiAnalysisEntity>(entity =>
        {
            entity.ToTable("IssueAiAnalyses");
            entity.HasKey(analysis => analysis.Id);
            entity.Property(analysis => analysis.Category).HasMaxLength(80).IsRequired();
            entity.Property(analysis => analysis.Severity).HasMaxLength(40).IsRequired();
            entity.Property(analysis => analysis.Summary).HasMaxLength(700).IsRequired();
            entity.Property(analysis => analysis.ResponsibleActor).HasMaxLength(80).IsRequired();
            entity.Property(analysis => analysis.SuggestedAction).HasMaxLength(700).IsRequired();
            entity.Property(analysis => analysis.RawResponseJson).HasColumnType("jsonb").IsRequired();
            entity.HasOne(analysis => analysis.Issue)
                .WithMany(issue => issue.AiAnalyses)
                .HasForeignKey(analysis => analysis.IssueId);
        });

        modelBuilder.Entity<AgentConfigEntity>(entity =>
        {
            entity.ToTable("AgentConfigs");
            entity.HasKey(agent => agent.Id);
            entity.HasIndex(agent => agent.Key).IsUnique();
            entity.Property(agent => agent.Key).HasMaxLength(80).IsRequired();
            entity.Property(agent => agent.Name).HasMaxLength(120).IsRequired();
            entity.Property(agent => agent.Role).HasMaxLength(120).IsRequired();
            entity.Property(agent => agent.Description).HasMaxLength(700).IsRequired();
            entity.Property(agent => agent.Instructions).HasMaxLength(2000).IsRequired();
            entity.Property(agent => agent.Model).HasMaxLength(120).IsRequired();
            entity.Property(agent => agent.FallbackMode).HasMaxLength(240).IsRequired();
            entity.HasIndex(agent => agent.SortOrder);
        });

        modelBuilder.Entity<AgentRunEntity>(entity =>
        {
            entity.ToTable("AgentRuns");
            entity.HasKey(run => run.Id);
            entity.Property(run => run.Status).HasMaxLength(40).IsRequired();
            entity.HasOne(run => run.Issue)
                .WithMany(issue => issue.AgentRuns)
                .HasForeignKey(run => run.IssueId);
        });

        modelBuilder.Entity<AgentStepEntity>(entity =>
        {
            entity.ToTable("AgentSteps");
            entity.HasKey(step => step.Id);
            entity.Property(step => step.AgentName).HasMaxLength(120).IsRequired();
            entity.Property(step => step.Status).HasMaxLength(40).IsRequired();
            entity.Property(step => step.InputJson).HasColumnType("jsonb").IsRequired();
            entity.Property(step => step.OutputJson).HasColumnType("jsonb").IsRequired();
            entity.Property(step => step.Message).HasMaxLength(700).IsRequired();
            entity.HasOne(step => step.AgentRun)
                .WithMany(run => run.AgentSteps)
                .HasForeignKey(step => step.AgentRunId);
            entity.HasIndex(step => new { step.AgentRunId, step.Order });
        });

        modelBuilder.Entity<MissionEntity>(entity =>
        {
            entity.ToTable("Missions");
            entity.HasKey(mission => mission.Id);
            entity.Property(mission => mission.Title).HasMaxLength(180).IsRequired();
            entity.Property(mission => mission.Description).HasMaxLength(1200).IsRequired();
            entity.Property(mission => mission.Status).HasMaxLength(40).IsRequired();
            entity.HasOne(mission => mission.Zone)
                .WithMany()
                .HasForeignKey(mission => mission.ZoneId);
            entity.HasOne(mission => mission.CreatedFromIssue)
                .WithMany()
                .HasForeignKey(mission => mission.CreatedFromIssueId)
                .OnDelete(DeleteBehavior.SetNull);
            entity.HasOne(mission => mission.Reward)
                .WithMany()
                .HasForeignKey(mission => mission.RewardId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<MissionIssueEntity>(entity =>
        {
            entity.ToTable("MissionIssues");
            entity.HasKey(missionIssue => missionIssue.Id);
            entity.HasIndex(missionIssue => new { missionIssue.MissionId, missionIssue.IssueId }).IsUnique();
            entity.HasOne(missionIssue => missionIssue.Mission)
                .WithMany(mission => mission.MissionIssues)
                .HasForeignKey(missionIssue => missionIssue.MissionId);
            entity.HasOne(missionIssue => missionIssue.Issue)
                .WithMany(issue => issue.MissionIssues)
                .HasForeignKey(missionIssue => missionIssue.IssueId);
        });

        modelBuilder.Entity<MissionParticipantEntity>(entity =>
        {
            entity.ToTable("MissionParticipants");
            entity.HasKey(participant => participant.Id);
            entity.Property(participant => participant.Status).HasMaxLength(40).IsRequired();
            entity.HasIndex(participant => new { participant.MissionId, participant.UserId }).IsUnique();
            entity.HasOne(participant => participant.Mission)
                .WithMany(mission => mission.Participants)
                .HasForeignKey(participant => participant.MissionId);
            entity.HasOne(participant => participant.User)
                .WithMany()
                .HasForeignKey(participant => participant.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<PartnerEntity>(entity =>
        {
            entity.ToTable("Partners");
            entity.HasKey(partner => partner.Id);
            entity.HasIndex(partner => partner.Name).IsUnique();
            entity.Property(partner => partner.Name).HasMaxLength(140).IsRequired();
            entity.Property(partner => partner.LogoUrl).HasMaxLength(1024);
            entity.Property(partner => partner.Description).HasMaxLength(700).IsRequired();
            entity.Property(partner => partner.WebsiteUrl).HasMaxLength(1024);
            entity.Property(partner => partner.ContactEmail).HasMaxLength(320);
        });

        modelBuilder.Entity<RewardEntity>(entity =>
        {
            entity.ToTable("Rewards");
            entity.HasKey(reward => reward.Id);
            entity.HasIndex(reward => reward.Title);
            entity.Property(reward => reward.Type).HasMaxLength(40).IsRequired();
            entity.Property(reward => reward.Title).HasMaxLength(180).IsRequired();
            entity.Property(reward => reward.Description).HasMaxLength(900).IsRequired();
            entity.Property(reward => reward.Status).HasMaxLength(40).IsRequired();
            entity.HasOne(reward => reward.Partner)
                .WithMany(partner => partner.Rewards)
                .HasForeignKey(reward => reward.PartnerId)
                .OnDelete(DeleteBehavior.SetNull);
            entity.HasOne(reward => reward.Mission)
                .WithMany()
                .HasForeignKey(reward => reward.MissionId)
                .OnDelete(DeleteBehavior.SetNull);
            entity.HasOne(reward => reward.Zone)
                .WithMany()
                .HasForeignKey(reward => reward.ZoneId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<RewardClaimEntity>(entity =>
        {
            entity.ToTable("RewardClaims");
            entity.HasKey(claim => claim.Id);
            entity.Property(claim => claim.Status).HasMaxLength(40).IsRequired();
            entity.Property(claim => claim.Code).HasMaxLength(80).IsRequired();
            entity.HasIndex(claim => new { claim.RewardId, claim.UserId }).IsUnique();
            entity.HasOne(claim => claim.Reward)
                .WithMany()
                .HasForeignKey(claim => claim.RewardId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(claim => claim.User)
                .WithMany()
                .HasForeignKey(claim => claim.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(claim => claim.Mission)
                .WithMany()
                .HasForeignKey(claim => claim.MissionId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<PublicActivityFeedItemEntity>(entity =>
        {
            entity.ToTable("PublicActivityFeedItems");
            entity.HasKey(item => item.Id);
            entity.Property(item => item.Type).HasMaxLength(80).IsRequired();
            entity.Property(item => item.Title).HasMaxLength(180).IsRequired();
            entity.Property(item => item.Message).HasMaxLength(500).IsRequired();
        });
    }

    private List<ZoneScoreDelta> CollectZoneScoreDeltas()
    {
        var deltas = ChangeTracker
            .Entries<MissionEntity>()
            .Where(entry => entry.State == EntityState.Added && entry.Entity.ZoneId.HasValue)
            .Select(entry => CreateMissionCreatedDelta(entry.Entity))
            .ToList();

        deltas.AddRange(
            ChangeTracker
                .Entries<IssueEntity>()
                .Where(entry =>
                    entry.State == EntityState.Modified &&
                    entry.Entity.ZoneId.HasValue &&
                    IsNewlyResolved(entry)
                )
                .Select(entry => CreateIssueResolvedDelta(entry.Entity))
        );

        return deltas;
    }

    private async Task ApplyZoneScoreDeltasAsync(
        IReadOnlyCollection<ZoneScoreDelta> deltas,
        CancellationToken cancellationToken
    )
    {
        var zoneIds = deltas
            .Select(delta => delta.ZoneId)
            .Distinct()
            .ToArray();
        var zones = await Zones
            .Where(zone => zoneIds.Contains(zone.Id))
            .ToDictionaryAsync(zone => zone.Id, cancellationToken);
        var latestScores = await ZoneScores
            .Where(score => zoneIds.Contains(score.ZoneId))
            .OrderByDescending(score => score.CalculatedAt)
            .ToListAsync(cancellationToken);
        var latestScoreByZone = latestScores
            .GroupBy(score => score.ZoneId)
            .ToDictionary(group => group.Key, group => group.First());
        var now = DateTimeOffset.UtcNow;

        foreach (var zoneDeltas in deltas.GroupBy(delta => delta.ZoneId))
        {
            if (!zones.TryGetValue(zoneDeltas.Key, out var zone))
            {
                continue;
            }

            var latestScore = latestScoreByZone.GetValueOrDefault(zone.Id);
            var baseline = latestScore is null
                ? ZoneScoreBaseline.FromZone(zone)
                : ZoneScoreBaseline.FromScore(latestScore);
            var cleanlinessScore = baseline.CleanlinessScore + zoneDeltas.Sum(delta => delta.CleanlinessDelta);
            var communityScore = baseline.CommunityScore + zoneDeltas.Sum(delta => delta.CommunityDelta);
            var safetyScore = baseline.SafetyScore + zoneDeltas.Sum(delta => delta.SafetyDelta);
            var engagementScore = baseline.EngagementScore + zoneDeltas.Sum(delta => delta.EngagementDelta);
            var totalScore = cleanlinessScore + communityScore + safetyScore + engagementScore;

            zone.Score = totalScore;
            zone.UpdatedAt = now;
            ZoneScores.Add(new ZoneScoreEntity
            {
                Id = Guid.NewGuid(),
                ZoneId = zone.Id,
                CleanlinessScore = cleanlinessScore,
                CommunityScore = communityScore,
                SafetyScore = safetyScore,
                EngagementScore = engagementScore,
                TotalScore = totalScore,
                CalculatedAt = now
            });
        }
    }

    private static ZoneScoreDelta CreateMissionCreatedDelta(MissionEntity mission)
    {
        var impactPoints = Math.Clamp(
            mission.ImpactPoints <= 0 ? 80 : mission.ImpactPoints,
            40,
            180
        );
        var communityDelta = (int)Math.Round(impactPoints * 0.45);
        var engagementDelta = (int)Math.Round(impactPoints * 0.35);
        var safetyDelta = impactPoints - communityDelta - engagementDelta;

        return new ZoneScoreDelta(
            mission.ZoneId!.Value,
            CleanlinessDelta: 0,
            CommunityDelta: communityDelta,
            SafetyDelta: safetyDelta,
            EngagementDelta: engagementDelta
        );
    }

    private static ZoneScoreDelta CreateIssueResolvedDelta(IssueEntity issue)
    {
        var zoneId = issue.ZoneId!.Value;

        return issue.Category switch
        {
            "waste" or IssueCategories.SanitationPestSnow =>
                new ZoneScoreDelta(zoneId, 35, 10, 0, 5),
            "graffiti" => new ZoneScoreDelta(zoneId, 30, 15, 0, 5),
            "green_space_issue" or "green_space" or IssueCategories.EnvironmentPlaygroundsGreenSpaces =>
                new ZoneScoreDelta(zoneId, 25, 20, 0, 5),
            "broken_lighting" or IssueCategories.PublicLighting =>
                new ZoneScoreDelta(zoneId, 0, 10, 35, 5),
            "road_damage" or "blocked_sidewalk" or "accessibility_issue" or
                IssueCategories.StreetsSidewalks or IssueCategories.RoadTrafficSigns =>
                new ZoneScoreDelta(zoneId, 0, 15, 30, 5),
            IssueCategories.PublicOrder => new ZoneScoreDelta(zoneId, 0, 20, 20, 10),
            _ => new ZoneScoreDelta(zoneId, 0, 30, 0, 20)
        };
    }

    private static bool IsNewlyResolved(Microsoft.EntityFrameworkCore.ChangeTracking.EntityEntry<IssueEntity> entry)
    {
        var wasResolved =
            IsResolvedStatus(entry.OriginalValues.GetValue<string>(nameof(IssueEntity.Status))) ||
            entry.OriginalValues.GetValue<DateTimeOffset?>(nameof(IssueEntity.ResolvedAt)) is not null;
        var isResolved =
            IsResolvedStatus(entry.Entity.Status) ||
            entry.Entity.ResolvedAt is not null;

        return !wasResolved && isResolved;
    }

    private static bool IsResolvedStatus(string status)
    {
        return status.Equals("resolved", StringComparison.OrdinalIgnoreCase) ||
            status.Equals("issue_resolved", StringComparison.OrdinalIgnoreCase);
    }

    private readonly record struct ZoneScoreDelta(
        Guid ZoneId,
        int CleanlinessDelta,
        int CommunityDelta,
        int SafetyDelta,
        int EngagementDelta
    );

    private readonly record struct ZoneScoreBaseline(
        int CleanlinessScore,
        int CommunityScore,
        int SafetyScore,
        int EngagementScore
    )
    {
        public static ZoneScoreBaseline FromZone(ZoneEntity zone)
        {
            var cleanlinessScore = (int)Math.Round(zone.Score * 0.30);
            var communityScore = (int)Math.Round(zone.Score * 0.25);
            var safetyScore = (int)Math.Round(zone.Score * 0.25);
            var engagementScore = Math.Max(
                0,
                zone.Score - cleanlinessScore - communityScore - safetyScore
            );

            return new ZoneScoreBaseline(
                cleanlinessScore,
                communityScore,
                safetyScore,
                engagementScore
            );
        }

        public static ZoneScoreBaseline FromScore(ZoneScoreEntity score)
        {
            return new ZoneScoreBaseline(
                score.CleanlinessScore,
                score.CommunityScore,
                score.SafetyScore,
                score.EngagementScore
            );
        }
    }
}
