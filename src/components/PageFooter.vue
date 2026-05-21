<template>
  <footer class="footer">
    <div class="footer-content">
      <p v-if="displayCopyright" class="copyright">{{ displayCopyright }}</p>
      <div class="beian-info">
        <a v-if="icp" :href="icpUrl" target="_blank" rel="noopener noreferrer" class="beian-link">
          {{ icp }}
        </a>
        <a v-if="psb" :href="psbUrl" target="_blank" rel="noopener noreferrer" class="beian-link">
          {{ psb }}
        </a>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  copyright: {
    type: String,
    default: ''
  }
})

const currentYear = new Date().getFullYear()

const displayCopyright = computed(() => {
  if (!props.copyright) {
    return `© ${currentYear} 游戏集合 | Vue3 + Vite 构建`
  }
  // 替换版权信息中的年份占位符
  return props.copyright.replace(/©\s*\d{4}/, `© ${currentYear}`)
})

// 获取环境变量中的备案信息
const icp = import.meta.env.VITE_APP_ICP
const icpUrl = import.meta.env.VITE_APP_ICP_URL
const psb = import.meta.env.VITE_APP_PSB
const psbUrl = import.meta.env.VITE_APP_PSB_URL
</script>

<style scoped>
.footer {
  text-align: center;
  color: white;
  padding: 20px;
  opacity: 0.9;
  margin-top: auto;
  width: 100%;
}

.footer-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.copyright {
  margin: 0;
  font-size: 1em;
}

.beian-info {
  display: flex;
  gap: 20px;
  justify-content: center;
  flex-wrap: wrap;
}

.beian-link {
  color: rgba(255, 255, 255, 0.8);
  text-decoration: none;
  font-size: 0.9em;
  transition: color 0.3s ease;
}

.beian-link:hover {
  color: white;
  text-decoration: underline;
}

@media (max-width: 768px) {
  .beian-info {
    flex-direction: column;
    gap: 5px;
  }
}
</style>
