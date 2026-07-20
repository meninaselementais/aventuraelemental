import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const project = path.dirname(fileURLToPath(import.meta.url));
const linkFile = path.join(project, 'LINK-PUBLICO.txt');
const vite = path.join(project, 'node_modules', 'vite', 'bin', 'vite.js');
const publicLink = 'https://meninaselementais.com.br';
const testOnly = process.argv.includes('--test');
const portIndex = process.argv.indexOf('--port');
const port = portIndex >= 0 ? Number(process.argv[portIndex + 1]) : 5174;
const origin = `http://127.0.0.1:${port}`;
let server = null;
let serverError = '';

function stopServer() {
  if (server && !server.killed) server.kill();
}

process.on('SIGINT', () => {
  stopServer();
  process.exit(0);
});
process.on('SIGTERM', () => {
  stopServer();
  process.exit(0);
});
process.on('exit', stopServer);

async function serverIsReady() {
  try {
    const response = await fetch(`${origin}/`, { cache: 'no-store' });
    return response.ok;
  } catch {
    return false;
  }
}

async function waitForServer() {
  for (let attempt = 0; attempt < 30; attempt++) {
    if (await serverIsReady()) return;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`o servidor do jogo nao iniciou. ${serverError}`.trim());
}

try {
  if (!existsSync(vite)) throw new Error('as dependencias do jogo nao estao instaladas');

  if (!(await serverIsReady())) {
    server = spawn(process.execPath, [vite, '--host', '0.0.0.0', '--port', String(port), '--strictPort'], {
      cwd: project,
      windowsHide: true,
      stdio: ['ignore', 'ignore', 'pipe']
    });
    server.stderr.on('data', (data) => {
      serverError = `${serverError}${data}`.slice(-3000);
    });
  }

  await waitForServer();
  await writeFile(linkFile, `${publicLink}\r\n`);

  if (testOnly) {
    console.log('Servidor do jogo validado na porta 5174.');
    stopServer();
  } else {
    console.clear();
    console.log('AVENTURA DAS ELEMENTAIS');
    console.log('');
    console.log('O jogo esta ligado neste computador.');
    console.log('');
    console.log('LINK FIXO PARA JOGAR:');
    console.log(publicLink);
    console.log('Digite o endereco completo: meninaselementais.com.br (comeca com "menina").');
    console.log('');
    console.log('Mantenha esta janela aberta. Pressione Ctrl+C para encerrar o jogo.');
    console.log('');

    if (server) {
      await new Promise((resolve, reject) => {
        server.once('error', reject);
        server.once('exit', (code) => code === 0 ? resolve() : reject(new Error(`o servidor encerrou com o codigo ${code}`)));
      });
    } else {
      // Se o servidor ja estava ligado por outra janela, mantenha este painel
      // aberto sem usar uma Promise solta (que o Node encerra como erro).
      await new Promise(() => {
        setInterval(() => {}, 60_000);
      });
    }
  }
} catch (error) {
  console.error('');
  console.error(`Nao foi possivel ligar o jogo: ${error.message}`);
  console.error('Feche outras janelas do jogo e tente novamente.');
  stopServer();
  process.exitCode = 1;
}
