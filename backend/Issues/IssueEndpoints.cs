using System.Security.Claims;
using System.Security.Cryptography;
using System.Text.Json;
using CivicGo.Api.Agents;
using CivicGo.Api.Agents.Runtime;
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
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace CivicGo.Api.Issues;

public static class IssueEndpoints
{
    private static readonly IReadOnlySet<string> SupportedSeverities = new HashSet<string>(
        ["low", "medium", "high", "critical", "urgent"],
        StringComparer.OrdinalIgnoreCase
    );

    private static readonly IReadOnlySet<string> SupportedStatuses = new HashSet<string>(
        [
            "new",
            "ai_analyzed",
            "duplicate_detected",
            "in_review",
            "in_progress",
            "mission_created",
            "resolved",
            "issue_resolved",
            "rejected"
        ],
        StringComparer.OrdinalIgnoreCase
    );

    private static readonly IReadOnlySet<string> SupportedResponsibleActors = new HashSet<string>(
        [
            "citizen",
            "community",
            "city_hall",
            "private_company",
            "emergency",
            "unknown",
            "community_and_city_hall"
        ],
        StringComparer.OrdinalIgnoreCase
    );

    public static RouteGroupBuilder MapIssueEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/issues").WithTags("Issues");

        group.MapGet("/", async (CivicGoDbContext dbContext) =>
        {
            var issues = await dbContext.Issues
                .AsNoTracking()
                .Include(issue => issue.Zone)
                .Include(issue => issue.Images)
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
                .Include(item => item.Images)
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
            IssueAgentOrchestratorService agentOrchestrator,
            CancellationToken cancellationToken
        ) =>
        {
            var uploadedImages = httpContext.Request.Form.Files
                .Where(file => file.Length > 0)
                .Take(6)
                .ToArray();

            if (image.Length == 0 || uploadedImages.Length == 0)
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
            var uploadedIssueImages = new List<IssueImageEntity>();
            for (var index = 0; index < uploadedImages.Length; index += 1)
            {
                var uploadedImage = uploadedImages[index];
                var contentHash = await CalculateFileSha256Async(uploadedImage, cancellationToken);
                var imageUrl = await storageService.UploadIssueImageAsync(
                    uploadedImage,
                    accessToken,
                    cancellationToken
                );

                uploadedIssueImages.Add(new IssueImageEntity
                {
                    Id = Guid.NewGuid(),
                    Url = imageUrl,
                    ContentHash = contentHash,
                    FileName = uploadedImage.FileName,
                    ContentType = uploadedImage.ContentType,
                    SortOrder = index,
                    CreatedAt = DateTimeOffset.UtcNow
                });
            }

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
                ImageUrl = uploadedIssueImages[0].Url,
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
            foreach (var issueImage in uploadedIssueImages)
            {
                issue.Images.Add(issueImage);
            }

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
            agentOrchestrator.Enqueue(issue.Id);

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

        group.MapPost("/{id:guid}/resolve", async (
            Guid id,
            [FromForm] IFormFile afterImage,
            [FromForm] string resolutionNote,
            ClaimsPrincipal principal,
            HttpContext httpContext,
            CivicGoDbContext dbContext,
            UserProfileService userProfileService,
            SupabaseStorageService storageService,
            IHubContext<CivicHub> civicHub,
            IssueEventStreamService eventStream,
            CancellationToken cancellationToken
        ) =>
        {
            if (afterImage.Length == 0)
            {
                return Results.BadRequest(new { message = "After photo is required." });
            }

            if (string.IsNullOrWhiteSpace(resolutionNote))
            {
                return Results.BadRequest(new { message = "Resolution note is required." });
            }

            var accessToken = GetBearerToken(httpContext);

            if (string.IsNullOrWhiteSpace(accessToken))
            {
                return Results.Unauthorized();
            }

            var issue = await dbContext.Issues
                .Include(item => item.Zone)
                .Include(item => item.Images)
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
                .FirstOrDefaultAsync(item => item.Id == id, cancellationToken);

            if (issue is null)
            {
                return Results.NotFound();
            }

            var profile = await userProfileService.GetOrCreateAsync(principal);

            if (!string.Equals(profile.Role, "admin", StringComparison.OrdinalIgnoreCase))
            {
                return Results.Forbid();
            }

            var now = DateTimeOffset.UtcNow;
            var afterImageUrl = await storageService.UploadIssueImageAsync(
                afterImage,
                accessToken,
                cancellationToken
            );

            issue.Status = "resolved";
            issue.AfterImageUrl = afterImageUrl;
            issue.ResolvedAt = now;
            issue.UpdatedAt = now;

            dbContext.PublicActivityFeedItems.Add(new PublicActivityFeedItemEntity
            {
                Id = Guid.NewGuid(),
                Type = "issue_resolved",
                Title = "Issue resolved",
                Message = $"{profile.FullName} marked \"{issue.Title}\" as resolved: {resolutionNote.Trim()}",
                RelatedIssueId = issue.Id,
                RelatedZoneId = issue.ZoneId,
                CreatedAt = now
            });

            await dbContext.SaveChangesAsync(cancellationToken);
            await PublishIssueStatusChangedAsync(
                civicHub,
                eventStream,
                issue,
                "IssueResolved",
                "issue.resolved",
                cancellationToken
            );
            await PublishIssueStatusChangedAsync(
                civicHub,
                eventStream,
                issue,
                "IssueStatusChanged",
                "issue.status.changed",
                cancellationToken
            );

            return Results.Ok(ToResponse(issue));
        })
        .RequireAuthorization("AdminOnly")
        .DisableAntiforgery()
        .WithName("ResolveIssue");

        group.MapPatch("/{id:guid}/admin", async (
            Guid id,
            UpdateAdminIssueRequest request,
            ClaimsPrincipal principal,
            CivicGoDbContext dbContext,
            UserProfileService userProfileService,
            IHubContext<CivicHub> civicHub,
            IssueEventStreamService eventStream,
            CancellationToken cancellationToken
        ) =>
        {
            var profile = await userProfileService.GetOrCreateAsync(principal);

            if (!IsAdmin(profile))
            {
                return Results.Forbid();
            }

            var issue = await CreateIssueEditQuery(dbContext)
                .FirstOrDefaultAsync(item => item.Id == id, cancellationToken);

            if (issue is null)
            {
                return Results.NotFound();
            }

            var validationError = ValidateAdminIssueRequest(request);

            if (validationError is not null)
            {
                return Results.BadRequest(new { message = validationError });
            }

            var now = DateTimeOffset.UtcNow;
            var previousStatus = issue.Status;

            if (!string.IsNullOrWhiteSpace(request.Title))
            {
                issue.Title = request.Title.Trim();
            }

            issue.Description = request.Description?.Trim();

            if (!string.IsNullOrWhiteSpace(request.Category))
            {
                issue.Category = request.Category.Trim();
            }

            if (!string.IsNullOrWhiteSpace(request.Severity))
            {
                issue.Severity = request.Severity.Trim();
            }

            if (!string.IsNullOrWhiteSpace(request.ResponsibleActor))
            {
                issue.ResponsibleActor = request.ResponsibleActor.Trim();
            }

            if (!string.IsNullOrWhiteSpace(request.Status))
            {
                ApplyIssueStatus(issue, request.Status.Trim(), now);
            }

            if (!string.IsNullOrWhiteSpace(request.ZoneName))
            {
                issue.Zone = await FindOrCreateZoneAsync(
                    dbContext,
                    new CreateIssueRequest
                    {
                        Image = null!,
                        Description = issue.Description,
                        Latitude = request.Latitude ?? issue.Latitude,
                        Longitude = request.Longitude ?? issue.Longitude,
                        ZoneName = request.ZoneName.Trim()
                    },
                    cancellationToken
                );
                issue.ZoneId = issue.Zone.Id;
            }

            if (request.Latitude is not null)
            {
                issue.Latitude = request.Latitude.Value;
            }

            if (request.Longitude is not null)
            {
                issue.Longitude = request.Longitude.Value;
            }

            issue.LocationPoint = $"POINT({issue.Longitude} {issue.Latitude})";
            issue.UpdatedAt = now;

            dbContext.PublicActivityFeedItems.Add(new PublicActivityFeedItemEntity
            {
                Id = Guid.NewGuid(),
                Type = "issue_admin_updated",
                Title = "Issue updated by admin",
                Message = $"{profile.FullName} updated \"{issue.Title}\" in admin.",
                RelatedIssueId = issue.Id,
                RelatedZoneId = issue.ZoneId,
                CreatedAt = now
            });

            await dbContext.SaveChangesAsync(cancellationToken);
            if (!string.Equals(previousStatus, issue.Status, StringComparison.OrdinalIgnoreCase))
            {
                await PublishIssueStatusChangedAsync(
                    civicHub,
                    eventStream,
                    issue,
                    issue.Status is "resolved" or "issue_resolved"
                        ? "IssueResolved"
                        : "IssueStatusChanged",
                    issue.Status is "resolved" or "issue_resolved"
                        ? "issue.resolved"
                        : "issue.status.changed",
                    cancellationToken
                );
            }

            return Results.Ok(ToResponse(issue));
        })
        .RequireAuthorization("AdminOnly")
        .WithName("AdminUpdateIssue");

        group.MapPost("/{id:guid}/admin/close", async (
            Guid id,
            ClaimsPrincipal principal,
            CivicGoDbContext dbContext,
            UserProfileService userProfileService,
            IHubContext<CivicHub> civicHub,
            IssueEventStreamService eventStream,
            CancellationToken cancellationToken
        ) =>
        {
            var profile = await userProfileService.GetOrCreateAsync(principal);

            if (!IsAdmin(profile))
            {
                return Results.Forbid();
            }

            var issue = await CreateIssueEditQuery(dbContext)
                .FirstOrDefaultAsync(item => item.Id == id, cancellationToken);

            if (issue is null)
            {
                return Results.NotFound();
            }

            var now = DateTimeOffset.UtcNow;
            ApplyIssueStatus(issue, "resolved", now);
            issue.UpdatedAt = now;

            dbContext.PublicActivityFeedItems.Add(new PublicActivityFeedItemEntity
            {
                Id = Guid.NewGuid(),
                Type = "issue_resolved",
                Title = "Issue closed by admin",
                Message = $"{profile.FullName} closed \"{issue.Title}\" from admin.",
                RelatedIssueId = issue.Id,
                RelatedZoneId = issue.ZoneId,
                CreatedAt = now
            });

            await dbContext.SaveChangesAsync(cancellationToken);
            await PublishIssueStatusChangedAsync(
                civicHub,
                eventStream,
                issue,
                "IssueResolved",
                "issue.resolved",
                cancellationToken
            );

            return Results.Ok(ToResponse(issue));
        })
        .RequireAuthorization("AdminOnly")
        .WithName("AdminCloseIssue");

        group.MapPost("/{id:guid}/admin/reopen", async (
            Guid id,
            ClaimsPrincipal principal,
            CivicGoDbContext dbContext,
            UserProfileService userProfileService,
            IHubContext<CivicHub> civicHub,
            IssueEventStreamService eventStream,
            CancellationToken cancellationToken
        ) =>
        {
            var profile = await userProfileService.GetOrCreateAsync(principal);

            if (!IsAdmin(profile))
            {
                return Results.Forbid();
            }

            var issue = await CreateIssueEditQuery(dbContext)
                .FirstOrDefaultAsync(item => item.Id == id, cancellationToken);

            if (issue is null)
            {
                return Results.NotFound();
            }

            var now = DateTimeOffset.UtcNow;
            ApplyIssueStatus(issue, "in_review", now);
            issue.UpdatedAt = now;

            dbContext.PublicActivityFeedItems.Add(new PublicActivityFeedItemEntity
            {
                Id = Guid.NewGuid(),
                Type = "issue_reopened",
                Title = "Issue reopened by admin",
                Message = $"{profile.FullName} reopened \"{issue.Title}\" from admin.",
                RelatedIssueId = issue.Id,
                RelatedZoneId = issue.ZoneId,
                CreatedAt = now
            });

            await dbContext.SaveChangesAsync(cancellationToken);
            await PublishIssueStatusChangedAsync(
                civicHub,
                eventStream,
                issue,
                "IssueStatusChanged",
                "issue.status.changed",
                cancellationToken
            );

            return Results.Ok(ToResponse(issue));
        })
        .RequireAuthorization("AdminOnly")
        .WithName("AdminReopenIssue");

        group.MapPost("/{id:guid}/admin/email-draft", async (
            Guid id,
            ClaimsPrincipal principal,
            CivicGoDbContext dbContext,
            UserProfileService userProfileService,
            CancellationToken cancellationToken
        ) =>
        {
            var profile = await userProfileService.GetOrCreateAsync(principal);

            if (!IsAdmin(profile))
            {
                return Results.Forbid();
            }

            var issue = await CreateIssueEditQuery(dbContext)
                .FirstOrDefaultAsync(item => item.Id == id, cancellationToken);

            if (issue is null)
            {
                return Results.NotFound();
            }

            var now = DateTimeOffset.UtcNow;
            var draft = CreateAuthorityEmailDraft(issue, now);
            var agentRun = new AgentRunEntity
            {
                Id = Guid.NewGuid(),
                IssueId = issue.Id,
                Status = "completed",
                StartedAt = now,
                CompletedAt = now,
                CreatedAt = now
            };

            dbContext.AgentRuns.Add(agentRun);
            dbContext.AgentSteps.Add(new AgentStepEntity
            {
                Id = Guid.NewGuid(),
                AgentRunId = agentRun.Id,
                AgentName = draft.AgentName,
                Status = "completed",
                Message = $"Drafted authority email for {draft.RecipientName}.",
                InputJson = JsonSerializer.Serialize(new
                {
                    issue.Id,
                    issue.Title,
                    issue.Category,
                    issue.Severity,
                    issue.Status,
                    issue.ResponsibleActor,
                    ZoneName = issue.Zone?.Name,
                    issue.Latitude,
                    issue.Longitude,
                    issue.ImageUrl,
                    issue.CreatedAt
                }),
                OutputJson = JsonSerializer.Serialize(draft),
                StartedAt = now,
                CompletedAt = now,
                Order = 1
            });
            dbContext.PublicActivityFeedItems.Add(new PublicActivityFeedItemEntity
            {
                Id = Guid.NewGuid(),
                Type = "authority_email_drafted",
                Title = "Authority email drafted",
                Message = $"{profile.FullName} generated an authority email for \"{issue.Title}\".",
                RelatedIssueId = issue.Id,
                RelatedZoneId = issue.ZoneId,
                CreatedAt = now
            });

            await dbContext.SaveChangesAsync(cancellationToken);

            return Results.Ok(draft);
        })
        .RequireAuthorization("AdminOnly")
        .WithName("AdminCreateIssueEmailDraft");

        return group;
    }

    private static IQueryable<IssueEntity> CreateIssueEditQuery(CivicGoDbContext dbContext)
    {
        return dbContext.Issues
            .Include(issue => issue.Zone)
            .Include(issue => issue.Images)
            .Include(issue => issue.AiAnalyses)
            .Include(issue => issue.AgentRuns)
                .ThenInclude(run => run.AgentSteps)
            .Include(issue => issue.MissionIssues)
                .ThenInclude(link => link.Mission)
                    .ThenInclude(mission => mission!.Participants)
            .Include(issue => issue.MissionIssues)
                .ThenInclude(link => link.Mission)
                    .ThenInclude(mission => mission!.Reward)
                        .ThenInclude(reward => reward!.Partner);
    }

    private static bool IsAdmin(LocalUserProfile profile)
    {
        return string.Equals(profile.Role, "admin", StringComparison.OrdinalIgnoreCase);
    }

    private static string? ValidateAdminIssueRequest(UpdateAdminIssueRequest request)
    {
        if (!string.IsNullOrWhiteSpace(request.Category) &&
            !IssueCategories.Supported.Contains(request.Category.Trim()))
        {
            return "Unsupported issue category.";
        }

        if (!string.IsNullOrWhiteSpace(request.Severity) &&
            !SupportedSeverities.Contains(request.Severity.Trim()))
        {
            return "Unsupported issue severity.";
        }

        if (!string.IsNullOrWhiteSpace(request.Status) &&
            !SupportedStatuses.Contains(request.Status.Trim()))
        {
            return "Unsupported issue status.";
        }

        if (!string.IsNullOrWhiteSpace(request.ResponsibleActor) &&
            !SupportedResponsibleActors.Contains(request.ResponsibleActor.Trim()))
        {
            return "Unsupported responsible actor.";
        }

        return null;
    }

    private static void ApplyIssueStatus(IssueEntity issue, string status, DateTimeOffset now)
    {
        issue.Status = status;
        issue.ResolvedAt = status is "resolved" or "issue_resolved" ? now : null;
    }

    private static async Task PublishIssueStatusChangedAsync(
        IHubContext<CivicHub> civicHub,
        IssueEventStreamService eventStream,
        IssueEntity issue,
        string signalREventName,
        string streamEventName,
        CancellationToken cancellationToken
    )
    {
        var payload = new
        {
            issueId = issue.Id,
            issue.Status,
            issue.ZoneId,
            zoneName = issue.Zone?.Name,
            issue.ResolvedAt,
            issue.UpdatedAt
        };

        await civicHub.Clients.All.SendAsync(
            signalREventName,
            payload,
            cancellationToken
        );
        await eventStream.PublishAsync(issue.Id, streamEventName, payload, cancellationToken);
    }

    private static AdminIssueEmailDraftResponse CreateAuthorityEmailDraft(
        IssueEntity issue,
        DateTimeOffset generatedAt
    )
    {
        var authority = GetAuthorityContact(issue);
        var zoneName = issue.Zone?.Name ?? "zona raportata";
        var categoryLabel = IssueCategories.HumanizeRo(issue.Category);
        var severityRationale = CreateSeverityRationale(issue);
        var location = $"{zoneName}, coordonate {issue.Latitude:0.000000}, {issue.Longitude:0.000000}";
        var subject =
            $"Sesizare CivicGO - {categoryLabel} in {zoneName} ({IssueCategories.HumanizeRo(issue.Severity)})";
        var body = $"""
            Buna ziua,

            Va transmitem o sesizare civic-tech generata din platforma CivicGO, cu rugamintea de a analiza si directiona cazul catre echipa competenta.

            Problema raportata: {issue.Title}
            Tip problema: {categoryLabel}
            Gravitate: {IssueCategories.HumanizeRo(issue.Severity)}
            Motivul gravitatii: {severityRationale}
            Locatie: {location}
            Data raportarii: {issue.CreatedAt:dd.MM.yyyy HH:mm} UTC
            Status curent in CivicGO: {issue.Status.Replace('_', ' ')}
            Actor responsabil estimat: {issue.ResponsibleActor.Replace('_', ' ')}

            Descriere:
            {NormalizeEmailText(issue.Description ?? "Nu exista descriere suplimentara.")}

            Dovada foto:
            {issue.ImageUrl}

            Va rugam sa confirmati preluarea cazului si, daca este posibil, sa transmiteti un termen estimativ pentru verificare/interventie. In functie de situatie, comunitatea locala poate sustine documentarea sau actiunile non-riscante, insa interventiile tehnice si cele care tin de siguranta publica trebuie coordonate de autoritatea competenta.

            Multumim,
            Echipa CivicGO
            """;

        return new AdminIssueEmailDraftResponse(
            "Authority Email Agent",
            authority.Name,
            authority.Email,
            subject,
            body,
            issue.ImageUrl,
            severityRationale,
            generatedAt
        );
    }

    private static AuthorityContact GetAuthorityContact(IssueEntity issue)
    {
        return issue.Category switch
        {
            IssueCategories.PublicLighting or "broken_lighting" or "lighting" =>
                new AuthorityContact("Iluminat Public Timisoara", "iluminat.public@primariatm.demo"),
            IssueCategories.StreetsSidewalks or IssueCategories.RoadTrafficSigns or
                "road_damage" or "blocked_sidewalk" =>
                new AuthorityContact("Directia Drumuri si Trotuare", "drumuri@primariatm.demo"),
            IssueCategories.SanitationPestSnow or "waste" or "abandoned_object" =>
                new AuthorityContact("Serviciul Salubrizare Timisoara", "salubrizare@primariatm.demo"),
            IssueCategories.EnvironmentPlaygroundsGreenSpaces or "green_space_issue" or "green_space" =>
                new AuthorityContact("Serviciul Spatii Verzi", "spatii.verzi@primariatm.demo"),
            IssueCategories.PublicTransport or "public_transport_issue" =>
                new AuthorityContact("Transport Public Local", "transport.public@primariatm.demo"),
            IssueCategories.PublicOrder or "public_safety_concern" =>
                new AuthorityContact("Politia Locala Timisoara", "politia.locala@primariatm.demo"),
            IssueCategories.WaterSewerHeating or "water_issue" =>
                new AuthorityContact("Apa, Canalizare si Termoficare", "utilitati@primariatm.demo"),
            _ when issue.ResponsibleActor == "emergency" =>
                new AuthorityContact("Dispecerat Urgente Locale", "urgente.locale@primariatm.demo"),
            _ => new AuthorityContact("Primaria Municipiului Timisoara", "sesizari@primariatm.demo")
        };
    }

    private static string CreateSeverityRationale(IssueEntity issue)
    {
        return issue.Severity switch
        {
            "critical" =>
                "Cazul poate afecta direct siguranta publica si necesita verificare prioritara.",
            "urgent" =>
                "Cazul este marcat urgent deoarece poate produce risc imediat pentru pietoni, trafic sau locuitori.",
            "high" =>
                "Impactul este ridicat pentru zona, iar amanarea interventiei poate agrava problema sau creste riscul pentru comunitate.",
            "medium" =>
                "Problema afecteaza calitatea spatiului public si trebuie planificata pentru verificare operationala.",
            "low" =>
                "Problema are impact local redus, dar este documentata si poate fi inclusa in activitatea curenta de intretinere.",
            _ =>
                "Gravitatea a fost estimata din categoria problemei, descriere si contextul locatiei."
        };
    }

    private static string NormalizeEmailText(string value)
    {
        return value.Trim().Replace("\r", string.Empty);
    }

    private sealed record AuthorityContact(string Name, string Email);

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

    private static async Task<string> CalculateFileSha256Async(
        IFormFile image,
        CancellationToken cancellationToken
    )
    {
        await using var stream = image.OpenReadStream();
        var hash = await SHA256.HashDataAsync(stream, cancellationToken);

        return Convert.ToHexString(hash).ToLowerInvariant();
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
            issue.Images
                .OrderBy(image => image.SortOrder)
                .Select(image => image.Url)
                .DefaultIfEmpty(issue.ImageUrl)
                .ToArray(),
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
