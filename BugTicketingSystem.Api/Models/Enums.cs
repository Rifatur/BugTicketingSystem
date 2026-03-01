namespace BugTicketingSystem.Api.Models;

public enum Priority
{
    Low,
    Medium,
    High,
    Critical
}

public enum Severity
{
    Minor,
    Major,
    Blocker
}

public enum BugStatus
{
    Open,
    InProgress,
    Fixed,
    Verified,
    Closed,
    Reopened
}

public enum NotificationType
{
    Assignment,
    Reassignment,
    StatusChange,
    Comment,
    Mention,
    Deadline
}