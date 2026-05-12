namespace CivicGo.Api.Storage;

public sealed class SupabaseStorageOptions
{
    public string Url { get; set; } = string.Empty;
    public string AnonKey { get; set; } = string.Empty;
    public string Bucket { get; set; } = string.Empty;
}
