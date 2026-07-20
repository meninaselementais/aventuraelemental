import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';

// A extração usa apenas os ossos. As imagens incorporadas são ignoradas.
globalThis.window = { URL: { createObjectURL: () => 'blob:ignored', revokeObjectURL: () => {} } };
globalThis.document = {
  createElementNS: () => ({ addEventListener: () => {}, removeEventListener: () => {}, set src(value) {}, get src() { return ''; } })
};

const [source, destination] = process.argv.slice(2);
if (!source || !destination) throw new Error('Informe o FBX de origem e o JSON de destino.');

const file = await readFile(source);
const buffer = file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength);
const model = new FBXLoader().parse(buffer, `${path.dirname(source)}${path.sep}`);
const clip = model.animations?.[0];
if (!clip) throw new Error('O arquivo não possui animação.');

await writeFile(destination, JSON.stringify(clip.toJSON()), 'utf8');
console.log(JSON.stringify({ name: clip.name, duration: clip.duration, tracks: clip.tracks.length }));
