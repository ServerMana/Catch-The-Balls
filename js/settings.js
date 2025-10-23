// 난이도 및 모드 설정 적용
import { DEFAULTS } from './constants.js';

export function applyDifficulty(level, customValues = null) {
  if (level === 'custom' && customValues) {
    const avgSpeed = customValues.speed || 2.75;
    return {
      DOT_SPAWN_INTERVAL: customValues.spawnInterval || 600,
      DOT_SPEED_MIN: Math.max(0.5, avgSpeed - 1.25),
      DOT_SPEED_MAX: Math.min(10, avgSpeed + 1.25),
      DOT_SIZE_MIN: customValues.sizeMin || 20,
      DOT_SIZE_MAX: customValues.sizeMax || 50,
    };
  } else if (level === 'easy') {
    return {
      DOT_SPAWN_INTERVAL: 800,
      DOT_SPEED_MIN: 1.0,
      DOT_SPEED_MAX: 2.5,
      DOT_SIZE_MIN: 26,
      DOT_SIZE_MAX: 56,
    };
  } else if (level === 'hard') {
    return {
      DOT_SPAWN_INTERVAL: 450,
      DOT_SPEED_MIN: 2.5,
      DOT_SPEED_MAX: 5.0,
      DOT_SIZE_MIN: 18,
      DOT_SIZE_MAX: 40,
    };
  }
  // normal
  return {
    DOT_SPAWN_INTERVAL: DEFAULTS.DOT_SPAWN_INTERVAL,
    DOT_SPEED_MIN: DEFAULTS.DOT_SPEED_MIN,
    DOT_SPEED_MAX: DEFAULTS.DOT_SPEED_MAX,
    DOT_SIZE_MIN: DEFAULTS.DOT_SIZE_MIN,
    DOT_SIZE_MAX: DEFAULTS.DOT_SIZE_MAX,
  };
}

export function getDifficultyDescription(level, customValues = null, lang = 'ko') {
  const d = applyDifficulty(level, customValues);
  
  const translations = {
    ko: {
      veryFast: '매우 빠름',
      fast: '빠름',
      normal: '보통',
      slow: '느림',
      large: '큼',
      small: '작음'
    },
    en: {
      veryFast: 'Very Fast',
      fast: 'Fast',
      normal: 'Normal',
      slow: 'Slow',
      large: 'Large',
      small: 'Small'
    },
    ja: {
      veryFast: '超速',
      fast: '速',
      normal: '普通',
      slow: '遅',
      large: '大',
      small: '小'
    }
  };
  
  const t = translations[lang] || translations.ko;
  
  const spawnSpeed = d.DOT_SPAWN_INTERVAL <= 500 ? t.veryFast : 
                     d.DOT_SPAWN_INTERVAL <= 650 ? t.normal : t.slow;
  const fallSpeed = ((d.DOT_SPEED_MIN + d.DOT_SPEED_MAX) / 2) >= 3.5 ? t.veryFast :
                    ((d.DOT_SPEED_MIN + d.DOT_SPEED_MAX) / 2) >= 2.5 ? t.fast :
                    ((d.DOT_SPEED_MIN + d.DOT_SPEED_MAX) / 2) >= 2.0 ? t.normal : t.slow;
  const ballSize = ((d.DOT_SIZE_MIN + d.DOT_SIZE_MAX) / 2) >= 45 ? t.large :
                   ((d.DOT_SIZE_MIN + d.DOT_SIZE_MAX) / 2) >= 32 ? t.normal : t.small;
  
  return { spawnSpeed, fallSpeed, ballSize };
}

export function applyMode(mode, secondsInput) {
  const result = { mode, remainingTime: null };
  if (mode === 'timed') {
    const sec = Number.isFinite(secondsInput) ? secondsInput : 60;
    result.remainingTime = Math.max(5, Math.min(600, sec));
  }
  return result;
}
