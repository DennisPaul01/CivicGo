using CivicGo.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace CivicGo.Api.Agents;

public static class AgentRunEndpoints
{
    public static IEndpointRouteBuilder MapAgentRunEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/issues/{issueId:guid}/agent-run", async (
            Guid issueId,
            CivicGoDbContext dbContext,
            CancellationToken cancellationToken
        ) =>
        {
            var run = await dbContext.AgentRuns
                .AsNoTracking()
                .Include(item => item.AgentSteps)
                .Where(item => item.IssueId == issueId)
                .OrderByDescending(item => item.CreatedAt)
                .FirstOrDefaultAsync(cancellationToken);

            return run is null ? Results.NotFound() : Results.Ok(AgentRunMapper.ToResponse(run));
        })
        .WithTags("Agent Runs")
        .WithName("GetIssueAgentRun");

        app.MapGet("/api/agent-runs/{id:guid}", async (
            Guid id,
            CivicGoDbContext dbContext,
            CancellationToken cancellationToken
        ) =>
        {
            var run = await dbContext.AgentRuns
                .AsNoTracking()
                .Include(item => item.AgentSteps)
                .FirstOrDefaultAsync(item => item.Id == id, cancellationToken);

            return run is null ? Results.NotFound() : Results.Ok(AgentRunMapper.ToResponse(run));
        })
        .WithTags("Agent Runs")
        .WithName("GetAgentRun");

        app.MapGet("/api/agent-runs/{id:guid}/steps", async (
            Guid id,
            CivicGoDbContext dbContext,
            CancellationToken cancellationToken
        ) =>
        {
            var exists = await dbContext.AgentRuns
                .AsNoTracking()
                .AnyAsync(item => item.Id == id, cancellationToken);

            if (!exists)
            {
                return Results.NotFound();
            }

            var steps = await dbContext.AgentSteps
                .AsNoTracking()
                .Where(item => item.AgentRunId == id)
                .OrderBy(item => item.Order)
                .Select(item => AgentRunMapper.ToResponse(item))
                .ToListAsync(cancellationToken);

            return Results.Ok(steps);
        })
        .WithTags("Agent Runs")
        .WithName("GetAgentRunSteps");

        return app;
    }
}
