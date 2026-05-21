<template>
  <Transition name="modal">
    <div v-if="modelValue" class="modal-overlay" @click="handleOverlayClick">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>{{ title }}</h3>
          <button v-if="showClose" class="close-btn" @click="close">&times;</button>
        </div>
        <div class="modal-body">
          <slot>
            <p>{{ message }}</p>
          </slot>
        </div>
        <div class="modal-footer">
          <button 
            v-for="action in actions" 
            :key="action.text"
            class="btn"
            :class="action.type || 'btn-primary'"
            @click="handleAction(action)"
          >
            {{ action.text }}
          </button>
          <button 
            v-if="!actions.length" 
            class="btn btn-primary"
            @click="close"
          >
            确定
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true
  },
  title: {
    type: String,
    default: '提示'
  },
  message: {
    type: String,
    default: ''
  },
  showClose: {
    type: Boolean,
    default: false
  },
  closeOnClickOutside: {
    type: Boolean,
    default: true
  },
  actions: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue', 'close', 'action'])

const close = () => {
  emit('update:modelValue', false)
  emit('close')
}

const handleOverlayClick = () => {
  if (props.closeOnClickOutside) {
    close()
  }
}

const handleAction = (action) => {
  if (action.handler) {
    action.handler()
  }
  if (action.close !== false) {
    close()
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 15px;
  min-width: 300px;
  max-width: 500px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  animation: modalSlideIn 0.3s ease;
}

.modal-header {
  padding: 20px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  color: #333;
  font-size: 1.3em;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.8em;
  cursor: pointer;
  color: #999;
  padding: 0;
  width: 30px;
  height: 30px;
  line-height: 1;
  transition: color 0.3s;
}

.close-btn:hover {
  color: #333;
}

.modal-body {
  padding: 25px 20px;
  min-height: 50px;
}

.modal-body p {
  margin: 0;
  line-height: 1.6;
  color: #666;
  font-size: 1.1em;
}

.modal-footer {
  padding: 15px 20px;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.btn {
  padding: 10px 25px;
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

.btn-success {
  background: #4ecca3;
  color: white;
}

.btn-success:hover {
  background: #45b393;
}

.btn-danger {
  background: #ff6b6b;
  color: white;
}

.btn-danger:hover {
  background: #ee5a5a;
}

/* 动画 */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-content,
.modal-leave-active .modal-content {
  transition: transform 0.3s ease;
}

.modal-enter-from .modal-content,
.modal-leave-to .modal-content {
  transform: scale(0.8) translateY(-20px);
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: scale(0.8) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
</style>
