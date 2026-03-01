using Microsoft.EntityFrameworkCore;
using BugTicketingSystem.Api.Data;
using BugTicketingSystem.Api.DTOs;
using BugTicketingSystem.Api.Helpers;
using BugTicketingSystem.Api.Models;

namespace BugTicketingSystem.Api.Endpoints;

public static class DeveloperEndpoints
{
    public static void MapDeveloperEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/developers")
            .WithTags("Developers")
            .WithOpenApi();

        // Get all developers
        group.MapGet("/", async (AppDbContext db) =>
        {
            var developers = await db.Developers
                .Include(d => d.AssignedBugs)
                .ToListAsync();

            var result = developers.Select(d =>
            {
                var openBugs = d.AssignedBugs?.Count(b =>
                    b.Status != BugStatus.Closed &&
                    b.Status != BugStatus.Verified) ?? 0;
                var closedBugs = d.AssignedBugs?.Count(b =>
                    b.Status == BugStatus.Closed ||
                    b.Status == BugStatus.Verified) ?? 0;

                return d.ToDeveloperResponse(openBugs, closedBugs);
            }).ToList();

            return Results.Ok(new { success = true, data = result });
        })
        .WithName("GetDevelopers")
        .WithSummary("Get all developers");

        // Get developer by ID
        group.MapGet("/{id:int}", async (int id, AppDbContext db) =>
        {
            var developer = await db.Developers
                .Include(d => d.AssignedBugs)
                .FirstOrDefaultAsync(d => d.Id == id);

            if (developer == null)
                return Results.NotFound(new { error = "Developer not found" });

            var openBugs = developer.AssignedBugs?.Count(b =>
                b.Status != BugStatus.Closed &&
                b.Status != BugStatus.Verified) ?? 0;
            var closedBugs = developer.AssignedBugs?.Count(b =>
                b.Status == BugStatus.Closed ||
                b.Status == BugStatus.Verified) ?? 0;

            return Results.Ok(new { success = true, data = developer.ToDeveloperResponse(openBugs, closedBugs) });
        })
        .WithName("GetDeveloperById")
        .WithSummary("Get a specific developer by ID");

        // Create developer
        group.MapPost("/", async (CreateDeveloperRequest request, AppDbContext db) =>
        {
            if (string.IsNullOrWhiteSpace(request.Name))
                return Results.BadRequest(new { error = "Name is required" });

            if (string.IsNullOrWhiteSpace(request.Email))
                return Results.BadRequest(new { error = "Email is required" });

            // Check if email already exists
            var existingDev = await db.Developers.FirstOrDefaultAsync(d => d.Email == request.Email);
            if (existingDev != null)
                return Results.BadRequest(new { error = "A developer with this email already exists" });

            var developer = new Developer
            {
                Name = request.Name,
                Email = request.Email,
                AvatarUrl = request.AvatarUrl ?? $"https://ui-avatars.com/api/?name={Uri.EscapeDataString(request.Name)}&background=random&color=fff",
                SlackId = request.SlackId,
                TeamsId = request.TeamsId
            };

            db.Developers.Add(developer);
            await db.SaveChangesAsync();

            return Results.Created($"/api/developers/{developer.Id}",
                new { success = true, message = "Developer created successfully", data = new { id = developer.Id } });
        })
        .WithName("CreateDeveloper")
        .WithSummary("Create a new developer");

        // Get developer's bugs
        group.MapGet("/{id:int}/bugs", async (int id, string? status, AppDbContext db) =>
        {
            var developer = await db.Developers.FindAsync(id);
            if (developer == null)
                return Results.NotFound(new { error = "Developer not found" });

            var query = db.Bugs
                .Include(b => b.Project)
                .Include(b => b.Module)
                .Include(b => b.Comments)
                .Include(b => b.Attachments)
                .Where(b => b.AssignedDeveloperId == id);

            if (!string.IsNullOrEmpty(status) && Enum.TryParse<BugStatus>(status, true, out var bugStatus))
            {
                query = query.Where(b => b.Status == bugStatus);
            }

            var bugs = await query.OrderByDescending(b => b.CreatedAt).ToListAsync();

            return Results.Ok(new { success = true, data = bugs.Select(b => b.ToBugResponse()).ToList() });
        })
        .WithName("GetDeveloperBugs")
        .WithSummary("Get all bugs assigned to a developer");

        // Delete developer
        group.MapDelete("/{id:int}", async (int id, AppDbContext db) =>
        {
            var developer = await db.Developers.FindAsync(id);
            if (developer == null)
                return Results.NotFound(new { error = "Developer not found" });

            db.Developers.Remove(developer);
            await db.SaveChangesAsync();

            return Results.Ok(new { success = true, message = "Developer deleted successfully" });
        })
        .WithName("DeleteDeveloper")
        .WithSummary("Delete a developer");
    }
}