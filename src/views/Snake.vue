<template>
  <div class="game-container">
    <header>
      <router-link to="/" class="back-link">← 返回</router-link>
      <h1>🐍 贪吃蛇</h1>
    </header>

    <main>
      <div class="game-info">
        <div class="score">
          得分: <span>{{ score }}</span>
        </div>
        <div class="high-score">
          最高分: <span>{{ highScore }}</span>
        </div>
        <div class="game-status" v-if="statusText">{{ statusText }}</div>
      </div>

      <div class="board-container">
        <canvas 
          ref="canvasRef" 
          width="400" 
          height="400"
          @keydown="handleKeyPress"
          tabindex="0"
        ></canvas>
      </div>

      <div class="controls">
        <button @click="start" class="btn btn-primary" :disabled="gameRunning && !gamePaused">开始游戏</button>
        <button @click="pause" class="btn btn-secondary" :disabled="!gameRunning || gamePaused">暂停</button>
        <button @click="restart" class="btn btn-primary">重新开始</button>
      </div>

      <div class="game-controls">
        <h3>操作说明</h3>
        <div class="control-methods">
          <div class="control-item">
            <strong>键盘控制:</strong>
            <p>↑ ↓ ← → 或 W A S D 控制方向</p>
          </div>
          <div class="control-item">
            <strong>触屏控制:</strong>
            <p>滑动屏幕改变方向</p>
          </div>
        </div>
      </div>

      <div class="game-rules">
        <h3>游戏规则</h3>
        <ul>
          <li>控制蛇移动，吃到食物会增加长度和分数</li>
          <li>不要撞到墙壁或自己的身体</li>
          <li>吃得越多，蛇越长，难度也越大</li>
          <li>挑战最高分！</li>
        </ul>
      </div>
    </main>

    <footer>
      <p>经典街机游戏 | 休闲娱乐必备</p>
    </footer>

    <!-- 游戏结果弹窗 -->
    <GameResultDialog
      v-model="showResultDialog"
      title="游戏结束"
      :message="resultMessage"
      icon="🐍"
      :score="score"
      confirm-text="再来一局"
      show-cancel
      cancel-text="返回主页"
      @confirm="restart"
      @cancel="goHome"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import GameResultDialog from '../components/GameResultDialog.vue'

const router = useRouter()
const canvasRef = ref(null)
const gridSize = 20
const tileCount = 20
const snake = ref([{x: 10, y: 10}])
const food = ref({x: 15, y: 15})
const dx = ref(0)
const dy = ref(0)
const score = ref(0)
const highScore = ref(localStorage.getItem('snakeHighScore') || 0)
const gameRunning = ref(false)
const gamePaused = ref(false)
const statusText = ref('点击开始游戏')
const gameLoop = ref(null)
const speed = ref(100)

// 弹窗相关状态
const showResultDialog = ref(false)
const resultMessage = ref('')

// 返回主页
const goHome = () => {
  router.push('/')
}

// 生成食物
const generateFood = () => {
  let newFood
  do {
    newFood = {
      x: Math.floor(Math.random() * tileCount),
      y: Math.floor(Math.random() * tileCount)
    }
  } while (snake.value.some(segment => segment.x === newFood.x && segment.y === newFood.y))
  
  return newFood
}

// 绘制游戏
const draw = () => {
  const canvas = canvasRef.value
  const ctx = canvas.getContext('2d')
  
  // 清空画布 - 使用渐变背景
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
  gradient.addColorStop(0, '#1a1a2e')
  gradient.addColorStop(1, '#16213e')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  
  // 绘制网格 - 更淡的效果
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)'
  ctx.lineWidth = 0.5
  
  for (let i = 0; i <= tileCount; i++) {
    ctx.beginPath()
    ctx.moveTo(i * gridSize, 0)
    ctx.lineTo(i * gridSize, canvas.height)
    ctx.stroke()
    
    ctx.beginPath()
    ctx.moveTo(0, i * gridSize)
    ctx.lineTo(canvas.width, i * gridSize)
    ctx.stroke()
  }
  
  // 绘制蛇 - 添加霓虹效果
  snake.value.forEach((segment, index) => {
    if (index === 0) {
      // 蛇头 - 发光效果
      const headGradient = ctx.createRadialGradient(
        segment.x * gridSize + gridSize / 2,
        segment.y * gridSize + gridSize / 2,
        0,
        segment.x * gridSize + gridSize / 2,
        segment.y * gridSize + gridSize / 2,
        gridSize / 2
      )
      headGradient.addColorStop(0, '#7fffd4')
      headGradient.addColorStop(0.7, '#4ecca3')
      headGradient.addColorStop(1, '#45b393')
      
      ctx.fillStyle = headGradient
      ctx.shadowColor = '#4ecca3'
      ctx.shadowBlur = 10
      
      ctx.fillRect(
        segment.x * gridSize + 1,
        segment.y * gridSize + 1,
        gridSize - 2,
        gridSize - 2
      )
      
      ctx.shadowBlur = 0 // 重置阴影
      
      // 蛇眼 - 更生动
      ctx.fillStyle = '#fff'
      const eyeSize = 4
      const eyeOffset = 6
      
      if (dx.value === 1) { // 向右
        ctx.fillRect(segment.x * gridSize + 13, segment.y * gridSize + 6, eyeSize, eyeSize)
        ctx.fillRect(segment.x * gridSize + 13, segment.y * gridSize + 13, eyeSize, eyeSize)
      } else if (dx.value === -1) { // 向左
        ctx.fillRect(segment.x * gridSize + 6, segment.y * gridSize + 6, eyeSize, eyeSize)
        ctx.fillRect(segment.x * gridSize + 6, segment.y * gridSize + 13, eyeSize, eyeSize)
      } else if (dy.value === -1) { // 向上
        ctx.fillRect(segment.x * gridSize + 6, segment.y * gridSize + 6, eyeSize, eyeSize)
        ctx.fillRect(segment.x * gridSize + 13, segment.y * gridSize + 6, eyeSize, eyeSize)
      } else { // 向下或静止
        ctx.fillRect(segment.x * gridSize + 6, segment.y * gridSize + 13, eyeSize, eyeSize)
        ctx.fillRect(segment.x * gridSize + 13, segment.y * gridSize + 13, eyeSize, eyeSize)
      }
      
      // 眼睛高光
      ctx.fillStyle = '#000'
      const pupilSize = 2
      if (dx.value === 1) {
        ctx.fillRect(segment.x * gridSize + 15, segment.y * gridSize + 7, pupilSize, pupilSize)
        ctx.fillRect(segment.x * gridSize + 15, segment.y * gridSize + 14, pupilSize, pupilSize)
      } else if (dx.value === -1) {
        ctx.fillRect(segment.x * gridSize + 7, segment.y * gridSize + 7, pupilSize, pupilSize)
        ctx.fillRect(segment.x * gridSize + 7, segment.y * gridSize + 14, pupilSize, pupilSize)
      } else if (dy.value === -1) {
        ctx.fillRect(segment.x * gridSize + 7, segment.y * gridSize + 7, pupilSize, pupilSize)
        ctx.fillRect(segment.x * gridSize + 14, segment.y * gridSize + 7, pupilSize, pupilSize)
      } else {
        ctx.fillRect(segment.x * gridSize + 7, segment.y * gridSize + 14, pupilSize, pupilSize)
        ctx.fillRect(segment.x * gridSize + 14, segment.y * gridSize + 14, pupilSize, pupilSize)
      }
    } else {
      // 蛇身 - 渐变效果
      const bodyGradient = ctx.createRadialGradient(
        segment.x * gridSize + gridSize / 2,
        segment.y * gridSize + gridSize / 2,
        0,
        segment.x * gridSize + gridSize / 2,
        segment.y * gridSize + gridSize / 2,
        gridSize / 2
      )
      bodyGradient.addColorStop(0, '#5ee0b8')
      bodyGradient.addColorStop(1, '#45b393')
      
      ctx.fillStyle = bodyGradient
      ctx.fillRect(
        segment.x * gridSize + 2,
        segment.y * gridSize + 2,
        gridSize - 4,
        gridSize - 4
      )
    }
  })
  
  // 绘制食物 - 添加脉动效果
  const pulseRadius = gridSize / 2 - 2 + Math.sin(Date.now() / 200) * 2
  ctx.fillStyle = '#ff6b6b'
  ctx.shadowColor = '#ff6b6b'
  ctx.shadowBlur = 15
  
  ctx.beginPath()
  ctx.arc(
    food.value.x * gridSize + gridSize / 2,
    food.value.y * gridSize + gridSize / 2,
    pulseRadius,
    0,
    Math.PI * 2
  )
  ctx.fill()
  
  // 食物高光
  ctx.fillStyle = '#fff'
  ctx.shadowBlur = 0
  ctx.beginPath()
  ctx.arc(
    food.value.x * gridSize + gridSize / 2 - 3,
    food.value.y * gridSize + gridSize / 2 - 3,
    3,
    0,
    Math.PI * 2
  )
  ctx.fill()
}

// 更新游戏状态
const update = () => {
  const head = {
    x: snake.value[0].x + dx.value,
    y: snake.value[0].y + dy.value
  }
  
  // 撞墙检测
  if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
    gameOver()
    return
  }
  
  // 撞自己检测
  for (let segment of snake.value) {
    if (head.x === segment.x && head.y === segment.y) {
      gameOver()
      return
    }
  }
  
  snake.value.unshift(head)
  
  // 吃到食物
  if (head.x === food.value.x && head.y === food.value.y) {
    score.value += 10
    
    // 更新最高分
    if (score.value > highScore.value) {
      highScore.value = score.value
      localStorage.setItem('snakeHighScore', highScore.value)
    }
    
    food.value = generateFood()
    
    // 增加速度
    if (score.value % 50 === 0 && speed.value > 50) {
      speed.value -= 5
      clearInterval(gameLoop.value)
      gameLoop.value = setInterval(update, speed.value)
    }
  } else {
    snake.value.pop()
  }
  
  draw()
}

// 游戏结束
const gameOver = () => {
  clearInterval(gameLoop.value)
  gameRunning.value = false
  
  if (score.value > highScore.value) {
    highScore.value = score.value
    localStorage.setItem('snakeHighScore', highScore.value)
    statusText.value = `游戏结束！新纪录：${score.value}分`
    resultMessage.value = `恭喜打破纪录！`
  } else {
    statusText.value = `游戏结束！得分：${score.value}分`
    resultMessage.value = `再接再厉，继续挑战！`
  }
  
  // 显示游戏结束弹窗
  setTimeout(() => {
    showResultDialog.value = true
  }, 300)
}

// 开始游戏
const start = () => {
  if (gameRunning.value) return
  
  gameRunning.value = true
  gamePaused.value = false
  
  if (dx.value === 0 && dy.value === 0) {
    dx.value = 1
    dy.value = 0
  }
  
  gameLoop.value = setInterval(update, speed.value)
  statusText.value = '游戏进行中'
}

// 暂停游戏
const pause = () => {
  if (!gameRunning.value) return
  
  gamePaused.value = !gamePaused.value
  
  if (gamePaused.value) {
    clearInterval(gameLoop.value)
    statusText.value = '游戏已暂停'
  } else {
    gameLoop.value = setInterval(update, speed.value)
    statusText.value = '游戏进行中'
  }
}

// 重新开始
const restart = () => {
  clearInterval(gameLoop.value)
  
  snake.value = [{x: 10, y: 10}]
  food.value = generateFood()
  dx.value = 0
  dy.value = 0
  score.value = 0
  gameRunning.value = false
  gamePaused.value = false
  
  statusText.value = '点击开始游戏'
  draw()
}

// 键盘事件处理
const handleKeyPress = (e) => {
  // 阻止方向键和WASD的默认滚动行为
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', 'W', 'A', 'S', 'D'].includes(e.key)) {
    e.preventDefault()
  }
  
  if (!gameRunning.value || gamePaused.value) return
  
  switch(e.key) {
    case 'ArrowUp':
    case 'w':
    case 'W':
      if (dy.value !== 1) {
        dx.value = 0
        dy.value = -1
      }
      break
    case 'ArrowDown':
    case 's':
    case 'S':
      if (dy.value !== -1) {
        dx.value = 0
        dy.value = 1
      }
      break
    case 'ArrowLeft':
    case 'a':
    case 'A':
      if (dx.value !== 1) {
        dx.value = -1
        dy.value = 0
      }
      break
    case 'ArrowRight':
    case 'd':
    case 'D':
      if (dx.value !== -1) {
        dx.value = 1
        dy.value = 0
      }
      break
  }
}

// 触摸事件处理
let touchStartX = 0
let touchStartY = 0

const handleTouchStart = (e) => {
  e.preventDefault()
  touchStartX = e.touches[0].clientX
  touchStartY = e.touches[0].clientY
}

const handleTouchEnd = (e) => {
  e.preventDefault()
  const touchEndX = e.changedTouches[0].clientX
  const touchEndY = e.changedTouches[0].clientY
  
  const diffX = touchEndX - touchStartX
  const diffY = touchEndY - touchStartY
  
  if (Math.abs(diffX) > Math.abs(diffY)) {
    // 水平滑动
    if (diffX > 0 && dx.value !== -1) {
      dx.value = 1
      dy.value = 0
    } else if (diffX < 0 && dx.value !== 1) {
      dx.value = -1
      dy.value = 0
    }
  } else {
    // 垂直滑动
    if (diffY > 0 && dy.value !== -1) {
      dx.value = 0
      dy.value = 1
    } else if (diffY < 0 && dy.value !== 1) {
      dx.value = 0
      dy.value = -1
    }
  }
}

onMounted(() => {
  draw()
  
  // 绑定触摸事件
  const canvas = canvasRef.value
  canvas.addEventListener('touchstart', handleTouchStart)
  canvas.addEventListener('touchend', handleTouchEnd)
})

onUnmounted(() => {
  if (gameLoop.value) {
    clearInterval(gameLoop.value)
  }
})
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
  margin-bottom: 40px;
}

h1 {
  font-size: 3em;
  margin: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: none;
  filter: drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.3));
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
  font-size: 1.1em;
  transition: all 0.3s;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 20px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.back-link:hover {
  opacity: 1;
  background: rgba(255, 255, 255, 0.25);
  transform: translateY(-50%) translateX(5px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

main {
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  border-radius: 20px;
  padding: 35px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.game-info {
  display: flex;
  justify-content: space-around;
  align-items: center;
  margin-bottom: 25px;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 15px;
  flex-wrap: wrap;
  gap: 15px;
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
}

.score, .high-score {
  font-size: 1.3em;
  font-weight: bold;
  color: white;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.2);
}

.score span, .high-score span {
  color: #ffd700;
  font-size: 1.5em;
  display: inline-block;
  animation: scoreGlow 1.5s ease-in-out infinite;
}

@keyframes scoreGlow {
  0%, 100% { text-shadow: 0 0 10px rgba(255, 215, 0, 0.5); }
  50% { text-shadow: 0 0 20px rgba(255, 215, 0, 0.8), 0 0 30px rgba(255, 215, 0, 0.6); }
}

.game-status {
  font-size: 1.3em;
  font-weight: bold;
  color: #ff6b6b;
  width: 100%;
  text-align: center;
  margin-top: 10px;
  animation: statusPulse 1s ease-in-out infinite;
}

@keyframes statusPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.board-container {
  display: flex;
  justify-content: center;
  margin: 30px 0;
  position: relative;
}

canvas {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border: 4px solid transparent;
  border-radius: 15px;
  box-shadow: 
    0 0 30px rgba(102, 126, 234, 0.5),
    inset 0 0 30px rgba(102, 126, 234, 0.1);
  outline: none;
  position: relative;
  transition: all 0.3s;
}

canvas:focus {
  box-shadow: 
    0 0 40px rgba(102, 126, 234, 0.7),
    inset 0 0 40px rgba(102, 126, 234, 0.2);
  transform: scale(1.02);
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
  position: relative;
  overflow: hidden;
}

.btn::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transform: translate(-50%, -50%);
  transition: width 0.6s, height 0.6s;
}

.btn:hover::before {
  width: 300px;
  height: 300px;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.btn-primary:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 30px rgba(102, 126, 234, 0.6);
}

.btn-primary:disabled {
  background: #ccc;
  cursor: not-allowed;
  box-shadow: none;
}

.btn-secondary {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
  box-shadow: 0 6px 20px rgba(245, 87, 108, 0.4);
}

.btn-secondary:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 30px rgba(245, 87, 108, 0.6);
}

.btn-secondary:disabled {
  background: #ccc;
  cursor: not-allowed;
  box-shadow: none;
}

.game-controls {
  margin-top: 35px;
  padding: 25px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-radius: 15px;
  box-shadow: inset 0 2px 10px rgba(0, 0, 0, 0.1);
}

.game-controls h3 {
  color: #667eea;
  margin-bottom: 20px;
  font-size: 1.4em;
  text-align: center;
}

.control-methods {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.control-item {
  padding: 15px;
  background: white;
  border-radius: 10px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s;
}

.control-item:hover {
  transform: translateY(-5px);
}

.control-item strong {
  color: #667eea;
  display: block;
  margin-bottom: 8px;
  font-size: 1.1em;
}

.control-item p {
  color: #666;
  line-height: 1.6;
  margin: 0;
}

.game-rules {
  margin-top: 35px;
  padding: 25px;
  background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
  border-radius: 15px;
  box-shadow: inset 0 2px 10px rgba(0, 0, 0, 0.1);
}

.game-rules h3 {
  color: #e74c3c;
  margin-bottom: 20px;
  font-size: 1.4em;
  text-align: center;
}

.game-rules ul {
  list-style: none;
  padding-left: 0;
}

.game-rules li {
  padding: 12px 0;
  padding-left: 30px;
  position: relative;
  color: #333;
  line-height: 1.8;
  font-size: 1.05em;
}

.game-rules li:before {
  content: "🎮";
  position: absolute;
  left: 0;
  font-size: 1.2em;
}

footer {
  text-align: center;
  color: white;
  margin-top: 40px;
  padding: 25px;
  opacity: 0.9;
  font-size: 1.1em;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
}

@media (max-width: 768px) {
  h1 {
    font-size: 2em;
  }

  canvas {
    width: 100%;
    height: auto;
    max-width: 400px;
  }

  .game-info {
    flex-direction: column;
  }

  .controls {
    flex-direction: column;
  }

  .btn {
    width: 100%;
  }

  .control-methods {
    grid-template-columns: 1fr;
  }
  
  main {
    padding: 20px;
  }
}
</style>
