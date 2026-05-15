using System.Security.Claims;
using CivicGo.Api.Auth;
using CivicGo.Api.Data;
using CivicGo.Api.Data.Entities;
using Microsoft.EntityFrameworkCore;

namespace CivicGo.Api.Missions;

public static class MissionEndpoints
{
    public static RouteGroupBuilder MapMissionEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/missions").WithTags("Missions");

        group.MapGet("/", async (
            ClaimsPrincipal principal,
            CivicGoDbContext dbContext,
            CancellationToken cancellationToken
        ) =>
        {
            var currentUserId = await GetCurrentUserIdAsync(principal, dbContext, cancellationToken);
            var missions = await dbContext.Missions
                .AsNoTracking()
                .Include(mission => mission.Zone)
                .Include(mission => mission.Reward)
                    .ThenInclude(reward => reward!.Partner)
                .Include(mission => mission.Participants)
                .Include(mission => mission.MissionIssues)
                .OrderByDescending(mission => mission.CreatedAt)
                .Take(100)
                .ToListAsync(cancellationToken);

            return Results.Ok(missions.Select(mission => MissionMapper.ToResponse(mission, currentUserId)));
        })
        .WithName("GetMissions");

        group.MapGet("/{id:guid}", async (
            Guid id,
            ClaimsPrincipal principal,
            CivicGoDbContext dbContext,
            CancellationToken cancellationToken
        ) =>
        {
            var currentUserId = await GetCurrentUserIdAsync(principal, dbContext, cancellationToken);
            var mission = await dbContext.Missions
                .AsNoTracking()
                .Include(item => item.Zone)
                .Include(item => item.Reward)
                    .ThenInclude(reward => reward!.Partner)
                .Include(item => item.Participants)
                .Include(item => item.MissionIssues)
                .FirstOrDefaultAsync(item => item.Id == id, cancellationToken);

            return mission is null
                ? Results.NotFound()
                : Results.Ok(MissionMapper.ToResponse(mission, currentUserId));
        })
        .WithName("GetMissionById");

        group.MapPost("/{id:guid}/join", async (
            Guid id,
            ClaimsPrincipal principal,
            CivicGoDbContext dbContext,
            UserProfileService userProfileService,
            CancellationToken cancellationToken
        ) =>
        {
            var mission = await dbContext.Missions
                .Include(item => item.Zone)
                .Include(item => item.Reward)
                    .ThenInclude(reward => reward!.Partner)
                .Include(item => item.Participants)
                .Include(item => item.MissionIssues)
                .FirstOrDefaultAsync(item => item.Id == id, cancellationToken);

            if (mission is null)
            {
                return Results.NotFound();
            }

            if (mission.Status != "active")
            {
                return Results.BadRequest(new { message = "Only active missions can be joined." });
            }

            var profile = await userProfileService.GetOrCreateAsync(principal);
            var existingParticipant = mission.Participants
                .FirstOrDefault(participant => participant.UserId == profile.Id);
            var now = DateTimeOffset.UtcNow;

            if (existingParticipant is null)
            {
                dbContext.MissionParticipants.Add(new MissionParticipantEntity
                {
                    Id = Guid.NewGuid(),
                    MissionId = mission.Id,
                    UserId = profile.Id,
                    JoinedAt = now,
                    Status = "joined",
                    PointsEarned = 0
                });
                mission.UpdatedAt = now;
                await dbContext.SaveChangesAsync(cancellationToken);
            }
            else if (existingParticipant.Status != "joined")
            {
                existingParticipant.Status = "joined";
                mission.UpdatedAt = now;
                await dbContext.SaveChangesAsync(cancellationToken);
            }

            var updatedMission = await dbContext.Missions
                .AsNoTracking()
                .Include(item => item.Zone)
                .Include(item => item.Reward)
                    .ThenInclude(reward => reward!.Partner)
                .Include(item => item.Participants)
                .Include(item => item.MissionIssues)
                .FirstAsync(item => item.Id == id, cancellationToken);

            return Results.Ok(MissionMapper.ToResponse(updatedMission, profile.Id));
        })
        .RequireAuthorization()
        .WithName("JoinMission");

        group.MapPost("/{id:guid}/leave", async (
            Guid id,
            ClaimsPrincipal principal,
            CivicGoDbContext dbContext,
            UserProfileService userProfileService,
            CancellationToken cancellationToken
        ) =>
        {
            var mission = await dbContext.Missions
                .Include(item => item.Zone)
                .Include(item => item.Reward)
                    .ThenInclude(reward => reward!.Partner)
                .Include(item => item.Participants)
                .Include(item => item.MissionIssues)
                .FirstOrDefaultAsync(item => item.Id == id, cancellationToken);

            if (mission is null)
            {
                return Results.NotFound();
            }

            if (mission.Status != "active")
            {
                return Results.BadRequest(new { message = "Only active missions can be left." });
            }

            var profile = await userProfileService.GetOrCreateAsync(principal);
            var existingParticipant = mission.Participants
                .FirstOrDefault(participant => participant.UserId == profile.Id);

            if (existingParticipant is not null && existingParticipant.Status == "joined")
            {
                existingParticipant.Status = "left";
                mission.UpdatedAt = DateTimeOffset.UtcNow;
                await dbContext.SaveChangesAsync(cancellationToken);
            }

            var updatedMission = await dbContext.Missions
                .AsNoTracking()
                .Include(item => item.Zone)
                .Include(item => item.Reward)
                    .ThenInclude(reward => reward!.Partner)
                .Include(item => item.Participants)
                .Include(item => item.MissionIssues)
                .FirstAsync(item => item.Id == id, cancellationToken);

            return Results.Ok(MissionMapper.ToResponse(updatedMission, profile.Id));
        })
        .RequireAuthorization()
        .WithName("LeaveMission");

        return group;
    }

    private static async Task<Guid?> GetCurrentUserIdAsync(
        ClaimsPrincipal principal,
        CivicGoDbContext dbContext,
        CancellationToken cancellationToken)
    {
        if (principal.Identity?.IsAuthenticated != true)
        {
            return null;
        }

        var supabaseUserId =
            principal.FindFirstValue(ClaimTypes.NameIdentifier) ??
            principal.FindFirstValue("sub");

        if (string.IsNullOrWhiteSpace(supabaseUserId))
        {
            return null;
        }

        return await dbContext.Users
            .AsNoTracking()
            .Where(user => user.SupabaseUserId == supabaseUserId)
            .Select(user => (Guid?)user.Id)
            .FirstOrDefaultAsync(cancellationToken);
    }
}
