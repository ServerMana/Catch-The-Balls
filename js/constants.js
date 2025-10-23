// 공통 상수 및 유틸 함수
export const DEFAULTS = {
  INITIAL_LIVES: 3,
  DOT_SIZE_MIN: 20,
  DOT_SIZE_MAX: 50,
  DOT_SPEED_MIN: 1.5,
  DOT_SPEED_MAX: 4.0,
  DOT_SPAWN_INTERVAL: 600,
};

export const DOT_COLORS = [
  '#ef4444', '#f97316', '#fbbf24', '#84cc16',
  '#22c55e', '#10b981', '#06b6d4', '#06b6d4',
  '#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e'
];

export const HIT_SLOP = 2;

export function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

export function px(n) { return `${n}px`; }
