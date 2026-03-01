namespace BugTicketingSystem.Api.DTOs
{
    public record CreateProjectRequest(
        string Name,
        string? Description = null
    );

    public record ProjectResponse(
        int Id,
        string Name,
        string? Description,
        DateTime CreatedAt,
        int TotalBugs,
        int OpenBugs,
        List<ModuleResponse> Modules
    );

    public record ModuleResponse(
        int Id,
        string Name
    );

    public record CreateModuleRequest(
        int ProjectId,
        string Name
    );
}
