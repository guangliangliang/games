# 弹窗组件使用指南

项目中提供了三个精美的弹窗组件，完全替代原生的 `alert` 和 `confirm`。

## 📦 组件列表

### 1. Modal - 基础弹窗组件

最基础的弹窗组件，提供灵活的自定义功能。

**使用示例：**
```vue
<template>
  <Modal v-model="showModal" title="提示">
    <p>这是自定义内容</p>
  </Modal>
</template>

<script setup>
import { ref } from 'vue'
import Modal from '../components/Modal.vue'

const showModal = ref(false)
</script>
```

**Props：**
- `modelValue`: 控制显示/隐藏（必填）
- `title`: 标题文字
- `message`: 简单文本消息
- `showClose`: 是否显示关闭按钮
- `closeOnClickOutside`: 点击遮罩层是否关闭
- `actions`: 自定义按钮数组

### 2. GameResultDialog - 游戏结果弹窗

专门用于显示游戏结束结果的弹窗。

**使用示例：**
```vue
<template>
  <GameResultDialog
    v-model="showResult"
    title="游戏结束"
    message="恭喜你赢了！"
    icon="🎉"
    :score="100"
    confirm-text="再来一局"
    show-cancel
    cancel-text="返回主页"
    @confirm="restartGame"
    @cancel="goHome"
  />
</template>

<script setup>
import { ref } from 'vue'
import GameResultDialog from '../components/GameResultDialog.vue'

const showResult = ref(false)
</script>
```

**Props：**
- `modelValue`: 控制显示/隐藏
- `title`: 标题
- `message`: 主要消息
- `icon`: Emoji 图标
- `score`: 分数（可选）
- `confirmText`: 确认按钮文字
- `showCancel`: 是否显示取消按钮
- `cancelText`: 取消按钮文字

**Events：**
- `@confirm`: 确认按钮点击
- `@cancel`: 取消按钮点击

### 3. ConfirmDialog - 确认对话框

替代原生 `confirm` 的确认对话框。

**使用示例：**
```vue
<template>
  <ConfirmDialog
    v-model="showConfirm"
    message="确定要删除吗？"
    confirm-text="删除"
    cancel-text="取消"
    confirm-type="danger"
    @confirm="handleDelete"
    @cancel="handleCancel"
  />
</template>

<script setup>
import { ref } from 'vue'
import ConfirmDialog from '../components/ConfirmDialog.vue'

const showConfirm = ref(false)
</script>
```

**Props：**
- `modelValue`: 控制显示/隐藏
- `title`: 标题（默认"确认"）
- `message`: 确认消息
- `confirmText`: 确认按钮文字
- `cancelText`: 取消按钮文字
- `confirmType`: 按钮类型（primary/success/danger）
- `showClose`: 是否显示关闭按钮
- `closeOnClickOutside`: 点击外部是否关闭

**Events：**
- `@confirm`: 确认操作
- `@cancel`: 取消操作

## 🎨 按钮类型

- `btn-primary`: 主要按钮（紫色渐变）
- `btn-secondary`: 次要按钮（灰色）
- `btn-success`: 成功按钮（绿色）
- `btn-danger`: 危险按钮（红色）

## 💡 最佳实践

### 1. 游戏胜利场景
```vue
<GameResultDialog
  v-model="showWin"
  title="游戏结束"
  message="恭喜你获胜！"
  icon="🏆"
  :score="finalScore"
  @confirm="restart"
/>
```

### 2. 游戏失败场景
```vue
<GameResultDialog
  v-model="showLose"
  title="游戏结束"
  message="再接再厉！"
  icon="💪"
  :score="finalScore"
  @confirm="tryAgain"
/>
```

### 3. 平局场景
```vue
<GameResultDialog
  v-model="showDraw"
  title="游戏结束"
  message="势均力敌的对决！"
  icon="🤝"
  @confirm="restart"
/>
```

### 4. 确认操作场景
```vue
<ConfirmDialog
  v-model="showDeleteConfirm"
  message="确定要删除这个记录吗？"
  confirm-text="删除"
  cancel-text="取消"
  confirm-type="danger"
  @confirm="deleteRecord"
/>
```

## ✨ 特性

- ✅ 优雅的动画效果
- ✅ 响应式设计
- ✅ 支持 ESC 键关闭
- ✅ 点击遮罩层关闭（可配置）
- ✅ 阻止背景滚动
- ✅ 多个按钮样式选择
- ✅ 完整的无障碍支持

## 🚫 不再使用原生弹窗

**之前：**
```javascript
alert('游戏结束')
if (confirm('确定吗？')) { ... }
```

**现在：**
```javascript
// 游戏结果
showResultDialog.value = true

// 确认操作
showConfirmDialog.value = true
```

---

所有弹窗组件都已集成到游戏中，提供统一且美观的用户体验！
