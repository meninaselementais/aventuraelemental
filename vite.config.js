import { defineConfig } from 'vite';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

const rankingFile = path.resolve('data', 'ranking.json');
const validSubjects = new Set(['math', 'portuguese', 'science', 'history', 'english', 'mix']);

async function readRanking() {
  try {
    const entries = JSON.parse(await readFile(rankingFile, 'utf8'));
    return Array.isArray(entries) ? entries : [];
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

async function writeRanking(entries) {
  await mkdir(path.dirname(rankingFile), { recursive: true });
  await writeFile(rankingFile, `${JSON.stringify(entries, null, 2)}\n`, 'utf8');
}

function sortRanking(entries) {
  return entries.sort((a, b) => b.score - a.score || String(a.updatedAt).localeCompare(String(b.updatedAt)));
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let body = '';
    request.setEncoding('utf8');
    request.on('data', chunk => {
      body += chunk;
      if (body.length > 12_000) reject(new Error('request too large'));
    });
    request.on('end', () => {
      try { resolve(JSON.parse(body || '{}')); }
      catch { reject(new Error('invalid json')); }
    });
    request.on('error', reject);
  });
}

function sendJson(response, status, payload) {
  response.statusCode = status;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Cache-Control', 'no-store');
  response.end(JSON.stringify(payload));
}

function rankingApi() {
  let writeQueue = Promise.resolve();

  async function middleware(request, response, next) {
    const pathname = new URL(request.url, 'http://localhost').pathname;
    if (pathname !== '/api/ranking') return next();

    try {
      if (request.method === 'GET') {
        const entries = sortRanking(await readRanking()).slice(0, 50);
        return sendJson(response, 200, { entries });
      }

      if (request.method !== 'POST') return sendJson(response, 405, { error: 'Método não permitido.' });
      const body = await readJsonBody(request);
      const name = String(body.name || '').trim().replace(/[<>\u0000-\u001f]/g, '').replace(/\s+/g, ' ').slice(0, 24);
      const subject = String(body.subject || '');
      const score = Math.max(1, Math.min(25, Number.parseInt(body.score, 10) || 0));
      if (name.length < 2 || !validSubjects.has(subject)) return sendJson(response, 400, { error: 'Dados do jogador inválidos.' });

      const update = async () => {
        const entries = sortRanking(await readRanking());
        const previousTop = entries[0]?.score || 0;
        const key = name.toLocaleLowerCase('pt-BR');
        let entry = entries.find(item => String(item.name).toLocaleLowerCase('pt-BR') === key);
        let improved = false;
        if (!entry) {
          entry = { name, subject, score: 0, level: 1, updatedAt: new Date().toISOString() };
          entries.push(entry);
        }
        if (score > entry.score) {
          improved = true;
          entry.name = name;
          entry.subject = subject;
          entry.score = score;
          entry.level = Math.min(5, Math.floor(score / 5) + 1);
          entry.updatedAt = new Date().toISOString();
          await writeRanking(sortRanking(entries));
        }
        const sorted = sortRanking(entries);
        return {
          entry,
          rank: sorted.indexOf(entry) + 1,
          newLeader: improved && score > previousTop,
          entries: sorted.slice(0, 50)
        };
      };

      const task = writeQueue.then(update);
      writeQueue = task.catch(() => {});
      return sendJson(response, 200, await task);
    } catch (error) {
      console.error('Ranking API:', error);
      return sendJson(response, 500, { error: 'Não foi possível salvar o ranking.' });
    }
  }

  return {
    name: 'elementais-ranking-api',
    configureServer(server) { server.middlewares.use(middleware); },
    configurePreviewServer(server) { server.middlewares.use(middleware); }
  };
}

function multiplayerApi() {
  const players = new Map();
  const broadcast = () => {
    const snapshot = [...players.values()].map(({ socket, ...publicPlayer }) => publicPlayer);
    for (const client of players.values()) {
      if (client.socket.readyState === 1) {
        client.socket.send(JSON.stringify({ type: 'snapshot', selfId: client.id, players: snapshot }));
      }
    }
  };
  return {
    name: 'elementais-multiplayer',
    configureServer(server) {
      import('ws').then(({ WebSocketServer }) => {
        const wss = new WebSocketServer({ noServer: true });
        server.httpServer?.on('upgrade', (request, socket, head) => {
          const pathname = new URL(request.url, 'http://localhost').pathname;
          if (pathname !== '/multiplayer') return;
          wss.handleUpgrade(request, socket, head, client => wss.emit('connection', client, request));
        });
        wss.on('connection', socket => {
        const id = randomUUID();
        const player = { id, socket, name: 'Jogador', room: 1, x: 0, y: 0, z: 2.2, rotation: 0 };
        players.set(id, player);
        socket.send(JSON.stringify({ type: 'welcome', id }));
        broadcast();
        socket.on('message', raw => {
          try {
            const message = JSON.parse(raw);
            if (message.type !== 'state') return;
            Object.assign(player, {
              name: String(message.name || 'Jogador').slice(0, 24), room: Number(message.room) || 1,
              x: Number(message.x) || 0, y: Number(message.y) || 0, z: Number(message.z) || 0,
              rotation: Number(message.rotation) || 0,
              character: String(message.character || 'fogo')
            });
            broadcast();
          } catch { /* pacote inválido */ }
        });
        socket.on('close', () => { players.delete(id); broadcast(); });
        });
      });
    }
  };
}

export default defineConfig({
  plugins: [rankingApi(), multiplayerApi()],
  server: {
    host: '0.0.0.0',
    allowedHosts: ['.trycloudflare.com', '.meninaselementais.com.br']
  },
  preview: {
    host: '0.0.0.0',
    allowedHosts: ['.trycloudflare.com', '.meninaselementais.com.br']
  }
});
