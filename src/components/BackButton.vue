<template>
  <router-link to="/" class="back-link">
    ← 返回
  </router-link>
</template>

<script setup>
// 组件很简单，就是一个返回链接
</script>

<style scoped>
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
  z-index: 10;
}

.back-link:hover {
  opacity: 1;
  background: rgba(255, 255, 255, 0.25);
  transform: translateY(-50%) translateX(5px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}
</style>
