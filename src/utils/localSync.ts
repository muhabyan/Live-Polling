// Local WebSocket Realtime Sync Engine for Multi-Device Live Polling (Phone <-> Laptop <-> Projector)

type SyncListener = (message: any) => void;

let socket: WebSocket | null = null;
const listeners = new Set<SyncListener>();
let reconnectTimer: any = null;

export function initLocalSync(onMessage: SyncListener) {
  listeners.add(onMessage);

  if (!socket || socket.readyState === WebSocket.CLOSED) {
    connect();
  }

  return () => {
    listeners.delete(onMessage);
  };
}

function connect() {
  if (typeof window === 'undefined') return;

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}/live-sync`;

  try {
    socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log('⚡ [PulseLive] Local Network Sync Connected:', wsUrl);
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
      // Auto-reconnect every 2 seconds
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
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(message));
  }
}
