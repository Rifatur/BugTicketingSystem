using Microsoft.EntityFrameworkCore;
using BugTicketingSystem.Api.Data;
using BugTicketingSystem.Api.DTOs;
using BugTicketingSystem.Api.Helpers;
using BugTicketingSystem.Api.Models;

namespace BugTicketingSystem.Api.Endpoints;

public static class DashboardEndpoints
{
    public static void MapDashboardEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/dashboard")
            .WithTags("Dashboard")
            .WithOpenApi();

        // Get dashboard overview
        group.MapGet("/overview", async (AppDbContext db) =>
        {
            var today = DateTime.UtcNow.Date;
            var tomorrow = today.AddDays(1);

            var bugs = await db.Bugs.ToListAsync();

            // Total bugs by status
            var byStatus = bugs
                .GroupBy(b => b.Status.ToString())
                .ToDictionary(g => g.Key, g => g.Count());

            // Total bugs by priority
            var byPriority = bugs
                .GroupBy(b => b.Priority.ToString())
                .ToDictionary(g => g.Key, g => g.Count());

            // Today's stats
            var bugsToday = bugs.Count(b => b.CreatedAt >= today && b.CreatedAt < tomorrow);
            var resolvedToday = bugs.Count(b => b.ResolvedAt.HasValue &&
                b.ResolvedAt.Value >= today && b.ResolvedAt.Value < tomorrow);

            // Open bugs
            var openBugs = bugs.Count(b =>
                b.Status != BugStatus.Closed &&
                b.Status != BugStatus.Verified);

            // Overdue bugs
            var todayDate = DateOnly.FromDateTime(today);
            var overdueBugs = bugs.Count(b =>
                b.Deadline.HasValue &&
                b.Deadline.Value < todayDate &&
                b.Status != BugStatus.Closed &&
                b.Status != BugStatus.Verified);

            // Average resolution time
            var resolvedBugs = bugs.Where(b => b.ResolvedAt.HasValue).ToList();
            double avgResolutionTime = 0;
            if (resolvedBugs.Any())
            {
                avgResolutionTime = resolvedBugs.Average(b =>
                    (b.ResolvedAt!.Value - b.CreatedAt).TotalHours);
            }

            var response = new DashboardOverviewResponse(
                TotalBugs: bugs.Count,
                OpenBugs: openBugs,
                BugsToday: bugsToday,
                ResolvedToday: resolvedToday,
                OverdueBugs: overdueBugs,
                AvgResolutionTimeHours: Math.Round(avgResolutionTime, 1),
                ByStatus: byStatus,
                ByPriority: byPriority
            );

            return Results.Ok(new { success = true, data = response });
        })
        .WithName("GetDashboardOverview")
        .WithSummary("Get dashboard overview statistics");

        // Get dashboard stats with trends
        group.MapGet("/stats", async (string period, AppDbContext db) =>
        {
            var days = period?.ToLower() switch
            {
                "week" => 7,
                "month" => 30,
                "quarter" => 90,
                _ => 7
            };

            var startDate = DateTime.UtcNow.AddDays(-days);
            var bugs = await db.Bugs
                .Include(b => b.Module)
                .Include(b => b.Project)
                .ToListAsync();

            // Trend data
            var trend = new List<TrendDataPoint>();
            for (int i = days - 1; i >= 0; i--)
            {
                var date = DateTime.UtcNow.Date.AddDays(-i);
                var nextDate = date.AddDays(1);

                trend.Add(new TrendDataPoint(
                    Date: date.ToString("yyyy-MM-dd"),
                    Opened: bugs.Count(b => b.CreatedAt >= date && b.CreatedAt < nextDate),
                    Closed: bugs.Count(b => b.ResolvedAt.HasValue &&
                        b.ResolvedAt.Value >= date && b.ResolvedAt.Value < nextDate)
                ));
            }

            // Bugs by project
            var byProject = await db.Projects
                .Select(p => new ProjectBugCount(
                    p.Name,
                    p.Bugs.Count
                ))
                .OrderByDescending(p => p.Count)
                .ToListAsync();

            // Bugs by developer
            var developers = await db.Developers
                .Include(d => d.AssignedBugs)
                .ToListAsync();

            var byDeveloper = developers.Select(d => new DeveloperBugCount(
                d.Name,
                d.AssignedBugs.Count(b => b.Status != BugStatus.Closed && b.Status != BugStatus.Verified),
                d.AssignedBugs.Count(b => b.Status == BugStatus.Closed || b.Status == BugStatus.Verified)
            )).ToList();

            // Top problematic modules
            var recentBugs = bugs.Where(b => b.CreatedAt >= startDate).ToList();
            var topModules = recentBugs
                .Where(b => b.Module != null)
                .GroupBy(b => new { b.Module!.Name, ProjectName = b.Project.Name })
                .Select(g => new ModuleBugCount(g.Key.Name, g.Key.ProjectName, g.Count()))
                .OrderByDescending(m => m.BugCount)
                .Take(10)
                .ToList();

            // Bugs by status
            var byStatus = bugs
                .GroupBy(b => b.Status.ToString())
                .ToDictionary(g => g.Key, g => g.Count());

            // Bugs by priority
            var byPriority = bugs
                .GroupBy(b => b.Priority.ToString())
                .ToDictionary(g => g.Key, g => g.Count());

            var response = new DashboardStatsResponse(
                Trend: trend,
                ByProject: byProject,
                ByDeveloper: byDeveloper,
                TopModules: topModules,
                ByStatus: byStatus,
                ByPriority: byPriority
            );

            return Results.Ok(new { success = true, data = response });
        })
        .WithName("GetDashboardStats")
        .WithSummary("Get dashboard statistics with trends");

        // Get recent bugs
        group.MapGet("/recent", async (int? limit, AppDbContext db) =>
        {
            var take = Math.Min(limit ?? 10, 20);

            var bugs = await db.Bugs
                .Include(b => b.Project)
                .Include(b => b.AssignedDeveloper)
                .OrderByDescending(b => b.CreatedAt)
                .Take(take)
                .Select(b => new RecentBugResponse(
                    b.Id,
                    b.TicketId,
                    b.Title,
                    b.Priority.ToString(),
                    b.Severity.ToString(),
                    b.Status.ToString(),
                    b.CreatedAt,
                    b.Project.Name,
                    b.AssignedDeveloper != null ? b.AssignedDeveloper.Name : null
                ))
                .ToListAsync();

            return Results.Ok(new { success = true, data = bugs });
        })
        .WithName("GetRecentBugs")
        .WithSummary("Get recently created bugs");

        // Get critical bugs
        group.MapGet("/critical", async (AppDbContext db) =>
        {
            var bugs = await db.Bugs
                .Include(b => b.Project)
                .Include(b => b.AssignedDeveloper)
                .Where(b => b.Priority == Priority.Critical &&
                           b.Status != BugStatus.Closed &&
                           b.Status != BugStatus.Verified)
                .OrderBy(b => b.CreatedAt)
                .Take(20)
                .Select(b => new CriticalBugResponse(
                    b.Id,
                    b.TicketId,
                    b.Title,
                    b.Priority.ToString(),
                    b.Severity.ToString(),
                    b.Status.ToString(),
                    b.Deadline,
                    b.CreatedAt,
                    b.Project.Name,
                    b.AssignedDeveloper != null ? b.AssignedDeveloper.Name : null,
                    b.AssignedDeveloper != null ? b.AssignedDeveloper.AvatarUrl : null
                ))
                .ToListAsync();

            return Results.Ok(new { success = true, data = bugs });
        })
        .WithName("GetCriticalBugs")
        .WithSummary("Get all open critical bugs");
    }
}