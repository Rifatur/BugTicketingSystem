using Microsoft.EntityFrameworkCore;
using BugTicketingSystem.Api.Data;
using BugTicketingSystem.Api.Models;

namespace BugTicketingSystem.Api.Endpoints;

public static class AttachmentEndpoints
{
    public static void MapAttachmentEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/bugs/{bugId:int}/attachments")
            .WithTags("Attachments")
            .WithOpenApi();

        // Get attachments for a bug
        group.MapGet("/", async (int bugId, AppDbContext db) =>
        {
            var bug = await db.Bugs.FindAsync(bugId);
            if (bug == null)
                return Results.NotFound(new { error = "Bug not found" });

            var attachments = await db.Attachments
                .Where(a => a.BugId == bugId)
                .Select(a => new
                {
                    a.Id,
                    a.FileName,
                    a.FilePath,
                    a.FileType,
                    a.FileSize,
                    a.UploadedAt
                })
                .ToListAsync();

            return Results.Ok(new { success = true, data = attachments });
        })
        .WithName("GetBugAttachments")
        .WithSummary("Get all attachments for a bug");

        // Upload attachment
        group.MapPost("/", async (int bugId, IFormFile file, AppDbContext db, IWebHostEnvironment env) =>
        {
            var bug = await db.Bugs.FindAsync(bugId);
            if (bug == null)
                return Results.NotFound(new { error = "Bug not found" });

            if (file == null || file.Length == 0)
                return Results.BadRequest(new { error = "No file provided" });

            // Validate file size (max 10MB)
            if (file.Length > 10 * 1024 * 1024)
                return Results.BadRequest(new { error = "File size exceeds 10MB limit" });

            // Create uploads directory if not exists
            var uploadsPath = Path.Combine(env.WebRootPath ?? "wwwroot", "uploads", bugId.ToString());
            Directory.CreateDirectory(uploadsPath);

            // Generate unique filename
            var fileName = $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
            var filePath = Path.Combine(uploadsPath, fileName);

            // Save file
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            var attachment = new Attachment
            {
                BugId = bugId,
                FileName = file.FileName,
                FilePath = $"/uploads/{bugId}/{fileName}",
                FileType = file.ContentType,
                FileSize = file.Length
            };

            db.Attachments.Add(attachment);

            // Add activity log
            db.ActivityLogs.Add(new ActivityLog
            {
                BugId = bugId,
                Action = "added_attachment",
                NewValue = file.FileName
            });

            await db.SaveChangesAsync();

            return Results.Created($"/api/bugs/{bugId}/attachments/{attachment.Id}",
                new { success = true, message = "Attachment uploaded successfully", data = new { id = attachment.Id, path = attachment.FilePath } });
        })
        .DisableAntiforgery()
        .WithName("UploadAttachment")
        .WithSummary("Upload an attachment to a bug");

        // Delete attachment
        group.MapDelete("/{attachmentId:int}", async (int bugId, int attachmentId, AppDbContext db, IWebHostEnvironment env) =>
        {
            var attachment = await db.Attachments
                .FirstOrDefaultAsync(a => a.Id == attachmentId && a.BugId == bugId);

            if (attachment == null)
                return Results.NotFound(new { error = "Attachment not found" });

            // Delete file from disk
            var fullPath = Path.Combine(env.WebRootPath ?? "wwwroot", attachment.FilePath.TrimStart('/'));
            if (File.Exists(fullPath))
            {
                File.Delete(fullPath);
            }

            db.Attachments.Remove(attachment);
            await db.SaveChangesAsync();

            return Results.Ok(new { success = true, message = "Attachment deleted successfully" });
        })
        .WithName("DeleteAttachment")
        .WithSummary("Delete an attachment");
    }
}