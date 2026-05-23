<template>
  <div class="game-container">
    <header>
      <BackButton />
      <h1>⭕⭕ 井字棋</h1>
    </header>
    <main>
      <div class="game-info">
        <div class="mode-selector">
          <label>游戏模式：</label
          ><select
            v-model="gameMode"
            @change="restartGame"
            :disabled="gameRunning"
          >
            <option value="pve">人机对战</option>
            <option value="pvp">双人对战</option>
          </select>
        </div>
        <div class="difficulty-selector" v-if="gameMode === 'pve'">
          <label>难度：</label
          ><select
            v-model="difficulty"
            @change="restartGame"
            :disabled="gameRunning"
          >
            <option value="easy">简单</option>
            <option value="medium">中等</option>
            <option value="hard">困难</option>
          </select>
        </div>
        <div class="current-player" v-if="gameMode === 'pve'">
          当前: <span>{{ currentPlayer === 1 ? "玩家(⭕)" : "电脑(❌)" }}</span>
        </div>
        <div class="current-player" v-else>
          当前玩家: <span>{{ currentPlayer === 1 ? "⭕" : "❌" }}</span>
        </div>
        <div class="game-status" v-if="gameStatus">{{ gameStatus }}</div>
      </div>
      <div class="board-container">
        <canvas
          ref="canvasRef"
          width="300"
          height="300"
          @click="handleCanvasClick"
        ></canvas>
      </div>
      <div class="controls">
        <button @click="restartGame" class="btn btn-primary">重新开始</button>
      </div>
      <div class="game-controls">
        <h3>操作说明</h3>
        <div class="control-methods">
          <div class="control-item">
            <strong>人机对战</strong>
            <p>玩家下⭕，电脑下❌，点击棋盘落子</p>
          </div>
          <div class="control-item">
            <strong>双人对战</strong>
            <p>两人轮流下，交替下⭕和❌</p>
          </div>
        </div>
      </div>
      <div class="game-rules">
        <h3>游戏规则</h3>
        <ul>
          <li>横、竖、斜连成三子获胜</li>
          <li>棋盘占满则平局</li>
          <li>人机模式中电脑可用Minimax算法（困难模式）</li>
        </ul>
      </div>
    </main>
    <footer><p>经典益智游戏 - 井字棋</p></footer>
    <GameResultDialog
      v-model="showResultDialog"
      :title="resultTitle"
      :message="resultMessage"
      :icon="resultIcon"
      confirm-text="再来一局"
      @confirm="restartGame"
    ></GameResultDialog>
  </div>
</template>
<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import GameResultDialog from "../components/GameResultDialog.vue";
import BackButton from "../components/BackButton.vue";
const router = useRouter();
const canvasRef = ref(null);
const board = ref([]);
const currentPlayer = ref(1);
const gameStatus = ref("");
const gameOver = ref(false);
const gameRunning = ref(false);
const gameMode = ref("pve");
const difficulty = ref("hard");
const showResultDialog = ref(false);
const resultTitle = ref("");
const resultMessage = ref("");
const resultIcon = ref("");
const cellSize = 100;
const initBoard = () => {
  board.value = [];
  for (let i = 0; i < 9; i++) {
    board.value.push(0);
  }
};
const drawBoard = () => {
  const canvas = canvasRef.value;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#f8f9fa";
  ctx.fillRect(0, 0, 300, 300);
  ctx.strokeStyle = "#667eea";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(100, 0);
  ctx.lineTo(100, 300);
  ctx.moveTo(200, 0);
  ctx.lineTo(200, 300);
  ctx.moveTo(0, 100);
  ctx.lineTo(300, 100);
  ctx.moveTo(0, 200);
  ctx.lineTo(300, 200);
  ctx.stroke();
  for (let i = 0; i < 9; i++) {
    const row = Math.floor(i / 3);
    const col = i % 3;
    if (board.value[i] !== 0) {
      ctx.beginPath();
      if (board.value[i] === 1) {
        ctx.strokeStyle = "#667eea";
        ctx.lineWidth = 8;
        const x = col * 100 + 50;
        const y = row * 100 + 50;
        ctx.arc(x, y, 35, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.strokeStyle = "#e74c3c";
        ctx.lineWidth = 8;
        const x1 = col * 100 + 20;
        const y1 = row * 100 + 20;
        const x2 = col * 100 + 80;
        const y2 = row * 100 + 80;
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.moveTo(x2, y1);
        ctx.lineTo(x1, y2);
        ctx.stroke();
      }
    }
  }
};
const checkWinner = (b) => {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  for (let line of lines) {
    if (
      b[line[0]] !== 0 &&
      b[line[0]] === b[line[1]] &&
      b[line[1]] === b[line[2]]
    ) {
      return b[line[0]];
    }
  }
  if (!b.includes(0)) return 0;
  return null;
};
const minimax = (b, depth, isMaximizing, alpha, beta) => {
  const winner = checkWinner(b);
  if (winner === 2) return 10 - depth;
  if (winner === 1) return depth - 10;
  if (!b.includes(0)) return 0;
  if (isMaximizing) {
    let maxEval = -Infinity;
    for (let i = 0; i < 9; i++) {
      if (b[i] === 0) {
        b[i] = 2;
        const evaluation = minimax(b, depth + 1, false, alpha, beta);
        b[i] = 0;
        maxEval = Math.max(maxEval, evaluation);
        alpha = Math.max(alpha, evaluation);
        if (beta <= alpha) break;
      }
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (let i = 0; i < 9; i++) {
      if (b[i] === 0) {
        b[i] = 1;
        const evaluation = minimax(b, depth + 1, true, alpha, beta);
        b[i] = 0;
        minEval = Math.min(minEval, evaluation);
        beta = Math.min(beta, evaluation);
        if (beta <= alpha) break;
      }
    }
    return minEval;
  }
};
const findBestMove = (b) => {
  let bestScore = -Infinity;
  let bestMove = -1;
  for (let i = 0; i < 9; i++) {
    if (b[i] === 0) {
      b[i] = 2;
      const score = minimax(b, 0, false, -Infinity, Infinity);
      b[i] = 0;
      if (score > bestScore) {
        bestScore = score;
        bestMove = i;
      }
    }
  }
  return bestMove;
};
const getRandomMove = (b) => {
  const empty = [];
  for (let i = 0; i < 9; i++) {
    if (b[i] === 0) empty.push(i);
  }
  return empty[Math.floor(Math.random() * empty.length)];
};
const aiMove = () => {
  if (gameMode.value !== "pve" || currentPlayer.value !== 2 || gameOver.value)
    return;
  setTimeout(() => {
    let move;
    if (difficulty.value === "easy") {
      move = getRandomMove(board.value);
    } else if (difficulty.value === "medium") {
      move =
        Math.random() > 0.3
          ? findBestMove(board.value)
          : getRandomMove(board.value);
    } else {
      move = findBestMove(board.value);
    }
    if (move !== -1) {
      board.value[move] = 2;
      checkGameState();
      if (!gameOver.value) {
        currentPlayer.value = 1;
      }
      drawBoard();
    }
  }, 500);
};
const checkGameState = () => {
  const winner = checkWinner(board.value);
  if (winner === 1) {
    gameOver.value = true;
    gameRunning.value = false;
    gameStatus.value = "🎉 玩家获胜！";
    resultTitle.value = "恭喜获胜";
    resultMessage.value = "你赢了电脑！";
    resultIcon.value = "🎊";
    setTimeout(() => {
      showResultDialog.value = true;
    }, 500);
  } else if (winner === 2) {
    gameOver.value = true;
    gameRunning.value = false;
    gameStatus.value = "😢 电脑获胜";
    resultTitle.value = "游戏结束";
    resultMessage.value = "电脑赢了，再接再厉！";
    resultIcon.value = "😢";
    setTimeout(() => {
      showResultDialog.value = true;
    }, 500);
  } else if (winner === 0) {
    gameOver.value = true;
    gameRunning.value = false;
    gameStatus.value = "🤝 平局！";
    resultTitle.value = "游戏结束";
    resultMessage.value = "平局！势均力敌！";
    resultIcon.value = "🤝";
    setTimeout(() => {
      showResultDialog.value = true;
    }, 500);
  }
};
const handleCanvasClick = (e) => {
  if (gameOver.value) return;
  if (gameMode.value === "pve" && currentPlayer.value !== 1) return;
  const rect = canvasRef.value.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const col = Math.floor(x / cellSize);
  const row = Math.floor(y / cellSize);
  const index = row * 3 + col;
  if (board.value[index] === 0) {
    gameRunning.value = true;
    board.value[index] = currentPlayer.value;
    checkGameState();
    if (!gameOver.value) {
      currentPlayer.value = currentPlayer.value === 1 ? 2 : 1;
      if (gameMode.value === "pve" && currentPlayer.value === 2) {
        aiMove();
      }
    }
    drawBoard();
  }
};
const restartGame = () => {
  initBoard();
  currentPlayer.value = 1;
  gameStatus.value = "";
  gameOver.value = false;
  gameRunning.value = false;
  showResultDialog.value = false;
  drawBoard();
};
onMounted(() => {
  initBoard();
  drawBoard();
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
  text-shadow: 
    0 0 10px rgba(255, 255, 255, 0.8),
    0 0 20px rgba(102, 126, 234, 0.6),
    0 2px 4px rgba(0, 0, 0, 0.5);
  animation: titlePulse 2s ease-in-out infinite;
}

@keyframes titlePulse {
  0%, 100% { transform: scale(1); }
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
.back-link:hover {
  opacity: 1;
  background: rgba(255, 255, 255, 0.25);
  transform: translateY(-50%) translateX(5px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
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
.mode-selector,
.difficulty-selector {
  display: flex;
  align-items: center;
  gap: 10px;
}
.mode-selector label,
.difficulty-selector label {
  font-weight: bold;
  color: #666;
}
.mode-selector select,
.difficulty-selector select {
  padding: 8px 15px;
  border: 2px solid #667eea;
  border-radius: 8px;
  font-size: 1em;
  color: #333;
  background: white;
  cursor: pointer;
}
.mode-selector select:disabled,
.difficulty-selector select:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.current-player {
  font-size: 1.2em;
  font-weight: bold;
}
.current-player span {
  color: #667eea;
}
.game-status {
  font-size: 1.3em;
  font-weight: bold;
  color: #e74c3c;
}
.board-container {
  display: flex;
  justify-content: center;
  margin: 30px 0;
}
canvas {
  background: #f8f9fa;
  border: 3px solid #667eea;
  border-radius: 15px;
  cursor: pointer;
  box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
  outline: none;
  -webkit-tap-highlight-color: transparent;
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
  transition: all 0.3s ease;
  font-weight: bold;
}
.btn-primary {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}
.game-controls,
.game-rules {
  margin-top: 30px;
  padding: 25px;
  border-radius: 15px;
}
.game-controls {
  background: linear-gradient(135deg, #f5f7fa, #c3cfe2);
}
.game-rules {
  background: linear-gradient(135deg, #ffecd2, #fcb69f);
}
.game-controls h3,
.game-rules h3 {
  margin-bottom: 15px;
  text-align: center;
  color: #667eea;
}
.control-methods {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
}
.control-item {
  padding: 15px;
  background: white;
  border-radius: 10px;
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
</style>
