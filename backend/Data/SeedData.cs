using System.Text.Json;
using CivicGo.Api.Data.Entities;
using Microsoft.EntityFrameworkCore;

namespace CivicGo.Api.Data;

public static class SeedData
{
    private const string DemoAdminEmail = "admin@civicgo.demo";
    private const string DemoAdminSupabaseUserId = "demo-admin-local";

    public static async Task EnsureSeedDataAsync(CivicGoDbContext dbContext)
    {
        await EnsureZonesAsync(dbContext);
        await EnsureRanksAsync(dbContext);
        await EnsureDemoAdminAsync(dbContext);
        await EnsureDemoIssuesAsync(dbContext);
        await EnsureBadgesAsync(dbContext);
        await EnsurePartnersAsync(dbContext);
        await EnsureRewardsAsync(dbContext);
        await EnsureDemoMissionsAsync(dbContext);
    }

    private static async Task EnsureZonesAsync(CivicGoDbContext dbContext)
    {
        var now = DateTimeOffset.UtcNow;
        var zones = new[]
        {
            CreateZone("Girocului", "Residential zone with active road and cleanup reports.", 420, 45.7339, 21.2114, now),
            CreateZone("Complex", "Student area with high civic activity and sidewalk reports.", 510, 45.7531, 21.2325, now),
            CreateZone("Fabric", "Historic neighborhood with public lighting and safety reports.", 380, 45.7603, 21.2422, now),
            CreateZone("Soarelui", "Green-space focused zone for community checks.", 360, 45.7366, 21.2468, now),
            CreateZone("Mehala", "Priority zone for safety and accessibility follow-up.", 290, 45.7672, 21.1947, now)
        };
        var existingNames = await dbContext.Zones
            .Select(zone => zone.Name)
            .ToListAsync();
        var missingZones = zones
            .Where(zone => !existingNames.Contains(zone.Name, StringComparer.OrdinalIgnoreCase))
            .ToArray();

        if (missingZones.Length == 0)
        {
            return;
        }

        dbContext.Zones.AddRange(missingZones);
        await dbContext.SaveChangesAsync();
    }

    private static async Task EnsureRanksAsync(CivicGoDbContext dbContext)
    {
        var ranks = new[]
        {
            CreateRank("New Citizen", 0, 99, "leaf", "Fresh civic profile, ready for the first city action.", 1),
            CreateRank("Civic Rookie", 100, 299, "sprout", "Early contributor with visible reporting momentum.", 2),
            CreateRank("Neighborhood Helper", 300, 699, "map-pin", "Trusted helper for local zone improvements.", 3),
            CreateRank("Community Builder", 700, 1499, "users", "Consistent mission and reporting contributor.", 4),
            CreateRank("City Guardian", 1500, 2999, "shield", "High-impact citizen helping multiple zones.", 5),
            CreateRank("Civic Hero", 3000, 5999, "trophy", "Major contributor with sustained civic impact.", 6),
            CreateRank("Urban Legend", 6000, int.MaxValue, "star", "Top-tier CivicGO contributor.", 7)
        };
        var existingNames = await dbContext.Ranks
            .Select(rank => rank.Name)
            .ToListAsync();
        var missingRanks = ranks
            .Where(rank => !existingNames.Contains(rank.Name, StringComparer.OrdinalIgnoreCase))
            .ToArray();

        if (missingRanks.Length == 0)
        {
            return;
        }

        dbContext.Ranks.AddRange(missingRanks);
        await dbContext.SaveChangesAsync();
    }

    private static async Task EnsureDemoAdminAsync(CivicGoDbContext dbContext)
    {
        var now = DateTimeOffset.UtcNow;
        var initialRank = await dbContext.Ranks
            .OrderBy(rank => rank.MinPoints)
            .FirstOrDefaultAsync();
        var existingAdmin = await dbContext.Users
            .FirstOrDefaultAsync(user =>
                user.Email == DemoAdminEmail ||
                user.SupabaseUserId == DemoAdminSupabaseUserId
            );

        if (existingAdmin is not null)
        {
            var changed = false;

            if (existingAdmin.Email != DemoAdminEmail)
            {
                existingAdmin.Email = DemoAdminEmail;
                changed = true;
            }

            if (existingAdmin.FullName != "CivicGO Admin")
            {
                existingAdmin.FullName = "CivicGO Admin";
                changed = true;
            }

            if (existingAdmin.Role != "admin")
            {
                existingAdmin.Role = "admin";
                changed = true;
            }

            if (existingAdmin.RankId is null && initialRank is not null)
            {
                existingAdmin.RankId = initialRank.Id;
                changed = true;
            }

            if (changed)
            {
                existingAdmin.UpdatedAt = now;
                await dbContext.SaveChangesAsync();
            }

            return;
        }

        dbContext.Users.Add(new UserEntity
        {
            Id = Guid.NewGuid(),
            SupabaseUserId = DemoAdminSupabaseUserId,
            Email = DemoAdminEmail,
            FullName = "CivicGO Admin",
            Role = "admin",
            Points = 0,
            RankId = initialRank?.Id,
            TrustScore = 100,
            CreatedAt = now,
            UpdatedAt = now
        });
        await dbContext.SaveChangesAsync();
    }

    private static async Task EnsureDemoIssuesAsync(CivicGoDbContext dbContext)
    {
        var now = DateTimeOffset.UtcNow;
        var demoReporter = await dbContext.Users
            .FirstAsync(user => user.Email == DemoAdminEmail);
        var zones = await dbContext.Zones.ToDictionaryAsync(
            zone => zone.Name,
            StringComparer.OrdinalIgnoreCase
        );
        var demoIssues = new[]
        {
            new DemoIssueSeed(
                "Demo issue: overflowing bins near Complex tram stop",
                "Overflowing public bins are blocking the tram stop edge and need a quick pickup.",
                "other",
                "medium",
                "new",
                "unknown",
                "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=1200&q=80",
                null,
                45.7531,
                21.2325,
                "Complex",
                1,
                0,
                now.AddHours(-2),
                null,
                "Fresh report waiting for AI analysis and city triage.",
                "Run AI triage and decide whether this should become a cleanup mission.",
                0.72,
                false,
                true
            ),
            new DemoIssueSeed(
                "Demo issue: broken streetlight in Fabric courtyard",
                "A broken streetlight leaves the entrance to a shared courtyard dark after sunset.",
                "lighting",
                "high",
                "ai_analyzed",
                "city_hall",
                "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
                null,
                45.7603,
                21.2422,
                "Fabric",
                4,
                0,
                now.AddHours(-8),
                null,
                "The report points to a high-priority lighting issue near a residential courtyard.",
                "Ask city maintenance to inspect the fixture and assign a repair window.",
                0.91,
                true,
                false
            ),
            new DemoIssueSeed(
                "Demo issue: duplicate sidewalk reports in Girocului",
                "Several citizens reported the same uneven sidewalk segment near the market crossing.",
                "road_damage",
                "medium",
                "duplicate_detected",
                "city_hall",
                "https://images.unsplash.com/photo-1523731407965-2430cd12f5e4?auto=format&fit=crop&w=1200&q=80",
                null,
                45.7339,
                21.2114,
                "Girocului",
                6,
                3,
                now.AddHours(-14),
                null,
                "Nearby reports likely describe the same sidewalk hazard in Girocului.",
                "Merge duplicate reports before assigning the repair follow-up.",
                0.87,
                false,
                false
            ),
            new DemoIssueSeed(
                "Demo issue: loose paving stones under review",
                "Loose paving stones on a pedestrian route are being checked by the civic team.",
                "road_damage",
                "medium",
                "in_review",
                "city_hall",
                "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80",
                null,
                45.7366,
                21.2468,
                "Soarelui",
                5,
                0,
                now.AddDays(-1).AddHours(-2),
                null,
                "The issue is valid and needs a short field review before repair assignment.",
                "Confirm the exact pavement segment and move it into in-progress work.",
                0.84,
                false,
                false
            ),
            new DemoIssueSeed(
                "Demo issue: blocked sidewalk in progress",
                "A blocked sidewalk near the school route has been accepted and is being handled.",
                "blocked_sidewalk",
                "high",
                "in_progress",
                "community_and_city_hall",
                "https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=1200&q=80",
                null,
                45.7368,
                21.2481,
                "Soarelui",
                9,
                0,
                now.AddDays(-1).AddHours(-8),
                null,
                "The sidewalk blockage affects a school walking route and is already in progress.",
                "Keep the route visible on the map until the blockage is removed.",
                0.93,
                true,
                true
            ),
            new DemoIssueSeed(
                "Demo issue: Mehala cleanup mission ready",
                "A small park edge in Mehala needs a community cleanup and volunteer coordination.",
                "waste",
                "medium",
                "mission_created",
                "community_and_city_hall",
                "https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=1200&q=80",
                null,
                45.7672,
                21.1947,
                "Mehala",
                7,
                0,
                now.AddDays(-2),
                null,
                "The issue is eligible for a visible community cleanup mission in Mehala.",
                "Attach an active mission and keep the reward match visible for volunteers.",
                0.89,
                false,
                true
            ),
            new DemoIssueSeed(
                "Demo issue: graffiti cleanup resolved in Complex",
                "Graffiti near the underpass was reported, reviewed and marked as resolved.",
                "graffiti",
                "low",
                "resolved",
                "community_and_city_hall",
                "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=1200&q=80",
                "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1200&q=80",
                45.7526,
                21.2318,
                "Complex",
                11,
                0,
                now.AddDays(-5),
                now.AddDays(-1),
                "The graffiti report has been resolved and is ready for before-after proof.",
                "Add the after photo in the next demo data pass.",
                0.88,
                false,
                false
            ),
            new DemoIssueSeed(
                "Demo issue: Fabric green path restored",
                "A damaged green-space path in Fabric was fixed after community reporting.",
                "green_space",
                "medium",
                "resolved",
                "community_and_city_hall",
                "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&w=1200&q=80",
                "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=80",
                45.7599,
                21.243,
                "Fabric",
                8,
                0,
                now.AddDays(-6),
                now.AddHours(-18),
                "The green-space path is resolved and can anchor the Friday impact story.",
                "Add an after photo and show it together with zone score progress.",
                0.86,
                false,
                false
            )
        };
        var demoTitles = demoIssues.Select(issue => issue.Title).ToArray();
        var existingIssues = await dbContext.Issues
            .Where(issue => demoTitles.Contains(issue.Title))
            .ToListAsync();
        var changedExistingIssues = false;
        var existingIssuesByTitle = existingIssues.ToDictionary(
            issue => issue.Title,
            StringComparer.OrdinalIgnoreCase
        );

        foreach (var demoIssue in demoIssues)
        {
            if (!existingIssuesByTitle.TryGetValue(demoIssue.Title, out var existingIssue))
            {
                continue;
            }

            var issueChanged = false;
            var zone = zones.GetValueOrDefault(demoIssue.ZoneName);
            var updatedAt = demoIssue.ResolvedAt ?? demoIssue.CreatedAt.AddMinutes(45);

            if (existingIssue.Status != demoIssue.Status)
            {
                existingIssue.Status = demoIssue.Status;
                issueChanged = true;
            }

            if (existingIssue.AfterImageUrl != demoIssue.AfterImageUrl)
            {
                existingIssue.AfterImageUrl = demoIssue.AfterImageUrl;
                issueChanged = true;
            }

            if (existingIssue.ResolvedAt != demoIssue.ResolvedAt)
            {
                existingIssue.ResolvedAt = demoIssue.ResolvedAt;
                issueChanged = true;
            }

            if (existingIssue.ConfirmedCount != demoIssue.ConfirmedCount)
            {
                existingIssue.ConfirmedCount = demoIssue.ConfirmedCount;
                issueChanged = true;
            }

            if (existingIssue.DuplicateCount != demoIssue.DuplicateCount)
            {
                existingIssue.DuplicateCount = demoIssue.DuplicateCount;
                issueChanged = true;
            }

            if (zone is not null && existingIssue.ZoneId != zone.Id)
            {
                existingIssue.ZoneId = zone.Id;
                issueChanged = true;
            }

            if (issueChanged)
            {
                existingIssue.UpdatedAt = updatedAt;
                changedExistingIssues = true;
            }
        }

        if (changedExistingIssues)
        {
            await dbContext.SaveChangesAsync();
        }

        var existingTitles = existingIssues
            .Select(issue => issue.Title)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);
        var newIssues = demoIssues
            .Where(issue => !existingTitles.Contains(issue.Title))
            .Select(issue => CreateDemoIssue(issue, zones, demoReporter.Id))
            .ToArray();

        if (newIssues.Length > 0)
        {
            dbContext.Issues.AddRange(newIssues);
            await dbContext.SaveChangesAsync();
        }

        var seededIssues = existingIssues
            .Concat(newIssues)
            .ToDictionary(issue => issue.Title, StringComparer.OrdinalIgnoreCase);
        var seededIssueIds = seededIssues.Values
            .Select(issue => issue.Id)
            .ToArray();
        var analyzedIssueIds = (await dbContext.IssueAiAnalyses
            .Where(analysis => seededIssueIds.Contains(analysis.IssueId))
            .Select(analysis => analysis.IssueId)
            .ToListAsync())
            .ToHashSet();
        var missingAnalyses = demoIssues
            .Where(issue => issue.Status != "new")
            .Where(issue => seededIssues.ContainsKey(issue.Title))
            .Select(issue => new
            {
                Seed = issue,
                Issue = seededIssues[issue.Title]
            })
            .Where(item => !analyzedIssueIds.Contains(item.Issue.Id))
            .Select(item => CreateDemoAnalysis(item.Seed, item.Issue.Id))
            .ToArray();

        if (missingAnalyses.Length > 0)
        {
            dbContext.IssueAiAnalyses.AddRange(missingAnalyses);
            await dbContext.SaveChangesAsync();
        }
    }

    private static async Task EnsureBadgesAsync(CivicGoDbContext dbContext)
    {
        var now = DateTimeOffset.UtcNow;
        var badges = new[]
        {
            CreateBadge("First Reporter", "Unlocked after the first valid issue report.", "camera", "reporting", "valid_report_count", "1", 0, now),
            CreateBadge("AI Scout", "Unlocked after the first AI-analyzed report.", "sparkles", "ai", "ai_analyzed_report_count", "1", 0, now),
            CreateBadge("Clean-up Hero", "Unlocked after joining the first clean-up mission.", "flag", "missions", "cleanup_join_count", "1", 0, now),
            CreateBadge("Before/After Hero", "Unlocked after uploading the first after photo.", "image", "impact", "after_photo_count", "1", 0, now),
            CreateBadge("Problem Solver", "Unlocked after helping close the first resolved issue.", "check-circle", "impact", "resolved_issue_count", "1", 50, now),
            CreateBadge("Trusted Reporter", "Unlocked after three valid reports in the same zone.", "shield-check", "reporting", "valid_report_count", "3", 75, now),
            CreateBadge("Zone Champion", "Unlocked after leading weekly points in one zone.", "trophy", "zones", "weekly_zone_rank", "1", 100, now)
        };
        var existingNames = await dbContext.Badges
            .Select(badge => badge.Name)
            .ToListAsync();
        var missingBadges = badges
            .Where(badge => !existingNames.Contains(badge.Name, StringComparer.OrdinalIgnoreCase))
            .ToArray();

        if (missingBadges.Length == 0)
        {
            return;
        }

        dbContext.Badges.AddRange(missingBadges);
        await dbContext.SaveChangesAsync();
    }

    private static async Task EnsurePartnersAsync(CivicGoDbContext dbContext)
    {
        var now = DateTimeOffset.UtcNow;
        var partners = new[]
        {
            CreatePartner(
                "CoffeeLab",
                "Local coffee partner supporting clean-up missions with small thank-you rewards.",
                "https://coffeelab.example",
                "hello@coffeelab.example",
                now
            ),
            CreatePartner(
                "Local Gym",
                "Neighborhood fitness partner backing active civic weekends.",
                "https://localgym.example",
                "partners@localgym.example",
                now
            ),
            CreatePartner(
                "Bookstore",
                "Independent bookstore rewarding citizens who document and improve their area.",
                "https://bookstore.example",
                "hello@bookstore.example",
                now
            ),
            CreatePartner(
                "Restaurant",
                "Local restaurant offering limited rewards for completed civic missions.",
                "https://restaurant.example",
                "community@restaurant.example",
                now
            ),
            CreatePartner(
                "Coworking Space",
                "Workspace partner supporting high-impact community builders.",
                "https://coworking.example",
                "team@coworking.example",
                now
            )
        };
        var existingNames = await dbContext.Partners
            .Select(partner => partner.Name)
            .ToListAsync();
        var missingPartners = partners
            .Where(partner => !existingNames.Contains(partner.Name, StringComparer.OrdinalIgnoreCase))
            .ToArray();

        if (missingPartners.Length == 0)
        {
            return;
        }

        dbContext.Partners.AddRange(missingPartners);
        await dbContext.SaveChangesAsync();
    }

    private static async Task EnsureRewardsAsync(CivicGoDbContext dbContext)
    {
        var now = DateTimeOffset.UtcNow;
        var partners = await dbContext.Partners.ToDictionaryAsync(
            partner => partner.Name,
            StringComparer.OrdinalIgnoreCase
        );
        var zones = await dbContext.Zones.ToDictionaryAsync(
            zone => zone.Name,
            StringComparer.OrdinalIgnoreCase
        );
        var rewards = new[]
        {
            CreateReward(
                "system",
                null,
                "Civic Points starter boost",
                "A system reward that celebrates the first real contribution and keeps progress visible.",
                0,
                500,
                now.AddMonths(3),
                null,
                now
            ),
            CreateReward(
                "system",
                null,
                "First Reporter achievement card",
                "A CivicGO achievement card for citizens who submit a valid first report.",
                0,
                500,
                null,
                null,
                now
            ),
            CreateReward(
                "system",
                null,
                "Neighborhood Helper progress",
                "A rank progress reward for users moving toward stronger local impact.",
                100,
                250,
                null,
                null,
                now
            ),
            CreateReward(
                "system",
                null,
                "Zone Champion title preview",
                "A demo system reward for citizens leading activity in one Timisoara zone.",
                300,
                100,
                null,
                zones.GetValueOrDefault("Girocului")?.Id,
                now
            ),
            CreateReward(
                "partner",
                partners.GetValueOrDefault("CoffeeLab")?.Id,
                "Free cappuccino",
                "CoffeeLab reward matched to clean-up and waste missions for Friday demo.",
                30,
                40,
                now.AddMonths(1),
                zones.GetValueOrDefault("Girocului")?.Id,
                now
            ),
            CreateReward(
                "partner",
                partners.GetValueOrDefault("Local Gym")?.Id,
                "Free day pass",
                "A movement-friendly reward for citizens who join active weekend missions.",
                100,
                20,
                now.AddMonths(1),
                zones.GetValueOrDefault("Soarelui")?.Id,
                now
            ),
            CreateReward(
                "partner",
                partners.GetValueOrDefault("Bookstore")?.Id,
                "15% bookstore discount",
                "A local reading reward for consistent civic contributors.",
                300,
                35,
                now.AddMonths(2),
                zones.GetValueOrDefault("Complex")?.Id,
                now
            ),
            CreateReward(
                "partner",
                partners.GetValueOrDefault("Restaurant")?.Id,
                "Free dessert",
                "A limited partner reward for mission finishers and community builders.",
                700,
                15,
                now.AddMonths(2),
                zones.GetValueOrDefault("Fabric")?.Id,
                now
            ),
            CreateReward(
                "partner",
                partners.GetValueOrDefault("Coworking Space")?.Id,
                "Coworking day ticket",
                "A partner reward for high-impact citizens and zone captains.",
                1500,
                10,
                now.AddMonths(3),
                zones.GetValueOrDefault("Mehala")?.Id,
                now
            ),
            CreateReward(
                "system",
                null,
                "Mission Hero weekend boost",
                "A demo boost for citizens who join active weekend missions.",
                0,
                250,
                now.AddMonths(2),
                zones.GetValueOrDefault("Soarelui")?.Id,
                now,
                claimedCount: 7
            ),
            CreateReward(
                "system",
                null,
                "Before/After impact card",
                "A visible impact card for citizens who help document resolved issues.",
                50,
                200,
                now.AddMonths(2),
                zones.GetValueOrDefault("Fabric")?.Id,
                now,
                claimedCount: 5
            ),
            CreateReward(
                "partner",
                partners.GetValueOrDefault("CoffeeLab")?.Id,
                "Team cleanup coffee tray",
                "CoffeeLab tray for volunteer groups that complete a local clean-up mission.",
                120,
                12,
                now.AddMonths(1),
                zones.GetValueOrDefault("Mehala")?.Id,
                now,
                claimedCount: 4
            ),
            CreateReward(
                "partner",
                partners.GetValueOrDefault("Bookstore")?.Id,
                "Civic notebook pack",
                "Bookstore reward for documenting before-after civic improvements.",
                180,
                18,
                now.AddMonths(2),
                zones.GetValueOrDefault("Complex")?.Id,
                now,
                claimedCount: 3
            )
        };
        var existingTitles = await dbContext.Rewards
            .Select(reward => reward.Title)
            .ToListAsync();
        var missingRewards = rewards
            .Where(reward => !existingTitles.Contains(reward.Title, StringComparer.OrdinalIgnoreCase))
            .ToArray();

        if (missingRewards.Length == 0)
        {
            return;
        }

        dbContext.Rewards.AddRange(missingRewards);
        await dbContext.SaveChangesAsync();
    }

    private static async Task EnsureDemoMissionsAsync(CivicGoDbContext dbContext)
    {
        var now = DateTimeOffset.UtcNow;
        var demoUser = await dbContext.Users
            .FirstAsync(user => user.Email == DemoAdminEmail);
        var zones = await dbContext.Zones.ToDictionaryAsync(
            zone => zone.Name,
            StringComparer.OrdinalIgnoreCase
        );
        var demoMissions = new[]
        {
            new DemoMissionSeed(
                "Clean-up Mehala park edge",
                "Community clean-up for the Mehala park edge reported in the live map.",
                "Mehala",
                "Demo issue: Mehala cleanup mission ready",
                "Team cleanup coffee tray",
                8,
                140,
                now.AddDays(1).AddHours(10),
                now.AddDays(1).AddHours(12)
            ),
            new DemoMissionSeed(
                "Safe route Soarelui sidewalk sprint",
                "Volunteers and the city team clear the blocked sidewalk on a school route.",
                "Soarelui",
                "Demo issue: blocked sidewalk in progress",
                "Free day pass",
                10,
                160,
                now.AddDays(2).AddHours(9),
                now.AddDays(2).AddHours(11)
            ),
            new DemoMissionSeed(
                "Fabric lighting safety walk",
                "Evening safety walk to document broken lighting and confirm repair spots.",
                "Fabric",
                "Demo issue: broken streetlight in Fabric courtyard",
                "Free dessert",
                6,
                110,
                now.AddDays(1).AddHours(18),
                now.AddDays(1).AddHours(20)
            )
        };
        var demoIssueTitles = demoMissions.Select(mission => mission.IssueTitle).Distinct().ToArray();
        var demoRewardTitles = demoMissions.Select(mission => mission.RewardTitle).Distinct().ToArray();
        var issues = await dbContext.Issues
            .Where(issue => demoIssueTitles.Contains(issue.Title))
            .ToDictionaryAsync(issue => issue.Title, StringComparer.OrdinalIgnoreCase);
        var rewards = await dbContext.Rewards
            .Where(reward => demoRewardTitles.Contains(reward.Title))
            .ToDictionaryAsync(reward => reward.Title, StringComparer.OrdinalIgnoreCase);
        var missionTitles = demoMissions.Select(mission => mission.Title).ToArray();
        var existingMissions = await dbContext.Missions
            .Include(mission => mission.MissionIssues)
            .Include(mission => mission.Participants)
            .Where(mission => missionTitles.Contains(mission.Title))
            .ToListAsync();
        var existingMissionsByTitle = existingMissions.ToDictionary(
            mission => mission.Title,
            StringComparer.OrdinalIgnoreCase
        );
        var changedExistingMissions = false;

        foreach (var seed in demoMissions)
        {
            var zone = zones.GetValueOrDefault(seed.ZoneName);
            var issue = issues.GetValueOrDefault(seed.IssueTitle);
            var reward = rewards.GetValueOrDefault(seed.RewardTitle);

            if (existingMissionsByTitle.TryGetValue(seed.Title, out var mission))
            {
                var missionChanged = false;

                if (mission.Status != "active")
                {
                    mission.Status = "active";
                    missionChanged = true;
                }

                if (mission.CreatedByAi == false)
                {
                    mission.CreatedByAi = true;
                    missionChanged = true;
                }

                if (mission.ParticipantsNeeded != seed.ParticipantsNeeded)
                {
                    mission.ParticipantsNeeded = seed.ParticipantsNeeded;
                    missionChanged = true;
                }

                if (mission.ImpactPoints != seed.ImpactPoints)
                {
                    mission.ImpactPoints = seed.ImpactPoints;
                    missionChanged = true;
                }

                if (mission.StartsAt != seed.StartsAt)
                {
                    mission.StartsAt = seed.StartsAt;
                    missionChanged = true;
                }

                if (mission.EndsAt != seed.EndsAt)
                {
                    mission.EndsAt = seed.EndsAt;
                    missionChanged = true;
                }

                if (zone is not null && mission.ZoneId != zone.Id)
                {
                    mission.ZoneId = zone.Id;
                    missionChanged = true;
                }

                if (issue is not null && mission.CreatedFromIssueId != issue.Id)
                {
                    mission.CreatedFromIssueId = issue.Id;
                    missionChanged = true;
                }

                if (reward is not null && mission.RewardId != reward.Id)
                {
                    mission.RewardId = reward.Id;
                    missionChanged = true;
                }

                if (reward is not null && reward.MissionId != mission.Id)
                {
                    reward.MissionId = mission.Id;
                    reward.UpdatedAt = now;
                    missionChanged = true;
                }

                if (issue is not null && mission.MissionIssues.All(link => link.IssueId != issue.Id))
                {
                    dbContext.MissionIssues.Add(new MissionIssueEntity
                    {
                        Id = Guid.NewGuid(),
                        MissionId = mission.Id,
                        IssueId = issue.Id,
                        CreatedAt = now
                    });
                    missionChanged = true;
                }

                if (mission.Participants.All(participant => participant.UserId != demoUser.Id))
                {
                    dbContext.MissionParticipants.Add(new MissionParticipantEntity
                    {
                        Id = Guid.NewGuid(),
                        MissionId = mission.Id,
                        UserId = demoUser.Id,
                        JoinedAt = now.AddMinutes(-30),
                        Status = "joined",
                        PointsEarned = 0
                    });
                    missionChanged = true;
                }

                if (missionChanged)
                {
                    mission.UpdatedAt = now;
                    changedExistingMissions = true;
                }

                continue;
            }

            var missionId = Guid.NewGuid();
            var newMission = new MissionEntity
            {
                Id = missionId,
                Title = seed.Title,
                Description = seed.Description,
                ZoneId = zone?.Id,
                Status = "active",
                CreatedFromIssueId = issue?.Id,
                RewardId = reward?.Id,
                StartsAt = seed.StartsAt,
                EndsAt = seed.EndsAt,
                ParticipantsNeeded = seed.ParticipantsNeeded,
                ImpactPoints = seed.ImpactPoints,
                CreatedByAi = true,
                CreatedAt = now.AddHours(-3),
                UpdatedAt = now
            };

            dbContext.Missions.Add(newMission);
            dbContext.MissionParticipants.Add(new MissionParticipantEntity
            {
                Id = Guid.NewGuid(),
                MissionId = missionId,
                UserId = demoUser.Id,
                JoinedAt = now.AddHours(-2),
                Status = "joined",
                PointsEarned = 0
            });

            if (issue is not null)
            {
                dbContext.MissionIssues.Add(new MissionIssueEntity
                {
                    Id = Guid.NewGuid(),
                    MissionId = missionId,
                    IssueId = issue.Id,
                    CreatedAt = now
                });
            }

            if (reward is not null)
            {
                reward.MissionId = missionId;
                reward.UpdatedAt = now;
            }
        }

        if (changedExistingMissions || !demoMissions.All(seed => existingMissionsByTitle.ContainsKey(seed.Title)))
        {
            await dbContext.SaveChangesAsync();
        }
    }

    private static ZoneEntity CreateZone(
        string name,
        string description,
        int score,
        double latitude,
        double longitude,
        DateTimeOffset now
    )
    {
        return new ZoneEntity
        {
            Id = Guid.NewGuid(),
            Name = name,
            Description = description,
            Score = score,
            Latitude = latitude,
            Longitude = longitude,
            CreatedAt = now,
            UpdatedAt = now
        };
    }

    private static RankEntity CreateRank(
        string name,
        int minPoints,
        int maxPoints,
        string icon,
        string description,
        int order
    )
    {
        return new RankEntity
        {
            Id = Guid.NewGuid(),
            Name = name,
            MinPoints = minPoints,
            MaxPoints = maxPoints,
            Icon = icon,
            Description = description,
            Order = order
        };
    }

    private static BadgeEntity CreateBadge(
        string name,
        string description,
        string icon,
        string category,
        string ruleType,
        string ruleValue,
        int pointsBonus,
        DateTimeOffset now
    )
    {
        return new BadgeEntity
        {
            Id = Guid.NewGuid(),
            Name = name,
            Description = description,
            Icon = icon,
            Category = category,
            RuleType = ruleType,
            RuleValue = ruleValue,
            PointsBonus = pointsBonus,
            CreatedAt = now,
            UpdatedAt = now
        };
    }

    private static PartnerEntity CreatePartner(
        string name,
        string description,
        string websiteUrl,
        string contactEmail,
        DateTimeOffset now
    )
    {
        return new PartnerEntity
        {
            Id = Guid.NewGuid(),
            Name = name,
            Description = description,
            WebsiteUrl = websiteUrl,
            ContactEmail = contactEmail,
            CreatedAt = now,
            UpdatedAt = now
        };
    }

    private static RewardEntity CreateReward(
        string type,
        Guid? partnerId,
        string title,
        string description,
        int requiredPoints,
        int quantity,
        DateTimeOffset? expiresAt,
        Guid? zoneId,
        DateTimeOffset now,
        int claimedCount = 0
    )
    {
        return new RewardEntity
        {
            Id = Guid.NewGuid(),
            Type = type,
            PartnerId = partnerId,
            Title = title,
            Description = description,
            RequiredPoints = requiredPoints,
            Quantity = quantity,
            ClaimedCount = claimedCount,
            ExpiresAt = expiresAt,
            Status = "available",
            ZoneId = zoneId,
            CreatedAt = now,
            UpdatedAt = now
        };
    }

    private static IssueEntity CreateDemoIssue(
        DemoIssueSeed seed,
        IReadOnlyDictionary<string, ZoneEntity> zones,
        Guid createdByUserId
    )
    {
        var zone = zones.GetValueOrDefault(seed.ZoneName);
        var updatedAt = seed.ResolvedAt ?? seed.CreatedAt.AddMinutes(45);

        return new IssueEntity
        {
            Id = Guid.NewGuid(),
            Title = seed.Title,
            Description = seed.Description,
            Category = seed.Category,
            Severity = seed.Severity,
            Status = seed.Status,
            ResponsibleActor = seed.ResponsibleActor,
            ImageUrl = seed.ImageUrl,
            AfterImageUrl = seed.AfterImageUrl,
            Latitude = seed.Latitude,
            Longitude = seed.Longitude,
            LocationPoint = $"POINT({seed.Longitude} {seed.Latitude})",
            ZoneId = zone?.Id,
            CreatedByUserId = createdByUserId,
            ConfirmedCount = seed.ConfirmedCount,
            DuplicateCount = seed.DuplicateCount,
            CreatedAt = seed.CreatedAt,
            UpdatedAt = updatedAt,
            ResolvedAt = seed.ResolvedAt
        };
    }

    private static IssueAiAnalysisEntity CreateDemoAnalysis(DemoIssueSeed seed, Guid issueId)
    {
        return new IssueAiAnalysisEntity
        {
            Id = Guid.NewGuid(),
            IssueId = issueId,
            Category = seed.Category,
            Severity = seed.Severity,
            Summary = seed.AiSummary,
            ResponsibleActor = seed.ResponsibleActor,
            SuggestedAction = seed.SuggestedAction,
            Confidence = seed.Confidence,
            IsUrgent = seed.IsUrgent,
            RewardEligible = seed.RewardEligible,
            RawResponseJson = JsonSerializer.Serialize(new
            {
                source = "demo_seed",
                category = seed.Category,
                severity = seed.Severity,
                summary = seed.AiSummary,
                suggestedAction = seed.SuggestedAction,
                confidence = seed.Confidence,
                isUrgent = seed.IsUrgent,
                rewardEligible = seed.RewardEligible
            }),
            CreatedAt = seed.CreatedAt.AddMinutes(12)
        };
    }

    private sealed record DemoIssueSeed(
        string Title,
        string Description,
        string Category,
        string Severity,
        string Status,
        string ResponsibleActor,
        string ImageUrl,
        string? AfterImageUrl,
        double Latitude,
        double Longitude,
        string ZoneName,
        int ConfirmedCount,
        int DuplicateCount,
        DateTimeOffset CreatedAt,
        DateTimeOffset? ResolvedAt,
        string AiSummary,
        string SuggestedAction,
        double Confidence,
        bool IsUrgent,
        bool RewardEligible
    );

    private sealed record DemoMissionSeed(
        string Title,
        string Description,
        string ZoneName,
        string IssueTitle,
        string RewardTitle,
        int ParticipantsNeeded,
        int ImpactPoints,
        DateTimeOffset StartsAt,
        DateTimeOffset EndsAt
    );
}
