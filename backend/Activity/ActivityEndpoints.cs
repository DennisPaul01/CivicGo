using CivicGo.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace CivicGo.Api.Activity;

public static class ActivityEndpoints
{
    public static RouteGroupBuilder MapActivityEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/activity").WithTags("Activity");

        group.MapGet("/", async (
            int? hours,
            int? limit,
            CivicGoDbContext dbContext,
            CancellationToken cancellationToken
        ) =>
        {
            var requestedHours = Math.Clamp(hours ?? 48, 1, 168);
            var requestedLimit = Math.Clamp(limit ?? 50, 1, 100);
            var since = DateTimeOffset.UtcNow.AddHours(-requestedHours);

            var items = await dbContext.PublicActivityFeedItems
                .AsNoTracking()
                .Where(item => item.CreatedAt >= since)
                .OrderByDescending(item => item.CreatedAt)
                .Take(requestedLimit)
                .Select(item => new PublicActivityResponse(
                    item.Id,
                    item.Type,
                    item.Title,
                    item.Message,
                    item.RelatedIssueId,
                    item.RelatedMissionId,
                    item.RelatedRewardId,
                    item.RelatedZoneId,
                    item.CreatedAt
                ))
                .ToListAsync(cancellationToken);

            return Results.Ok(items);
        })
        .WithName("GetPublicActivity");

        return group;
    }
}
