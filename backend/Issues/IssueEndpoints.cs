using System.Security.Claims;
using System.Text.Json;
using CivicGo.Api.Agents;
using CivicGo.Api.Ai;
using CivicGo.Api.Auth;
using CivicGo.Api.Data;
using CivicGo.Api.Data.Entities;
using CivicGo.Api.Duplicates;
using CivicGo.Api.Gamification;
using CivicGo.Api.Live;
using CivicGo.Api.Missions;
using CivicGo.Api.Rewards;
using CivicGo.Api.Storage;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CivicGo.Api.Issues;

public static class IssueEndpoints
{
    public static RouteGroupBuilder MapIssueEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/issues").WithTags("Issues");

        group.MapGet("/", async (CivicGoDbContext dbContext) =>
        {
            var issues = await dbContext.Issues
                .AsNoTracking()
                .Include(issue => issue.Zone)
                .Include(issue => issue.AiAnalyses)
                .Include(issue => issue.AgentRuns)
                    .ThenInclude(run => run.AgentSteps)
                .Include(issue => issue.MissionIssues)
                    .ThenInclude(link => link.Mission)
                        .ThenInclude(mission => mission!.Participants)
                .Include(issue => issue.MissionIssues)
                    .ThenInclude(link => link.Mission)
                        .ThenInclude(mission => mission!.Reward)
                            .ThenInclude(reward => reward!.Partner)
                .OrderByDescending(issue => issue.CreatedAt)
                .Take(100)
                .ToListAsync();

            return Results.Ok(issues.Select(issue => ToResponse(issue)));
        })
        .WithName("GetIssues");

        group.MapGet("/{id:guid}", async (Guid id, CivicGoDbContext dbContext) =>
        {
            var issue = await dbContext.Issues
                .AsNoTracking()
                .Include(item => item.Zone)
                .Include(item => item.AiAnalyses)
                .Include(item => item.AgentRuns)
                    .ThenInclude(run => run.AgentSteps)
                .Include(item => item.MissionIssues)
                    .ThenInclude(link => link.Mission)
                        .ThenInclude(mission => mission!.Participants)
                .Include(item => item.MissionIssues)
                    .ThenInclude(link => link.Mission)
                        .ThenInclude(mission => mission!.Reward)
                            .ThenInclude(reward => reward!.Partner)
                .FirstOrDefaultAsync(item => item.Id == id);

            return issue is null ? Results.NotFound() : Results.Ok(ToResponse(issue));
        })
        .WithName("GetIssueById");

        group.MapGet("/{id:guid}/events", async (
            Guid id,
            HttpContext httpContext,
            IssueEventStreamService eventStream,
            CancellationToken cancellationToken
        ) =>
        {
            httpContext.Response.Headers.CacheControl = "no-cache";
            httpContext.Response.Headers.Connection = "keep-alive";
            httpContext.Response.ContentType = "text/event-stream";

            await WriteServerSentEventAsync(
                httpContext,
                0,
                "stream.connected",
                JsonSerializer.Serialize(
                    new
                    {
                        type = "stream.connected",
                        data = new
                        {
                            issueId = id,
                            connectedAt = DateTimeOffset.UtcNow
                        }
                    },
                    new JsonSerializerOptions(JsonSerializerDefaults.Web)
                ),
                cancellationToken
            );

            using var subscription = eventStream.Subscribe(id);

            await foreach (var item in subscription.Reader.ReadAllAsync(cancellationToken))
            {
                await WriteServerSentEventAsync(
                    httpContext,
                    item.Id,
                    item.Type,
                    IssueEventStreamService.SerializeData(item),
                    cancellationToken
                );
            }
        })
        .WithName("StreamIssueEvents");

        group.MapPost("/", async (
            [FromForm] IFormFile image,
            [FromForm] string? description,
            [FromForm] double latitude,
            [FromForm] double longitude,
            [FromForm] string zoneName,
            ClaimsPrincipal principal,
            HttpContext httpContext,
            CivicGoDbContext dbContext,
            UserProfileService userProfileService,
            SupabaseStorageService storageService,
            IssueAgentPipelineService agentPipeline,
            CancellationToken cancellationToken
        ) =>
        {
            if (image.Length == 0)
            {
                return Results.BadRequest(new { message = "Image is required." });
            }

            if (string.IsNullOrWhiteSpace(zoneName))
            {
                return Results.BadRequest(new { message = "Zone name is required." });
            }

            var accessToken = GetBearerToken(httpContext);

            if (string.IsNullOrWhiteSpace(accessToken))
            {
                return Results.Unauthorized();
            }

            var profile = await userProfileService.GetOrCreateAsync(principal);
            var request = new CreateIssueRequest
            {
                Image = image,
                Description = description,
                Latitude = latitude,
                Longitude = longitude,
                ZoneName = zoneName
            };
            var zone = await FindOrCreateZoneAsync(dbContext, request, cancellationToken);
            var imageUrl = await storageService.UploadIssueImageAsync(
                request.Image,
                accessToken,
                cancellationToken
            );
            var now = DateTimeOffset.UtcNow;
            var issue = new IssueEntity
            {
                Id = Guid.NewGuid(),
                Title = CreateTitle(request.ZoneName),
                Description = request.Description?.Trim(),
                Category = "other",
                Severity = "medium",
                Status = "new",
                ResponsibleActor = "unknown",
                ImageUrl = imageUrl,
                Latitude = request.Latitude,
                Longitude = request.Longitude,
                LocationPoint = $"POINT({request.Longitude} {request.Latitude})",
                ZoneId = zone.Id,
                Zone = zone,
                CreatedByUserId = profile.Id,
                ConfirmedCount = 0,
                DuplicateCount = 0,
                CreatedAt = now,
                UpdatedAt = now
            };

            dbContext.Issues.Add(issue);
            dbContext.PublicActivityFeedItems.Add(new PublicActivityFeedItemEntity
            {
                Id = Guid.NewGuid(),
                Type = "issue_created",
                Title = "New issue reported",
                Message = $"{profile.FullName} reported a new issue in {zone.Name}.",
                RelatedIssueId = issue.Id,
                RelatedZoneId = zone.Id,
                CreatedAt = now
            });

            await dbContext.SaveChangesAsync(cancellationToken);
            agentPipeline.Enqueue(issue.Id);

            return Results.Created($"/api/issues/{issue.Id}", ToResponse(issue));
        })
        .RequireAuthorization()
        .DisableAntiforgery()
        .WithName("CreateIssue");

        group.MapPost("/{id:guid}/analyze", async (
            Guid id,
            IssueAiAnalysisService aiAnalysisService,
            CancellationToken cancellationToken
        ) =>
        {
            try
            {
                var analysis = await aiAnalysisService.AnalyzeIssueAsync(id, cancellationToken);

                return Results.Ok(analysis);
            }
            catch (KeyNotFoundException)
            {
                return Results.NotFound();
            }
        })
        .RequireAuthorization()
        .WithName("AnalyzeIssue");

        return group;
    }

    private static string? GetBearerToken(HttpContext httpContext)
    {
        var authorizationHeader = httpContext.Request.Headers.Authorization.ToString();
        const string bearerPrefix = "Bearer ";

        return authorizationHeader.StartsWith(bearerPrefix, StringComparison.OrdinalIgnoreCase)
            ? authorizationHeader[bearerPrefix.Length..].Trim()
            : null;
    }

    private static async Task<ZoneEntity> FindOrCreateZoneAsync(
        CivicGoDbContext dbContext,
        CreateIssueRequest request,
        CancellationToken cancellationToken
    )
    {
        var zoneName = request.ZoneName.Trim();
        var existingZone = await dbContext.Zones
            .FirstOrDefaultAsync(zone => zone.Name == zoneName, cancellationToken);

        if (existingZone is not null)
        {
            return existingZone;
        }

        var now = DateTimeOffset.UtcNow;
        var zone = new ZoneEntity
        {
            Id = Guid.NewGuid(),
            Name = zoneName,
            Description = "User-selected reporting area.",
            Score = 0,
            Latitude = request.Latitude,
            Longitude = request.Longitude,
            CreatedAt = now,
            UpdatedAt = now
        };

        dbContext.Zones.Add(zone);
        await dbContext.SaveChangesAsync(cancellationToken);

        return zone;
    }

    private static string CreateTitle(string zoneName)
    {
        return $"Reported issue in {zoneName.Trim()}";
    }

    private static async Task WriteServerSentEventAsync(
        HttpContext httpContext,
        long id,
        string eventType,
        string data,
        CancellationToken cancellationToken
    )
    {
        await httpContext.Response.WriteAsync($"id: {id}\n", cancellationToken);
        await httpContext.Response.WriteAsync($"event: {eventType}\n", cancellationToken);
        await httpContext.Response.WriteAsync($"data: {data}\n\n", cancellationToken);
        await httpContext.Response.Body.FlushAsync(cancellationToken);
    }

    private static IssueResponse ToResponse(
        IssueEntity issue,
        GamificationAwardResponse? gamification = null
    )
    {
        var latestAnalysis = issue.AiAnalyses
            .OrderByDescending(analysis => analysis.CreatedAt)
            .FirstOrDefault();
        var latestAgentRun = issue.AgentRuns
            .OrderByDescending(run => run.CreatedAt)
            .FirstOrDefault();
        var relatedMission = issue.MissionIssues
            .Select(link => link.Mission)
            .Where(mission => mission is not null)
            .OrderByDescending(mission => mission!.CreatedAt)
            .FirstOrDefault();

        return new IssueResponse(
            issue.Id,
            issue.Title,
            issue.Description,
            issue.Category,
            issue.Severity,
            issue.Status,
            issue.ResponsibleActor,
            issue.ImageUrl,
            issue.AfterImageUrl,
            issue.Latitude,
            issue.Longitude,
            issue.Zone?.Name,
            latestAnalysis?.Summary,
            latestAnalysis is null ? null : NormalizeConfidence(latestAnalysis.Confidence),
            latestAnalysis?.IsUrgent ?? false,
            latestAnalysis?.RewardEligible ?? false,
            latestAnalysis?.CreatedAt,
            issue.DuplicateCount,
            IssueDuplicateMapper.GetNearestDuplicate(issue),
            latestAgentRun is null ? null : AgentRunMapper.ToResponse(latestAgentRun),
            relatedMission is null ? null : MissionMapper.ToSummary(relatedMission),
            RewardMapper.ToSummary(relatedMission?.Reward),
            gamification,
            issue.CreatedByUserId,
            issue.CreatedAt
        );
    }

    private static double NormalizeConfidence(double confidence)
    {
        if (confidence <= 0)
        {
            return 0.78;
        }

        return confidence > 1 && confidence <= 100
            ? Math.Clamp(confidence / 100, 0, 1)
            : Math.Clamp(confidence, 0, 1);
    }
}
