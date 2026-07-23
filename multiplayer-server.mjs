import { WebSocketServer } from 'ws';
import { randomUUID } from 'node:crypto';

const port = Number(process.env.MULTIPLAYER_PORT || 8787);
const players = new Map();
const wss = new WebSocketServer({ port });

function broadcast() {
  const snapshot = [...players.values()];
  for (const client of wss.clients) {
    if (client.readyState === 1) client.send(JSON.stringify({ type: 'snapshot', selfId: client.playerId, players: snapshot }));
  }
}

wss.on('connection', socket => {
  const id = randomUUID();
  const player = { id, name: 'Jogador', room: 1, x: 0, y: 0, z: 2.2, rotation: 0 };
  socket.playerId = id;
  players.set(id, player);
  socket.send(JSON.stringify({ type: 'welcome', id }));
  broadcast();
  socket.on('message', raw => {
    try {
      const message = JSON.parse(raw);
      if (message.type !== 'state') return;
      Object.assign(player, {
        name: String(message.name || 'Jogador').slice(0, 24),
        room: Number(message.room) || 1,
        x: Number(message.x) || 0, y: Number(message.y) || 0, z: Number(message.z) || 0,
        rotation: Number(message.rotation) || 0
      });
      broadcast();
    } catch { /* ignora pacote inválido */ }
  });
  socket.on('close', () => { players.delete(id); broadcast(); });
});

console.log(`Servidor multiplayer aguardando conexões na porta ${port}.`);
