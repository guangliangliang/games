# 🎮 游戏集合 (Vue3 + Vite)

一个基于 Vue3 + Vite 的小游戏合集项目，包含多个经典游戏，无需安装，打开浏览器即可游玩！

## 🚀 技术栈

- **Vue 3** - 渐进式 JavaScript 框架
- **Vite** - 下一代前端构建工具
- **Vue Router** - Vue.js 官方路由管理器
- **HTML5 Canvas** - 游戏画面渲染

## 🎯 游戏列表

| 游戏 | 描述 | 难度 | 类型 |
| --- | --- | --- | --- |
| [五子棋](./src/views/Gomoku.vue) | 经典的策略对战游戏，五子连珠获胜 | ⭐⭐⭐⭐ | 双人对战 |
| [贪吃蛇](./src/views/Snake.vue) | 经典贪吃蛇游戏，考验你的反应能力 | ⭐⭐ | 单人游戏 |

## 📦 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

浏览器会自动打开 `http://localhost:3000`

### 构建生产版本

```bash
npm run build
```

### 预览生产构建

```bash
npm run preview
```

## 📂 项目结构

```
games/
├── src/
│   ├── views/           # 页面视图
│   │   ├── Home.vue     # 主页
│   │   ├── Gomoku.vue   # 五子棋游戏
│   │   └── Snake.vue    # 贪吃蛇游戏
│   ├── App.vue          # 根组件
│   ├── main.js          # 入口文件
│   └── style.css        # 全局样式
├── index.html           # HTML 模板
├── vite.config.js       # Vite 配置
├── package.json         # 项目配置和依赖
└── README.md            # 项目说明
```

## ✨ 特性

- ✅ Vue 3 Composition API
- ✅ Vue Router 路由导航
- ✅ **自定义弹窗组件**（替代原生 alert/confirm）
- ✅ 响应式设计，支持多端设备
- ✅ 热模块替换（HMR），开发体验极佳
- ✅ 优化的生产构建
- ✅ 本地存储游戏记录

### 五子棋 (Gomoku)
- ✅ 人机对战模式（AI）
- ✅ 双人对战模式
- ✅ 15×15 标准棋盘
- ✅ 智能AI对手
- ✅ 自动判断胜负
- ✅ 悔棋功能
- ✅ 精美的棋子设计
- ✅ 最后一步高亮显示

## 🤝 如何贡献

欢迎贡献新的游戏或改进现有功能：

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

### 添加新游戏指南

1. 在 `src/views/` 目录创建新的游戏组件（如 `NewGame.vue`）
2. 使用 Vue 3 Composition API 实现游戏逻辑
3. 在 `src/main.js` 中添加路由配置
4. 在主页 `Home.vue` 中添加游戏卡片
5. 提交 Pull Request

## 🛠️ 开发建议

- 使用 Vue 3 Composition API (`<script setup>`)
- 保持组件单一职责
- 复用公共逻辑到 composables
- 遵循 Vue 风格指南

## 📜 许可证

本项目基于 MIT 许可证开源

---

**享受游戏的乐趣吧！** 🎉
