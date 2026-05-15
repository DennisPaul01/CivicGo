using System.Text.Json;
using CivicGo.Api.Data;
using CivicGo.Api.Data.Entities;
using CivicGo.Api.Live;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace CivicGo.Api.Agents.Runtime;

public sealed class IssueAgentStepWriter(
    CivicGoDbContext dbContext,
    IHubContext<CivicHub> civicHub,
    IssueEventStreamService eventStream
)
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        WriteIndented = false
    };

    public async Task<IReadOnlyDictionary<string, RuntimeAgentConfig>> LoadAgentConfigsAsync(
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

    public static RuntimeAgentConfig GetAgentConfig(
        IReadOnlyDictionary<string, RuntimeAgentConfig> agentConfigs,
        string key,
        string fallbackName
    )
    {
        return agentConfigs.TryGetValue(key, out var config)
            ? config
            : RuntimeAgentConfig.Default(key, fallbackName);
    }

    public async Task PublishIssueCreatedAsync(Guid issueId, CancellationToken cancellationToken)
    {
        var createdIssue = await dbContext.Issues
            .AsNoTracking()
            .Include(item => item.Zone)
            .FirstOrDefaultAsync(item => item.Id == issueId, cancellationToken);

        if (createdIssue is null)
        {
            return;
        }

        var payload = new
        {
            issueId,
            status = createdIssue.Status,
            zoneId = createdIssue.ZoneId,
            zoneName = createdIssue.Zone?.Name,
            createdIssue.CreatedAt
        };

        await civicHub.Clients.All.SendAsync("IssueCreated", payload, cancellationToken);
        await eventStream.PublishAsync(issueId, "issue.created", payload, cancellationToken);
    }

    public async Task StartStepAsync(
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
                : await GetLatestStepOutputAsync(issueId, receivesFromAgent, cancellationToken)
        };

        await civicHub.Clients.All.SendAsync("AgentStepStarted", payload, cancellationToken);
        await eventStream.PublishAsync(issueId, "agent.step.started", payload, cancellationToken);
    }

    public async Task CompleteStepAsync(
        Guid issueId,
        string agentName,
        AgentDecision decision,
        object? input,
        string? status,
        string message,
        CancellationToken cancellationToken
    )
    {
        var step = await GetLatestStepAsync(issueId, agentName, cancellationToken);

        if (step is null)
        {
            var run = await EnsureAgentRunAsync(issueId, cancellationToken);
            step = new AgentStepEntity
            {
                Id = Guid.NewGuid(),
                AgentRunId = run.Id,
                AgentName = agentName,
                Status = status ?? "completed",
                InputJson = Serialize(input ?? new { issueId }),
                OutputJson = SerializeDecision(decision),
                Message = message,
                StartedAt = DateTimeOffset.UtcNow.AddMilliseconds(-180),
                CompletedAt = DateTimeOffset.UtcNow,
                Order = GetNextOrder(run)
            };
            run.AgentSteps.Add(step);
        }
        else
        {
            step.Status = status ?? step.Status;
            step.InputJson = Serialize(input ?? TryDeserialize(step.InputJson));
            step.OutputJson = SerializeDecision(decision);
            step.Message = message;
            step.StartedAt ??= DateTimeOffset.UtcNow.AddMilliseconds(-180);
            step.CompletedAt = DateTimeOffset.UtcNow;
        }

        var latestRun = await dbContext.AgentRuns
            .FirstOrDefaultAsync(run => run.Id == step.AgentRunId, cancellationToken);

        if (latestRun is not null)
        {
            latestRun.CompletedAt = step.CompletedAt;
            if (step.Status == "fallback" && latestRun.Status != "failed")
            {
                latestRun.Status = "fallback";
            }
            else if (latestRun.Status is not "fallback" and not "failed")
            {
                latestRun.Status = "completed";
            }
        }

        await dbContext.SaveChangesAsync(cancellationToken);
        await PublishStepCompletedAsync(issueId, agentName, cancellationToken);
    }

    public Task SkipStepAsync(
        Guid issueId,
        RuntimeAgentConfig agentConfig,
        string agentName,
        string reason,
        string nextAction,
        string? receivesFromAgent,
        CancellationToken cancellationToken
    )
    {
        return CompleteStepAsync(
            issueId,
            agentName,
            new AgentDecision(
                reason,
                "admin_config",
                $"{agentName} did not run.",
                nextAction,
                null,
                true,
                new
                {
                    skipped = true,
                    reason = agentConfig.IsEnabled ? "runtime_branch" : "disabled_by_admin_config",
                    agentConfig.Key,
                    agentConfig.IsEnabled
                }
            ),
            new
            {
                issueId,
                receivesFromAgent,
                agentConfig.Key,
                agentConfig.Model,
                agentConfig.Instructions,
                agentConfig.FallbackMode,
                agentConfig.IsEnabled
            },
            "skipped",
            reason,
            cancellationToken
        );
    }

    public async Task PublishIssueAnalyzedAsync(
        Guid issueId,
        object payload,
        CancellationToken cancellationToken
    )
    {
        await civicHub.Clients.All.SendAsync("IssueAnalyzed", payload, cancellationToken);
        await eventStream.PublishAsync(issueId, "issue.analyzed", payload, cancellationToken);
    }

    public async Task PublishEventAsync(
        Guid issueId,
        string signalRName,
        string streamName,
        object payload,
        CancellationToken cancellationToken
    )
    {
        await civicHub.Clients.All.SendAsync(signalRName, payload, cancellationToken);
        await eventStream.PublishAsync(issueId, streamName, payload, cancellationToken);
    }

    private async Task PublishStepCompletedAsync(
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

        await civicHub.Clients.All.SendAsync("AgentStepCompleted", payload, cancellationToken);
        await eventStream.PublishAsync(issueId, "agent.step.completed", payload, cancellationToken);
    }

    private async Task<AgentStepEntity?> GetLatestStepAsync(
        Guid issueId,
        string agentName,
        CancellationToken cancellationToken
    )
    {
        return await dbContext.AgentSteps
            .Where(item => item.AgentRun!.IssueId == issueId && item.AgentName == agentName)
            .OrderByDescending(item => item.CompletedAt ?? item.StartedAt)
            .FirstOrDefaultAsync(cancellationToken);
    }

    private async Task<string?> GetLatestStepOutputAsync(
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

    private async Task<AgentRunEntity> EnsureAgentRunAsync(
        Guid issueId,
        CancellationToken cancellationToken
    )
    {
        var issue = await dbContext.Issues
            .Include(item => item.AgentRuns)
                .ThenInclude(run => run.AgentSteps)
            .FirstOrDefaultAsync(item => item.Id == issueId, cancellationToken);

        if (issue is null)
        {
            throw new KeyNotFoundException($"Issue {issueId} was not found.");
        }

        var latestRun = issue.AgentRuns
            .OrderByDescending(run => run.CreatedAt)
            .FirstOrDefault();

        if (latestRun is not null)
        {
            return latestRun;
        }

        var now = DateTimeOffset.UtcNow;
        latestRun = new AgentRunEntity
        {
            Id = Guid.NewGuid(),
            IssueId = issue.Id,
            Status = "completed",
            StartedAt = now,
            CompletedAt = now,
            CreatedAt = now
        };
        issue.AgentRuns.Add(latestRun);

        return latestRun;
    }

    private static int GetNextOrder(AgentRunEntity run)
    {
        return run.AgentSteps.Count == 0 ? 1 : run.AgentSteps.Max(step => step.Order) + 1;
    }

    private static string SerializeDecision(AgentDecision decision)
    {
        return Serialize(new
        {
            observation = decision.Observation,
            toolUsed = decision.ToolUsed,
            decision = decision.Decision,
            nextAction = decision.NextAction,
            confidence = decision.Confidence,
            shouldContinue = decision.ShouldContinue,
            toolResult = decision.ToolResult
        });
    }

    private static string Serialize(object value)
    {
        return JsonSerializer.Serialize(value, JsonOptions);
    }

    private static object TryDeserialize(string json)
    {
        if (string.IsNullOrWhiteSpace(json))
        {
            return new { };
        }

        try
        {
            return JsonSerializer.Deserialize<JsonElement>(json, JsonOptions);
        }
        catch
        {
            return new { raw = json };
        }
    }
}
