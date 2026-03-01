namespace BugTicketingSystem.Api.DTOs
{
    public record DeveloperResponse(
        int Id,
        string Name,
        string Email,
        string? AvatarUrl,
        int OpenBugs,
        int ClosedBugs
    );

    public record CreateDeveloperRequest(
        string Name,
        string Email,
        string? AvatarUrl = null,
        string? SlackId = null,
        string? TeamsId = null
    );
}
