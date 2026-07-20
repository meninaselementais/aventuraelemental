import fs from 'node:fs';
import path from 'node:path';

const sourcePath = path.resolve(process.argv[2] ?? 'public/assets/elemental-character.glb');
const outputDir = path.resolve(process.argv[3] ?? 'mixamo-elemental-clean');
const buffer = fs.readFileSync(sourcePath);
const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);

let json;
let binaryOffset = 0;
let offset = 12;
while (offset < buffer.length) {
  const length = view.getUint32(offset, true);
  const type = view.getUint32(offset + 4, true);
  if (type === 0x4e4f534a) {
    json = JSON.parse(buffer.toString('utf8', offset + 8, offset + 8 + length));
  } else if (type === 0x004e4942) {
    binaryOffset = offset + 8;
  }
  offset += 8 + length;
}

if (!json || !binaryOffset) throw new Error('GLB inválido.');

const primitive = json.meshes[0].primitives[0];
const positionAccessor = json.accessors[primitive.attributes.POSITION];
const normalAccessor = json.accessors[primitive.attributes.NORMAL];
const uvAccessor = json.accessors[primitive.attributes.TEXCOORD_0];
const indexAccessor = json.accessors[primitive.indices];
const node = json.nodes.find((item) => item.mesh === 0) ?? {};
const translation = node.translation ?? [0, 0, 0];
const rotation = node.rotation ?? [0, 0, 0, 1];
const scale = node.scale ?? [1, 1, 1];

const componentBytes = { 5122: 2, 5123: 2, 5125: 4 };
const components = { SCALAR: 1, VEC2: 2, VEC3: 3 };

function accessorInfo(accessor) {
  const bufferView = json.bufferViews[accessor.bufferView];
  return {
    offset: binaryOffset + (bufferView.byteOffset ?? 0) + (accessor.byteOffset ?? 0),
    stride: bufferView.byteStride ?? componentBytes[accessor.componentType] * components[accessor.type],
    componentType: accessor.componentType,
    normalized: accessor.normalized === true
  };
}

const positions = accessorInfo(positionAccessor);
const normals = accessorInfo(normalAccessor);
const uvs = accessorInfo(uvAccessor);
const indices = accessorInfo(indexAccessor);

function signedShort(byteOffset) {
  const value = view.getInt16(byteOffset, true);
  return Math.max(value / 32767, -1);
}

function unsignedShort(byteOffset) {
  return view.getUint16(byteOffset, true) / 65535;
}

function rotateByQuaternion(x, y, z) {
  const [qx, qy, qz, qw] = rotation;
  const tx = 2 * (qy * z - qz * y);
  const ty = 2 * (qz * x - qx * z);
  const tz = 2 * (qx * y - qy * x);
  return [
    x + qw * tx + (qy * tz - qz * ty),
    y + qw * ty + (qz * tx - qx * tz),
    z + qw * tz + (qx * ty - qy * tx)
  ];
}

const lines = [
  '# Aventura das ELEMENTAIS - personagem limpa para Mixamo',
  '# Sem esqueleto e sem animacoes',
  'mtllib elemental.mtl',
  'o Elemental'
];

for (let i = 0; i < positionAccessor.count; i++) {
  const base = positions.offset + i * positions.stride;
  const local = [signedShort(base) * scale[0], signedShort(base + 2) * scale[1], signedShort(base + 4) * scale[2]];
  const rotated = rotateByQuaternion(...local);
  lines.push(`v ${(rotated[0] + translation[0]).toFixed(6)} ${(rotated[1] + translation[1]).toFixed(6)} ${(rotated[2] + translation[2]).toFixed(6)}`);
}

for (let i = 0; i < uvAccessor.count; i++) {
  const base = uvs.offset + i * uvs.stride;
  lines.push(`vt ${unsignedShort(base).toFixed(6)} ${(1 - unsignedShort(base + 2)).toFixed(6)}`);
}

for (let i = 0; i < normalAccessor.count; i++) {
  const base = normals.offset + i * normals.stride;
  const rotated = rotateByQuaternion(signedShort(base), signedShort(base + 2), signedShort(base + 4));
  const length = Math.hypot(...rotated) || 1;
  lines.push(`vn ${(rotated[0] / length).toFixed(6)} ${(rotated[1] / length).toFixed(6)} ${(rotated[2] / length).toFixed(6)}`);
}

lines.push('usemtl ElementalMaterial', 's 1');
for (let i = 0; i < indexAccessor.count; i += 3) {
  const a = view.getUint32(indices.offset + i * indices.stride, true) + 1;
  const b = view.getUint32(indices.offset + (i + 1) * indices.stride, true) + 1;
  const c = view.getUint32(indices.offset + (i + 2) * indices.stride, true) + 1;
  lines.push(`f ${a}/${a}/${a} ${b}/${b}/${b} ${c}/${c}/${c}`);
}

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(path.join(outputDir, 'elemental-clean.obj'), `${lines.join('\n')}\n`);
const colorTexture = json.textures[primitive.material === undefined ? 0 : json.materials[primitive.material].pbrMetallicRoughness.baseColorTexture.index];
const imageIndex = colorTexture.extensions?.EXT_texture_webp?.source ?? colorTexture.source;
const image = json.images[imageIndex];
const textureExtension = image.mimeType === 'image/png' ? 'png' : image.mimeType === 'image/jpeg' ? 'jpg' : 'webp';
const textureFilename = `elemental-texture.${textureExtension}`;

fs.writeFileSync(path.join(outputDir, 'elemental.mtl'), [
  'newmtl ElementalMaterial',
  'Ka 1.000 1.000 1.000',
  'Kd 1.000 1.000 1.000',
  'Ks 0.000 0.000 0.000',
  'd 1.0',
  'illum 2',
  `map_Kd ${textureFilename}`,
  ''
].join('\n'));

const imageView = json.bufferViews[image.bufferView];
const imageStart = binaryOffset + (imageView.byteOffset ?? 0);
fs.writeFileSync(path.join(outputDir, textureFilename), buffer.subarray(imageStart, imageStart + imageView.byteLength));

console.log(`OBJ criado: ${path.join(outputDir, 'elemental-clean.obj')}`);
