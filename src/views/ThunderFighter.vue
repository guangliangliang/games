<template>
  <div class="game-container">
    <header>
      <router-link to="/" class="back-link">← 返回</router-link>
      <h1>✈️ 雷霆战机</h1>
    </header>

    <main>
      <div class="game-info">
        <div class="score-container">
          <div class="score">
            得分: <span>{{ score }}</span>
          </div>
          <div class="high-score">
            最高分: <span>{{ highScore }}</span>
          </div>
        </div>
        <div class="status-container">
          <div class="lives">
            生命: <span v-for="i in lives" :key="i">❤️</span>
            <span v-if="hasShield">🛡️</span>
          </div>
          <div class="weapon-level">
            火力: <span>{{ '⭐'.repeat(weaponLevel) }}{{ '☆'.repeat(3 - weaponLevel) }}</span>
          </div>
        </div>
        <div class="game-status" v-if="statusText">{{ statusText }}</div>
      </div>

      <div class="board-container">
        <canvas 
          ref="canvasRef" 
          width="600" 
          height="800"
          @keydown="handleKeyDown"
          @keyup="handleKeyUp"
          tabindex="0"
          @touchstart="handleTouchStart"
          @touchmove="handleTouchMove"
          @touchend="handleTouchEnd"
        ></canvas>
      </div>

      <div class="controls">
        <button @click="startGame" class="btn btn-primary" :disabled="gameRunning && !gamePaused">开始游戏</button>
        <button @click="pauseGame" class="btn btn-secondary" :disabled="!gameRunning || gamePaused">暂停</button>
        <button @click="restartGame" class="btn btn-primary">重新开始</button>
      </div>

      <div class="game-controls">
        <h3>操作说明</h3>
        <div class="control-methods">
          <div class="control-item">
            <strong>键盘控制：</strong>
            <p>↑↓←→ 或 WASD 移动战机，自动射击</p>
          </div>
          <div class="control-item">
            <strong>触屏控制：</strong>
            <p>触摸屏幕移动战机</p>
          </div>
        </div>
      </div>

      <div class="game-rules">
        <h3>游戏规则</h3>
        <ul>
          <li>控制战机躲避敌机并消灭它们获得分数</li>
          <li>拾取 🔫 升级武器火力，最多3级</li>
          <li>拾取 ❤️ 恢复生命，🛡️ 获得临时护盾</li>
          <li>消灭不同敌机获得不同分数，小心躲避！</li>
        </ul>
      </div>
    </main>

    <footer>
      <p>经典射击游戏 | 雷霆战机</p>
    </footer>

    <GameResultDialog
      v-model="showResultDialog"
      title="游戏结束"
      :message="resultMessage"
      icon="✈️"
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
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import GameResultDialog from '../components/GameResultDialog.vue'

const router = useRouter()
const canvasRef = ref(null)

// 游戏状态
const score = ref(0)
const highScore = ref(parseInt(localStorage.getItem('thunderHighScore')) || 0)
const lives = ref(3)
const weaponLevel = ref(1)
const hasShield = ref(false)
const gameRunning = ref(false)
const gamePaused = ref(false)
const statusText = ref('点击开始游戏')
const gameLoop = ref(null)

// 弹窗状态
const showResultDialog = ref(false)
const resultMessage = ref('')

// 游戏对象
const player = ref({
  x: 300,
  y: 650,
  width: 50,
  height: 60,
  speed: 6,
  lastShot: 0,
  shotInterval: 150
})

const enemies = ref([])
const playerBullets = ref([])
const enemyBullets = ref([])
const powerUps = ref([])
const explosions = ref([])
const stars = ref([])

// 键盘状态
const keys = ref({
  up: false,
  down: false,
  left: false,
  right: false
})

// 触屏状态
const isTouching = ref(false)
const touchX = ref(0)
const touchY = ref(0)

// 初始化星空背景
const initStars = () => {
  stars.value = []
  for (let i = 0; i < 100; i++) {
    stars.value.push({
      x: Math.random() * 600,
      y: Math.random() * 800,
      size: Math.random() * 2 + 1,
      speed: Math.random() * 2 + 1
    })
  }
}

// 绘制星空
const drawStars = (ctx) => {
  ctx.fillStyle = '#ffffff'
  stars.value.forEach(star => {
    ctx.beginPath()
    ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2)
    ctx.fill()
  })
}

// 更新星空
const updateStars = () => {
  stars.value.forEach(star => {
    star.y += star.speed
    if (star.y > 800) {
      star.y = 0
      star.x = Math.random() * 600
    }
  })
}

// 绘制玩家战机 - 全新设计
const drawPlayer = (ctx) => {
  const p = player.value
  const time = Date.now() / 1000
  
  // 护盾效果
  if (hasShield.value) {
    ctx.strokeStyle = '#00ffff'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.arc(p.x, p.y, 45, 0, Math.PI * 2)
    ctx.stroke()
    ctx.shadowColor = '#00ffff'
    ctx.shadowBlur = 25
    ctx.stroke()
    ctx.shadowBlur = 0
  }
  
  ctx.save()
  ctx.translate(p.x, p.y)
  
  // 战机主体 - 科幻雷霆战机
  ctx.shadowColor = '#4facfe'
  ctx.shadowBlur = 20
  
  // 机身渐变
  const bodyGradient = ctx.createLinearGradient(0, -35, 0, 35)
  bodyGradient.addColorStop(0, '#1e3c72')
  bodyGradient.addColorStop(0.3, '#4facfe')
  bodyGradient.addColorStop(0.7, '#00f2fe')
  bodyGradient.addColorStop(1, '#1e3c72')
  
  // 主机身
  ctx.fillStyle = bodyGradient
  ctx.beginPath()
  ctx.moveTo(0, -35)
  ctx.bezierCurveTo(8, -25, 10, -10, 8, 10)
  ctx.lineTo(12, 30)
  ctx.lineTo(0, 25)
  ctx.lineTo(-12, 30)
  ctx.lineTo(-8, 10)
  ctx.bezierCurveTo(-10, -10, -8, -25, 0, -35)
  ctx.closePath()
  ctx.fill()
  
  // 后掠翼
  const wingGradient = ctx.createLinearGradient(-35, 0, 35, 0)
  wingGradient.addColorStop(0, '#0f2027')
  wingGradient.addColorStop(0.5, '#203a43')
  wingGradient.addColorStop(1, '#0f2027')
  
  ctx.fillStyle = wingGradient
  ctx.beginPath()
  ctx.moveTo(-8, -5)
  ctx.lineTo(-35, 15)
  ctx.lineTo(-30, 22)
  ctx.lineTo(-10, 15)
  ctx.closePath()
  ctx.fill()
  
  ctx.beginPath()
  ctx.moveTo(8, -5)
  ctx.lineTo(35, 15)
  ctx.lineTo(30, 22)
  ctx.lineTo(10, 15)
  ctx.closePath()
  ctx.fill()
  
  // 垂直尾翼
  ctx.fillStyle = '#1e3c72'
  ctx.beginPath()
  ctx.moveTo(-5, -15)
  ctx.lineTo(-8, -5)
  ctx.lineTo(-5, 5)
  ctx.lineTo(-3, -15)
  ctx.closePath()
  ctx.fill()
  
  ctx.beginPath()
  ctx.moveTo(5, -15)
  ctx.lineTo(8, -5)
  ctx.lineTo(5, 5)
  ctx.lineTo(3, -15)
  ctx.closePath()
  ctx.fill()
  
  // 驾驶舱 - 金色透明罩
  const cockpitGradient = ctx.createRadialGradient(0, -12, 0, 0, -12, 12)
  cockpitGradient.addColorStop(0, 'rgba(255, 215, 0, 0.9)')
  cockpitGradient.addColorStop(0.5, 'rgba(255, 180, 0, 0.7)')
  cockpitGradient.addColorStop(1, 'rgba(200, 140, 0, 0.4)')
  
  ctx.fillStyle = cockpitGradient
  ctx.shadowColor = '#ffd700'
  ctx.shadowBlur = 10
  ctx.beginPath()
  ctx.ellipse(0, -12, 7, 10, 0, 0, Math.PI * 2)
  ctx.fill()
  
  // 机翼翼尖能量灯
  ctx.shadowBlur = 0
  const glowIntensity = 0.5 + Math.sin(time * 5) * 0.3
  ctx.fillStyle = `rgba(0, 255, 255, ${glowIntensity})`
  ctx.shadowColor = '#00ffff'
  ctx.shadowBlur = 15
  ctx.beginPath()
  ctx.arc(-32, 18, 3, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(32, 18, 3, 0, Math.PI * 2)
  ctx.fill()
  
  // 武器挂架
  ctx.fillStyle = '#3a3a5a'
  ctx.shadowBlur = 0
  ctx.fillRect(-20, 5, 4, 12)
  ctx.fillRect(16, 5, 4, 12)
  
  // 引擎喷口 - 双引擎
  const flameLength1 = 20 + Math.random() * 15
  const flameLength2 = 20 + Math.random() * 15
  
  // 左引擎火焰
  const flameGradient1 = ctx.createLinearGradient(-8, 30, -8, 30 + flameLength1)
  flameGradient1.addColorStop(0, '#00ffff')
  flameGradient1.addColorStop(0.3, '#4facfe')
  flameGradient1.addColorStop(0.6, '#ffd700')
  flameGradient1.addColorStop(1, 'transparent')
  
  ctx.fillStyle = flameGradient1
  ctx.shadowColor = '#4facfe'
  ctx.shadowBlur = 15
  ctx.beginPath()
  ctx.moveTo(-12, 30)
  ctx.lineTo(-8, 30 + flameLength1)
  ctx.lineTo(-4, 30)
  ctx.closePath()
  ctx.fill()
  
  // 右引擎火焰
  const flameGradient2 = ctx.createLinearGradient(8, 30, 8, 30 + flameLength2)
  flameGradient2.addColorStop(0, '#00ffff')
  flameGradient2.addColorStop(0.3, '#4facfe')
  flameGradient2.addColorStop(0.6, '#ffd700')
  flameGradient2.addColorStop(1, 'transparent')
  
  ctx.fillStyle = flameGradient2
  ctx.beginPath()
  ctx.moveTo(4, 30)
  ctx.lineTo(8, 30 + flameLength2)
  ctx.lineTo(12, 30)
  ctx.closePath()
  ctx.fill()
  
  // 机身能量流动光效
  ctx.shadowBlur = 0
  const energyY = -20 + (time * 20 % 40)
  ctx.strokeStyle = 'rgba(0, 255, 255, 0.5)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(-5, energyY - 20)
  ctx.lineTo(-5, energyY)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(5, energyY - 20)
  ctx.lineTo(5, energyY)
  ctx.stroke()
  
  ctx.restore()
}

// 敌机类型
const enemyTypes = {
  small: {
    width: 30,
    height: 30,
    health: 1,
    speed: 2,
    score: 100,
    color: '#ff6b6b',
    shotChance: 0.005
  },
  medium: {
    width: 45,
    height: 45,
    health: 3,
    speed: 1.5,
    score: 300,
    color: '#ffd93d',
    shotChance: 0.01
  },
  tracker: {
    width: 35,
    height: 35,
    health: 2,
    speed: 2.5,
    score: 250,
    color: '#6bcb77',
    shotChance: 0.008
  }
}

// 生成敌机
const spawnEnemy = () => {
  const types = ['small', 'small', 'small', 'medium', 'tracker']
  const type = types[Math.floor(Math.random() * types.length)]
  const enemyDef = enemyTypes[type]
  
  enemies.value.push({
    x: Math.random() * (600 - enemyDef.width) + enemyDef.width / 2,
    y: -enemyDef.height,
    type: type,
    ...enemyDef,
    direction: Math.random() > 0.5 ? 1 : -1,
    wobble: Math.random() * Math.PI * 2
  })
}

// 绘制敌机 - 全新设计
const drawEnemy = (ctx, enemy) => {
  const time = Date.now() / 1000
  
  ctx.save()
  ctx.translate(enemy.x, enemy.y)
  
  if (enemy.type === 'small') {
    // 🔴 小型敌机 - 侦察机
    ctx.shadowColor = '#ff4444'
    ctx.shadowBlur = 15
    
    // 三角飞翼
    const bodyGradient = ctx.createLinearGradient(0, -15, 0, 15)
    bodyGradient.addColorStop(0, '#ff4444')
    bodyGradient.addColorStop(0.5, '#cc0000')
    bodyGradient.addColorStop(1, '#880000')
    
    ctx.fillStyle = bodyGradient
    ctx.beginPath()
    ctx.moveTo(0, -15)
    ctx.lineTo(-18, 15)
    ctx.lineTo(0, 8)
    ctx.lineTo(18, 15)
    ctx.closePath()
    ctx.fill()
    
    // 引擎光效
    const glowIntensity = 0.5 + Math.sin(time * 8) * 0.3
    ctx.fillStyle = `rgba(255, 100, 100, ${glowIntensity})`
    ctx.shadowColor = '#ff6666'
    ctx.shadowBlur = 10
    ctx.beginPath()
    ctx.arc(-8, 12, 4, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(8, 12, 4, 0, Math.PI * 2)
    ctx.fill()
    
  } else if (enemy.type === 'medium') {
    // 🟡 中型敌机 - 重型战斗机
    ctx.shadowColor = '#ffaa00'
    ctx.shadowBlur = 18
    
    // 主体
    const bodyGradient = ctx.createLinearGradient(0, -22, 0, 22)
    bodyGradient.addColorStop(0, '#ffcc00')
    bodyGradient.addColorStop(0.3, '#ff8800')
    bodyGradient.addColorStop(0.7, '#cc5500')
    bodyGradient.addColorStop(1, '#883300')
    
    ctx.fillStyle = bodyGradient
    
    // 主机身
    ctx.beginPath()
    ctx.moveTo(0, -22)
    ctx.lineTo(-15, -8)
    ctx.lineTo(-18, 10)
    ctx.lineTo(-8, 22)
    ctx.lineTo(0, 18)
    ctx.lineTo(8, 22)
    ctx.lineTo(18, 10)
    ctx.lineTo(15, -8)
    ctx.closePath()
    ctx.fill()
    
    // 装甲板块
    ctx.fillStyle = 'rgba(50, 30, 10, 0.5)'
    ctx.fillRect(-12, -5, 8, 10)
    ctx.fillRect(4, -5, 8, 10)
    
    // 机翼
    ctx.fillStyle = '#cc6600'
    ctx.beginPath()
    ctx.moveTo(-18, 0)
    ctx.lineTo(-28, 12)
    ctx.lineTo(-18, 15)
    ctx.closePath()
    ctx.fill()
    
    ctx.beginPath()
    ctx.moveTo(18, 0)
    ctx.lineTo(28, 12)
    ctx.lineTo(18, 15)
    ctx.closePath()
    ctx.fill()
    
    // 多引擎喷口
    const flameIntensity = 0.6 + Math.sin(time * 6) * 0.2
    ctx.fillStyle = `rgba(255, 200, 0, ${flameIntensity})`
    ctx.shadowColor = '#ffaa00'
    ctx.shadowBlur = 12
    
    for (let i = -1; i <= 1; i++) {
      const flameLen = 10 + Math.random() * 8
      ctx.beginPath()
      ctx.moveTo(i * 8 - 4, 22)
      ctx.lineTo(i * 8, 22 + flameLen)
      ctx.lineTo(i * 8 + 4, 22)
      ctx.closePath()
      ctx.fill()
    }
    
    // 武器炮塔
    ctx.fillStyle = '#553300'
    ctx.beginPath()
    ctx.arc(-10, -5, 4, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(10, -5, 4, 0, Math.PI * 2)
    ctx.fill()
    
  } else {
    // 🟢 追踪敌机 - 追踪者（飞碟造型）
    ctx.shadowColor = '#00ff88'
    ctx.shadowBlur = 20
    
    const rotation = time * 2
    
    // 旋转的外环
    ctx.strokeStyle = 'rgba(0, 255, 136, 0.6)'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.arc(0, 0, 18, rotation, rotation + Math.PI * 1.5)
    ctx.stroke()
    
    ctx.strokeStyle = 'rgba(0, 200, 100, 0.4)'
    ctx.beginPath()
    ctx.arc(0, 0, 18, rotation + Math.PI, rotation + Math.PI * 2.5)
    ctx.stroke()
    
    // 飞碟主体
    const bodyGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 15)
    bodyGradient.addColorStop(0, '#88ffaa')
    bodyGradient.addColorStop(0.5, '#44cc88')
    bodyGradient.addColorStop(1, '#008855')
    
    ctx.fillStyle = bodyGradient
    
    // 飞碟顶部
    ctx.beginPath()
    ctx.ellipse(0, -5, 12, 6, 0, 0, Math.PI * 2)
    ctx.fill()
    
    // 飞碟底部
    ctx.beginPath()
    ctx.ellipse(0, 5, 15, 5, 0, 0, Math.PI * 2)
    ctx.fill()
    
    // 中心脉动能量核心
    const coreSize = 6 + Math.sin(time * 4) * 2
    const coreGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, coreSize)
    coreGradient.addColorStop(0, '#ffffff')
    coreGradient.addColorStop(0.5, '#88ffaa')
    coreGradient.addColorStop(1, 'transparent')
    
    ctx.fillStyle = coreGradient
    ctx.shadowColor = '#00ff88'
    ctx.shadowBlur = 25
    ctx.beginPath()
    ctx.arc(0, 0, coreSize, 0, Math.PI * 2)
    ctx.fill()
    
    // 底部小灯
    ctx.shadowBlur = 8
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI / 2) + rotation
      const lx = Math.cos(angle) * 12
      const ly = Math.sin(angle) * 12 + 5
      ctx.fillStyle = 'rgba(0, 255, 136, 0.8)'
      ctx.beginPath()
      ctx.arc(lx, ly, 2, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  
  ctx.restore()
}

// 更新敌机
const updateEnemies = (deltaTime) => {
  enemies.value = enemies.value.filter(enemy => {
    enemy.wobble += 0.05
    
    if (enemy.type === 'tracker') {
      // 追踪敌机
      const dx = player.value.x - enemy.x
      enemy.x += Math.sign(dx) * enemy.speed * 0.5
      enemy.y += enemy.speed
    } else if (enemy.type === 'medium') {
      // 中型敌机 - 摇摆移动
      enemy.x += Math.sin(enemy.wobble) * 2
      enemy.y += enemy.speed
    } else {
      // 小型敌机 - 直线或Z形移动
      enemy.x += Math.sin(enemy.wobble) * 1.5
      enemy.y += enemy.speed
    }
    
    // 敌机射击
    if (Math.random() < enemy.shotChance) {
      enemyBullets.value.push({
        x: enemy.x,
        y: enemy.y + enemy.height / 2,
        speed: 5,
        width: 4,
        height: 10
      })
    }
    
    return enemy.y < 850
  })
}

// 玩家射击
const playerShoot = (currentTime) => {
  if (currentTime - player.value.lastShot < player.value.shotInterval) return
  player.value.lastShot = currentTime
  
  const bulletSpeed = 10
  
  if (weaponLevel.value === 1) {
    // 单发射击
    playerBullets.value.push({
      x: player.value.x,
      y: player.value.y - 30,
      speed: bulletSpeed,
      width: 4,
      height: 15
    })
  } else if (weaponLevel.value === 2) {
    // 双发射击
    playerBullets.value.push(
      { x: player.value.x - 15, y: player.value.y - 25, speed: bulletSpeed, width: 4, height: 15 },
      { x: player.value.x + 15, y: player.value.y - 25, speed: bulletSpeed, width: 4, height: 15 }
    )
  } else {
    // 三发散射
    playerBullets.value.push(
      { x: player.value.x, y: player.value.y - 30, speed: bulletSpeed, vx: 0, width: 4, height: 15 },
      { x: player.value.x - 20, y: player.value.y - 25, speed: bulletSpeed, vx: -2, width: 4, height: 15 },
      { x: player.value.x + 20, y: player.value.y - 25, speed: bulletSpeed, vx: 2, width: 4, height: 15 }
    )
  }
}

// 绘制子弹
const drawBullet = (ctx, bullet, isEnemy = false) => {
  const gradient = ctx.createLinearGradient(bullet.x, bullet.y - bullet.height / 2, bullet.x, bullet.y + bullet.height / 2)
  
  if (isEnemy) {
    gradient.addColorStop(0, '#ff6b6b')
    gradient.addColorStop(1, '#ff0000')
    ctx.shadowColor = '#ff6b6b'
  } else {
    gradient.addColorStop(0, '#00ffff')
    gradient.addColorStop(1, '#4facfe')
    ctx.shadowColor = '#00ffff'
  }
  
  ctx.shadowBlur = 10
  ctx.fillStyle = gradient
  ctx.fillRect(bullet.x - bullet.width / 2, bullet.y - bullet.height / 2, bullet.width, bullet.height)
  ctx.shadowBlur = 0
}

// 更新子弹
const updateBullets = () => {
  playerBullets.value = playerBullets.value.filter(bullet => {
    bullet.y -= bullet.speed
    if (bullet.vx) bullet.x += bullet.vx
    return bullet.y > -20
  })
  
  enemyBullets.value = enemyBullets.value.filter(bullet => {
    bullet.y += bullet.speed
    return bullet.y < 820
  })
}

// 道具类型
const powerUpTypes = {
  weapon: { emoji: '🔫', color: '#ffd700', effect: 'upgrade' },
  health: { emoji: '❤️', color: '#ff6b6b', effect: 'health' },
  shield: { emoji: '🛡️', color: '#00ffff', effect: 'shield' },
  score: { emoji: '💎', color: '#9b59b6', effect: 'score' }
}

// 生成道具
const spawnPowerUp = (x, y) => {
  if (Math.random() > 0.3) return
  
  const types = Object.keys(powerUpTypes)
  const type = types[Math.floor(Math.random() * types.length)]
  
  powerUps.value.push({
    x: x,
    y: y,
    type: type,
    ...powerUpTypes[type],
    wobble: 0
  })
}

// 绘制道具
const drawPowerUp = (ctx, powerUp) => {
  ctx.shadowColor = powerUp.color
  ctx.shadowBlur = 15
  ctx.font = '30px Arial'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(powerUp.emoji, powerUp.x, powerUp.y)
  ctx.shadowBlur = 0
}

// 更新道具
const updatePowerUps = () => {
  powerUps.value = powerUps.value.filter(powerUp => {
    powerUp.y += 2
    powerUp.wobble += 0.1
    return powerUp.y < 820
  })
}

// 应用道具效果
const applyPowerUp = (powerUp) => {
  switch (powerUp.effect) {
    case 'upgrade':
      if (weaponLevel.value < 3) weaponLevel.value++
      break
    case 'health':
      if (lives.value < 5) lives.value++
      break
    case 'shield':
      hasShield.value = true
      setTimeout(() => { hasShield.value = false }, 5000)
      break
    case 'score':
      score.value += 500
      break
  }
}

// 创建爆炸效果
const createExplosion = (x, y, size = 30) => {
  const particles = []
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2
    particles.push({
      angle: angle,
      dist: 0,
      speed: 2 + Math.random() * 3,
      size: 3 + Math.random() * 4
    })
  }
  
  explosions.value.push({
    x: x,
    y: y,
    size: size * 0.5,
    maxSize: size,
    alpha: 1,
    particles: particles,
    startTime: Date.now()
  })
}

// 绘制爆炸 - 多层效果
const drawExplosion = (ctx, explosion) => {
  const progress = 1 - explosion.alpha
  
  // 内层 - 亮白核心
  const innerGradient = ctx.createRadialGradient(
    explosion.x, explosion.y, 0,
    explosion.x, explosion.y, explosion.size * 0.5
  )
  innerGradient.addColorStop(0, `rgba(255, 255, 255, ${explosion.alpha})`)
  innerGradient.addColorStop(0.5, `rgba(255, 220, 100, ${explosion.alpha * 0.8})`)
  innerGradient.addColorStop(1, `rgba(255, 150, 50, 0)`)
  
  ctx.fillStyle = innerGradient
  ctx.beginPath()
  ctx.arc(explosion.x, explosion.y, explosion.size * 0.5, 0, Math.PI * 2)
  ctx.fill()
  
  // 中层 - 火焰
  const midGradient = ctx.createRadialGradient(
    explosion.x, explosion.y, explosion.size * 0.2,
    explosion.x, explosion.y, explosion.size
  )
  midGradient.addColorStop(0, `rgba(255, 150, 50, ${explosion.alpha * 0.9})`)
  midGradient.addColorStop(0.4, `rgba(255, 80, 30, ${explosion.alpha * 0.7})`)
  midGradient.addColorStop(0.8, `rgba(200, 30, 0, ${explosion.alpha * 0.4})`)
  midGradient.addColorStop(1, `rgba(100, 0, 0, 0)`)
  
  ctx.fillStyle = midGradient
  ctx.beginPath()
  ctx.arc(explosion.x, explosion.y, explosion.size, 0, Math.PI * 2)
  ctx.fill()
  
  // 外层 - 烟雾/冲击波
  const outerGradient = ctx.createRadialGradient(
    explosion.x, explosion.y, explosion.size * 0.5,
    explosion.x, explosion.y, explosion.size * 1.5
  )
  outerGradient.addColorStop(0, `rgba(100, 80, 60, ${explosion.alpha * 0.3})`)
  outerGradient.addColorStop(1, `rgba(50, 40, 30, 0)`)
  
  ctx.fillStyle = outerGradient
  ctx.beginPath()
  ctx.arc(explosion.x, explosion.y, explosion.size * 1.5, 0, Math.PI * 2)
  ctx.fill()
  
  // 碎片粒子
  explosion.particles.forEach(p => {
    const px = explosion.x + Math.cos(p.angle) * p.dist
    const py = explosion.y + Math.sin(p.angle) * p.dist
    
    ctx.fillStyle = `rgba(255, ${150 + Math.random() * 100}, 50, ${explosion.alpha * 0.8})`
    ctx.shadowColor = '#ff8844'
    ctx.shadowBlur = 8
    ctx.beginPath()
    ctx.arc(px, py, p.size * (1 - progress * 0.5), 0, Math.PI * 2)
    ctx.fill()
  })
  ctx.shadowBlur = 0
}

// 更新爆炸
const updateExplosions = () => {
  explosions.value = explosions.value.filter(explosion => {
    explosion.size += 4
    explosion.alpha -= 0.04
    
    // 更新粒子
    explosion.particles.forEach(p => {
      p.dist += p.speed
      p.speed *= 0.95
    })
    
    return explosion.alpha > 0
  })
}

// 碰撞检测
const checkCollisions = () => {
  // 玩家子弹 vs 敌机
  playerBullets.value = playerBullets.value.filter(bullet => {
    let hit = false
    enemies.value = enemies.value.filter(enemy => {
      const dx = Math.abs(bullet.x - enemy.x)
      const dy = Math.abs(bullet.y - enemy.y)
      if (dx < enemy.width / 2 + bullet.width / 2 && 
          dy < enemy.height / 2 + bullet.height / 2) {
        enemy.health--
        if (enemy.health <= 0) {
          score.value += enemy.score
          createExplosion(enemy.x, enemy.y, enemy.width)
          spawnPowerUp(enemy.x, enemy.y)
          return false
        }
        hit = true
      }
      return true
    })
    return !hit
  })
  
  // 敌机子弹 vs 玩家
  if (!hasShield.value) {
    enemyBullets.value = enemyBullets.value.filter(bullet => {
      const dx = Math.abs(bullet.x - player.value.x)
      const dy = Math.abs(bullet.y - player.value.y)
      if (dx < 20 && dy < 30) {
        playerHit()
        return false
      }
      return true
    })
  }
  
  // 敌机 vs 玩家
  if (!hasShield.value) {
    enemies.value = enemies.value.filter(enemy => {
      const dx = Math.abs(enemy.x - player.value.x)
      const dy = Math.abs(enemy.y - player.value.y)
      if (dx < (enemy.width + 40) / 2 && dy < (enemy.height + 50) / 2) {
        playerHit()
        createExplosion(enemy.x, enemy.y, enemy.width)
        return false
      }
      return true
    })
  }
  
  // 玩家 vs 道具
  powerUps.value = powerUps.value.filter(powerUp => {
    const dx = Math.abs(powerUp.x - player.value.x)
    const dy = Math.abs(powerUp.y - player.value.y)
    if (dx < 30 && dy < 30) {
      applyPowerUp(powerUp)
      return false
    }
    return true
  })
}

// 玩家被击中
const playerHit = () => {
  lives.value--
  createExplosion(player.value.x, player.value.y, 40)
  
  if (lives.value <= 0) {
    gameOver()
  } else {
    // 短暂无敌
    hasShield.value = true
    setTimeout(() => { 
      if (lives.value > 0) hasShield.value = false 
    }, 2000)
  }
}

// 游戏结束
const gameOver = () => {
  gameRunning.value = false
  clearInterval(gameLoop.value)
  
  if (score.value > highScore.value) {
    highScore.value = score.value
    localStorage.setItem('thunderHighScore', highScore.value)
    resultMessage.value = '恭喜打破纪录！'
  } else {
    resultMessage.value = '再接再厉！'
  }
  
  statusText.value = `游戏结束！得分：${score.value}`
  
  setTimeout(() => {
    showResultDialog.value = true
  }, 500)
}

// 绘制游戏
const draw = () => {
  const canvas = canvasRef.value
  const ctx = canvas.getContext('2d')
  
  // 清空画布
  const gradient = ctx.createLinearGradient(0, 0, 0, 800)
  gradient.addColorStop(0, '#0a0a23')
  gradient.addColorStop(1, '#1a1a3e')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 600, 800)
  
  drawStars(ctx)
  
  // 绘制道具
  powerUps.value.forEach(p => drawPowerUp(ctx, p))
  
  // 绘制敌机
  enemies.value.forEach(e => drawEnemy(ctx, e))
  
  // 绘制子弹
  playerBullets.value.forEach(b => drawBullet(ctx, b, false))
  enemyBullets.value.forEach(b => drawBullet(ctx, b, true))
  
  // 绘制玩家
  if (gameRunning.value || !gameOver) {
    drawPlayer(ctx)
  }
  
  // 绘制爆炸
  explosions.value.forEach(e => drawExplosion(ctx, e))
}

// 游戏循环
const gameLoopFunction = () => {
  if (!gameRunning.value || gamePaused.value) return
  
  const currentTime = Date.now()
  
  // 更新玩家位置
  if (keys.value.up && player.value.y > 40) player.value.y -= player.value.speed
  if (keys.value.down && player.value.y < 760) player.value.y += player.value.speed
  if (keys.value.left && player.value.x > 30) player.value.x -= player.value.speed
  if (keys.value.right && player.value.x < 570) player.value.x += player.value.speed
  
  // 触屏控制
  if (isTouching.value) {
    const dx = touchX.value - player.value.x
    const dy = touchY.value - player.value.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist > 5) {
      player.value.x += (dx / dist) * player.value.speed
      player.value.y += (dy / dist) * player.value.speed
      player.value.x = Math.max(30, Math.min(570, player.value.x))
      player.value.y = Math.max(40, Math.min(760, player.value.y))
    }
  }
  
  // 生成敌机
  if (Math.random() < 0.02 + score.value / 50000) {
    spawnEnemy()
  }
  
  // 玩家射击
  playerShoot(currentTime)
  
  // 更新游戏对象
  updateStars()
  updateEnemies()
  updateBullets()
  updatePowerUps()
  updateExplosions()
  
  // 碰撞检测
  checkCollisions()
  
  // 绘制
  draw()
}

// 开始游戏
const startGame = () => {
  if (gameRunning.value) return
  
  gameRunning.value = true
  gamePaused.value = false
  statusText.value = '游戏进行中'
  
  gameLoop.value = setInterval(gameLoopFunction, 16)
}

// 暂停游戏
const pauseGame = () => {
  if (!gameRunning.value) return
  gamePaused.value = !gamePaused.value
  statusText.value = gamePaused.value ? '游戏已暂停' : '游戏进行中'
}

// 重新开始
const restartGame = () => {
  clearInterval(gameLoop.value)
  
  // 重置状态
  score.value = 0
  lives.value = 3
  weaponLevel.value = 1
  hasShield.value = false
  gameRunning.value = false
  gamePaused.value = false
  statusText.value = '点击开始游戏'
  showResultDialog.value = false
  
  // 重置游戏对象
  player.value.x = 300
  player.value.y = 650
  enemies.value = []
  playerBullets.value = []
  enemyBullets.value = []
  powerUps.value = []
  explosions.value = []
  
  initStars()
  draw()
}

// 返回主页
const goHome = () => {
  clearInterval(gameLoop.value)
  router.push('/')
}

// 键盘事件
const handleKeyDown = (e) => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', 'W', 'A', 'S', 'D', ' '].includes(e.key)) {
    e.preventDefault()
  }
  
  switch (e.key) {
    case 'ArrowUp':
    case 'w':
    case 'W':
      keys.value.up = true
      break
    case 'ArrowDown':
    case 's':
    case 'S':
      keys.value.down = true
      break
    case 'ArrowLeft':
    case 'a':
    case 'A':
      keys.value.left = true
      break
    case 'ArrowRight':
    case 'd':
    case 'D':
      keys.value.right = true
      break
    case ' ':
      if (!gameRunning.value) startGame()
      else pauseGame()
      break
  }
}

const handleKeyUp = (e) => {
  switch (e.key) {
    case 'ArrowUp':
    case 'w':
    case 'W':
      keys.value.up = false
      break
    case 'ArrowDown':
    case 's':
    case 'S':
      keys.value.down = false
      break
    case 'ArrowLeft':
    case 'a':
    case 'A':
      keys.value.left = false
      break
    case 'ArrowRight':
    case 'd':
    case 'D':
      keys.value.right = false
      break
  }
}

// 触屏事件
const handleTouchStart = (e) => {
  e.preventDefault()
  const touch = e.touches[0]
  const rect = canvasRef.value.getBoundingClientRect()
  isTouching.value = true
  touchX.value = touch.clientX - rect.left
  touchY.value = touch.clientY - rect.top
}

const handleTouchMove = (e) => {
  e.preventDefault()
  if (!isTouching.value) return
  const touch = e.touches[0]
  const rect = canvasRef.value.getBoundingClientRect()
  touchX.value = touch.clientX - rect.left
  touchY.value = touch.clientY - rect.top
}

const handleTouchEnd = (e) => {
  e.preventDefault()
  isTouching.value = false
}

onMounted(() => {
  initStars()
  draw()
  canvasRef.value.focus()
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
  margin-bottom: 30px;
}

h1 {
  font-size: 2.8em;
  margin: 0;
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
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
  padding: 30px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.game-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 20px;
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  border-radius: 15px;
  flex-wrap: wrap;
  gap: 15px;
  box-shadow: 0 8px 20px rgba(79, 172, 254, 0.3);
}

.score-container, .status-container {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.score, .high-score, .lives, .weapon-level {
  font-size: 1.1em;
  font-weight: bold;
  color: white;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.2);
}

.score span, .high-score span {
  color: #ffd700;
  font-size: 1.3em;
}

.game-status {
  font-size: 1.3em;
  font-weight: bold;
  color: #ff6b6b;
  width: 100%;
  text-align: center;
  animation: statusPulse 1s ease-in-out infinite;
}

@keyframes statusPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.board-container {
  display: flex;
  justify-content: center;
  margin: 25px 0;
  position: relative;
}

canvas {
  background: linear-gradient(180deg, #0a0a23 0%, #1a1a3e 100%);
  border: 4px solid transparent;
  border-radius: 15px;
  box-shadow: 0 0 30px rgba(79, 172, 254, 0.5);
  outline: none;
  position: relative;
  transition: all 0.3s;
}

canvas:focus {
  box-shadow: 0 0 40px rgba(79, 172, 254, 0.7);
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
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: white;
  box-shadow: 0 6px 20px rgba(79, 172, 254, 0.4);
}

.btn-primary:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 30px rgba(79, 172, 254, 0.6);
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
  margin-top: 30px;
  padding: 25px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-radius: 15px;
  box-shadow: inset 0 2px 10px rgba(0, 0, 0, 0.1);
}

.game-controls h3 {
  color: #4facfe;
  margin-bottom: 15px;
  font-size: 1.3em;
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
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s;
}

.control-item:hover {
  transform: translateY(-3px);
}

.control-item strong {
  color: #4facfe;
  display: block;
  margin-bottom: 8px;
  font-size: 1.05em;
}

.control-item p {
  color: #666;
  line-height: 1.6;
  margin: 0;
}

.game-rules {
  margin-top: 30px;
  padding: 25px;
  background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
  border-radius: 15px;
  box-shadow: inset 0 2px 10px rgba(0, 0, 0, 0.1);
}

.game-rules h3 {
  color: #e74c3c;
  margin-bottom: 15px;
  font-size: 1.3em;
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
  line-height: 1.6;
  font-size: 1.02em;
}

.game-rules li:before {
  content: "✈️";
  position: absolute;
  left: 0;
  font-size: 1.1em;
}

footer {
  text-align: center;
  color: white;
  margin-top: 30px;
  padding: 20px;
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
    max-width: 600px;
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
