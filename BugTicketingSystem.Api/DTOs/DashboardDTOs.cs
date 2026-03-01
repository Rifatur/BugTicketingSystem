namespace BugTicketingSystem.Api.DTOs
{
    public record DashboardOverviewResponse(
        int TotalBugs,
        int OpenBugs,
        int BugsToday,
        int ResolvedToday,
        int OverdueBugs,
        double AvgResolutionTimeHours,
        Dictionary<string, int> ByStatus,
        Dictionary<string, int> ByPriority
    );

    public record DashboardStatsResponse(
        List<TrendDataPoint> Trend,
        List<ProjectBugCount> ByProject,
        List<DeveloperBugCount> ByDeveloper,
        List<ModuleBugCount> TopModules,
        Dictionary<string, int> ByStatus,
        Dictionary<string, int> ByPriority
    );

    public record TrendDataPoint(
        string Date,
        int Opened,
        int Closed
    );

    public record ProjectBugCount(
        string Name,
        int Count
    );

    public record DeveloperBugCount(
        string Name,
        int OpenBugs,
        int ClosedBugs
    );

    public record ModuleBugCount(
        string ModuleName,
        string ProjectName,
        int BugCount
    );

    public record RecentBugResponse(
        int Id,
        string TicketId,
        string Title,
        string Priority,
        string Severity,
        string Status,
        DateTime CreatedAt,
        string ProjectName,
        string? DeveloperName
    );

    public record CriticalBugResponse(
        int Id,
        string TicketId,
        string Title,
        string Priority,
        string Severity,
        string Status,
        DateOnly? Deadline,
        DateTime CreatedAt,
        string ProjectName,
        string? DeveloperName,
        string? DeveloperAvatar
    );
}
