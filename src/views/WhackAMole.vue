<template>
  <div class="game-container">
    <header>
      <BackButton />
      <h1>🔨 打地鼠</h1>
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
          <div class="score-label">时间</div>
          <div class="score-value">{{ timeLeft }}s</div>
        </div>
      </div>
      <div class="board-container" 
           :class="{ 'hammer-cursor': gameRunning }"
           @mousemove="updateHammerPosition"
           ref="boardRef">
        <div v-if="gameRunning" 
             class="hammer" 
             :style="{ left: hammerPosition.x + 'px', top: hammerPosition.y + 'px' }"
             :class="{ 'hammer-down': isHammerDown }">
          🔨
        </div>
        <div class="score-popups">
          <div v-for="popup in scorePopups" 
               :key="popup.id" 
               class="score-popup"
               :style="{ left: popup.x + 'px', top: popup.y + 'px' }">
            +{{ popup.points }}
          </div>
        </div>
        <div class="holes-grid">
          <div v-for="(mole, index) in moles" 
               :key="index" 
               class="hole" 
               @click="whack(index, $event)" 
               @mousedown="handleMouseDown"
               @mouseup="handleMouseUp"
               @mouseleave="handleMouseUp"
               @touchstart.prevent="whack(index, $event)">
            <div class="mole-wrapper">
              <div class="mole" :class="{ up: mole.up, hit: mole.hit }">
                <span v-if="mole.isSpecial">⭐</span><span v-else>🐹</span>
              </div>
            </div>
            <div class="dirt"></div>
          </div>
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
            <strong>电脑</strong>
            <p>点击从洞里冒出来的地鼠!</p>
          </div>
          <div class="control-item">
            <strong>触屏</strong>
            <p>点击或触摸地鼠!</p>
          </div>
        </div>
      </div>
      <div class="game-rules">
        <h3>游戏规则</h3>
        <ul>
          <li>地鼠会随机从洞里冒出来</li>
          <li>快速点击地鼠得分</li>
          <li>⭐金色地鼠双倍分数!</li>
          <li>30秒内看你得多少分!</li>
        </ul>
      </div>
    </main>
    <footer><p>经典反应游戏 - 打地鼠</p></footer>
    <GameResultDialog
      v-model="showResultDialog"
      title="时间到!"
      :message="resultMessage"
      icon="🔨"
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
import { ref, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import GameResultDialog from "../components/GameResultDialog.vue";
import BackButton from "../components/BackButton.vue";
const router = useRouter();
const boardRef = ref(null);
const moles = ref([
  { up: false, hit: false, isSpecial: false },
  { up: false, hit: false, isSpecial: false },
  { up: false, hit: false, isSpecial: false },
  { up: false, hit: false, isSpecial: false },
  { up: false, hit: false, isSpecial: false },
  { up: false, hit: false, isSpecial: false },
  { up: false, hit: false, isSpecial: false },
  { up: false, hit: false, isSpecial: false },
  { up: false, hit: false, isSpecial: false },
]);
const score = ref(0);
const highScore = ref(parseInt(localStorage.getItem("whack-high")) || 0);
const timeLeft = ref(30);
const gameRunning = ref(false);
const showResultDialog = ref(false);
const resultMessage = ref("");
const hammerPosition = ref({ x: 0, y: 0 });
const isHammerDown = ref(false);
const scorePopups = ref([]);
let popupIdCounter = 0;
let moleInterval = null;
let timerInterval = null;
const startGame = () => {
  score.value = 0;
  timeLeft.value = 30;
  gameRunning.value = true;
  showResultDialog.value = false;
  scorePopups.value = [];
  moles.value.forEach((m) => {
    m.up = false;
    m.hit = false;
    m.isSpecial = false;
  });
  moleInterval = setInterval(() => {
    const randomIndex = Math.floor(Math.random() * 9);
    if (!moles.value[randomIndex].up) {
      moles.value[randomIndex].up = true;
      moles.value[randomIndex].hit = false;
      moles.value[randomIndex].isSpecial = Math.random() < 0.15;
      setTimeout(
        () => {
          if (!moles.value[randomIndex].hit)
            moles.value[randomIndex].up = false;
        },
        1000 + Math.random() * 1000,
      );
    }
  }, 600);
  timerInterval = setInterval(() => {
    timeLeft.value--;
    if (timeLeft.value <= 0) endGame();
  }, 1000);
};
const whack = (index, event) => {
  if (!gameRunning.value || !moles.value[index].up || moles.value[index].hit)
    return;
  moles.value[index].hit = true;
  const points = moles.value[index].isSpecial ? 20 : 10;
  score.value += points;
  if (score.value > highScore.value) {
    highScore.value = score.value;
    localStorage.setItem("whack-high", highScore.value);
  }
  addScorePopup(event, points);
  setTimeout(() => {
    moles.value[index].up = false;
    moles.value[index].hit = false;
  }, 300);
};
const addScorePopup = (event, points) => {
  const rect = boardRef.value.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  const id = popupIdCounter++;
  scorePopups.value.push({ id, x, y, points });
  setTimeout(() => {
    scorePopups.value = scorePopups.value.filter((p) => p.id !== id);
  }, 1000);
};
const updateHammerPosition = (event) => {
  if (!boardRef.value) return;
  const rect = boardRef.value.getBoundingClientRect();
  hammerPosition.value = {
    x: event.clientX - rect.left - 30,
    y: event.clientY - rect.top - 30,
  };
};
const handleMouseDown = () => {
  isHammerDown.value = true;
};
const handleMouseUp = () => {
  isHammerDown.value = false;
};
const endGame = () => {
  gameRunning.value = false;
  clearInterval(moleInterval);
  clearInterval(timerInterval);
  moles.value.forEach((m) => {
    m.up = false;
    m.hit = false;
  });
  resultMessage.value = `最终得分: ${score.value}`;
  setTimeout(() => {
    showResultDialog.value = true;
  }, 500);
};
const restartGame = () => {
  clearInterval(moleInterval);
  clearInterval(timerInterval);
  startGame();
};
const goHome = () => {
  clearInterval(moleInterval);
  clearInterval(timerInterval);
  router.push("/");
};
onUnmounted(() => {
  clearInterval(moleInterval);
  clearInterval(timerInterval);
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
  background: linear-gradient(135deg, #e74c3c, #c0392b);
  padding: 10px 25px;
  border-radius: 10px;
  text-align: center;
  min-width: 100px;
}
.score-label {
  color: #ffebe8;
  font-size: 0.9em;
  font-weight: bold;
}
.score-value {
  color: white;
  font-size: 1.8em;
  font-weight: bold;
}
.board-container {
  position: relative;
}
.board-container.hammer-cursor {
  cursor: none;
}
.hammer {
  position: absolute;
  font-size: 3em;
  pointer-events: none;
  z-index: 100;
  transform-origin: center;
  transition: transform 0.1s ease;
}
.hammer-down {
  transform: rotate(-45deg) scale(1.2);
}
.score-popups {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 50;
}
.score-popup {
  position: absolute;
  font-size: 2em;
  font-weight: bold;
  color: #ffd700;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
  animation: floatUp 1s ease-out forwards;
  pointer-events: none;
}
@keyframes floatUp {
  0% { opacity: 1; transform: translateY(0) scale(1); }
  100% { opacity: 0; transform: translateY(-80px) scale(1.5); }
}
.holes-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  max-width: 500px;
  margin: 0 auto;
}
.hole {
  position: relative;
  width: 150px;
  height: 120px;
  cursor: pointer;
  overflow: hidden;
}
.mole-wrapper {
  position: absolute;
  bottom: 20px;
  left: 0;
  width: 100%;
  height: 90px;
  overflow: hidden;
  z-index: 2;
}
.dirt {
  position: absolute;
  bottom: 0;
  width: 100%;
  height: 50px;
  background: linear-gradient(to bottom, #8b4513, #654321);
  border-radius: 50%;
  box-shadow: inset 0 -10px 20px rgba(0, 0, 0, 0.3);
  z-index: 3;
}
.mole {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%) translateY(120%);
  font-size: 3.5em;
  transition: transform 0.2s;
  user-select: none;
}
.mole.up {
  transform: translateX(-50%) translateY(-30px);
}
.mole.hit {
  animation: whack 0.3s;
}
@keyframes whack {
  0% { transform: translateX(-50%) translateY(-30px) scale(1); }
  50% { transform: translateX(-50%) translateY(-40px) scale(1.2); }
  100% { transform: translateX(-50%) translateY(120%) scale(0.5); }
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
  background: linear-gradient(135deg, #e74c3c, #c0392b);
  color: white;
  box-shadow: 0 6px 20px rgba(231, 76, 60, 0.4);
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
  color: #e74c3c;
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
@media (max-width: 600px) {
  .holes-grid {
    gap: 8px;
  }
  .hole {
    width: 110px;
    height: 95px;
  }
  .mole-wrapper {
    bottom: 15px;
    height: 85px;
  }
  .mole {
    font-size: 2.8em;
  }
  .dirt {
    height: 48px;
  }
  .hammer {
    font-size: 2em;
  }
}
@media (max-width: 400px) {
  .holes-grid {
    gap: 6px;
  }
  .hole {
    width: 95px;
    height: 85px;
  }
  .mole-wrapper {
    bottom: 12px;
    height: 75px;
  }
  .mole {
    font-size: 2.3em;
  }
  .dirt {
    height: 42px;
  }
}
@media (hover: none) and (pointer: coarse) {
  .board-container.hammer-cursor {
    cursor: auto;
  }
  .hammer {
    display: none;
  }
}
</style>
