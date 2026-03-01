using BugTicketingSystem.Api.DTOs;
using BugTicketingSystem.Api.Models;

namespace BugTicketingSystem.Api.Helpers;

public static class MappingExtensions
{
    public static BugResponse ToBugResponse(this Bug bug)
    {
        return new BugResponse(
            Id: bug.Id,
            TicketId: bug.TicketId,
            ProjectId: bug.ProjectId,
            ProjectName: bug.Project?.Name ?? "",
            ModuleId: bug.ModuleId,
            ModuleName: bug.Module?.Name,
            Title: bug.Title,
            Description: bug.Description,
            StepsToReproduce: bug.StepsToReproduce,
            ExpectedResult: bug.ExpectedResult,
            ActualResult: bug.ActualResult,
            Priority: bug.Priority.ToString(),
            Severity: bug.Severity.ToString(),
            Status: bug.Status.ToString(),
            AssignedDeveloperId: bug.AssignedDeveloperId,
            DeveloperName: bug.AssignedDeveloper?.Name,
            DeveloperAvatar: bug.AssignedDeveloper?.AvatarUrl,
            ReportedById: bug.ReportedById,
            ReporterName: bug.ReportedBy?.Name,
            EstimatedFixHours: bug.EstimatedFixHours,
            Deadline: bug.Deadline,
            Environment: bug.Environment,
            Browser: bug.Browser,
            Os: bug.Os,
            CreatedAt: bug.CreatedAt,
            UpdatedAt: bug.UpdatedAt,
            ResolvedAt: bug.ResolvedAt,
            ClosedAt: bug.ClosedAt,
            CommentCount: bug.Comments?.Count ?? 0,
            AttachmentCount: bug.Attachments?.Count ?? 0
        );
    }

    public static BugDetailResponse ToBugDetailResponse(this Bug bug)
    {
        return new BugDetailResponse(
            Id: bug.Id,
            TicketId: bug.TicketId,
            ProjectId: bug.ProjectId,
            ProjectName: bug.Project?.Name ?? "",
            ModuleId: bug.ModuleId,
            ModuleName: bug.Module?.Name,
            Title: bug.Title,
            Description: bug.Description,
            StepsToReproduce: bug.StepsToReproduce,
            ExpectedResult: bug.ExpectedResult,
            ActualResult: bug.ActualResult,
            Priority: bug.Priority.ToString(),
            Severity: bug.Severity.ToString(),
            Status: bug.Status.ToString(),
            AssignedDeveloperId: bug.AssignedDeveloperId,
            DeveloperName: bug.AssignedDeveloper?.Name,
            DeveloperEmail: bug.AssignedDeveloper?.Email,
            DeveloperAvatar: bug.AssignedDeveloper?.AvatarUrl,
            ReportedById: bug.ReportedById,
            ReporterName: bug.ReportedBy?.Name,
            EstimatedFixHours: bug.EstimatedFixHours,
            Deadline: bug.Deadline,
            Environment: bug.Environment,
            Browser: bug.Browser,
            Os: bug.Os,
            CreatedAt: bug.CreatedAt,
            UpdatedAt: bug.UpdatedAt,
            ResolvedAt: bug.ResolvedAt,
            ClosedAt: bug.ClosedAt,
            Comments: bug.Comments?.OrderByDescending(c => c.CreatedAt)
                .Select(c => c.ToCommentResponse()).ToList() ?? new List<CommentResponse>(),
            Attachments: bug.Attachments?.Select(a => a.ToAttachmentResponse()).ToList() ?? new List<AttachmentResponse>(),
            Activity: bug.ActivityLogs?.OrderByDescending(a => a.CreatedAt)
                .Take(50).Select(a => a.ToActivityLogResponse()).ToList() ?? new List<ActivityLogResponse>()
        );
    }

    public static CommentResponse ToCommentResponse(this Comment comment)
    {
        return new CommentResponse(
            Id: comment.Id,
            DeveloperId: comment.DeveloperId,
            DeveloperName: comment.Developer?.Name ?? "Unknown",
            AvatarUrl: comment.Developer?.AvatarUrl,
            Content: comment.Content,
            CreatedAt: comment.CreatedAt
        );
    }

    public static AttachmentResponse ToAttachmentResponse(this Attachment attachment)
    {
        return new AttachmentResponse(
            Id: attachment.Id,
            FileName: attachment.FileName,
            FilePath: attachment.FilePath,
            FileType: attachment.FileType,
            FileSize: attachment.FileSize,
            UploadedAt: attachment.UploadedAt
        );
    }

    public static ActivityLogResponse ToActivityLogResponse(this ActivityLog log)
    {
        return new ActivityLogResponse(
            Id: log.Id,
            Action: log.Action,
            DeveloperName: log.Developer?.Name,
            OldValue: log.OldValue,
            NewValue: log.NewValue,
            CreatedAt: log.CreatedAt
        );
    }

    public static ProjectResponse ToProjectResponse(this Project project, int totalBugs, int openBugs)
    {
        return new ProjectResponse(
            Id: project.Id,
            Name: project.Name,
            Description: project.Description,
            CreatedAt: project.CreatedAt,
            TotalBugs: totalBugs,
            OpenBugs: openBugs,
            Modules: project.Modules?.Select(m => new ModuleResponse(m.Id, m.Name)).ToList()
                     ?? new List<ModuleResponse>()
        );
    }

    public static DeveloperResponse ToDeveloperResponse(this Developer developer, int openBugs, int closedBugs)
    {
        return new DeveloperResponse(
            Id: developer.Id,
            Name: developer.Name,
            Email: developer.Email,
            AvatarUrl: developer.AvatarUrl,
            OpenBugs: openBugs,
            ClosedBugs: closedBugs
        );
    }
}