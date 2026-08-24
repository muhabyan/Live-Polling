import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';
import { WebSocketServer, WebSocket } from 'ws';

function livePollingSyncPlugin(): Plugin {
  let wss: WebSocketServer | null = null;
  let serverEvents: any[] = [];

  const broadcast = (msg: any, senderWs?: WebSocket) => {
    const payload = JSON.stringify(msg);
    wss?.clients.forEach((client) => {
      if (client !== senderWs && client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    });
  };

  return {
    name: 'live-polling-sync-plugin',
    configureServer(server) {
      // 1. HTTP REST fallback & sync endpoints for rock-solid cross-device sync
      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith('/api/live-sync')) {
          return next();
        }

        const parseBody = (callback: (body: any) => void) => {
          let rawData = '';
          req.on('data', (chunk) => {
            rawData += chunk;
          });
          req.on('end', () => {
            try {
              const body = rawData ? JSON.parse(rawData) : {};
              callback(body);
            } catch {
              callback({});
            }
          });
        };

        if (req.method === 'GET' && req.url === '/api/live-sync/events') {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ events: serverEvents }));
          return;
        }

        if (req.method === 'POST' && req.url === '/api/live-sync/sync-events') {
          parseBody((body) => {
            if (Array.isArray(body.events)) {
              serverEvents = body.events;
              broadcast({ type: 'ALL_EVENTS_UPDATED', events: serverEvents });
            }
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, count: serverEvents.length }));
          });
          return;
        }

        if (req.method === 'POST' && req.url === '/api/live-sync/join') {
          parseBody((body) => {
            const { eventId, roomCode, participant } = body;
            if (participant) {
              const targetCode = (roomCode || '').toUpperCase();
              let evt = serverEvents.find((e) => e.id === eventId || e.roomCode?.toUpperCase() === targetCode);
              if (evt) {
                if (!evt.participants) evt.participants = [];
                if (!evt.participants.some((p: any) => p.id === participant.id)) {
                  evt.participants.push(participant);
                }
              }
              broadcast({
                type: 'PARTICIPANT_JOINED',
                eventId: evt?.id || eventId,
                roomCode: targetCode,
                participant,
              });
            }
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true }));
          });
          return;
        }

        if (req.method === 'POST' && req.url === '/api/live-sync/vote') {
          parseBody((body) => {
            const { eventId, response } = body;
            if (response) {
              const evt = serverEvents.find((e) => e.id === eventId);
              if (evt) {
                if (!evt.responses) evt.responses = [];
                const filtered = evt.responses.filter(
                  (r: any) => !(r.participantId === response.participantId && r.questionId === response.questionId)
                );
                evt.responses = [...filtered, response];
              }
              broadcast({
                type: 'RESPONSE_SUBMITTED',
                eventId,
                response,
              });
            }
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true }));
          });
          return;
        }

        if (req.method === 'POST' && req.url === '/api/live-sync/action') {
          parseBody((body) => {
            const { eventId, action, updatedFields } = body;
            const evt = serverEvents.find((e) => e.id === eventId);
            if (evt && updatedFields) {
              Object.assign(evt, updatedFields);
            }
            broadcast({
              type: 'MODERATOR_ACTION_BROADCAST',
              eventId,
              action,
              updatedFields,
            });
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true }));
          });
          return;
        }

        next();
      });

      // 2. Real-time WebSocket upgrade server
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
        // Send initial sync state to new connecting device
        if (serverEvents.length > 0) {
          ws.send(JSON.stringify({ type: 'INIT_STATE', events: serverEvents }));
        }

        ws.on('message', (raw) => {
          try {
            const msg = JSON.parse(raw.toString());

            if (msg.type === 'SYNC_ALL_EVENTS') {
              serverEvents = msg.events || [];
              broadcast({ type: 'ALL_EVENTS_UPDATED', events: serverEvents }, ws);
            } else if (msg.type === 'PARTICIPANT_JOINED') {
              const targetCode = (msg.roomCode || '').toUpperCase();
              let evt = serverEvents.find((e) => e.id === msg.eventId || e.roomCode?.toUpperCase() === targetCode);
              if (evt) {
                if (!evt.participants) evt.participants = [];
                if (!evt.participants.some((p: any) => p.id === msg.participant.id)) {
                  evt.participants.push(msg.participant);
                }
              }
              broadcast(msg, ws);
            } else if (msg.type === 'RESPONSE_SUBMITTED') {
              const evt = serverEvents.find((e) => e.id === msg.eventId);
              if (evt) {
                if (!evt.responses) evt.responses = [];
                const filtered = evt.responses.filter(
                  (r: any) => !(r.participantId === msg.response.participantId && r.questionId === msg.response.questionId)
                );
                evt.responses = [...filtered, msg.response];
              }
              broadcast(msg, ws);
            } else if (msg.type === 'MODERATOR_ACTION_BROADCAST') {
              const evt = serverEvents.find((e) => e.id === msg.eventId);
              if (evt && msg.updatedFields) {
                Object.assign(evt, msg.updatedFields);
              }
              broadcast(msg, ws);
            } else if (msg.type === 'REACTION_SENT') {
              broadcast(msg, ws);
            }
          } catch (err) {
            console.error('WS message error:', err);
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
    host: true, // Listen on 0.0.0.0 so mobile devices on the same WiFi/Hotspot can connect directly
    port: 5173,
  },
});
