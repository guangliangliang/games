<template>
  <div class="game-container">
    <header>
      <BackButton />
      <h1>🐍 真蛇贪吃蛇</h1>
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
          @click="canvasRef?.focus()"
          tabindex="0"
        ></canvas>
      </div>

      <div class="controls">
        <div class="difficulty-selector">
          <span>难度:</span>
          <button 
            @click="setDifficulty('easy')" 
            class="btn-difficulty"
            :class="{ active: difficulty === 'easy' }"
            :disabled="gameRunning"
          >简单</button>
          <button 
            @click="setDifficulty('medium')" 
            class="btn-difficulty"
            :class="{ active: difficulty === 'medium' }"
            :disabled="gameRunning"
          >中等</button>
          <button 
            @click="setDifficulty('hard')" 
            class="btn-difficulty"
            :class="{ active: difficulty === 'hard' }"
            :disabled="gameRunning"
          >困难</button>
        </div>
        <div class="game-buttons">
          <button @click="start" class="btn btn-primary" :disabled="gameRunning && !gamePaused">开始游戏</button>
          <button @click="pause" class="btn btn-secondary" :disabled="!gameRunning">
          {{ gamePaused ? '继续' : '暂停' }}
        </button>
          <button @click="restart" class="btn btn-primary">重新开始</button>
        </div>
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

    <PageFooter copyright="真实蛇类效果 | 休闲娱乐必备" />

    <!-- 游戏结果弹窗 -->
    <GameResultDialog
      v-model="showResultDialog"
      title="游戏结束"
      :message="resultMessage"
      icon="🐍"
      :score="score"
      @update:modelValue="(val) => { if (!val) restart() }"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import GameResultDialog from '../components/GameResultDialog.vue'
import BackButton from '../components/BackButton.vue'
import PageFooter from '../components/PageFooter.vue'

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
const difficulty = ref('easy')
const speed = ref(150)
const difficultySpeeds = {
  easy: 150,
  medium: 100,
  hard: 60
}

const setDifficulty = (level) => {
  difficulty.value = level
  speed.value = difficultySpeeds[level]
}

let tongueOut = false
let tongueTimer = 0
let tongueProgress = 0
let animationTime = 0

// 弹窗相关状态
const showResultDialog = ref(false)
const resultMessage = ref('')

// 返回主页
const goHome = () => {
  // 清理游戏状态
  if (gameLoop.value) {
    clearInterval(gameLoop.value)
  }
  gameRunning.value = false
  gamePaused.value = false
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

const getAngle = (dxVal, dyVal) => {
  if (dxVal === 1) return 0
  if (dxVal === -1) return Math.PI
  if (dyVal === -1) return -Math.PI / 2
  if (dyVal === 1) return Math.PI / 2
  return 0
}

const drawTongue = (ctx, x, y, angle, progress) => {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(angle)
  
  const tongueLength = 20 * 0.7 * progress
  const tongueWidth = 2.5
  
  ctx.fillStyle = '#e53935'
  ctx.beginPath()
  ctx.moveTo(20 * 0.35, -tongueWidth / 2)
  ctx.lineTo(20 * 0.35 + tongueLength * 0.5, -tongueWidth / 2)
  ctx.lineTo(20 * 0.35 + tongueLength, -tongueWidth * 1.2)
  ctx.lineTo(20 * 0.35 + tongueLength * 0.7, -tongueWidth / 2)
  ctx.lineTo(20 * 0.35 + tongueLength * 0.7, tongueWidth / 2)
  ctx.lineTo(20 * 0.35 + tongueLength, tongueWidth / 2)
  ctx.lineTo(20 * 0.35 + tongueLength * 0.5, tongueWidth / 2)
  ctx.lineTo(20 * 0.35, tongueWidth / 2)
  ctx.closePath()
  ctx.fill()
  
  ctx.restore()
}

// 绘制游戏
const draw = () => {
  const canvas = canvasRef.value
  const ctx = canvas.getContext('2d')
  
  animationTime += 16
  
  tongueTimer += 16
  if (tongueTimer > 1800 + Math.random() * 800) {
    tongueOut = true
    tongueTimer = 0
  }
  
  if (tongueOut) {
    tongueProgress += 0.07
    if (tongueProgress >= 1) tongueOut = false
  } else if (tongueProgress > 0) {
    tongueProgress -= 0.07
    if (tongueProgress < 0) tongueProgress = 0
  }
  
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
  gradient.addColorStop(0, '#1a1a2e')
  gradient.addColorStop(1, '#16213e')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  
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
  
  const segments = snake.value
  if (segments.length === 0) return
  
  for (let i = segments.length - 1; i >= 0; i--) {
    const segment = segments[i]
    const x = segment.x * gridSize + gridSize / 2
    const y = segment.y * gridSize + gridSize / 2
    const sizeRatio = 0.9 - (i / segments.length) * 0.5
    const radius = (gridSize / 2) * sizeRatio
    const waveOffset = Math.sin(animationTime / 200 + i * 0.8) * (1.5 - i * 0.1)
    const actualX = x + waveOffset
    const actualY = y
    
    if (i === 0) {
      const headX = x + waveOffset * 0.3
      const headY = y
      const angle = getAngle(dx.value, dy.value)
      
      ctx.save()
      ctx.translate(headX, headY)
      ctx.rotate(angle)
      
      const headGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius * 1.3)
      headGradient.addColorStop(0, '#8bc34a')
      headGradient.addColorStop(0.5, '#689f38')
      headGradient.addColorStop(1, '#33691e')
      
      ctx.beginPath()
      ctx.ellipse(0, 0, radius * 1.35, radius * 1.15, 0, 0, Math.PI * 2)
      ctx.fillStyle = headGradient
      ctx.fill()
      ctx.strokeStyle = '#1b5e20'
      ctx.lineWidth = 2
      ctx.stroke()
      ctx.restore()
      
      ctx.save()
      ctx.translate(headX, headY)
      ctx.rotate(angle)
      for (let s = 0; s < 5; s++) {
        const sx = -radius * 0.5 + s * radius * 0.25
        const sy = Math.sin(s * 1.5) * radius * 0.2
        const scaleR = radius * 0.18
        ctx.beginPath()
        ctx.arc(sx, sy, scaleR, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(27, 94, 32, 0.35)'
        ctx.fill()
      }
      ctx.restore()
      
      ctx.save()
      ctx.translate(headX, headY)
      ctx.rotate(angle)
      
      ctx.beginPath()
      ctx.ellipse(radius * 0.35, -radius * 0.3, 3.5, 3, 0, 0, Math.PI * 2)
      ctx.fillStyle = '#ffffff'
      ctx.fill()
      
      ctx.beginPath()
      ctx.ellipse(radius * 0.45, -radius * 0.3, 1.8, 1.4, 0, 0, Math.PI * 2)
      ctx.fillStyle = '#000000'
      ctx.fill()
      
      ctx.beginPath()
      ctx.ellipse(radius * 0.35, radius * 0.3, 3.5, 3, 0, 0, Math.PI * 2)
      ctx.fillStyle = '#ffffff'
      ctx.fill()
      
      ctx.beginPath()
      ctx.ellipse(radius * 0.45, radius * 0.3, 1.8, 1.4, 0, 0, Math.PI * 2)
      ctx.fillStyle = '#000000'
      ctx.fill()
      ctx.restore()
      
      if (tongueProgress > 0.05) {
        drawTongue(ctx, headX, headY, angle, tongueProgress)
      }
    } else {
      const prevSegment = segments[i - 1]
      const prevX = prevSegment.x * gridSize + gridSize / 2
      const prevY = prevSegment.y * gridSize + gridSize / 2
      const prevSizeRatio = 0.9 - ((i - 1) / segments.length) * 0.5
      const prevRadius = (gridSize / 2) * prevSizeRatio
      const prevWaveOffset = Math.sin(animationTime / 200 + (i - 1) * 0.8) * (1.5 - (i - 1) * 0.1)
      const actualPrevX = prevX + prevWaveOffset
      const actualPrevY = prevY
      
      const alpha = 0.95 - i * 0.02
      const color = `rgba(139,195,74,${alpha})`
      
      // 绘制当前节段
      ctx.beginPath()
      ctx.arc(actualX, actualY, radius, 0, Math.PI * 2)
      ctx.fillStyle = color
      ctx.fill()
      ctx.strokeStyle = 'rgba(27,94,32,0.6)'
      ctx.lineWidth = 1.5
      ctx.stroke()
      
      // 绘制鳞片
      ctx.beginPath()
      ctx.arc(actualX, actualY, radius * 0.25, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(27,94,32,0.3)'
      ctx.fill()
      
      // 绘制当前节段和前一节段之间的连接
      const dx = actualPrevX - actualX
      const dy = actualPrevY - actualY
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist > 0) {
        const angle = Math.atan2(dy, dx)
        
        ctx.save()
        ctx.translate(actualX, actualY)
        ctx.rotate(angle)
        
        ctx.beginPath()
        ctx.rect(0, -radius, dist, radius * 2)
        ctx.fillStyle = color
        ctx.fill()
        
        ctx.restore()
      }
    }
  }
  
  const pulseRadius = gridSize/2 - 2 + Math.sin(animationTime/200)*2
  const foodX = food.value.x * gridSize + gridSize/2
  const foodY = food.value.y * gridSize + gridSize/2
  
  ctx.fillStyle = '#ff9800'
  ctx.shadowColor = '#ff9800'
  ctx.shadowBlur = 15
  
  ctx.beginPath()
  ctx.arc(foodX, foodY, pulseRadius, 0, Math.PI*2)
  ctx.fill()
  
  ctx.beginPath()
  ctx.arc(foodX - pulseRadius*0.55, foodY - pulseRadius*0.55, pulseRadius*0.35, 0, Math.PI*2)
  ctx.fill()
  
  ctx.beginPath()
  ctx.arc(foodX + pulseRadius*0.55, foodY - pulseRadius*0.55, pulseRadius*0.35,0, Math.PI*2)
  ctx.fill()
  
  ctx.shadowBlur = 0
  ctx.fillStyle = '#000'
  ctx.beginPath()
  ctx.arc(foodX - pulseRadius*0.3, foodY - pulseRadius*0.1, pulseRadius*0.12,0,Math.PI*2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(foodX + pulseRadius*0.3, foodY - pulseRadius*0.1, pulseRadius*0.12,0,Math.PI*2)
  ctx.fill()
  
  ctx.fillStyle = '#ff5252'
  ctx.beginPath()
  ctx.arc(foodX, foodY + pulseRadius*0.2, pulseRadius*0.15,0,Math.PI*2)
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
  
  // 使用当前难度的速度
  speed.value = difficultySpeeds[difficulty.value]
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
  
  // 重置速度为当前难度
  speed.value = difficultySpeeds[difficulty.value]
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
  
  // 绑定全局键盘事件
  window.addEventListener('keydown', handleKeyPress)
})

onUnmounted(() => {
  if (gameLoop.value) {
    clearInterval(gameLoop.value)
  }
  
  // 移除全局键盘事件
  window.removeEventListener('keydown', handleKeyPress)
})
</script>

<style scoped>
.game-container {
  max-width: 900px;
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
  margin-bottom: 40px;
}

h1 {
  font-size: 2.5em;
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
  flex-direction: column;
  align-items: center;
  gap: 20px;
  margin: 25px 0;
  flex-wrap: wrap;
}

.difficulty-selector {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #333;
  font-weight: 600;
}

.btn-difficulty {
  padding: 8px 20px;
  border: 2px solid #667eea;
  background: white;
  color: #667eea;
  border-radius: 20px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s;
}

.btn-difficulty:hover {
  background: #f0f0ff;
}

.btn-difficulty.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-color: transparent;
}

.btn-difficulty:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.game-buttons {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  justify-content: center;
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
