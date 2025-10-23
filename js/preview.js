// 난이도 프리뷰 렌더러: 시작 화면 배경에서 공 애니메이션
import { DOT_COLORS } from './constants.js';

let pvCanvas, pvCtx;
let running = false;
let dots = [];
let lastSpawn = 0;
let lastFrame = 0;
let params = { sizeMin: 20, sizeMax: 50, speedMin: 1.5, speedMax: 4, spawnInterval: 700 };

export function initPreview() {
  pvCanvas = document.getElementById('previewCanvas');
  if (!pvCanvas) return;
  pvCtx = pvCanvas.getContext('2d');
  setup();
  window.addEventListener('resize', setup);
}

export function setPreviewDifficulty(d) {
  params = {
    sizeMin: d.DOT_SIZE_MIN,
    sizeMax: d.DOT_SIZE_MAX,
    speedMin: d.DOT_SPEED_MIN,
    speedMax: d.DOT_SPEED_MAX,
    spawnInterval: d.DOT_SPAWN_INTERVAL,
  };
}

export function startPreview() {
  running = true;
  lastFrame = performance.now();
  lastSpawn = performance.now();
  dots = [];
  loop();
}

export function stopPreview() {
  running = false;
}

function setup() {
  const rect = pvCanvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  pvCanvas.width = Math.max(1, Math.floor(rect.width * dpr));
  pvCanvas.height = Math.max(1, Math.floor(rect.height * dpr));
  pvCtx.setTransform(1, 0, 0, 1, 0, 0);
  pvCtx.scale(dpr, dpr);
}

function loop() {
  if (!running) return;
  const now = performance.now();
  const dt = Math.min(32, now - lastFrame); // ms 제한
  lastFrame = now;

  update(dt);
  draw();
  requestAnimationFrame(loop);
}

function update(dt) {
  const rect = pvCanvas.getBoundingClientRect();
  // 스폰
  if (performance.now() - lastSpawn > params.spawnInterval) {
    lastSpawn = performance.now();
    const size = Math.random() * (params.sizeMax - params.sizeMin) + params.sizeMin;
    dots.push({
      x: Math.random() * (rect.width - size),
      y: -size,
      size,
      color: DOT_COLORS[Math.floor(Math.random() * DOT_COLORS.length)],
      speed: Math.random() * (params.speedMax - params.speedMin) + params.speedMin,
    });
  }
  // 이동
  for (let i = dots.length - 1; i >= 0; i--) {
    dots[i].y += dots[i].speed * (dt / 16.67);
    if (dots[i].y > rect.height + 10) dots.splice(i, 1);
  }
}

function draw() {
  pvCtx.save();
  pvCtx.setTransform(1, 0, 0, 1, 0, 0);
  pvCtx.clearRect(0, 0, pvCanvas.width, pvCanvas.height);
  pvCtx.restore();
  for (const d of dots) {
    const r = d.size / 2;
    const cx = d.x + r;
    const cy = d.y + r;
    pvCtx.beginPath();
    pvCtx.arc(cx, cy, r, 0, Math.PI * 2);
    pvCtx.fillStyle = d.color;
    pvCtx.globalAlpha = 0.8;
    pvCtx.fill();
    pvCtx.globalAlpha = 1;
  }
}
