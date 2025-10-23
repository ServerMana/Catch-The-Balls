// 캔버스 렌더러 및 입력 히트테스트
import { DOT_COLORS, HIT_SLOP } from './constants.js';
import { ui } from './ui.js';

export const ctx = ui.canvas.getContext('2d');

export function setupCanvas() {
  const rect = ui.gameArea.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  ui.canvas.width = Math.max(1, Math.floor(rect.width * dpr));
  ui.canvas.height = Math.max(1, Math.floor(rect.height * dpr));
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(dpr, dpr);
}

export function clearCanvas() {
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, ui.canvas.width, ui.canvas.height);
  ctx.restore();
}

export function drawDots(dots) {
  for (const dot of dots) {
    const r = dot.size / 2;
    const cx = dot.x + r;
    const cy = dot.y + r;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = dot.color;
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}

export function hitTest(dots, clientX, clientY) {
  const rect = ui.canvas.getBoundingClientRect();
  const x = clientX - rect.left;
  const y = clientY - rect.top;
  if (x < 0 || y < 0 || x > rect.width || y > rect.height) return null;
  for (let i = dots.length - 1; i >= 0; i--) {
    const d = dots[i];
    const r = d.size / 2;
    const cx = d.x + r;
    const cy = d.y + r;
    const dx = x - cx;
    const dy = y - cy;
    const rr = (r + HIT_SLOP) * (r + HIT_SLOP);
    if (dx * dx + dy * dy <= rr) {
      return d.id;
    }
  }
  return null;
}

export function randomDot(id, rect, sizeMin, sizeMax, speedMin, speedMax) {
  const size = Math.random() * (sizeMax - sizeMin) + sizeMin;
  return {
    id,
    x: Math.random() * (rect.width - size),
    y: -size,
    size,
    color: DOT_COLORS[Math.floor(Math.random() * DOT_COLORS.length)],
    speed: Math.random() * (speedMax - speedMin) + speedMin,
  };
}
