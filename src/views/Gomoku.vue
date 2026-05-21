<template>
  <div class="game-container">
    <header>
      <BackButton />
      <h1>⚫ 五子棋 ⚪</h1>
    </header>

    <main>
      <div class="game-info">
        <div class="mode-selector">
          <label>游戏模式：</label>
          <select v-model="gameMode" @change="restart" :disabled="!canChangeMode">
            <option value="pve">人机对战</option>
            <option value="pvp">双人对战</option>
          </select>
        </div>
        <div class="current-player" v-if="gameMode === 'pve'">
          当前: <span>{{ currentPlayer === 1 ? '玩家(黑棋)' : '电脑(白棋)' }}</span>
        </div>
        <div class="current-player" v-else>
          当前玩家: <span>{{ currentPlayer === 1 ? '黑棋' : '白棋' }}</span>
        </div>
        <div class="game-status" v-if="gameStatus">{{ gameStatus }}</div>
      </div>

      <div class="board-container">
        <canvas 
          ref="canvasRef" 
          width="600" 
          height="600"
          @click="handleCanvasClick"
        ></canvas>
      </div>

      <div class="controls">
        <button @click="restart" class="btn btn-primary">重新开始</button>
        <button @click="undo" class="btn btn-secondary" :disabled="moveHistory.length === 0 || gameOver">悔棋</button>
      </div>

      <div class="game-rules">
        <h3>游戏规则</h3>
        <ul>
          <li>黑棋先行，双方轮流落子</li>
          <li>先在横、竖或斜方向连成五子者获胜</li>
          <li>点击棋盘即可落子</li>
          <li>人机模式下，玩家执黑先行，电脑执白后手</li>
          <li>可以使用悔棋功能撤回上一步</li>
        </ul>
      </div>
    </main>

    <PageFooter :copyright="`${gameMode === 'pve' ? '人机对战模式' : '双人对战模式'} | 策略益智游戏`" />

    <!-- 游戏结果弹窗 -->
    <GameResultDialog
      v-model="showResultDialog"
      :title="resultTitle"
      :message="resultMessage"
      :icon="resultIcon"
      confirm-text="再来一局"
      @confirm="restart"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import GameResultDialog from '../components/GameResultDialog.vue'
import BackButton from '../components/BackButton.vue'
import PageFooter from '../components/PageFooter.vue'

const canvasRef = ref(null)
const boardSize = 15
const cellSize = ref(40)
const board = ref([])
const currentPlayer = ref(1) // 1: 黑棋(玩家), 2: 白棋(电脑/玩家2)
const gameStatus = ref('')
const gameOver = ref(false)
const moveHistory = ref([])
const gameMode = ref('pve') // 'pve': 人机对战, 'pvp': 双人对战
const isAIThinking = ref(false)

// 弹窗相关状态
const showResultDialog = ref(false)
const resultTitle = ref('游戏结束')
const resultMessage = ref('')
const resultIcon = ref('🎉')

// 初始化棋盘
const initializeBoard = () => {
  board.value = []
  for (let i = 0; i < boardSize; i++) {
    board.value[i] = []
    for (let j = 0; j < boardSize; j++) {
      board.value[i][j] = 0
    }
  }
}

// 绘制棋盘
const drawBoard = () => {
  const canvas = canvasRef.value
  const ctx = canvas.getContext('2d')
  
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  
  // 绘制棋盘背景
  ctx.fillStyle = '#f0d9b5'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  
  // 绘制网格线
  ctx.strokeStyle = '#8b4513'
  ctx.lineWidth = 1
  
  for (let i = 0; i < boardSize; i++) {
    // 横线
    ctx.beginPath()
    ctx.moveTo(cellSize.value, cellSize.value * (i + 1))
    ctx.lineTo(cellSize.value * boardSize, cellSize.value * (i + 1))
    ctx.stroke()
    
    // 竖线
    ctx.beginPath()
    ctx.moveTo(cellSize.value * (i + 1), cellSize.value)
    ctx.lineTo(cellSize.value * (i + 1), cellSize.value * boardSize)
    ctx.stroke()
  }
  
  // 绘制天元和星位
  const starPoints = [
    [3, 3], [3, 11], [11, 3], [11, 11], [7, 7]
  ]
  
  ctx.fillStyle = '#8b4513'
  starPoints.forEach(([x, y]) => {
    ctx.beginPath()
    ctx.arc(
      cellSize.value * (x + 1),
      cellSize.value * (y + 1),
      4, 0, Math.PI * 2
    )
    ctx.fill()
  })
  
  // 绘制已下的棋子
  drawPieces(ctx)
}

// 绘制棋子
const drawPieces = (ctx) => {
  for (let i = 0; i < boardSize; i++) {
    for (let j = 0; j < boardSize; j++) {
      if (board.value[i][j] !== 0) {
        drawPiece(ctx, i, j, board.value[i][j])
      }
    }
  }
}

const drawPiece = (ctx, row, col, player, isLastMove = false) => {
  const x = cellSize.value * (col + 1)
  const y = cellSize.value * (row + 1)
  const radius = cellSize.value * 0.4
  
  ctx.beginPath()
  ctx.arc(x, y, radius, 0, Math.PI * 2)
  
  // 渐变效果
  const gradient = ctx.createRadialGradient(
    x - radius/3, y - radius/3, radius/10,
    x, y, radius
  )
  
  if (player === 1) {
    gradient.addColorStop(0, '#666')
    gradient.addColorStop(1, '#000')
  } else {
    gradient.addColorStop(0, '#fff')
    gradient.addColorStop(1, '#ddd')
  }
  
  ctx.fillStyle = gradient
  ctx.fill()
  
  // 边框
  if (player === 2) {
    ctx.strokeStyle = '#999'
    ctx.lineWidth = 1
    ctx.stroke()
  }
  
  // 标记最后一步
  if (isLastMove) {
    ctx.strokeStyle = '#ff0000'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(x, y, radius * 0.5, 0, Math.PI * 2)
    ctx.stroke()
  }
}

// 处理点击事件
const handleCanvasClick = (e) => {
  if (gameOver.value || isAIThinking.value) return
  
  const rect = canvasRef.value.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  
  const col = Math.round(x / cellSize.value) - 1
  const row = Math.round(y / cellSize.value) - 1
  
  if (isValidMove(row, col)) {
    makeMove(row, col)
    
    // 人机模式下，触发AI下棋
    if (gameMode.value === 'pve' && !gameOver.value && currentPlayer.value === 2) {
      isAIThinking.value = true
      setTimeout(() => {
        aiMove()
        isAIThinking.value = false
      }, 500)
    }
  }
}

// 验证移动是否有效
const isValidMove = (row, col) => {
  return row >= 0 && row < boardSize && 
         col >= 0 && col < boardSize && 
         board.value[row][col] === 0
}

// 执行移动
const makeMove = (row, col) => {
  board.value[row][col] = currentPlayer.value
  moveHistory.value.push({row, col, player: currentPlayer.value})
  drawBoard()
  
  // 标记最后一步
  if (moveHistory.value.length > 0) {
    const lastMove = moveHistory.value[moveHistory.value.length - 1]
    redrawBoardWithHighlight(lastMove.row, lastMove.col)
  }
  
  if (checkWin(row, col)) {
    gameOver.value = true
    let winnerText = ''
    let icon = ''
    
    if (gameMode.value === 'pve') {
      if (currentPlayer.value === 1) {
        winnerText = '恭喜你赢了！'
        icon = '🎉'
      } else {
        winnerText = '电脑获胜'
        icon = '🤖'
      }
    } else {
      winnerText = `${currentPlayer.value === 1 ? '黑棋' : '白棋'} 获胜！`
      icon = '🏆'
    }
    
    gameStatus.value = winnerText
    
    // 显示弹窗
    setTimeout(() => {
      resultTitle.value = '游戏结束'
      resultMessage.value = winnerText
      resultIcon.value = icon
      showResultDialog.value = true
    }, 300)
  } else if (moveHistory.value.length === boardSize * boardSize) {
    // 平局
    gameOver.value = true
    gameStatus.value = '平局！'
    
    // 显示平局弹窗
    setTimeout(() => {
      resultTitle.value = '游戏结束'
      resultMessage.value = '平局！势均力敌的对决！'
      resultIcon.value = '🤝'
      showResultDialog.value = true
    }, 300)
  } else {
    currentPlayer.value = currentPlayer.value === 1 ? 2 : 1
  }
}

// 重绘棋盘并高亮最后一步
const redrawBoardWithHighlight = (lastRow, lastCol) => {
  const canvas = canvasRef.value
  const ctx = canvas.getContext('2d')
  drawBoard()
  
  // 高亮最后一步
  const x = cellSize.value * (lastCol + 1)
  const y = cellSize.value * (lastRow + 1)
  const radius = cellSize.value * 0.4
  
  ctx.strokeStyle = '#ff0000'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(x, y, radius * 0.5, 0, Math.PI * 2)
  ctx.stroke()
}

// AI下棋（基于评分算法）
const aiMove = () => {
  const bestMove = findBestMove()
  if (bestMove) {
    makeMove(bestMove.row, bestMove.col)
  }
}

// 寻找最佳落子位置
const findBestMove = () => {
  let bestScore = -Infinity
  let bestMove = null
  
  // 遍历所有可能的位置
  for (let i = 0; i < boardSize; i++) {
    for (let j = 0; j < boardSize; j++) {
      if (board.value[i][j] === 0) {
        // 评估该位置的分数
        const score = evaluatePosition(i, j)
        
        if (score > bestScore) {
          bestScore = score
          bestMove = { row: i, col: j }
        }
      }
    }
  }
  
  return bestMove
}

// 评估位置分数
const evaluatePosition = (row, col) => {
  let score = 0
  
  // 进攻评分（AI自己的棋子）
  score += evaluateLine(row, col, 2) * 1.0
  
  // 防守评分（阻止玩家）
  score += evaluateLine(row, col, 1) * 1.2
  
  // 位置偏好（中心优先）
  const centerDist = Math.abs(row - 7) + Math.abs(col - 7)
  score += (14 - centerDist) * 0.1
  
  return score
}

// 评估某个方向的连线
const evaluateLine = (row, col, player) => {
  let totalScore = 0
  const directions = [
    [0, 1],   // 水平
    [1, 0],   // 垂直
    [1, 1],   // 对角线
    [1, -1]   // 反对角线
  ]
  
  for (let [dx, dy] of directions) {
    let count = 1
    let emptyEnds = 0
    
    // 正方向
    let r = row + dx
    let c = col + dy
    while (r >= 0 && r < boardSize && c >= 0 && c < boardSize && board.value[r][c] === player) {
      count++
      r += dx
      c += dy
    }
    if (r >= 0 && r < boardSize && c >= 0 && c < boardSize && board.value[r][c] === 0) {
      emptyEnds++
    }
    
    // 反方向
    r = row - dx
    c = col - dy
    while (r >= 0 && r < boardSize && c >= 0 && c < boardSize && board.value[r][c] === player) {
      count++
      r -= dx
      c -= dy
    }
    if (r >= 0 && r < boardSize && c >= 0 && c < boardSize && board.value[r][c] === 0) {
      emptyEnds++
    }
    
    // 根据连子数和空端数评分
    if (count >= 5) {
      totalScore += 100000  // 成五
    } else if (count === 4 && emptyEnds === 2) {
      totalScore += 10000   // 活四
    } else if (count === 4 && emptyEnds === 1) {
      totalScore += 1000    // 冲四
    } else if (count === 3 && emptyEnds === 2) {
      totalScore += 100     // 活三
    } else if (count === 3 && emptyEnds === 1) {
      totalScore += 10      // 眠三
    } else if (count === 2 && emptyEnds === 2) {
      totalScore += 10      // 活二
    } else if (count === 2 && emptyEnds === 1) {
      totalScore += 1       // 眠二
    }
  }
  
  return totalScore
}

// 检查是否获胜
const checkWin = (row, col) => {
  const player = board.value[row][col]
  const directions = [
    [[0, 1], [0, -1]],   // 水平
    [[1, 0], [-1, 0]],   // 垂直
    [[1, 1], [-1, -1]], // 对角线
    [[1, -1], [-1, 1]]  // 反对角线
  ]
  
  for (let direction of directions) {
    let count = 1
    
    for (let [dx, dy] of direction) {
      let r = row + dx
      let c = col + dy
      
      while (r >= 0 && r < boardSize && 
             c >= 0 && c < boardSize && 
             board.value[r][c] === player) {
        count++
        r += dx
        c += dy
      }
    }
    
    if (count >= 5) return true
  }
  
  return false
}

// 悔棋
const undo = () => {
  if (moveHistory.value.length === 0 || gameOver.value) return
  
  // 人机模式下撤销两步（玩家和AI各一步）
  if (gameMode.value === 'pve') {
    if (moveHistory.value.length >= 2) {
      moveHistory.value.pop()
      moveHistory.value.pop()
    } else {
      moveHistory.value.pop()
    }
  } else {
    moveHistory.value.pop()
  }
  
  // 重置棋盘
  initializeBoard()
  for (let move of moveHistory.value) {
    board.value[move.row][move.col] = move.player
  }
  
  currentPlayer.value = moveHistory.value.length > 0 ? 
    (moveHistory.value[moveHistory.value.length - 1].player === 1 ? 2 : 1) : 1
  
  drawBoard()
  
  // 重新高亮最后一步
  if (moveHistory.value.length > 0) {
    const lastMove = moveHistory.value[moveHistory.value.length - 1]
    redrawBoardWithHighlight(lastMove.row, lastMove.col)
  }
}

// 重新开始
const restart = () => {
  currentPlayer.value = 1
  gameOver.value = false
  moveHistory.value = []
  gameStatus.value = ''
  isAIThinking.value = false
  initializeBoard()
  drawBoard()
}

// 判断是否可以切换模式
const canChangeMode = computed(() => {
  return moveHistory.value.length === 0 || gameOver.value
})

onMounted(() => {
  cellSize.value = canvasRef.value.width / (boardSize + 1)
  initializeBoard()
  drawBoard()
})
</script>

<style scoped>
.game-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

header {
  position: relative;
  text-align: center;
  color: white;
  margin-bottom: 30px;
}



h1 {
  font-size: 2.5em;
  margin: 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

main {
  background: white;
  border-radius: 15px;
  padding: 30px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.game-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 15px;
  background: #f5f5f5;
  border-radius: 10px;
  flex-wrap: wrap;
  gap: 10px;
}

.mode-selector {
  display: flex;
  align-items: center;
  gap: 10px;
}

.mode-selector label {
  font-weight: bold;
  color: #666;
}

.mode-selector select {
  padding: 8px 15px;
  border: 2px solid #667eea;
  border-radius: 5px;
  font-size: 1em;
  color: #333;
  background: white;
  cursor: pointer;
}

.mode-selector select:disabled {
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
  font-size: 1.2em;
  font-weight: bold;
  color: #e74c3c;
}

.board-container {
  display: flex;
  justify-content: center;
  margin: 20px 0;
  background: #f0d9b5;
  padding: 20px;
  border-radius: 10px;
  box-shadow: inset 0 2px 10px rgba(0, 0, 0, 0.1);
}

canvas {
  background: #f0d9b5;
  border-radius: 5px;
  cursor: pointer;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
}

.controls {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin: 20px 0;
}

.btn {
  padding: 12px 30px;
  font-size: 1em;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  transition: all 0.3s;
  font-weight: bold;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
}

.btn-secondary {
  background: #ecf0f1;
  color: #2c3e50;
}

.btn-secondary:hover {
  background: #d5dbdb;
  transform: translateY(-2px);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.game-rules {
  margin-top: 30px;
  padding: 20px;
  background: #f9f9f9;
  border-radius: 10px;
}

.game-rules h3 {
  color: #667eea;
  margin-bottom: 15px;
  font-size: 1.3em;
}

.game-rules ul {
  list-style: none;
  padding-left: 0;
}

.game-rules li {
  padding: 8px 0;
  padding-left: 25px;
  position: relative;
  color: #666;
  line-height: 1.6;
}

.game-rules li:before {
  content: "•";
  color: #667eea;
  font-weight: bold;
  position: absolute;
  left: 10px;
}

footer {
  text-align: center;
  color: white;
  margin-top: 30px;
  padding: 20px;
  opacity: 0.8;
}

@media (max-width: 768px) {
  h1 {
    font-size: 1.8em;
  }

  .board-container {
    padding: 10px;
  }

  canvas {
    width: 100%;
    height: auto;
  }

  .game-info {
    flex-direction: column;
    gap: 10px;
  }

  .controls {
    flex-direction: column;
  }

  .btn {
    width: 100%;
  }
}
</style>
