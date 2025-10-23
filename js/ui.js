// UI 요소 접근 및 표시 업데이트
export const ui = {
  startScreen: document.getElementById('startScreen'),
  gameScreen: document.getElementById('gameScreen'),
  gameOverScreen: document.getElementById('gameOverScreen'),
  startBtn: document.getElementById('startBtn'),
  restartBtn: document.getElementById('restartBtn'),
  gameArea: document.getElementById('gameArea'),
  canvas: document.getElementById('gameCanvas'),
  scoreDisplay: document.getElementById('score'),
  livesDisplay: document.getElementById('lives'),
  finalScoreDisplay: document.getElementById('finalScore'),
  livesInput: document.getElementById('livesInput'),
  difficultySelect: document.getElementById('difficultySelect'),
  modeSelect: document.getElementById('modeSelect'),
  timeLimitInput: document.getElementById('timeLimitInput'),
  timeGroup: document.getElementById('timeGroup'),
  livesGroup: document.getElementById('livesGroup'),
  timerDisplay: document.getElementById('timer'),
  langSelect: document.getElementById('langSelect'),
  difficultyInfo: document.getElementById('difficultyInfo'),
  customSettings: document.getElementById('customSettings'),
  spawnSpeedValue: document.getElementById('spawnSpeedValue'),
  fallSpeedValue: document.getElementById('fallSpeedValue'),
  ballSizeValue: document.getElementById('ballSizeValue'),
  customSpawnInput: document.getElementById('customSpawnInput'),
  customSpeedInput: document.getElementById('customSpeedInput'),
  customSizeMinInput: document.getElementById('customSizeMinInput'),
  customSizeMaxInput: document.getElementById('customSizeMaxInput'),
  quitBtn: document.getElementById('quitBtn'),
  gameModeInfo: document.getElementById('gameModeInfo'),
  customSpawnNumber: document.getElementById('customSpawnNumber'),
  customSpeedNumber: document.getElementById('customSpeedNumber'),
  customSizeMinNumber: document.getElementById('customSizeMinNumber'),
  customSizeMaxNumber: document.getElementById('customSizeMaxNumber'),
  previewBallMin: document.getElementById('previewBallMin'),
  previewBallMax: document.getElementById('previewBallMax'),
  advancedToggleBtn: document.getElementById('advancedToggleBtn'),
  advancedPanel: document.getElementById('advancedPanel'),
  closePanelBtn: document.getElementById('closePanelBtn'),
  screenWidthInput: document.getElementById('screenWidthInput'),
  screenHeightInput: document.getElementById('screenHeightInput'),
  screenWidthNumber: document.getElementById('screenWidthNumber'),
  screenHeightNumber: document.getElementById('screenHeightNumber'),
  applyScreenBtn: document.getElementById('applyScreenBtn'),
  customColorInput: document.getElementById('customColorInput'),
  customColorText: document.getElementById('customColorText'),
  applyColorBtn: document.getElementById('applyColorBtn'),
  btnWindowSize: document.getElementById('btnWindowSize'),
  windowSizeText: document.getElementById('windowSizeText'),
};

export function showScreen(name) {
  ui.startScreen.classList.add('hidden');
  ui.gameScreen.classList.add('hidden');
  ui.gameOverScreen.classList.add('hidden');
  if (name === 'start') ui.startScreen.classList.remove('hidden');
  else if (name === 'game') ui.gameScreen.classList.remove('hidden');
  else if (name === 'gameOver') ui.gameOverScreen.classList.remove('hidden');
}

export function updateScore(score) {
  ui.scoreDisplay.textContent = score;
}

export function updateLives(lives) {
  ui.livesDisplay.innerHTML = '';
  // 시간 제한 모드일 때는 목숨 표시하지 않음
  if (lives === Infinity) {
    const infinitySymbol = document.createElement('span');
    infinitySymbol.className = 'heart';
    infinitySymbol.textContent = '∞';
    ui.livesDisplay.appendChild(infinitySymbol);
    return;
  }
  for (let i = 0; i < lives; i++) {
    const heart = document.createElement('span');
    heart.className = 'heart';
    heart.textContent = '❤️';
    ui.livesDisplay.appendChild(heart);
  }
}

export function updateFinalScore(score) {
  ui.finalScoreDisplay.textContent = score;
}

export function updateTimerDisplay(remaining) {
  if (remaining == null) {
    ui.timerDisplay.textContent = '—';
  } else {
    const m = Math.floor(remaining / 60);
    const s = remaining % 60;
    ui.timerDisplay.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
}

export function updateDifficultyInfo(description) {
  if (ui.spawnSpeedValue) ui.spawnSpeedValue.textContent = description.spawnSpeed;
  if (ui.fallSpeedValue) ui.fallSpeedValue.textContent = description.fallSpeed;
  if (ui.ballSizeValue) ui.ballSizeValue.textContent = description.ballSize;
}

export function updateGameModeInfo(mode, lang = 'ko') {
  const translations = {
    ko: {
      standard: '모드: 기본 (목숨 제한)',
      infinite: '모드: 연습 모드 (무제한)',
      timed: '모드: 시간 제한',
    },
    en: {
      standard: 'Mode: Standard (Lives)',
      infinite: 'Mode: Practice (Unlimited)',
      timed: 'Mode: Timed',
    },
    ja: {
      standard: 'モード: 標準（ライフあり）',
      infinite: 'モード: 練習モード（無制限）',
      timed: 'モード: タイムアタック',
    },
  };
  
  const t = translations[lang] || translations.ko;
  if (ui.gameModeInfo) {
    ui.gameModeInfo.textContent = t[mode] || t.standard;
  }
}

export function drawBallPreview(canvas, size) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  
  // 캔버스 크기 설정 (100x100)
  canvas.width = 100 * dpr;
  canvas.height = 100 * dpr;
  ctx.scale(dpr, dpr);
  
  // 배경 클리어
  ctx.clearRect(0, 0, 100, 100);
  
  // 공 그리기
  const centerX = 50;
  const centerY = 50;
  const radius = Math.min(size / 2, 45); // 최대 반지름 45px로 제한 (여백 확보)
  
  // 그라데이션
  const gradient = ctx.createRadialGradient(centerX - radius * 0.3, centerY - radius * 0.3, 0, centerX, centerY, radius);
  gradient.addColorStop(0, '#60a5fa');
  gradient.addColorStop(1, '#3b82f6');
  
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.shadowColor = 'rgba(59, 130, 246, 0.5)';
  ctx.shadowBlur = 10;
  ctx.fill();
  ctx.shadowBlur = 0;
  
  // 크기 텍스트
  ctx.fillStyle = 'white';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(size + 'px', centerX, centerY);
}
