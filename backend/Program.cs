using System.Security.Claims;
using CivicGo.Api.Activity;
using CivicGo.Api.Agents;
using CivicGo.Api.Agents.Runtime;
using CivicGo.Api.Agents.Tools;
using CivicGo.Api.Ai;
using CivicGo.Api.Auth;
using CivicGo.Api.Dashboard;
using CivicGo.Api.Data;
using CivicGo.Api.Duplicates;
using CivicGo.Api.Gamification;
using CivicGo.Api.Issues;
using CivicGo.Api.Live;
using CivicGo.Api.Missions;
using CivicGo.Api.Rewards;
using CivicGo.Api.Storage;
using CivicGo.Api.Zones;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

var supabaseUrl = builder.Configuration["Supabase:Url"]?.TrimEnd('/');
var supabaseAudience = builder.Configuration["Supabase:JwtAudience"] ?? "authenticated";
var civicGoDbConnectionString = builder.Configuration.GetConnectionString("CivicGoDb");

if (string.IsNullOrWhiteSpace(supabaseUrl))
{
    throw new InvalidOperationException("Supabase:Url must be configured.");
}

if (string.IsNullOrWhiteSpace(civicGoDbConnectionString))
{
    throw new InvalidOperationException("ConnectionStrings:CivicGoDb must be configured.");
}

builder.Services.AddCors(options =>
{
    var allowedOrigins =
        builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ??
        ["http://localhost:5173", "http://127.0.0.1:5173"];

    options.AddPolicy(
        "Frontend",
        policy => policy
            .WithOrigins(allowedOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials()
    );
});

builder.Services.AddOpenApi();
builder.Services.AddSignalR();
builder.Services.AddDbContext<CivicGoDbContext>(options =>
    options.UseNpgsql(civicGoDbConnectionString)
);
builder.Services.AddScoped<UserProfileService>();
builder.Services.AddScoped<IAuthorizationHandler, LocalRoleAuthorizationHandler>();
builder.Services.Configure<SupabaseStorageOptions>(options =>
{
    options.Url = supabaseUrl;
    options.AnonKey = builder.Configuration["Supabase:AnonKey"] ?? string.Empty;
    options.Bucket = builder.Configuration["Supabase:StorageBucket"] ?? "issue-photos";
});
builder.Services.AddHttpClient<SupabaseStorageService>();
builder.Services.Configure<OpenAiOptions>(options =>
{
    options.ApiKey =
        builder.Configuration["OpenAI:ApiKey"] ??
        builder.Configuration["OPENAI_API_KEY"] ??
        string.Empty;
    options.Model =
        builder.Configuration["OpenAI:Model"] ??
        builder.Configuration["OPENAI_MODEL"] ??
        "gpt-4o-mini";
});
builder.Services.AddHttpClient<IssueAiAnalysisService>(client =>
{
    client.BaseAddress = new Uri("https://api.openai.com/v1/");
});
builder.Services.AddScoped<MissionGenerationService>();
builder.Services.AddScoped<RewardMatchingService>();
builder.Services.AddScoped<GamificationService>();
builder.Services.AddScoped<DuplicateDetectionService>();
builder.Services.AddScoped<IssueAgentStepWriter>();
builder.Services.AddScoped<AnalyzeIssueTool>();
builder.Services.AddScoped<SearchNearbyIssuesTool>();
builder.Services.AddScoped<CreateMissionTool>();
builder.Services.AddScoped<MatchRewardTool>();
builder.Services.AddScoped<UpdateZoneScoreTool>();
builder.Services.AddSingleton<IssueAgentOrchestratorService>();
builder.Services.AddSingleton<IssueEventStreamService>();

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.Authority = $"{supabaseUrl}/auth/v1";
        options.Audience = supabaseAudience;
        options.RequireHttpsMetadata = true;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = $"{supabaseUrl}/auth/v1",
            ValidateAudience = true,
            ValidAudience = supabaseAudience,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            NameClaimType = ClaimTypes.Email,
            RoleClaimType = "role"
        };
    });

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly", policy =>
    {
        policy.RequireAuthenticatedUser();
        policy.AddRequirements(new LocalRoleRequirement("admin"));
    });
    options.AddPolicy("PartnerOnly", policy =>
    {
        policy.RequireAuthenticatedUser();
        policy.AddRequirements(new LocalRoleRequirement("partner"));
    });
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<CivicGoDbContext>();

    await dbContext.Database.MigrateAsync();
    await SeedData.EnsureSeedDataAsync(dbContext);
}

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors("Frontend");
app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/health", () => Results.Ok(new
{
    status = "ok",
    service = "CivicGO API",
    timestamp = DateTimeOffset.UtcNow
}))
.WithName("HealthCheck");

app.MapGet("/api/me", async (ClaimsPrincipal user, UserProfileService profiles) =>
{
    var profile = await profiles.GetOrCreateAsync(user);

    return Results.Ok(profile);
})
.RequireAuthorization()
.WithName("GetMe");

app.MapIssueEndpoints();
app.MapAgentRunEndpoints();
app.MapAdminAgentEndpoints();
app.MapActivityEndpoints();
app.MapMissionEndpoints();
app.MapRewardEndpoints();
app.MapZoneEndpoints();
app.MapDashboardEndpoints();
app.MapHub<CivicHub>("/civic-hub");

app.Run();
