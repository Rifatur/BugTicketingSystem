using BugTicketingSystem.Api.DTOs;

namespace BugTicketingSystem.Api.Services;

public interface IReportService
{
    Task<DailyReportResponse> GetDailyReportAsync(DateOnly date);
    Task<WeeklyReportResponse> GetWeeklyReportAsync(DateOnly endDate);
    Task<MonthlyReportResponse> GetMonthlyReportAsync(int year, int month);
}