namespace CivicGo.Api.Rewards;

public sealed record PartnerResponse(
    Guid Id,
    string Name,
    string? LogoUrl,
    string Description,
    string? WebsiteUrl
);
