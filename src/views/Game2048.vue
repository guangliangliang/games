<template>
  <div class="game-container">
    <header>
      <BackButton />
      <h1>🎮 2048</h1>
    </header>
    <main>
      <div class="game-info">
        <div class="score-box">
          <div class="score-label">分数</div>
          <div class="score-value">{{ score }}</div>
        </div>
        <div class="score-box">
          <div class="score-label">最高分</div>
          <div class="score-value">{{ bestScore }}</div>
        </div>
        <div class="game-status" v-if="gameOver">游戏结束!</div>
        <div class="game-status" v-if="gameWon && !keepPlaying">你赢了!</div>
      </div>
      <div class="board-container" ref="boardRef">
        <div class="grid-background">
          <div v-for="i in 16" :key="'cell-' + i" class="grid-cell"></div>
        </div>
        <div class="tiles-container">
          <div
            v-for="tile in tiles"
            :key="tile.id"
            class="tile"
            :style="getTileStyle(tile)"
          >
            {{ tile.value }}
          </div>
        </div>
      </div>
      <div class="controls">
        <button @click="newGame" class="btn btn-primary">新游戏</button>
      </div>
      <div class="game-controls">
        <h3>操作说明</h3>
        <div class="control-methods">
          <div class="control-item">
            <strong>键盘控制</strong>
            <p>↑ ↓ ← → 方向键移动</p>
          </div>
          <div class="control-item">
            <strong>触屏控制</strong>
            <p>滑动屏幕移动</p>
          </div>
        </div>
      </div>
      <div class="game-rules">
        <h3>游戏规则</h3>
        <ul>
          <li>使用方向键移动方块</li>
          <li>相同数字碰撞合并</li>
          <li>合并后数值翻倍</li>
          <li>目标合成2048!</li>
        </ul>
      </div>
    </main>
    <footer><p>经典益智游戏 - 2048</p></footer>
    <GameResultDialog
      v-model="showResultDialog"
      :title="gameWon ? '恭喜你!' : '游戏结束'"
      :message="gameWon ? '你合成了2048!' : '再接再厉!'"
      :icon="gameWon ? '🎉' : '😢'"
      :score="score"
      confirm-text="再来一局"
      :show-cancel="gameWon && !keepPlaying"
      cancel-text="继续游戏"
      @confirm="newGame"
      @cancel="continuePlaying"
    />
  </div>
</template>
<script setup>
import { ref, onMounted, onUnmounted, computed } from "vue";
import { useRouter } from "vue-router";
import GameResultDialog from "../components/GameResultDialog.vue";
import BackButton from "../components/BackButton.vue";
const router = useRouter();
const boardRef = ref(null);
const tiles = ref([]);
const score = ref(0);
const bestScore = ref(parseInt(localStorage.getItem("2048-best")) || 0);
const gameOver = ref(false);
const gameWon = ref(false);
const keepPlaying = ref(false);
const showResultDialog = ref(false);
let nextTileId = 1;
const gridSize = 4;
const cellSize = 107;
const cellSpacing = 15;
const mobileCellSize = 65;
const mobileCellSpacing = 12;
const isMobile = computed(() => window.innerWidth <= 768);
const currentCellSize = computed(() => isMobile.value ? mobileCellSize : cellSize);
const currentCellSpacing = computed(() => isMobile.value ? mobileCellSpacing : cellSpacing);
const tileColors = {
  2: { bg: "#eee4da", text: "#776e65" },
  4: { bg: "#ede0c8", text: "#776e65" },
  8: { bg: "#f2b179", text: "#f9f6f2" },
  16: { bg: "#f59563", text: "#f9f6f2" },
  32: { bg: "#f67c5f", text: "#f9f6f2" },
  64: { bg: "#f65e3b", text: "#f9f6f2" },
  128: { bg: "#edcf72", text: "#f9f6f2" },
  256: { bg: "#edcc61", text: "#f9f6f2" },
  512: { bg: "#edc850", text: "#f9f6f2" },
  1024: { bg: "#edc53f", text: "#f9f6f2" },
  2048: { bg: "#edc22e", text: "#f9f6f2" },
  4096: { bg: "#3c3a32", text: "#f9f6f2" },
  8192: { bg: "#3c3a32", text: "#f9f6f2" },
};
const getTileStyle = (tile) => {
  const x = tile.x * (currentCellSize.value + currentCellSpacing.value);
  const y = tile.y * (currentCellSize.value + currentCellSpacing.value);
  return {
    left: x + "px",
    top: y + "px",
    backgroundColor: tileColors[tile.value]?.bg || "#3c3a32",
    color: tileColors[tile.value]?.text || "#f9f6f2",
  };
};
const newGame = () => {
  tiles.value = [];
  score.value = 0;
  gameOver.value = false;
  gameWon.value = false;
  keepPlaying.value = false;
  showResultDialog.value = false;
  nextTileId = 1;
  addRandomTile();
  addRandomTile();
};
const continuePlaying = () => {
  keepPlaying.value = true;
  showResultDialog.value = false;
};
const addRandomTile = () => {
  const emptyCells = [];
  for (let x = 0; x < gridSize; x++)
    for (let y = 0; y < gridSize; y++)
      if (!getTileAt(x, y)) emptyCells.push({ x, y });
  if (emptyCells.length > 0) {
    const cell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    tiles.value.push({
      id: nextTileId++,
      x: cell.x,
      y: cell.y,
      value: Math.random() < 0.9 ? 2 : 4,
    });
  }
};
const getTileAt = (x, y) => {
  return tiles.value.find((t) => t.x === x && t.y === y);
};
const mergeRow = (row) => {
  const result = row.filter(v => v !== null);
  const merged = [];
  for (let i = 0; i < result.length; i++) {
    if (i < result.length - 1 && result[i] === result[i + 1]) {
      merged.push(result[i] * 2);
      score.value += result[i] * 2;
      if (result[i] * 2 === 2048 && !gameWon.value) gameWon.value = true;
      i++;
    } else {
      merged.push(result[i]);
    }
  }
  while (merged.length < gridSize) merged.push(null);
  return merged;
};
const move = (direction) => {
  if (gameOver.value) return;
  const oldTiles = tiles.value.map((t) => ({ ...t }));
  const grid = Array(gridSize)
    .fill(null)
    .map(() => Array(gridSize).fill(null));
  tiles.value.forEach((t) => (grid[t.y][t.x] = t.value));
  if (direction === "left") {
    for (let y = 0; y < gridSize; y++) {
      const row = grid[y];
      const merged = mergeRow(row);
      grid[y] = merged;
    }
  } else if (direction === "right") {
    for (let y = 0; y < gridSize; y++) {
      const row = grid[y].slice().reverse();
      const merged = mergeRow(row).reverse();
      grid[y] = merged;
    }
  } else if (direction === "up") {
    for (let x = 0; x < gridSize; x++) {
      const col = [];
      for (let y = 0; y < gridSize; y++) col.push(grid[y][x]);
      const merged = mergeRow(col);
      for (let y = 0; y < gridSize; y++) grid[y][x] = merged[y];
    }
  } else if (direction === "down") {
    for (let x = 0; x < gridSize; x++) {
      const col = [];
      for (let y = 0; y < gridSize; y++) col.push(grid[y][x]);
      const merged = mergeRow(col.slice().reverse()).reverse();
      for (let y = 0; y < gridSize; y++) grid[y][x] = merged[y];
    }
  }
  tiles.value = [];
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      if (grid[y][x] !== null) {
        tiles.value.push({
          id: nextTileId++,
          x,
          y,
          value: grid[y][x]
        });
      }
    }
  }
  const moved =
    JSON.stringify(
      oldTiles.map((t) => ({ x: t.x, y: t.y, value: t.value })),
    ) !==
    JSON.stringify(
      tiles.value.map((t) => ({ x: t.x, y: t.y, value: t.value })),
    );
  if (moved) {
    addRandomTile();
    if (score.value > bestScore.value) {
      bestScore.value = score.value;
      localStorage.setItem("2048-best", bestScore.value);
    }
    if (isGameOver()) {
      gameOver.value = true;
      setTimeout(() => {
        showResultDialog.value = true;
      }, 500);
    } else if (gameWon.value && !showResultDialog.value && !keepPlaying.value) {
      setTimeout(() => {
        showResultDialog.value = true;
      }, 500);
    }
  }
};
const isGameOver = () => {
  if (tiles.value.length < gridSize * gridSize) return false;
  for (let tile of tiles.value) {
    const right = getTileAt(tile.x + 1, tile.y);
    if (right && right.value === tile.value) return false;
    const down = getTileAt(tile.x, tile.y + 1);
    if (down && down.value === tile.value) return false;
  }
  return true;
};
const goHome = () => router.push("/");
const handleKeyDown = (e) => {
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
    e.preventDefault();
    switch (e.key) {
      case "ArrowUp":
        move("up");
        break;
      case "ArrowDown":
        move("down");
        break;
      case "ArrowLeft":
        move("left");
        break;
      case "ArrowRight":
        move("right");
        break;
    }
  }
};
let touchStartX = 0,
  touchStartY = 0;
const handleTouchStart = (e) => {
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
};
const handleTouchMove = (e) => {
  e.preventDefault();
};
const handleTouchEnd = (e) => {
  const touchEndX = e.changedTouches[0].clientX;
  const touchEndY = e.changedTouches[0].clientY;
  const dx = touchEndX - touchStartX;
  const dy = touchEndY - touchStartY;
  if (Math.abs(dx) > Math.abs(dy)) {
    if (Math.abs(dx) > 30) move(dx > 0 ? "right" : "left");
  } else {
    if (Math.abs(dy) > 30) move(dy > 0 ? "down" : "up");
  }
};
onMounted(() => {
  newGame();
  window.addEventListener("keydown", handleKeyDown);
  if (boardRef.value) {
    boardRef.value.addEventListener("touchstart", handleTouchStart, { passive: false });
    boardRef.value.addEventListener("touchmove", handleTouchMove, { passive: false });
    boardRef.value.addEventListener("touchend", handleTouchEnd, { passive: false });
  }
});
onUnmounted(() => {
  window.removeEventListener("keydown", handleKeyDown);
  if (boardRef.value) {
    boardRef.value.removeEventListener("touchstart", handleTouchStart);
    boardRef.value.removeEventListener("touchmove", handleTouchMove);
    boardRef.value.removeEventListener("touchend", handleTouchEnd);
  }
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
  background: linear-gradient(135deg, #bbada0, #8f7a66);
  padding: 10px 25px;
  border-radius: 10px;
  text-align: center;
  min-width: 100px;
}
.score-label {
  color: #eee4da;
  font-size: 0.9em;
  font-weight: bold;
}
.score-value {
  color: white;
  font-size: 1.8em;
  font-weight: bold;
}
.game-status {
  color: #f65e3b;
  font-size: 1.5em;
  font-weight: bold;
  width: 100%;
  text-align: center;
}
.board-container {
  position: relative;
  width: 488px;
  height: 488px;
  margin: 0 auto;
  background: #bbada0;
  border-radius: 10px;
  padding: 15px;
  box-sizing: border-box;
}
.grid-background {
  position: absolute;
  top: 15px;
  left: 15px;
  display: grid;
  grid-template-columns: repeat(4, 107px);
  grid-template-rows: repeat(4, 107px);
  gap: 15px;
}
.grid-cell {
  background: rgba(238, 228, 218, 0.35);
  border-radius: 5px;
}
.tiles-container {
  position: absolute;
  top: 15px;
  left: 15px;
}
.tile {
  position: absolute;
  width: 107px;
  height: 107px;
  border-radius: 5px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 2.5em;
  font-weight: bold;
}
.controls {
  display: flex;
  justify-content: center;
  gap: 20px;
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
  background: linear-gradient(135deg, #f65e3b, #edc22e);
  color: white;
  box-shadow: 0 6px 20px rgba(246, 94, 59, 0.4);
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
}
footer {
  text-align: center;
  color: white;
  margin-top: 30px;
  padding: 20px;
  opacity: 0.9;
}
@media (max-width: 768px) {
  .board-container {
    width: 320px;
    height: 320px;
  }
  .grid-background {
    grid-template-columns: repeat(4, 65px);
    grid-template-rows: repeat(4, 65px);
    gap: 12px;
  }
  .tile {
    width: 65px;
    height: 65px;
    font-size: 1.8em;
  }
}
</style>
