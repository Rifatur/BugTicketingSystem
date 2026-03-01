using BugTicketingSystem.Api.Services;

namespace BugTicketingSystem.Api.Endpoints;

public static class ReportEndpoints
{
    public static void MapReportEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/reports")
            .WithTags("Reports")
            .WithOpenApi();

        // Get daily report
        group.MapGet("/daily", async (DateOnly? date, IReportService reportService) =>
        {
            var reportDate = date ?? DateOnly.FromDateTime(DateTime.UtcNow);
            var report = await reportService.GetDailyReportAsync(reportDate);
            return Results.Ok(new { success = true, data = report });
        })
        .WithName("GetDailyReport")
        .WithSummary("Get daily bug report");

        // Get weekly report
        group.MapGet("/weekly", async (DateOnly? endDate, IReportService reportService) =>
        {
            var reportEndDate = endDate ?? DateOnly.FromDateTime(DateTime.UtcNow);
            var report = await reportService.GetWeeklyReportAsync(reportEndDate);
            return Results.Ok(new { success = true, data = report });
        })
        .WithName("GetWeeklyReport")
        .WithSummary("Get weekly bug report");

        // Get monthly report
        group.MapGet("/monthly", async (int? year, int? month, IReportService reportService) =>
        {
            var reportYear = year ?? DateTime.UtcNow.Year;
            var reportMonth = month ?? DateTime.UtcNow.Month;
            var report = await reportService.GetMonthlyReportAsync(reportYear, reportMonth);
            return Results.Ok(new { success = true, data = report });
        })
        .WithName("GetMonthlyReport")
        .WithSummary("Get monthly bug report");
    }
}