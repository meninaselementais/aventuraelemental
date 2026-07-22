const STORAGE_PREFIX = 'elementais-caderno-v1:';
const SUBJECT_NAMES = {
  matematica: 'Matemática', portugues: 'Português', ciencias: 'Ciências',
  historia: 'História e Geografia', ingles: 'Inglês', mix: 'Modo MIX'
};
const SUBJECT_ALIASES = {
  math: 'matematica', matemática: 'matematica', matematica: 'matematica',
  portuguese: 'portugues', português: 'portugues', portugues: 'portugues',
  science: 'ciencias', ciências: 'ciencias', ciencias: 'ciencias',
  history: 'historia', história: 'historia', historia: 'historia',
  english: 'ingles', inglês: 'ingles', ingles: 'ingles', mix: 'mix'
};

let elements = null;
let context = null;
let notebookData = null;
let currentSubject = 'matematica';
let currentTool = 'pencil';
let currentWidth = 4;
let activeStroke = null;
let activePointer = null;
let redoByPage = [];
let resizeObserver = null;
let saveTimer = null;
let drawFrame = null;
let callbacks = { onOpen: null, onClose: null };

function normalizeSubject(subject) {
  const clean = String(subject || 'matematica').trim().toLocaleLowerCase('pt-BR');
  return SUBJECT_ALIASES[clean] || 'matematica';
}

function emptyNotebook() {
  return { version: 1, currentPage: 0, pages: [{ strokes: [] }] };
}

function loadNotebook(subject) {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_PREFIX + subject));
    if (!parsed || !Array.isArray(parsed.pages) || !parsed.pages.length) return emptyNotebook();
    parsed.pages = parsed.pages.map(page => ({ strokes: Array.isArray(page.strokes) ? page.strokes : [] }));
    parsed.currentPage = Math.max(0, Math.min(Number(parsed.currentPage) || 0, parsed.pages.length - 1));
    return parsed;
  } catch {
    return emptyNotebook();
  }
}

function saveNow() {
  if (!notebookData || !elements) return;
  clearTimeout(saveTimer);
  try {
    localStorage.setItem(STORAGE_PREFIX + currentSubject, JSON.stringify(notebookData));
    elements.status.textContent = 'Salvo ✓';
  } catch {
    elements.status.textContent = 'Memória cheia';
  }
}

function scheduleSave() {
  if (!elements) return;
  elements.status.textContent = 'Salvando…';
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveNow, 280);
}

function page() {
  return notebookData.pages[notebookData.currentPage];
}

function canvasMetrics() {
  const rect = elements.canvas.getBoundingClientRect();
  return {
    width: Math.max(1, rect.width),
    height: Math.max(1, rect.height),
    pixelWidth: Math.max(1, elements.canvas.width),
    pixelHeight: Math.max(1, elements.canvas.height),
    lineScale: Math.max(1, Math.min(elements.canvas.width / Math.max(1, rect.width), elements.canvas.height / Math.max(1, rect.height)))
  };
}

function applyStrokeStyle(stroke, lineScale = 1) {
  context.lineCap = 'round';
  context.lineJoin = 'round';
  context.lineWidth = (stroke.tool === 'eraser' ? stroke.width * 3.25 : stroke.tool === 'pencil' ? stroke.width * .88 : stroke.width) * lineScale;
  context.globalAlpha = stroke.tool === 'pencil' ? .7 : 1;
  context.strokeStyle = stroke.tool === 'pen' ? '#2454af' : '#424854';
  context.globalCompositeOperation = stroke.tool === 'eraser' ? 'destination-out' : 'source-over';
}

function drawStroke(stroke) {
  if (!stroke?.points?.length) return;
  const { pixelWidth, pixelHeight, lineScale } = canvasMetrics();
  applyStrokeStyle(stroke, lineScale);
  const first = stroke.points[0];
  context.beginPath();
  context.moveTo(first.x * pixelWidth, first.y * pixelHeight);
  if (stroke.points.length === 1) {
    context.lineTo(first.x * pixelWidth + .01, first.y * pixelHeight + .01);
  } else {
    for (let index = 1; index < stroke.points.length - 1; index++) {
      const point = stroke.points[index];
      const next = stroke.points[index + 1];
      context.quadraticCurveTo(point.x * pixelWidth, point.y * pixelHeight, (point.x + next.x) * pixelWidth / 2, (point.y + next.y) * pixelHeight / 2);
    }
    const last = stroke.points.at(-1);
    context.lineTo(last.x * pixelWidth, last.y * pixelHeight);
  }
  context.stroke();
  context.globalCompositeOperation = 'source-over';
  context.globalAlpha = 1;
}

function redraw() {
  if (!elements || !context || !notebookData) return;
  cancelAnimationFrame(drawFrame);
  drawFrame = requestAnimationFrame(() => {
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, elements.canvas.width, elements.canvas.height);
    for (const stroke of page().strokes) drawStroke(stroke);
    if (activeStroke) drawStroke(activeStroke);
  });
}

function resizeCanvas() {
  if (!elements) return;
  const { width, height } = canvasMetrics();
  const android = /Android/i.test(navigator.userAgent);
  const ratio = Math.min(window.devicePixelRatio || 1, android ? 1.5 : 2);
  const pixelWidth = Math.max(1, Math.round(width * ratio));
  const pixelHeight = Math.max(1, Math.round(height * ratio));
  if (elements.canvas.width !== pixelWidth || elements.canvas.height !== pixelHeight) {
    elements.canvas.width = pixelWidth;
    elements.canvas.height = pixelHeight;
    context.setTransform(1, 0, 0, 1, 0, 0);
    redraw();
  }
}

function updatePageUI() {
  const number = notebookData.currentPage + 1;
  elements.pageLabel.textContent = `Página ${number} de ${notebookData.pages.length}`;
  elements.prev.disabled = number === 1;
  elements.next.disabled = number === notebookData.pages.length;
  elements.undo.disabled = page().strokes.length === 0;
  elements.redo.disabled = !(redoByPage[notebookData.currentPage]?.length);
}

function pointFromEvent(event) {
  const rect = elements.canvas.getBoundingClientRect();
  const directTarget = event.currentTarget === elements.canvas && Number.isFinite(event.offsetX) && Number.isFinite(event.offsetY);
  const x = directTarget ? event.offsetX / Math.max(1, elements.canvas.clientWidth) : (event.clientX - rect.left) / Math.max(1, rect.width);
  const y = directTarget ? event.offsetY / Math.max(1, elements.canvas.clientHeight) : (event.clientY - rect.top) / Math.max(1, rect.height);
  return {
    x: Math.max(0, Math.min(1, x)),
    y: Math.max(0, Math.min(1, y))
  };
}

function addPointerPoint(event) {
  if (!activeStroke) return;
  const point = pointFromEvent(event);
  const previous = activeStroke.points.at(-1);
  if (previous && Math.hypot(point.x - previous.x, point.y - previous.y) < .0012) return;
  activeStroke.points.push({ x: +point.x.toFixed(5), y: +point.y.toFixed(5) });
}

function startStroke(event) {
  if (activePointer !== null || event.button > 0) return;
  event.preventDefault();
  activePointer = event.pointerId;
  elements.canvas.setPointerCapture(activePointer);
  activeStroke = { tool: currentTool, width: currentWidth, points: [] };
  addPointerPoint(event);
  redraw();
}

function moveStroke(event) {
  if (event.pointerId !== activePointer || !activeStroke) return;
  event.preventDefault();
  const samples = typeof event.getCoalescedEvents === 'function' ? event.getCoalescedEvents() : [event];
  for (const sample of samples) addPointerPoint(sample);
  redraw();
}

function finishStroke(event) {
  if (activePointer === null || (event && event.pointerId !== activePointer)) return;
  if (activeStroke?.points.length) {
    page().strokes.push(activeStroke);
    redoByPage[notebookData.currentPage] = [];
    scheduleSave();
  }
  activeStroke = null;
  activePointer = null;
  updatePageUI();
  redraw();
}

function selectTool(tool) {
  currentTool = ['pencil', 'pen', 'eraser'].includes(tool) ? tool : 'pencil';
  elements.toolButtons.forEach(button => button.classList.toggle('selected', button.dataset.notebookTool === currentTool));
}

function changePage(index) {
  finishStroke();
  notebookData.currentPage = Math.max(0, Math.min(index, notebookData.pages.length - 1));
  updatePageUI();
  redraw();
  scheduleSave();
}

function undo() {
  const stroke = page().strokes.pop();
  if (!stroke) return;
  (redoByPage[notebookData.currentPage] ||= []).push(stroke);
  updatePageUI(); redraw(); scheduleSave();
}

function redo() {
  const stroke = redoByPage[notebookData.currentPage]?.pop();
  if (!stroke) return;
  page().strokes.push(stroke);
  updatePageUI(); redraw(); scheduleSave();
}

export function fecharCaderno() {
  if (!elements?.modal.classList.contains('open')) return;
  finishStroke();
  saveNow();
  elements.modal.classList.remove('open');
  elements.modal.setAttribute('aria-hidden', 'true');
  callbacks.onClose?.();
}

export function abrirCaderno(subject = 'matematica') {
  if (!elements) return;
  finishStroke();
  saveNow();
  currentSubject = normalizeSubject(subject);
  notebookData = loadNotebook(currentSubject);
  redoByPage = notebookData.pages.map(() => []);
  elements.title.textContent = SUBJECT_NAMES[currentSubject];
  elements.modal.classList.add('open');
  elements.modal.setAttribute('aria-hidden', 'false');
  updatePageUI();
  callbacks.onOpen?.(currentSubject);
  requestAnimationFrame(() => { resizeCanvas(); redraw(); elements.close.focus(); });
}

export function initCaderno(options = {}) {
  callbacks = { onOpen: options.onOpen || null, onClose: options.onClose || null };
  elements = {
    modal: document.querySelector('#notebook-modal'), canvas: document.querySelector('#notebook-canvas'),
    paper: document.querySelector('#notebook-paper'), title: document.querySelector('#notebook-title'),
    status: document.querySelector('#notebook-save-status'), close: document.querySelector('#notebook-close'),
    width: document.querySelector('#notebook-width'), undo: document.querySelector('#notebook-undo'),
    redo: document.querySelector('#notebook-redo'), prev: document.querySelector('#notebook-prev'),
    next: document.querySelector('#notebook-next'), addPage: document.querySelector('#notebook-new-page'),
    deletePage: document.querySelector('#notebook-delete-page'), pageLabel: document.querySelector('#notebook-page-label'),
    toolButtons: [...document.querySelectorAll('[data-notebook-tool]')]
  };
  if (!elements.modal || !elements.canvas) return;
  context = elements.canvas.getContext('2d', { alpha: true, desynchronized: true });
  elements.toolButtons.forEach(button => button.addEventListener('click', () => selectTool(button.dataset.notebookTool)));
  elements.width.addEventListener('input', () => { currentWidth = Number(elements.width.value); });
  elements.canvas.addEventListener('pointerdown', startStroke);
  elements.canvas.addEventListener('pointermove', moveStroke);
  elements.canvas.addEventListener('pointerup', finishStroke);
  elements.canvas.addEventListener('pointercancel', finishStroke);
  elements.canvas.addEventListener('lostpointercapture', finishStroke);
  elements.close.addEventListener('click', fecharCaderno);
  elements.modal.addEventListener('pointerdown', event => { if (event.target === elements.modal) fecharCaderno(); });
  elements.undo.addEventListener('click', undo);
  elements.redo.addEventListener('click', redo);
  elements.prev.addEventListener('click', () => changePage(notebookData.currentPage - 1));
  elements.next.addEventListener('click', () => changePage(notebookData.currentPage + 1));
  elements.addPage.addEventListener('click', () => {
    if (notebookData.pages.length >= 40) return;
    notebookData.pages.push({ strokes: [] });
    redoByPage.push([]);
    changePage(notebookData.pages.length - 1);
  });
  elements.deletePage.addEventListener('click', () => {
    if (!confirm('Apagar esta página do caderno?')) return;
    if (notebookData.pages.length === 1) notebookData.pages[0] = { strokes: [] };
    else notebookData.pages.splice(notebookData.currentPage, 1);
    notebookData.currentPage = Math.min(notebookData.currentPage, notebookData.pages.length - 1);
    redoByPage = notebookData.pages.map(() => []);
    updatePageUI(); redraw(); scheduleSave();
  });
  addEventListener('keydown', event => {
    if (!elements.modal.classList.contains('open')) return;
    if (event.code === 'Escape') { event.preventDefault(); fecharCaderno(); return; }
    if ((event.ctrlKey || event.metaKey) && event.code === 'KeyZ') {
      event.preventDefault(); event.shiftKey ? redo() : undo();
    } else if ((event.ctrlKey || event.metaKey) && event.code === 'KeyY') {
      event.preventDefault(); redo();
    }
  });
  resizeObserver = new ResizeObserver(resizeCanvas);
  resizeObserver.observe(elements.paper);
  addEventListener('pagehide', saveNow);
  selectTool('pencil');
}

window.abrirCaderno = abrirCaderno;
window.fecharCaderno = fecharCaderno;
