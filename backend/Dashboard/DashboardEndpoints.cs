using System.Globalization;
using CivicGo.Api.Data;
using CivicGo.Api.Issues;
using Microsoft.EntityFrameworkCore;

namespace CivicGo.Api.Dashboard;

public static class DashboardEndpoints
{
    private static readonly string[] InProgressStatuses =
    [
        "ai_analyzed",
        "duplicate_detected",
        "in_review",
        "in_progress",
        "mission_created"
    ];

    private static readonly string[] ResolvedStatuses =
    [
        "resolved",
        "issue_resolved"
    ];

    private static readonly IReadOnlyDictionary<string, string> StatusLabels =
        new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["new"] = "New",
            ["ai_analyzed"] = "AI checked",
            ["duplicate_detected"] = "Duplicate detected",
            ["in_review"] = "In review",
            ["in_progress"] = "In progress",
            ["mission_created"] = "Mission active",
            ["resolved"] = "Resolved",
            ["issue_resolved"] = "Resolved"
        };

    public static RouteGroupBuilder MapDashboardEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/dashboard")
            .RequireAuthorization("AdminOnly")
            .WithTags("Dashboard");

        group.MapGet("/overview", async (
            CivicGoDbContext dbContext,
            CancellationToken cancellationToken
        ) =>
        {
            var totalIssues = await dbContext.Issues
                .AsNoTracking()
                .CountAsync(cancellationToken);
            var newIssues = await dbContext.Issues
                .AsNoTracking()
                .CountAsync(issue => issue.Status == "new", cancellationToken);
            var inProgressIssues = await dbContext.Issues
                .AsNoTracking()
                .CountAsync(
                    issue => InProgressStatuses.Contains(issue.Status),
                    cancellationToken
                );
            var resolvedIssues = await dbContext.Issues
                .AsNoTracking()
                .CountAsync(
                    issue =>
                        issue.ResolvedAt != null ||
                        ResolvedStatuses.Contains(issue.Status),
                    cancellationToken
                );
            var activeMissions = await dbContext.Missions
                .AsNoTracking()
                .CountAsync(mission => mission.Status == "active", cancellationToken);
            var rewardsClaimedFromCounters = await dbContext.Rewards
                .AsNoTracking()
                .SumAsync(reward => reward.ClaimedCount, cancellationToken);
            var rewardsClaimedFromRows = await dbContext.RewardClaims
                .AsNoTracking()
                .CountAsync(claim => claim.Status == "claimed", cancellationToken);
            var statusGroups = await dbContext.Issues
                .AsNoTracking()
                .GroupBy(issue => issue.Status)
                .Select(grouped => new
                {
                    Key = grouped.Key,
                    Count = grouped.Count()
                })
                .ToListAsync(cancellationToken);
            var categoryGroups = await dbContext.Issues
                .AsNoTracking()
                .GroupBy(issue => issue.Category)
                .Select(grouped => new
                {
                    Key = grouped.Key,
                    Count = grouped.Count()
                })
                .ToListAsync(cancellationToken);
            var response = new DashboardOverviewResponse(
                totalIssues,
                newIssues,
                inProgressIssues,
                resolvedIssues,
                activeMissions,
                Math.Max(rewardsClaimedFromCounters, rewardsClaimedFromRows),
                statusGroups
                    .OrderByDescending(grouped => grouped.Count)
                    .ThenBy(grouped => grouped.Key)
                    .Select(grouped => new DashboardBreakdownItemResponse(
                        grouped.Key,
                        CreateStatusLabel(grouped.Key),
                        grouped.Count
                    ))
                    .ToArray(),
                categoryGroups
                    .OrderByDescending(grouped => grouped.Count)
                    .ThenBy(grouped => grouped.Key)
                    .Select(grouped => new DashboardBreakdownItemResponse(
                        grouped.Key,
                        FormatLabel(grouped.Key),
                        grouped.Count
                    ))
                    .ToArray(),
                DateTimeOffset.UtcNow
            );

            return Results.Ok(response);
        })
        .WithName("GetDashboardOverview");

        group.MapGet("/ai-summary", async (
            CivicGoDbContext dbContext,
            CancellationToken cancellationToken
        ) =>
        {
            var issueSignals = await dbContext.Issues
                .AsNoTracking()
                .Select(issue => new DashboardIssueSignal(
                    issue.Id,
                    issue.Status,
                    issue.Category,
                    issue.Severity,
                    issue.Zone == null ? null : issue.Zone.Name,
                    issue.ResolvedAt
                ))
                .ToListAsync(cancellationToken);
            var urgentIssueIds = (await dbContext.IssueAiAnalyses
                .AsNoTracking()
                .Where(analysis => analysis.IsUrgent)
                .Select(analysis => analysis.IssueId)
                .Distinct()
                .ToListAsync(cancellationToken))
                .ToHashSet();
            var activeMissions = await dbContext.Missions
                .AsNoTracking()
                .CountAsync(mission => mission.Status == "active", cancellationToken);
            var rewardsClaimedFromCounters = await dbContext.Rewards
                .AsNoTracking()
                .SumAsync(reward => reward.ClaimedCount, cancellationToken);
            var rewardsClaimedFromRows = await dbContext.RewardClaims
                .AsNoTracking()
                .CountAsync(claim => claim.Status == "claimed", cancellationToken);

            return Results.Ok(CreateAiSummary(
                issueSignals,
                urgentIssueIds,
                activeMissions,
                Math.Max(rewardsClaimedFromCounters, rewardsClaimedFromRows)
            ));
        })
        .WithName("GetDashboardAiSummary");

        return group;
    }

    private static DashboardAiSummaryResponse CreateAiSummary(
        IReadOnlyCollection<DashboardIssueSignal> issues,
        IReadOnlySet<Guid> urgentIssueIds,
        int activeMissions,
        int rewardsClaimed
    )
    {
        var generatedAt = DateTimeOffset.UtcNow;

        if (issues.Count == 0)
        {
            return new DashboardAiSummaryResponse(
                "AI city read: Complex and Fabric need the next civic push.",
                "Local fallback highlights waste, lighting and blocked sidewalk reports as the clearest civic pattern. Active missions and reward claims keep the impact story visible while live issue data is empty.",
                "Complex and Fabric cleanup plus lighting checks",
                "Seed a visible weekend mission and keep a partner reward attached for volunteers.",
                "Mock fallback summary",
                true,
                generatedAt
            );
        }

        var openIssues = issues
            .Where(issue => !IsResolved(issue))
            .ToArray();
        var resolvedIssues = issues
            .Where(IsResolved)
            .ToArray();
        var urgentIssues = issues
            .Where(issue =>
                urgentIssueIds.Contains(issue.Id) ||
                IsUrgentSeverity(issue.Severity)
            )
            .ToArray();
        var topCategory = FormatLabel(GetTopValue(
            issues.Select(issue => issue.Category),
            "civic care"
        ));
        var topZone = GetTopValue(
            issues.Select(issue => issue.ZoneName),
            "Timisoara"
        );

        if (urgentIssues.Length > 0)
        {
            return new DashboardAiSummaryResponse(
                $"AI city read: {urgentIssues.Length} urgent report{Plural(urgentIssues.Length)} need review.",
                $"{topCategory} is the strongest live signal around {topZone}. The city overview shows {openIssues.Length} open issues, {activeMissions} active missions and {rewardsClaimed} reward claims.",
                $"{urgentIssues.Length} urgent issue{Plural(urgentIssues.Length)} in the current queue",
                "Prioritize triage for urgent reports, then attach eligible issues to nearby missions.",
                "Deterministic city insights",
                false,
                generatedAt
            );
        }

        if (resolvedIssues.Length >= openIssues.Length && resolvedIssues.Length > 0)
        {
            return new DashboardAiSummaryResponse(
                "AI city read: resolved work is leading the city story.",
                $"{resolvedIssues.Length} fixed issue{Plural(resolvedIssues.Length)} outweigh {openIssues.Length} open issue{Plural(openIssues.Length)}. {topZone} is the clearest place to show before-after impact and keep the city story concrete.",
                $"{resolvedIssues.Length} resolved issue{Plural(resolvedIssues.Length)} ready for review",
                "Surface the strongest resolved issue on the map and pair it with the zone leaderboard.",
                "Deterministic city insights",
                false,
                generatedAt
            );
        }

        return new DashboardAiSummaryResponse(
            $"AI city read: {topCategory} is the strongest pattern in {topZone}.",
            $"{openIssues.Length} open issue{Plural(openIssues.Length)}, {activeMissions} active mission{Plural(activeMissions)} and {rewardsClaimed} reward claim{Plural(rewardsClaimed)} point to a practical next move for city coordination.",
            $"{topCategory} reports around {topZone}",
            activeMissions > 0
                ? "Boost the active missions already attached to reported issues."
                : "Create a mission from the most visible open issue and attach a relevant reward.",
            "Deterministic city insights",
            false,
            generatedAt
        );
    }

    private static bool IsResolved(DashboardIssueSignal issue)
    {
        return issue.ResolvedAt is not null || ResolvedStatuses.Contains(issue.Status);
    }

    private static bool IsUrgentSeverity(string severity)
    {
        return severity.Equals("high", StringComparison.OrdinalIgnoreCase) ||
               severity.Equals("critical", StringComparison.OrdinalIgnoreCase) ||
               severity.Equals("urgent", StringComparison.OrdinalIgnoreCase);
    }

    private static string GetTopValue(IEnumerable<string?> values, string fallback)
    {
        return values
            .Where(value => !string.IsNullOrWhiteSpace(value))
            .GroupBy(value => value!)
            .OrderByDescending(grouped => grouped.Count())
            .ThenBy(grouped => grouped.Key)
            .Select(grouped => grouped.Key)
            .FirstOrDefault() ?? fallback;
    }

    private static string CreateStatusLabel(string status)
    {
        return StatusLabels.TryGetValue(status, out var label)
            ? label
            : FormatLabel(status);
    }

    private static string FormatLabel(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return "Other";
        }

        var normalizedValue = value.Replace('_', ' ');

        if (IssueCategories.Supported.Contains(value))
        {
            return IssueCategories.HumanizeRo(value);
        }

        return CultureInfo.InvariantCulture.TextInfo.ToTitleCase(normalizedValue);
    }

    private static string Plural(int count)
    {
        return count == 1 ? string.Empty : "s";
    }

    private sealed record DashboardIssueSignal(
        Guid Id,
        string Status,
        string Category,
        string Severity,
        string? ZoneName,
        DateTimeOffset? ResolvedAt
    );
}
