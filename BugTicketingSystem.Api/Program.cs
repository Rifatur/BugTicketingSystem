using Microsoft.EntityFrameworkCore;
using BugTicketingSystem.Api.Data;
using BugTicketingSystem.Api.Endpoints;
using BugTicketingSystem.Api.Helpers;
using BugTicketingSystem.Api.Services;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using System.Text.Json.Serialization;
var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddEndpointsApiExplorer();

// Configure JSON serialization to handle enums as strings
builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.Converters.Add(new JsonStringEnumConverter());
});
// Add SwaggerGen and (optionally) annotations support
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new()
    {
        Title = "Bug Ticketing System API",
        Version = "v1",
        Description = " bug tracking and ticketing system API built with ASP.NET Core 10 Minimal APIs and SQL Server",
        Contact = new()
        {
            Name = "Bug Tracker Support",
            Email = "support@bugtracker.com"
        }
    });

    options.EnableAnnotations();
});

// Add DbContext with SQL Server
//builder.Services.AddDbContext<AppDbContext>(options =>
//{
//    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

//    options.UseSqlServer(connectionString, sqlOptions =>
//    {
//        sqlOptions.EnableRetryOnFailure(
//            maxRetryCount: 5,
//            maxRetryDelay: TimeSpan.FromSeconds(30),
//            errorNumbersToAdd: null);

//        sqlOptions.CommandTimeout(30);
//        sqlOptions.MigrationsHistoryTable("__EFMigrationsHistory", "dbo");
//    });

//    if (builder.Environment.IsDevelopment())
//    {
//        options.EnableSensitiveDataLogging();
//        options.EnableDetailedErrors();
//    }
//});

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));


// Add services
builder.Services.AddScoped<ITicketIdGenerator, TicketIdGenerator>();
builder.Services.AddScoped<IBugService, BugService>();
builder.Services.AddScoped<IReportService, ReportService>();
builder.Services.AddScoped<INotificationService, NotificationService>();

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });

    options.AddPolicy("Production", policy =>
    {
        policy.WithOrigins(
                "https://yourdomain.com",
                "https://www.yourdomain.com")
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

// Add Response Compression
builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true;
});

// Add Output Caching
builder.Services.AddOutputCache(options =>
{
    options.AddBasePolicy(builder => builder.Expire(TimeSpan.FromMinutes(5)));
    options.AddPolicy("Dashboard", builder => builder.Expire(TimeSpan.FromMinutes(1)));
    options.AddPolicy("Reports", builder => builder.Expire(TimeSpan.FromMinutes(10)));
});

// Add Health Checks
builder.Services.AddHealthChecks()
    .AddDbContextCheck<AppDbContext>(name: "sql", failureStatus: HealthStatus.Unhealthy, tags: new[] { "ready" });

// Add Problem Details
builder.Services.AddProblemDetails();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();
}
// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "Bug Ticketing System API v1");
        options.RoutePrefix = "swagger";
        options.DocumentTitle = "Bug Ticketing System API";
        options.EnableDeepLinking();
        options.DisplayRequestDuration();
    });
}
else
{
    app.UseExceptionHandler();
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseResponseCompression();
app.UseCors(app.Environment.IsDevelopment() ? "AllowAll" : "Production");
app.UseOutputCache();
app.UseStaticFiles();

// Map endpoints
app.MapBugEndpoints();
app.MapProjectEndpoints();
app.MapDeveloperEndpoints();
app.MapDashboardEndpoints();
app.MapReportEndpoints();
app.MapCommentEndpoints();
app.MapNotificationEndpoints();
app.MapAttachmentEndpoints();

// Health check endpoints
app.MapHealthChecks("/health", new()
{
    ResponseWriter = async (context, report) =>
    {
        context.Response.ContentType = "application/json";

        var result = new
        {
            status = report.Status.ToString(),
            timestamp = DateTime.UtcNow,
            duration = report.TotalDuration,
            checks = report.Entries.Select(e => new
            {
                name = e.Key,
                status = e.Value.Status.ToString(),
                duration = e.Value.Duration,
                exception = e.Value.Exception?.Message,
                data = e.Value.Data
            })
        };

        await context.Response.WriteAsJsonAsync(result);
    }
});

app.MapGet("/health/live", () => Results.Ok(new { status = "healthy", timestamp = DateTime.UtcNow }))
    .WithName("LivenessCheck")
    .WithTags("Health")
    .ExcludeFromDescription();

app.MapGet("/health/ready", async (AppDbContext db) =>
{
    try
    {
        await db.Database.CanConnectAsync();
        return Results.Ok(new { status = "ready", timestamp = DateTime.UtcNow });
    }
    catch (Exception ex)
    {
        return Results.Json(
            new { status = "unhealthy", error = ex.Message, timestamp = DateTime.UtcNow },
            statusCode: 503);
    }
})
.WithName("ReadinessCheck")
.WithTags("Health")
.ExcludeFromDescription();

// API Info endpoint
app.MapGet("/api", () => Results.Ok(new
{
    name = "Bug Ticketing System API",
    version = "1.0.0",
    environment = app.Environment.EnvironmentName,
    timestamp = DateTime.UtcNow,
    endpoints = new
    {
        bugs = "/api/bugs",
        projects = "/api/projects",
        developers = "/api/developers",
        dashboard = "/api/dashboard",
        reports = "/api/reports",
        health = "/health"
    }
}))
.WithName("ApiInfo")
.WithTags("System")
.WithOpenApi();

// Initialize database with seed data
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();

    try
    {
        // Apply pending migrations in production
        if (!app.Environment.IsDevelopment())
        {
            logger.LogInformation("Applying database migrations...");
            await context.Database.MigrateAsync();
        }

        // Initialize with seed data
        await DbInitializer.InitializeAsync(context, logger);
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "An error occurred while initializing the database");

        if (app.Environment.IsDevelopment())
        {
            throw;
        }
    }
}

// Fallback to index.html for SPA routing
app.MapFallbackToFile("index.html");

app.Run();

// Make Program class accessible for integration tests
public partial class Program { }