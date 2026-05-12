using System.Security.Claims;
using CivicGo.Api.Auth;
using CivicGo.Api.Data;
using CivicGo.Api.Data.Entities;
using Microsoft.EntityFrameworkCore;

namespace CivicGo.Api.Rewards;

public static class RewardEndpoints
{
    public static IEndpointRouteBuilder MapRewardEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/rewards").WithTags("Rewards");

        group.MapGet("/", async (CivicGoDbContext dbContext) =>
        {
            var rewards = await CreateRewardQuery(dbContext)
                .OrderBy(reward => reward.Type)
                .ThenBy(reward => reward.RequiredPoints)
                .ThenBy(reward => reward.Title)
                .ToListAsync();

            return Results.Ok(rewards.Select(RewardMapper.ToResponse));
        })
        .WithName("GetRewards");

        group.MapGet("/system", async (CivicGoDbContext dbContext) =>
        {
            var rewards = await CreateRewardQuery(dbContext)
                .Where(reward => reward.Type == "system")
                .OrderBy(reward => reward.RequiredPoints)
                .ToListAsync();

            return Results.Ok(rewards.Select(RewardMapper.ToResponse));
        })
        .WithName("GetSystemRewards");

        group.MapGet("/partner", async (CivicGoDbContext dbContext) =>
        {
            var rewards = await CreateRewardQuery(dbContext)
                .Where(reward => reward.Type == "partner")
                .OrderBy(reward => reward.RequiredPoints)
                .ToListAsync();

            return Results.Ok(rewards.Select(RewardMapper.ToResponse));
        })
        .WithName("GetPartnerRewards");

        group.MapGet("/{id:guid}", async (Guid id, CivicGoDbContext dbContext) =>
        {
            var reward = await CreateRewardQuery(dbContext)
                .FirstOrDefaultAsync(item => item.Id == id);

            return reward is null
                ? Results.NotFound()
                : Results.Ok(RewardMapper.ToResponse(reward));
        })
        .WithName("GetRewardById");

        group.MapPost("/{id:guid}/claim", async (
            Guid id,
            ClaimsPrincipal principal,
            CivicGoDbContext dbContext,
            UserProfileService userProfileService,
            CancellationToken cancellationToken
        ) =>
        {
            var profile = await userProfileService.GetOrCreateAsync(principal);
            var reward = await dbContext.Rewards
                .Include(item => item.Partner)
                .Include(item => item.Zone)
                .FirstOrDefaultAsync(item => item.Id == id, cancellationToken);

            if (reward is null)
            {
                return Results.NotFound();
            }

            var existingClaim = await dbContext.RewardClaims
                .Include(claim => claim.Reward)
                    .ThenInclude(item => item.Partner)
                .FirstOrDefaultAsync(
                    claim => claim.RewardId == id && claim.UserId == profile.Id,
                    cancellationToken
                );

            if (existingClaim is not null)
            {
                return Results.Ok(RewardMapper.ToClaimResponse(existingClaim));
            }

            var now = DateTimeOffset.UtcNow;

            if (!IsRewardClaimable(reward, profile.Points, now, out var reason))
            {
                return Results.BadRequest(new { message = reason });
            }

            var claim = new RewardClaimEntity
            {
                Id = Guid.NewGuid(),
                RewardId = reward.Id,
                Reward = reward,
                UserId = profile.Id,
                MissionId = reward.MissionId,
                ClaimedAt = now,
                Status = "claimed",
                Code = CreateClaimCode()
            };

            reward.ClaimedCount += 1;
            reward.UpdatedAt = now;
            dbContext.RewardClaims.Add(claim);
            await dbContext.SaveChangesAsync(cancellationToken);

            return Results.Ok(RewardMapper.ToClaimResponse(claim));
        })
        .RequireAuthorization()
        .WithName("ClaimReward");

        app.MapGet("/api/me/rewards", async (
            ClaimsPrincipal principal,
            CivicGoDbContext dbContext,
            UserProfileService userProfileService,
            CancellationToken cancellationToken
        ) =>
        {
            var profile = await userProfileService.GetOrCreateAsync(principal);
            var claims = await dbContext.RewardClaims
                .AsNoTracking()
                .Include(claim => claim.Reward)
                    .ThenInclude(reward => reward.Partner)
                .Where(claim => claim.UserId == profile.Id)
                .OrderByDescending(claim => claim.ClaimedAt)
                .ToListAsync(cancellationToken);

            return Results.Ok(claims.Select(RewardMapper.ToClaimResponse));
        })
        .RequireAuthorization()
        .WithTags("Rewards")
        .WithName("GetMyRewardClaims");

        return app;
    }

    private static IQueryable<RewardEntity> CreateRewardQuery(CivicGoDbContext dbContext)
    {
        return dbContext.Rewards
            .AsNoTracking()
            .Include(reward => reward.Partner)
            .Include(reward => reward.Zone)
            .Where(reward => reward.Status != "inactive");
    }

    private static bool IsRewardClaimable(
        RewardEntity reward,
        int userPoints,
        DateTimeOffset now,
        out string reason
    )
    {
        if (reward.Status != "available")
        {
            reason = "This reward is not available right now.";
            return false;
        }

        if (reward.ExpiresAt is not null && reward.ExpiresAt <= now)
        {
            reason = "This reward has expired.";
            return false;
        }

        if (reward.Quantity > 0 && reward.ClaimedCount >= reward.Quantity)
        {
            reason = "This reward has no remaining claims.";
            return false;
        }

        if (userPoints < reward.RequiredPoints)
        {
            reason = $"You need {reward.RequiredPoints - userPoints} more Civic Points to claim this reward.";
            return false;
        }

        reason = string.Empty;
        return true;
    }

    private static string CreateClaimCode()
    {
        return $"CGO-{DateTimeOffset.UtcNow:yyMMdd}-{Guid.NewGuid().ToString("N")[..6].ToUpperInvariant()}";
    }
}
