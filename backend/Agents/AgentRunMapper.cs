using CivicGo.Api.Data.Entities;

namespace CivicGo.Api.Agents;

public static class AgentRunMapper
{
    public static AgentRunResponse ToResponse(AgentRunEntity run)
    {
        return new AgentRunResponse(
            run.Id,
            run.IssueId,
            run.Status,
            run.StartedAt,
            run.CompletedAt,
            run.CreatedAt,
            run.AgentSteps
                .OrderBy(step => step.Order)
                .Select(ToResponse)
                .ToList()
        );
    }

    public static AgentStepResponse ToResponse(AgentStepEntity step)
    {
        return new AgentStepResponse(
            step.Id,
            step.AgentRunId,
            step.AgentName,
            step.Status,
            step.Message,
            step.InputJson,
            step.OutputJson,
            step.StartedAt,
            step.CompletedAt,
            step.Order
        );
    }
}
