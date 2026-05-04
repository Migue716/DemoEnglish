namespace DemoEnglish.Api;

/// <summary>Multipart / request body size caps for large .apkg uploads (Kestrel, IIS, form parser).</summary>
public static class UploadLimits
{
    /// <summary>10 GiB (binary). Change here to adjust upload ceiling everywhere.</summary>
    public const long MaxMultipartBytes = 10L * 1024 * 1024 * 1024;
}
