<template>
  <div class="demo-container">
    <h1>弹窗组件演示</h1>
    
    <div class="demo-section">
      <h2>1. Modal - 基础弹窗</h2>
      <button @click="showBasicModal = true" class="btn btn-primary">
        显示基础弹窗
      </button>
      
      <Modal 
        v-model="showBasicModal" 
        title="基础弹窗"
        show-close
      >
        <p>这是一个基础的弹窗示例，可以包含任意内容。</p>
        <p>支持自定义标题、按钮和关闭方式。</p>
      </Modal>
    </div>

    <div class="demo-section">
      <h2>2. GameResultDialog - 游戏结果弹窗</h2>
      <button @click="showWinDialog = true" class="btn btn-success">
        显示胜利弹窗
      </button>
      <button @click="showLoseDialog = true" class="btn btn-danger" style="margin-left: 10px;">
        显示失败弹窗
      </button>
      
      <GameResultDialog
        v-model="showWinDialog"
        title="游戏结束"
        message="恭喜你获胜！"
        icon="🏆"
        :score="150"
        @confirm="handleRestart"
      />
      
      <GameResultDialog
        v-model="showLoseDialog"
        title="游戏结束"
        message="再接再厉！"
        icon="💪"
        :score="80"
        @confirm="handleRestart"
      />
    </div>

    <div class="demo-section">
      <h2>3. ConfirmDialog - 确认对话框</h2>
      <button @click="showConfirmDialog = true" class="btn btn-secondary">
        显示确认对话框
      </button>
      
      <ConfirmDialog
        v-model="showConfirmDialog"
        message="确定要执行这个操作吗？"
        confirm-text="确定"
        cancel-text="取消"
        confirm-type="primary"
        @confirm="handleConfirm"
        @cancel="handleCancel"
      />
    </div>

    <div class="demo-result" v-if="result">
      <h3>操作结果：</h3>
      <p>{{ result }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Modal, GameResultDialog, ConfirmDialog } from '../components/index.js'

const showBasicModal = ref(false)
const showWinDialog = ref(false)
const showLoseDialog = ref(false)
const showConfirmDialog = ref(false)
const result = ref('')

const handleRestart = () => {
  result.value = '用户点击了"再来一局"'
  setTimeout(() => result.value = '', 3000)
}

const handleConfirm = () => {
  result.value = '用户点击了"确定"'
  setTimeout(() => result.value = '', 3000)
}

const handleCancel = () => {
  result.value = '用户点击了"取消"'
  setTimeout(() => result.value = '', 3000)
}
</script>

<style scoped>
.demo-container {
  max-width: 800px;
  margin: 50px auto;
  padding: 30px;
  background: white;
  border-radius: 15px;
}

h1 {
  text-align: center;
  color: #667eea;
  margin-bottom: 40px;
}

.demo-section {
  margin-bottom: 40px;
  padding: 20px;
  background: #f5f5f5;
  border-radius: 10px;
}

.demo-section h2 {
  color: #333;
  margin-bottom: 15px;
  font-size: 1.3em;
}

.btn {
  padding: 12px 30px;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  font-size: 1em;
  font-weight: bold;
  transition: all 0.3s;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-success {
  background: #4ecca3;
  color: white;
}

.btn-danger {
  background: #ff6b6b;
  color: white;
}

.btn-secondary {
  background: #ecf0f1;
  color: #2c3e50;
}

.demo-result {
  margin-top: 30px;
  padding: 20px;
  background: #e3f2fd;
  border-radius: 10px;
  text-align: center;
}

.demo-result h3 {
  color: #1976d2;
  margin-bottom: 10px;
}

.demo-result p {
  color: #333;
  font-size: 1.1em;
}
</style>
