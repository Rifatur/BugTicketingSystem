using System.Net.Mail;
using System.Xml.Linq;

namespace BugTicketingSystem.Api.Models
{
    public class Bug
    {
        public int Id { get; set; }
        public string TicketId { get; set; } = string.Empty;
        public int ProjectId { get; set; }
        public int? ModuleId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string? StepsToReproduce { get; set; }
        public string? ExpectedResult { get; set; }
        public string? ActualResult { get; set; }
        public Priority Priority { get; set; } = Priority.Medium;
        public Severity Severity { get; set; } = Severity.Minor;
        public BugStatus Status { get; set; } = BugStatus.Open;
        public int? AssignedDeveloperId { get; set; }
        public int? ReportedById { get; set; }
        public decimal? EstimatedFixHours { get; set; }
        public DateOnly? Deadline { get; set; }
        public string? Environment { get; set; }
        public string? Browser { get; set; }
        public string? Os { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? ResolvedAt { get; set; }
        public DateTime? ClosedAt { get; set; }

        // Navigation properties
        public Project Project { get; set; } = null!;
        public Module? Module { get; set; }
        public Developer? AssignedDeveloper { get; set; }
        public Developer? ReportedBy { get; set; }
        public ICollection<Comment> Comments { get; set; } = new List<Comment>();
        public ICollection<Attachment> Attachments { get; set; } = new List<Attachment>();
        public ICollection<ActivityLog> ActivityLogs { get; set; } = new List<ActivityLog>();
    }
}
