using Microsoft.EntityFrameworkCore;
using BugTicketingSystem.Api.Models;

namespace BugTicketingSystem.Api.Data;

public static class DbInitializer
{
    public static async Task InitializeAsync(AppDbContext context, ILogger logger)
    {
        try
        {
            // Ensure database is created
            var created = await context.Database.EnsureCreatedAsync();

            if (created)
            {
                logger.LogInformation("Database created successfully");
            }

            // Check if data already exists
            if (await context.Projects.AnyAsync())
            {
                logger.LogInformation("Database already seeded");
                return;
            }

            logger.LogInformation("Seeding database...");

            await SeedDataAsync(context);

            logger.LogInformation("Database seeded successfully");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "An error occurred while initializing the database");
            throw;
        }
    }

    private static async Task SeedDataAsync(AppDbContext context)
    {
        // Seed Projects
        var projects = new List<Project>
        {
            new() { Name = "E-Commerce Platform", Description = "Main e-commerce web application" },
            new() { Name = "Mobile App", Description = "iOS and Android mobile application" },
            new() { Name = "Admin Dashboard", Description = "Internal admin management system" },
            new() { Name = "API Gateway", Description = "REST API backend services" }
        };

        await context.Projects.AddRangeAsync(projects);
        await context.SaveChangesAsync();

        // Seed Modules
        var modules = new List<Module>
        {
            new() { ProjectId = 1, Name = "User Authentication" },
            new() { ProjectId = 1, Name = "Shopping Cart" },
            new() { ProjectId = 1, Name = "Payment Gateway" },
            new() { ProjectId = 1, Name = "Product Catalog" },
            new() { ProjectId = 2, Name = "Login Module" },
            new() { ProjectId = 2, Name = "Push Notifications" },
            new() { ProjectId = 3, Name = "User Management" },
            new() { ProjectId = 3, Name = "Reports Module" },
            new() { ProjectId = 4, Name = "Authentication API" },
            new() { ProjectId = 4, Name = "Orders API" }
        };

        await context.Modules.AddRangeAsync(modules);
        await context.SaveChangesAsync();

        // Seed Developers
        var developers = new List<Developer>
        {
            new() {
                Name = "John Smith",
                Email = "john@example.com",
                AvatarUrl = "https://ui-avatars.com/api/?name=John+Smith&background=6366f1&color=fff"
            },
            new() {
                Name = "Sarah Johnson",
                Email = "sarah@example.com",
                AvatarUrl = "https://ui-avatars.com/api/?name=Sarah+Johnson&background=ec4899&color=fff"
            },
            new() {
                Name = "Mike Wilson",
                Email = "mike@example.com",
                AvatarUrl = "https://ui-avatars.com/api/?name=Mike+Wilson&background=10b981&color=fff"
            },
            new() {
                Name = "Emily Brown",
                Email = "emily@example.com",
                AvatarUrl = "https://ui-avatars.com/api/?name=Emily+Brown&background=f59e0b&color=fff"
            },
            new() {
                Name = "David Lee",
                Email = "david@example.com",
                AvatarUrl = "https://ui-avatars.com/api/?name=David+Lee&background=3b82f6&color=fff"
            },
            new() {
                Name = "QA User",
                Email = "qa@example.com",
                AvatarUrl = "https://ui-avatars.com/api/?name=QA+User&background=8b5cf6&color=fff"
            }
        };

        await context.Developers.AddRangeAsync(developers);
        await context.SaveChangesAsync();

        // Seed Sample Bugs
        var random = new Random();
        var priorities = Enum.GetValues<Priority>();
        var severities = Enum.GetValues<Severity>();
        var statuses = Enum.GetValues<BugStatus>();

        var bugTitles = new[]
        {
            "Login button not responding on mobile",
            "Payment fails with specific card types",
            "Cart total calculation incorrect",
            "User profile image upload fails",
            "Search results not sorting correctly",
            "Email notifications delayed",
            "Dashboard charts not loading",
            "Password reset link expires too quickly",
            "Order history pagination broken",
            "Product images not displaying on iOS",
            "Session timeout too short",
            "Export to PDF not working",
            "Duplicate entries in dropdown",
            "Form validation error messages unclear",
            "Mobile menu not closing properly"
        };

        var environments = new[] { "Production", "Staging", "Development" };
        var browsers = new[] { "Chrome 120", "Firefox 121", "Safari 17", "Edge 120" };
        var operatingSystems = new[] { "Windows 11", "macOS Sonoma", "Ubuntu 22.04", "iOS 17" };

        var bugs = new List<Bug>();
        var modulesList = await context.Modules.ToListAsync();

        for (int i = 0; i < 30; i++)
        {
            var createdDaysAgo = random.Next(0, 30);
            var createdAt = DateTime.UtcNow.AddDays(-createdDaysAgo);
            var status = statuses[random.Next(statuses.Length)];

            DateTime? resolvedAt = null;
            DateTime? closedAt = null;

            if (status is BugStatus.Fixed or BugStatus.Verified or BugStatus.Closed)
            {
                resolvedAt = createdAt.AddDays(random.Next(1, 5));
            }

            if (status == BugStatus.Closed)
            {
                closedAt = resolvedAt?.AddDays(1);
            }

            var projectId = random.Next(1, 5);
            var projectModules = modulesList.Where(m => m.ProjectId == projectId).ToList();
            var moduleId = projectModules.Any() ? projectModules[random.Next(projectModules.Count)].Id : (int?)null;

            bugs.Add(new Bug
            {
                TicketId = GenerateTicketId(createdAt, i + 1),
                ProjectId = projectId,
                ModuleId = moduleId,
                Title = bugTitles[random.Next(bugTitles.Length)],
                Description = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
                StepsToReproduce = "1. Navigate to the page\n2. Click on the button\n3. Observe the error",
                ExpectedResult = "The action should complete successfully",
                ActualResult = "An error occurs or nothing happens",
                Priority = priorities[random.Next(priorities.Length)],
                Severity = severities[random.Next(severities.Length)],
                Status = status,
                AssignedDeveloperId = random.Next(1, 6),
                ReportedById = 6, // QA User
                EstimatedFixHours = random.Next(1, 20),
                Deadline = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(random.Next(1, 14))),
                Environment = environments[random.Next(environments.Length)],
                Browser = browsers[random.Next(browsers.Length)],
                Os = operatingSystems[random.Next(operatingSystems.Length)],
                CreatedAt = createdAt,
                UpdatedAt = createdAt,
                ResolvedAt = resolvedAt,
                ClosedAt = closedAt
            });
        }

        await context.Bugs.AddRangeAsync(bugs);
        await context.SaveChangesAsync();

        // Add activity logs for created bugs
        var activityLogs = bugs.Select(b => new ActivityLog
        {
            BugId = b.Id,
            DeveloperId = 6, // QA User
            Action = "created",
            NewValue = "Bug created",
            CreatedAt = b.CreatedAt
        }).ToList();

        await context.ActivityLogs.AddRangeAsync(activityLogs);
        await context.SaveChangesAsync();

        // Add some sample comments
        var comments = new List<Comment>();
        foreach (var bug in bugs.Take(10))
        {
            comments.Add(new Comment
            {
                BugId = bug.Id,
                DeveloperId = bug.AssignedDeveloperId ?? 1,
                Content = "I'm looking into this issue now.",
                CreatedAt = bug.CreatedAt.AddHours(random.Next(1, 24))
            });
        }

        await context.Comments.AddRangeAsync(comments);
        await context.SaveChangesAsync();
    }

    private static string GenerateTicketId(DateTime date, int sequence)
    {
        return $"BUG-{date:yyMMdd}-{sequence:D4}";
    }
}