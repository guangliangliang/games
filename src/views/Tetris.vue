<template>
  <div class="game-container">
    <header>
      <BackButton />
      <h1>🧱 俄罗斯方块</h1>
    </header>
    <main>
      <div class="game-info">
        <div class="score-box">
          <div class="score-label">分数</div>
          <div class="score-value">{{ score }}</div>
        </div>
        <div class="score-box">
          <div class="score-label">最高分</div>
          <div class="score-value">{{ highScore }}</div>
        </div>
        <div class="score-box">
          <div class="score-label">等级</div>
          <div class="score-value">{{ level }}</div>
        </div>
        <div class="score-box">
          <div class="score-label">消除</div>
          <div class="score-value">{{ lines }}</div>
        </div>
      </div>
      <div class="game-layout">
        <div class="board-container">
          <canvas ref="canvasRef" width="300" height="600" @touchstart="handleTouchStart" @touchend="handleTouchEnd"></canvas>
          <div class="game-status" v-if="gameOver">游戏结束!</div>
          <div class="game-status" v-if="gamePaused && gameRunning">
            游戏暂停
          </div>
        </div>
        <div class="side-panel">
          <div class="next-piece">
            <h3>下一个</h3>
            <canvas ref="nextCanvas" width="120" height="120"></canvas>
          </div>
          <div class="controls-info">
            <h3>操作说明</h3>
            <p>← → 左右移动</p>
            <p>↑ 旋转方块</p>
            <p>↓ 加速下落</p>
            <p>空格 快速落下</p>
            <p>P键 暂停</p>
          </div>
        </div>
      </div>
      
      <!-- 虚拟控制按钮 - 移动端优先 -->
      <div class="virtual-controls">
        <div class="virtual-row">
          <button class="virtual-btn virtual-btn-left" :class="{ 'virtual-btn-disabled': !gameRunning || gamePaused }" @touchstart.prevent="moveLeft" @mousedown.prevent="moveLeft">
            <span class="btn-icon">←</span>
            <span class="btn-label">左移</span>
          </button>
          <button class="virtual-btn virtual-btn-rotate" :class="{ 'virtual-btn-disabled': !gameRunning || gamePaused }" @touchstart.prevent="rotatePiece" @mousedown.prevent="rotatePiece">
            <span class="btn-icon">↻</span>
            <span class="btn-label">旋转</span>
          </button>
          <button class="virtual-btn virtual-btn-right" :class="{ 'virtual-btn-disabled': !gameRunning || gamePaused }" @touchstart.prevent="moveRight" @mousedown.prevent="moveRight">
            <span class="btn-icon">→</span>
            <span class="btn-label">右移</span>
          </button>
        </div>
        <div class="virtual-row">
          <button class="virtual-btn virtual-btn-down" :class="{ 'virtual-btn-disabled': !gameRunning || gamePaused }" @touchstart.prevent="moveDown" @mousedown.prevent="moveDown">
            <span class="btn-icon">↓</span>
            <span class="btn-label">加速</span>
          </button>
          <button class="virtual-btn virtual-btn-drop" :class="{ 'virtual-btn-disabled': !gameRunning || gamePaused }" @touchstart.prevent="hardDropWrapped" @mousedown.prevent="hardDropWrapped">
            <span class="btn-icon">⬇</span>
            <span class="btn-label">速降</span>
          </button>
        </div>
      </div>
      <div class="controls">
        <button
          @click="startGame"
          class="btn btn-primary"
          :disabled="gameRunning && !gamePaused"
        >
          {{ gamePaused ? '继续' : (gameRunning ? '游戏进行中' : '开始游戏') }}</button
        ><button
          v-if="gameRunning"
          @click="togglePause"
          class="btn btn-secondary"
        >
          {{ gamePaused ? '继续' : '暂停' }}</button
        ><button @click="restartGame" class="btn btn-primary">重新开始</button>
      </div>
      <div class="game-rules">
        <h3>游戏规则</h3>
        <ul>
          <li>移动、旋转和放置方块</li>
          <li>填满一行即可消除得分</li>
          <li>消除越多分数越高</li>
          <li>方块堆到顶部游戏结束</li>
        </ul>
      </div>
    </main>
    <PageFooter copyright="经典益智游戏 | 休闲娱乐必备" />
    <GameResultDialog
      v-model="showResultDialog"
      title="游戏结束"
      :message="resultMessage"
      icon="🧱"
      :score="score"
      confirm-text="再来一局"
      show-cancel
      cancel-text="返回主页"
      @confirm="restartGame"
      @cancel="goHome"
    />
  </div>
</template>
<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import GameResultDialog from "../components/GameResultDialog.vue";
import BackButton from "../components/BackButton.vue";
import PageFooter from "../components/PageFooter.vue";
const router = useRouter();
const canvasRef = ref(null);
const nextCanvas = ref(null);
const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30;
const COLORS = [
  "#000000",
  "#00f5f5",
  "#0000f5",
  "#f5a500",
  "#f5f500",
  "#00f500",
  "#a500f5",
  "#f50000",
];
const SHAPES = [
  [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  [
    [2, 0, 0],
    [2, 2, 2],
    [0, 0, 0],
  ],
  [
    [0, 0, 3],
    [3, 3, 3],
    [0, 0, 0],
  ],
  [
    [4, 4],
    [4, 4],
  ],
  [
    [0, 5, 5],
    [5, 5, 0],
    [0, 0, 0],
  ],
  [
    [0, 6, 0],
    [6, 6, 6],
    [0, 0, 0],
  ],
  [
    [7, 7, 0],
    [0, 7, 7],
    [0, 0, 0],
  ],
];
let board = [];
let currentPiece = null;
let nextPiece = null;
let currentX = 0;
let currentY = 0;
const score = ref(0);
const highScore = ref(parseInt(localStorage.getItem("tetris-high")) || 0);
const lines = ref(0);
const level = ref(1);
const gameRunning = ref(false);
const gamePaused = ref(false);
const gameOver = ref(false);
const showResultDialog = ref(false);
const resultMessage = ref("");
let gameLoop = null;
let dropInterval = 1000;
const createBoard = () => {
  board = [];
  for (let r = 0; r < ROWS; r++) {
    board[r] = [];
    for (let c = 0; c < COLS; c++) {
      board[r][c] = 0;
    }
  }
};
const newPiece = () => {
  const rand = Math.floor(Math.random() * SHAPES.length);
  return { shape: SHAPES[rand].map((row) => [...row]), color: rand + 1 };
};
const drawBlock = (ctx, x, y, color, size = BLOCK_SIZE) => {
  if (color === 0) return;
  ctx.fillStyle = COLORS[color];
  ctx.fillRect(x + 1, y + 1, size - 2, size - 2);
  ctx.shadowColor = COLORS[color];
  ctx.shadowBlur = 5;
  ctx.strokeStyle = "rgba(255,255,255,0.3)";
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 1, y + 1, size - 2, size - 2);
  ctx.shadowBlur = 0;
};
const drawBoard = () => {
  const ctx = canvasRef.value.getContext("2d");
  ctx.fillStyle = "#1a1a2e";
  ctx.fillRect(0, 0, 300, 600);
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      drawBlock(ctx, c * BLOCK_SIZE, r * BLOCK_SIZE, board[r][c]);
  if (currentPiece) {
    for (let r = 0; r < currentPiece.shape.length; r++)
      for (let c = 0; c < currentPiece.shape[r].length; c++)
        if (currentPiece.shape[r][c])
          drawBlock(
            ctx,
            (currentX + c) * BLOCK_SIZE,
            (currentY + r) * BLOCK_SIZE,
            currentPiece.color,
          );
  }
};
const drawNextPiece = () => {
  const ctx = nextCanvas.value.getContext("2d");
  ctx.fillStyle = "#1a1a2e";
  ctx.fillRect(0, 0, 120, 120);
  if (nextPiece) {
    const offsetX = (120 - nextPiece.shape[0].length * 25) / 2;
    const offsetY = (120 - nextPiece.shape.length * 25) / 2;
    for (let r = 0; r < nextPiece.shape.length; r++)
      for (let c = 0; c < nextPiece.shape[r].length; c++)
        if (nextPiece.shape[r][c])
          drawBlock(
            ctx,
            offsetX + c * 25,
            offsetY + r * 25,
            nextPiece.color,
            25,
          );
  }
};
const collision = (piece, offsetX, offsetY) => {
  for (let r = 0; r < piece.shape.length; r++) {
    for (let c = 0; c < piece.shape[r].length; c++) {
      if (piece.shape[r][c]) {
        const newX = currentX + c + offsetX;
        const newY = currentY + r + offsetY;
        if (newX < 0 || newX >= COLS || newY >= ROWS) return true;
        if (newY >= 0 && board[newY][newX]) return true;
      }
    }
  }
  return false;
};
const rotate = (piece) => {
  const newPiece = { shape: [], color: piece.color };
  for (let c = 0; c < piece.shape[0].length; c++) {
    const newRow = [];
    for (let r = piece.shape.length - 1; r >= 0; r--)
      newRow.push(piece.shape[r][c]);
    newPiece.shape.push(newRow);
  }
  return newPiece;
};
const lockPiece = () => {
  for (let r = 0; r < currentPiece.shape.length; r++)
    for (let c = 0; c < currentPiece.shape[r].length; c++)
      if (currentPiece.shape[r][c])
        if (currentY + r >= 0)
          board[currentY + r][currentX + c] = currentPiece.color;
  let clearedLines = 0;
  for (let r = ROWS - 1; r >= 0; r--) {
    if (board[r].every((cell) => cell !== 0)) {
      board.splice(r, 1);
      board.unshift(Array(COLS).fill(0));
      clearedLines++;
      r++;
    }
  }
  if (clearedLines > 0) {
    const points = [0, 100, 300, 500, 800];
    score.value += points[clearedLines] * level.value;
    lines.value += clearedLines;
    level.value = Math.floor(lines.value / 10) + 1;
    dropInterval = Math.max(100, 1000 - (level.value - 1) * 100);
    if (score.value > highScore.value) {
      highScore.value = score.value;
      localStorage.setItem("tetris-high", highScore.value);
    }
  }
  currentPiece = nextPiece;
  nextPiece = newPiece();
  currentX = Math.floor(COLS / 2) - 1;
  currentY = 0;
  if (collision(currentPiece, 0, 0)) endGame();
};
const drop = () => {
  if (!collision(currentPiece, 0, 1)) currentY++;
  else lockPiece();
};
const hardDrop = () => {
  while (!collision(currentPiece, 0, 1)) {
    currentY++;
    score.value += 2;
  }
  lockPiece();
};
const endGame = () => {
  gameOver.value = true;
  gameRunning.value = false;
  clearInterval(gameLoop);
  resultMessage.value = `最终得分: ${score.value}`;
  setTimeout(() => {
    showResultDialog.value = true;
  }, 500);
};
const startGame = () => {
  if (gameRunning.value && gamePaused.value) {
    // 游戏暂停中，继续游戏
    gamePaused.value = false;
    return;
  }
  if (gameRunning.value && !gamePaused.value) return;
  // 开始新游戏
  createBoard();
  score.value = 0;
  lines.value = 0;
  level.value = 1;
  dropInterval = 1000;
  gameOver.value = false;
  gamePaused.value = false;
  showResultDialog.value = false;
  currentPiece = newPiece();
  nextPiece = newPiece();
  currentX = Math.floor(COLS / 2) - 1;
  currentY = 0;
  gameRunning.value = true;
  gameLoop = setInterval(() => {
    if (!gamePaused.value) {
      drop();
      drawBoard();
      drawNextPiece();
    }
  }, dropInterval);
  drawBoard();
  drawNextPiece();
};
const togglePause = () => {
  if (!gameRunning.value) return;
  gamePaused.value = !gamePaused.value;
};
const restartGame = () => {
  clearInterval(gameLoop);
  // 完全重置到初始状态
  createBoard();
  score.value = 0;
  lines.value = 0;
  level.value = 1;
  dropInterval = 1000;
  gameOver.value = false;
  gamePaused.value = false;
  showResultDialog.value = false;
  gameRunning.value = false;
  currentPiece = null;
  nextPiece = null;
  drawBoard();
  drawNextPiece();
};
const goHome = () => {
  clearInterval(gameLoop);
  router.push("/");
};

// 虚拟控制按钮函数
const moveLeft = () => {
  if (!gameRunning.value || gamePaused.value) return;
  if (!collision(currentPiece, -1, 0)) currentX--;
  drawBoard();
};

const moveRight = () => {
  if (!gameRunning.value || gamePaused.value) return;
  if (!collision(currentPiece, 1, 0)) currentX++;
  drawBoard();
};

const moveDown = () => {
  if (!gameRunning.value || gamePaused.value) return;
  if (!collision(currentPiece, 0, 1)) {
    currentY++;
    score.value += 1;
  }
  drawBoard();
};

const rotatePiece = () => {
  if (!gameRunning.value || gamePaused.value) return;
  const rotated = rotate(currentPiece);
  if (!collision(rotated, 0, 0)) currentPiece = rotated;
  drawBoard();
};

const hardDropWrapped = () => {
  if (!gameRunning.value || gamePaused.value) return;
  hardDrop();
  drawBoard();
};

// 触摸事件相关
let touchStartX = 0;
let touchStartY = 0;

const handleTouchStart = (e) => {
  e.preventDefault();
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
};

const handleTouchEnd = (e) => {
  e.preventDefault();
  const touchEndX = e.changedTouches[0].clientX;
  const touchEndY = e.changedTouches[0].clientY;
  const dx = touchEndX - touchStartX;
  const dy = touchEndY - touchStartY;

  if (!gameRunning.value || gamePaused.value) return;

  if (Math.abs(dx) > Math.abs(dy)) {
    if (Math.abs(dx) > 30) {
      if (dx > 0) {
        if (!collision(currentPiece, 1, 0)) currentX++;
      } else {
        if (!collision(currentPiece, -1, 0)) currentX--;
      }
    }
  } else {
    if (Math.abs(dy) > 30) {
      if (dy > 0) {
        if (!collision(currentPiece, 0, 1)) {
          currentY++;
          score.value += 1;
        }
      } else {
        const rotated = rotate(currentPiece);
        if (!collision(rotated, 0, 0)) currentPiece = rotated;
      }
    }
  }
  drawBoard();
};

const handleKeyDown = (e) => {
  if (!gameRunning.value) {
    if (e.key === "Enter") {
      e.preventDefault();
      startGame();
    }
    return;
  }
  if (gamePaused.value) {
    if (e.key === "p" || e.key === "P" || e.key === "Enter") {
      e.preventDefault();
      togglePause();
    }
    return;
  }
  switch (e.key) {
    case "ArrowLeft":
      e.preventDefault();
      if (!collision(currentPiece, -1, 0)) currentX--;
      break;
    case "ArrowRight":
      e.preventDefault();
      if (!collision(currentPiece, 1, 0)) currentX++;
      break;
    case "ArrowDown":
      e.preventDefault();
      if (!collision(currentPiece, 0, 1)) {
        currentY++;
        score.value += 1;
      }
      break;
    case "ArrowUp":
      e.preventDefault();
      const rotated = rotate(currentPiece);
      if (!collision(rotated, 0, 0)) currentPiece = rotated;
      break;
    case " ":
      e.preventDefault();
      hardDrop();
      break;
    case "p":
    case "P":
      togglePause();
      break;
  }
  drawBoard();
};
onMounted(() => {
  createBoard();
  drawBoard();
  window.addEventListener("keydown", handleKeyDown);
});
onUnmounted(() => {
  window.removeEventListener("keydown", handleKeyDown);
  clearInterval(gameLoop);
});
</script>
<style scoped>
.game-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
}
header {
  position: relative;
  text-align: center;
  color: white;
  margin-bottom: 30px;
}
h1 {
  font-size: 3em;
  margin: 0;
  padding-left: 80px;
  color: #ffffff;
  text-shadow: 0 0 10px rgba(255,255,255,0.8),0 0 20px rgba(102,126,234,0.6),0 2px 4px rgba(0,0,0,0.5);
  animation: titlePulse 2s ease-in-out infinite;
}

@keyframes titlePulse {
  0%,100% { transform: scale(1); }
  50% { transform: scale(1.02); }
}
.back-link {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  color: white;
  text-decoration: none;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}
main {
  background: linear-gradient(135deg, #fff, #f8f9fa);
  border-radius: 20px;
  padding: 30px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}
.game-info {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  margin-bottom: 25px;
  flex-wrap: wrap;
}
.score-box {
  background: linear-gradient(135deg, #667eea, #764ba2);
  padding: 8px 20px;
  border-radius: 10px;
  text-align: center;
  min-width: 90px;
}
.score-label {
  color: #ddd;
  font-size: 0.85em;
  font-weight: bold;
}
.score-value {
  color: white;
  font-size: 1.5em;
  font-weight: bold;
}
.game-status {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.8);
  color: #ff6b6b;
  padding: 20px 40px;
  border-radius: 15px;
  font-size: 1.8em;
  font-weight: bold;
  z-index: 10;
}
.game-layout {
  display: flex;
  justify-content: center;
  gap: 30px;
  align-items: flex-start;
}
.board-container {
  position: relative;
}
.side-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.next-piece {
  background: #2a2a44;
  padding: 20px;
  border-radius: 15px;
  text-align: center;
}
.next-piece h3 {
  color: white;
  margin: 0 0 15px 0;
}
.controls-info {
  background: linear-gradient(135deg, #f5f7fa, #c3cfe2);
  padding: 20px;
  border-radius: 15px;
}
.controls-info h3 {
  color: #667eea;
  margin: 0 0 15px 0;
}
.controls-info p {
  color: #555;
  margin: 8px 0;
}
.controls {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin: 25px 0;
  flex-wrap: wrap;
}
.btn {
  padding: 14px 35px;
  font-size: 1.1em;
  border: none;
  border-radius: 30px;
  cursor: pointer;
  transition: all 0.3s;
  font-weight: bold;
}
.btn-primary {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}
.btn-secondary {
  background: linear-gradient(135deg, #f093fb, #f5576c);
  color: white;
  box-shadow: 0 6px 20px rgba(245, 87, 108, 0.4);
}
.game-rules {
  margin-top: 30px;
  padding: 25px;
  background: linear-gradient(135deg, #ffecd2, #fcb69f);
  border-radius: 15px;
}
.game-rules h3 {
  color: #e74c3c;
  margin-bottom: 15px;
  text-align: center;
}
.game-rules ul {
  list-style: none;
  padding-left: 0;
}
.game-rules li {
  padding: 10px 0;
  padding-left: 25px;
  position: relative;
  color: #333;
}
footer {
  text-align: center;
  color: white;
  margin-top: 30px;
  padding: 20px;
  opacity: 0.9;
}
canvas {
  background: #1a1a2e;
  border-radius: 10px;
  box-shadow: 0 0 30px rgba(102, 126, 234, 0.3);
  border: 3px solid #667eea;
}
/* 虚拟控制按钮样式 - 桌面端 */
.virtual-controls {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  margin: 25px 0;
  padding: 20px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.05), rgba(118, 75, 162, 0.05));
  border-radius: 20px;
}

.virtual-row {
  display: flex;
  gap: 12px;
}

.virtual-btn {
  width: 80px;
  height: 80px;
  font-size: 2.2em;
  border: none;
  border-radius: 18px;
  cursor: pointer;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.5);
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 4px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  user-select: none;
  -webkit-user-select: none;
}

.virtual-btn .btn-icon {
  font-size: 1.3em;
  line-height: 1;
}

.virtual-btn .btn-label {
  font-size: 0.45em;
  font-weight: 600;
  line-height: 1;
}

.virtual-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.6);
}

.virtual-btn:active {
  transform: scale(0.95);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.virtual-btn-disabled {
  opacity: 0.4;
  cursor: not-allowed;
  pointer-events: none;
  background: linear-gradient(135deg, #888, #666);
}

@media (max-width: 768px) {
  h1 {
    font-size: 2em;
  }

  .game-container {
    padding: 8px;
  }

  main {
    padding: 16px;
  }

  .game-layout {
    flex-direction: column;
    align-items: center;
    gap: 16px;
  }

  /* 增强虚拟控制按钮的移动端样式 */
  .virtual-controls {
    gap: 12px;
    margin: 24px 0;
    padding: 16px;
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1));
    border-radius: 24px;
  }

  .virtual-row {
    gap: 12px;
  }

  .virtual-btn {
    width: 100px;
    height: 100px;
    font-size: 2.8em;
    border-radius: 24px;
    box-shadow: 0 8px 24px rgba(102, 126, 234, 0.5);
    border: 3px solid rgba(255, 255, 255, 0.3);
  }

  .virtual-btn .btn-icon {
    font-size: 1.5em;
  }

  .virtual-btn .btn-label {
    font-size: 0.4em;
    font-weight: bold;
  }

  .virtual-btn:hover, .virtual-btn:active {
    transform: scale(0.95);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  }

  canvas {
    max-width: 100%;
    height: auto;
  }

  .side-panel {
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: center;
    width: 100%;
  }

  .game-info {
    gap: 10px;
  }

  .score-box {
    min-width: 70px;
    padding: 6px 12px;
  }
}
</style>
