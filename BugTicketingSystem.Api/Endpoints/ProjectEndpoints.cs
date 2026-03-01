using Microsoft.EntityFrameworkCore;
using BugTicketingSystem.Api.Data;
using BugTicketingSystem.Api.DTOs;
using BugTicketingSystem.Api.Helpers;
using BugTicketingSystem.Api.Models;

namespace BugTicketingSystem.Api.Endpoints;

public static class ProjectEndpoints
{
    public static void MapProjectEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/projects")
            .WithTags("Projects")
            .WithOpenApi();

        // Get all projects
        group.MapGet("/", async (AppDbContext db) =>
        {
            var projects = await db.Projects
                .Include(p => p.Modules)
                .Include(p => p.Bugs)
                .ToListAsync();

            var result = projects.Select(p =>
            {
                var totalBugs = p.Bugs?.Count ?? 0;
                var openBugs = p.Bugs?.Count(b =>
                    b.Status != BugStatus.Closed &&
                    b.Status != BugStatus.Verified) ?? 0;

                return p.ToProjectResponse(totalBugs, openBugs);
            }).ToList();

            return Results.Ok(new { success = true, data = result });
        })
        .WithName("GetProjects")
        .WithSummary("Get all projects with their modules");

        // Get project by ID
        group.MapGet("/{id:int}", async (int id, AppDbContext db) =>
        {
            var project = await db.Projects
                .Include(p => p.Modules)
                .Include(p => p.Bugs)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (project == null)
                return Results.NotFound(new { error = "Project not found" });

            var totalBugs = project.Bugs?.Count ?? 0;
            var openBugs = project.Bugs?.Count(b =>
                b.Status != BugStatus.Closed &&
                b.Status != BugStatus.Verified) ?? 0;

            return Results.Ok(new { success = true, data = project.ToProjectResponse(totalBugs, openBugs) });
        })
        .WithName("GetProjectById")
        .WithSummary("Get a specific project by ID");

        // Create project
        group.MapPost("/", async (CreateProjectRequest request, AppDbContext db) => {
            if (string.IsNullOrWhiteSpace(request.Name))
                return Results.BadRequest(new { error = "Project name is required" });

            var project = new Project
            {
                Name = request.Name,
                Description = request.Description
            };

            db.Projects.Add(project);
            await db.SaveChangesAsync();

            return Results.Created($"/api/projects/{project.Id}",
                new { success = true, message = "Project created successfully", data = new { id = project.Id } });
        })
        .WithName("CreateProject")
        .WithSummary("Create a new project");

        // Create module for project
        group.MapPost("/{projectId:int}/modules", async (int projectId, CreateModuleRequest request, AppDbContext db) =>
        {
            var project = await db.Projects.FindAsync(projectId);
            if (project == null)
                return Results.NotFound(new { error = "Project not found" });

            if (string.IsNullOrWhiteSpace(request.Name))
                return Results.BadRequest(new { error = "Module name is required" });

            var module = new Module
            {
                ProjectId = projectId,
                Name = request.Name
            };

            db.Modules.Add(module);
            await db.SaveChangesAsync();

            return Results.Created($"/api/projects/{projectId}/modules/{module.Id}",
                new { success = true, message = "Module created successfully", data = new { id = module.Id } });
        })
        .WithName("CreateModule")
        .WithSummary("Create a new module for a project");

        // Delete project
        group.MapDelete("/{id:int}", async (int id, AppDbContext db) =>
        {
            var project = await db.Projects.FindAsync(id);
            if (project == null)
                return Results.NotFound(new { error = "Project not found" });

            db.Projects.Remove(project);
            await db.SaveChangesAsync();

            return Results.Ok(new { success = true, message = "Project deleted successfully" });
        })
        .WithName("DeleteProject")
        .WithSummary("Delete a project");
    }
}