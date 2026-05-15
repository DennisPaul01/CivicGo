using Microsoft.AspNetCore.Authorization;

namespace CivicGo.Api.Auth;

public sealed class LocalRoleRequirement(params string[] allowedRoles) : IAuthorizationRequirement
{
    public IReadOnlySet<string> AllowedRoles { get; } = new HashSet<string>(
        allowedRoles,
        StringComparer.OrdinalIgnoreCase
    );
}

public sealed class LocalRoleAuthorizationHandler(
    UserProfileService userProfileService
) : AuthorizationHandler<LocalRoleRequirement>
{
    protected override async Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        LocalRoleRequirement requirement
    )
    {
        if (context.User.Identity?.IsAuthenticated != true)
        {
            return;
        }

        var profile = await userProfileService.GetOrCreateAsync(context.User);

        if (requirement.AllowedRoles.Contains(profile.Role))
        {
            context.Succeed(requirement);
        }
    }
}
