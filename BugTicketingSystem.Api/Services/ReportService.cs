using Microsoft.EntityFrameworkCore;
using BugTicketingSystem.Api.Data;
using BugTicketingSystem.Api.DTOs;
using BugTicketingSystem.Api.Helpers;
using BugTicketingSystem.Api.Models;

namespace BugTicketingSystem.Api.Services;

public class ReportService : IReportService
{
    private readonly AppDbContext _context;
    private readonly ILogger<ReportService> _logger;

    public ReportService(AppDbContext context, ILogger<ReportService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<DailyReportResponse> GetDailyReportAsync(DateOnly date)
    {
        var dateStart = date.ToDateTime(TimeOnly.MinValue);
        var dateEnd = date.ToDateTime(TimeOnly.MaxValue);

        _logger.LogInformation("Generating daily report for {Date}", date);

        // Bugs logged today
        var bugsLogged = await _context.Bugs
            .Include(b => b.Project)
            .Include(b => b.Module)
            .Include(b => b.AssignedDeveloper)
            .Include(b => b.ReportedBy)
            .Include(b => b.Comments)
            .Include(b => b.Attachments)
            .Where(b => b.CreatedAt >= dateStart && b.CreatedAt <= dateEnd)
            .OrderByDescending(b => b.Priority)
            .ThenByDescending(b => b.CreatedAt)
            .AsNoTracking()
            .ToListAsync();

        // Bugs resolved today
        var bugsResolved = await _context.Bugs
            .Include(b => b.Project)
            .Include(b => b.Module)
            .Include(b => b.AssignedDeveloper)
            .Include(b => b.ReportedBy)
            .Include(b => b.Comments)
            .Include(b => b.Attachments)
            .Where(b => b.ResolvedAt.HasValue &&
                        b.ResolvedAt.Value >= dateStart &&
                        b.ResolvedAt.Value <= dateEnd)
            .AsNoTracking()
            .ToListAsync();

        // Pending critical bugs
        var criticalBugs = await _context.Bugs
            .Include(b => b.Project)
            .Include(b => b.AssignedDeveloper)
            .Where(b => b.Priority == Priority.Critical &&
                        b.Status != BugStatus.Closed &&
                        b.Status != BugStatus.Verified)
            .OrderBy(b => b.CreatedAt)
            .AsNoTracking()
            .ToListAsync();

        var summary = new DailyReportSummary(
            Date: date.ToString("yyyy-MM-dd"),
            BugsLogged: bugsLogged.Count,
            BugsResolved: bugsResolved.Count,
            PendingCritical: criticalBugs.Count,
            ByPriority: new Dictionary<string, int>
            {
                { "Critical", bugsLogged.Count(b => b.Priority == Priority.Critical) },
                { "High", bugsLogged.Count(b => b.Priority == Priority.High) },
                { "Medium", bugsLogged.Count(b => b.Priority == Priority.Medium) },
                { "Low", bugsLogged.Count(b => b.Priority == Priority.Low) }
            }
        );

        var pendingCritical = criticalBugs.Select(b => new CriticalBugDetail(
            Id: b.Id,
            TicketId: b.TicketId,
            Title: b.Title,
            ProjectName: b.Project?.Name ?? "",
            DeveloperName: b.AssignedDeveloper?.Name,
            DaysOpen: (int)(DateTime.UtcNow - b.CreatedAt).TotalDays,
            Status: b.Status.ToString()
        )).ToList();

        return new DailyReportResponse(
            Summary: summary,
            BugsLogged: bugsLogged.Select(b => b.ToBugResponse()).ToList(),
            BugsResolved: bugsResolved.Select(b => b.ToBugResponse()).ToList(),
            PendingCritical: pendingCritical
        );
    }

    public async Task<WeeklyReportResponse> GetWeeklyReportAsync(DateOnly endDate)
    {
        var startDate = endDate.AddDays(-6);
        var startDateTime = startDate.ToDateTime(TimeOnly.MinValue);
        var endDateTime = endDate.ToDateTime(TimeOnly.MaxValue);

        _logger.LogInformation("Generating weekly report for {StartDate} to {EndDate}", startDate, endDate);

        // Get all bugs in the period using SQL Server date functions
        var bugsInPeriod = await _context.Bugs
            .Include(b => b.Module)
            .Include(b => b.Project)
            .Include(b => b.AssignedDeveloper)
            .Where(b => b.CreatedAt >= startDateTime && b.CreatedAt <= endDateTime)
            .AsNoTracking()
            .ToListAsync();

        var resolvedInPeriod = await _context.Bugs
            .Include(b => b.AssignedDeveloper)
            .Where(b => b.ResolvedAt.HasValue &&
                        b.ResolvedAt.Value >= startDateTime &&
                        b.ResolvedAt.Value <= endDateTime)
            .AsNoTracking()
            .ToListAsync();

        // Build trend data
        var trends = new List<TrendDataPoint>();
        for (var d = startDate; d <= endDate; d = d.AddDays(1))
        {
            var dayStart = d.ToDateTime(TimeOnly.MinValue);
            var dayEnd = d.ToDateTime(TimeOnly.MaxValue);

            trends.Add(new TrendDataPoint(
                Date: d.ToString("yyyy-MM-dd"),
                Opened: bugsInPeriod.Count(b => b.CreatedAt >= dayStart && b.CreatedAt <= dayEnd),
                Closed: resolvedInPeriod.Count(b => b.ResolvedAt >= dayStart && b.ResolvedAt <= dayEnd)
            ));
        }

        // Average resolution time using SQL Server DATEDIFF equivalent
        double avgResolutionHours = 0;
        if (resolvedInPeriod.Any())
        {
            avgResolutionHours = resolvedInPeriod
                .Where(b => b.ResolvedAt.HasValue)
                .Average(b => (b.ResolvedAt!.Value - b.CreatedAt).TotalHours);
        }

        // Recurring modules
        var recurringModules = bugsInPeriod
            .Where(b => b.Module != null)
            .GroupBy(b => new { ModuleName = b.Module!.Name, ProjectName = b.Project.Name })
            .Select(g => new ModuleBugCount(g.Key.ModuleName, g.Key.ProjectName, g.Count()))
            .OrderByDescending(m => m.BugCount)
            .Take(10)
            .ToList();

        // Developer performance
        var developers = await _context.Developers.Where(d => d.IsActive).AsNoTracking().ToListAsync();
        var allBugs = await _context.Bugs.AsNoTracking().ToListAsync();

        var developerPerformance = developers.Select(d => new DeveloperPerformance(
            Name: d.Name,
            Resolved: resolvedInPeriod.Count(b => b.AssignedDeveloperId == d.Id),
            Pending: allBugs.Count(b => b.AssignedDeveloperId == d.Id &&
                                        b.Status != BugStatus.Closed &&
                                        b.Status != BugStatus.Verified)
        )).OrderByDescending(d => d.Resolved).ToList();

        var summary = new WeeklyReportSummary(
            TotalOpened: bugsInPeriod.Count,
            TotalClosed: resolvedInPeriod.Count,
            NetChange: bugsInPeriod.Count - resolvedInPeriod.Count,
            AvgResolutionTimeHours: Math.Round(avgResolutionHours, 1)
        );

        return new WeeklyReportResponse(
            Period: new WeeklyReportPeriod(startDate.ToString("yyyy-MM-dd"), endDate.ToString("yyyy-MM-dd")),
            Summary: summary,
            Trends: trends,
            RecurringModules: recurringModules,
            DeveloperPerformance: developerPerformance
        );
    }

    public async Task<MonthlyReportResponse> GetMonthlyReportAsync(int year, int month)
    {
        var startDate = new DateOnly(year, month, 1);
        var endDate = startDate.AddMonths(1).AddDays(-1);
        var startDateTime = startDate.ToDateTime(TimeOnly.MinValue);
        var endDateTime = endDate.ToDateTime(TimeOnly.MaxValue);

        _logger.LogInformation("Generating monthly report for {Year}-{Month}", year, month);

        // Get all bugs
        var allBugs = await _context.Bugs
            .Include(b => b.Project)
            .Include(b => b.AssignedDeveloper)
            .AsNoTracking()
            .ToListAsync();

        var monthBugs = allBugs
            .Where(b => b.CreatedAt >= startDateTime && b.CreatedAt <= endDateTime)
            .ToList();

        // Defect density by project
        var projects = await _context.Projects.AsNoTracking().ToListAsync();
        var defectDensity = projects.Select(p =>
        {
            var projectBugs = monthBugs.Where(b => b.ProjectId == p.Id).ToList();
            return new ProjectDefectDensity(
                ProjectName: p.Name,
                TotalBugs: projectBugs.Count,
                Critical: projectBugs.Count(b => b.Priority == Priority.Critical),
                High: projectBugs.Count(b => b.Priority == Priority.High),
                Resolved: projectBugs.Count(b => b.Status == BugStatus.Closed || b.Status == BugStatus.Verified)
            );
        }).ToList();

        // Developer performance
        var developers = await _context.Developers.Where(d => d.IsActive).AsNoTracking().ToListAsync();
        var developerPerformance = developers.Select(d =>
        {
            var devBugs = allBugs.Where(b => b.AssignedDeveloperId == d.Id).ToList();
            var resolvedBugs = devBugs.Where(b =>
                b.ResolvedAt.HasValue &&
                b.ResolvedAt.Value >= startDateTime &&
                b.ResolvedAt.Value <= endDateTime).ToList();

            double avgHours = 0;
            if (resolvedBugs.Any())
            {
                avgHours = resolvedBugs.Average(b => (b.ResolvedAt!.Value - b.CreatedAt).TotalHours);
            }

            return new DeveloperMonthlyStats(
                Name: d.Name,
                AvatarUrl: d.AvatarUrl,
                BugsResolved: resolvedBugs.Count,
                AvgResolutionHours: Math.Round(avgHours, 1)
            );
        })
        .Where(d => d.BugsResolved > 0)
        .OrderByDescending(d => d.BugsResolved)
        .ToList();

        // Release readiness calculation
        var openBugs = allBugs.Count(b => b.Status != BugStatus.Closed && b.Status != BugStatus.Verified);
        var closedBugs = allBugs.Count(b => b.Status == BugStatus.Closed || b.Status == BugStatus.Verified);
        var criticalOpen = allBugs.Count(b =>
            b.Priority == Priority.Critical &&
            b.Status != BugStatus.Closed &&
            b.Status != BugStatus.Verified);

        var totalBugs = openBugs + closedBugs;
        double readinessScore = totalBugs > 0
            ? Math.Round((closedBugs / (double)totalBugs) * 100 - (criticalOpen * 5), 1)
            : 100;
        readinessScore = Math.Max(0, Math.Min(100, readinessScore));

        var releaseReadiness = new ReleaseReadiness(
            Score: readinessScore,
            OpenBugs: openBugs,
            ClosedBugs: closedBugs,
            CriticalOpen: criticalOpen
        );

        // Weekly breakdown
        var weeklyBreakdown = new List<WeeklyBreakdown>();
        var currentDate = startDate;
        int weekNum = 1;

        while (currentDate <= endDate)
        {
            var weekEnd = currentDate.AddDays(6);
            if (weekEnd > endDate) weekEnd = endDate;

            var weekStart = currentDate.ToDateTime(TimeOnly.MinValue);
            var weekEndTime = weekEnd.ToDateTime(TimeOnly.MaxValue);

            weeklyBreakdown.Add(new WeeklyBreakdown(
                WeekNumber: weekNum,
                WeekStart: currentDate.ToString("yyyy-MM-dd"),
                Opened: monthBugs.Count(b => b.CreatedAt >= weekStart && b.CreatedAt <= weekEndTime),
                Closed: allBugs.Count(b =>
                    b.ResolvedAt.HasValue &&
                    b.ResolvedAt.Value >= weekStart &&
                    b.ResolvedAt.Value <= weekEndTime)
            ));

            currentDate = weekEnd.AddDays(1);
            weekNum++;
        }

        return new MonthlyReportResponse(
            Period: new MonthlyReportPeriod(
                Month: $"{year}-{month:D2}",
                StartDate: startDate.ToString("yyyy-MM-dd"),
                EndDate: endDate.ToString("yyyy-MM-dd")
            ),
            DefectDensity: defectDensity,
            DeveloperPerformance: developerPerformance,
            ReleaseReadiness: releaseReadiness,
            WeeklyBreakdown: weeklyBreakdown
        );
    }
}