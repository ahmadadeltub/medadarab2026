
// === Element References ===
const pad = document.getElementById('pad');
const wrap = document.getElementById('padWrap');
const ghost = document.getElementById('ghost');
const refLetter = document.getElementById('refLetter');
const ghostOpacity = document.getElementById('ghostOpacity');
const penRange = document.getElementById('pen');
const penSizeLabel = document.getElementById('penSizeLabel');
const gridToggle = document.getElementById('gridToggle');
const linesToggle = document.getElementById('linesToggle');
const clearBtn = document.getElementById('clearBtn');
const analyzeBtn = document.getElementById('analyzeBtn');
const downloadBtn = document.getElementById('downloadBtn');
const eraseBtn = document.getElementById('eraseBtn');
const undoBtn = document.getElementById('undoBtn');
const redoBtn = document.getElementById('redoBtn');
const feedback = document.getElementById('feedback');
const metrics = document.getElementById('metrics');
const scoreValue = document.getElementById('scoreValue');
const scoreRing = document.getElementById('scoreRing');

let isEraser = false;
let drawing = false;
let last = null;
let ctx = null;
let currentColor = '#0f172a';

// === Undo/Redo ===
const undoStack = [];
const redoStack = [];
function pushState() {
  if (!ctx) return;
  try {
    undoStack.push(ctx.getImageData(0, 0, pad.width, pad.height));
    if (undoStack.length > 50) undoStack.shift();
    redoStack.length = 0;
  } catch (e) {}
}
function undo() {
  if (!undoStack.length || !ctx) return;
  redoStack.push(ctx.getImageData(0, 0, pad.width, pad.height));
  ctx.putImageData(undoStack.pop(), 0, 0);
}
function redo() {
  if (!redoStack.length || !ctx) return;
  undoStack.push(ctx.getImageData(0, 0, pad.width, pad.height));
  ctx.putImageData(redoStack.pop(), 0, 0);
}

// === Canvas Setup ===
function fitCanvas() {
  if (!wrap || !pad) return;
  const r = wrap.getBoundingClientRect();
  pad.width = Math.floor(r.width);
  pad.height = 480;
  ctx = pad.getContext('2d');
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = currentColor;
  ctx.lineWidth = parseInt(penRange?.value || 12, 10);
  clearCanvas();
  drawGuides();
  pushState();
}
window.addEventListener('resize', fitCanvas);
fitCanvas();

// === Guide Lines ===
function drawGuides() {
  const guides = document.getElementById('guides');
  if (!guides || !pad) return;
  const H = pad.height;
  const base = Math.floor(H * 0.68);
  const mid = Math.floor(H * 0.50);
  const top = Math.floor(H * 0.32);

  let bgParts = [];

  if (linesToggle && linesToggle.checked) {
    bgParts.push(
      `linear-gradient(to bottom,
        transparent 0px,
        transparent ${top - 1}px,
        rgba(16,185,129,0.4) ${top - 1}px,
        rgba(16,185,129,0.4) ${top + 1}px,
        transparent ${top + 1}px,
        transparent ${mid - 1}px,
        rgba(16,185,129,0.3) ${mid - 1}px,
        rgba(16,185,129,0.3) ${mid + 1}px,
        transparent ${mid + 1}px,
        transparent ${base - 1}px,
        rgba(16,185,129,0.6) ${base - 1}px,
        rgba(16,185,129,0.6) ${base + 2}px,
        transparent ${base + 2}px
      )`
    );
  }

  if (gridToggle && gridToggle.checked) {
    bgParts.push(
      `repeating-linear-gradient(to right, rgba(100,116,139,0.12) 0px 1px, transparent 1px 32px)`,
      `repeating-linear-gradient(to bottom, rgba(100,116,139,0.08) 0px 1px, transparent 1px 32px)`
    );
  }

  guides.style.backgroundImage = bgParts.length ? bgParts.join(', ') : 'none';
}

// === Clear Canvas (transparent so ghost+guides show through) ===
function clearCanvas() {
  if (!ctx) return;
  ctx.clearRect(0, 0, pad.width, pad.height);
}

// === Ghost Text – updates immediately and stays permanently ===
function updateGhost(text) {
  if (!ghost) return;
  ghost.textContent = text;
  // Ensure opacity stays visible
  const currentOpacity = parseFloat(ghost.style.opacity) || 0.18;
  if (currentOpacity < 0.05) ghost.style.opacity = '0.18';
}

refLetter?.addEventListener('change', () => {
  if (refLetter.value) updateGhost(refLetter.value);
});

// Opacity slider
ghostOpacity?.addEventListener('input', () => {
  if (!ghost) return;
  const val = parseInt(ghostOpacity.value, 10) / 100;
  ghost.style.opacity = val.toString();
});

// Custom text apply – text stays permanently
const customRefText = document.getElementById('customRefText');
const applyRefBtn = document.getElementById('applyRefBtn');
applyRefBtn?.addEventListener('click', () => {
  const txt = customRefText?.value.trim();
  if (txt) {
    updateGhost(txt);
    // Do NOT reset selectedIndex as it may trigger events
  }
});
customRefText?.addEventListener('keydown', e => {
  if (e.key === 'Enter') applyRefBtn?.click();
});

// === Pen Size Label ===
penRange?.addEventListener('input', () => {
  if (ctx) ctx.lineWidth = parseInt(penRange.value, 10);
  if (penSizeLabel) penSizeLabel.textContent = penRange.value;
});

// === Color Palette ===
document.querySelectorAll('.color-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    currentColor = btn.dataset.color;
    isEraser = false;
    // reset eraser visual if active
    eraseBtn?.classList.remove('bg-rose-600', 'text-white');
    eraseBtn?.classList.add('bg-white');
    // update active ring on color buttons
    document.querySelectorAll('.color-btn').forEach(b => {
      b.classList.remove('border-emerald-500');
      b.classList.add('border-transparent');
    });
    btn.classList.add('border-emerald-500');
    btn.classList.remove('border-transparent');
  });
});

// === Eraser ===
eraseBtn?.addEventListener('click', () => {
  isEraser = !isEraser;
  if (isEraser) {
    eraseBtn.classList.add('bg-rose-600', 'text-white', 'border-rose-600');
    eraseBtn.classList.remove('bg-white');
  } else {
    eraseBtn.classList.remove('bg-rose-600', 'text-white', 'border-rose-600');
    eraseBtn.classList.add('bg-white');
  }
});

// === Clear Canvas Button ===
clearBtn?.addEventListener('click', () => {
  clearCanvas();
  pushState();
});

// === Download ===
downloadBtn?.addEventListener('click', () => {
  const url = pad.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = url;
  a.download = 'arabic-calligraphy.png';
  a.click();
});

undoBtn?.addEventListener('click', undo);
redoBtn?.addEventListener('click', redo);
gridToggle?.addEventListener('change', drawGuides);
linesToggle?.addEventListener('change', drawGuides);

// === Drawing (Pointer Events) ===
function getXY(e) {
  const rect = pad.getBoundingClientRect();
  const scaleX = pad.width / rect.width;
  const scaleY = pad.height / rect.height;
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY
  };
}

function pointerDown(e) {
  if (!ctx) return;
  drawing = true;
  last = getXY(e);
  if (pad.setPointerCapture) pad.setPointerCapture(e.pointerId);
  pushState();
  e.preventDefault();
}

function pointerMove(e) {
  if (!drawing || !ctx) return;
  const p = getXY(e);
  const pressure = e.pressure && e.pressure > 0 ? e.pressure : 0.5;
  const base = parseInt(penRange.value, 10);
  const width = Math.max(1, Math.min(60, base * (0.5 + pressure * 1.2)));

  ctx.save();
  if (isEraser) {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.strokeStyle = 'rgba(0,0,0,1)';
    ctx.lineWidth = width * 2;
  } else {
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = currentColor;
    ctx.lineWidth = width;
  }
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(last.x, last.y);
  ctx.lineTo(p.x, p.y);
  ctx.stroke();
  ctx.restore();
  last = p;
  e.preventDefault();
}

function pointerUp(e) {
  drawing = false;
  if (pad && pad.releasePointerCapture) pad.releasePointerCapture(e.pointerId);
}

pad?.addEventListener('pointerdown', pointerDown);
pad?.addEventListener('pointermove', pointerMove);
window.addEventListener('pointerup', pointerUp);

// === AI Analysis ===
async function analyzeImage() {
  if (!pad || !feedback) return;
  feedback.innerHTML = `<div class="flex items-center gap-2 text-slate-400 font-bold animate-pulse">
    <svg class="animate-spin h-5 w-5" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
    جاري التحليل الذكي...
  </div>`;

  const dataURL = pad.toDataURL('image/png');
  try {
    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: dataURL })
    });
    const js = await res.json();
    if (js.error) {
      feedback.textContent = 'حدث خطأ أثناء التحليل.';
      return;
    }
    const sug = js.suggestions || [];
    feedback.innerHTML = '<div class="space-y-3">' + sug.map(s => `
      <div class="flex items-start gap-3 p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-slate-700 text-sm">
        <div class="mt-1 w-2 h-2 rounded-full bg-emerald-500 shrink-0"></div>
        <span>${s}</span>
      </div>
    `).join('') + '</div>';
    if (metrics) metrics.textContent = JSON.stringify(js.metrics, null, 2);
    if (js.metrics && js.metrics.score !== undefined) {
      animateScore(js.metrics.score);
    }
  } catch (e) {
    feedback.textContent = 'تعذر الاتصال بالخادم.';
  }
}

// === Animated Score Ring (SVG) ===
function animateScore(target) {
  const circumference = 314; // 2 * pi * 50
  let current = 0;
  const duration = 1200;
  const start = performance.now();
  function step(now) {
    const progress = Math.min(1, (now - start) / duration);
    // ease out
    const eased = 1 - Math.pow(1 - progress, 3);
    current = Math.round(eased * target);
    if (scoreValue) scoreValue.textContent = current + '%';
    if (scoreRing) {
      const offset = circumference - (circumference * current / 100);
      scoreRing.style.strokeDashoffset = offset;
      // colour-code: green > 70, amber > 40, red below
      scoreRing.style.stroke = current >= 70 ? '#10b981' : current >= 40 ? '#f59e0b' : '#ef4444';
    }
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

analyzeBtn?.addEventListener('click', analyzeImage);
