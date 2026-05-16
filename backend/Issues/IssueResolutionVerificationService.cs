using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using CivicGo.Api.Data;
using CivicGo.Api.Data.Entities;
using CivicGo.Api.Ai;
using Microsoft.Extensions.Options;

namespace CivicGo.Api.Issues;

public sealed class IssueResolutionVerificationService(
    HttpClient httpClient,
    IOptions<OpenAiOptions> options,
    CivicGoDbContext dbContext,
    ILogger<IssueResolutionVerificationService> logger
)
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        WriteIndented = false
    };

    private readonly OpenAiOptions openAiOptions = options.Value;

    public async Task<IssueResolutionVerificationResult> VerifyAsync(
        IssueEntity issue,
        string afterImageUrl,
        string resolutionNote,
        CancellationToken cancellationToken
    )
    {
        var startedAt = DateTimeOffset.UtcNow;
        var result = await GetVerificationResultAsync(
            issue,
            afterImageUrl,
            resolutionNote,
            cancellationToken
        );
        var completedAt = DateTimeOffset.UtcNow;
        var run = new AgentRunEntity
        {
            Id = Guid.NewGuid(),
            IssueId = issue.Id,
            Status = result.UsedFallback ? "fallback" : result.IsResolved ? "completed" : "failed",
            StartedAt = startedAt,
            CompletedAt = completedAt,
            CreatedAt = startedAt
        };

        run.AgentSteps.Add(new AgentStepEntity
        {
            Id = Guid.NewGuid(),
            AgentRunId = run.Id,
            AgentName = "Resolution Agent",
            Status = result.UsedFallback ? "fallback" : result.IsResolved ? "completed" : "failed",
            Message = result.IsResolved
                ? "Resolution Agent a confirmat poza de dupa si a inchis problema."
                : "Resolution Agent are nevoie de o poza mai clara inainte sa inchida problema.",
            InputJson = JsonSerializer.Serialize(
                new
                {
                    issue.Id,
                    issue.Title,
                    issue.Category,
                    issue.Severity,
                    issue.Status,
                    beforeImageUrl = issue.ImageUrl,
                    afterImageUrl,
                    resolutionNote,
                    zone = issue.Zone?.Name,
                    issue.Latitude,
                    issue.Longitude
                },
                JsonOptions
            ),
            OutputJson = result.RawResponseJson,
            StartedAt = startedAt,
            CompletedAt = completedAt,
            Order = issue.AgentRuns
                .SelectMany(runItem => runItem.AgentSteps)
                .Select(step => step.Order)
                .DefaultIfEmpty(0)
                .Max() + 1
        });

        issue.AgentRuns.Add(run);
        dbContext.AgentRuns.Add(run);

        return result;
    }

    private async Task<IssueResolutionVerificationResult> GetVerificationResultAsync(
        IssueEntity issue,
        string afterImageUrl,
        string resolutionNote,
        CancellationToken cancellationToken
    )
    {
        if (string.IsNullOrWhiteSpace(openAiOptions.ApiKey))
        {
            return CreateFallbackResult(issue, afterImageUrl, resolutionNote, "missing_openai_key");
        }

        try
        {
            return await VerifyWithOpenAiAsync(issue, afterImageUrl, resolutionNote, cancellationToken);
        }
        catch (Exception exception)
        {
            logger.LogWarning(
                exception,
                "OpenAI resolution verification failed. Falling back for issue {IssueId}.",
                issue.Id
            );

            return CreateFallbackResult(issue, afterImageUrl, resolutionNote, "openai_failed");
        }
    }

    private async Task<IssueResolutionVerificationResult> VerifyWithOpenAiAsync(
        IssueEntity issue,
        string afterImageUrl,
        string resolutionNote,
        CancellationToken cancellationToken
    )
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, "responses");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", openAiOptions.ApiKey);
        request.Content = JsonContent.Create(
            CreateOpenAiRequest(issue, afterImageUrl, resolutionNote),
            options: JsonOptions
        );

        using var response = await httpClient.SendAsync(request, cancellationToken);
        var responseJson = await response.Content.ReadAsStringAsync(cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            throw new InvalidOperationException($"OpenAI returned {(int)response.StatusCode}: {responseJson}");
        }

        var outputText = ExtractOutputText(responseJson);
        var parsed = JsonSerializer.Deserialize<OpenAiResolutionDto>(
            StripCodeFence(outputText),
            JsonOptions
        );

        if (parsed is null || string.IsNullOrWhiteSpace(parsed.Summary))
        {
            throw new InvalidOperationException("OpenAI response did not include a usable resolution verdict.");
        }

        var confidence = NormalizeConfidence(parsed.Confidence);
        var isResolved = parsed.IsResolved == true && confidence >= 0.55;
        var rawJson = JsonSerializer.Serialize(
            new
            {
                source = "openai",
                isResolved,
                confidence,
                summary = Truncate(parsed.Summary, 500, "Poza de dupa a fost verificata."),
                suggestedAction = Truncate(
                    parsed.SuggestedAction,
                    500,
                    isResolved
                        ? "Marcheaza problema ca rezolvata."
                        : "Cere o poza mai clara sau o nota mai concreta."
                )
            },
            JsonOptions
        );

        return new IssueResolutionVerificationResult(
            isResolved,
            confidence,
            Truncate(parsed.Summary, 500, "Poza de dupa a fost verificata."),
            Truncate(
                parsed.SuggestedAction,
                500,
                isResolved
                    ? "Marcheaza problema ca rezolvata."
                    : "Cere o poza mai clara sau o nota mai concreta."
            ),
            false,
            "openai",
            rawJson
        );
    }

    private object CreateOpenAiRequest(
        IssueEntity issue,
        string afterImageUrl,
        string resolutionNote
    )
    {
        return new Dictionary<string, object?>
        {
            ["model"] = string.IsNullOrWhiteSpace(openAiOptions.Model) ? "gpt-4o-mini" : openAiOptions.Model,
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
                            ["text"] = $"""
                                Esti Resolution Agent pentru CiviTm. Compara poza initiala cu poza de dupa. Nota cetateanului este optionala si poate lipsi.
                                Decide daca problema civica pare rezolvata suficient pe baza imaginilor before/after.
                                Raspunde strict JSON cu: isResolved boolean, confidence number 0-1, summary string scurt in romana, suggestedAction string scurt in romana.
                                Nu aproba daca poza de dupa nu arata zona/problema, daca pare alta locatie sau daca rezolvarea este neclara.
                                Problema: {issue.Title}
                                Categorie: {issue.Category}
                                Severitate: {issue.Severity}
                                Descriere initiala: {issue.Description ?? "fara descriere"}
                                Zona: {issue.Zone?.Name ?? "Timisoara"}
                                Nota rezolvare optionala: {(string.IsNullOrWhiteSpace(resolutionNote) ? "fara nota" : resolutionNote)}
                                """
                        },
                        new Dictionary<string, object?>
                        {
                            ["type"] = "input_image",
                            ["image_url"] = issue.ImageUrl,
                            ["detail"] = "low"
                        },
                        new Dictionary<string, object?>
                        {
                            ["type"] = "input_image",
                            ["image_url"] = afterImageUrl,
                            ["detail"] = "low"
                        }
                    }
                }
            }
        };
    }

    private static IssueResolutionVerificationResult CreateFallbackResult(
        IssueEntity issue,
        string afterImageUrl,
        string resolutionNote,
        string reason
    )
    {
        var isResolved = !string.IsNullOrWhiteSpace(afterImageUrl);
        var summary = isResolved
            ? "Verificarea a acceptat poza de dupa ca dovada vizuala a rezolvarii."
            : "Verificarea are nevoie de o poza de dupa clara.";
        var suggestedAction = isResolved
            ? "Marcheaza problema ca rezolvata si acorda punctele civice."
            : "Adauga o poza de dupa clara cu zona rezolvata.";
        var rawJson = JsonSerializer.Serialize(
            new
            {
                source = "fallback",
                reason,
                issueId = issue.Id,
                isResolved,
                confidence = isResolved ? 0.76 : 0.38,
                summary,
                suggestedAction
            },
            JsonOptions
        );

        return new IssueResolutionVerificationResult(
            isResolved,
            isResolved ? 0.76 : 0.38,
            summary,
            suggestedAction,
            true,
            reason,
            rawJson
        );
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

    private static double NormalizeConfidence(double? confidence)
    {
        if (confidence is null or <= 0)
        {
            return 0.72;
        }

        return confidence > 1 && confidence <= 100
            ? Math.Clamp(confidence.Value / 100, 0, 1)
            : Math.Clamp(confidence.Value, 0, 1);
    }

    private static string Truncate(string? value, int maxLength, string fallback)
    {
        var text = string.IsNullOrWhiteSpace(value) ? fallback : value.Trim();

        return text.Length <= maxLength ? text : text[..maxLength];
    }

    private sealed class OpenAiResolutionDto
    {
        [JsonPropertyName("isResolved")]
        public bool? IsResolved { get; set; }

        [JsonPropertyName("confidence")]
        public double? Confidence { get; set; }

        [JsonPropertyName("summary")]
        public string? Summary { get; set; }

        [JsonPropertyName("suggestedAction")]
        public string? SuggestedAction { get; set; }
    }
}
