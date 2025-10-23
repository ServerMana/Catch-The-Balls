// 엔트리 포인트: 모듈 기반 구성
import { DEFAULTS } from './constants.js';
import { applyDifficulty, applyMode, getDifficultyDescription } from './settings.js';
import { ui, showScreen, updateScore, updateLives, updateFinalScore, updateTimerDisplay, updateDifficultyInfo, updateGameModeInfo, drawBallPreview } from './ui.js';
import { setupCanvas, clearCanvas, drawDots, hitTest, randomDot } from './renderer.js';
import { applyTranslations } from './i18n.js';
import { initPreview, setPreviewDifficulty, startPreview, stopPreview } from './preview.js';

let gameState = 'start';
let score = 0;
let lives = DEFAULTS.INITIAL_LIVES;
let dots = [];
let dotIdCounter = 0;
let lastSpawnTime = Date.now();
let animationFrameId = null;
let timerIntervalId = null;
let remainingTime = null;

let DOT_SIZE_MIN = DEFAULTS.DOT_SIZE_MIN;
let DOT_SIZE_MAX = DEFAULTS.DOT_SIZE_MAX;
let DOT_SPEED_MIN = DEFAULTS.DOT_SPEED_MIN;
let DOT_SPEED_MAX = DEFAULTS.DOT_SPEED_MAX;
let DOT_SPAWN_INTERVAL = DEFAULTS.DOT_SPAWN_INTERVAL;
let currentGameMode = 'standard';

ui.startBtn.addEventListener('click', startGame);
ui.restartBtn.addEventListener('click', () => {
  // 게임 상태 초기화
  gameState = 'start';
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  if (timerIntervalId) { clearInterval(timerIntervalId); timerIntervalId = null; }
  
  // 화면 전환 및 프리뷰 시작
  showScreen('start');
  startPreview();
});
ui.quitBtn?.addEventListener('click', () => {
  if (gameState === 'playing') {
    endGame('quit');
  }
});
ui.canvas.addEventListener('pointerdown', handlePointerDown);

// 고급 설정 패널 토글
ui.advancedToggleBtn?.addEventListener('click', () => {
  ui.advancedPanel?.classList.toggle('open');
});

ui.closePanelBtn?.addEventListener('click', () => {
  ui.advancedPanel?.classList.remove('open');
});

// 화면 크기 슬라이더와 숫자 입력 동기화
const screenSyncInputs = [
  { range: ui.screenWidthInput, number: ui.screenWidthNumber },
  { range: ui.screenHeightInput, number: ui.screenHeightNumber },
];

screenSyncInputs.forEach(({ range, number }) => {
  range?.addEventListener('input', () => {
    if (number) number.value = range.value;
  });
  
  number?.addEventListener('input', () => {
    if (range) range.value = number.value;
  });
});

// 화면 크기 적용
ui.applyScreenBtn?.addEventListener('click', () => {
  const width = parseInt(ui.screenWidthInput?.value || '1920');
  const height = parseInt(ui.screenHeightInput?.value || '1080');
  
  applyScreenSize(width, height, true);
  
  // 알림 표시
  showNotification(`화면 크기: ${width}x${height}px 적용됨`);
});

function applyScreenSize(width, height, showFrame = true) {
  // 게임 영역 크기 조정
  const gameArea = document.getElementById('gameArea');
  if (gameArea) {
    gameArea.style.maxWidth = `${width}px`;
    gameArea.style.maxHeight = `${height}px`;
    gameArea.style.margin = '0 auto';
  }
  
  // 시작 화면 크기 조정 및 프레임 표시
  const startScreen = document.getElementById('startScreen');
  if (startScreen) {
    startScreen.style.maxWidth = `${width}px`;
    startScreen.style.maxHeight = `${height}px`;
    startScreen.style.margin = '0 auto';
    
    if (showFrame) {
      startScreen.classList.add('with-frame');
      startScreen.style.setProperty('--frame-width', `${width}px`);
      startScreen.style.setProperty('--frame-height', `${height}px`);
      // 현재 배경색의 보색으로 프레임 색상 설정
      updateFrameColor(currentBgColor);
    } else {
      startScreen.classList.remove('with-frame');
    }
  }
  
  // 게임 오버 화면 크기 조정
  const gameOverScreen = document.getElementById('gameOverScreen');
  if (gameOverScreen) {
    gameOverScreen.style.maxWidth = `${width}px`;
    gameOverScreen.style.maxHeight = `${height}px`;
    gameOverScreen.style.margin = '0 auto';
  }
  
  // 캔버스 재설정
  if (gameState === 'playing') {
    setupCanvas();
  }
}

// 화면 크기 프리셋 버튼
document.querySelectorAll('.btn-preset').forEach(btn => {
  btn.addEventListener('click', () => {
    const width = btn.getAttribute('data-width');
    const height = btn.getAttribute('data-height');
    
    if (width && height) {
      if (ui.screenWidthInput) ui.screenWidthInput.value = width;
      if (ui.screenWidthNumber) ui.screenWidthNumber.value = width;
      if (ui.screenHeightInput) ui.screenHeightInput.value = height;
      if (ui.screenHeightNumber) ui.screenHeightNumber.value = height;
      
      // 자동 적용
      ui.applyScreenBtn?.click();
    }
  });
});

// 현재 창 크기 버튼
ui.btnWindowSize?.addEventListener('click', () => {
  // 실제 뷰포트 크기 (스크롤바 포함)
  const width = document.documentElement.clientWidth;
  const height = document.documentElement.clientHeight;
  
  if (ui.screenWidthInput) ui.screenWidthInput.value = width;
  if (ui.screenWidthNumber) ui.screenWidthNumber.value = width;
  if (ui.screenHeightInput) ui.screenHeightInput.value = height;
  if (ui.screenHeightNumber) ui.screenHeightNumber.value = height;
  
  // 버튼 텍스트 업데이트
  if (ui.windowSizeText) {
    ui.windowSizeText.textContent = `${width}×${height}`;
  }
  
  // 프레임 제거하고 적용
  const startScreen = document.getElementById('startScreen');
  const gameScreen = document.getElementById('gameScreen');
  if (startScreen) startScreen.classList.remove('with-frame');
  if (gameScreen) gameScreen.classList.remove('with-frame');
  
  // 화면 크기만 적용 (프레임 없이)
  applyScreenSize(width, height, false);
  showNotification(`화면 크기: ${width}×${height}px 적용됨 (전체 화면)`);
});

// 배경색 프리셋 버튼
let currentBgColor = '#0f172a';
document.querySelectorAll('.btn-color').forEach(btn => {
  btn.addEventListener('click', () => {
    const color = btn.getAttribute('data-color');
    applyBackgroundColor(color);
    
    // 활성화 상태 업데이트
    document.querySelectorAll('.btn-color').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    // 커스텀 색상 입력 업데이트
    if (ui.customColorInput) ui.customColorInput.value = color;
    if (ui.customColorText) ui.customColorText.value = color;
  });
});

// 커스텀 색상 적용
ui.applyColorBtn?.addEventListener('click', () => {
  const color = ui.customColorInput?.value || '#0f172a';
  applyBackgroundColor(color);
  if (ui.customColorText) ui.customColorText.value = color;
  
  // 프리셋 활성화 해제
  document.querySelectorAll('.btn-color').forEach(b => b.classList.remove('active'));
});

// 색상 피커와 텍스트 입력 동기화
ui.customColorInput?.addEventListener('input', () => {
  if (ui.customColorText) ui.customColorText.value = ui.customColorInput.value;
});

ui.customColorText?.addEventListener('input', () => {
  const value = ui.customColorText.value;
  if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
    if (ui.customColorInput) ui.customColorInput.value = value;
  }
});

function applyBackgroundColor(color) {
  currentBgColor = color;
  document.body.style.background = `linear-gradient(135deg, ${color} 0%, ${adjustBrightness(color, 20)} 100%)`;
  
  // 게임 영역 배경도 업데이트
  const gameArea = document.getElementById('gameArea');
  if (gameArea) {
    gameArea.style.background = `linear-gradient(135deg, ${color} 0%, ${adjustBrightness(color, 20)} 100%)`;
  }
  
  // 프레임 보색 업데이트
  updateFrameColor(color);
  
  showNotification('배경색이 변경되었습니다');
}

function adjustBrightness(hex, percent) {
  // hex 색상을 밝게/어둡게 조정
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + percent));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + percent));
  const b = Math.min(255, Math.max(0, (num & 0x0000FF) + percent));
  return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
}

function getComplementaryColor(hex) {
  // 보색 계산
  const num = parseInt(hex.replace('#', ''), 16);
  const r = (num >> 16) & 0xFF;
  const g = (num >> 8) & 0xFF;
  const b = num & 0xFF;
  
  // RGB를 보색으로 변환
  const compR = 255 - r;
  const compG = 255 - g;
  const compB = 255 - b;
  
  return '#' + ((compR << 16) | (compG << 8) | compB).toString(16).padStart(6, '0');
}

function updateFrameColor(bgColor) {
  const complementary = getComplementaryColor(bgColor);
  const startScreen = document.getElementById('startScreen');
  const gameScreen = document.getElementById('gameScreen');
  
  if (startScreen) {
    startScreen.style.setProperty('--frame-color', complementary);
  }
  
  if (gameScreen) {
    gameScreen.style.setProperty('--frame-color', complementary);
  }
}

function showNotification(message) {
  const notification = document.createElement('div');
  notification.style.position = 'fixed';
  notification.style.top = '20px';
  notification.style.right = '20px';
  notification.style.background = 'rgba(16, 185, 129, 0.9)';
  notification.style.color = 'white';
  notification.style.padding = '1rem 1.5rem';
  notification.style.borderRadius = '0.5rem';
  notification.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
  notification.style.zIndex = '2000';
  notification.style.fontWeight = '600';
  notification.style.animation = 'slideInRight 0.3s ease';
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'fadeOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 2000);
}

ui.modeSelect?.addEventListener('change', () => {
  const mode = ui.modeSelect.value;
  if (mode === 'timed') {
    ui.timeGroup.style.display = '';
    if (ui.livesGroup) ui.livesGroup.style.display = 'none';
  } else if (mode === 'infinite') {
    // 연습 모드는 목숨 설정 숨김
    ui.timeGroup.style.display = 'none';
    if (ui.livesGroup) ui.livesGroup.style.display = 'none';
  } else {
    ui.timeGroup.style.display = 'none';
    if (ui.livesGroup) ui.livesGroup.style.display = '';
  }
});
ui.langSelect?.addEventListener('change', () => {
  applyTranslations(ui.langSelect.value);
  // 언어 변경 시 난이도 정보도 업데이트
  updateDifficultyUI();
});

// 점수 시스템 드롭다운
const scoreSystemToggle = document.getElementById('scoreSystemToggle');
const scoreSystemInfo = document.querySelector('.score-system-info');
scoreSystemToggle?.addEventListener('click', () => {
  scoreSystemInfo?.classList.toggle('open');
});

ui.difficultySelect?.addEventListener('change', () => {
  updateDifficultyUI();
});

// 커스텀 난이도 입력값 변경 시 프리뷰 업데이트
const syncInputs = [
  { range: ui.customSpawnInput, number: ui.customSpawnNumber },
  { range: ui.customSpeedInput, number: ui.customSpeedNumber },
  { range: ui.customSizeMinInput, number: ui.customSizeMinNumber },
  { range: ui.customSizeMaxInput, number: ui.customSizeMaxNumber },
];

syncInputs.forEach(({ range, number }) => {
  // 슬라이더 변경 시
  range?.addEventListener('input', () => {
    if (number) number.value = range.value;
    updateCustomPreview();
  });
  
  // 숫자 입력 변경 시
  number?.addEventListener('input', () => {
    if (range) range.value = number.value;
    updateCustomPreview();
  });
});

function updateCustomPreview() {
  if (ui.difficultySelect.value === 'custom') {
    // 공 크기 미리보기 업데이트
    const minSize = parseInt(ui.customSizeMinInput?.value || '20');
    const maxSize = parseInt(ui.customSizeMaxInput?.value || '50');
    drawBallPreview(ui.previewBallMin, minSize);
    drawBallPreview(ui.previewBallMax, maxSize);
    
    // 난이도 정보 업데이트
    updateDifficultyUI();
  }
}

// livesGroup 캐싱 (ui.js에 없을 수 있으니 동적)
ui.livesGroup = document.getElementById('livesGroup');
// 초기 언어 적용 후 화면 표시
applyTranslations(ui.langSelect?.value || 'ko');
// 모드별 입력란 표시 초기화
const initialMode = ui.modeSelect.value;
if (initialMode === 'timed') {
  ui.timeGroup.style.display = '';
  if (ui.livesGroup) ui.livesGroup.style.display = 'none';
} else if (initialMode === 'infinite') {
  ui.timeGroup.style.display = 'none';
  if (ui.livesGroup) ui.livesGroup.style.display = 'none';
} else {
  ui.timeGroup.style.display = 'none';
  if (ui.livesGroup) ui.livesGroup.style.display = '';
}
showScreen('start');
// 프리뷰 초기화 및 시작
initPreview();
updateDifficultyUI();
startPreview();

// 첫 번째 배경색 버튼 활성화
const firstColorBtn = document.querySelector('.btn-color');
if (firstColorBtn) firstColorBtn.classList.add('active');

function updateDifficultyUI() {
  const level = ui.difficultySelect?.value || 'normal';
  
  // 커스텀 설정 표시/숨김 (고급 패널 내에서)
  if (level === 'custom') {
    ui.customSettings.style.display = 'block';
    // 고급 패널 자동 열기
    ui.advancedPanel?.classList.add('open');
    // 초기 공 미리보기 그리기
    const minSize = parseInt(ui.customSizeMinInput?.value || '20');
    const maxSize = parseInt(ui.customSizeMaxInput?.value || '50');
    drawBallPreview(ui.previewBallMin, minSize);
    drawBallPreview(ui.previewBallMax, maxSize);
  } else {
    ui.customSettings.style.display = 'none';
  }
  
  // 커스텀 값 가져오기
  const customValues = level === 'custom' ? {
    spawnInterval: parseInt(ui.customSpawnInput?.value || '600'),
    speed: parseFloat(ui.customSpeedInput?.value || '2.75'),
    sizeMin: parseInt(ui.customSizeMinInput?.value || '20'),
    sizeMax: parseInt(ui.customSizeMaxInput?.value || '50'),
  } : null;
  
  const d = applyDifficulty(level, customValues);
  const currentLang = ui.langSelect?.value || 'ko';
  const desc = getDifficultyDescription(level, customValues, currentLang);
  
  updateDifficultyInfo(desc);
  setPreviewDifficulty(d);
}

function startGame() {
  gameState = 'playing';
  score = 0;
  stopPreview();
  currentGameMode = ui.modeSelect?.value || 'standard';
  // 시간 제한 모드와 연습 모드는 목숨 무제한
  if (currentGameMode === 'timed' || currentGameMode === 'infinite') {
    lives = Infinity;
  } else {
    const inputLives = parseInt(ui.livesInput?.value ?? DEFAULTS.INITIAL_LIVES, 10);
    lives = Number.isFinite(inputLives) ? Math.max(1, Math.min(10, inputLives)) : DEFAULTS.INITIAL_LIVES;
  }
  const level = ui.difficultySelect?.value || 'normal';
  
  // 커스텀 난이도 값 가져오기
  const customValues = level === 'custom' ? {
    spawnInterval: parseInt(ui.customSpawnInput?.value || '600'),
    speed: parseFloat(ui.customSpeedInput?.value || '2.75'),
    sizeMin: parseInt(ui.customSizeMinInput?.value || '20'),
    sizeMax: parseInt(ui.customSizeMaxInput?.value || '50'),
  } : null;
  
  const d = applyDifficulty(level, customValues);
  DOT_SPAWN_INTERVAL = d.DOT_SPAWN_INTERVAL;
  DOT_SPEED_MIN = d.DOT_SPEED_MIN;
  DOT_SPEED_MAX = d.DOT_SPEED_MAX;
  DOT_SIZE_MIN = d.DOT_SIZE_MIN;
  DOT_SIZE_MAX = d.DOT_SIZE_MAX;
  const m = applyMode(currentGameMode, parseInt(ui.timeLimitInput?.value ?? '60', 10));
  remainingTime = m.remainingTime;
  setupTimer(currentGameMode);
  dots = [];
  dotIdCounter = 0;
  lastSpawnTime = Date.now();
  updateHUD();
  showScreen('game');
  
  // 종료 버튼은 연습 모드(무제한)에서만 표시
  if (ui.quitBtn) {
    ui.quitBtn.style.display = currentGameMode === 'infinite' ? 'block' : 'none';
  }
  
  // 게임 화면에도 프레임 표시 (현재 창 크기가 아닐 경우에만)
  const gameScreen = document.getElementById('gameScreen');
  const startScreen = document.getElementById('startScreen');
  if (gameScreen) {
    const width = parseInt(ui.screenWidthInput?.value || '1920');
    const height = parseInt(ui.screenHeightInput?.value || '1080');
    
    // 시작 화면에 프레임이 있는 경우에만 게임 화면에도 추가
    if (startScreen && startScreen.classList.contains('with-frame')) {
      gameScreen.classList.add('with-frame');
      gameScreen.style.setProperty('--frame-width', `${width}px`);
      gameScreen.style.setProperty('--frame-height', `${height}px`);
      updateFrameColor(currentBgColor);
    } else {
      gameScreen.classList.remove('with-frame');
    }
  }
  
  setupCanvas();
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  gameLoop();
}

function gameLoop() {
  updateDots();
  spawnNewDot();
  clearCanvas();
  drawDots(dots);
  animationFrameId = requestAnimationFrame(gameLoop);
}

function updateDots() {
  const gameAreaRect = document.getElementById('gameArea').getBoundingClientRect();
  const gameAreaHeight = gameAreaRect.height;
  const mode = ui.modeSelect?.value || 'standard';
  for (let i = dots.length - 1; i >= 0; i--) {
    const dot = dots[i];
    dot.y += dot.speed;
    if (dot.y > gameAreaHeight) {
      dots.splice(i, 1);
      // 시간 제한 모드나 연습 모드가 아닐 때만 목숨 감소
      if (mode !== 'timed' && mode !== 'infinite') {
        lives--;
        updateHUD();
        if (lives <= 0) { endGame(); return; }
      }
    }
  }
}

function spawnNewDot() {
  const currentTime = Date.now();
  if (currentTime - lastSpawnTime > DOT_SPAWN_INTERVAL) {
    lastSpawnTime = currentTime;
    const rect = document.getElementById('gameArea').getBoundingClientRect();
    const newDot = randomDot(dotIdCounter++, rect, DOT_SIZE_MIN, DOT_SIZE_MAX, DOT_SPEED_MIN, DOT_SPEED_MAX);
    dots.push(newDot);
  }
}

function handlePointerDown(event) {
  if (gameState !== 'playing') return;
  const hitId = hitTest(dots, event.clientX, event.clientY);
  if (hitId != null) {
    const dot = dots.find(d => d.id === hitId);
    if (dot) {
      // 크기별 점수 계산 (작을수록 높은 점수)
      const points = calculatePoints(dot.size);
      score += points;
      
      // 사운드 재생 (크기별 다른 음높이)
      playClickSound(dot.size);
      
      removeDot(hitId);
      updateHUD();
      addClickEffect(event.clientX, event.clientY, points);
    }
  }
}

// 크기별 점수 계산
function calculatePoints(size) {
  if (size <= 20) return 30;      // 매우 작음: 30점
  if (size <= 30) return 20;      // 작음: 20점
  if (size <= 40) return 15;      // 중간: 15점
  if (size <= 50) return 10;      // 큼: 10점
  return 5;                        // 매우 큼: 5점
}

// 클릭 사운드 재생
function playClickSound(size) {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  // 크기에 따라 음높이 조정 (작을수록 높은 음)
  const frequency = 800 - (size * 8); // 20px: 640Hz, 50px: 400Hz
  oscillator.frequency.value = frequency;
  oscillator.type = 'sine';
  
  // 볼륨 조정
  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.1);
}

function removeDot(dotId) {
  const index = dots.findIndex(d => d.id === dotId);
  if (index > -1) dots.splice(index, 1);
}

function endGame(reason = 'gameover') {
  gameState = 'gameOver';
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  if (timerIntervalId) { clearInterval(timerIntervalId); timerIntervalId = null; }
  clearCanvas();
  updateFinalScore(score);
  
  // 게임 모드 정보 업데이트
  const lang = ui.langSelect?.value || 'ko';
  updateGameModeInfo(currentGameMode, lang);
  
  // 종료 이유에 따라 제목 변경
  const gameOverTitle = document.getElementById('gameOverTitle');
  if (reason === 'quit') {
    const quitTexts = { ko: '게임 종료', en: 'Game Quit', ja: 'ゲーム終了' };
    if (gameOverTitle) gameOverTitle.textContent = quitTexts[lang] || quitTexts.ko;
  } else {
    const gameOverTexts = { ko: '게임 오버', en: 'Game Over', ja: 'ゲームオーバー' };
    if (gameOverTitle) gameOverTitle.textContent = gameOverTexts[lang] || gameOverTexts.ko;
  }
  
  showScreen('gameOver');
  // 게임 오버 후 시작 화면으로 돌아가면 프리뷰를 다시 켜기 위해 약간 지연 후 실행
  setTimeout(() => {
    if (document.getElementById('startScreen') && document.getElementById('startScreen').classList.contains('hidden') === false) {
      startPreview();
    }
  }, 300);
}

function setupTimer(mode) {
  if (timerIntervalId) { clearInterval(timerIntervalId); timerIntervalId = null; }
  if (mode === 'timed' && remainingTime != null) {
    updateTimerDisplay(remainingTime);
    timerIntervalId = setInterval(() => {
      if (gameState !== 'playing') return;
      remainingTime = Math.max(0, remainingTime - 1);
      updateTimerDisplay(remainingTime);
      if (remainingTime <= 0) endGame();
    }, 1000);
  } else {
    updateTimerDisplay(null);
  }
}

window.addEventListener('resize', () => {
  if (gameState === 'playing') setupCanvas();
});

function updateHUD() {
  updateScore(score);
  updateLives(lives);
}

function isInfiniteLivesMode() {
  return (document.getElementById('modeSelect')?.value || 'standard') === 'infinite';
}

function addClickEffect(x, y, points = 10) {
  const effect = document.createElement('div');
  effect.style.position = 'fixed';
  effect.style.left = x + 'px';
  effect.style.top = y + 'px';
  effect.style.width = '40px';
  effect.style.height = '40px';
  effect.style.borderRadius = '50%';
  // 점수에 따라 색상 변경
  const color = points >= 30 ? '#ef4444' : points >= 20 ? '#f59e0b' : points >= 15 ? '#10b981' : '#3b82f6';
  effect.style.backgroundColor = color;
  effect.style.pointerEvents = 'none';
  effect.style.zIndex = '1000';
  effect.textContent = '+' + points;
  effect.style.color = 'white';
  effect.style.fontWeight = 'bold';
  effect.style.fontSize = '16px';
  effect.style.display = 'flex';
  effect.style.alignItems = 'center';
  effect.style.justifyContent = 'center';
  effect.style.animation = 'rise 0.6s ease-out forwards';
  effect.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
  const style = document.createElement('style');
  style.textContent = `@keyframes rise { from { opacity: 1; transform: translateY(0px) scale(1);} to { opacity: 0; transform: translateY(-60px) scale(1.2);} }`;
  if (!document.querySelector('style[data-rise-animation]')) { style.setAttribute('data-rise-animation','true'); document.head.appendChild(style);}    
  document.body.appendChild(effect);
  setTimeout(() => effect.remove(), 600);
}
