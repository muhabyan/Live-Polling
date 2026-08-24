// Local WebSocket + HTTP Realtime Sync Engine for Multi-Device Live Polling (Phone <-> Laptop <-> Projector)

type SyncListener = (message: any) => void;

let socket: WebSocket | null = null;
const listeners = new Set<SyncListener>();
let reconnectTimer: any = null;
const pendingQueue: any[] = [];

export function initLocalSync(onMessage: SyncListener) {
  listeners.add(onMessage);

  if (!socket || socket.readyState === WebSocket.CLOSED) {
    connect();
  }

  // Also fetch initial state via HTTP fallback immediately
  fetchInitialState();

  return () => {
    listeners.delete(onMessage);
  };
}

async function fetchInitialState() {
  if (typeof window === 'undefined') return;
  try {
    const res = await fetch('/api/live-sync/events');
    if (res.ok) {
      const data = await res.json();
      if (data.events && Array.isArray(data.events) && data.events.length > 0) {
        listeners.forEach((listener) => listener({ type: 'INIT_STATE', events: data.events }));
      }
    }
  } catch {}
}

function connect() {
  if (typeof window === 'undefined') return;

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}/live-sync`;

  try {
    socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log('⚡ [PulseLive] Local Network Sync Connected:', wsUrl);
      // Flush all pending messages queued while connecting
      while (pendingQueue.length > 0) {
        const queued = pendingQueue.shift();
        try {
          socket?.send(JSON.stringify(queued));
        } catch {}
      }
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        listeners.forEach((listener) => listener(data));
      } catch (err) {
        console.warn('WS message parse error:', err);
      }
    };

    socket.onclose = () => {
      clearTimeout(reconnectTimer);
      reconnectTimer = setTimeout(connect, 2000);
    };

    socket.onerror = () => {
      socket?.close();
    };
  } catch (err) {
    clearTimeout(reconnectTimer);
    reconnectTimer = setTimeout(connect, 2000);
  }
}

export function broadcastLocalSync(message: any) {
  // 1. Send via WebSocket if ready, otherwise queue
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(message));
  } else {
    pendingQueue.push(message);
    if (!socket || socket.readyState === WebSocket.CLOSED) {
      connect();
    }
  }

  // 2. Dual-channel HTTP fallback for guaranteed delivery across networks
  if (typeof window !== 'undefined') {
    try {
      if (message.type === 'SYNC_ALL_EVENTS') {
        fetch('/api/live-sync/sync-events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ events: message.events }),
        }).catch(() => {});
      } else if (message.type === 'PARTICIPANT_JOINED') {
        fetch('/api/live-sync/join', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(message),
        }).catch(() => {});
      } else if (message.type === 'RESPONSE_SUBMITTED') {
        fetch('/api/live-sync/vote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(message),
        }).catch(() => {});
      } else if (message.type === 'MODERATOR_ACTION_BROADCAST') {
        fetch('/api/live-sync/action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(message),
        }).catch(() => {});
      }
    } catch {}
  }
}
