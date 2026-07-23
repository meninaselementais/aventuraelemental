import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import './style.css?v=alpha-1.21';
import { SUBJECTS, getQuestion, normalizeAnswer } from './questions.js';
import { initCaderno, abrirCaderno } from './notebook.js';
import { initMultiplayer, updateMultiplayer } from './multiplayer.js';
import { GAME_RELEASE } from './updates.js?v=alpha-1.21';

const $ = (selector) => document.querySelector(selector);
const ui = {
  start: $('#start-screen'), startButton: $('#start-button'), hud: $('#hud'), level: $('#level-value'),
  subjectScreen: $('#subject-screen'), subjectList: $('#subject-list'), subjectLabel: $('#subject-label'),
  roomLabel: $('#room-label'), dots: $('#room-dots'), guide: $('#guide'), guideText: $('#guide-text'),
  face: $('#lia-face'), crosshair: $('#crosshair'), interact: $('#interact-button'), controls: $('#touch-controls'),
  math: $('#math-modal'), question: $('#question'), answers: $('#answers'), hearts: $('#hearts'), feedback: $('#feedback'),
  operationHint: $('#operation-hint'), transition: $('#room-transition'),
  typedAnswer: $('#typed-answer'), answerInput: $('#answer-input'),
  closeMath: $('#close-math'), levelModal: $('#level-modal'), newLevel: $('#new-level'), continueButton: $('#continue-button'),
  completionEyebrow: $('#completion-eyebrow'), completionTitle: $('#completion-title'), completionText: $('#completion-text'),
  joystick: $('#joystick-zone'), knob: $('#joystick-knob'), lookZone: $('#look-zone'), sound: $('#sound-button'),
  playerName: $('#player-name'), playerLogin: $('#player-login-button'), playerMessage: $('#player-login-message'),
  hudPlayer: $('#hud-player'), rankingButton: $('#ranking-button'), subjectRankingButton: $('#subject-ranking-button'),
  rankingModal: $('#ranking-modal'), rankingList: $('#ranking-list'), closeRanking: $('#close-ranking'),
  jump: $('#jump-button'), slowStep: $('#slow-step-button'), run: $('#run-button'), notebook: $('#notebook-button'),
  gameVersion: $('#game-version'), updatesBook: $('#updates-book-button'), updatesBookSummary: $('#updates-book-summary'),
  updatesModal: $('#updates-modal'), updatesVersion: $('#updates-version'), updatesDate: $('#updates-date'),
  updatesList: $('#updates-list'), updatesContinue: $('#updates-continue'), characterList: $('#character-select-list')
};

let scene, camera, renderer, clock;
let selectedCharacter = localStorage.getItem('elementais-character') || 'fogo';
let doorGroup, doorPivot, panelGroup, doorGlow, characterGroup;
let initialRoomTemplate = null, initialRoomLoading = null, activeRoomModel = null;
let initialRockTexture = null;
let woodTexture = null;
let initialRoomBlockers = [];
let leftArm, rightArm, leftLeg, rightLeg, walkTime = 0;
let elementalTemplate = null, elementalLoading = false, elementalLoadFailed = false;
let elementalAnimations = [], characterMixer = null, walkingAction = null, slowWalkingAction = null, idleAction = null, jumpingAction = null, runningAction = null;
let walkBlend = 0, slowWalkBlend = 0, runBlend = 0, idleBlend = 1, jumpBlend = 0, scriptedWalk = false;
let started = false, subjectChosen = false, modalOpen = false, changingRoom = false, soundOn = true;
let sharedAudioContext = null;
let roomNumber = 1, level = 1, roomInLevel = 1, attempts = 0;
let problem = null, doorSide = 0, doorDistance = Infinity;
let currentSubject = 'math', subjectFinished = false;
let playerName = '', playerConnected = false, newRecordThisLevel = false;
let pendingProgress = Promise.resolve(false);
let jumpActive = false, jumpElapsed = 0, jumpOffset = 0, jumpVelocity = 0, jumpDuration = .74, mobileSlowMode = false, mobileRunMode = false;
let guideHideTimer = null, guideRemoveTimer = null;
const JUMP_ASCEND_DURATION = .35;
const JUMP_DESCEND_DURATION = .39;
const JUMP_HEIGHT = .72;
const JUMP_FORWARD_SPEED_START = 4.5;
const JUMP_FORWARD_SPEED_END = 2.15;
const CHARACTER_GROUND_Y = .09;
let yaw = 0, pitch = 0;
const keys = {};
const MOVEMENT_KEYS = ['KeyW', 'ArrowUp', 'KeyS', 'ArrowDown', 'KeyA', 'ArrowLeft', 'KeyD', 'ArrowRight'];
let joystickPointerId = null;
const moveInput = { x: 0, y: 0 };
const velocity = new THREE.Vector2();
const jumpDirection = new THREE.Vector2(0, -1);
const wrongChoices = new Set();
const debugMode = import.meta.env.DEV && new URLSearchParams(location.search).has('debug');
const PLAYER_STORAGE_KEY = 'elementais-player-name';
const player = { position: new THREE.Vector3(0, 0, 2.2), radius: .42 };
const INITIAL_ROOM_URL = '/assets/sala-inicial.glb?v=7';
const INITIAL_RAIL_DROP = .23;
const THEMES = [
  { name: 'Corredores Dourados', wall: 0xcfc5a0, floor: 0x756b55, ceiling: 0xe7dfc9, accent: 0xf0a849, fog: 0x8b7a58, light: 0xffe5a1, kind: 'classic' },
  { name: 'Templo do Fogo', wall: 0x542d25, floor: 0x241b1b, ceiling: 0x2f2020, accent: 0xff642e, fog: 0x3e1612, light: 0xff6b30, kind: 'fire' },
  { name: 'Câmara das Águas', wall: 0x397f91, floor: 0x174a5b, ceiling: 0x265d70, accent: 0x46e0e5, fog: 0x123e57, light: 0x78edff, kind: 'water' },
  { name: 'Mina de Carvão', wall: 0x34363b, floor: 0x17191d, ceiling: 0x202226, accent: 0xffb23f, fog: 0x111318, light: 0xffc56a, kind: 'coal' },
  { name: 'Gruta de Cristal', wall: 0x594c78, floor: 0x28233e, ceiling: 0x39304e, accent: 0xb58cff, fog: 0x211a38, light: 0xc6a8ff, kind: 'crystal' }
];
let roomSpec = createRoomSpec(1);

function createRoomSpec(number) {
  if (number === 1) {
    return { halfX: 12.5, halfZ: 8, height: 5.4, shape: 'mine', theme: THEMES[3], doorScale: .96 };
  }
  const sizes = [
    { halfX: 6, halfZ: 6, height: 3.4, shape: 'square' },
    { halfX: 7.5, halfZ: 5, height: 4.1, shape: 'rectangle' },
    { halfX: 6.4, halfZ: 6.4, height: 4, shape: 'round' },
    { halfX: 4.8, halfZ: 4.8, height: 3.2, shape: 'small' },
    { halfX: 8, halfZ: 7, height: 4.6, shape: 'large' }
  ];
  return { ...sizes[(number - 1) % sizes.length], theme: THEMES[(number - 1) % THEMES.length], doorScale: .86 + Math.random() * .3 };
}

function init3D() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x17132a);
  scene.fog = new THREE.FogExp2(0x241d38, .025);
  camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, .1, 60);
  camera.rotation.order = 'YXZ';
  renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  const mobileGraphics = matchMedia('(pointer: coarse)').matches || /iPhone|iPad|iPod/i.test(navigator.userAgent);
  renderer.setPixelRatio(Math.min(devicePixelRatio, mobileGraphics ? 1.35 : 1.7));
  renderer.setSize(innerWidth, innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  $('#game').appendChild(renderer.domElement);
  clock = new THREE.Clock();
  buildRoom();
  initMultiplayer(scene, status => { document.body.dataset.multiplayer = status; });
  addLights();
  updateCamera();
  animate();
}

function mat(color, roughness = .8, emissive = 0x000000) {
  return new THREE.MeshStandardMaterial({ color, roughness, emissive, emissiveIntensity: emissive ? .45 : 0 });
}

function getInitialRockTexture() {
  if (initialRockTexture) return initialRockTexture;
  const size = 192;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const context = canvas.getContext('2d');
  const pixels = context.createImageData(size, size);
  let seed = 0x1a16c0de;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const index = (y * size + x) * 4;
      const broad = Math.sin(x * .105 + Math.sin(y * .04) * 2.4) * 10;
      const grain = (random() - .5) * 24;
      const crack = Math.abs(Math.sin(x * .035 + y * .072 + Math.sin(y * .021) * 2.8)) > .985 ? -28 : 0;
      const light = broad + grain + crack;
      pixels.data[index] = THREE.MathUtils.clamp(69 + light, 24, 105);
      pixels.data[index + 1] = THREE.MathUtils.clamp(43 + light * .62, 17, 76);
      pixels.data[index + 2] = THREE.MathUtils.clamp(28 + light * .38, 10, 53);
      pixels.data[index + 3] = 255;
    }
  }
  context.putImageData(pixels, 0, 0);
  initialRockTexture = new THREE.CanvasTexture(canvas);
  initialRockTexture.colorSpace = THREE.SRGBColorSpace;
  initialRockTexture.wrapS = initialRockTexture.wrapT = THREE.RepeatWrapping;
  initialRockTexture.repeat.set(5, 2);
  initialRockTexture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
  return initialRockTexture;
}

function getWoodTexture() {
  if (woodTexture) return woodTexture;
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const context = canvas.getContext('2d');
  context.fillStyle = '#6a2f17';
  context.fillRect(0, 0, size, size);
  for (let x = 0; x <= size; x += 64) {
    context.strokeStyle = 'rgba(35, 12, 5, .55)';
    context.lineWidth = 5;
    context.beginPath(); context.moveTo(x, 0); context.lineTo(x + 8, size); context.stroke();
    context.strokeStyle = 'rgba(177, 84, 35, .28)';
    context.lineWidth = 2;
    context.beginPath(); context.moveTo(x + 9, 0); context.lineTo(x - 3, size); context.stroke();
  }
  for (let y = 8; y < size; y += 19) {
    context.strokeStyle = 'rgba(222, 117, 48, .18)';
    context.lineWidth = 1.5;
    context.beginPath();
    for (let x = 0; x <= size; x += 16) {
      const yy = y + Math.sin(x * .065 + y * .12) * 3;
      if (x === 0) context.moveTo(x, yy); else context.lineTo(x, yy);
    }
    context.stroke();
  }
  woodTexture = new THREE.CanvasTexture(canvas);
  woodTexture.colorSpace = THREE.SRGBColorSpace;
  woodTexture.wrapS = woodTexture.wrapT = THREE.RepeatWrapping;
  woodTexture.repeat.set(1.2, 1.6);
  woodTexture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
  return woodTexture;
}

function addBox(name, size, position, material, parent = scene) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  mesh.name = name;
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function loadInitialRoom() {
  if (initialRoomTemplate) return Promise.resolve(initialRoomTemplate);
  if (initialRoomLoading) return initialRoomLoading;
  initialRoomLoading = new Promise((resolve, reject) => {
    new GLTFLoader().load(INITIAL_ROOM_URL, (gltf) => {
      initialRoomTemplate = gltf.scene;
      resolve(initialRoomTemplate);
    }, undefined, reject);
  }).catch((error) => {
    console.error('Sala inicial:', error);
    initialRoomLoading = null;
    return null;
  });
  return initialRoomLoading;
}

function configureInitialRoom(model) {
  initialRoomBlockers = [];
  model.updateMatrixWorld(true);
  model.traverse((part) => {
    if (part.isLight) {
      part.color.set(0xffb45f);
      part.intensity = 0;
      return;
    }
    if (!part.isMesh) return;
    const partName = part.name.toLowerCase();
    // O kit veio com os trilhos elevados. Rebaixamos o conjunto inteiro para
    // os dormentes ficarem apoiados no piso e as botas passarem por cima deles.
    if (/(si_rail_|si_mine_cart_)/i.test(part.name) && !part.userData.railAligned) {
      part.position.y -= INITIAL_RAIL_DROP;
      part.userData.railAligned = true;
    }
    const collision = partName.includes('-colonly');
    if (collision) {
      // Cave_Rocks possui volumes maiores que as pedras visíveis e era a
      // origem das colisões fantasma. Pedras pequenas ficam decorativas.
      const blocksPlayer = /(cave_pillar|post_a|mine_cart)/i.test(part.name);
      if (blocksPlayer) {
        part.updateWorldMatrix(true, false);
        const box = new THREE.Box3().setFromObject(part);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        // As paredes e rochas muito grandes usam o limite geral da sala. Caixas
        // individuais para elas criavam zonas invisíveis que prendiam a personagem.
        if (size.x > 7.5 || size.z > 7.5 || size.y < .35) {
          part.visible = false;
          return;
        }
        if (/cave_pillar/i.test(part.name)) {
          initialRoomBlockers.push({
            type: 'circle', x: center.x, z: center.z,
            radius: THREE.MathUtils.clamp(Math.min(size.x, size.z) * .24, .3, .92),
            minY: box.min.y, maxY: box.max.y
          });
        } else {
          const shrink = /post_a/i.test(part.name) ? .24 : .2;
          box.min.x += size.x * shrink;
          box.max.x -= size.x * shrink;
          box.min.z += size.z * shrink;
          box.max.z -= size.z * shrink;
          initialRoomBlockers.push({ type: 'box', box });
        }
      }
      part.visible = false;
      return;
    }
    if (/mine_cart/i.test(part.name)) {
      const brighten = (material) => {
        const copy = material.clone();
        copy.emissive = new THREE.Color(0x2b1408);
        copy.emissiveIntensity = .42;
        copy.roughness = Math.max(.55, copy.roughness ?? .7);
        return copy;
      };
      part.material = Array.isArray(part.material) ? part.material.map(brighten) : brighten(part.material);
    }
    // Para as pedras soltas usamos a malha VISÍVEL com um núcleo pequeno.
    // Assim não se atravessa o centro da pedra, mas as pontas irregulares não
    // criam paredes invisíveis ao redor da personagem.
    if (/^SI_Cave_(?:Wall_)?Rocks_[ABC]_\d+$/i.test(part.name)) {
      part.updateWorldMatrix(true, false);
      const visibleBox = new THREE.Box3().setFromObject(part);
      const visibleSize = visibleBox.getSize(new THREE.Vector3());
      const visibleCenter = visibleBox.getCenter(new THREE.Vector3());
      const wallRock = /Cave_Wall_Rocks/i.test(part.name);
      initialRoomBlockers.push({
        type: 'circle', x: visibleCenter.x, z: visibleCenter.z,
        radius: wallRock
          ? THREE.MathUtils.clamp(Math.min(visibleSize.x, visibleSize.z) * .2, .38, .88)
          : THREE.MathUtils.clamp(Math.min(visibleSize.x, visibleSize.z) * .16, .24, .56),
        minY: visibleBox.min.y, maxY: visibleBox.max.y
      });
    }
    part.castShadow = true;
    part.receiveShadow = true;
  });
  addInitialRoomFinish(model);
}

function addInitialRoomFinish(model) {
  const rockTexture = getInitialRockTexture();
  const rock = new THREE.MeshStandardMaterial({
    map: rockTexture,
    bumpMap: rockTexture,
    bumpScale: .48,
    color: 0xf0c69f,
    roughness: 1,
    metalness: 0,
    emissive: 0x2d1209,
    emissiveIntensity: .52
  });
  const deepRock = new THREE.MeshStandardMaterial({
    map: rockTexture,
    bumpMap: rockTexture,
    bumpScale: .62,
    color: 0x9b6d50,
    roughness: 1,
    metalness: 0,
    emissive: 0x1f0b06,
    emissiveIntensity: .48
  });
  const wood = getWoodTexture();
  const oldWood = new THREE.MeshStandardMaterial({ map: wood, bumpMap: wood, bumpScale: .22, color: 0xffffff, roughness: .88, metalness: 0, emissive: 0x140603, emissiveIntensity: .22 });
  const iron = new THREE.MeshStandardMaterial({ color: 0x211d1b, roughness: .55, metalness: .68 });

  // Cobertura e paredes contínuas atrás das rochas fecham todas as emendas
  // sem esconder o acabamento irregular da caverna.
  const roof = addBox('SI_Ceiling_Seamless_Backing', [25.4, .42, 16.3], [0, 5.72, 0], deepRock, model);
  roof.castShadow = false;
  addBox('SI_North_Upper_Backfill', [25.2, 3.1, .58], [0, 4.12, 7.74], rock, model);
  addBox('SI_South_Upper_Backfill', [25.2, 3.1, .58], [0, 4.12, -7.74], rock, model);
  addBox('SI_West_Upper_Backfill', [.58, 3.1, 15.2], [-12.24, 4.12, 0], rock, model);
  // A parede leste mantém o vão central da porta usada no jogo.
  addBox('SI_East_Upper_Backfill_A', [.58, 3.1, 6.05], [12.24, 4.12, -4.85], rock, model);
  addBox('SI_East_Upper_Backfill_B', [.58, 3.1, 6.05], [12.24, 4.12, 4.85], rock, model);

  // Porta apenas cenográfica no patamar superior, atrás da escada.
  const door = new THREE.Group();
  door.name = 'SI_Decorative_Door_Stairs';
  door.position.set(-.2, 3.63, -7.66);
  addBox('SI_Decorative_Door_Leaf', [1.92, 2.72, .18], [0, 0, 0], oldWood, door);
  addBox('SI_Decorative_Door_FrameTop', [2.42, .24, .34], [0, 1.48, 0], iron, door);
  addBox('SI_Decorative_Door_FrameL', [.24, 3.18, .34], [-1.09, 0, 0], iron, door);
  addBox('SI_Decorative_Door_FrameR', [.24, 3.18, .34], [1.09, 0, 0], iron, door);
  for (const y of [-.68, .68]) addBox('SI_Decorative_Door_Brace', [1.55, .12, .07], [0, y, .13], iron, door);
  const handle = new THREE.Mesh(new THREE.SphereGeometry(.085, 10, 7), iron);
  handle.name = 'SI_Decorative_Door_Handle';
  handle.position.set(.66, -.05, .18);
  handle.castShadow = true;
  door.add(handle);
  model.add(door);
}

function initialRoomBlocks(position) {
  if (roomNumber !== 1 || !initialRoomBlockers.length) return false;
  const feetY = initialRoomGroundHeight(position.x, position.y);
  const headY = feetY + 2.15;
  for (const obstacle of initialRoomBlockers) {
    if (obstacle.type === 'circle') {
      if (obstacle.maxY < feetY + .08 || obstacle.minY > headY) continue;
      const dx = position.x - obstacle.x;
      const dz = position.y - obstacle.z;
      const clearance = player.radius + obstacle.radius;
      if (dx * dx + dz * dz < clearance * clearance) return true;
      continue;
    }
    const box = obstacle.box;
    if (box.max.y < feetY + .08 || box.min.y > headY) continue;
    const closestX = THREE.MathUtils.clamp(position.x, box.min.x, box.max.x);
    const closestZ = THREE.MathUtils.clamp(position.y, box.min.z, box.max.z);
    const dx = position.x - closestX;
    const dz = position.y - closestZ;
    if (dx * dx + dz * dz < player.radius * player.radius) return true;
  }
  return false;
}

function initialRoomGroundHeight(x, z) {
  if (roomNumber !== 1) return 0;
  // A escada sobe para o fundo da mina: começa em z=-4.10 e termina no
  // patamar em z=-7.93. A interpolação contínua acompanha os degraus.
  const onStairs = x >= -2.42 && x <= 2.02 && z >= -8.05 && z <= -3.92;
  if (onStairs) {
    const progress = THREE.MathUtils.clamp((-4.1 - z) / 3.83, 0, 1);
    return progress * 2.25;
  }
  const onPlatform = x >= 1.9 && x <= 11.25 && z >= -8.05 && z <= -1.92;
  return onPlatform ? 2.25 : 0;
}

function resolveInitialRoomMovement(target) {
  if (roomNumber !== 1 || !initialRoomBlockers.length) return target;
  const resolved = new THREE.Vector2(player.position.x, player.position.z);
  const start = resolved.clone();
  const distance = start.distanceTo(target);
  const steps = Math.max(1, Math.ceil(distance / .16));
  for (let step = 1; step <= steps; step++) {
    const intended = start.clone().lerp(target, step / steps);
    const moveX = new THREE.Vector2(intended.x, resolved.y);
    if (!initialRoomBlocks(moveX)) resolved.x = intended.x;
    const moveZ = new THREE.Vector2(resolved.x, intended.y);
    if (!initialRoomBlocks(moveZ)) resolved.y = intended.y;
  }
  return resolved;
}

function attachInitialRoom() {
  loadInitialRoom().then((template) => {
    if (!template || roomNumber !== 1 || !subjectChosen) return;
    if (activeRoomModel) scene.remove(activeRoomModel);
    activeRoomModel = template.clone(true);
    activeRoomModel.name = 'Sala_Inicial';
    scene.add(activeRoomModel);
    configureInitialRoom(activeRoomModel);
  });
}

function buildRoom() {
  while (scene.children.length) scene.remove(scene.children[0]);
  activeRoomModel = null;
  initialRoomBlockers = [];
  const theme = roomSpec.theme;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = roomSpec.shape === 'mine' ? 1.16 : 1;
  scene.background = new THREE.Color(theme.fog);
  scene.fog = new THREE.FogExp2(theme.fog, roomSpec.shape === 'large' ? .018 : .026);
  const wallMat = mat(theme.wall);
  const floorMat = mat(theme.floor, .96);
  const ceilingMat = mat(theme.ceiling, .9);
  const trimMat = mat(theme.kind === 'coal' ? 0x15171a : 0x453754);
  const { halfX, halfZ, height } = roomSpec;

  if (roomSpec.shape === 'mine') {
    // Base discreta enquanto o arquivo do Blender termina de carregar.
    addBox('mineLoadingFloor', [roomSpec.halfX * 2, .2, roomSpec.halfZ * 2], [0, -.22, 0], mat(0x17191d, 1));
    attachInitialRoom();
  } else if (roomSpec.shape === 'round') {
    const radius = halfX;
    const floor = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, .2, 40), floorMat);
    floor.position.y = -.1; floor.receiveShadow = true; scene.add(floor);
    const ceiling = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, .16, 40), ceilingMat);
    ceiling.position.y = height; ceiling.receiveShadow = true; scene.add(ceiling);
    const segments = 32, arc = (Math.PI * 2 * radius) / segments;
    for (let i = 0; i < segments; i++) {
      const angle = i / segments * Math.PI * 2;
      const wall = addBox('roundWall', [arc + .08, height, .28], [Math.sin(angle) * radius, height / 2, Math.cos(angle) * radius], wallMat);
      wall.rotation.y = angle;
    }
  } else {
    addBox('floor', [halfX * 2, .2, halfZ * 2], [0, -.1, 0], floorMat);
    addBox('ceiling', [halfX * 2, .16, halfZ * 2], [0, height, 0], ceilingMat);
    addBox('wallS', [halfX * 2, height, .25], [0, height / 2, halfZ], wallMat);
    addBox('wallN', [halfX * 2, height, .25], [0, height / 2, -halfZ], wallMat);
    addBox('wallW', [.25, height, halfZ * 2], [-halfX, height / 2, 0], wallMat);
    addBox('wallE', [.25, height, halfZ * 2], [halfX, height / 2, 0], wallMat);
  }

  if (roomSpec.shape !== 'mine') {
    for (let z = -halfZ + 1.5; z < halfZ; z += 2.5) {
      const beam = addBox('ceilingBeam', [Math.max(2, halfX * 1.8), .12, .1], [0, height - .12, z], trimMat);
      beam.castShadow = false;
    }
    for (let x = -halfX + 1.5; x < halfX; x += 3) {
      const fixture = addBox('light', [1.5, .05, .48], [x, height - .22, 0], mat(theme.light, .35, theme.light));
      fixture.castShadow = false;
    }
    addThemeDetails(theme);
  }
  createDoor(doorSide, theme.accent);
  createElemental();
}

function addThemeDetails(theme) {
  const { halfX, halfZ, height } = roomSpec;
  if (theme.kind === 'fire') {
    for (const x of [-halfX + .8, halfX - .8]) {
      for (const z of [-halfZ * .45, halfZ * .45]) {
        const flame = new THREE.Mesh(new THREE.ConeGeometry(.28, .95, 7), mat(0xff632e, .35, 0xff3b16));
        flame.position.set(x, .48, z); flame.castShadow = true; scene.add(flame);
        const glow = new THREE.PointLight(0xff5428, 9, 4, 2); glow.position.set(x, .8, z); scene.add(glow);
      }
    }
  } else if (theme.kind === 'water') {
    for (let i = 0; i < 7; i++) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(.25 + (i % 3) * .12, .025, 6, 20), mat(0x75f2ff, .2, 0x28aabd));
      ring.rotation.x = Math.PI / 2; ring.position.set(-halfX * .7 + (i * 1.73) % (halfX * 1.4), .025, -halfZ * .6 + (i * 2.1) % (halfZ * 1.2)); scene.add(ring);
    }
  } else if (theme.kind === 'coal') {
    for (let i = 0; i < 10; i++) {
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(.22 + (i % 3) * .08, 0), mat(i % 2 ? 0x25282d : 0x111216, 1));
      const side = i % 2 ? -1 : 1; rock.position.set(side * (halfX - .55), .2, -halfZ + 1 + (i * 1.37) % (halfZ * 1.7)); rock.rotation.set(i, i * .7, 0); rock.castShadow = true; scene.add(rock);
    }
  } else if (theme.kind === 'crystal') {
    for (let i = 0; i < 8; i++) {
      const crystal = new THREE.Mesh(new THREE.ConeGeometry(.18 + (i % 2) * .09, .8 + (i % 3) * .3, 6), mat(0x9d72ed, .25, 0x6a39c5));
      const side = i % 2 ? -1 : 1; crystal.position.set(side * (halfX - .7), crystal.geometry.parameters.height / 2, -halfZ * .65 + (i * 1.8) % (halfZ * 1.3)); crystal.castShadow = true; scene.add(crystal);
    }
  } else if (roomNumber % 2 === 0) {
    addBox('pillar', [.7, height, .7], [-Math.min(2.5, halfX - 1.2), height / 2, .7], mat(theme.wall));
  }
}

function prepareElementalModel(model) {
  model.rotation.y = Math.PI;
  model.updateMatrixWorld(true);

  let bounds = new THREE.Box3().setFromObject(model);
  const size = bounds.getSize(new THREE.Vector3());
  model.scale.setScalar(2.15 / Math.max(size.y, .001));
  model.updateMatrixWorld(true);

  bounds = new THREE.Box3().setFromObject(model);
  const center = bounds.getCenter(new THREE.Vector3());
  model.position.x -= center.x;
  model.position.y -= bounds.min.y;
  model.position.z -= center.z;
  model.traverse((part) => {
    if (!part.isMesh) return;
    part.castShadow = true;
    part.receiveShadow = true;
    part.frustumCulled = true;
  });
  return model;
}

function makeAnimationInPlace(sourceClip) {
  const clip = sourceClip.clone();
  const hipsPosition = clip.tracks.find((track) => track.name.toLowerCase().includes('hips') && track.name.endsWith('.position'));
  if (hipsPosition) {
    const startX = hipsPosition.values[0];
    const startZ = hipsPosition.values[2];
    for (let i = 0; i < hipsPosition.values.length; i += 3) {
      hipsPosition.values[i] = startX;
      hipsPosition.values[i + 2] = startZ;
    }
  }
  return clip;
}

function attachElementalModel(target) {
  if (!elementalTemplate || !target) return;
  const model = SkeletonUtils.clone(elementalTemplate);
  model.name = 'Elemental3D';
  target.add(model);
  characterMixer = null;
  walkingAction = null;
  slowWalkingAction = null;
  idleAction = null;
  jumpingAction = null;
  runningAction = null;
  walkBlend = 0;
  slowWalkBlend = 0;
  runBlend = 0;
  idleBlend = 1;
  jumpBlend = 0;
  if (elementalAnimations[0]) {
    characterMixer = new THREE.AnimationMixer(model);
    walkingAction = characterMixer.clipAction(elementalAnimations[0]);
    walkingAction.enabled = true;
    walkingAction.setEffectiveWeight(0);
    walkingAction.play();
    if (elementalAnimations[1]) {
      slowWalkingAction = characterMixer.clipAction(elementalAnimations[1]);
      slowWalkingAction.enabled = true;
      slowWalkingAction.setEffectiveWeight(0);
      slowWalkingAction.play();
    }
    if (elementalAnimations[2]) {
      idleAction = characterMixer.clipAction(elementalAnimations[2]);
      idleAction.enabled = true;
      idleAction.setEffectiveWeight(1);
      idleAction.play();
    }
    if (elementalAnimations[3]) {
      jumpingAction = characterMixer.clipAction(elementalAnimations[3]);
      jumpingAction.enabled = true;
      jumpingAction.clampWhenFinished = false;
      jumpingAction.setLoop(THREE.LoopOnce, 1);
      jumpingAction.setEffectiveWeight(0);
      jumpDuration = JUMP_ASCEND_DURATION + JUMP_DESCEND_DURATION;
      jumpingAction.setEffectiveTimeScale(elementalAnimations[3].duration / jumpDuration);
    }
    if (elementalAnimations[4]) {
      runningAction = characterMixer.clipAction(elementalAnimations[4]);
      runningAction.enabled = true;
      runningAction.setEffectiveWeight(0);
      runningAction.play();
    }
  }
}

function loadStaticElementalFallback() {
  new GLTFLoader().load(
    '/assets/elemental-character.glb',
    (gltf) => {
      elementalAnimations = (gltf.animations ?? []).map(makeAnimationInPlace);
      elementalTemplate = prepareElementalModel(gltf.scene);
      elementalLoading = false;
      attachElementalModel(characterGroup);
    },
    undefined,
    (error) => {
      console.error('Nao foi possivel carregar a personagem reserva.', error);
      elementalLoading = false;
      elementalLoadFailed = true;
      if (characterGroup) scene.remove(characterGroup);
      createProceduralElemental();
    }
  );
}

function createElemental() {
  characterGroup = new THREE.Group();
  characterGroup.name = 'ElementalPlayer';
  characterGroup.position.copy(player.position);
  characterGroup.position.y = CHARACTER_GROUND_Y;
  scene.add(characterGroup);

  // O modelo recebido não possui esqueleto. Estes controles preservam o
  // balanço suave do movimento enquanto o corpo inteiro acompanha os passos.
  leftArm = new THREE.Group(); rightArm = new THREE.Group();
  leftLeg = new THREE.Group(); rightLeg = new THREE.Group();
  characterGroup.add(leftArm, rightArm, leftLeg, rightLeg);

  if (elementalTemplate) {
    attachElementalModel(characterGroup);
    return;
  }
  if (elementalLoading || elementalLoadFailed) return;

  elementalLoading = true;
  if (selectedCharacter === 'terra') {
    new FBXLoader().load(
      '/assets/terra/terra-walking.fbx',
      (fbx) => {
        const loadFbxClip = (url) => new Promise((resolve) => {
          new FBXLoader().load(url, res => resolve(res.animations?.[0] || null), undefined, () => resolve(null));
        });
        Promise.all([
          loadFbxClip('/assets/terra/terra-idle.fbx'),
          loadFbxClip('/assets/terra/terra-jumping.fbx'),
          loadFbxClip('/assets/terra/terra-fast-run.fbx')
        ]).then(([idleClip, jumpClip, runClip]) => {
          const normalClip = (fbx.animations ?? [])[0] ?? null;
          elementalAnimations = [normalClip, normalClip, idleClip, jumpClip, runClip].map((clip) => clip ? makeAnimationInPlace(clip) : null);
          elementalTemplate = prepareElementalModel(fbx);
          elementalLoading = false;
          attachElementalModel(characterGroup);
        });
      },
      undefined,
      (error) => {
        console.error('Erro ao carregar Menina de Terra.', error);
        loadStaticElementalFallback();
      }
    );
    return;
  }

  new FBXLoader().load(
    '/assets/elemental-walking.fbx',
    (fbx) => {
      const finishLoading = (slowAnimations = [], idleAnimations = [], jumpAnimations = [], runAnimations = []) => {
        const normalClip = (fbx.animations ?? [])[0] ?? null;
        const slowClip = slowAnimations[0] ?? null;
        const idleClip = idleAnimations[0] ?? null;
        const jumpClip = jumpAnimations[0] ?? null;
        const runClip = runAnimations[0] ?? null;
        elementalAnimations = [normalClip, slowClip, idleClip, jumpClip, runClip].map((clip) => clip ? makeAnimationInPlace(clip) : null);
        elementalTemplate = prepareElementalModel(fbx);
        elementalLoading = false;
        attachElementalModel(characterGroup);
      };
      const loadClip = (url, label) => fetch(url)
        .then((response) => {
          if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
          return response.json();
        })
        .then((data) => THREE.AnimationClip.parse(data))
        .catch((error) => {
          console.warn(`${label} indisponivel.`, error);
          return null;
        });
      Promise.all([
        loadClip('/assets/elemental-slow-walking.json', 'Caminhada lenta'),
        loadClip('/assets/elemental-idle.json', 'Animacao parada'),
        loadClip('/assets/elemental-jumping.json', 'Animacao de pulo'),
        loadClip('/assets/elemental-fast-run.json', 'Animacao de corrida')
      ]).then(([slowClip, idleClip, jumpClip, runClip]) => finishLoading(
        slowClip ? [slowClip] : [],
        idleClip ? [idleClip] : [],
        jumpClip ? [jumpClip] : [],
        runClip ? [runClip] : []
      ));
    },
    undefined,
    (error) => {
      console.error('Não foi possível carregar a personagem 3D.', error);
      loadStaticElementalFallback();
    }
  );
}

function createProceduralElemental() {
  characterGroup = new THREE.Group();
  characterGroup.position.copy(player.position);
  characterGroup.position.y = CHARACTER_GROUND_Y;

  const skin = mat(0xd9955f, .68);
  const orange = mat(0xe94f0b, .62);
  const orangeLight = mat(0xff741a, .58);
  const olive = mat(0x667044, .82);
  const oliveDark = mat(0x28351f, .9);
  const leather = mat(0x43291d, .76);
  const leatherLight = mat(0x70462c, .7);
  const red = mat(0x9f211d, .76);
  const eyeGreen = mat(0x2a8d43, .35, 0x0d3517);
  const black = mat(0x171313, .55);
  const glass = mat(0x25d6c8, .18, 0x0e8d8a);
  glass.side = THREE.DoubleSide;
  const brass = mat(0x8a5a24, .4);
  const rope = mat(0x7f5c31, 1);

  const part = (geometry, material, position, parent = characterGroup) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(...position); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
  };
  const block = (size, material, position, parent = characterGroup) => part(new THREE.BoxGeometry(...size), material, position, parent);

  // Proporções blocadas de brinquedo, como na referência enviada.
  block([.72, .7, .38], olive, [0, 1.08, 0]);
  block([.74, .14, .42], leather, [0, .79, 0]);
  block([.66, .25, .38], oliveDark, [0, .68, 0]);
  block([.15, .62, .045], leatherLight, [-.23, 1.12, -.225]);
  block([.15, .62, .045], leatherLight, [.23, 1.12, -.225]);
  block([.28, .24, .14], leather, [.48, .8, -.03]);
  block([.23, .2, .12], leatherLight, [-.47, .83, -.05]);
  block([.15, .15, .06], brass, [0, .79, -.25]);
  block([.07, .07, .075], black, [0, .79, -.29]);
  for (const y of [.97, 1.13, 1.29]) part(new THREE.SphereGeometry(.027, 7, 5), brass, [0, y, -.22]);

  // Cabeça quadrada, cabelo curto laranja, olhos verdes e sardas.
  block([.64, .62, .58], skin, [0, 1.73, -.02]);
  part(new THREE.SphereGeometry(.39, 10, 8), orange, [0, 1.9, .04]);
  block([.18, .48, .46], orange, [-.34, 1.74, .02]);
  block([.18, .48, .46], orange, [.34, 1.74, .02]);
  block([.55, .2, .2], orange, [0, 1.98, .16]);
  const hairTips = [[-.36,1.55,-.02,-.25],[.36,1.55,-.02,.25],[-.23,1.96,-.3,-.3],[.04,2.0,-.32,.15],[.26,1.94,-.3,.35]];
  hairTips.forEach(([x,y,z,r]) => { const strand = part(new THREE.ConeGeometry(.09, .34, 6), orangeLight, [x,y,z]); strand.rotation.z = r; });
  block([.08, .13, .035], black, [-.14, 1.77, -.32]);
  block([.08, .13, .035], black, [.14, 1.77, -.32]);
  block([.045, .09, .018], eyeGreen, [-.14, 1.77, -.345]);
  block([.045, .09, .018], eyeGreen, [.14, 1.77, -.345]);
  const smile = part(new THREE.TorusGeometry(.09, .016, 5, 12, Math.PI), black, [0, 1.61, -.32]);
  smile.rotation.z = Math.PI;
  for (const x of [-.2,-.15,.15,.2]) part(new THREE.SphereGeometry(.012, 6, 4), leatherLight, [x, 1.64 + Math.abs(x)*.08, -.325]);

  // Lenço vermelho e óculos de aviadora com lentes turquesa.
  block([.42, .13, .08], red, [0, 1.4, -.23]);
  const scarfTip = part(new THREE.ConeGeometry(.2, .34, 4), red, [0, 1.3, -.05]); scarfTip.rotation.y = Math.PI / 4;
  block([.66, .07, .08], leather, [0, 2.04, -.02]);
  for (const x of [-.17, .17]) {
    part(new THREE.TorusGeometry(.145, .045, 7, 16), brass, [x, 2.08, -.24]);
    part(new THREE.CircleGeometry(.105, 16), glass, [x, 2.08, -.285]);
  }
  block([.1, .05, .06], leather, [0, 2.08, -.25]);

  leftArm = new THREE.Group(); rightArm = new THREE.Group();
  leftArm.position.set(-.47, 1.31, 0); rightArm.position.set(.47, 1.31, 0);
  block([.26, .25, .34], olive, [0, -.1, 0], leftArm); block([.26, .25, .34], olive, [0, -.1, 0], rightArm);
  block([.24, .42, .3], skin, [0, -.42, 0], leftArm); block([.24, .42, .3], skin, [0, -.42, 0], rightArm);
  block([.26, .12, .32], leather, [0, -.32, 0], leftArm); block([.28, .13, .34], leather, [0, -.33, 0], rightArm);
  block([.23, .22, .31], skin, [0, -.68, -.02], leftArm); block([.23, .22, .31], skin, [0, -.68, -.02], rightArm);
  block([.2, .18, .07], leather, [0, -.33, -.2], rightArm);
  block([.14, .12, .035], glass, [0, -.33, -.245], rightArm);
  characterGroup.add(leftArm, rightArm);

  leftLeg = new THREE.Group(); rightLeg = new THREE.Group();
  leftLeg.position.set(-.2, .65, 0); rightLeg.position.set(.2, .65, 0);
  block([.28, .28, .34], skin, [0, -.16, 0], leftLeg); block([.28, .28, .34], skin, [0, -.16, 0], rightLeg);
  block([.32, .48, .39], leather, [0, -.48, 0], leftLeg); block([.32, .48, .39], leather, [0, -.48, 0], rightLeg);
  block([.34, .17, .53], leatherLight, [0, -.67, -.08], leftLeg); block([.34, .17, .53], leatherLight, [0, -.67, -.08], rightLeg);
  for (const leg of [leftLeg, rightLeg]) for (const y of [-.37,-.47,-.57]) block([.2, .025, .025], brass, [0,y,-.21], leg);
  characterGroup.add(leftLeg, rightLeg);

  // Mochila, corda enrolada, bolsa e pequeno frasco de exploradora.
  block([.58, .64, .25], leather, [0, 1.13, .31]);
  block([.38, .16, .07], leatherLight, [0, 1.25, .46]);
  for (const radius of [.16,.2,.24]) part(new THREE.TorusGeometry(radius, .025, 6, 18), rope, [-.48, .82, -.25]);
  const bottle = part(new THREE.CylinderGeometry(.055, .065, .2, 8), brass, [.25, .65, -.27]); bottle.rotation.z = .08;
  block([.09, .05, .07], black, [.25, .77, -.27]);
  scene.add(characterGroup);
}

function addLights() {
  const theme = roomSpec.theme;
  const mineRoom = roomSpec.shape === 'mine';
  if (mineRoom) {
    scene.add(new THREE.HemisphereLight(0xffd6a0, 0x11131a, .76));
    const iron = new THREE.MeshStandardMaterial({ color: 0x2c211b, roughness: .62, metalness: .72 });
    const wood = new THREE.MeshStandardMaterial({ color: 0x4a2515, roughness: .82 });
    const fire = new THREE.MeshStandardMaterial({ color: 0xffb13b, emissive: 0xff4d00, emissiveIntensity: 4.2, roughness: .28 });
    const addTorch = (x, z, inward, lit) => {
      const torch = new THREE.Group();
      torch.position.set(x, 2.05, z);
      const bracket = new THREE.Mesh(new THREE.CylinderGeometry(.055, .055, .55, 8), iron);
      bracket.rotation.x = Math.PI / 2;
      bracket.position.z = inward * .18;
      torch.add(bracket);
      const handle = new THREE.Mesh(new THREE.CylinderGeometry(.065, .085, .62, 8), wood);
      handle.rotation.z = -.22 * inward;
      handle.position.set(.05 * inward, .13, inward * .48);
      torch.add(handle);
      const flame = new THREE.Mesh(new THREE.ConeGeometry(.17, .46, 10), fire);
      flame.position.set(.1 * inward, .57, inward * .59);
      flame.rotation.z = -.08 * inward;
      torch.add(flame);
      const glow = new THREE.Mesh(new THREE.SphereGeometry(.13, 10, 7), fire);
      glow.scale.y = 1.35;
      glow.position.copy(flame.position);
      glow.position.y -= .12;
      torch.add(glow);
      torch.traverse(part => { if (part.isMesh) part.castShadow = true; });
      scene.add(torch);
      if (lit) {
        const light = new THREE.PointLight(0xff7a2d, 8.5, 9.5, 2);
        light.position.set(x, 2.62, z + inward * .72);
        light.castShadow = x === 0;
        scene.add(light);
      }
    };
    [-8, 0, 8].forEach((x, index) => {
      addTorch(x, -7.45, 1, index !== 1);
      addTorch(x, 7.45, -1, index === 1);
      const fill = new THREE.PointLight(index === 1 ? 0xffc46b : 0xff9a46, 7, 10, 2);
      fill.position.set(x, 3.9, 0);
      scene.add(fill);
    });
    return;
  }
  scene.add(new THREE.HemisphereLight(theme.light, theme.floor, theme.kind === 'coal' ? 1.15 : 1.7));
  const key = new THREE.PointLight(theme.light, theme.kind === 'fire' ? 30 : 38, Math.max(roomSpec.halfX, roomSpec.halfZ) * 2.5, 2);
  key.position.set(0, roomSpec.height - .7, 0); key.castShadow = true; scene.add(key);
  const accent = new THREE.PointLight(theme.accent, 16, 9, 2);
  accent.position.set(-Math.min(4, roomSpec.halfX - 1), 1.8, Math.min(3, roomSpec.halfZ - 1)); scene.add(accent);
}

function createDoor(side, accentColor) {
  doorGroup = new THREE.Group();
  panelGroup = new THREE.Group();
  const wood = getWoodTexture();
  const doorMat = new THREE.MeshPhysicalMaterial({ map: wood, bumpMap: wood, bumpScale: .2, color: 0xffffff, roughness: .72, metalness: .12, clearcoat: .35, clearcoatRoughness: .2 });
  const insetMat = new THREE.MeshPhysicalMaterial({ map: wood, bumpMap: wood, bumpScale: .16, color: 0xb56b3e, roughness: .78, metalness: .08, clearcoat: .24 });
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x181321, roughness: .35, metalness: .7 });
  // Fecha o recorte escuro acima da porta com a mesma rocha texturizada da mina.
  // O painel acompanha a rotação da porta, inclusive nas paredes laterais.
  const lintelRock = getInitialRockTexture();
  const lintelMat = new THREE.MeshStandardMaterial({
    map: lintelRock,
    bumpMap: lintelRock,
    bumpScale: .42,
    color: 0xc18a62,
    roughness: .96,
    metalness: 0,
    emissive: 0x160804,
    emissiveIntensity: .32
  });
  const metalMat = new THREE.MeshStandardMaterial({ color: 0xd99835, roughness: .22, metalness: .9, emissive: 0x5d2d08, emissiveIntensity: .25 });
  const panelMat = new THREE.MeshStandardMaterial({ color: accentColor, roughness: .2, metalness: .12, emissive: accentColor, emissiveIntensity: 1.1, side: THREE.DoubleSide });
  const isNorth = side === 0;
  const scale = roomSpec.doorScale;
  const boundaryX = roomSpec.halfX - .18, boundaryZ = roomSpec.halfZ - .18;
  const maxOffset = Math.max(.4, (isNorth ? roomSpec.halfX : roomSpec.halfZ) - 2.5 * scale);
  const offset = roomNumber === 1 ? 0 : Math.sin(roomNumber * 1.91 + side * 2.2 + attempts) * maxOffset * .7;
  const doorPosition = isNorth ? [offset, 1.35 * scale, -boundaryZ] : [side === 1 ? boundaryX : -boundaryX, 1.35 * scale, offset];
  doorGroup.position.set(...doorPosition);
  doorGroup.rotation.y = isNorth ? 0 : side === 1 ? -Math.PI / 2 : Math.PI / 2;
  doorGroup.scale.setScalar(scale);

  doorPivot = new THREE.Group();
  doorPivot.position.set(-.93, 0, 0); doorGroup.add(doorPivot);
  const leaf = new THREE.Group(); leaf.position.x = .93; doorPivot.add(leaf);
  addBox('doorLeaf', [1.86, 2.62, .18], [0, 0, 0], doorMat, leaf);
  addBox('doorInsetTop', [1.38, .78, .07], [0, .63, -.12], insetMat, leaf);
  addBox('doorInsetBottom', [1.38, .82, .07], [0, -.66, -.12], insetMat, leaf);
  for (const x of [-.72, .72]) for (const y of [-1.05, 1.05]) {
    const stud = new THREE.Mesh(new THREE.SphereGeometry(.055, 8, 6), metalMat); stud.position.set(x, y, -.14); leaf.add(stud);
  }
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(.065, .065, .32, 10), metalMat);
  handle.rotation.x = Math.PI / 2; handle.position.set(.58, 0, -.25); handle.castShadow = true; leaf.add(handle);
  addBox('frameTop', [2.35, .22, .35], [0, 1.44, 0], frameMat, doorGroup);
  addBox('frameL', [.22, 2.95, .35], [-1.07, 0, 0], frameMat, doorGroup);
  addBox('frameR', [.22, 2.95, .35], [1.07, 0, 0], frameMat, doorGroup);
  addBox('doorAboveTexturedRock', [2.42, 1.72, .22], [0, 3.05, .04], lintelMat, doorGroup);
  const crown = new THREE.Mesh(new THREE.TorusGeometry(1.07, .09, 7, 24, Math.PI), metalMat);
  crown.position.y = 1.36; crown.rotation.z = Math.PI; doorGroup.add(crown);
  scene.add(doorGroup);

  const panelGap = 1.55 * scale;
  const panelPosition = isNorth ? [THREE.MathUtils.clamp(offset + panelGap, -roomSpec.halfX + .7, roomSpec.halfX - .7), 1.45, -boundaryZ + .12] : [side === 1 ? boundaryX - .12 : -boundaryX + .12, 1.45, THREE.MathUtils.clamp(offset + panelGap, -roomSpec.halfZ + .7, roomSpec.halfZ - .7)];
  panelGroup.position.set(...panelPosition);
  panelGroup.rotation.y = isNorth ? 0 : side === 1 ? -Math.PI / 2 : Math.PI / 2;
  addBox('panelFrame', [1.2, 1.1, .24], [0, 0, 0], frameMat, panelGroup);
  addBox('panelRim', [1.04, .92, .12], [0, 0, .15], metalMat, panelGroup);
  addBox('panelScreen', [.88, .68, .08], [0, .08, .25], panelMat, panelGroup);
  for (let x = -.26; x <= .26; x += .26) addBox('panelButton', [.13, .13, .08], [x, -.31, .31], mat(0xf7e9cf), panelGroup);
  scene.add(panelGroup);
  doorGlow = new THREE.PointLight(accentColor, 12, 4.5, 2);
  doorGlow.position.copy(panelGroup.position); scene.add(doorGlow);
}

function cleanPlayerName(value) {
  return String(value || '').trim().replace(/\s+/g, ' ').slice(0, 24);
}

function setSubjectButtonsEnabled(enabled) {
  ui.subjectList.querySelectorAll('button[data-subject]').forEach(button => { button.disabled = !enabled; });
}

function updatePlayerUI(message = '') {
  ui.hudPlayer.textContent = playerConnected ? `👤 ${playerName}` : 'Sem jogador';
  setSubjectButtonsEnabled(playerConnected);
  ui.playerMessage.className = playerConnected ? 'connected' : message ? 'error' : '';
  ui.playerMessage.textContent = message || (playerConnected ? `Jogador conectado: ${playerName}` : 'Digite seu primeiro nome ou apelido para começar.');
}

function connectPlayer() {
  const name = cleanPlayerName(ui.playerName.value);
  if (name.length < 2) {
    playerConnected = false;
    updatePlayerUI('Digite um nome ou apelido com pelo menos 2 letras.');
    ui.playerName.focus();
    return false;
  }
  playerName = name;
  playerConnected = true;
  ui.playerName.value = name;
  localStorage.setItem(PLAYER_STORAGE_KEY, name);
  updatePlayerUI();
  beep(520, .1);
  return true;
}

function restorePlayer() {
  const savedName = cleanPlayerName(localStorage.getItem(PLAYER_STORAGE_KEY));
  if (savedName.length >= 2) {
    playerName = savedName;
    playerConnected = true;
    ui.playerName.value = savedName;
  }
  updatePlayerUI();
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}

function renderUpdates() {
  ui.gameVersion.textContent = GAME_RELEASE.version;
  ui.updatesVersion.textContent = GAME_RELEASE.version;
  ui.updatesDate.textContent = GAME_RELEASE.date;
  ui.updatesBookSummary.textContent = `${GAME_RELEASE.version} · ${GAME_RELEASE.changes.length} novidades`;
  ui.updatesList.innerHTML = GAME_RELEASE.changes.map(change => `
    <div class="update-note">
      <span class="update-note-icon" aria-hidden="true">${escapeHTML(change.icon)}</span>
      <div><strong>${escapeHTML(change.title)}</strong><p>${escapeHTML(change.description)}</p></div>
    </div>
  `).join('');
}

function openUpdates() {
  modalOpen = true;
  stopMovement();
  ui.updatesModal.classList.add('open');
  ui.updatesModal.setAttribute('aria-hidden', 'false');
  requestAnimationFrame(() => ui.updatesContinue.focus());
}

function closeUpdates() {
  ui.updatesModal.classList.remove('open');
  ui.updatesModal.setAttribute('aria-hidden', 'true');
  modalOpen = ui.subjectScreen.classList.contains('open') || ui.levelModal.classList.contains('open') || ui.rankingModal.classList.contains('open');
}

function renderRanking(entries) {
  if (!entries.length) {
    ui.rankingList.innerHTML = '<p class="ranking-status">Ainda não há jogadores no ranking. Seja o primeiro!</p>';
    return;
  }
  const current = playerName.toLocaleLowerCase('pt-BR');
  ui.rankingList.innerHTML = entries.map((entry, index) => {
    const isCurrent = entry.name.toLocaleLowerCase('pt-BR') === current;
    const subjectName = SUBJECTS[entry.subject]?.name || entry.subject;
    return `<div class="ranking-row${isCurrent ? ' me' : ''}">
      <span class="ranking-position">${index + 1}</span>
      <div><div class="ranking-name">${escapeHTML(entry.name)}</div><span class="ranking-subject">${escapeHTML(subjectName)}</span></div>
      <div class="ranking-progress">Nível ${entry.level}<small>${entry.score} de 25 perguntas</small></div>
    </div>`;
  }).join('');
}

async function loadRanking() {
  const response = await fetch('/api/ranking', { cache: 'no-store' });
  if (!response.ok) throw new Error('ranking unavailable');
  const data = await response.json();
  renderRanking(data.entries || []);
}

function openRanking() {
  modalOpen = true;
  stopMovement();
  ui.rankingModal.classList.add('open');
  ui.rankingList.innerHTML = '<p class="ranking-status">Carregando ranking…</p>';
  loadRanking().catch(() => {
    ui.rankingList.innerHTML = '<p class="ranking-status">Não foi possível carregar agora. Verifique se o servidor do jogo está ligado.</p>';
  });
}

function closeRanking() {
  ui.rankingModal.classList.remove('open');
  modalOpen = ui.subjectScreen.classList.contains('open') || ui.levelModal.classList.contains('open');
}

async function saveProgress() {
  if (!playerConnected) return false;
  const score = Math.min(25, (level - 1) * 5 + roomInLevel);
  const response = await fetch('/api/ranking', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: playerName, subject: currentSubject, score })
  });
  if (!response.ok) throw new Error('progress unavailable');
  const data = await response.json();
  return Boolean(data.newLeader);
}

function openMath() {
  if (changingRoom) return;
  modalOpen = true; stopMovement();
  if (!problem) problem = getQuestion(currentSubject, level, roomInLevel - 1);
  ui.question.textContent = problem.prompt;
  ui.question.classList.toggle('compact', problem.prompt.length > 24);
  ui.operationHint.textContent = problem.hint || SUBJECTS[currentSubject].short;
  ui.answers.innerHTML = '';
  const isTyped = problem.inputMode === 'typed';
  ui.answers.classList.toggle('hidden', isTyped);
  ui.typedAnswer.classList.toggle('hidden', !isTyped);
  if (isTyped) {
    ui.answerInput.value = ''; ui.answerInput.disabled = false;
    const numericAnswer = problem.subject === 'math';
    ui.answerInput.inputMode = numericAnswer ? 'numeric' : 'text';
    ui.answerInput.placeholder = numericAnswer ? 'Digite o número' : 'Digite a resposta';
    setTimeout(() => ui.answerInput.focus(), 280);
  } else {
    problem.choices.forEach(value => {
      const button = document.createElement('button');
      button.className = 'answer-button'; button.textContent = value;
      if (wrongChoices.has(String(value))) { button.classList.add('wrong'); button.disabled = true; }
      button.addEventListener('click', () => checkAnswer(value, button));
      ui.answers.appendChild(button);
    });
  }
  updateHearts();
  ui.feedback.textContent = attempts ? 'A pergunta continua a mesma. Tente novamente.' : isTyped ? 'Digite e confirme sua resposta.' : 'Escolha uma resposta.';
  showGuideMessage('Pense com calma. Você consegue!', 3000, 'lia-face thinking');
  ui.math.classList.add('open');
}

function checkAnswer(value, button) {
  if (changingRoom || (button && button.disabled) || String(value).trim() === '') return;
  const correct = normalizeAnswer(value) === normalizeAnswer(problem.answer);
  if (correct) {
    pendingProgress = saveProgress().then(isNewLeader => {
      newRecordThisLevel = newRecordThisLevel || isNewLeader;
      return isNewLeader;
    }).catch(() => false);
    if (button) button.classList.add('correct');
    [...ui.answers.children].forEach(b => b.disabled = true);
    ui.answerInput.disabled = true;
    ui.feedback.textContent = 'Isso! A porta foi destrancada!';
    showGuideMessage('Resposta certa! Vamos para a próxima sala!', 2500, 'lia-face happy');
    beep(660, .12); setTimeout(() => beep(880, .18), 130);
    setTimeout(unlockDoor, 650);
  } else {
    attempts++; wrongChoices.add(String(value));
    if (button) { button.classList.add('wrong'); button.disabled = true; }
    else { ui.answerInput.classList.add('wrong'); setTimeout(() => ui.answerInput.classList.remove('wrong'), 350); ui.answerInput.select(); }
    updateHearts(); beep(180, .18);
    if (attempts >= 3) {
      ui.feedback.textContent = `A resposta era ${problem.answer}. Uma nova porta vai aparecer!`;
      [...ui.answers.children].forEach(b => b.disabled = true);
      ui.answerInput.disabled = true;
      setTimeout(replaceDoor, 1300);
    } else {
      ui.feedback.textContent = attempts === 1 ? 'Quase! Tente outra vez.' : 'Mais uma tentativa. Você consegue!';
    }
  }
}

function updateHearts() {
  ui.hearts.innerHTML = [0,1,2].map(i => `<span style="opacity:${i < 3 - attempts ? 1 : .18}">♥</span>`).join(' ');
}

function replaceDoor() {
  closeMath();
  changingRoom = true; stopMovement();
  problem = null; attempts = 0; wrongChoices.clear();
  const oldScale = roomSpec.doorScale;
  const start = performance.now();
  function shrink(now) {
    const t = Math.min(1, (now - start) / 420);
    doorGroup.scale.setScalar(oldScale * (1 - t)); panelGroup.scale.setScalar(1 - t);
    if (t < 1) requestAnimationFrame(shrink);
    else {
      scene.remove(doorGroup, panelGroup, doorGlow);
      doorSide = (doorSide + 1 + Math.floor(Math.random() * 2)) % 3;
      roomSpec.doorScale = .82 + Math.random() * .38;
      const targetScale = roomSpec.doorScale;
      createDoor(doorSide, roomSpec.theme.accent);
      doorGroup.scale.setScalar(0); panelGroup.scale.setScalar(0);
      const born = performance.now();
      function grow(time) {
        const q = Math.min(1, (time - born) / 450); const s = 1 - Math.pow(1 - q, 3);
        doorGroup.scale.setScalar(s * targetScale); panelGroup.scale.setScalar(s);
        if (q < 1) requestAnimationFrame(grow); else changingRoom = false;
      }
      requestAnimationFrame(grow);
      showGuideMessage('A porta mudou de lugar. Procure o novo painel!', 4200);
    }
  }
  requestAnimationFrame(shrink);
}

function unlockDoor() {
  ui.math.classList.remove('open'); modalOpen = false; changingRoom = true; stopMovement();
  const start = performance.now();
  function swing(now) {
    const t = Math.min(1, (now - start) / 820);
    const eased = 1 - Math.pow(1 - t, 3);
    doorPivot.rotation.y = -Math.PI * .52 * eased;
    if (t < 1) requestAnimationFrame(swing); else setTimeout(enterDoor, 180);
  }
  requestAnimationFrame(swing);
}

function enterDoor() {
  scriptedWalk = true;
  const startPosition = player.position.clone();
  const outward = doorSide === 0 ? new THREE.Vector3(0, 0, -1) : doorSide === 1 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(-1, 0, 0);
  const endPosition = new THREE.Vector3(doorGroup.position.x, 0, doorGroup.position.z).addScaledVector(outward, 1.15);
  const facing = Math.atan2(-outward.x, -outward.z);
  const start = performance.now();
  function walkThrough(now) {
    const t = Math.min(1, (now - start) / 1150);
    const eased = t * t * (3 - 2 * t);
    player.position.lerpVectors(startPosition, endPosition, eased);
    characterGroup.position.copy(player.position);
    characterGroup.position.y = CHARACTER_GROUND_Y;
    const angleDelta = Math.atan2(Math.sin(facing - characterGroup.rotation.y), Math.cos(facing - characterGroup.rotation.y));
    characterGroup.rotation.y += angleDelta * .14;
    walkTime += .13;
    leftArm.rotation.x = Math.sin(walkTime) * .52; rightArm.rotation.x = -Math.sin(walkTime) * .52;
    leftLeg.rotation.x = -Math.sin(walkTime) * .42; rightLeg.rotation.x = Math.sin(walkTime) * .42;
    updateCamera();
    if (t < 1) requestAnimationFrame(walkThrough);
    else {
      scriptedWalk = false;
      ui.transition.classList.add('open');
      setTimeout(async () => { await nextRoom(); setTimeout(() => ui.transition.classList.remove('open'), 260); }, 480);
    }
  }
  requestAnimationFrame(walkThrough);
}

async function nextRoom() {
  await pendingProgress;
  roomNumber++; roomInLevel++;
  if (roomInLevel > 5) {
    if (level >= 5) {
      roomInLevel = 5; subjectFinished = true;
      ui.completionEyebrow.textContent = 'MATÉRIA CONCLUÍDA';
      ui.completionTitle.textContent = newRecordThisLevel ? 'Novo recorde!' : 'Incrível!';
      ui.completionText.textContent = newRecordThisLevel
        ? `Parabéns, ${playerName}! Você atingiu o nível mais alto até agora.`
        : `Você completou os 5 níveis de ${SUBJECTS[currentSubject].name}.`;
      ui.newLevel.textContent = '25 perguntas vencidas!';
      ui.continueButton.textContent = 'Escolher outra matéria →';
    } else {
      level++; roomInLevel = 1; subjectFinished = false;
      ui.completionEyebrow.textContent = 'NÍVEL CONCLUÍDO';
      ui.completionTitle.textContent = newRecordThisLevel ? 'Novo recorde!' : 'Muito bem!';
      ui.completionText.textContent = newRecordThisLevel
        ? `Parabéns, ${playerName}! Você atingiu o nível mais alto até agora.`
        : 'Você respondeu 5 perguntas e chegou ao';
      ui.newLevel.textContent = `Nível ${level}`;
      ui.continueButton.textContent = 'Continuar explorando →';
    }
    ui.levelModal.classList.add('open'); modalOpen = true;
    newRecordThisLevel = false;
  } else buildNextRoom();
  updateHUD();
}

function buildNextRoom() {
  doorSide = roomNumber === 1 ? 1 : Math.floor(Math.random() * 3);
  scriptedWalk = false;
  if (roomNumber === 1) {
    // Nasce ao lado dos trilhos, nunca dentro deles.
    player.position.set(-9, 0, 2.35); yaw = Math.PI / 2; pitch = 0;
  } else {
    player.position.set(0, 0, 2.2); yaw = 0; pitch = 0;
  }
  roomSpec = createRoomSpec(roomNumber);
  problem = null; attempts = 0; wrongChoices.clear(); velocity.set(0, 0);
  buildRoom();
  if (roomNumber === 1 && characterGroup) characterGroup.rotation.y = -Math.PI / 2;
  addLights(); updateCamera();
  changingRoom = false; modalOpen = false;
  showGuideMessage(`${roomSpec.theme.name}! Encontre a porta trancada.`, 3400);
}

function updateHUD() {
  ui.level.textContent = level;
  ui.hudPlayer.textContent = `👤 ${playerName || 'Jogador'}`;
  ui.subjectLabel.textContent = SUBJECTS[currentSubject].name;
  ui.roomLabel.textContent = `Pergunta ${roomInLevel} de 5`;
  ui.dots.innerHTML = Array.from({ length: 5 }, (_, i) => `<i class="${subjectFinished || i < roomInLevel - 1 ? 'done' : i === roomInLevel - 1 ? 'current' : ''}"></i>`).join('');
}

function showGuideMessage(text, duration = 3600, faceClass = 'lia-face') {
  clearTimeout(guideHideTimer);
  clearTimeout(guideRemoveTimer);
  ui.guideText.textContent = text;
  ui.face.className = faceClass;
  ui.guide.classList.remove('hidden', 'guide-leaving');
  guideHideTimer = setTimeout(() => {
    ui.guide.classList.add('guide-leaving');
    guideRemoveTimer = setTimeout(() => ui.guide.classList.add('hidden'), 320);
  }, duration);
}

function hideGuideMessage() {
  clearTimeout(guideHideTimer);
  clearTimeout(guideRemoveTimer);
  ui.guide.classList.remove('guide-leaving');
  ui.guide.classList.add('hidden');
}

function startSubject(subject) {
  if (!playerConnected) {
    updatePlayerUI('Entre com seu nome antes de escolher uma matéria.');
    ui.playerName.focus();
    return;
  }
  currentSubject = subject; roomNumber = 1; level = 1; roomInLevel = 1; subjectFinished = false; subjectChosen = true;
  newRecordThisLevel = false; pendingProgress = Promise.resolve(false);
  problem = null; attempts = 0; wrongChoices.clear();
  ui.subjectScreen.classList.remove('open');
  [ui.hud, ui.guide, ui.crosshair, ui.controls].forEach(el => el.classList.remove('hidden'));
  buildNextRoom(); updateHUD();
  showGuideMessage(`${SUBJECTS[subject].name}: encontre o primeiro painel!`, 4200);
}

function showSubjectSelection() {
  subjectChosen = false; modalOpen = true; changingRoom = false; stopMovement();
  ui.levelModal.classList.remove('open'); ui.subjectScreen.classList.add('open');
  [ui.hud, ui.guide, ui.crosshair, ui.controls, ui.interact].forEach(el => el.classList.add('hidden'));
  hideGuideMessage();
}

function closeMath() {
  ui.math.classList.remove('open'); modalOpen = false; ui.face.className = 'lia-face'; stopMovement();
}

function triggerJump() {
  if (!started || !subjectChosen || modalOpen || changingRoom || jumpActive) return;
  jumpActive = true;
  jumpElapsed = 0;
  jumpOffset = 0;
  jumpVelocity = JUMP_FORWARD_SPEED_START;
  if (velocity.lengthSq() > .02) {
    jumpDirection.copy(velocity).normalize();
  } else {
    let forward = moveInput.y + ((keys.KeyW || keys.ArrowUp) ? 1 : 0) - ((keys.KeyS || keys.ArrowDown) ? 1 : 0);
    let strafe = moveInput.x + ((keys.KeyD || keys.ArrowRight) ? 1 : 0) - ((keys.KeyA || keys.ArrowLeft) ? 1 : 0);
    const inputLength = Math.hypot(forward, strafe);
    if (inputLength > .01) {
      forward /= inputLength; strafe /= inputLength;
      jumpDirection.set(
        Math.sin(yaw) * forward + Math.cos(yaw) * strafe,
        -Math.cos(yaw) * forward + Math.sin(yaw) * strafe
      ).normalize();
    } else {
      jumpDirection.set(Math.sin(yaw), -Math.cos(yaw)).normalize();
    }
  }
  velocity.set(0, 0);
  if (jumpingAction) {
    jumpingAction.reset();
    jumpingAction.enabled = true;
    jumpingAction.setLoop(THREE.LoopOnce, 1);
    jumpingAction.setEffectiveTimeScale(elementalAnimations[3].duration / jumpDuration);
    jumpingAction.play();
  }
  playJumpSound();
}

function updateJump(dt) {
  if (!jumpActive) {
    jumpOffset = 0;
    jumpVelocity = 0;
    return;
  }
  jumpElapsed += dt;
  const jumpProgress = THREE.MathUtils.clamp(jumpElapsed / jumpDuration, 0, 1);
  const impulseEase = jumpProgress * jumpProgress * (3 - 2 * jumpProgress);
  jumpVelocity = THREE.MathUtils.lerp(JUMP_FORWARD_SPEED_START, JUMP_FORWARD_SPEED_END, impulseEase);
  // Um único arco senoidal elimina a subida/queda brusca e não deixa a
  // personagem flutuando perto do chão.
  jumpOffset = JUMP_HEIGHT * Math.pow(Math.sin(Math.PI * jumpProgress), .92);
  if (jumpProgress >= 1) {
    jumpActive = false;
    jumpElapsed = 0;
    jumpOffset = 0;
    jumpVelocity = 0;
    velocity.set(0, 0);
    jumpBlend = 0;
    if (jumpingAction) {
      jumpingAction.setEffectiveWeight(0);
      jumpingAction.stop();
    }
  }
}

function updateCharacterAnimation(dt, moving, speed = 0) {
  if (!walkingAction || !characterMixer) return;
  const jumping = jumpActive;
  const runMode = moving && !scriptedWalk && runningAction && (keys.ShiftLeft || keys.ShiftRight || mobileRunMode);
  const slowMode = moving && !scriptedWalk && !runMode && slowWalkingAction && (keys.ControlLeft || keys.ControlRight || mobileSlowMode);
  const normalTarget = moving && !slowMode && !runMode && !jumping ? 1 : 0;
  const slowTarget = slowMode && !jumping ? 1 : 0;
  const runTarget = runMode && !jumping ? 1 : 0;
  const idleTarget = !moving && !jumping ? 1 : 0;
  const jumpTarget = jumping && jumpingAction ? 1 : 0;
  const blendSpeed = 1 - Math.exp(-10 * dt);
  walkBlend += (normalTarget - walkBlend) * blendSpeed;
  slowWalkBlend += (slowTarget - slowWalkBlend) * blendSpeed;
  runBlend += (runTarget - runBlend) * blendSpeed;
  idleBlend += (idleTarget - idleBlend) * blendSpeed;
  jumpBlend += (jumpTarget - jumpBlend) * blendSpeed;
  walkingAction.setEffectiveWeight(walkBlend);
  walkingAction.setEffectiveTimeScale(moving ? THREE.MathUtils.clamp(speed / 2.3, .65, 1.35) : .8);
  if (slowWalkingAction) {
    slowWalkingAction.setEffectiveWeight(slowWalkBlend);
    slowWalkingAction.setEffectiveTimeScale(moving ? THREE.MathUtils.clamp(speed / 1.45, .75, 1.2) : .8);
  }
  if (runningAction) {
    runningAction.setEffectiveWeight(runBlend);
    runningAction.setEffectiveTimeScale(moving ? THREE.MathUtils.clamp(speed / 5.15, .82, 1.22) : 1);
  }
  if (idleAction) {
    idleAction.setEffectiveWeight(idleBlend);
    idleAction.setEffectiveTimeScale(1);
  }
  if (jumpingAction) jumpingAction.setEffectiveWeight(jumpBlend);
  characterMixer.update(dt);
}

function updateMovement(dt) {
  // O servidor precisa saber que o jogador está presente mesmo na tela de
  // matérias, durante uma transição ou enquanto um modal está aberto.
  updateMultiplayer(player, playerName, roomNumber, characterGroup?.rotation?.y || 0, performance.now(), dt, selectedCharacter);
  updateJump(dt);
  if (!started || modalOpen || changingRoom) {
    velocity.multiplyScalar(Math.exp(-10 * dt));
    updateCharacterAnimation(dt, scriptedWalk, scriptedWalk ? 2.2 : 0);
    relaxWalk(dt); updateCamera(); return;
  }
  if (joystickPointerId !== null && !ui.joystick.hasPointerCapture(joystickPointerId)) {
    joystickPointerId = null;
    moveInput.x = 0;
    moveInput.y = 0;
    velocity.set(0, 0);
    ui.knob.style.transform = 'translate(-50%,-50%)';
  }
  let forward = moveInput.y + ((keys.KeyW || keys.ArrowUp) ? 1 : 0) - ((keys.KeyS || keys.ArrowDown) ? 1 : 0);
  let strafe = moveInput.x + ((keys.KeyD || keys.ArrowRight) ? 1 : 0) - ((keys.KeyA || keys.ArrowLeft) ? 1 : 0);
  if (jumpActive) {
    forward = 0;
    strafe = 0;
  }
  const length = Math.hypot(forward, strafe); if (length > 1) { forward /= length; strafe /= length; }
  const runMode = keys.ShiftLeft || keys.ShiftRight || mobileRunMode;
  const slowMode = !runMode && (keys.ControlLeft || keys.ControlRight || mobileSlowMode);
  const speed = runMode ? 5.15 : slowMode ? 1.45 : 3.05;
  if (jumpActive) {
    velocity.copy(jumpDirection).multiplyScalar(jumpVelocity);
  } else {
    const targetX = (Math.sin(yaw) * forward + Math.cos(yaw) * strafe) * speed;
    const targetZ = (-Math.cos(yaw) * forward + Math.sin(yaw) * strafe) * speed;
    const responsiveness = length > .02 ? 9 : 6;
    const smooth = 1 - Math.exp(-responsiveness * dt);
    velocity.x += (targetX - velocity.x) * smooth;
    velocity.y += (targetZ - velocity.y) * smooth;
    if (length <= .02 && velocity.lengthSq() < .012) velocity.set(0, 0);
  }
  const dx = velocity.x * dt, dz = velocity.y * dt;
  const next = new THREE.Vector2(player.position.x + dx, player.position.z + dz);
  if (roomSpec.shape === 'round') {
    const maxRadius = roomSpec.halfX - .65;
    if (next.length() > maxRadius) next.setLength(maxRadius);
  } else {
    next.x = THREE.MathUtils.clamp(next.x, -roomSpec.halfX + .55, roomSpec.halfX - .55);
    next.y = THREE.MathUtils.clamp(next.y, -roomSpec.halfZ + .55, roomSpec.halfZ - .55);
  }
  next.copy(resolveInitialRoomMovement(next));
  player.position.x = next.x; player.position.z = next.y;
  player.position.y = initialRoomGroundHeight(next.x, next.y);
  characterGroup.position.copy(player.position);
  characterGroup.position.y = player.position.y + CHARACTER_GROUND_Y + jumpOffset;
  const moving = velocity.length() > .08;
  if (moving) {
    const targetAngle = Math.atan2(-velocity.x, -velocity.y);
    const angleDelta = Math.atan2(Math.sin(targetAngle - characterGroup.rotation.y), Math.cos(targetAngle - characterGroup.rotation.y));
    characterGroup.rotation.y += angleDelta * (1 - Math.exp(-11 * dt));
    walkTime += dt * (7.5 + velocity.length());
    const stride = Math.min(.52, velocity.length() * .18);
    leftArm.rotation.x = Math.sin(walkTime) * stride; rightArm.rotation.x = -Math.sin(walkTime) * stride;
    leftLeg.rotation.x = -Math.sin(walkTime) * stride * .82; rightLeg.rotation.x = Math.sin(walkTime) * stride * .82;
    if (!walkingAction) characterGroup.position.y = player.position.y + CHARACTER_GROUND_Y + Math.abs(Math.sin(walkTime * 2)) * .025;
  } else relaxWalk(dt);
  updateCharacterAnimation(dt, moving, velocity.length());
  updateMultiplayer(player, playerName, roomNumber, characterGroup.rotation.y, performance.now(), dt, selectedCharacter);
  updateCamera();
  const doorPlanar = Math.hypot(player.position.x - doorGroup.position.x, player.position.z - doorGroup.position.z);
  const panelPlanar = Math.hypot(player.position.x - panelGroup.position.x, player.position.z - panelGroup.position.z);
  doorDistance = Math.min(doorPlanar, panelPlanar);
  ui.interact.classList.toggle('hidden', doorDistance > 2.4);
}

function relaxWalk(dt) {
  const settle = Math.exp(-9 * dt);
  if (!leftArm) return;
  leftArm.rotation.x *= settle; rightArm.rotation.x *= settle;
  leftLeg.rotation.x *= settle; rightLeg.rotation.x *= settle;
  if (characterGroup) characterGroup.position.y = player.position.y + CHARACTER_GROUND_Y + jumpOffset;
}

function updateCamera() {
  const behindX = -Math.sin(yaw), behindZ = Math.cos(yaw);
  let wallLimit;
  if (roomSpec.shape === 'round') {
    const radius = roomSpec.halfX - .28;
    const projection = player.position.x * behindX + player.position.z * behindZ;
    wallLimit = -projection + Math.sqrt(Math.max(.1, projection * projection + radius * radius - player.position.x ** 2 - player.position.z ** 2));
  } else {
    const edgeX = roomSpec.halfX - .3, edgeZ = roomSpec.halfZ - .3;
    const limitX = Math.abs(behindX) < .001 ? 99 : (behindX > 0 ? edgeX - player.position.x : -edgeX - player.position.x) / behindX;
    const limitZ = Math.abs(behindZ) < .001 ? 99 : (behindZ > 0 ? edgeZ - player.position.z : -edgeZ - player.position.z) / behindZ;
    wallLimit = Math.min(limitX, limitZ);
  }
  const distance = Math.max(.85, Math.min(4.15, wallLimit));
  camera.position.set(
    player.position.x + behindX * distance,
    player.position.y + 2.65 - pitch * 1.45,
    player.position.z + behindZ * distance
  );
  camera.lookAt(player.position.x, player.position.y + 1.12, player.position.z);
}

function stopMovement() {
  Object.keys(keys).forEach(key => keys[key] = false);
  joystickPointerId = null;
  mobileSlowMode = false;
  mobileRunMode = false;
  moveInput.x = 0; moveInput.y = 0; velocity.set(0, 0);
  if (ui.knob) ui.knob.style.transform = 'translate(-50%,-50%)';
  if (ui.slowStep) ui.slowStep.classList.remove('held');
  if (ui.run) {
    ui.run.classList.remove('held');
    ui.run.setAttribute('aria-pressed', 'false');
  }
}

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), .05); updateMovement(dt);
  if (doorGlow) doorGlow.intensity = 9 + Math.sin(performance.now() * .003) * 3;
  renderer.render(scene, camera);
}

function setupControls() {
  addEventListener('keydown', e => {
    keys[e.code] = true;
    if (started && subjectChosen && (MOVEMENT_KEYS.includes(e.code) || /^Control|^Shift/.test(e.code))) e.preventDefault();
    if (e.code === 'Space' && started && subjectChosen && !modalOpen && !changingRoom) {
      e.preventDefault();
      if (!e.repeat) triggerJump();
    }
    if (debugMode && e.code === 'KeyM') openMath();
    if (debugMode && e.code === 'KeyN' && !changingRoom) { roomNumber++; roomInLevel = roomInLevel % 5 + 1; buildNextRoom(); updateHUD(); }
    if (debugMode && e.code === 'KeyL' && !changingRoom) { level = Math.min(5, level + 1); roomInLevel = 1; buildNextRoom(); updateHUD(); }
    if (e.code === 'KeyE' && doorDistance < 2.4) openMath();
  });
  addEventListener('keyup', e => {
    keys[e.code] = false;
    if (MOVEMENT_KEYS.includes(e.code)) {
      if (!MOVEMENT_KEYS.some(code => keys[code]) && Math.hypot(moveInput.x, moveInput.y) < .02) velocity.set(0, 0);
    }
  });
  const resetJoystick = () => {
    joystickPointerId = null;
    moveInput.x = 0;
    moveInput.y = 0;
    velocity.set(0, 0);
    ui.knob.style.transform = 'translate(-50%,-50%)';
  };
  const updateJoy = e => {
    const r = ui.joystick.getBoundingClientRect(), x = e.clientX - (r.left + r.width/2), y = e.clientY - (r.top + r.height/2);
    const d = Math.hypot(x,y), max = 38, scale = d > max ? max/d : 1;
    const nx = x*scale, ny = y*scale; ui.knob.style.transform = `translate(calc(-50% + ${nx}px), calc(-50% + ${ny}px))`;
    moveInput.x = nx/max; moveInput.y = -ny/max;
  };
  ui.joystick.addEventListener('pointerdown', e => {
    resetJoystick();
    joystickPointerId=e.pointerId;
    ui.joystick.setPointerCapture(joystickPointerId);
    updateJoy(e);
  });
  ui.joystick.addEventListener('pointermove', e => { if(e.pointerId===joystickPointerId) updateJoy(e); });
  const endJoy = e => { if (!e || e.pointerId === joystickPointerId) resetJoystick(); };
  ui.joystick.addEventListener('pointerup', endJoy); ui.joystick.addEventListener('pointercancel', endJoy); ui.joystick.addEventListener('lostpointercapture', endJoy);
  addEventListener('pointerup', endJoy, true);
  addEventListener('pointercancel', endJoy, true);
  addEventListener('pointermove', e => {
    if (e.pointerType === 'mouse' && e.pointerId === joystickPointerId && e.buttons === 0) resetJoystick();
  }, true);
  addEventListener('touchend', event => { if (event.touches.length === 0) resetJoystick(); }, { passive: true });
  addEventListener('touchcancel', event => { if (event.touches.length === 0) resetJoystick(); }, { passive: true });
  ui.jump.addEventListener('pointerdown', event => {
    event.preventDefault(); event.stopPropagation(); triggerJump();
  });
  const startSlowSteps = event => {
    event.preventDefault(); event.stopPropagation();
    if (!started || modalOpen || changingRoom) return;
    mobileRunMode = false;
    ui.run.classList.remove('held');
    mobileSlowMode = true;
    ui.slowStep.classList.add('held');
    ui.slowStep.setPointerCapture(event.pointerId);
  };
  const endSlowSteps = event => {
    if (event) event.stopPropagation();
    mobileSlowMode = false;
    ui.slowStep.classList.remove('held');
  };
  ui.slowStep.addEventListener('pointerdown', startSlowSteps);
  ui.slowStep.addEventListener('pointerup', endSlowSteps);
  ui.slowStep.addEventListener('pointercancel', endSlowSteps);
  ui.slowStep.addEventListener('lostpointercapture', endSlowSteps);
  const toggleRunning = event => {
    event.preventDefault(); event.stopPropagation();
    if (!started || modalOpen || changingRoom) return;
    mobileRunMode = !mobileRunMode;
    mobileSlowMode = false;
    ui.slowStep.classList.remove('held');
    ui.run.classList.toggle('held', mobileRunMode);
    ui.run.setAttribute('aria-pressed', String(mobileRunMode));
  };
  ui.run.addEventListener('pointerdown', toggleRunning);
  let lookId = null, lastX=0, lastY=0;
  ui.lookZone.addEventListener('pointerdown', e => { lookId=e.pointerId; lastX=e.clientX; lastY=e.clientY; ui.lookZone.setPointerCapture(lookId); });
  ui.lookZone.addEventListener('pointermove', e => { if(e.pointerId!==lookId) return; yaw -= (e.clientX-lastX)*.006; pitch -= (e.clientY-lastY)*.004; pitch=THREE.MathUtils.clamp(pitch,-.55,.65); lastX=e.clientX; lastY=e.clientY; });
  ui.lookZone.addEventListener('pointerup', e => { if(e.pointerId===lookId) lookId=null; });
  ui.lookZone.addEventListener('pointercancel', () => lookId=null); ui.lookZone.addEventListener('lostpointercapture', () => lookId=null);
  let drag = false, mx=0, my=0;
  renderer.domElement.addEventListener('mousedown', e => { if(started){drag=true;mx=e.clientX;my=e.clientY;} });
  addEventListener('mousemove', e => { if(!drag||modalOpen)return; yaw-=(e.clientX-mx)*.005; pitch-=(e.clientY-my)*.004; pitch=THREE.MathUtils.clamp(pitch,-.55,.65);mx=e.clientX;my=e.clientY; });
  addEventListener('mouseup', () => drag=false);
  const releaseAllControls = () => {
    drag = false;
    lookId = null;
    resetJoystick();
    stopMovement();
  };
  addEventListener('blur', releaseAllControls);
  addEventListener('focus', releaseAllControls);
  addEventListener('pagehide', releaseAllControls);
  document.addEventListener('visibilitychange', () => { if (document.hidden) releaseAllControls(); });
  document.addEventListener('contextmenu', releaseAllControls);
  addEventListener('keydown', event => {
    if (event.code === 'Escape') {
      if (ui.updatesModal?.classList.contains('open')) closeUpdates();
      else if (ui.rankingModal?.classList.contains('open')) closeRanking();
      else if (ui.math?.classList.contains('open')) closeMath();
      releaseAllControls();
    }
  });
}

function getAudioContext() {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;
  if (!sharedAudioContext || sharedAudioContext.state === 'closed') sharedAudioContext = new AudioCtx();
  if (sharedAudioContext.state === 'suspended') sharedAudioContext.resume().catch(() => {});
  return sharedAudioContext;
}

function unlockAudio() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const buffer = ctx.createBuffer(1, 1, 22050);
  const source = ctx.createBufferSource();
  source.buffer = buffer; source.connect(ctx.destination); source.start(0);
}

function beep(frequency, duration) {
  if (!soundOn) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  const osc = ctx.createOscillator(), gain = ctx.createGain(); osc.frequency.value=frequency; osc.type='sine';
  gain.gain.setValueAtTime(.08,ctx.currentTime); gain.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+duration);
  osc.connect(gain).connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime+duration);
}

function playJumpSound() {
  if (!soundOn) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  const osc = ctx.createOscillator(), gain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(230, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(560, ctx.currentTime + .14);
  gain.gain.setValueAtTime(.001, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(.1, ctx.currentTime + .018);
  gain.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + .17);
  osc.connect(gain).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + .17);
}

ui.startButton.addEventListener('click', () => {
  unlockAudio();
  started = true; ui.start.classList.remove('open'); ui.subjectScreen.classList.add('open'); modalOpen = true;
  beep(440,.12); setTimeout(()=>beep(660,.18),120);
});
ui.subjectList.addEventListener('click', event => {
  const button = event.target.closest('button[data-subject]');
  if (button) startSubject(button.dataset.subject);
});

if (ui.characterList) {
  const charButtons = ui.characterList.querySelectorAll('button[data-character]');
  charButtons.forEach(btn => btn.classList.toggle('selected', btn.dataset.character === selectedCharacter));
  ui.characterList.addEventListener('click', event => {
    const button = event.target.closest('button[data-character]');
    if (!button) return;
    const choice = button.dataset.character;
    if (choice === selectedCharacter) return;
    selectedCharacter = choice;
    localStorage.setItem('elementais-character', selectedCharacter);
    charButtons.forEach(btn => btn.classList.toggle('selected', btn.dataset.character === selectedCharacter));
    if (characterGroup) {
      scene.remove(characterGroup);
      elementalTemplate = null;
      elementalLoading = false;
      elementalLoadFailed = false;
      createElemental();
    }
  });
}
ui.playerLogin.addEventListener('click', connectPlayer);
ui.playerName.addEventListener('keydown', event => { if (event.key === 'Enter') connectPlayer(); });
ui.playerName.addEventListener('input', () => {
  playerConnected = cleanPlayerName(ui.playerName.value).toLocaleLowerCase('pt-BR') === playerName.toLocaleLowerCase('pt-BR') && playerName.length >= 2;
  updatePlayerUI(playerConnected ? '' : 'Clique em Entrar para confirmar este jogador.');
});
ui.rankingButton.addEventListener('click', openRanking);
ui.subjectRankingButton.addEventListener('click', openRanking);
ui.updatesBook.addEventListener('click', openUpdates);
ui.updatesContinue.addEventListener('click', closeUpdates);
ui.updatesModal.addEventListener('click', event => { if (event.target === ui.updatesModal) closeUpdates(); });
ui.closeRanking.addEventListener('click', closeRanking);
ui.notebook.addEventListener('click', () => abrirCaderno(currentSubject));
ui.interact.addEventListener('click', openMath);
ui.closeMath.addEventListener('click', closeMath);
ui.typedAnswer.addEventListener('submit', event => { event.preventDefault(); checkAnswer(ui.answerInput.value, null); });
ui.continueButton.addEventListener('click', () => {
  if (subjectFinished) showSubjectSelection();
  else { ui.levelModal.classList.remove('open'); buildNextRoom(); }
});
ui.sound.addEventListener('click', () => { soundOn=!soundOn; ui.sound.textContent=soundOn?'♪':'×'; });
addEventListener('resize', () => { camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth,innerHeight); });
addEventListener('orientationchange', () => setTimeout(() => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
}, 120));

function createCharacter3DPreview(canvasId, fbxUrl) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 110 / 120, 0.1, 100);
  camera.position.set(0, 1.1, 3.2);
  camera.lookAt(0, 0.95, 0);

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setClearColor(0x000000, 0);
  renderer.setSize(110, 120, false);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const ambientLight = new THREE.AmbientLight(0xffffff, 1.8);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 2.2);
  dirLight.position.set(2, 4, 3);
  scene.add(dirLight);

  const backLight = new THREE.DirectionalLight(0xffffff, 0.8);
  backLight.position.set(-2, 2, -3);
  scene.add(backLight);

  const modelGroup = new THREE.Group();
  scene.add(modelGroup);

  let mixer = null;

  new FBXLoader().load(fbxUrl, (fbx) => {
    const prepared = prepareElementalModel(fbx);
    prepared.rotation.y = 0;
    modelGroup.add(prepared);

    if (fbx.animations && fbx.animations.length > 0) {
      mixer = new THREE.AnimationMixer(prepared);
      const action = mixer.clipAction(fbx.animations[0]);
      action.play();
    }
  }, undefined, (err) => console.warn('Erro ao carregar preview 3D:', err));

  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    const dt = clock.getDelta();

    if (modelGroup) {
      modelGroup.rotation.y += 0.015;
    }

    if (mixer) {
      mixer.update(dt);
    }

    renderer.render(scene, camera);
  }

  animate();
}

function initCharacter3DPreviews() {
  createCharacter3DPreview('canvas-preview-fogo', '/assets/elemental-walking.fbx');
  createCharacter3DPreview('canvas-preview-terra', '/assets/terra/terra-walking.fbx');
}

renderUpdates(); restorePlayer(); init3D(); setupControls(); updateHUD(); initCharacter3DPreviews();

async function syncServiceWorker() {
  if (!('serviceWorker' in navigator)) return;

  try {
    const savedRelease = localStorage.getItem('elementais-release-ver');
    if (savedRelease !== GAME_RELEASE.version) {
      localStorage.setItem('elementais-release-ver', GAME_RELEASE.version);
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(registration => registration.unregister()));

      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }
      if (savedRelease) {
        window.location.reload(true);
        return;
      }
    }

    const registration = await navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' });
    await registration.update();
  } catch (error) {
    console.warn('Não foi possível atualizar o cache do jogo.', error);
  }
}

addEventListener('load', syncServiceWorker);
