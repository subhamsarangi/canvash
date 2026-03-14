// ══════════════════════════════════
// DATA
// ══════════════════════════════════
// ── ANALYTICS ──
function track(event, data) {
  try {
    if (window.umami) window.umami.track(event, data);
  } catch (e) {}
}

const COLORS = [
  { name: "Midnight Ink", hex: "#1a1a2e" },
  { name: "Aged Ivory", hex: "#f5f0e8" },
  { name: "Venetian Red", hex: "#c0392b" },
  { name: "Gold Leaf", hex: "#d4a017" },
  { name: "Sea Glass", hex: "#7ec8b6" },
  { name: "Cobalt Dream", hex: "#2f5fc4" },
  { name: "Thistle Haze", hex: "#c8a2c8" },
  { name: "Burnt Sienna", hex: "#c46210" },
  { name: "Forest Moss", hex: "#4a7c59" },
  { name: "Dusty Rose", hex: "#dcb4a0" },
  { name: "Storm Cloud", hex: "#607080" },
  { name: "Lemon Zest", hex: "#f4d03f" },
  { name: "Ink Wash", hex: "#2c3e50" },
  { name: "Coral Reef", hex: "#e8735a" },
  { name: "Sage Whisper", hex: "#a8c5a0" },
  { name: "Violet Dusk", hex: "#6c4a8a" },
  { name: "Arctic White", hex: "#f8fafc" },
  { name: "Raw Umber", hex: "#8b6914" },
  { name: "Cerulean Mist", hex: "#89b4cc" },
  { name: "Charred Black", hex: "#2b2b2b" },
];

const BACKGROUNDS = [
  {
    id: "charcoal",
    label: "Charcoal",
    color: "#1c1c1c",
    css: "#1c1c1c",
    text: "rgba(255,255,255,0.5)",
  },
  {
    id: "beige",
    label: "Notebook",
    color: "#f5f0e8",
    css: "repeating-linear-gradient(#f5f0e8 0px,#f5f0e8 19px,rgba(180,160,120,0.35) 19px,rgba(180,160,120,0.35) 20px),repeating-linear-gradient(90deg,#f5f0e8 0px,#f5f0e8 19px,rgba(180,160,120,0.35) 19px,rgba(180,160,120,0.35) 20px)",
    text: "rgba(0,0,0,0.4)",
  },
  {
    id: "coffee",
    label: "Coffee",
    color: "#f0e6d3",
    css: "linear-gradient(135deg,#f0e6d3,#e8d9c0)",
    text: "rgba(0,0,0,0.4)",
  },
  {
    id: "blueprint",
    label: "Blueprint",
    color: "#1a3a5c",
    css: "#1a3a5c",
    text: "rgba(255,255,255,0.5)",
  },
  {
    id: "chalkboard",
    label: "Chalkboard",
    color: "#2d4a2d",
    css: "#2d4a2d",
    text: "rgba(255,255,255,0.5)",
  },
];

const BRUSHES = [
  { px: 3, label: "XS" },
  { px: 8, label: "S" },
  { px: 16, label: "M" },
  { px: 28, label: "L" },
  { px: 48, label: "XL" },
];

// ══════════════════════════════════
// STATE
// ══════════════════════════════════
let S = {
  tool: "brush",
  colorIdx: 2,
  brushIdx: 0,
  opacity: 1,
  bgId: "beige",
  bgColor: "#f5f0e8",
  projectId: null,
  projectName: "Untitled",
};

let drawing = false,
  lx = 0,
  ly = 0;
let undoStack = [],
  redoStack = [];
const UNDO_MAX = 30;
let autoSaveTimer = null;
let activePanel = null;

// ══════════════════════════════════
// CANVAS
// ══════════════════════════════════
const canvas = document.getElementById("canvasEl");
const ctx = canvas.getContext("2d");
const bgCanvas = document.getElementById("bgCanvas");
const bgCtx = bgCanvas.getContext("2d");

function resizeCanvas(keepContent) {
  const sw = window.innerWidth;
  const sh = window.innerHeight;
  // Infinite canvas: make canvas CANVAS_MULT times bigger than the viewport
  const w = sw * CANVAS_MULT;
  const h = sh * CANVAS_MULT;
  const img =
    keepContent && canvas.width > 0
      ? ctx.getImageData(0, 0, canvas.width, canvas.height)
      : null;
  canvas.width = w;
  canvas.height = h;
  canvas.style.width = w + "px";
  canvas.style.height = h + "px";
  bgCanvas.width = w;
  bgCanvas.height = h;
  bgCanvas.style.width = w + "px";
  bgCanvas.style.height = h + "px";
  fillBg();
  if (img && img.width > 0) ctx.putImageData(img, 0, 0);
  // Centre the viewport so we start in the middle of the infinite canvas
  if (!keepContent) {
    vPanX = -(w - sw) / 2;
    vPanY = -(h - sh) / 2;
    applyViewport();
  }
}

function fillBg() {
  bgCtx.save();
  bgCtx.globalAlpha = 1;
  bgCtx.globalCompositeOperation = "source-over";
  bgCtx.fillStyle = S.bgColor;
  bgCtx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);
  if (S.bgId === "beige") {
    const gridSize = 20;
    bgCtx.strokeStyle = "rgba(180,160,120,0.35)";
    bgCtx.lineWidth = 0.7;
    for (let x = 0; x <= bgCanvas.width; x += gridSize) {
      bgCtx.beginPath();
      bgCtx.moveTo(x, 0);
      bgCtx.lineTo(x, bgCanvas.height);
      bgCtx.stroke();
    }
    for (let y = 0; y <= bgCanvas.height; y += gridSize) {
      bgCtx.beginPath();
      bgCtx.moveTo(0, y);
      bgCtx.lineTo(bgCanvas.width, y);
      bgCtx.stroke();
    }
  }
  if (S.bgId === "blueprint") {
    bgCtx.strokeStyle = "rgba(100,160,230,0.13)";
    bgCtx.lineWidth = 0.6;
    for (let x = 0; x <= bgCanvas.width; x += 40) {
      bgCtx.beginPath();
      bgCtx.moveTo(x, 0);
      bgCtx.lineTo(x, bgCanvas.height);
      bgCtx.stroke();
    }
    for (let y = 0; y <= bgCanvas.height; y += 40) {
      bgCtx.beginPath();
      bgCtx.moveTo(0, y);
      bgCtx.lineTo(bgCanvas.width, y);
      bgCtx.stroke();
    }
    bgCtx.strokeStyle = "rgba(100,160,230,0.05)";
    bgCtx.lineWidth = 0.4;
    for (let x = 0; x <= bgCanvas.width; x += 8) {
      bgCtx.beginPath();
      bgCtx.moveTo(x, 0);
      bgCtx.lineTo(x, bgCanvas.height);
      bgCtx.stroke();
    }
    for (let y = 0; y <= bgCanvas.height; y += 8) {
      bgCtx.beginPath();
      bgCtx.moveTo(0, y);
      bgCtx.lineTo(bgCanvas.width, y);
      bgCtx.stroke();
    }
  }
  if (S.bgId === "chalkboard") {
    bgCtx.strokeStyle = "rgba(255,255,255,0.012)";
    bgCtx.lineWidth = 1;
    for (let y = 0; y < bgCanvas.height; y += 3) {
      bgCtx.beginPath();
      bgCtx.moveTo(0, y);
      bgCtx.lineTo(bgCanvas.width, y);
      bgCtx.stroke();
    }
  }
  bgCtx.restore();
}

function applyCtx() {
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  if (S.tool === "eraser") {
    ctx.globalCompositeOperation = "destination-out";
    ctx.globalAlpha = 1;
    ctx.lineWidth = BRUSHES[S.brushIdx].px * 2.5;
    ctx.strokeStyle = "rgba(0,0,0,1)";
    return;
  }
  ctx.globalCompositeOperation = "source-over";
  ctx.strokeStyle = COLORS[S.colorIdx].hex;
  const bpx = BRUSHES[S.brushIdx].px;
  if (S.tool === "marker") {
    ctx.lineWidth = bpx * 2.2;
    ctx.globalAlpha = S.opacity * 0.5;
  } else if (S.tool === "pen") {
    ctx.lineWidth = Math.max(1, bpx * 0.5);
    ctx.globalAlpha = S.opacity;
  } else {
    ctx.lineWidth = bpx;
    ctx.globalAlpha = S.opacity;
  }
}

// Fast draw state - kept open between move events for performance
let drawPathOpen = false;
let lmx = 0,
  lmy = 0; // last midpoint (for smooth curves)

// ══════════════════════════════════
// ZOOM / PAN STATE
// ══════════════════════════════════
const viewport = document.getElementById("viewport");
let vZoom = 1,
  vPanX = 0,
  vPanY = 0;
let pinching = false,
  pinchStartDist = 0,
  pinchStartZoom = 1;
let pinchMidX = 0,
  pinchMidY = 0,
  pinchStartPanX = 0,
  pinchStartPanY = 0;
let panningTwo = false,
  panLastX = 0,
  panLastY = 0;
let zoomHudTimer = null;
const MIN_ZOOM = 0.1,
  MAX_ZOOM = 8;
// Infinite canvas: logical canvas is much larger than the viewport
const CANVAS_MULT = 6;

function applyViewport() {
  viewport.style.transform = `translate(${vPanX}px,${vPanY}px) scale(${vZoom})`;
  document.getElementById("zoomLabel").textContent =
    Math.round(vZoom * 100) + "%";
}

function showZoomHud() {
  const hud = document.getElementById("zoomHud");
  hud.classList.add("visible");
  clearTimeout(zoomHudTimer);
  zoomHudTimer = setTimeout(() => hud.classList.remove("visible"), 2000);
}

function clampPan() {
  // Infinite canvas: just ensure at least a strip of canvas stays visible
  const W = window.innerWidth,
    H = window.innerHeight;
  const cw = canvas.width * vZoom,
    ch = canvas.height * vZoom;
  const margin = 0.15;
  vPanX = Math.min(W * (1 - margin), Math.max(-cw + W * margin, vPanX));
  vPanY = Math.min(H * (1 - margin), Math.max(-ch + H * margin, vPanY));
}

function zoomTo(newZoom, screenX, screenY) {
  newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, newZoom));
  // Keep the point under finger/center fixed
  const ratio = newZoom / vZoom;
  vPanX = screenX - ratio * (screenX - vPanX);
  vPanY = screenY - ratio * (screenY - vPanY);
  vZoom = newZoom;
  clampPan();
  applyViewport();
  showZoomHud();
}

document.getElementById("zoomIn").addEventListener("click", () => {
  zoomTo(vZoom * 1.4, window.innerWidth / 2, window.innerHeight / 2);
});
document.getElementById("zoomOut").addEventListener("click", () => {
  zoomTo(vZoom / 1.4, window.innerWidth / 2, window.innerHeight / 2);
});
document.getElementById("zoomReset").addEventListener("click", () => {
  vZoom = 1;
  vPanX = 0;
  vPanY = 0;
  applyViewport();
  showZoomHud();
});

// ══════════════════════════════════
// DRAW EVENTS
// ══════════════════════════════════

// Convert screen coords -> canvas pixel coords (accounting for zoom/pan)
function screenToCanvas(clientX, clientY) {
  const rect = viewport.getBoundingClientRect();
  // viewport rect already includes the CSS transform, so we can go directly
  return {
    x: (clientX - vPanX) / vZoom,
    y: (clientY - vPanY) / vZoom,
  };
}

function getPos(e) {
  const touch = e.touches ? e.touches[0] : e;
  return screenToCanvas(touch.clientX, touch.clientY);
}

function dist(t1, t2) {
  return Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
}
function midpoint(t1, t2) {
  return { x: (t1.clientX + t2.clientX) / 2, y: (t1.clientY + t2.clientY) / 2 };
}

let panningSingle = false,
  panSingleLastX = 0,
  panSingleLastY = 0;

function onStart(e) {
  if (e.target !== canvas && e.target !== document.getElementById("bgCanvas"))
    return;
  if (activePanel) return;
  e.preventDefault();

  // Two-finger: pinch or pan
  if (e.touches && e.touches.length === 2) {
    drawing = false;
    panningSingle = false;
    pinching = true;
    panningTwo = true;
    pinchStartDist = dist(e.touches[0], e.touches[1]);
    pinchStartZoom = vZoom;
    const mid = midpoint(e.touches[0], e.touches[1]);
    pinchMidX = mid.x;
    pinchMidY = mid.y;
    pinchStartPanX = vPanX;
    pinchStartPanY = vPanY;
    panLastX = mid.x;
    panLastY = mid.y;
    return;
  }

  const touch = e.touches ? e.touches[0] : e;

  // Pan mode: single-finger pans the canvas
  if (S.tool === "pan") {
    panningSingle = true;
    panSingleLastX = touch.clientX;
    panSingleLastY = touch.clientY;
    return;
  }

  // One finger: draw
  if (S.tool === "fill") {
    doFill(e);
    return;
  }
  if (S.tool === "eyedropper") {
    doPick(e);
    return;
  }
  const p = getPos(e);
  drawing = true;
  lx = p.x;
  ly = p.y;
  lmx = p.x;
  lmy = p.y;
  pushUndo();
  applyCtx();
  // Draw a proper circle dot at tap point
  ctx.save();
  ctx.beginPath();
  ctx.arc(p.x, p.y, Math.max(0.5, ctx.lineWidth / 2), 0, Math.PI * 2);
  if (S.tool === "eraser") {
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillStyle = "rgba(0,0,0,1)";
  } else {
    ctx.fillStyle = COLORS[S.colorIdx].hex;
    ctx.globalAlpha = S.tool === "marker" ? S.opacity * 0.5 : S.opacity;
  }
  ctx.fill();
  ctx.restore();
  // Re-apply ctx after save/restore and open the continuous stroke path
  applyCtx();
  ctx.beginPath();
  ctx.moveTo(p.x, p.y);
  drawPathOpen = true;
}

function onMove(e) {
  if (activePanel) return;
  e.preventDefault();

  // Two-finger pinch + pan
  if (e.touches && e.touches.length === 2 && pinching) {
    const d = dist(e.touches[0], e.touches[1]);
    const mid = midpoint(e.touches[0], e.touches[1]);
    const newZoom = Math.min(
      MAX_ZOOM,
      Math.max(MIN_ZOOM, pinchStartZoom * (d / pinchStartDist)),
    );
    const dPanX = mid.x - pinchMidX;
    const dPanY = mid.y - pinchMidY;
    const ratio = newZoom / pinchStartZoom;
    vPanX = pinchMidX - ratio * (pinchMidX - pinchStartPanX) + dPanX;
    vPanY = pinchMidY - ratio * (pinchMidY - pinchStartPanY) + dPanY;
    vZoom = newZoom;
    clampPan();
    applyViewport();
    showZoomHud();
    panLastX = mid.x;
    panLastY = mid.y;
    return;
  }

  // Single-finger pan mode
  if (panningSingle) {
    const touch = e.touches ? e.touches[0] : e;
    vPanX += touch.clientX - panSingleLastX;
    vPanY += touch.clientY - panSingleLastY;
    panSingleLastX = touch.clientX;
    panSingleLastY = touch.clientY;
    canvas.style.cursor = "grabbing";
    document.getElementById("bgCanvas").style.cursor = "grabbing";
    clampPan();
    applyViewport();
    showZoomHud();
    return;
  }

  // One finger draw
  if (!drawing) return;
  const p = getPos(e);
  // Smooth midpoint algorithm: draw from last-midpoint to new-midpoint
  // using last point as the quadratic control — works for ALL tools
  const mx = (lx + p.x) / 2;
  const my = (ly + p.y) / 2;
  ctx.quadraticCurveTo(lx, ly, mx, my);
  ctx.stroke();
  // Continue path from current midpoint (avoids gaps/overlaps)
  ctx.beginPath();
  ctx.moveTo(mx, my);
  lx = p.x;
  ly = p.y;
}

function onEnd(e) {
  if (e.touches && e.touches.length < 2) {
    pinching = false;
    panningTwo = false;
  }
  panningSingle = false;
  if (S.tool === "pan") {
    canvas.style.cursor = "grab";
    document.getElementById("bgCanvas").style.cursor = "grab";
  }
  if (!drawing) return;
  drawing = false;
  drawPathOpen = false;
  // Draw final segment to exact last touch point
  ctx.lineTo(lx, ly);
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
  scheduleSave();
}

// rAF-throttled move handler to maximise smoothness
let rafPending = false;
let lastMoveEvent = null;
function onMoveThrottled(e) {
  if (activePanel) return;
  e.preventDefault();
  // Two-finger and pan need low latency - bypass throttle
  if ((e.touches && e.touches.length === 2 && pinching) || panningSingle) {
    onMove(e);
    return;
  }
  lastMoveEvent = e;
  if (!rafPending) {
    rafPending = true;
    requestAnimationFrame(() => {
      rafPending = false;
      if (lastMoveEvent) {
        onMove(lastMoveEvent);
        lastMoveEvent = null;
      }
    });
  }
}

// Attach to viewport so both canvas layers receive events
viewport.addEventListener("touchstart", onStart, { passive: false });
viewport.addEventListener("touchmove", onMoveThrottled, { passive: false });
viewport.addEventListener("touchend", onEnd, { passive: false });
viewport.addEventListener("mousedown", onStart, { passive: false });
viewport.addEventListener("mousemove", onMoveThrottled, { passive: false });
viewport.addEventListener("mouseup", onEnd, { passive: false });

// ══════════════════════════════════
// FILL & PICK
// ══════════════════════════════════
function doFill(e) {
  const p = getPos(e);
  pushUndo();
  const x = Math.floor(p.x),
    y = Math.floor(p.y);
  const id = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = id.data;
  const i = (y * canvas.width + x) * 4;
  const tr = d[i],
    tg = d[i + 1],
    tb = d[i + 2],
    ta = d[i + 3];
  const fc = hexToRgb(COLORS[S.colorIdx].hex);
  if (!fc || (tr === fc.r && tg === fc.g && tb === fc.b)) return;
  const stk = [[x, y]];
  const vis = new Uint8Array(canvas.width * canvas.height);
  while (stk.length) {
    const [cx, cy] = stk.pop();
    if (cx < 0 || cy < 0 || cx >= canvas.width || cy >= canvas.height) continue;
    const ii = cy * canvas.width + cx;
    if (vis[ii]) continue;
    vis[ii] = 1;
    const pi = ii * 4;
    if (
      Math.abs(d[pi] - tr) > 20 ||
      Math.abs(d[pi + 1] - tg) > 20 ||
      Math.abs(d[pi + 2] - tb) > 20 ||
      Math.abs(d[pi + 3] - ta) > 20
    )
      continue;
    d[pi] = fc.r;
    d[pi + 1] = fc.g;
    d[pi + 2] = fc.b;
    d[pi + 3] = Math.round(S.opacity * 255);
    stk.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
  }
  ctx.putImageData(id, 0, 0);
  scheduleSave();
}

function doPick(e) {
  const p = getPos(e);
  const px = ctx.getImageData(Math.floor(p.x), Math.floor(p.y), 1, 1).data;
  const hex =
    "#" +
    [px[0], px[1], px[2]].map((v) => v.toString(16).padStart(2, "0")).join("");
  // find closest
  let best = -1,
    bestDist = Infinity;
  COLORS.forEach((c, i) => {
    const cr = hexToRgb(c.hex);
    const d =
      Math.abs(cr.r - px[0]) + Math.abs(cr.g - px[1]) + Math.abs(cr.b - px[2]);
    if (d < bestDist) {
      bestDist = d;
      best = i;
    }
  });
  S.colorIdx = best;
  renderColors();
  updateColorPreview();
  showToast("Color picked");
}

// ══════════════════════════════════
// UNDO / REDO
// ══════════════════════════════════
function pushUndo() {
  undoStack.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
  if (undoStack.length > UNDO_MAX) undoStack.shift();
  redoStack = [];
}
function undo() {
  if (!undoStack.length) return;
  redoStack.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
  ctx.putImageData(undoStack.pop(), 0, 0);
  scheduleSave();
}
function redo() {
  if (!redoStack.length) return;
  undoStack.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
  ctx.putImageData(redoStack.pop(), 0, 0);
  scheduleSave();
}

// ══════════════════════════════════
// AUTO SAVE
// ══════════════════════════════════
function scheduleSave() {
  clearTimeout(autoSaveTimer);
  autoSaveTimer = setTimeout(saveProject, 5000);
}

function saveProject(quiet = false) {
  if (!S.projectId) S.projectId = "p_" + Date.now();
  const thumb = makeThumb();
  const rec = {
    id: S.projectId,
    name: S.projectName,
    t: Date.now(),
    bg: S.bgId,
    bgColor: S.bgColor,
    img: canvas.toDataURL("image/png"),
    thumb,
  };
  try {
    const list = getProjects();
    const idx = list.findIndex((p) => p.id === S.projectId);
    if (idx >= 0) list[idx] = rec;
    else list.unshift(rec);
    localStorage.setItem("cs_projects", JSON.stringify(list));
    if (!quiet) {
      flashSave();
      renderProjects();
    }
  } catch (e) {
    console.warn(e);
  }
}

function makeThumb() {
  const t = document.createElement("canvas");
  t.width = 120;
  t.height = 80;
  const tc = t.getContext("2d");
  tc.drawImage(bgCanvas, 0, 0, 120, 80);
  tc.drawImage(canvas, 0, 0, 120, 80);
  return t.toDataURL("image/jpeg", 0.6);
}

function getProjects() {
  try {
    return JSON.parse(localStorage.getItem("cs_projects") || "[]");
  } catch {
    return [];
  }
}

function loadProject(p) {
  saveProject(true);
  S.projectId = p.id;
  S.projectName = p.name;
  S.bgId = p.bg;
  S.bgColor = p.bgColor;
  undoStack = [];
  redoStack = [];
  const img = new Image();
  img.onload = () => {
    const sw = window.innerWidth,
      sh = window.innerHeight;
    const w = sw * CANVAS_MULT,
      h = sh * CANVAS_MULT;
    canvas.width = w;
    canvas.height = h;
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    bgCanvas.width = w;
    bgCanvas.height = h;
    bgCanvas.style.width = w + "px";
    bgCanvas.style.height = h + "px";
    fillBg();
    ctx.drawImage(img, 0, 0);
    // re-center viewport
    vPanX = -(w - sw) / 2;
    vPanY = -(h - sh) / 2;
    applyViewport();
  };
  img.src = p.img;
  renderBgGrid();
  closePanel();
  showToast("Loaded: " + p.name);
}

function deleteProject(id, e) {
  e.stopPropagation();
  const list = getProjects().filter((p) => p.id !== id);
  localStorage.setItem("cs_projects", JSON.stringify(list));
  if (S.projectId === id) S.projectId = null;
  renderProjects();
  showToast("Deleted");
}

function newProject() {
  saveProject(true);
  S.projectId = null;
  S.projectName = "Untitled";
  undoStack = [];
  redoStack = [];
  resizeCanvas();
  renderProjects();
  closePanel();
  track("new-project");
  showToast("New project");
}

function flashSave() {
  const dot = document.getElementById("saveDot");
  const lbl = document.getElementById("saveLabel");
  dot.classList.remove("on");
  void dot.offsetWidth;
  dot.classList.add("on");
  lbl.textContent =
    "Saved " +
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  setTimeout(() => dot.classList.remove("on"), 2000);
}

// ══════════════════════════════════
// RENDER UI
// ══════════════════════════════════
function renderBrushRow() {
  const row = document.getElementById("brushRow");
  row.innerHTML = "";
  BRUSHES.forEach((b, i) => {
    const opt = document.createElement("div");
    opt.className = "brush-option" + (i === S.brushIdx ? " active" : "");
    const pip = document.createElement("div");
    pip.className = "brush-pip";
    pip.style.width = pip.style.height = Math.max(3, b.px * 0.8) + "px";
    opt.appendChild(pip);
    opt.addEventListener("click", () => {
      S.brushIdx = i;
      renderBrushRow();
      updateBrushPreview();
    });
    row.appendChild(opt);
  });
}

function updateBrushPreview() {
  const dot = document.getElementById("brushDotPreview");
  const bpx = BRUSHES[S.brushIdx].px;
  dot.style.width = dot.style.height =
    Math.max(4, Math.min(28, bpx * 0.7)) + "px";
}

function renderColors() {
  const grid = document.getElementById("colorGrid");
  grid.innerHTML = "";
  COLORS.forEach((c, i) => {
    const sw = document.createElement("div");
    sw.className = "color-swatch" + (i === S.colorIdx ? " active" : "");
    sw.style.background = c.hex;
    if (c.hex === "#f8fafc" || c.hex === "#f5f0e8")
      sw.style.boxShadow = "inset 0 0 0 1px rgba(0,0,0,0.12)";
    const nm = document.createElement("div");
    nm.className = "color-name";
    nm.textContent = c.name;
    sw.appendChild(nm);
    // Long press = show name
    let nameTimer;
    sw.addEventListener(
      "touchstart",
      () => {
        nameTimer = setTimeout(() => sw.classList.add("show-name"), 400);
      },
      { passive: true },
    );
    sw.addEventListener(
      "touchend",
      () => {
        clearTimeout(nameTimer);
        setTimeout(() => sw.classList.remove("show-name"), 1000);
      },
      { passive: true },
    );
    sw.addEventListener("click", () => {
      S.colorIdx = i;
      renderColors();
      updateColorPreview();
      if (S.tool === "eraser") setTool("brush");
      closePanel();
    });
    grid.appendChild(sw);
  });
}

function updateColorPreview() {
  document.getElementById("colorPreview").style.background =
    COLORS[S.colorIdx].hex;
}

function renderBgGrid() {
  const grid = document.getElementById("bgGrid");
  grid.innerHTML = "";
  BACKGROUNDS.forEach((bg) => {
    const opt = document.createElement("div");
    opt.className = "bg-option" + (bg.id === S.bgId ? " active" : "");
    opt.style.background = bg.css;
    opt.style.color = bg.text;
    opt.textContent = bg.label;
    opt.addEventListener("click", () => {
      S.bgId = bg.id;
      S.bgColor = bg.color;
      const saved = ctx.getImageData(0, 0, canvas.width, canvas.height);
      fillBg();
      ctx.putImageData(saved, 0, 0);
      renderBgGrid();
      closePanel();
      scheduleSave();
      track("background-changed", { background: bg.id });
    });
    grid.appendChild(opt);
  });
}

function renderProjects() {
  const list = document.getElementById("projectsList");
  const projects = getProjects();
  list.innerHTML = "";
  if (!projects.length) {
    list.innerHTML =
      '<div class="empty-state">No saved projects yet.\nStart drawing to auto-save.</div>';
    return;
  }
  projects.forEach((p) => {
    const card = document.createElement("div");
    card.className = "project-card" + (p.id === S.projectId ? " current" : "");
    const thumb = document.createElement("div");
    thumb.className = "project-thumb";
    if (p.thumb) {
      const img = new Image();
      img.src = p.thumb;
      img.style = "width:100%;height:100%;object-fit:cover";
      thumb.appendChild(img);
    }
    const info = document.createElement("div");
    info.className = "project-info";
    const nm = document.createElement("div");
    nm.className = "project-name";
    nm.textContent = p.name;
    const tm = document.createElement("div");
    tm.className = "project-time";
    tm.textContent = timeAgo(p.t);
    info.appendChild(nm);
    info.appendChild(tm);
    const del = document.createElement("button");
    del.className = "project-del";
    del.innerHTML =
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
    del.addEventListener("click", (e) => deleteProject(p.id, e));
    card.appendChild(thumb);
    card.appendChild(info);
    card.appendChild(del);
    card.addEventListener("click", () => loadProject(p));
    list.appendChild(card);
  });
}

const TOOL_ICONS = {
  brush: `<path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><circle cx="11" cy="11" r="2"/>`,
  pen: `<path d="M17 3a2.85 2.85 0 114 4L7.5 20.5 2 22l1.5-5.5Z"/>`,
  marker: `<rect x="2" y="9" width="12" height="6" rx="2"/><path d="M14 12h4l3 3-3 3h-4"/>`,
  eraser: `<path d="M20 20H7L3 16l10-10 7 7-1.5 1.5"/><path d="M6.5 17.5l5-5"/>`,
  fill: `<path d="M19 11l-8-8-8.5 8.5a5.5 5.5 0 007.78 7.78L19 11z"/><path d="M20 23c0-1.5 2.5-4 2.5-4s2.5 2.5 2.5 4a2.5 2.5 0 01-5 0z"/>`,
  eyedropper: `<path d="M2 22l1-1h3l9-9"/><path d="M3 21v-3l9-9"/><path d="m15 6 3.4-3.4a2.1 2.1 0 0 1 3 3L18 9l.4.4a2.1 2.1 0 0 1 0 3l-1.2 1.2a2.1 2.1 0 0 1-3 0L9 8.6"/>`,
  pan: `<path d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3M2 12h20M12 2v20"/>`,
};
const TOOL_LABELS = {
  brush: "Brush",
  pen: "Pen",
  marker: "Marker",
  eraser: "Eraser",
  fill: "Fill",
  eyedropper: "Pick",
  pan: "Pan",
};

function setTool(t) {
  S.tool = t;
  document
    .querySelectorAll(".tool-card")
    .forEach((c) => c.classList.toggle("active", c.dataset.tool === t));
  document.getElementById("tbPan").classList.toggle("active", t === "pan");
  // Pan is a mode, not a drawing tool — don't change the tool picker button display
  if (t !== "pan") {
    document.getElementById("toolIcon").innerHTML =
      TOOL_ICONS[t] || TOOL_ICONS.brush;
    document.getElementById("toolLabel").textContent = TOOL_LABELS[t] || t;
  }
  // Update cursor for desktop
  canvas.style.cursor = t === "pan" ? "grab" : "crosshair";
  document.getElementById("bgCanvas").style.cursor =
    t === "pan" ? "grab" : "crosshair";
  track("tool-selected", { tool: t });
}

// ══════════════════════════════════
// PANELS
// ══════════════════════════════════
function openPanel(id) {
  closePanel(false);
  activePanel = id;
  document.getElementById(id).classList.add("open");
  document.getElementById("overlay").classList.add("open");
}
function closePanel(animate = true) {
  if (activePanel) {
    document.getElementById(activePanel).classList.remove("open");
    activePanel = null;
  }
  document.getElementById("overlay").classList.remove("open");
}

document.getElementById("overlay").addEventListener("click", closePanel);

document
  .getElementById("tbTool")
  .addEventListener("click", () => openPanel("panelTool"));
document
  .getElementById("tbBrush")
  .addEventListener("click", () => openPanel("panelBrush"));
document
  .getElementById("tbColor")
  .addEventListener("click", () => openPanel("panelColor"));
document
  .getElementById("tbBg")
  .addEventListener("click", () => openPanel("panelBg"));
document.getElementById("tbPan").addEventListener("click", () => {
  if (S.tool === "pan") setTool(S.lastDrawTool || "brush");
  else {
    S.lastDrawTool = S.tool;
    setTool("pan");
  }
});
document.getElementById("btnProjects").addEventListener("click", () => {
  renderProjects();
  openPanel("panelProjects");
});
document
  .getElementById("btnExport")
  .addEventListener("click", () => openPanel("panelExport"));

document.getElementById("tbClear").addEventListener("click", () => {
  if (confirm("Clear canvas?")) {
    pushUndo();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    fillBg();
    scheduleSave();
    track("canvas-cleared");
    showToast("Canvas cleared");
  }
});

document.querySelectorAll(".tool-card").forEach((c) => {
  c.addEventListener("click", () => {
    setTool(c.dataset.tool);
    closePanel();
  });
});

document.getElementById("newProjBtn").addEventListener("click", newProject);

document.getElementById("btnUndo").addEventListener("click", undo);
document.getElementById("btnRedo").addEventListener("click", redo);

// Opacity
document.getElementById("opacitySlider").addEventListener("input", function () {
  S.opacity = this.value / 100;
  document.getElementById("opacityVal").textContent = this.value + "%";
});

// ══════════════════════════════════
// EXPORT
// ══════════════════════════════════
function getDrawingBounds(margin = 60) {
  // Scan the drawing canvas pixels to find the bounding box of all non-transparent content
  const idata = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = idata.data;
  const W = canvas.width,
    H = canvas.height;
  let minX = W,
    minY = H,
    maxX = 0,
    maxY = 0,
    found = false;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const a = d[(y * W + x) * 4 + 3];
      if (a > 10) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        found = true;
      }
    }
  }
  if (!found) return null;
  return {
    x: Math.max(0, minX - margin),
    y: Math.max(0, minY - margin),
    w: Math.min(W, maxX + margin) - Math.max(0, minX - margin),
    h: Math.min(H, maxY + margin) - Math.max(0, minY - margin),
  };
}

function makeExportCanvas(crop = false) {
  let sx = 0,
    sy = 0,
    sw = canvas.width,
    sh = canvas.height;
  if (crop) {
    const bounds = getDrawingBounds(80);
    if (bounds) {
      sx = bounds.x;
      sy = bounds.y;
      sw = bounds.w;
      sh = bounds.h;
    }
  }
  const tmp = document.createElement("canvas");
  tmp.width = sw;
  tmp.height = sh;
  const tc = tmp.getContext("2d");
  // Draw background layer first, then drawing layer on top
  tc.drawImage(bgCanvas, sx, sy, sw, sh, 0, 0, sw, sh);
  tc.drawImage(canvas, sx, sy, sw, sh, 0, 0, sw, sh);
  return tmp;
}

document.getElementById("aExportJpg").addEventListener("click", () => {
  const a = document.createElement("a");
  a.download = S.projectName + ".jpg";
  a.href = makeExportCanvas(true).toDataURL("image/jpeg", 0.95);
  a.click();
  track("export", { format: "jpg" });
  showToast("Saved as JPG (auto-cropped)");
  closePanel();
});

document.getElementById("aExportPng").addEventListener("click", () => {
  const a = document.createElement("a");
  a.download = S.projectName + ".png";
  a.href = makeExportCanvas(true).toDataURL("image/png");
  a.click();
  track("export", { format: "png" });
  showToast("Saved as PNG (auto-cropped)");
  closePanel();
});

document.getElementById("aCopyImg").addEventListener("click", async () => {
  try {
    makeExportCanvas(true).toBlob(async (b) => {
      await navigator.clipboard.write([new ClipboardItem({ "image/png": b })]);
      track("export", { format: "clipboard" });
      showToast("Copied (auto-cropped)!");
    });
  } catch {
    showToast("Copy not supported in this browser");
  }
  closePanel();
});

document.getElementById("aShareNative").addEventListener("click", async () => {
  try {
    makeExportCanvas(true).toBlob(async (b) => {
      const file = new File([b], (S.projectName || "artwork") + ".png", {
        type: "image/png",
      });
      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: "My Canvas Studio Art" });
      } else {
        showToast("Share not supported — use Save instead");
      }
    });
  } catch (e) {
    if (e.name !== "AbortError") showToast("Share failed");
  }
  closePanel();
});

document.getElementById("aShareTwitter").addEventListener("click", () => {
  window.open(
    "https://twitter.com/intent/tweet?text=" +
      encodeURIComponent("Created this on Canvas Studio 🎨"),
    "_blank",
  );
  closePanel();
});

document.getElementById("aShareInsta").addEventListener("click", () => {
  document.getElementById("aExportJpg").click();
  showToast("Save JPG then upload to Instagram");
  closePanel();
});

// ══════════════════════════════════
// UTILS
// ══════════════════════════════════
function hexToRgb(hex) {
  const m = hex.replace("#", "").match(/.{2}/g);
  return m
    ? { r: parseInt(m[0], 16), g: parseInt(m[1], 16), b: parseInt(m[2], 16) }
    : null;
}
function timeAgo(ts) {
  const d = Date.now() - ts;
  if (d < 60000) return "Just now";
  if (d < 3600000) return Math.floor(d / 60000) + "m ago";
  if (d < 86400000) return Math.floor(d / 3600000) + "h ago";
  return Math.floor(d / 86400000) + "d ago";
}
function showToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2200);
}

// Prevent page scroll on viewport
document.body.addEventListener(
  "touchmove",
  (e) => {
    if (
      e.target === canvas ||
      e.target === document.getElementById("bgCanvas") ||
      e.target === viewport
    )
      e.preventDefault();
  },
  { passive: false },
);

// Pinch-to-zoom prevention
document.addEventListener("gesturestart", (e) => e.preventDefault());
document.addEventListener("gesturechange", (e) => e.preventDefault());

// ══════════════════════════════════
// INIT
// ══════════════════════════════════
window.addEventListener("resize", () => {
  // On mobile, resize is often keyboard open/close — only handle actual orientation changes
  if (
    Math.abs(canvas.width - window.innerWidth) > 50 ||
    Math.abs(canvas.height - window.innerHeight) > 100
  ) {
    resizeCanvas();
  }
});

track("session-start");
const _sessionStart = Date.now();
window.addEventListener("beforeunload", () => {
  const seconds = Math.round((Date.now() - _sessionStart) / 1000);
  track("session-end", { seconds });
});

resizeCanvas();
renderBrushRow();
renderColors();
renderBgGrid();
updateColorPreview();
updateBrushPreview();

// Auto-save every 5s
setInterval(() => {
  if (S.projectId) saveProject(false);
}, 5000);

// Load latest project
const saved = getProjects();
if (saved.length) {
  const p = saved[0];
  S.projectId = p.id;
  S.projectName = p.name;
  S.bgId = p.bg;
  S.bgColor = p.bgColor;
  const img = new Image();
  img.onload = () => {
    fillBg();
    ctx.drawImage(img, 0, 0);
    renderBgGrid();
  };
  img.src = p.img;
  showToast("Welcome back");
} else {
  showToast("Canvash — Start drawing!");
}
