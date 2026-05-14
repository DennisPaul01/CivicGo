using System.Collections.Concurrent;
using System.Text.Json;
using System.Threading.Channels;

namespace CivicGo.Api.Live;

public sealed class IssueEventStreamService
{
    private const int MaxHistoryPerIssue = 40;
    private long nextEventId;
    private readonly ConcurrentDictionary<Guid, IssueEventState> issueStreams = new();

    public IssueEventSubscription Subscribe(Guid issueId)
    {
        var state = issueStreams.GetOrAdd(issueId, _ => new IssueEventState());
        var channel = Channel.CreateUnbounded<IssueStreamEvent>(
            new UnboundedChannelOptions
            {
                SingleReader = true,
                SingleWriter = false
            }
        );

        lock (state.SyncRoot)
        {
            foreach (var item in state.History)
            {
                channel.Writer.TryWrite(item);
            }

            state.Subscribers.Add(channel);
        }

        return new IssueEventSubscription(
            channel.Reader,
            () =>
            {
                lock (state.SyncRoot)
                {
                    state.Subscribers.Remove(channel);
                }

                channel.Writer.TryComplete();
            }
        );
    }

    public Task PublishAsync(
        Guid issueId,
        string type,
        object data,
        CancellationToken cancellationToken = default
    )
    {
        var state = issueStreams.GetOrAdd(issueId, _ => new IssueEventState());
        var item = new IssueStreamEvent(
            Interlocked.Increment(ref nextEventId),
            type,
            data,
            DateTimeOffset.UtcNow
        );
        List<Channel<IssueStreamEvent>> subscribers;

        lock (state.SyncRoot)
        {
            state.History.Enqueue(item);

            while (state.History.Count > MaxHistoryPerIssue)
            {
                state.History.Dequeue();
            }

            subscribers = state.Subscribers.ToList();
        }

        foreach (var subscriber in subscribers)
        {
            if (!subscriber.Writer.TryWrite(item))
            {
                lock (state.SyncRoot)
                {
                    state.Subscribers.Remove(subscriber);
                }
            }
        }

        return Task.CompletedTask;
    }

    public static string SerializeData(IssueStreamEvent item)
    {
        return JsonSerializer.Serialize(
            new
            {
                type = item.Type,
                data = item.Data,
                createdAt = item.CreatedAt
            },
            new JsonSerializerOptions(JsonSerializerDefaults.Web)
        );
    }

    private sealed class IssueEventState
    {
        public object SyncRoot { get; } = new();
        public Queue<IssueStreamEvent> History { get; } = new();
        public List<Channel<IssueStreamEvent>> Subscribers { get; } = [];
    }
}

public sealed record IssueStreamEvent(
    long Id,
    string Type,
    object Data,
    DateTimeOffset CreatedAt
);

public sealed class IssueEventSubscription(
    ChannelReader<IssueStreamEvent> reader,
    Action dispose
) : IDisposable
{
    public ChannelReader<IssueStreamEvent> Reader { get; } = reader;

    public void Dispose()
    {
        dispose();
    }
}
