using BugTicketingSystem.Api.Models;

namespace BugTicketingSystem.Api.DTOs
{
    // Request DTOs
    public record CreateBugRequest(
        int ProjectId,
        int? ModuleId,
        string Title,
        string Description,
        string? StepsToReproduce,
        string? ExpectedResult,
        string? ActualResult,
        Priority Priority = Priority.Medium,
        Severity Severity = Severity.Minor,
        int? AssignedDeveloperId = null,
        int? ReportedById = null,
        decimal? EstimatedFixHours = null,
        DateOnly? Deadline = null,
        string? Environment = null,
        string? Browser = null,
        string? Os = null
    );

    public record UpdateBugRequest(
        string? Title = null,
        string? Description = null,
        string? StepsToReproduce = null,
        string? ExpectedResult = null,
        string? ActualResult = null,
        Priority? Priority = null,
        Severity? Severity = null,
        BugStatus? Status = null,
        int? AssignedDeveloperId = null,
        int? ModuleId = null,
        decimal? EstimatedFixHours = null,
        DateOnly? Deadline = null,
        string? Environment = null,
        string? Browser = null,
        string? Os = null,
        int? UpdatedById = null
    );

    public record BugFilterRequest(
        string? Search = null,
        int? ProjectId = null,
        BugStatus? Status = null,
        Priority? Priority = null,
        int? DeveloperId = null,
        string? SortBy = "CreatedAt",
        string? SortOrder = "desc",
        int Page = 1,
        int PageSize = 20
    );

    // Response DTOs
    public record BugResponse(
        int Id,
        string TicketId,
        int ProjectId,
        string ProjectName,
        int? ModuleId,
        string? ModuleName,
        string Title,
        string Description,
        string? StepsToReproduce,
        string? ExpectedResult,
        string? ActualResult,
        string Priority,
        string Severity,
        string Status,
        int? AssignedDeveloperId,
        string? DeveloperName,
        string? DeveloperAvatar,
        int? ReportedById,
        string? ReporterName,
        decimal? EstimatedFixHours,
        DateOnly? Deadline,
        string? Environment,
        string? Browser,
        string? Os,
        DateTime CreatedAt,
        DateTime UpdatedAt,
        DateTime? ResolvedAt,
        DateTime? ClosedAt,
        int CommentCount,
        int AttachmentCount
    );

    public record BugDetailResponse(
        int Id,
        string TicketId,
        int ProjectId,
        string ProjectName,
        int? ModuleId,
        string? ModuleName,
        string Title,
        string Description,
        string? StepsToReproduce,
        string? ExpectedResult,
        string? ActualResult,
        string Priority,
        string Severity,
        string Status,
        int? AssignedDeveloperId,
        string? DeveloperName,
        string? DeveloperEmail,
        string? DeveloperAvatar,
        int? ReportedById,
        string? ReporterName,
        decimal? EstimatedFixHours,
        DateOnly? Deadline,
        string? Environment,
        string? Browser,
        string? Os,
        DateTime CreatedAt,
        DateTime UpdatedAt,
        DateTime? ResolvedAt,
        DateTime? ClosedAt,
        List<CommentResponse> Comments,
        List<AttachmentResponse> Attachments,
        List<ActivityLogResponse> Activity
    );

    public record CommentResponse(
        int Id,
        int DeveloperId,
        string DeveloperName,
        string? AvatarUrl,
        string Content,
        DateTime CreatedAt
    );

    public record AttachmentResponse(
        int Id,
        string FileName,
        string FilePath,
        string? FileType,
        long FileSize,
        DateTime UploadedAt
    );

    public record ActivityLogResponse(
        int Id,
        string Action,
        string? DeveloperName,
        string? OldValue,
        string? NewValue,
        DateTime CreatedAt
    );

    public record PaginatedResponse<T>(
        bool Success,
        List<T> Data,
        PaginationInfo Pagination
    );

    public record PaginationInfo(
        int Page,
        int PageSize,
        int Total,
        int TotalPages
    );

    public record ApiResponse<T>(
        bool Success,
        T? Data,
        string? Message = null
    );

    public record CreateBugResponse(
        int Id,
        string TicketId
    );
}
