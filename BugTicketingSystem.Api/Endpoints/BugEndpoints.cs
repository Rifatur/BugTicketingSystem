using BugTicketingSystem.Api.DTOs;
using BugTicketingSystem.Api.Services;

namespace BugTicketingSystem.Api.Endpoints;

public static class BugEndpoints
{
    public static void MapBugEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/bugs")
            .WithTags("Bugs")
            .WithOpenApi();

        // Get all bugs with filtering and pagination
        group.MapGet("/", async (
            IBugService bugService,
            string? search,
            int? projectId,
            string? status,
            string? priority,
            int? developerId,
            string? sortBy,
            string? sortOrder,
            int page = 1,
            int pageSize = 20) =>
        {
            var filter = new BugFilterRequest(
                Search: search,
                ProjectId: projectId,
                Status: status != null ? Enum.Parse<Models.BugStatus>(status, true) : null,
                Priority: priority != null ? Enum.Parse<Models.Priority>(priority, true) : null,
                DeveloperId: developerId,
                SortBy: sortBy,
                SortOrder: sortOrder,
                Page: page,
                PageSize: Math.Min(pageSize, 100)
            );

            var result = await bugService.GetBugsAsync(filter);
            return Results.Ok(result);
        })
        .WithName("GetBugs")
        .WithSummary("Get all bugs with optional filtering and pagination");

        // Get bug by ID
        group.MapGet("/{id:int}", async (int id, IBugService bugService) =>
        {
            var bug = await bugService.GetBugByIdAsync(id);
            if (bug == null)
                return Results.NotFound(new { error = "Bug not found" });

            return Results.Ok(new ApiResponse<BugDetailResponse>(true, bug));
        })
        .WithName("GetBugById")
        .WithSummary("Get a specific bug by ID");

        // Get bug by ticket ID
        group.MapGet("/ticket/{ticketId}", async (string ticketId, IBugService bugService) =>
        {
            var bug = await bugService.GetBugByTicketIdAsync(ticketId);
            if (bug == null)
                return Results.NotFound(new { error = "Bug not found" });

            return Results.Ok(new ApiResponse<BugDetailResponse>(true, bug));
        })
        .WithName("GetBugByTicketId")
        .WithSummary("Get a specific bug by ticket ID");

        // Create bug
        group.MapPost("/", async (CreateBugRequest request, IBugService bugService) =>
        {
            if (string.IsNullOrWhiteSpace(request.Title))
                return Results.BadRequest(new { error = "Title is required" });

            if (string.IsNullOrWhiteSpace(request.Description))
                return Results.BadRequest(new { error = "Description is required" });

            var result = await bugService.CreateBugAsync(request);
            return Results.Created($"/api/bugs/{result.Id}",
                new ApiResponse<CreateBugResponse>(true, result, "Bug created successfully"));
        })
        .WithName("CreateBug")
        .WithSummary("Create a new bug");

        // Update bug
        group.MapPut("/{id:int}", async (int id, UpdateBugRequest request, IBugService bugService) =>
        {
            var success = await bugService.UpdateBugAsync(id, request);
            if (!success)
                return Results.NotFound(new { error = "Bug not found" });

            return Results.Ok(new { success = true, message = "Bug updated successfully" });
        })
        .WithName("UpdateBug")
        .WithSummary("Update an existing bug");

        // Delete bug
        group.MapDelete("/{id:int}", async (int id, IBugService bugService) =>
        {
            var success = await bugService.DeleteBugAsync(id);
            if (!success)
                return Results.NotFound(new { error = "Bug not found" });

            return Results.Ok(new { success = true, message = "Bug deleted successfully" });
        })
        .WithName("DeleteBug")
        .WithSummary("Delete a bug");
    }
}