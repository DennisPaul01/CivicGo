using CivicGo.Api.Data;
using CivicGo.Api.Data.Entities;
using Microsoft.EntityFrameworkCore;

namespace CivicGo.Api.Agents;

public static class AdminAgentEndpoints
{
    public static RouteGroupBuilder MapAdminAgentEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/admin/agents")
            .RequireAuthorization("AdminOnly")
            .WithTags("Admin Agents");

        group.MapGet("", async (
            CivicGoDbContext dbContext,
            CancellationToken cancellationToken
        ) =>
        {
            var agentStepRows = await dbContext.AgentSteps
                .AsNoTracking()
                .Select(step => new
                {
                    step.AgentName,
                    step.Status,
                    step.StartedAt,
                    step.CompletedAt
                })
                .ToListAsync(cancellationToken);

            var agentStats = agentStepRows
                .GroupBy(step => InferAgentKey(step.AgentName))
                .Select(grouped => new AgentStepStats(
                    grouped.Key,
                    grouped.Count(),
                    grouped.Count(step => step.Status == "completed"),
                    grouped.Count(step => step.Status == "fallback"),
                    grouped.Count(step => step.Status == "failed"),
                    grouped.Count(step => step.Status == "skipped"),
                    grouped.Max(step => step.CompletedAt ?? step.StartedAt)
                ))
                .ToDictionary(stats => stats.AgentKey, StringComparer.OrdinalIgnoreCase);

            var agents = await dbContext.AgentConfigs
                .AsNoTracking()
                .OrderBy(agent => agent.SortOrder)
                .ThenBy(agent => agent.Name)
                .ToListAsync(cancellationToken);

            return Results.Ok(agents.Select(agent => ToResponse(agent, agentStats)));
        })
        .WithName("GetAdminAgents");

        group.MapPatch("/{id:guid}", async (
            Guid id,
            UpdateAdminAgentRequest request,
            CivicGoDbContext dbContext,
            CancellationToken cancellationToken
        ) =>
        {
            var agent = await dbContext.AgentConfigs
                .FirstOrDefaultAsync(item => item.Id == id, cancellationToken);

            if (agent is null)
            {
                return Results.NotFound();
            }

            var validationError = Validate(request);

            if (validationError is not null)
            {
                return Results.BadRequest(new { message = validationError });
            }

            agent.Name = request.Name.Trim();
            agent.Role = request.Role.Trim();
            agent.Description = request.Description.Trim();
            agent.Instructions = request.Instructions.Trim();
            agent.Model = request.Model.Trim();
            agent.FallbackMode = request.FallbackMode.Trim();
            agent.IsEnabled = request.IsEnabled;
            agent.UpdatedAt = DateTimeOffset.UtcNow;

            await dbContext.SaveChangesAsync(cancellationToken);

            return Results.Ok(ToResponse(agent, new Dictionary<string, AgentStepStats>()));
        })
        .WithName("UpdateAdminAgent");

        return group;
    }

    private static string? Validate(UpdateAdminAgentRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return "Agent name is required.";
        }

        if (string.IsNullOrWhiteSpace(request.Role))
        {
            return "Agent role is required.";
        }

        if (string.IsNullOrWhiteSpace(request.Description))
        {
            return "Agent description is required.";
        }

        if (string.IsNullOrWhiteSpace(request.Instructions))
        {
            return "Agent instructions are required.";
        }

        if (string.IsNullOrWhiteSpace(request.Model))
        {
            return "Agent model is required.";
        }

        if (string.IsNullOrWhiteSpace(request.FallbackMode))
        {
            return "Fallback mode is required.";
        }

        return null;
    }

    private static AdminAgentResponse ToResponse(
        AgentConfigEntity agent,
        IReadOnlyDictionary<string, AgentStepStats> statsByAgentName
    )
    {
        statsByAgentName.TryGetValue(agent.Key, out var stats);

        return new AdminAgentResponse(
            agent.Id,
            agent.Key,
            agent.Name,
            agent.Role,
            agent.Description,
            agent.Instructions,
            agent.Model,
            agent.FallbackMode,
            agent.IsEnabled,
            agent.SortOrder,
            stats?.TotalSteps ?? 0,
            stats?.CompletedSteps ?? 0,
            stats?.FallbackSteps ?? 0,
            stats?.FailedSteps ?? 0,
            stats?.SkippedSteps ?? 0,
            stats?.LastRunAt,
            agent.CreatedAt,
            agent.UpdatedAt
        );
    }

    private sealed record AgentStepStats(
        string AgentKey,
        int TotalSteps,
        int CompletedSteps,
        int FallbackSteps,
        int FailedSteps,
        int SkippedSteps,
        DateTimeOffset? LastRunAt
    );

    private static string InferAgentKey(string agentName)
    {
        return NormalizeAgentName(agentName) switch
        {
            "visionagent" => "vision",
            "triageagent" => "triage",
            "duplicateagent" => "duplicate",
            "missionagent" => "mission",
            "rewardagent" => "reward",
            "cityagent" => "city",
            "authorityemailagent" => "authority_email",
            _ => NormalizeConfigKey(agentName)
        };
    }

    private static string NormalizeAgentName(string value)
    {
        return new string(value
            .Where(char.IsLetterOrDigit)
            .Select(char.ToLowerInvariant)
            .ToArray());
    }

    private static string NormalizeConfigKey(string value)
    {
        var tokens = value
            .Trim()
            .ToLowerInvariant()
            .Replace("-", "_")
            .Split([' ', '_'], StringSplitOptions.RemoveEmptyEntries);

        return string.Join("_", tokens);
    }
}
