<template>
  <Modal 
    v-model="visible" 
    :title="title"
    :close-on-click-outside="false"
    :show-close="false"
  >
    <div class="game-result">
      <div class="result-icon">{{ icon }}</div>
      <div class="result-message">{{ message }}</div>
      <div class="result-score" v-if="score !== null">
        得分: {{ score }}
      </div>
      <div class="result-actions">
        <button @click="handleConfirm" class="btn btn-primary">
          {{ confirmText }}
        </button>
        <button v-if="showCancel" @click="handleCancel" class="btn btn-secondary">
          {{ cancelText }}
        </button>
      </div>
    </div>
  </Modal>
</template>

<script setup>
import { computed } from 'vue'
import Modal from './Modal.vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true
  },
  title: {
    type: String,
    default: '游戏结束'
  },
  message: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    default: '🎉'
  },
  score: {
    type: Number,
    default: null
  },
  confirmText: {
    type: String,
    default: '再来一局'
  },
  showCancel: {
    type: Boolean,
    default: false
  },
  cancelText: {
    type: String,
    default: '返回'
  }
})

const emit = defineEmits(['update:modelValue', 'confirm', 'cancel'])

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const handleConfirm = () => {
  emit('confirm')
}

const handleCancel = () => {
  emit('cancel')
  visible.value = false
}
</script>

<style scoped>
.game-result {
  text-align: center;
}

.result-icon {
  font-size: 4em;
  margin-bottom: 15px;
}

.result-message {
  font-size: 1.3em;
  color: #333;
  margin-bottom: 20px;
  font-weight: bold;
}

.result-score {
  font-size: 1.2em;
  color: #667eea;
  margin-bottom: 25px;
  font-weight: bold;
}

.result-actions {
  display: flex;
  gap: 15px;
  justify-content: center;
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
}
</style>
