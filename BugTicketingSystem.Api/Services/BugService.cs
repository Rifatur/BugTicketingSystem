using Microsoft.EntityFrameworkCore;
using BugTicketingSystem.Api.Data;
using BugTicketingSystem.Api.DTOs;
using BugTicketingSystem.Api.Helpers;
using BugTicketingSystem.Api.Models;

namespace BugTicketingSystem.Api.Services;

public class BugService : IBugService
{
    private readonly AppDbContext _context;
    private readonly INotificationService _notificationService;
    private readonly ITicketIdGenerator _ticketIdGenerator;
    private readonly ILogger<BugService> _logger;

    public BugService(
        AppDbContext context,
        INotificationService notificationService,
        ITicketIdGenerator ticketIdGenerator,
        ILogger<BugService> logger)
    {
        _context = context;
        _notificationService = notificationService;
        _ticketIdGenerator = ticketIdGenerator;
        _logger = logger;
    }

    public async Task<PaginatedResponse<BugResponse>> GetBugsAsync(BugFilterRequest filter)
    {
        var query = _context.Bugs
            .Include(b => b.Project)
            .Include(b => b.Module)
            .Include(b => b.AssignedDeveloper)
            .Include(b => b.ReportedBy)
            .Include(b => b.Comments)
            .Include(b => b.Attachments)
            .AsNoTracking()
            .AsQueryable();

        // Apply filters
        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var search = filter.Search.ToLower();
            query = query.Where(b =>
                b.Title.ToLower().Contains(search) ||
                b.TicketId.ToLower().Contains(search) ||
                b.Description.ToLower().Contains(search));
        }

        if (filter.ProjectId.HasValue)
        {
            query = query.Where(b => b.ProjectId == filter.ProjectId.Value);
        }

        if (filter.Status.HasValue)
        {
            query = query.Where(b => b.Status == filter.Status.Value);
        }

        if (filter.Priority.HasValue)
        {
            query = query.Where(b => b.Priority == filter.Priority.Value);
        }

        if (filter.DeveloperId.HasValue)
        {
            query = query.Where(b => b.AssignedDeveloperId == filter.DeveloperId.Value);
        }

        // Get total count before pagination
        var total = await query.CountAsync();

        // Apply sorting
        query = ApplySorting(query, filter.SortBy, filter.SortOrder);

        // Apply pagination
        var pageSize = Math.Min(filter.PageSize, 100);
        var bugs = await query
            .Skip((filter.Page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var data = bugs.Select(b => b.ToBugResponse()).ToList();

        return new PaginatedResponse<BugResponse>(
            Success: true,
            Data: data,
            Pagination: new PaginationInfo(
                Page: filter.Page,
                PageSize: pageSize,
                Total: total,
                TotalPages: (int)Math.Ceiling(total / (double)pageSize)
            )
        );
    }

    private static IQueryable<Bug> ApplySorting(IQueryable<Bug> query, string? sortBy, string? sortOrder)
    {
        var isDescending = sortOrder?.ToLower() != "asc";

        return sortBy?.ToLower() switch
        {
            "priority" => isDescending
                ? query.OrderByDescending(b => b.Priority)
                : query.OrderBy(b => b.Priority),
            "status" => isDescending
                ? query.OrderByDescending(b => b.Status)
                : query.OrderBy(b => b.Status),
            "deadline" => isDescending
                ? query.OrderByDescending(b => b.Deadline)
                : query.OrderBy(b => b.Deadline),
            "title" => isDescending
                ? query.OrderByDescending(b => b.Title)
                : query.OrderBy(b => b.Title),
            "updatedat" => isDescending
                ? query.OrderByDescending(b => b.UpdatedAt)
                : query.OrderBy(b => b.UpdatedAt),
            _ => isDescending
                ? query.OrderByDescending(b => b.CreatedAt)
                : query.OrderBy(b => b.CreatedAt)
        };
    }

    public async Task<BugDetailResponse?> GetBugByIdAsync(int id)
    {
        var bug = await _context.Bugs
            .Include(b => b.Project)
            .Include(b => b.Module)
            .Include(b => b.AssignedDeveloper)
            .Include(b => b.ReportedBy)
            .Include(b => b.Comments)
                .ThenInclude(c => c.Developer)
            .Include(b => b.Attachments)
            .Include(b => b.ActivityLogs)
                .ThenInclude(a => a.Developer)
            .AsNoTracking()
            .FirstOrDefaultAsync(b => b.Id == id);

        return bug?.ToBugDetailResponse();
    }

    public async Task<BugDetailResponse?> GetBugByTicketIdAsync(string ticketId)
    {
        var bug = await _context.Bugs
            .Include(b => b.Project)
            .Include(b => b.Module)
            .Include(b => b.AssignedDeveloper)
            .Include(b => b.ReportedBy)
            .Include(b => b.Comments)
                .ThenInclude(c => c.Developer)
            .Include(b => b.Attachments)
            .Include(b => b.ActivityLogs)
                .ThenInclude(a => a.Developer)
            .AsNoTracking()
            .FirstOrDefaultAsync(b => b.TicketId == ticketId);

        return bug?.ToBugDetailResponse();
    }

    public async Task<CreateBugResponse> CreateBugAsync(CreateBugRequest request)
    {
        var ticketId = await _ticketIdGenerator.GenerateAsync();

        var bug = new Bug
        {
            TicketId = ticketId,
            ProjectId = request.ProjectId,
            ModuleId = request.ModuleId,
            Title = request.Title,
            Description = request.Description,
            StepsToReproduce = request.StepsToReproduce,
            ExpectedResult = request.ExpectedResult,
            ActualResult = request.ActualResult,
            Priority = request.Priority,
            Severity = request.Severity,
            Status = BugStatus.Open,
            AssignedDeveloperId = request.AssignedDeveloperId,
            ReportedById = request.ReportedById,
            EstimatedFixHours = request.EstimatedFixHours,
            Deadline = request.Deadline,
            Environment = request.Environment,
            Browser = request.Browser,
            Os = request.Os,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await using var transaction = await _context.Database.BeginTransactionAsync();

        try
        {
            _context.Bugs.Add(bug);
            await _context.SaveChangesAsync();

            // Add activity log
            _context.ActivityLogs.Add(new ActivityLog
            {
                BugId = bug.Id,
                DeveloperId = request.ReportedById,
                Action = "created",
                NewValue = "Bug created",
                CreatedAt = DateTime.UtcNow
            });

            await _context.SaveChangesAsync();

            // Send notification if assigned
            if (request.AssignedDeveloperId.HasValue)
            {
                await _notificationService.CreateNotificationAsync(
                    request.AssignedDeveloperId.Value,
                    bug.Id,
                    NotificationType.Assignment,
                    "New Bug Assigned",
                    $"You have been assigned to bug: {bug.Title}"
                );
            }

            await transaction.CommitAsync();

            _logger.LogInformation("Bug {TicketId} created successfully", ticketId);

            return new CreateBugResponse(bug.Id, ticketId);
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            _logger.LogError(ex, "Error creating bug");
            throw;
        }
    }

    public async Task<bool> UpdateBugAsync(int id, UpdateBugRequest request)
    {
        var bug = await _context.Bugs.FindAsync(id);
        if (bug == null) return false;

        var changes = new List<(string Field, string? OldValue, string? NewValue)>();

        await using var transaction = await _context.Database.BeginTransactionAsync();

        try
        {
            // Track and apply changes
            if (request.Title != null && request.Title != bug.Title)
            {
                changes.Add(("title", bug.Title, request.Title));
                bug.Title = request.Title;
            }

            if (request.Description != null && request.Description != bug.Description)
            {
                bug.Description = request.Description;
            }

            if (request.StepsToReproduce != null)
                bug.StepsToReproduce = request.StepsToReproduce;

            if (request.ExpectedResult != null)
                bug.ExpectedResult = request.ExpectedResult;

            if (request.ActualResult != null)
                bug.ActualResult = request.ActualResult;

            if (request.Priority.HasValue && request.Priority.Value != bug.Priority)
            {
                changes.Add(("priority", bug.Priority.ToString(), request.Priority.Value.ToString()));
                bug.Priority = request.Priority.Value;
            }

            if (request.Severity.HasValue && request.Severity.Value != bug.Severity)
            {
                changes.Add(("severity", bug.Severity.ToString(), request.Severity.Value.ToString()));
                bug.Severity = request.Severity.Value;
            }

            if (request.Status.HasValue && request.Status.Value != bug.Status)
            {
                var oldStatus = bug.Status;
                changes.Add(("status", oldStatus.ToString(), request.Status.Value.ToString()));
                bug.Status = request.Status.Value;

                // Update timestamps based on status
                if (request.Status.Value == BugStatus.Fixed && oldStatus != BugStatus.Fixed)
                {
                    bug.ResolvedAt = DateTime.UtcNow;
                }
                if (request.Status.Value == BugStatus.Closed && oldStatus != BugStatus.Closed)
                {
                    bug.ClosedAt = DateTime.UtcNow;
                }

                // Notify reporter about status change
                if (bug.ReportedById.HasValue)
                {
                    await _notificationService.CreateNotificationAsync(
                        bug.ReportedById.Value,
                        bug.Id,
                        NotificationType.StatusChange,
                        "Bug Status Updated",
                        $"Bug {bug.TicketId} status changed to {request.Status.Value}"
                    );
                }
            }

            if (request.AssignedDeveloperId.HasValue && request.AssignedDeveloperId != bug.AssignedDeveloperId)
            {
                var oldDevId = bug.AssignedDeveloperId;
                bug.AssignedDeveloperId = request.AssignedDeveloperId.Value == 0
                    ? null
                    : request.AssignedDeveloperId.Value;

                if (bug.AssignedDeveloperId.HasValue)
                {
                    var newDev = await _context.Developers.FindAsync(bug.AssignedDeveloperId.Value);
                    changes.Add(("assigned_developer", oldDevId?.ToString(), newDev?.Name));

                    await _notificationService.CreateNotificationAsync(
                        bug.AssignedDeveloperId.Value,
                        bug.Id,
                        NotificationType.Reassignment,
                        "Bug Reassigned to You",
                        $"Bug {bug.TicketId} has been reassigned to you"
                    );
                }
            }

            if (request.ModuleId.HasValue)
                bug.ModuleId = request.ModuleId.Value == 0 ? null : request.ModuleId.Value;

            if (request.EstimatedFixHours.HasValue)
                bug.EstimatedFixHours = request.EstimatedFixHours.Value;

            if (request.Deadline.HasValue)
                bug.Deadline = request.Deadline.Value;

            if (request.Environment != null)
                bug.Environment = request.Environment;

            if (request.Browser != null)
                bug.Browser = request.Browser;

            if (request.Os != null)
                bug.Os = request.Os;

            bug.UpdatedAt = DateTime.UtcNow;

            // Log activity for each change
            foreach (var change in changes)
            {
                _context.ActivityLogs.Add(new ActivityLog
                {
                    BugId = bug.Id,
                    DeveloperId = request.UpdatedById,
                    Action = $"updated_{change.Field}",
                    OldValue = change.OldValue,
                    NewValue = change.NewValue,
                    CreatedAt = DateTime.UtcNow
                });
            }

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            _logger.LogInformation("Bug {BugId} updated successfully", id);

            return true;
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            _logger.LogError(ex, "Error updating bug {BugId}", id);
            throw;
        }
    }

    public async Task<bool> DeleteBugAsync(int id)
    {
        var bug = await _context.Bugs.FindAsync(id);
        if (bug == null) return false;

        _context.Bugs.Remove(bug);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Bug {BugId} deleted successfully", id);

        return true;
    }
}