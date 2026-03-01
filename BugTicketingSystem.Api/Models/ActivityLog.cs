namespace BugTicketingSystem.Api.Models
{
    public class ActivityLog
    {
        public int Id { get; set; }
        public int BugId { get; set; }
        public int? DeveloperId { get; set; }
        public string Action { get; set; } = string.Empty;
        public string? OldValue { get; set; }
        public string? NewValue { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public Bug Bug { get; set; } = null!;
        public Developer? Developer { get; set; }
    }
}
