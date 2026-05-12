using System.Net.Http.Headers;
using Microsoft.Extensions.Options;

namespace CivicGo.Api.Storage;

public sealed class SupabaseStorageService(
    HttpClient httpClient,
    IOptions<SupabaseStorageOptions> options
)
{
    private readonly SupabaseStorageOptions storageOptions = options.Value;

    public async Task<string> UploadIssueImageAsync(
        IFormFile image,
        string userAccessToken,
        CancellationToken cancellationToken
    )
    {
        if (string.IsNullOrWhiteSpace(storageOptions.Url) ||
            string.IsNullOrWhiteSpace(storageOptions.AnonKey) ||
            string.IsNullOrWhiteSpace(storageOptions.Bucket))
        {
            throw new InvalidOperationException("Supabase Storage is not configured.");
        }

        var extension = Path.GetExtension(image.FileName);
        var safeExtension = string.IsNullOrWhiteSpace(extension) ? ".jpg" : extension;
        var objectPath = $"issues/{DateTimeOffset.UtcNow:yyyy/MM}/{Guid.NewGuid():N}{safeExtension}";
        var uploadUrl =
            $"{storageOptions.Url.TrimEnd('/')}/storage/v1/object/{storageOptions.Bucket}/{objectPath}";

        await using var stream = image.OpenReadStream();
        using var content = new StreamContent(stream);
        content.Headers.ContentType = new MediaTypeHeaderValue(
            string.IsNullOrWhiteSpace(image.ContentType) ? "application/octet-stream" : image.ContentType
        );

        using var request = new HttpRequestMessage(HttpMethod.Post, uploadUrl)
        {
            Content = content
        };
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", userAccessToken);
        request.Headers.Add("apikey", storageOptions.AnonKey);
        request.Headers.Add("x-upsert", "false");

        using var response = await httpClient.SendAsync(request, cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            var responseBody = await response.Content.ReadAsStringAsync(cancellationToken);

            throw new InvalidOperationException(
                $"Supabase Storage upload failed with {(int)response.StatusCode}: {responseBody}"
            );
        }

        return $"{storageOptions.Url.TrimEnd('/')}/storage/v1/object/public/{storageOptions.Bucket}/{objectPath}";
    }
}
