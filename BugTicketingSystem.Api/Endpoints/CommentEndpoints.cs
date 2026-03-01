using Microsoft.EntityFrameworkCore;
using BugTicketingSystem.Api.Data;
using BugTicketingSystem.Api.DTOs;
using BugTicketingSystem.Api.Helpers;
using BugTicketingSystem.Api.Models;
using BugTicketingSystem.Api.Services;

namespace BugTicketingSystem.Api.Endpoints;

public record AddCommentRequest(int DeveloperId, string Content);

public static class CommentEndpoints
{
    public static void MapCommentEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/bugs/{bugId:int}/comments")
            .WithTags("Comments")
            .WithOpenApi();

        // Get comments for a bug
        group.MapGet("/", async (int bugId, AppDbContext db) =>
        {
            var bug = await db.Bugs.FindAsync(bugId);
            if (bug == null)
                return Results.NotFound(new { error = "Bug not found" });

            var comments = await db.Comments
                .Include(c => c.Developer)
                .Where(c => c.BugId == bugId)
                .OrderByDescending(c => c.CreatedAt)
                .Select(c => c.ToCommentResponse())
                .ToListAsync();

            return Results.Ok(new { success = true, data = comments });
        })
        .WithName("GetBugComments")
        .WithSummary("Get all comments for a bug");

        // Add comment to a bug
        group.MapPost("/", async (int bugId, AddCommentRequest request, AppDbContext db, INotificationService notificationService) =>
        {
            var bug = await db.Bugs.FindAsync(bugId);
            if (bug == null)
                return Results.NotFound(new { error = "Bug not found" });

            var developer = await db.Developers.FindAsync(request.DeveloperId);
            if (developer == null)
                return Results.BadRequest(new { error = "Developer not found" });

            if (string.IsNullOrWhiteSpace(request.Content))
                return Results.BadRequest(new { error = "Comment content is required" });

            var comment = new Comment
            {
                BugId = bugId,
                DeveloperId = request.DeveloperId,
                Content = request.Content
            };

            db.Comments.Add(comment);

            // Add activity log
            db.ActivityLogs.Add(new ActivityLog
            {
                BugId = bugId,
                DeveloperId = request.DeveloperId,
                Action = "added_comment",
                NewValue = "Added a comment"
            });

            bug.UpdatedAt = DateTime.UtcNow;

            await db.SaveChangesAsync();

            // Notify assigned developer if different from commenter
            if (bug.AssignedDeveloperId.HasValue && bug.AssignedDeveloperId != request.DeveloperId)
            {
                await notificationService.CreateNotificationAsync(
                    bug.AssignedDeveloperId.Value,
                    bugId,
                    NotificationType.Comment,
                    "New Comment",
                    $"{developer.Name} commented on bug {bug.TicketId}"
                );
            }

            // Notify reporter if different from commenter
            if (bug.ReportedById.HasValue && bug.ReportedById != request.DeveloperId &&
                bug.ReportedById != bug.AssignedDeveloperId)
            {
                await notificationService.CreateNotificationAsync(
                    bug.ReportedById.Value,
                    bugId,
                    NotificationType.Comment,
                    "New Comment",
                    $"{developer.Name} commented on bug {bug.TicketId}"
                );
            }

            return Results.Created($"/api/bugs/{bugId}/comments/{comment.Id}",
                new { success = true, message = "Comment added successfully", data = new { id = comment.Id } });
        })
        .WithName("AddComment")
        .WithSummary("Add a comment to a bug");

        // Delete comment
        group.MapDelete("/{commentId:int}", async (int bugId, int commentId, AppDbContext db) =>
        {
            var comment = await db.Comments
                .FirstOrDefaultAsync(c => c.Id == commentId && c.BugId == bugId);

            if (comment == null)
                return Results.NotFound(new { error = "Comment not found" });

            db.Comments.Remove(comment);
            await db.SaveChangesAsync();

            return Results.Ok(new { success = true, message = "Comment deleted successfully" });
        })
        .WithName("DeleteComment")
        .WithSummary("Delete a comment");
    }
}