using System.Collections.Concurrent;
using System.Security.Claims;

namespace CivicGo.Api.Auth;

public sealed class InMemoryUserProfileStore
{
    private readonly ConcurrentDictionary<string, LocalUserProfile> profiles = new();

    public LocalUserProfile GetOrCreate(ClaimsPrincipal principal)
    {
        var supabaseUserId =
            principal.FindFirstValue(ClaimTypes.NameIdentifier) ??
            principal.FindFirstValue("sub");

        if (string.IsNullOrWhiteSpace(supabaseUserId))
        {
            throw new InvalidOperationException("Authenticated user is missing a Supabase subject claim.");
        }

        return profiles.GetOrAdd(
            supabaseUserId,
            _ =>
            {
                var now = DateTimeOffset.UtcNow;
                var email =
                    principal.FindFirstValue(ClaimTypes.Email) ??
                    principal.FindFirstValue("email") ??
                    string.Empty;
                var fullName =
                    principal.FindFirstValue("name") ??
                    principal.FindFirstValue("full_name") ??
                    CreateDisplayNameFromEmail(email);

                return new LocalUserProfile(
                    Guid.NewGuid(),
                    supabaseUserId,
                    email,
                    fullName,
                    "citizen",
                    0,
                    "New Citizen",
                    now,
                    now
                );
            }
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
}
