namespace BugTicketingSystem.Api.DTOs;

// Daily Report
public record DailyReportResponse(
    DailyReportSummary Summary,
    List<BugResponse> BugsLogged,
    List<BugResponse> BugsResolved,
    List<CriticalBugDetail> PendingCritical
);

public record DailyReportSummary(
    string Date,
    int BugsLogged,
    int BugsResolved,
    int PendingCritical,
    Dictionary<string, int> ByPriority
);

public record CriticalBugDetail(
    int Id,
    string TicketId,
    string Title,
    string ProjectName,
    string? DeveloperName,
    int DaysOpen,
    string Status
);

// Weekly Report
public record WeeklyReportResponse(
    WeeklyReportPeriod Period,
    WeeklyReportSummary Summary,
    List<TrendDataPoint> Trends,
    List<ModuleBugCount> RecurringModules,
    List<DeveloperPerformance> DeveloperPerformance
);

public record WeeklyReportPeriod(
    string StartDate,
    string EndDate
);

public record WeeklyReportSummary(
    int TotalOpened,
    int TotalClosed,
    int NetChange,
    double AvgResolutionTimeHours
);

public record DeveloperPerformance(
    string Name,
    int Resolved,
    int Pending
);

// Monthly Report
public record MonthlyReportResponse(
    MonthlyReportPeriod Period,
    List<ProjectDefectDensity> DefectDensity,
    List<DeveloperMonthlyStats> DeveloperPerformance,
    ReleaseReadiness ReleaseReadiness,
    List<WeeklyBreakdown> WeeklyBreakdown
);

public record MonthlyReportPeriod(
    string Month,
    string StartDate,
    string EndDate
);

public record ProjectDefectDensity(
    string ProjectName,
    int TotalBugs,
    int Critical,
    int High,
    int Resolved
);

public record DeveloperMonthlyStats(
    string Name,
    string? AvatarUrl,
    int BugsResolved,
    double AvgResolutionHours
);

public record ReleaseReadiness(
    double Score,
    int OpenBugs,
    int ClosedBugs,
    int CriticalOpen
);

public record WeeklyBreakdown(
    int WeekNumber,
    string WeekStart,
    int Opened,
    int Closed
);