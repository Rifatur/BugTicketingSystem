using BugTicketingSystem.Api.Models;

namespace BugTicketingSystem.Api.Services;

public interface INotificationService
{
    Task CreateNotificationAsync(int developerId, int bugId, NotificationType type, string title, string message);
    Task<List<Notification>> GetNotificationsAsync(int developerId, bool unreadOnly = false);
    Task MarkAsReadAsync(int notificationId);
    Task MarkAllAsReadAsync(int developerId);
}