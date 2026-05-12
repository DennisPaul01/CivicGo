using System.Security.Claims;
using CivicGo.Api.Data;
using CivicGo.Api.Data.Entities;
using Microsoft.EntityFrameworkCore;

namespace CivicGo.Api.Auth;

public sealed class UserProfileService(CivicGoDbContext dbContext)
{
    private static readonly string[] DemoAdminEmails =
    [
        "admin@civicgo.demo"
    ];

    private static readonly string[] DemoPartnerEmails =
    [
        "partner@civicgo.demo"
    ];

    public async Task<LocalUserProfile> GetOrCreateAsync(ClaimsPrincipal principal)
    {
        var supabaseUserId =
            principal.FindFirstValue(ClaimTypes.NameIdentifier) ??
            principal.FindFirstValue("sub");

        if (string.IsNullOrWhiteSpace(supabaseUserId))
        {
            throw new InvalidOperationException("Authenticated user is missing a Supabase subject claim.");
        }

        var now = DateTimeOffset.UtcNow;
        var email =
            principal.FindFirstValue(ClaimTypes.Email) ??
            principal.FindFirstValue("email") ??
            string.Empty;
        var fullName =
            principal.FindFirstValue("name") ??
            principal.FindFirstValue("full_name") ??
            CreateDisplayNameFromEmail(email);
        var existingUser = await dbContext.Users
            .Include(user => user.Rank)
            .FirstOrDefaultAsync(user => user.SupabaseUserId == supabaseUserId);

        if (existingUser is not null)
        {
            if (IsDemoAdminEmail(existingUser.Email) && existingUser.Role != "admin")
            {
                existingUser.Role = "admin";
                existingUser.UpdatedAt = now;
                await dbContext.SaveChangesAsync();
            }

            if (IsDemoPartnerEmail(existingUser.Email) && existingUser.Role != "partner")
            {
                existingUser.Role = "partner";
                existingUser.UpdatedAt = now;
                await dbContext.SaveChangesAsync();
            }

            return ToProfile(existingUser);
        }

        if (IsDemoAdminEmail(email) || IsDemoPartnerEmail(email))
        {
            var existingDemoUser = await dbContext.Users
                .Include(user => user.Rank)
                .FirstOrDefaultAsync(user => user.Email == email);

            if (existingDemoUser is not null)
            {
                existingDemoUser.SupabaseUserId = supabaseUserId;
                existingDemoUser.FullName = string.IsNullOrWhiteSpace(fullName)
                    ? existingDemoUser.FullName
                    : fullName;
                existingDemoUser.Role = GetDemoRole(email);
                existingDemoUser.UpdatedAt = now;
                await dbContext.SaveChangesAsync();

                return ToProfile(existingDemoUser);
            }
        }

        var initialRank = await dbContext.Ranks
            .OrderBy(rank => rank.MinPoints)
            .FirstOrDefaultAsync();

        var userEntity = new UserEntity
        {
            Id = Guid.NewGuid(),
            SupabaseUserId = supabaseUserId,
            Email = email,
            FullName = fullName,
            Role = GetDemoRole(email),
            Points = 0,
            RankId = initialRank?.Id,
            Rank = initialRank,
            TrustScore = 0,
            CreatedAt = now,
            UpdatedAt = now
        };

        dbContext.Users.Add(userEntity);
        await dbContext.SaveChangesAsync();

        return ToProfile(userEntity);
    }

    private static LocalUserProfile ToProfile(UserEntity user)
    {
        return new LocalUserProfile(
            user.Id,
            user.SupabaseUserId,
            user.Email,
            user.FullName,
            user.Role,
            user.Points,
            user.Rank?.Name ?? "New Citizen",
            user.CreatedAt,
            user.UpdatedAt
        );
    }

    private static string CreateDisplayNameFromEmail(string email)
    {
        if (string.IsNullOrWhiteSpace(email))
        {
            return "Civic citizen";
        }

        var namePart = email.Split('@', 2)[0].Replace('.', ' ').Replace('_', ' ');

        return string.IsNullOrWhiteSpace(namePart) ? "Civic citizen" : namePart;
    }

    private static bool IsDemoAdminEmail(string email)
    {
        return DemoAdminEmails.Contains(email.Trim(), StringComparer.OrdinalIgnoreCase);
    }

    private static bool IsDemoPartnerEmail(string email)
    {
        return DemoPartnerEmails.Contains(email.Trim(), StringComparer.OrdinalIgnoreCase);
    }

    private static string GetDemoRole(string email)
    {
        if (IsDemoAdminEmail(email))
        {
            return "admin";
        }

        return IsDemoPartnerEmail(email) ? "partner" : "citizen";
    }
}
