using Microsoft.EntityFrameworkCore;
using BugTicketingSystem.Api.Models;

namespace BugTicketingSystem.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<Project> Projects => Set<Project>();
    public DbSet<Module> Modules => Set<Module>();
    public DbSet<Developer> Developers => Set<Developer>();
    public DbSet<Bug> Bugs => Set<Bug>();
    public DbSet<Comment> Comments => Set<Comment>();
    public DbSet<Attachment> Attachments => Set<Attachment>();
    public DbSet<ActivityLog> ActivityLogs => Set<ActivityLog>();
    public DbSet<Notification> Notifications => Set<Notification>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Project entity configuration
        modelBuilder.Entity<Project>(entity =>
        {
            entity.ToTable("Projects");

            entity.HasKey(e => e.Id);

            entity.Property(e => e.Name)
                .IsRequired()
                .HasMaxLength(255);

            entity.Property(e => e.Description)
                .HasColumnType("nvarchar(max)");

            entity.Property(e => e.CreatedAt)
                .HasColumnType("datetime2(7)")
                .HasDefaultValueSql("GETUTCDATE()");

            entity.Property(e => e.UpdatedAt)
                .HasColumnType("datetime2(7)")
                .HasDefaultValueSql("GETUTCDATE()");
        });

        // Module entity configuration
        modelBuilder.Entity<Module>(entity =>
        {
            entity.ToTable("Modules");

            entity.HasKey(e => e.Id);

            entity.Property(e => e.Name)
                .IsRequired()
                .HasMaxLength(255);

            entity.Property(e => e.CreatedAt)
                .HasColumnType("datetime2(7)")
                .HasDefaultValueSql("GETUTCDATE()");

            entity.HasIndex(e => e.ProjectId);

            entity.HasOne(e => e.Project)
                .WithMany(p => p.Modules)
                .HasForeignKey(e => e.ProjectId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Developer entity configuration
        modelBuilder.Entity<Developer>(entity =>
        {
            entity.ToTable("Developers");

            entity.HasKey(e => e.Id);

            entity.Property(e => e.Name)
                .IsRequired()
                .HasMaxLength(255);

            entity.Property(e => e.Email)
                .IsRequired()
                .HasMaxLength(255);

            entity.Property(e => e.AvatarUrl)
                .HasMaxLength(500);

            entity.Property(e => e.SlackId)
                .HasMaxLength(100);

            entity.Property(e => e.TeamsId)
                .HasMaxLength(100);

            entity.Property(e => e.IsActive)
                .HasDefaultValue(true);

            entity.Property(e => e.CreatedAt)
                .HasColumnType("datetime2(7)")
                .HasDefaultValueSql("GETUTCDATE()");

            entity.HasIndex(e => e.Email).IsUnique();
        });

        // Bug entity configuration
        modelBuilder.Entity<Bug>(entity =>
        {
            entity.ToTable("Bugs");

            entity.HasKey(e => e.Id);

            entity.Property(e => e.TicketId)
                .IsRequired()
                .HasMaxLength(20);

            entity.Property(e => e.Title)
                .IsRequired()
                .HasMaxLength(500);

            entity.Property(e => e.Description)
                .IsRequired()
                .HasColumnType("nvarchar(max)");

            entity.Property(e => e.StepsToReproduce)
                .HasColumnType("nvarchar(max)");

            entity.Property(e => e.ExpectedResult)
                .HasColumnType("nvarchar(max)");

            entity.Property(e => e.ActualResult)
                .HasColumnType("nvarchar(max)");

            entity.Property(e => e.Priority)
                .HasMaxLength(20)
                .HasConversion<string>()
                .HasDefaultValue(Priority.Medium);

            entity.Property(e => e.Severity)
                .HasMaxLength(20)
                .HasConversion<string>()
                .HasDefaultValue(Severity.Minor);

            entity.Property(e => e.Status)
                .HasMaxLength(20)
                .HasConversion<string>()
                .HasDefaultValue(BugStatus.Open);

            entity.Property(e => e.EstimatedFixHours)
                .HasColumnType("decimal(10,2)");

            entity.Property(e => e.Deadline)
                .HasColumnType("date");

            entity.Property(e => e.Environment)
                .HasMaxLength(255);

            entity.Property(e => e.Browser)
                .HasMaxLength(100);

            entity.Property(e => e.Os)
                .HasMaxLength(100);

            entity.Property(e => e.CreatedAt)
                .HasColumnType("datetime2(7)")
                .HasDefaultValueSql("GETUTCDATE()");

            entity.Property(e => e.UpdatedAt)
                .HasColumnType("datetime2(7)")
                .HasDefaultValueSql("GETUTCDATE()");

            entity.Property(e => e.ResolvedAt)
                .HasColumnType("datetime2(7)");

            entity.Property(e => e.ClosedAt)
                .HasColumnType("datetime2(7)");

            // Indexes
            entity.HasIndex(e => e.TicketId).IsUnique();
            entity.HasIndex(e => e.ProjectId);
            entity.HasIndex(e => e.ModuleId);
            entity.HasIndex(e => e.AssignedDeveloperId);
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.Priority);
            entity.HasIndex(e => e.CreatedAt).IsDescending();
            entity.HasIndex(e => e.Deadline);

            // Relationships
            entity.HasOne(e => e.Project)
                .WithMany(p => p.Bugs)
                .HasForeignKey(e => e.ProjectId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Module)
                .WithMany(m => m.Bugs)
                .HasForeignKey(e => e.ModuleId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(e => e.AssignedDeveloper)
                .WithMany(d => d.AssignedBugs)
                .HasForeignKey(e => e.AssignedDeveloperId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(e => e.ReportedBy)
                .WithMany(d => d.ReportedBugs)
                .HasForeignKey(e => e.ReportedById)
                .OnDelete(DeleteBehavior.NoAction);
        });

        // Comment entity configuration
        modelBuilder.Entity<Comment>(entity =>
        {
            entity.ToTable("Comments");

            entity.HasKey(e => e.Id);

            entity.Property(e => e.Content)
                .IsRequired()
                .HasColumnType("nvarchar(max)");

            entity.Property(e => e.CreatedAt)
                .HasColumnType("datetime2(7)")
                .HasDefaultValueSql("GETUTCDATE()");

            entity.Property(e => e.UpdatedAt)
                .HasColumnType("datetime2(7)");

            entity.HasIndex(e => e.BugId);
            entity.HasIndex(e => e.DeveloperId);

            entity.HasOne(e => e.Bug)
                .WithMany(b => b.Comments)
                .HasForeignKey(e => e.BugId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Developer)
                .WithMany(d => d.Comments)
                .HasForeignKey(e => e.DeveloperId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Attachment entity configuration
        modelBuilder.Entity<Attachment>(entity =>
        {
            entity.ToTable("Attachments");

            entity.HasKey(e => e.Id);

            entity.Property(e => e.FileName)
                .IsRequired()
                .HasMaxLength(255);

            entity.Property(e => e.FilePath)
                .IsRequired()
                .HasMaxLength(500);

            entity.Property(e => e.FileType)
                .HasMaxLength(100);

            entity.Property(e => e.FileSize)
                .HasDefaultValue(0);

            entity.Property(e => e.UploadedAt)
                .HasColumnType("datetime2(7)")
                .HasDefaultValueSql("GETUTCDATE()");

            entity.HasIndex(e => e.BugId);

            entity.HasOne(e => e.Bug)
                .WithMany(b => b.Attachments)
                .HasForeignKey(e => e.BugId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // ActivityLog entity configuration
        modelBuilder.Entity<ActivityLog>(entity =>
        {
            entity.ToTable("ActivityLogs");

            entity.HasKey(e => e.Id);

            entity.Property(e => e.Action)
                .IsRequired()
                .HasMaxLength(100);

            entity.Property(e => e.OldValue)
                .HasColumnType("nvarchar(max)");

            entity.Property(e => e.NewValue)
                .HasColumnType("nvarchar(max)");

            entity.Property(e => e.CreatedAt)
                .HasColumnType("datetime2(7)")
                .HasDefaultValueSql("GETUTCDATE()");

            entity.HasIndex(e => e.BugId);
            entity.HasIndex(e => e.CreatedAt).IsDescending();

            entity.HasOne(e => e.Bug)
                .WithMany(b => b.ActivityLogs)
                .HasForeignKey(e => e.BugId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Developer)
                .WithMany()
                .HasForeignKey(e => e.DeveloperId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // Notification entity configuration
        modelBuilder.Entity<Notification>(entity =>
        {
            entity.ToTable("Notifications");

            entity.HasKey(e => e.Id);

            entity.Property(e => e.Type)
                .IsRequired()
                .HasMaxLength(50)
                .HasConversion<string>();

            entity.Property(e => e.Title)
                .IsRequired()
                .HasMaxLength(255);

            entity.Property(e => e.Message)
                .HasColumnType("nvarchar(max)");

            entity.Property(e => e.IsRead)
                .HasDefaultValue(false);

            entity.Property(e => e.CreatedAt)
                .HasColumnType("datetime2(7)")
                .HasDefaultValueSql("GETUTCDATE()");

            entity.Property(e => e.ReadAt)
                .HasColumnType("datetime2(7)");

            entity.HasIndex(e => e.DeveloperId);
            entity.HasIndex(e => new { e.DeveloperId, e.IsRead });
            entity.HasIndex(e => e.CreatedAt).IsDescending();

            entity.HasOne(e => e.Developer)
                .WithMany(d => d.Notifications)
                .HasForeignKey(e => e.DeveloperId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Bug)
                .WithMany()
                .HasForeignKey(e => e.BugId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }
}