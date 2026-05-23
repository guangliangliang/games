<template>
  <div class="game-container">
    <header>
      <BackButton />
      <h1>🐦 Flappy Bird</h1>
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
        <div class="difficulty-selector">
          <label>难度：</label>
          <button
            v-for="d in difficulties"
            :key="d.value"
            class="difficulty-btn"
            :class="{ active: difficulty === d.value }"
            @click="setDifficulty(d.value)"
            :disabled="gameRunning"
          >
            {{ d.label }}
          </button>
        </div>
        <div class="game-status" v-if="!gameRunning && !showResultDialog">
          点击开始!
        </div>
      </div>
      <div class="board-container">
        <canvas
          ref="canvasRef"
          :width="canvasWidth"
          :height="canvasHeight"
          @click="handleClick"
          @touchstart.prevent="handleClick"
        ></canvas>
        <div class="game-overlay" v-if="!gameRunning && !gameOver">
          点击开始
        </div>
      </div>
      <div class="controls">
        <button
          @click="startGame"
          class="btn btn-primary"
          :disabled="gameRunning"
        >
          开始游戏</button
        ><button @click="restartGame" class="btn btn-primary">重新开始</button>
      </div>
      <div class="game-controls">
        <h3>操作说明</h3>
        <div class="control-methods">
          <div class="control-item">
            <strong>键盘控制</strong>
            <p>空格键/上键/点击屏幕让小鸟飞翔</p>
          </div>
          <div class="control-item">
            <strong>触屏控制</strong>
            <p>点击屏幕让小鸟飞翔</p>
          </div>
        </div>
      </div>
      <div class="game-rules">
        <h3>游戏规则</h3>
        <ul>
          <li>点击让小鸟飞起来</li>
          <li>不要撞到水管和地面</li>
          <li>穿过水管得分</li>
          <li>看看你能得多少分!</li>
        </ul>
      </div>
    </main>
    <footer><p>经典爆款游戏 - Flappy Bird</p></footer>
    <GameResultDialog
      v-model="showResultDialog"
      title="游戏结束"
      :message="resultMessage"
      icon="🐦"
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
import { ref, onMounted, onUnmounted, computed } from "vue";
import { useRouter } from "vue-router";
import GameResultDialog from "../components/GameResultDialog.vue";
import BackButton from "../components/BackButton.vue";
const router = useRouter();
const canvasRef = ref(null);
const canvasWidth = 400;
const canvasHeight = 600;
const difficulties = [
  { label: "简单", value: "easy" },
  { label: "普通", value: "normal" },
  { label: "困难", value: "hard" },
];
const difficulty = ref("normal");
const difficultyConfig = {
  easy: {
    gravity: 0.3,
    jumpStrength: -8,
    pipeSpeed: 1.2,
    pipeGap: 230,
    pipeSpacing: 340,
  },
  normal: {
    gravity: 0.4,
    jumpStrength: -9,
    pipeSpeed: 1.5,
    pipeGap: 190,
    pipeSpacing: 300,
  },
  hard: {
    gravity: 0.5,
    jumpStrength: -10,
    pipeSpeed: 2.0,
    pipeGap: 160,
    pipeSpacing: 260,
  },
};
const currentConfig = computed(() => difficultyConfig[difficulty.value]);
const PIPE_WIDTH = 60;
const bird = { x: 80, y: 250, width: 40, height: 30, velocity: 0 };
const pipes = [];
let frameCount = 0;
let lastPipeFrame = 0;
const score = ref(0);
const highScore = ref(parseInt(localStorage.getItem("flappy-high")) || 0);
const gameRunning = ref(false);
const gameOver = ref(false);
const showResultDialog = ref(false);
const resultMessage = ref("");
let animationId = null;
const drawBird = (ctx) => {
  ctx.fillStyle = "#ffd700";
  ctx.shadowColor = "#ffd700";
  ctx.shadowBlur = 15;
  ctx.beginPath();
  ctx.arc(bird.x, bird.y, 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#ff6b35";
  ctx.beginPath();
  ctx.arc(bird.x + 5, bird.y, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(bird.x + 10, bird.y - 5, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.arc(bird.x + 13, bird.y - 5, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ff6b35";
  ctx.beginPath();
  ctx.moveTo(bird.x + 18, bird.y);
  ctx.lineTo(bird.x + 30, bird.y + 3);
  ctx.lineTo(bird.x + 18, bird.y + 8);
  ctx.closePath();
  ctx.fill();
};
const drawPipe = (ctx, pipe) => {
  const gradient = ctx.createLinearGradient(pipe.x, 0, pipe.x + PIPE_WIDTH, 0);
  gradient.addColorStop(0, "#2ecc71");
  gradient.addColorStop(0.5, "#27ae60");
  gradient.addColorStop(1, "#1e8449");
  ctx.fillStyle = gradient;
  ctx.shadowColor = "#27ae60";
  ctx.shadowBlur = 10;
  ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.top);
  ctx.fillRect(pipe.x - 5, pipe.top - 30, PIPE_WIDTH + 10, 30);
  ctx.fillRect(
    pipe.x,
    pipe.top + currentConfig.value.pipeGap,
    PIPE_WIDTH,
    600 - pipe.top - currentConfig.value.pipeGap,
  );
  ctx.fillRect(pipe.x - 5, pipe.top + currentConfig.value.pipeGap, PIPE_WIDTH + 10, 30);
  ctx.shadowBlur = 0;
};
const drawBackground = (ctx) => {
  const skyGrad = ctx.createLinearGradient(0, 0, 0, 400);
  skyGrad.addColorStop(0, "#87CEEB");
  skyGrad.addColorStop(1, "#E0F6FF");
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, 400, 500);
  ctx.fillStyle = "#7fc85d";
  ctx.fillRect(0, 500, 400, 100);
  ctx.fillStyle = "#8dcf6f";
  ctx.fillRect(0, 510, 400, 90);
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  const cloudOffset = (frameCount * 0.2) % 500;
  drawCloud(ctx, 100 - cloudOffset, 80);
  drawCloud(ctx, 300 - cloudOffset, 50);
  drawCloud(ctx, 500 - cloudOffset, 100);
};
const drawCloud = (ctx, x, y) => {
  ctx.beginPath();
  ctx.arc(x, y, 25, 0, Math.PI * 2);
  ctx.arc(x + 25, y - 10, 20, 0, Math.PI * 2);
  ctx.arc(x + 50, y, 25, 0, Math.PI * 2);
  ctx.arc(x + 25, y + 10, 20, 0, Math.PI * 2);
  ctx.fill();
};
const jump = () => {
  if (!gameRunning.value) {
    if (!gameOver.value) startGame();
    return;
  }
  bird.velocity = currentConfig.value.jumpStrength;
};
const handleClick = () => {
  jump();
};
const setDifficulty = (diff) => {
  difficulty.value = diff;
};
const createPipe = () => {
  const minHeight = 80;
  const maxHeight = 320;
  const topHeight = Math.random() * (maxHeight - minHeight) + minHeight;
  pipes.push({ x: 400, top: topHeight, passed: false });
};
const checkCollision = () => {
  if (bird.y + 15 > 500 || bird.y - 15 < 0) return true;
  for (const pipe of pipes) {
    if (bird.x + 15 > pipe.x && bird.x - 15 < pipe.x + PIPE_WIDTH) {
      if (bird.y - 15 < pipe.top || bird.y + 15 > pipe.top + currentConfig.value.pipeGap)
        return true;
    }
  }
  return false;
};
const gameLoop = () => {
  const ctx = canvasRef.value.getContext("2d");
  drawBackground(ctx);
  frameCount++;
  if (gameRunning.value) {
    bird.velocity += currentConfig.value.gravity;
    bird.y += bird.velocity;
    const pipeInterval = Math.floor(currentConfig.value.pipeSpacing / currentConfig.value.pipeSpeed);
    if (frameCount - lastPipeFrame > pipeInterval) {
      createPipe();
      lastPipeFrame = frameCount;
    }
    for (let i = pipes.length - 1; i >= 0; i--) {
      pipes[i].x -= currentConfig.value.pipeSpeed;
      if (!pipes[i].passed && pipes[i].x + PIPE_WIDTH < bird.x) {
        pipes[i].passed = true;
        score.value++;
        if (score.value > highScore.value) {
          highScore.value = score.value;
          localStorage.setItem("flappy-high", highScore.value);
        }
      }
      if (pipes[i].x + PIPE_WIDTH < 0) pipes.splice(i, 1);
    }
    if (checkCollision()) endGame();
  }
  pipes.forEach((pipe) => drawPipe(ctx, pipe));
  drawBird(ctx);
  ctx.fillStyle = "#fff";
  ctx.font = "bold 48px Arial";
  ctx.textAlign = "center";
  ctx.shadowColor = "rgba(0,0,0,0.5)";
  ctx.shadowBlur = 5;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;
  ctx.fillText(score.value, 200, 80);
  ctx.shadowBlur = 0;
  animationId = requestAnimationFrame(gameLoop);
};
const resetGame = () => {
  bird.x = 80;
  bird.y = 250;
  bird.velocity = 0;
  pipes.length = 0;
  frameCount = 0;
  lastPipeFrame = 0;
  score.value = 0;
  gameOver.value = false;
  showResultDialog.value = false;
  gameRunning.value = false;
};
const startGame = () => {
  resetGame();
  bird.velocity = currentConfig.value.jumpStrength;
  gameRunning.value = true;
};
const endGame = () => {
  gameRunning.value = false;
  gameOver.value = true;
  resultMessage.value = `最终得分: ${score.value}`;
  setTimeout(() => {
    showResultDialog.value = true;
  }, 500);
};
const restartGame = () => {
  cancelAnimationFrame(animationId);
  resetGame();
  const ctx = canvasRef.value.getContext("2d");
  drawBackground(ctx);
  drawBird(ctx);
  gameLoop();
};
const goHome = () => {
  cancelAnimationFrame(animationId);
  router.push("/");
};
const handleKeyDown = (e) => {
  if (e.key === " " || e.key === "ArrowUp") {
    e.preventDefault();
    jump();
  }
};
onMounted(() => {
  resetGame();
  const ctx = canvasRef.value.getContext("2d");
  drawBackground(ctx);
  drawBird(ctx);
  window.addEventListener("keydown", handleKeyDown);
  gameLoop();
});
onUnmounted(() => {
  window.removeEventListener("keydown", handleKeyDown);
  cancelAnimationFrame(animationId);
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
  gap: 20px;
  margin-bottom: 25px;
  flex-wrap: wrap;
}
.score-box {
  background: linear-gradient(135deg, #2ecc71, #27ae60);
  padding: 10px 25px;
  border-radius: 10px;
  text-align: center;
  min-width: 100px;
}
.score-label {
  color: #eaffea;
  font-size: 0.9em;
  font-weight: bold;
}
.score-value {
  color: white;
  font-size: 1.8em;
  font-weight: bold;
}
.game-status {
  color: #27ae60;
  font-size: 1.5em;
  font-weight: bold;
  width: 100%;
  text-align: center;
}
.board-container {
  position: relative;
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
  cursor: pointer;
  display: flex;
  justify-content: center;
}
.board-container canvas {
  width: 100%;
  max-width: 400px;
  height: auto;
  touch-action: manipulation;
}
.difficulty-selector {
  display: flex;
  align-items: center;
  gap: 10px;
}
.difficulty-selector label {
  font-weight: bold;
  color: #27ae60;
}
.difficulty-btn {
  padding: 8px 20px;
  border: 2px solid #27ae60;
  background: white;
  color: #27ae60;
  border-radius: 20px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.3s;
}
.difficulty-btn:hover:not(:disabled) {
  background: #27ae60;
  color: white;
}
.difficulty-btn.active {
  background: #27ae60;
  color: white;
}
.difficulty-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
@media (max-width: 768px) {
  .game-container {
    padding: 10px;
  }
  header {
    margin-bottom: 15px;
  }
  h1 {
    font-size: 2em;
    padding-left: 50px;
  }
  main {
    padding: 15px;
    border-radius: 15px;
  }
  .game-info {
    gap: 10px;
    margin-bottom: 15px;
  }
  .score-box {
    padding: 8px 15px;
    min-width: 70px;
  }
  .score-value {
    font-size: 1.4em;
  }
  .difficulty-selector {
    width: 100%;
    justify-content: center;
  }
  .difficulty-btn {
    padding: 6px 12px;
    font-size: 0.9em;
  }
  .controls {
    gap: 10px;
  }
  .btn {
    padding: 10px 20px;
    font-size: 1em;
  }
  .game-controls,
  .game-rules {
    padding: 15px;
    margin-top: 15px;
  }
}
@media (max-width: 480px) {
  h1 {
    font-size: 1.6em;
    padding-left: 40px;
  }
  .game-info {
    flex-direction: column;
  }
  .difficulty-selector {
    flex-wrap: wrap;
    justify-content: center;
  }
}
.game-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 20px 40px;
  border-radius: 15px;
  font-size: 1.2em;
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
  background: linear-gradient(135deg, #2ecc71, #27ae60);
  color: white;
  box-shadow: 0 6px 20px rgba(46, 204, 113, 0.4);
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
  color: #27ae60;
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
canvas {
  border-radius: 15px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  max-width: 100%;
  height: auto;
}
</style>
