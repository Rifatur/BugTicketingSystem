using BugTicketingSystem.Api.Services;

namespace BugTicketingSystem.Api.Endpoints;

public static class NotificationEndpoints
{
    public static void MapNotificationEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/notifications")
            .WithTags("Notifications")
            .WithOpenApi();

        // Get notifications for a developer
        group.MapGet("/developer/{developerId:int}", async (int developerId, bool? unreadOnly, INotificationService notificationService) =>
        {
            var notifications = await notificationService.GetNotificationsAsync(developerId, unreadOnly ?? false);

            var result = notifications.Select(n => new
            {
                n.Id,
                n.Type,
                n.Title,
                n.Message,
                n.BugId,
                n.IsRead,
                n.CreatedAt
            }).ToList();

            return Results.Ok(new { success = true, data = result });
        })
        .WithName("GetDeveloperNotifications")
        .WithSummary("Get notifications for a developer");

        // Mark notification as read
        group.MapPut("/{id:int}/read", async (int id, INotificationService notificationService) =>
        {
            await notificationService.MarkAsReadAsync(id);
            return Results.Ok(new { success = true, message = "Notification marked as read" });
        })
        .WithName("MarkNotificationAsRead")
        .WithSummary("Mark a notification as read");

        // Mark all notifications as read for a developer
        group.MapPut("/developer/{developerId:int}/read-all", async (int developerId, INotificationService notificationService) =>
        {
            await notificationService.MarkAllAsReadAsync(developerId);
            return Results.Ok(new { success = true, message = "All notifications marked as read" });
        })
        .WithName("MarkAllNotificationsAsRead")
        .WithSummary("Mark all notifications as read for a developer");
    }
}