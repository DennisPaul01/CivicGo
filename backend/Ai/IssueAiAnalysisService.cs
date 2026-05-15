using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using CivicGo.Api.Agents;
using CivicGo.Api.Ai.Prompts;
using CivicGo.Api.Data;
using CivicGo.Api.Data.Entities;
using CivicGo.Api.Issues;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace CivicGo.Api.Ai;

public sealed class IssueAiAnalysisService(
    HttpClient httpClient,
    IOptions<OpenAiOptions> options,
    CivicGoDbContext dbContext,
    ILogger<IssueAiAnalysisService> logger
)
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        WriteIndented = false
    };

    private static readonly HashSet<string> SupportedCategories =
        IssueCategories.Supported.ToHashSet(StringComparer.OrdinalIgnoreCase);

    private static readonly HashSet<string> SupportedSeverities = new(StringComparer.OrdinalIgnoreCase)
    {
        "low",
        "medium",
        "high",
        "critical"
    };

    private static readonly HashSet<string> SupportedResponsibleActors = new(StringComparer.OrdinalIgnoreCase)
    {
        "citizen",
        "community",
        "city_hall",
        "private_company",
        "emergency",
        "unknown",
        "community_and_city_hall"
    };

    private readonly OpenAiOptions openAiOptions = options.Value;

    public async Task<IssueAiAnalysisResponse> AnalyzeIssueAsync(
        Guid issueId,
        IReadOnlyDictionary<string, RuntimeAgentConfig>? agentConfigs,
        CancellationToken cancellationToken
    )
    {
        var issue = await dbContext.Issues
            .Include(item => item.Zone)
            .Include(item => item.AiAnalyses)
            .Include(item => item.AgentRuns)
                .ThenInclude(run => run.AgentSteps)
            .FirstOrDefaultAsync(item => item.Id == issueId, cancellationToken);

        if (issue is null)
        {
            throw new KeyNotFoundException($"Issue {issueId} was not found.");
        }

        var existingAnalysis = issue.AiAnalyses
            .OrderByDescending(analysis => analysis.CreatedAt)
            .FirstOrDefault();

        if (existingAnalysis is not null && issue.Status is "ai_analyzed" or "rejected")
        {
            if (issue.AgentRuns.Count == 0)
            {
                await CreateAgentRunFromAnalysisAsync(issue, existingAnalysis, cancellationToken);
            }

            return ToResponse(existingAnalysis);
        }

        agentConfigs ??= await LoadAgentConfigsAsync(cancellationToken);
        var visionAgent = GetAgentConfig(agentConfigs, "vision", "Vision Agent");
        var triageAgent = GetAgentConfig(agentConfigs, "triage", "Triage Agent");
        var result = await GetAnalysisResultAsync(issue, visionAgent, triageAgent, cancellationToken);
        var startedAt = DateTimeOffset.UtcNow;
        var run = CreateAgentRun(issue, result, visionAgent, triageAgent, startedAt);
        var now = DateTimeOffset.UtcNow;
        var analysis = new IssueAiAnalysisEntity
        {
            Id = Guid.NewGuid(),
            IssueId = issue.Id,
            Category = result.Category,
            Severity = result.Severity,
            Summary = result.Summary,
            ResponsibleActor = result.ResponsibleActor,
            SuggestedAction = result.SuggestedAction,
            Confidence = result.Confidence,
            IsUrgent = result.IsUrgent,
            RewardEligible = result.RewardEligible,
            RawResponseJson = result.RawResponseJson,
            CreatedAt = now
        };

        issue.Category = analysis.Category;
        issue.Severity = analysis.Severity;
        issue.ResponsibleActor = analysis.ResponsibleActor;
        issue.Title = CreateIssueTitle(analysis.Category, issue.Zone?.Name);
        issue.Status = result.IsValidIssue ? "ai_analyzed" : "rejected";
        issue.UpdatedAt = now;

        dbContext.AgentRuns.Add(run);
        dbContext.IssueAiAnalyses.Add(analysis);
        dbContext.PublicActivityFeedItems.Add(new PublicActivityFeedItemEntity
        {
            Id = Guid.NewGuid(),
            Type = result.IsValidIssue ? "issue_analyzed" : "issue_rejected",
            Title = result.IsValidIssue ? "AI checked" : "AI rejected",
            Message = result.IsValidIssue
                ? $"AI checked a {analysis.Category.Replace('_', ' ')} issue in {issue.Zone?.Name ?? "Timisoara"}."
                : $"AI could not confirm a civic issue in {issue.Zone?.Name ?? "Timisoara"}.",
            RelatedIssueId = issue.Id,
            RelatedZoneId = issue.ZoneId,
            CreatedAt = now
        });

        await dbContext.SaveChangesAsync(cancellationToken);

        return ToResponse(analysis);
    }

    public Task<IssueAiAnalysisResponse> AnalyzeIssueAsync(
        Guid issueId,
        CancellationToken cancellationToken
    )
    {
        return AnalyzeIssueAsync(issueId, null, cancellationToken);
    }

    private async Task<IssueAiAnalysisResult> GetAnalysisResultAsync(
        IssueEntity issue,
        RuntimeAgentConfig visionAgent,
        RuntimeAgentConfig triageAgent,
        CancellationToken cancellationToken
    )
    {
        if (!visionAgent.IsEnabled || !triageAgent.IsEnabled)
        {
            var disabledAgents = new[] { visionAgent, triageAgent }
                .Where(agent => !agent.IsEnabled)
                .Select(agent => agent.Name)
                .ToArray();

            return CreateFallbackResult(
                issue,
                $"disabled_by_admin:{string.Join(",", disabledAgents)}",
                visionAgent,
                triageAgent
            );
        }

        if (string.IsNullOrWhiteSpace(openAiOptions.ApiKey))
        {
            return CreateFallbackResult(issue, "missing_openai_key", visionAgent, triageAgent);
        }

        try
        {
            return await AnalyzeWithOpenAiAsync(issue, visionAgent, triageAgent, cancellationToken);
        }
        catch (Exception exception)
        {
            logger.LogWarning(exception, "OpenAI analysis failed. Falling back for issue {IssueId}.", issue.Id);

            return CreateFallbackResult(issue, "openai_failed", visionAgent, triageAgent);
        }
    }

    private async Task<IssueAiAnalysisResult> AnalyzeWithOpenAiAsync(
        IssueEntity issue,
        RuntimeAgentConfig visionAgent,
        RuntimeAgentConfig triageAgent,
        CancellationToken cancellationToken
    )
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, "responses");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", openAiOptions.ApiKey);
        request.Content = JsonContent.Create(
            CreateOpenAiRequest(issue, GetOpenAiModel(visionAgent, triageAgent), visionAgent, triageAgent),
            options: JsonOptions
        );

        using var response = await httpClient.SendAsync(request, cancellationToken);
        var responseJson = await response.Content.ReadAsStringAsync(cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            throw new InvalidOperationException($"OpenAI returned {(int)response.StatusCode}: {responseJson}");
        }

        var outputText = ExtractOutputText(responseJson);
        var parsed = JsonSerializer.Deserialize<OpenAiAnalysisDto>(
            StripCodeFence(outputText),
            JsonOptions
        );

        if (parsed is null || string.IsNullOrWhiteSpace(parsed.Summary))
        {
            throw new InvalidOperationException("OpenAI response did not include a usable analysis.");
        }

        return NormalizeResult(parsed, responseJson);
    }

    private static object CreateOpenAiRequest(
        IssueEntity issue,
        string model,
        RuntimeAgentConfig visionAgent,
        RuntimeAgentConfig triageAgent
    )
    {
        return new Dictionary<string, object?>
        {
            ["model"] = string.IsNullOrWhiteSpace(model) ? "gpt-4o-mini" : model,
            ["input"] = new object[]
            {
                new Dictionary<string, object?>
                {
                    ["role"] = "user",
                    ["content"] = new object[]
                    {
                        new Dictionary<string, object?>
                        {
                            ["type"] = "input_text",
                            ["text"] = IssueAnalysisPromptBuilder.Build(
                                issue,
                                visionAgent.Instructions,
                                triageAgent.Instructions
                            )
                        },
                        new Dictionary<string, object?>
                        {
                            ["type"] = "input_image",
                            ["image_url"] = issue.ImageUrl,
                            ["detail"] = "low"
                        }
                    }
                }
            }
        };
    }

    private string GetOpenAiModel(RuntimeAgentConfig visionAgent, RuntimeAgentConfig triageAgent)
    {
        if (!string.IsNullOrWhiteSpace(visionAgent.Model) &&
            !visionAgent.Model.Equals("deterministic", StringComparison.OrdinalIgnoreCase))
        {
            return visionAgent.Model;
        }

        if (!string.IsNullOrWhiteSpace(triageAgent.Model) &&
            !triageAgent.Model.Equals("deterministic", StringComparison.OrdinalIgnoreCase))
        {
            return triageAgent.Model;
        }

        return string.IsNullOrWhiteSpace(openAiOptions.Model) ? "gpt-4o-mini" : openAiOptions.Model;
    }

    private static string ExtractOutputText(string responseJson)
    {
        using var document = JsonDocument.Parse(responseJson);
        var root = document.RootElement;

        if (root.TryGetProperty("output_text", out var outputText) &&
            outputText.ValueKind == JsonValueKind.String)
        {
            return outputText.GetString() ?? string.Empty;
        }

        if (!root.TryGetProperty("output", out var output) ||
            output.ValueKind != JsonValueKind.Array)
        {
            return string.Empty;
        }

        foreach (var item in output.EnumerateArray())
        {
            if (!item.TryGetProperty("content", out var content) ||
                content.ValueKind != JsonValueKind.Array)
            {
                continue;
            }

            foreach (var part in content.EnumerateArray())
            {
                if (part.TryGetProperty("text", out var text) &&
                    text.ValueKind == JsonValueKind.String)
                {
                    return text.GetString() ?? string.Empty;
                }
            }
        }

        return string.Empty;
    }

    private static string StripCodeFence(string text)
    {
        var trimmed = text.Trim();

        if (!trimmed.StartsWith("```", StringComparison.Ordinal))
        {
            return trimmed;
        }

        var firstNewLine = trimmed.IndexOf('\n', StringComparison.Ordinal);
        var lastFence = trimmed.LastIndexOf("```", StringComparison.Ordinal);

        return firstNewLine >= 0 && lastFence > firstNewLine
            ? trimmed[(firstNewLine + 1)..lastFence].Trim()
            : trimmed;
    }

    private static IssueAiAnalysisResult NormalizeResult(
        OpenAiAnalysisDto dto,
        string rawResponseJson
    )
    {
        var category = NormalizeValue(dto.Category, SupportedCategories, "other");
        var severity = NormalizeValue(dto.Severity, SupportedSeverities, "medium");
        var responsibleActor = NormalizeValue(
            dto.ResponsibleActor,
            SupportedResponsibleActors,
            "unknown"
        );
        var confidence = NormalizeConfidence(dto.Confidence);
        var isUrgent = dto.IsUrgent ?? severity is "high" or "critical";
        var isValidIssue = dto.IsValidIssue ?? true;
        var invalidReason = isValidIssue
            ? null
            : Truncate(
                dto.InvalidReason,
                240,
                "Imaginea nu confirma o problema civica raportabila."
            );

        var rawJson = JsonSerializer.Serialize(
            new
            {
                source = "openai",
                category = isValidIssue ? category : IssueCategories.Other,
                severity = isValidIssue ? severity : "low",
                summary = Truncate(
                    dto.Summary,
                    700,
                    "AI checked this city issue and prepared it for civic follow-up."
                ),
                confidence,
                isUrgent = isValidIssue && isUrgent,
                responsibleActor = isValidIssue ? responsibleActor : "unknown",
                suggestedAction = Truncate(
                    dto.SuggestedAction,
                    700,
                    "Verifica raportul si trimite-l catre actiunea civica potrivita."
                ),
                rewardEligible = isValidIssue &&
                    (dto.RewardEligible ?? IssueCategories.IsRewardEligible(category)),
                isValidIssue,
                invalidReason
            },
            JsonOptions
        );

        return new IssueAiAnalysisResult(
            isValidIssue ? category : IssueCategories.Other,
            isValidIssue ? severity : "low",
            Truncate(dto.Summary, 700, "AI checked this city issue and prepared it for civic follow-up."),
            confidence,
            isValidIssue && isUrgent,
            isValidIssue ? responsibleActor : "unknown",
            Truncate(dto.SuggestedAction, 700, "Verifica raportul si trimite-l catre actiunea civica potrivita."),
            isValidIssue && (dto.RewardEligible ?? IssueCategories.IsRewardEligible(category)),
            isValidIssue,
            invalidReason,
            rawJson,
            false,
            "openai"
        );
    }

    private static IssueAiAnalysisResult CreateFallbackResult(
        IssueEntity issue,
        string reason,
        RuntimeAgentConfig? visionAgent = null,
        RuntimeAgentConfig? triageAgent = null
    )
    {
        var text = $"{issue.Description} {issue.Title}".ToLowerInvariant();
        var category = DetectCategory(text);
        var severity = DetectSeverity(text, category);
        var responsibleActor = DetectResponsibleActor(category, severity, text);
        var isUrgent = severity is "high" or "critical";
        var rewardEligible = DetectRewardEligible(category, severity, responsibleActor);
        var isValidIssue = DetectFallbackValidity(text, category);
        if (!isValidIssue)
        {
            category = IssueCategories.Other;
            severity = "low";
            responsibleActor = "unknown";
            isUrgent = false;
            rewardEligible = false;
        }
        var zoneName = issue.Zone?.Name ?? "Timisoara";
        var summary = !isValidIssue
            ? $"Imaginea sau descrierea nu confirma o problema civica in {zoneName}."
            : category == "other"
            ? $"Problema raportata in {zoneName}, trimisa pentru verificare civica."
            : $"Problema de tip {HumanizeRo(category)} raportata in {zoneName}.";
        var suggestedAction = !isValidIssue
            ? "Raportul este respins automat si poate fi retrimis cu o poza relevanta."
            : responsibleActor switch
        {
            "emergency" => "Escaladeaza rapid si verifica riscul de siguranta la fata locului.",
            "city_hall" => "Trimite catre serviciile orasului pentru inspectie si rezolvare.",
            "community_and_city_hall" => "Pregateste o actiune comunitara si anunta serviciile orasului.",
            "community" => "Creeaza o misiune comunitara usoara de follow-up.",
            _ => "Verifica raportul si atribuie responsabilul civic potrivit."
        };
        var confidence = category == "other" ? 0.72 : 0.81;
        var rawJson = JsonSerializer.Serialize(
            new
            {
                source = "fallback",
                reason,
                visionAgent = visionAgent is null ? null : new
                {
                    visionAgent.Name,
                    visionAgent.IsEnabled,
                    visionAgent.FallbackMode
                },
                triageAgent = triageAgent is null ? null : new
                {
                    triageAgent.Name,
                    triageAgent.IsEnabled,
                    triageAgent.FallbackMode
                },
                category,
                severity,
                summary,
                confidence,
                isUrgent,
                responsibleActor,
                suggestedAction,
                rewardEligible,
                isValidIssue,
                invalidReason = isValidIssue
                    ? null
                    : "Fallback-ul nu a gasit indicii textuale pentru o problema civica."
            },
            JsonOptions
        );

        return new IssueAiAnalysisResult(
            category,
            severity,
            summary,
            confidence,
            isUrgent,
            responsibleActor,
            suggestedAction,
            rewardEligible,
            isValidIssue,
            isValidIssue
                ? null
                : "Fallback-ul nu a gasit indicii textuale pentru o problema civica.",
            rawJson,
            true,
            reason
        );
    }

    private static AgentRunEntity CreateAgentRun(
        IssueEntity issue,
        IssueAiAnalysisResult result,
        RuntimeAgentConfig? visionAgent,
        RuntimeAgentConfig? triageAgent,
        DateTimeOffset startedAt
    )
    {
        var status = result.UsedFallback ? "fallback" : "completed";
        var completedAt = startedAt.AddMilliseconds(result.UsedFallback ? 850 : 1200);
        var run = new AgentRunEntity
        {
            Id = Guid.NewGuid(),
            IssueId = issue.Id,
            Status = status,
            StartedAt = startedAt,
            CompletedAt = completedAt,
            CreatedAt = startedAt
        };

        run.AgentSteps.Add(CreateStep(
            run.Id,
            "Vision Agent",
            GetStepStatus(visionAgent, status),
            visionAgent?.IsEnabled == false
                ? "Vision Agent este oprit din configuratia admin; analiza foloseste fallback determinist."
                :
            result.UsedFallback
                ? $"Fallback-ul a identificat o problema de tip {HumanizeRo(result.Category)}."
                : $"A identificat din poza o problema de tip {HumanizeRo(result.Category)}.",
            new
            {
                issue.ImageUrl,
                issue.Description,
                zone = issue.Zone?.Name,
                issue.Latitude,
                issue.Longitude,
                adminInstructions = visionAgent?.Instructions,
                configuredModel = visionAgent?.Model,
                fallbackMode = visionAgent?.FallbackMode,
                isEnabled = visionAgent?.IsEnabled ?? true
            },
            new
            {
                result.Category,
                result.Severity,
                result.Summary,
                result.Confidence,
                result.IsUrgent,
                result.IsValidIssue,
                result.InvalidReason
            },
            startedAt,
            startedAt.AddMilliseconds(420),
            1
        ));

        run.AgentSteps.Add(CreateStep(
            run.Id,
            "Triage Agent",
            result.IsValidIssue ? GetStepStatus(triageAgent, status) : "skipped",
            triageAgent?.IsEnabled == false
                ? "Triage Agent este oprit din configuratia admin; rutarea foloseste fallback determinist."
                :
            !result.IsValidIssue
                ? "Raportul nu este o problema civica valida, asa ca trierea este sarita."
                :
            result.UsedFallback
                ? $"Fallback-ul a directionat cazul catre {HumanizeRo(result.ResponsibleActor)}."
                : $"A gasit cine poate ajuta: {HumanizeRo(result.ResponsibleActor)}.",
            new
            {
                result.Category,
                result.Severity,
                issue.Zone?.Name,
                adminInstructions = triageAgent?.Instructions,
                configuredModel = triageAgent?.Model,
                fallbackMode = triageAgent?.FallbackMode,
                isEnabled = triageAgent?.IsEnabled ?? true
            },
            new
            {
                result.ResponsibleActor,
                result.SuggestedAction,
                result.RewardEligible
            },
            startedAt.AddMilliseconds(430),
            completedAt,
            2
        ));

        return run;
    }

    private static string GetStepStatus(RuntimeAgentConfig? agentConfig, string fallbackStatus)
    {
        return agentConfig?.IsEnabled == false ? "skipped" : fallbackStatus;
    }

    private async Task CreateAgentRunFromAnalysisAsync(
        IssueEntity issue,
        IssueAiAnalysisEntity analysis,
        CancellationToken cancellationToken
    )
    {
        var result = new IssueAiAnalysisResult(
            analysis.Category,
            analysis.Severity,
            analysis.Summary,
            NormalizeConfidence(analysis.Confidence),
            analysis.IsUrgent,
            analysis.ResponsibleActor,
            analysis.SuggestedAction,
            analysis.RewardEligible,
            ExtractIsValidIssue(analysis.RawResponseJson),
            ExtractInvalidReason(analysis.RawResponseJson),
            analysis.RawResponseJson,
            analysis.RawResponseJson.Contains("\"source\":\"fallback\"", StringComparison.OrdinalIgnoreCase),
            "reconstructed"
        );
        var startedAt = analysis.CreatedAt.AddMilliseconds(-900);
        var run = CreateAgentRun(issue, result, null, null, startedAt);
        run.CompletedAt = analysis.CreatedAt;

        foreach (var step in run.AgentSteps)
        {
            if (step.CompletedAt > analysis.CreatedAt)
            {
                step.CompletedAt = analysis.CreatedAt;
            }
        }

        dbContext.AgentRuns.Add(run);
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private async Task<IReadOnlyDictionary<string, RuntimeAgentConfig>> LoadAgentConfigsAsync(
        CancellationToken cancellationToken
    )
    {
        return await dbContext.AgentConfigs
            .AsNoTracking()
            .ToDictionaryAsync(
                agent => agent.Key,
                agent => new RuntimeAgentConfig(
                    agent.Key,
                    agent.Name,
                    agent.Instructions,
                    agent.Model,
                    agent.FallbackMode,
                    agent.IsEnabled
                ),
                StringComparer.OrdinalIgnoreCase,
                cancellationToken
            );
    }

    private static RuntimeAgentConfig GetAgentConfig(
        IReadOnlyDictionary<string, RuntimeAgentConfig> agentConfigs,
        string key,
        string fallbackName
    )
    {
        return agentConfigs.TryGetValue(key, out var config)
            ? config
            : RuntimeAgentConfig.Default(key, fallbackName);
    }

    private static AgentStepEntity CreateStep(
        Guid agentRunId,
        string agentName,
        string status,
        string message,
        object input,
        object output,
        DateTimeOffset startedAt,
        DateTimeOffset completedAt,
        int order
    )
    {
        return new AgentStepEntity
        {
            Id = Guid.NewGuid(),
            AgentRunId = agentRunId,
            AgentName = agentName,
            Status = status,
            InputJson = JsonSerializer.Serialize(input, JsonOptions),
            OutputJson = JsonSerializer.Serialize(output, JsonOptions),
            Message = message,
            StartedAt = startedAt,
            CompletedAt = completedAt,
            Order = order
        };
    }

    private static string DetectCategory(string text)
    {
        if (ContainsAny(text, "animal", "animale", "caine", "caini", "pisica", "sobolan", "maidanez"))
        {
            return IssueCategories.Animals;
        }

        if (ContainsAny(text, "gunoi", "trash", "waste", "garbage", "litter", "moloz", "debris",
                "salubrizare", "dezinsectie", "deratizare", "deszapezire", "zapada", "curatenie"))
        {
            return IssueCategories.SanitationPestSnow;
        }

        if (ContainsAny(text, "groapa", "pothole", "asfalt", "road", "drum", "carosabil",
                "strada", "strazi", "trotuar", "trotuare", "bordura", "pavaj"))
        {
            return IssueCategories.StreetsSidewalks;
        }

        if (ContainsAny(text, "semafor", "indicator", "semn", "circulatie", "trafic", "trecere",
                "marcaj", "sens unic"))
        {
            return IssueCategories.RoadTrafficSigns;
        }

        if (ContainsAny(text, "bec", "light", "lighting", "lamp", "intuneric", "streetlight",
                "iluminat"))
        {
            return IssueCategories.PublicLighting;
        }

        if (ContainsAny(text, "parcare", "timpark", "parcometru", "abonament parcare"))
        {
            return IssueCategories.Timpark;
        }

        if (ContainsAny(text, "apa", "water", "leak", "inundat", "flood", "canalizare",
                "termoficare", "caldura", "teava", "conducta"))
        {
            return IssueCategories.WaterSewerHeating;
        }

        if (ContainsAny(text, "parc", "green", "grass", "iarba", "copac", "spatiu verde",
                "loc de joaca", "leagan", "tobogan", "mediu"))
        {
            return IssueCategories.EnvironmentPlaygroundsGreenSpaces;
        }

        if (ContainsAny(text, "bus", "tram", "transport", "statie", "autobuz", "tramvai",
                "troleibuz"))
        {
            return IssueCategories.PublicTransport;
        }

        if (ContainsAny(text, "santier", "construction site", "lucrari"))
        {
            return IssueCategories.ConstructionSites;
        }

        if (ContainsAny(text, "constructie", "teren", "autorizatie", "urbanism", "puz", "pud"))
        {
            return IssueCategories.ConstructionLand;
        }

        if (ContainsAny(text, "publicitate", "reclama", "afisaj", "comert", "magazin", "terasa"))
        {
            return IssueCategories.AdvertisingCommerce;
        }

        if (ContainsAny(text, "scoala", "spital", "gradinita", "liceu", "clinica"))
        {
            return IssueCategories.SchoolsHospitals;
        }

        if (ContainsAny(text, "garaj", "cimitir", "toaleta", "wc public"))
        {
            return IssueCategories.GaragesCemeteriesPublicToilets;
        }

        if (ContainsAny(text, "asociatie", "proprietari", "administrator bloc"))
        {
            return IssueCategories.OwnersAssociations;
        }

        if (ContainsAny(text, "buletin", "carte de identitate", "evidenta persoanelor"))
        {
            return IssueCategories.PopulationRecords;
        }

        if (ContainsAny(text, "website", "platforma", "sesizari online", "aplicatie", "portal"))
        {
            return IssueCategories.WebsitePlatform;
        }

        if (ContainsAny(text, "integritate", "coruptie", "abuz", "functionar", "angajat"))
        {
            return ContainsAny(text, "angajat", "functionar")
                ? IssueCategories.EmployeeIntegrityIssues
                : IssueCategories.IntegrityIssues;
        }

        if (ContainsAny(text, "ordine publica", "galagie", "vandal", "vandalism", "danger",
                "unsafe", "pericol", "safety"))
        {
            return IssueCategories.PublicOrder;
        }

        return IssueCategories.Other;
    }

    private static string DetectSeverity(string text, string category)
    {
        if (ContainsAny(text, "urgent", "critical", "pericol", "injury", "accident", "fire"))
        {
            return "critical";
        }

        if (category is IssueCategories.PublicOrder or IssueCategories.WaterSewerHeating or
            IssueCategories.StreetsSidewalks or IssueCategories.RoadTrafficSigns or
            "public_safety_concern" or "water_issue" or "road_damage")
        {
            return "high";
        }

        if (category is IssueCategories.WebsitePlatform or IssueCategories.OwnersAssociations or
            "graffiti")
        {
            return "low";
        }

        return "medium";
    }

    private static string DetectResponsibleActor(string category, string severity, string text)
    {
        if (severity == "critical")
        {
            return "emergency";
        }

        if (category is IssueCategories.SanitationPestSnow or "waste" &&
            ContainsAny(text, "o sticla", "un ambalaj", "un gunoi", "gunoi mic", "hartie", "doza") &&
            !ContainsAny(text, "moloz", "sac", "saci", "gramada", "containere", "cosuri pline"))
        {
            return "citizen";
        }

        return category switch
        {
            IssueCategories.SanitationPestSnow or IssueCategories.EnvironmentPlaygroundsGreenSpaces or
                IssueCategories.GaragesCemeteriesPublicToilets or
                "waste" or "graffiti" or "green_space_issue" or "green_space" =>
                "community_and_city_hall",
            IssueCategories.PublicLighting or IssueCategories.StreetsSidewalks or
                IssueCategories.WaterSewerHeating or IssueCategories.PublicTransport or
                IssueCategories.RoadTrafficSigns or IssueCategories.Timpark or
                IssueCategories.SchoolsHospitals or IssueCategories.Urbanism or
                IssueCategories.ConstructionLand or IssueCategories.EnvironmentalPermits or
                IssueCategories.PopulationRecords or
                "road_damage" or "broken_lighting" or "water_issue" or "public_transport_issue" or
                "accessibility_issue" => "city_hall",
            IssueCategories.ConstructionSites or IssueCategories.AdvertisingCommerce =>
                "private_company",
            IssueCategories.PublicOrder => "community_and_city_hall",
            "blocked_sidewalk" => "community",
            _ => "unknown"
        };
    }

    private static bool DetectRewardEligible(string category, string severity, string responsibleActor)
    {
        if (severity == "critical" || responsibleActor is "emergency" or "private_company" or "unknown")
        {
            return false;
        }

        if (responsibleActor is "community" or "community_and_city_hall")
        {
            return category is IssueCategories.SanitationPestSnow or
                IssueCategories.EnvironmentPlaygroundsGreenSpaces or
                IssueCategories.GaragesCemeteriesPublicToilets or
                IssueCategories.PublicOrder or
                "waste" or "graffiti" or "green_space_issue" or "green_space" or
                "blocked_sidewalk" or "accessibility_issue" or "damaged_public_furniture";
        }

        return false;
    }

    private static bool DetectFallbackValidity(string text, string category)
    {
        if (category != IssueCategories.Other)
        {
            return true;
        }

        if (string.IsNullOrWhiteSpace(text))
        {
            return false;
        }

        return ContainsAny(
            text,
            "problema",
            "defect",
            "stricat",
            "rupt",
            "pericol",
            "bloc",
            "murdar",
            "sesizare",
            "raport"
        );
    }

    private static bool ContainsAny(string text, params string[] values)
    {
        return values.Any(value => text.Contains(value, StringComparison.OrdinalIgnoreCase));
    }

    private static string NormalizeValue(string? value, HashSet<string> allowedValues, string fallback)
    {
        var normalized = value?.Trim().ToLowerInvariant().Replace(' ', '_');

        return normalized is not null && allowedValues.Contains(normalized) ? normalized : fallback;
    }

    private static double NormalizeConfidence(double? value)
    {
        if (value is null or <= 0)
        {
            return 0.78;
        }

        return value > 1 && value <= 100
            ? Math.Clamp(value.Value / 100, 0, 1)
            : Math.Clamp(value.Value, 0, 1);
    }

    private static string Humanize(string value)
    {
        return value.Replace('_', ' ');
    }

    private static string CreateIssueTitle(string category, string? zoneName)
    {
        var location = string.IsNullOrWhiteSpace(zoneName) ? "Timisoara" : zoneName.Trim();

        return category switch
        {
            IssueCategories.SanitationPestSnow or "waste" =>
                $"Deseuri si salubrizare in {location}",
            IssueCategories.StreetsSidewalks or "road_damage" or "blocked_sidewalk" =>
                $"Problema pe strada sau trotuar in {location}",
            IssueCategories.PublicLighting or "broken_lighting" or "lighting" =>
                $"Iluminat public defect in {location}",
            IssueCategories.EnvironmentPlaygroundsGreenSpaces or "green_space_issue" or "green_space" =>
                $"Spatiu verde sau loc de joaca in {location}",
            IssueCategories.PublicTransport or "public_transport_issue" =>
                $"Transport in comun in {location}",
            IssueCategories.RoadTrafficSigns =>
                $"Trafic rutier si semnalizare in {location}",
            IssueCategories.WaterSewerHeating or "water_issue" =>
                $"Apa, canalizare sau termoficare in {location}",
            IssueCategories.Animals =>
                $"Problema cu animale in {location}",
            IssueCategories.ConstructionSites =>
                $"Santier raportat in {location}",
            IssueCategories.PublicOrder or "public_safety_concern" =>
                $"Ordine publica in {location}",
            _ => $"{IssueCategories.HumanizeRo(category)} in {location}"
        };
    }

    private static string HumanizeRo(string value)
    {
        return value switch
        {
            "citizen" => "cetateni",
            "community" => "comunitate",
            "city_hall" => "primarie",
            "private_company" => "companie privata",
            "emergency" => "servicii de urgenta",
            "unknown" => "neclar",
            "community_and_city_hall" => "comunitate si primarie",
            _ => IssueCategories.HumanizeRo(value)
        };
    }

    private static string Truncate(string? value, int maxLength, string fallback)
    {
        var text = string.IsNullOrWhiteSpace(value) ? fallback : value.Trim();

        return text.Length <= maxLength ? text : text[..maxLength];
    }

    private static bool ExtractIsValidIssue(string rawResponseJson)
    {
        if (string.IsNullOrWhiteSpace(rawResponseJson))
        {
            return true;
        }

        try
        {
            using var document = JsonDocument.Parse(rawResponseJson);
            return !document.RootElement.TryGetProperty("isValidIssue", out var value) ||
                value.ValueKind != JsonValueKind.False;
        }
        catch
        {
            return true;
        }
    }

    private static string? ExtractInvalidReason(string rawResponseJson)
    {
        if (string.IsNullOrWhiteSpace(rawResponseJson))
        {
            return null;
        }

        try
        {
            using var document = JsonDocument.Parse(rawResponseJson);
            return document.RootElement.TryGetProperty("invalidReason", out var value) &&
                value.ValueKind == JsonValueKind.String
                    ? value.GetString()
                    : null;
        }
        catch
        {
            return null;
        }
    }

    public static IssueAiAnalysisResponse ToResponse(IssueAiAnalysisEntity analysis)
    {
        var isValidIssue = ExtractIsValidIssue(analysis.RawResponseJson);

        return new IssueAiAnalysisResponse(
            analysis.Id,
            analysis.IssueId,
            analysis.Category,
            analysis.Severity,
            analysis.Summary,
            analysis.ResponsibleActor,
            analysis.SuggestedAction,
            NormalizeConfidence(analysis.Confidence),
            analysis.IsUrgent,
            analysis.RewardEligible,
            isValidIssue,
            isValidIssue ? null : ExtractInvalidReason(analysis.RawResponseJson),
            analysis.CreatedAt
        );
    }

    private sealed record IssueAiAnalysisResult(
        string Category,
        string Severity,
        string Summary,
        double Confidence,
        bool IsUrgent,
        string ResponsibleActor,
        string SuggestedAction,
        bool RewardEligible,
        bool IsValidIssue,
        string? InvalidReason,
        string RawResponseJson,
        bool UsedFallback,
        string Source
    );

    private sealed class OpenAiAnalysisDto
    {
        [JsonPropertyName("category")]
        public string? Category { get; init; }

        [JsonPropertyName("severity")]
        public string? Severity { get; init; }

        [JsonPropertyName("summary")]
        public string? Summary { get; init; }

        [JsonPropertyName("confidence")]
        public double? Confidence { get; init; }

        [JsonPropertyName("isUrgent")]
        public bool? IsUrgent { get; init; }

        [JsonPropertyName("responsibleActor")]
        public string? ResponsibleActor { get; init; }

        [JsonPropertyName("suggestedAction")]
        public string? SuggestedAction { get; init; }

        [JsonPropertyName("rewardEligible")]
        public bool? RewardEligible { get; init; }

        [JsonPropertyName("isValidIssue")]
        public bool? IsValidIssue { get; init; }

        [JsonPropertyName("invalidReason")]
        public string? InvalidReason { get; init; }
    }
}
