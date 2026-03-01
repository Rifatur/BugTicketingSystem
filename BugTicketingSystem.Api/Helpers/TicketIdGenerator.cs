using Microsoft.EntityFrameworkCore;
using BugTicketingSystem.Api.Data;

namespace BugTicketingSystem.Api.Helpers;

public interface ITicketIdGenerator
{
    Task<string> GenerateAsync();
}

public class TicketIdGenerator : ITicketIdGenerator
{
    private readonly AppDbContext _context;
    private static readonly SemaphoreSlim _semaphore = new(1, 1);

    public TicketIdGenerator(AppDbContext context)
    {
        _context = context;
    }

    public async Task<string> GenerateAsync()
    {
        await _semaphore.WaitAsync();

        try
        {
            var datePart = DateTime.UtcNow.ToString("yyMMdd");
            var prefix = $"BUG-{datePart}-";

            // Get the highest sequence number for today
            var lastTicket = await _context.Bugs
                .Where(b => b.TicketId.StartsWith(prefix))
                .OrderByDescending(b => b.TicketId)
                .Select(b => b.TicketId)
                .FirstOrDefaultAsync();

            int sequence = 1;

            if (lastTicket != null)
            {
                var lastSequence = lastTicket.Substring(prefix.Length);
                if (int.TryParse(lastSequence, out var parsed))
                {
                    sequence = parsed + 1;
                }
            }

            return $"{prefix}{sequence:D4}";
        }
        finally
        {
            _semaphore.Release();
        }
    }
}

// Static version for cases where DI is not available
public static class TicketIdGeneratorStatic
{
    private static int _counter = 0;
    private static string _lastDate = "";
    private static readonly object _lock = new();

    public static string Generate()
    {
        lock (_lock)
        {
            var datePart = DateTime.UtcNow.ToString("yyMMdd");

            if (datePart != _lastDate)
            {
                _counter = 0;
                _lastDate = datePart;
            }

            _counter++;
            return $"BUG-{datePart}-{_counter:D4}";
        }
    }
}