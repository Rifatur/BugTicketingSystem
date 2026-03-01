using BugTicketingSystem.Api.DTOs;

namespace BugTicketingSystem.Api.Services;

public interface IBugService
{
    Task<PaginatedResponse<BugResponse>> GetBugsAsync(BugFilterRequest filter);
    Task<BugDetailResponse?> GetBugByIdAsync(int id);
    Task<BugDetailResponse?> GetBugByTicketIdAsync(string ticketId);
    Task<CreateBugResponse> CreateBugAsync(CreateBugRequest request);
    Task<bool> UpdateBugAsync(int id, UpdateBugRequest request);
    Task<bool> DeleteBugAsync(int id);
}