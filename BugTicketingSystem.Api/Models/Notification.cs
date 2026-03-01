namespace BugTicketingSystem.Api.Models
{
    public class Notification
    {
        public int Id { get; set; }
        public int DeveloperId { get; set; }
        public int? BugId { get; set; }
        public NotificationType Type { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Message { get; set; }
        public bool IsRead { get; set; } = false;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? ReadAt { get; set; }
        // Navigation properties
        public Developer Developer { get; set; } = null!;
        public Bug? Bug { get; set; }
    }
}
