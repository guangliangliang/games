<template>
  <Modal 
    v-model="visible" 
    :title="title"
    :actions="actions"
    :show-close="showClose"
    :close-on-click-outside="closeOnClickOutside"
  >
    <div class="confirm-content">
      <p>{{ message }}</p>
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
    default: '确认'
  },
  message: {
    type: String,
    required: true
  },
  showClose: {
    type: Boolean,
    default: false
  },
  closeOnClickOutside: {
    type: Boolean,
    default: false
  },
  confirmText: {
    type: String,
    default: '确定'
  },
  cancelText: {
    type: String,
    default: '取消'
  },
  confirmType: {
    type: String,
    default: 'primary' // primary, success, danger
  }
})

const emit = defineEmits(['update:modelValue', 'confirm', 'cancel'])

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const actions = computed(() => [
  {
    text: props.cancelText,
    type: 'btn-secondary',
    handler: () => emit('cancel'),
    close: true
  },
  {
    text: props.confirmText,
    type: `btn-${props.confirmType}`,
    handler: () => emit('confirm'),
    close: true
  }
])
</script>

<style scoped>
.confirm-content {
  text-align: center;
}

.confirm-content p {
  margin: 0;
  line-height: 1.6;
  color: #666;
  font-size: 1.1em;
}
</style>
