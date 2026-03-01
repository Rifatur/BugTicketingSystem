using System.Xml.Linq;

namespace BugTicketingSystem.Api.Models
{
    public class Developer
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? AvatarUrl { get; set; }
        public string? SlackId { get; set; }
        public string? TeamsId { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public ICollection<Bug> AssignedBugs { get; set; } = new List<Bug>();
        public ICollection<Bug> ReportedBugs { get; set; } = new List<Bug>();
        public ICollection<Comment> Comments { get; set; } = new List<Comment>();
        public ICollection<Notification> Notifications { get; set; } = new List<Notification>();
    }
}
