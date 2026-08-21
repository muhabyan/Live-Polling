import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';
import { WebSocketServer, WebSocket } from 'ws';

function livePollingSyncPlugin(): Plugin {
  let wss: WebSocketServer | null = null;
  let serverEvents: any[] = [];

  return {
    name: 'live-polling-sync-plugin',
    configureServer(server) {
      if (!server.httpServer) return;

      wss = new WebSocketServer({ noServer: true });

      server.httpServer.on('upgrade', (request, socket, head) => {
        if (request.url?.startsWith('/live-sync')) {
          wss?.handleUpgrade(request, socket, head, (ws) => {
            wss?.emit('connection', ws, request);
          });
        }
      });

      wss.on('connection', (ws) => {
        // Send existing state to new connecting device (e.g. phone or projector)
        if (serverEvents.length > 0) {
          ws.send(JSON.stringify({ type: 'INIT_STATE', events: serverEvents }));
        }

        ws.on('message', (raw) => {
          try {
            const msg = JSON.parse(raw.toString());

            // Handle event state sync from presenter / admin
            if (msg.type === 'SYNC_ALL_EVENTS') {
              serverEvents = msg.events || [];
              // Broadcast to all other devices
              wss?.clients.forEach((client) => {
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                  client.send(JSON.stringify({ type: 'ALL_EVENTS_UPDATED', events: serverEvents }));
                }
              });
            } else if (msg.type === 'PARTICIPANT_JOINED') {
              // Add participant to the target event in server memory
              const evt = serverEvents.find((e) => e.id === msg.eventId || e.roomCode === msg.roomCode);
              if (evt) {
                if (!evt.participants) evt.participants = [];
                if (!evt.participants.some((p: any) => p.id === msg.participant.id)) {
                  evt.participants.push(msg.participant);
                }
              }
              // Broadcast to all clients (Presenter, Projector, Phones)
              wss?.clients.forEach((client) => {
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                  client.send(JSON.stringify(msg));
                }
              });
            } else if (msg.type === 'RESPONSE_SUBMITTED') {
              // Add response to target event in server memory
              const evt = serverEvents.find((e) => e.id === msg.eventId);
              if (evt) {
                if (!evt.responses) evt.responses = [];
                const filtered = evt.responses.filter(
                  (r: any) => !(r.participantId === msg.response.participantId && r.questionId === msg.response.questionId)
                );
                evt.responses = [...filtered, msg.response];
              }
              // Broadcast to all clients
              wss?.clients.forEach((client) => {
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                  client.send(JSON.stringify(msg));
                }
              });
            } else if (msg.type === 'MODERATOR_ACTION_BROADCAST') {
              // Update server event with action
              const evt = serverEvents.find((e) => e.id === msg.eventId);
              if (evt && msg.updatedEvent) {
                Object.assign(evt, msg.updatedEvent);
              }
              // Broadcast to all clients
              wss?.clients.forEach((client) => {
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                  client.send(JSON.stringify(msg));
                }
              });
            } else if (msg.type === 'REACTION_SENT') {
              // Broadcast reaction to all other clients
              wss?.clients.forEach((client) => {
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                  client.send(JSON.stringify(msg));
                }
              });
            }
          } catch (err) {
            console.error('WS broadcast error:', err);
          }
        });
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), livePollingSyncPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: true, // Listen on 0.0.0.0 so mobile devices on the same WiFi can connect directly
    port: 5173,
  },
});
