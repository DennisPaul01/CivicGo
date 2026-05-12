using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using CivicGo.Api.Ai.Prompts;
using CivicGo.Api.Data;
using CivicGo.Api.Data.Entities;
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

    private static readonly HashSet<string> SupportedCategories = new(StringComparer.OrdinalIgnoreCase)
    {
        "waste",
        "road_damage",
        "broken_lighting",
        "blocked_sidewalk",
        "graffiti",
        "damaged_public_furniture",
        "green_space_issue",
        "accessibility_issue",
        "public_safety_concern",
        "abandoned_object",
        "water_issue",
        "public_transport_issue",
        "other"
    };

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

        if (existingAnalysis is not null && issue.Status == "ai_analyzed")
        {
            if (issue.AgentRuns.Count == 0)
            {
                await CreateAgentRunFromAnalysisAsync(issue, existingAnalysis, cancellationToken);
            }

            return ToResponse(existingAnalysis);
        }

        var result = await GetAnalysisResultAsync(issue, cancellationToken);
        var startedAt = DateTimeOffset.UtcNow;
        var run = CreateAgentRun(issue, result, startedAt);
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
        issue.Status = "ai_analyzed";
        issue.UpdatedAt = now;

        dbContext.AgentRuns.Add(run);
        dbContext.IssueAiAnalyses.Add(analysis);
        dbContext.PublicActivityFeedItems.Add(new PublicActivityFeedItemEntity
        {
            Id = Guid.NewGuid(),
            Type = "issue_analyzed",
            Title = "AI checked",
            Message = $"AI checked a {analysis.Category.Replace('_', ' ')} issue in {issue.Zone?.Name ?? "Timisoara"}.",
            RelatedIssueId = issue.Id,
            RelatedZoneId = issue.ZoneId,
            CreatedAt = now
        });

        await dbContext.SaveChangesAsync(cancellationToken);

        return ToResponse(analysis);
    }

    private async Task<IssueAiAnalysisResult> GetAnalysisResultAsync(
        IssueEntity issue,
        CancellationToken cancellationToken
    )
    {
        if (string.IsNullOrWhiteSpace(openAiOptions.ApiKey))
        {
            return CreateFallbackResult(issue, "missing_openai_key");
        }

        try
        {
            return await AnalyzeWithOpenAiAsync(issue, cancellationToken);
        }
        catch (Exception exception)
        {
            logger.LogWarning(exception, "OpenAI analysis failed. Falling back for issue {IssueId}.", issue.Id);

            return CreateFallbackResult(issue, "openai_failed");
        }
    }

    private async Task<IssueAiAnalysisResult> AnalyzeWithOpenAiAsync(
        IssueEntity issue,
        CancellationToken cancellationToken
    )
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, "responses");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", openAiOptions.ApiKey);
        request.Content = JsonContent.Create(
            CreateOpenAiRequest(issue, openAiOptions.Model),
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

    private static object CreateOpenAiRequest(IssueEntity issue, string model)
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
                            ["text"] = IssueAnalysisPromptBuilder.Build(issue)
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

        return new IssueAiAnalysisResult(
            category,
            severity,
            Truncate(dto.Summary, 700, "AI checked this city issue and prepared it for civic follow-up."),
            confidence,
            isUrgent,
            responsibleActor,
            Truncate(dto.SuggestedAction, 700, "Review and route this issue to the right civic action."),
            dto.RewardEligible ?? category is "waste" or "graffiti" or "green_space_issue",
            rawResponseJson,
            false,
            "openai"
        );
    }

    private static IssueAiAnalysisResult CreateFallbackResult(IssueEntity issue, string reason)
    {
        var text = $"{issue.Description} {issue.Title}".ToLowerInvariant();
        var category = DetectCategory(text);
        var severity = DetectSeverity(text, category);
        var responsibleActor = DetectResponsibleActor(category, severity);
        var isUrgent = severity is "high" or "critical";
        var zoneName = issue.Zone?.Name ?? "Timisoara";
        var summary = category == "other"
            ? $"Issue reported in {zoneName} and queued for civic review."
            : $"{Humanize(category)} issue reported in {zoneName}.";
        var suggestedAction = responsibleActor switch
        {
            "emergency" => "Escalate quickly and verify the safety risk on site.",
            "city_hall" => "Route to city services for inspection and resolution.",
            "community_and_city_hall" => "Prepare a community action and notify city services.",
            "community" => "Create a lightweight community follow-up mission.",
            _ => "Review the report and assign the right civic owner."
        };
        var confidence = category == "other" ? 0.72 : 0.81;
        var rawJson = JsonSerializer.Serialize(
            new
            {
                source = "fallback",
                reason,
                category,
                severity,
                summary,
                confidence,
                isUrgent,
                responsibleActor,
                suggestedAction,
                rewardEligible = category is "waste" or "graffiti" or "green_space_issue"
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
            category is "waste" or "graffiti" or "green_space_issue",
            rawJson,
            true,
            reason
        );
    }

    private static AgentRunEntity CreateAgentRun(
        IssueEntity issue,
        IssueAiAnalysisResult result,
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
            status,
            result.UsedFallback
                ? $"Fallback spotted a {Humanize(result.Category)} issue."
                : $"Spotted a {Humanize(result.Category)} issue from the photo.",
            new
            {
                issue.ImageUrl,
                issue.Description,
                zone = issue.Zone?.Name,
                issue.Latitude,
                issue.Longitude
            },
            new
            {
                result.Category,
                result.Severity,
                result.Summary,
                result.Confidence,
                result.IsUrgent
            },
            startedAt,
            startedAt.AddMilliseconds(420),
            1
        ));

        run.AgentSteps.Add(CreateStep(
            run.Id,
            "Triage Agent",
            status,
            result.UsedFallback
                ? $"Fallback routed this to {Humanize(result.ResponsibleActor)}."
                : $"Found who can help: {Humanize(result.ResponsibleActor)}.",
            new
            {
                result.Category,
                result.Severity,
                issue.Zone?.Name
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
            analysis.RawResponseJson,
            analysis.RawResponseJson.Contains("\"source\":\"fallback\"", StringComparison.OrdinalIgnoreCase),
            "reconstructed"
        );
        var startedAt = analysis.CreatedAt.AddMilliseconds(-900);
        var run = CreateAgentRun(issue, result, startedAt);
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
        if (ContainsAny(text, "gunoi", "trash", "waste", "garbage", "litter", "moloz", "debris"))
        {
            return "waste";
        }

        if (ContainsAny(text, "groapa", "pothole", "asfalt", "road", "drum", "carosabil"))
        {
            return "road_damage";
        }

        if (ContainsAny(text, "bec", "light", "lighting", "lamp", "intuneric", "streetlight"))
        {
            return "broken_lighting";
        }

        if (ContainsAny(text, "trotuar", "sidewalk", "blocked", "blocata", "obstruction"))
        {
            return "blocked_sidewalk";
        }

        if (ContainsAny(text, "graffiti", "tag", "vandal"))
        {
            return "graffiti";
        }

        if (ContainsAny(text, "parc", "green", "grass", "iarba", "copac", "spatiu verde"))
        {
            return "green_space_issue";
        }

        if (ContainsAny(text, "apa", "water", "leak", "inundat", "flood"))
        {
            return "water_issue";
        }

        if (ContainsAny(text, "bus", "tram", "transport", "statie"))
        {
            return "public_transport_issue";
        }

        if (ContainsAny(text, "rampa", "wheelchair", "accessibility", "accesibil"))
        {
            return "accessibility_issue";
        }

        return ContainsAny(text, "danger", "unsafe", "pericol", "safety")
            ? "public_safety_concern"
            : "other";
    }

    private static string DetectSeverity(string text, string category)
    {
        if (ContainsAny(text, "urgent", "critical", "pericol", "injury", "accident", "fire"))
        {
            return "critical";
        }

        if (category is "public_safety_concern" or "water_issue" or "road_damage")
        {
            return "high";
        }

        if (category is "graffiti")
        {
            return "low";
        }

        return "medium";
    }

    private static string DetectResponsibleActor(string category, string severity)
    {
        if (severity == "critical")
        {
            return "emergency";
        }

        return category switch
        {
            "waste" or "graffiti" or "green_space_issue" => "community_and_city_hall",
            "road_damage" or "broken_lighting" or "water_issue" or "public_transport_issue" or
                "accessibility_issue" => "city_hall",
            "blocked_sidewalk" => "community",
            _ => "unknown"
        };
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

    private static string Truncate(string? value, int maxLength, string fallback)
    {
        var text = string.IsNullOrWhiteSpace(value) ? fallback : value.Trim();

        return text.Length <= maxLength ? text : text[..maxLength];
    }

    public static IssueAiAnalysisResponse ToResponse(IssueAiAnalysisEntity analysis)
    {
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
    }
}
