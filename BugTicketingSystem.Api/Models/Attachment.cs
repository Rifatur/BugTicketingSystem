namespace BugTicketingSystem.Api.Models
{
    public class Attachment
    {
        public int Id { get; set; }
        public int BugId { get; set; }
        public string FileName { get; set; } = string.Empty;
        public string FilePath { get; set; } = string.Empty;
        public string? FileType { get; set; }
        public long FileSize { get; set; }
        public DateTime UploadedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public Bug Bug { get; set; } = null!;
    }
}
