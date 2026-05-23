<template>
  <div class="home-container">
    <header>
      <h1>🎮 游戏集合</h1>
      <p class="subtitle">经典小游戏合集，即开即玩</p>
    </header>

    <main>
      <div class="games-grid">
        <!-- 五子棋游戏卡片 -->
        <router-link to="/gomoku" class="game-card">
          <div class="game-icon">⚫</div>
          <h2 class="game-title">五子棋</h2>
          <p class="game-description">
            经典的策略对战游戏，支持人机对战和双人对战模式
          </p>
          <div class="game-info">
            <span class="difficulty">难度: ⭐⭐⭐⭐</span>
            <span>人机/双人</span>
          </div>
        </router-link>

        <!-- 贪吃蛇游戏卡片 -->
        <router-link to="/snake" class="game-card">
          <div class="game-icon">🐍</div>
          <h2 class="game-title">贪吃蛇</h2>
          <p class="game-description">
            经典贪吃蛇游戏，控制蛇吃掉食物，不要撞墙或咬到自己
          </p>
          <div class="game-info">
            <span class="difficulty">难度: ⭐⭐</span>
            <span>单人游戏</span>
          </div>
        </router-link>

      <!-- 雷霆战机游戏卡片 -->
      <router-link to="/thunder-fighter" class="game-card">
        <div class="game-icon">✈️</div>
        <h2 class="game-title">雷霆战机</h2>
        <p class="game-description">
          经典射击游戏，控制战机消灭敌机，升级武器挑战最高分
        </p>
        <div class="game-info">
          <span class="difficulty">难度: ⭐⭐⭐</span>
          <span>单人游戏</span>
        </div>
      </router-link>

       <!-- 2048游戏卡片 -->
       <router-link to="/2048" class="game-card">
         <div class="game-icon">🎮</div>
         <h2 class="game-title">2048</h2>
         <p class="game-description">
           经典益智游戏，移动方块合并相同数字，目标合成2048！
         </p>
         <div class="game-info">
           <span class="difficulty">难度: ⭐⭐</span>
           <span>单人游戏</span>
         </div>
       </router-link>

       <!-- 俄罗斯方块游戏卡片 -->
       <router-link to="/tetris" class="game-card">
         <div class="game-icon">🧱</div>
         <h2 class="game-title">俄罗斯方块</h2>
         <p class="game-description">
           经典永不过时！移动、旋转和消除方块，挑战最高分
         </p>
         <div class="game-info">
           <span class="difficulty">难度: ⭐⭐⭐</span>
           <span>单人游戏</span>
         </div>
       </router-link>

       <!-- Flappy Bird游戏卡片 -->
       <router-link to="/flappy-bird" class="game-card">
         <div class="game-icon">🐦</div>
         <h2 class="game-title">Flappy Bird</h2>
         <p class="game-description">
           经典爆款！点击让小鸟飞翔，不要撞到水管！
         </p>
         <div class="game-info">
           <span class="difficulty">难度: ⭐⭐⭐⭐</span>
           <span>单人游戏</span>
         </div>
       </router-link>

        <!-- 打地鼠游戏卡片 -->
        <router-link to="/whack-a-mole" class="game-card">
          <div class="game-icon">🔨</div>
          <h2 class="game-title">打地鼠</h2>
          <p class="game-description">
            考验你的反应力！快速点击冒出来的地鼠得分！
          </p>
        <div class="game-info">
          <span class="difficulty">难度: ⭐⭐</span>
          <span>单人游戏</span>
        </div>
      </router-link>
      
      <router-link to="/animal-match" class="game-card">
        <div class="game-icon">🐾</div>
        <h2 class="game-title">动物消消乐</h2>
        <p class="game-description">
          可爱的动物消除游戏！交换配对，挑战最高分！
        </p>
        <div class="game-info">
          <span class="difficulty">难度: ⭐⭐</span>
          <span>单人游戏</span>
        </div>
      </router-link>
      
      <router-link to="/tic-tac-toe" class="game-card">
        <div class="game-icon">⭕</div>
        <h2 class="game-title">井字棋</h2>
        <p class="game-description">
          经典井字棋游戏！支持人机对战和双人对战，AI有三个难度！
        </p>
        <div class="game-info">
          <span class="difficulty">难度: ⭐⭐</span>
          <span>人机/双人</span>
        </div>
      </router-link>
    </div>
  </main>

    <PageFooter />
  </div>
</template>

<script setup>
import PageFooter from '../components/PageFooter.vue'
</script>

<style scoped>
.home-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

header {
  text-align: center;
  color: white;
  margin-bottom: 40px;
}

h1 {
  font-size: 3em;
  margin-bottom: 10px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.subtitle {
  font-size: 1.2em;
  opacity: 0.9;
}

.games-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 30px;
  margin-top: 40px;
}

.game-card {
  background: white;
  border-radius: 15px;
  padding: 30px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  cursor: pointer;
  text-decoration: none;
  color: inherit;
  display: block;
}

.game-card:hover {
  transform: translateY(-10px);
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.3);
}

.game-icon {
  font-size: 4em;
  margin-bottom: 15px;
  text-align: center;
}

.game-title {
  font-size: 1.8em;
  margin-bottom: 10px;
  color: #667eea;
  text-align: center;
}

.game-description {
  color: #666;
  line-height: 1.6;
  text-align: center;
}

.game-info {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: space-around;
  font-size: 0.9em;
}

.difficulty {
  color: #999;
}



@media (max-width: 768px) {
  h1 {
    font-size: 2em;
  }

  .games-grid {
    grid-template-columns: 1fr;
  }
}
</style>
