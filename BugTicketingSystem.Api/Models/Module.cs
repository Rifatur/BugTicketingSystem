namespace BugTicketingSystem.Api.Models
{
    public class Module
    {
        public int Id { get; set; }
        public int ProjectId { get; set; }
        public string Name { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public Project Project { get; set; } = null!;
        public ICollection<Bug> Bugs { get; set; } = new List<Bug>();
    }
}
