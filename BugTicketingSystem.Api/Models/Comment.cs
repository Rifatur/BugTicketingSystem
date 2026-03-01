namespace BugTicketingSystem.Api.Models
{
    public class Comment
    {
        public int Id { get; set; }
        public int BugId { get; set; }
        public int DeveloperId { get; set; }
        public string Content { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public Bug Bug { get; set; } = null!;
        public Developer Developer { get; set; } = null!;
    }
}
