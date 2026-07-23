import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';

// Primeira etapa do multiplayer: cada cliente envia sua posição e enxerga
// avatares simples dos demais jogadores na mesma sala.
const remotePlayers = new Map();
let socket = null;
let sceneRef = null;
let localId = '';
let connected = false;
let lastSentAt = 0;
const avatarTemplates = { fogo: null, terra: null };
const walkClips = { fogo: null, terra: null };

function createNameLabel(name) {
  const canvas = document.createElement('canvas');
  canvas.width = 512; canvas.height = 96;
  const context = canvas.getContext('2d');
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.font = 'bold 38px Arial';
  context.textAlign = 'center'; context.textBaseline = 'middle';
  context.lineJoin = 'round';
  const label = String(name || 'Jogador').slice(0, 24);
  context.lineWidth = 12; context.strokeStyle = 'rgba(15, 8, 26, .9)';
  context.strokeText(label, canvas.width / 2, canvas.height / 2);
  context.fillStyle = '#fff'; context.fillText(label, canvas.width / 2, canvas.height / 2);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false }));
  sprite.scale.set(1.9, .36, 1);
  sprite.position.y = 2.55;
  sprite.renderOrder = 20;
  return sprite;
}

function normalizeAvatar(model) {
  model.rotation.y = Math.PI;
  const bounds = new THREE.Box3().setFromObject(model);
  const size = bounds.getSize(new THREE.Vector3());
  model.scale.setScalar(2.15 / Math.max(size.y, .001));
  model.updateMatrixWorld(true);
  const normalized = new THREE.Box3().setFromObject(model);
  const center = normalized.getCenter(new THREE.Vector3());
  model.position.set(-center.x, -normalized.min.y, -center.z);
  model.traverse(part => { if (part.isMesh) { part.castShadow = true; part.receiveShadow = true; } });
}

function addAvatarVisual(group, record = null) {
  const key = record?.character === 'terra' ? 'terra' : 'fogo';
  const template = avatarTemplates[key] || avatarTemplates.fogo || avatarTemplates.terra;
  const clip = walkClips[key] || walkClips.fogo || walkClips.terra;

  if (template) {
    const model = SkeletonUtils.clone(template);
    normalizeAvatar(model);
    if (record && clip) {
      record.mixer = new THREE.AnimationMixer(model);
      record.walkAction = record.mixer.clipAction(clip.clone());
      record.walkAction.play();
      record.mixer.timeScale = 0;
    }
    group.add(model);
    return;
  }
  const bodyColor = key === 'terra' ? 0x388e3c : 0x7b4fd0;
  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(.28, .72, 4, 8),
    new THREE.MeshStandardMaterial({ color: bodyColor, roughness: .82, emissive: 0x180c35, emissiveIntensity: .25 })
  );
  body.position.y = .65;
  body.castShadow = true;
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(.25, 12, 8),
    new THREE.MeshStandardMaterial({ color: 0xf0a47a, roughness: .8 })
  );
  head.position.y = 1.3;
  head.castShadow = true;
  group.add(body, head);
}

function upgradeAvatars() {
  for (const remote of remotePlayers.values()) {
    remote.object.clear();
    addAvatarVisual(remote.object, remote);
  }
}

function createRemoteAvatar(player) {
  const group = new THREE.Group();
  group.name = `remote-player-${player.id}`;
  const record = { ...player, object: group, lastX: player.x, lastZ: player.z, moving: false };
  addAvatarVisual(group, record);
  group.userData.nameLabel = createNameLabel(player.name);
  group.add(group.userData.nameLabel);
  sceneRef.add(group);
  remotePlayers.set(player.id, record);
  return record;
}

function removeRemoteAvatar(id) {
  const remote = remotePlayers.get(id);
  if (!remote) return;
  sceneRef.remove(remote.object);
  remote.object.traverse(part => {
    if (!part.isMesh) return;
    part.geometry.dispose();
    part.material.dispose();
  });
  remotePlayers.delete(id);
}

function applySnapshot(players, snapshotSelfId = '') {
  // O ID do welcome identifica esta conexão. Não substituímos por um
  // snapshot atrasado de outra conexão através do proxy/túnel.
  if (!localId && snapshotSelfId) localId = snapshotSelfId;
  const seen = new Set();
  for (const player of players) {
    if (player.id === localId) continue;
    seen.add(player.id);
    const remote = remotePlayers.get(player.id);
    const target = remote || createRemoteAvatar(player);
    target.moving = Math.hypot(player.x - (target.lastX ?? player.x), player.z - (target.lastZ ?? player.z)) > .012;
    target.lastX = player.x; target.lastZ = player.z;
    target.object.position.set(player.x, player.y, player.z);
    target.object.rotation.y = player.rotation || 0;
    if (target.name !== player.name) {
      target.object.remove(target.object.userData.nameLabel);
      target.object.userData.nameLabel?.material.map?.dispose();
      target.object.userData.nameLabel?.material.dispose();
      target.object.userData.nameLabel = createNameLabel(player.name);
      target.object.add(target.object.userData.nameLabel);
    }
    if (target.character !== player.character) {
      target.character = player.character;
      target.object.clear();
      addAvatarVisual(target.object, target);
      target.object.add(target.object.userData.nameLabel);
    }
    Object.assign(target, player);
    remotePlayers.set(player.id, target);
  }
  for (const id of remotePlayers.keys()) if (!seen.has(id)) removeRemoteAvatar(id);
}

export function initMultiplayer(scene, onStatus = () => {}) {
  sceneRef = scene;
  const fbxLoader = new FBXLoader();
  fbxLoader.load('/assets/elemental-walking.fbx', fbx => {
    avatarTemplates.fogo = fbx;
    walkClips.fogo = fbx.animations?.[0] || null;
    upgradeAvatars();
  });
  fbxLoader.load('/assets/terra/terra-walking.fbx', fbx => {
    avatarTemplates.terra = fbx;
    walkClips.terra = fbx.animations?.[0] || null;
    upgradeAvatars();
  });
  const configured = import.meta.env.VITE_MULTIPLAYER_URL;
  const protocol = location.protocol === 'https:' ? 'wss' : 'ws';
  const fallback = `${protocol}://${location.host}/multiplayer`;
  const url = configured || fallback;
  if (!url || !('WebSocket' in window)) {
    onStatus('offline');
    return;
  }
  try {
    socket = new WebSocket(url);
    socket.addEventListener('open', () => { connected = true; onStatus('online'); });
    socket.addEventListener('close', () => { connected = false; localId = ''; onStatus('offline'); });
    socket.addEventListener('error', () => { connected = false; onStatus('offline'); });
    socket.addEventListener('message', event => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'welcome') localId = message.id;
        if (message.type === 'snapshot') applySnapshot(message.players || [], message.selfId);
      } catch { /* ignora mensagens inválidas */ }
    });
  } catch {
    onStatus('offline');
  }
}

export function updateMultiplayer(player, playerName, roomNumber, rotation, now = performance.now(), dt = 0, character = 'fogo') {
  for (const remote of remotePlayers.values()) {
    if (remote.mixer) {
      remote.mixer.timeScale = remote.moving ? 1 : 0;
      remote.mixer.update(dt);
    }
  }
  if (!connected || !socket || socket.readyState !== WebSocket.OPEN || now - lastSentAt < 50) return;
  lastSentAt = now;
  socket.send(JSON.stringify({
    type: 'state', name: playerName || 'Jogador', room: roomNumber,
    x: player.position.x, y: player.position.y, z: player.position.z, rotation,
    character: character || 'fogo'
  }));
}
