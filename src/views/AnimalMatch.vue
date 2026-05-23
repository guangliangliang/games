<template>
  <div class="game-page">
    <div class="game-wrapper">
      <header class="game-header">
        <BackButton />
        <h1>🐾 动物消消乐</h1>
      </header>
      
      <div class="game-content">
        <div class="game-stats">
          <div class="stat-card">
            <div class="stat-label">分数</div>
            <div class="stat-value">{{ score }}</div>
          </div>
          <div class="stat-card moves-card">
            <div class="stat-label">剩余步数</div>
            <div class="stat-value">{{ moves }}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">最高分</div>
            <div class="stat-value">{{ bestScore }}</div>
          </div>
        </div>
        
        <div class="board-wrapper">
          <div class="board-container" ref="boardRef">
            <div class="grid-background">
              <div v-for="i in 64" :key="'cell-' + i" class="grid-cell"></div>
            </div>
            <div class="tiles-container">
              <div
                v-for="(tile, index) in board"
                :key="tile.id"
                class="tile"
                :class="{
                  selected: selectedIndex === index,
                  matched: tile.matched,
                }"
                :style="getTileStyle(index)"
                @click="handleTileClick(index)"
              >
                <span class="tile-emoji">{{ tile.emoji }}</span>
              </div>
            </div>
            <div class="combo-banner" v-if="combo > 1">
              <span class="combo-text">{{ combo }}连击! 🎉</span>
            </div>
          </div>
        </div>
        
        <div class="action-buttons">
          <button @click="restartGame" class="btn restart-btn">重新开始</button>
        </div>
        
        <div class="guide-section">
          <div class="guide-card">
            <h3>📖 玩法说明</h3>
            <ul class="guide-list">
              <li>点击选择一个动物，再点击相邻动物进行交换</li>
              <li>3个或更多相同动物连成一线即可消除</li>
              <li>消除后上方动物会掉落，新动物补充</li>
              <li>每局有30步，争取在步数用尽前获得最高分！</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
    
    <GameResultDialog
      v-if="showResultDialog"
      :score="score"
      :best-score="bestScore"
      :is-new-record="score === bestScore && score > 0"
      @restart="restartGame"
      @close="showResultDialog = false"
    />
  </div>
</template>
<script setup>
import { ref, onMounted, onUnmounted, nextTick } from "vue";
import { useRouter } from "vue-router";
import BackButton from "../components/BackButton.vue";
import GameResultDialog from "../components/GameResultDialog.vue";
const router = useRouter();
const boardRef = ref(null);
const GRID_SIZE = 8;
const ANIMALS = ["🐱", "🐶", "🐰", "🦊", "🐻", "🐼"];
const MAX_MOVES = 30;
const board = ref([]);
const score = ref(0);
const moves = ref(MAX_MOVES);
const bestScore = ref(parseInt(localStorage.getItem("animal-match-best")) || 0);
const selectedIndex = ref(null);
const combo = ref(0);
const showResultDialog = ref(false);
let nextTileId = 1;
let isAnimating = false;
const createBoard = () => {
  board.value = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      let emoji;
      do {
        emoji = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
      } while (wouldCreateMatch(r, c, emoji));
      board.value.push({
        id: nextTileId++,
        emoji: emoji,
        matched: false,
        special: null,
      });
    }
  }
};
const wouldCreateMatch = (row, col, emoji) => {
  let horizontalCount = 1;
  for (let c = col - 1; c >= 0; c--) {
    const index = row * GRID_SIZE + c;
    if (board.value[index]?.emoji === emoji) horizontalCount++;
    else break;
  }
  if (horizontalCount >= 3) return true;
  let verticalCount = 1;
  for (let r = row - 1; r >= 0; r--) {
    const index = r * GRID_SIZE + col;
    if (board.value[index]?.emoji === emoji) verticalCount++;
    else break;
  }
  return verticalCount >= 3;
};
const getTileStyle = (index) => {
  const row = Math.floor(index / GRID_SIZE);
  const col = index % GRID_SIZE;
  const width = window.innerWidth;
  let size, gap, fontSize;
  
  if (width <= 480) {
    size = 31;
    gap = 6;
    fontSize = 19;
  } else if (width <= 768) {
    size = 36;
    gap = 7;
    fontSize = 23;
  } else {
    size = 47;
    gap = 8;
    fontSize = 30;
  }
  
  const x = col * (size + gap);
  const y = row * (size + gap);
  
  return {
    left: x + "px",
    top: y + "px",
    width: size + "px",
    height: size + "px",
    fontSize: fontSize + "px",
  };
};
const handleTileClick = (index) => {
  if (isAnimating) return;
  if (selectedIndex.value === null) {
    selectedIndex.value = index;
  } else {
    if (isAdjacent(selectedIndex.value, index)) {
      swapTiles(selectedIndex.value, index);
    }
    selectedIndex.value = null;
  }
};
const isAdjacent = (idx1, idx2) => {
  const row1 = Math.floor(idx1 / GRID_SIZE);
  const col1 = idx1 % GRID_SIZE;
  const row2 = Math.floor(idx2 / GRID_SIZE);
  const col2 = idx2 % GRID_SIZE;
  return Math.abs(row1 - row2) + Math.abs(col1 - col2) === 1;
};
const swapTiles = async (idx1, idx2) => {
  const temp = { ...board.value[idx1] };
  board.value[idx1] = { ...board.value[idx2], id: board.value[idx1].id };
  board.value[idx2] = { ...temp, id: board.value[idx2].id };
  const matches = findMatches();
  if (matches.length > 0) {
    moves.value--;
    await processMatches();
    if (moves.value <= 0) {
      endGame();
    }
  } else {
    const temp2 = { ...board.value[idx1] };
    board.value[idx1] = { ...board.value[idx2], id: board.value[idx1].id };
    board.value[idx2] = { ...temp2, id: board.value[idx2].id };
  }
};

const endGame = () => {
  showResultDialog.value = true;
};
const findMatches = () => {
  const matches = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    let count = 1;
    let startCol = 0;
    for (let c = 1; c < GRID_SIZE; c++) {
      const curr = board.value[r * GRID_SIZE + c];
      const prev = board.value[r * GRID_SIZE + (c - 1)];
      if (curr?.emoji === prev?.emoji) {
        count++;
      } else {
        if (count >= 3) {
          for (let i = startCol; i < c; i++) matches.push(r * GRID_SIZE + i);
        }
        count = 1;
        startCol = c;
      }
    }
    if (count >= 3) {
      for (let i = startCol; i < GRID_SIZE; i++)
        matches.push(r * GRID_SIZE + i);
    }
  }
  for (let c = 0; c < GRID_SIZE; c++) {
    let count = 1;
    let startRow = 0;
    for (let r = 1; r < GRID_SIZE; r++) {
      const curr = board.value[r * GRID_SIZE + c];
      const prev = board.value[(r - 1) * GRID_SIZE + c];
      if (curr?.emoji === prev?.emoji) {
        count++;
      } else {
        if (count >= 3) {
          for (let i = startRow; i < r; i++) matches.push(i * GRID_SIZE + c);
        }
        count = 1;
        startRow = r;
      }
    }
    if (count >= 3) {
      for (let i = startRow; i < GRID_SIZE; i++)
        matches.push(i * GRID_SIZE + c);
    }
  }
  return [...new Set(matches)];
};
const processMatches = async () => {
  isAnimating = true;
  combo.value++;
  let matches = findMatches();
  while (matches.length > 0) {
    const points = matches.length * 10 * combo.value;
    score.value += points;
    matches.forEach((idx) => {
      board.value[idx].matched = true;
    });
    await delay(300);
    await dropAndFill(matches);
    matches = findMatches();
    if (matches.length > 0) combo.value++;
  }
  if (score.value > bestScore.value) {
    bestScore.value = score.value;
    localStorage.setItem("animal-match-best", bestScore.value);
  }
  combo.value = 0;
  isAnimating = false;
};
const dropAndFill = async (toRemove) => {
  for (let c = 0; c < GRID_SIZE; c++) {
    const column = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      const idx = r * GRID_SIZE + c;
      if (!toRemove.includes(idx)) {
        column.push(board.value[idx]);
      }
    }
    while (column.length < GRID_SIZE) {
      column.unshift({
        id: nextTileId++,
        emoji: ANIMALS[Math.floor(Math.random() * ANIMALS.length)],
        matched: false,
        special: null,
      });
    }
    for (let r = 0; r < GRID_SIZE; r++) {
      board.value[r * GRID_SIZE + c] = column[r];
    }
  }
  await delay(100);
};
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const restartGame = () => {
  score.value = 0;
  moves.value = MAX_MOVES;
  combo.value = 0;
  selectedIndex.value = null;
  isAnimating = false;
  showResultDialog.value = false;
  createBoard();
};
const handleResize = () => {
  nextTick(() => {
    board.value = [...board.value];
  });
};

onMounted(() => {
  createBoard();
  window.addEventListener("resize", handleResize);
});

onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
});
</script>
<style scoped>
.game-page {
  min-height: 100vh;
  padding: 20px;
}

.game-wrapper {
  max-width: 600px;
  margin: 0 auto;
}

.game-header {
  position: relative;
  text-align: center;
  margin-bottom: 30px;
}

.game-header h1 {
  font-size: 2.5em;
  margin: 0;
  padding-left: 70px;
  color: #ffffff;
  text-shadow: 
    0 0 10px rgba(255, 255, 255, 0.8),
    0 0 20px rgba(102, 126, 234, 0.6),
    0 2px 4px rgba(0, 0, 0, 0.5);
  animation: titlePulse 2s ease-in-out infinite;
}

.game-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.game-stats {
  display: flex;
  justify-content: center;
  gap: 15px;
  width: 100%;
  flex-wrap: wrap;
}

.stat-card {
  background: linear-gradient(135deg, #667eea, #764ba2);
  padding: 12px 20px;
  border-radius: 12px;
  text-align: center;
  min-width: 90px;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.moves-card {
  background: linear-gradient(135deg, #f093fb, #f5576c);
  box-shadow: 0 4px 15px rgba(245, 87, 108, 0.3);
}

.stat-label {
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.85em;
  font-weight: 600;
  margin-bottom: 4px;
}

.stat-value {
  color: white;
  font-size: 1.7em;
  font-weight: bold;
}

.combo-banner {
  position: absolute;
  top: -25px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
  background: linear-gradient(135deg, #ffd700, #ffaa00);
  padding: 10px 30px;
  border-radius: 30px;
  box-shadow: 0 6px 20px rgba(255, 215, 0, 0.5);
  animation: combo-pulse 0.5s ease-in-out;
  white-space: nowrap;
}
.combo-text {
  color: #5a3e00;
  font-size: 1.2em;
  font-weight: bold;
}
@keyframes combo-pulse {
  0% { 
    transform: translateX(-50%) scale(0.5);
    opacity: 0;
  }
  50% { 
    transform: translateX(-50%) scale(1.2);
    opacity: 1;
  }
  100% { 
    transform: translateX(-50%) scale(1);
    opacity: 1;
  }
}

.combo-text {
  color: #5a3e00;
  font-size: 1.3em;
  font-weight: bold;
}

.board-wrapper {
  display: flex;
  justify-content: center;
  width: 100%;
}

@keyframes titlePulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.02); }
}
.board-container {
  position: relative;
  width: 462px;
  height: 462px;
  background: linear-gradient(145deg, #667eea, #764ba2);
  border-radius: 20px;
  padding: 15px;
  box-sizing: border-box;
  box-shadow: 
    0 10px 40px rgba(102, 126, 234, 0.4),
    inset 0 2px 0 rgba(255, 255, 255, 0.3);
  border: 3px solid rgba(255, 255, 255, 0.3);
}
.grid-background,
.tiles-container {
  position: absolute;
  top: 15px;
  left: 15px;
  width: 432px;
  height: 432px;
  display: grid;
  grid-template-columns: repeat(8, 47px);
  grid-template-rows: repeat(8, 47px);
  gap: 8px;
}
.grid-cell {
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.25), rgba(255, 255, 255, 0.15));
  border-radius: 12px;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
}
.tile {
  position: absolute;
  width: 47px;
  height: 47px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  border-radius: 12px;
  transition: all 0.15s ease;
  user-select: none;
  background: linear-gradient(145deg, #ffffff, #f0f0f0);
  box-shadow: 
    0 4px 12px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
}
.tile:hover {
  transform: scale(1.08);
  box-shadow: 
    0 6px 18px rgba(102, 126, 234, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
}
.tile.selected {
  transform: scale(1.12);
  box-shadow:
    0 0 30px rgba(255, 215, 0, 0.9),
    0 8px 20px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
  border: 3px solid #ffd700;
  background: linear-gradient(145deg, #fff8e6, #ffecb3);
}
.tile.matched {
  animation: match-pop 0.35s ease-out forwards;
}
@keyframes match-pop {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  30% {
    transform: scale(1.25);
    opacity: 0.9;
  }
  100% {
    transform: scale(0);
    opacity: 0;
  }
}
.tile-emoji {
  font-size: 30px;
  line-height: 1;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2));
}
.grid-background,
.tiles-container {
  position: absolute;
  top: 10px;
  left: 10px;
  width: 420px;
  height: 420px;
  display: grid;
  grid-template-columns: repeat(8, 50px);
  grid-template-rows: repeat(8, 50px);
  gap: 5px;
}
.grid-cell {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
}
.tile {
  position: absolute;
  width: 50px;
  height: 50px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  border-radius: 10px;
  transition: all 0.15s ease;
  user-select: none;
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
.tile:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}
.tile.selected {
  transform: scale(1.1);
  box-shadow:
    0 0 20px rgba(102, 126, 234, 0.7),
    0 4px 15px rgba(102, 126, 234, 0.4);
  border: 3px solid #667eea;
}
.tile.matched {
  animation: match-pop 0.3s ease-out forwards;
}
@keyframes match-pop {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.3);
    opacity: 0.8;
  }
  100% {
    transform: scale(0);
    opacity: 0;
  }
}
.tile-emoji {
  font-size: 32px;
  line-height: 1;
}
.action-buttons {
  display: flex;
  justify-content: center;
  width: 100%;
}

.restart-btn {
  padding: 14px 40px;
  font-size: 1.1em;
  border: none;
  border-radius: 30px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: bold;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.restart-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.5);
}

.guide-section {
  width: 100%;
  margin-top: 10px;
}

.guide-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  padding: 25px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.guide-card h3 {
  text-align: center;
  color: #667eea;
  margin-top: 0;
  margin-bottom: 18px;
  font-size: 1.3em;
}

.guide-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.guide-list li {
  padding: 10px 0;
  padding-left: 28px;
  position: relative;
  color: #444;
  line-height: 1.5;
}

.guide-list li:before {
  content: "•";
  position: absolute;
  left: 10px;
  color: #667eea;
  font-weight: bold;
}
@media (max-width: 768px) {
  .game-page {
    padding: 15px;
  }
  
  .game-header h1 {
    font-size: 2em;
    padding-left: 60px;
  }
  
  .game-stats {
    gap: 10px;
  }
  
  .stat-card {
    padding: 10px 15px;
    min-width: 80px;
  }
  
  .stat-label {
    font-size: 0.8em;
  }
  
  .stat-value {
    font-size: 1.5em;
  }
  
  .board-container {
    width: 357px;
    height: 357px;
    padding: 12px;
  }
  
  .grid-background,
  .tiles-container {
    width: 333px;
    height: 333px;
    grid-template-columns: repeat(8, 36px);
    grid-template-rows: repeat(8, 36px);
    gap: 7px;
  }
  
  .tile {
    width: 36px;
    height: 36px;
  }
  
  .tile-emoji {
    font-size: 23px;
  }
  
  .guide-card {
    padding: 20px;
  }
}

@media (max-width: 480px) {
  .game-page {
    padding: 10px;
  }
  
  .game-header h1 {
    font-size: 1.7em;
    padding-left: 50px;
  }
  
  .game-stats {
    gap: 8px;
  }
  
  .stat-card {
    padding: 8px 12px;
    min-width: 70px;
  }
  
  .board-container {
    width: 314px;
    height: 314px;
    padding: 12px;
  }
  
  .grid-background,
  .tiles-container {
    width: 290px;
    height: 290px;
    grid-template-columns: repeat(8, 31px);
    grid-template-rows: repeat(8, 31px);
    gap: 6px;
  }
  
  .tile {
    width: 31px;
    height: 31px;
  }
  
  .tile-emoji {
    font-size: 19px;
  }
  
  .guide-card {
    padding: 18px;
  }
  
  .guide-card h3 {
    font-size: 1.15em;
  }
  
  .guide-list li {
    font-size: 0.95em;
  }
}
</style>
