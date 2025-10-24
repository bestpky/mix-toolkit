# 跨标签页协作编辑器

基于 TipTap + RxJS + BroadcastChannel API 实现的实时跨标签页协作富文本编辑器。

## 功能特性

- ✅ **自动跨标签页同步**：在任意标签页编辑内容，其他标签页实时同步
- ✅ **实时在线状态**：显示当前打开的所有标签页及用户信息
- ✅ **光标位置同步**：查看其他标签页用户的光标位置
- ✅ **自动用户管理**：标签页打开时自动加入，关闭时自动移除
- ✅ **无需后端**：纯前端实现，使用 BroadcastChannel API
- ✅ **防抖优化**：内容同步和光标位置更新都经过防抖处理

## 技术架构

### 核心技术栈

- **TipTap**: 富文本编辑器核心
- **RxJS**: 响应式编程，处理事件流
- **BroadcastChannel API**: 浏览器原生跨标签页通信
- **React**: UI 框架

### 架构设计

```
┌─────────────────────────────────────────────────────────┐
│                  CollaborationEditor                     │
│  (React Component)                                       │
└──────────────────┬──────────────────────────────────────┘
                   │
         ┌─────────┴─────────┐
         │                   │
    ┌────▼────┐      ┌──────▼──────┐
    │ TipTap  │      │useCollaboration│
    │ Editor  │      │    Hook      │
    └────┬────┘      └──────┬──────┘
         │                   │
         │         ┌─────────▼─────────┐
         └────────►│CollaborationExtension│
                   │   (TipTap Plugin)  │
                   └─────────┬─────────┘
                             │
                   ┌─────────┴─────────┐
                   │                   │
            ┌──────▼──────┐   ┌───────▼────────┐
            │   RxJS      │   │ BroadcastChannel│
            │  Subjects   │   │      API        │
            └─────────────┘   └────────┬────────┘
                                       │
                              ┌────────▼────────┐
                              │  Other Tabs     │
                              │  同步更新        │
                              └─────────────────┘
```

## 使用方法

### 基础用法

```tsx
import { CollaborationEditor } from '@mix-toolkit/editor'

function App() {
  return <CollaborationEditor />
}
```

### 自定义配置

```tsx
<CollaborationEditor
  userName="张三"
  userColor="#3b82f6"
  initialContent="<p>自定义初始内容</p>"
/>
```

### Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `userName` | `string` | `用户{随机数}` | 当前用户显示名称 |
| `userColor` | `string` | 随机颜色 | 用户标识颜色 |
| `initialContent` | `string` | 默认提示文本 | 编辑器初始内容（HTML） |

## 工作原理

### 1. 标签页生命周期

```typescript
// 标签页打开时
onCreate() {
  - 生成唯一 tabId
  - 创建用户信息（随机名称和颜色）
  - 广播 USER_JOINED 消息
  - 其他标签页收到后回复自己的信息
}

// 标签页关闭时
beforeunload() {
  - 广播 USER_LEFT 消息
  - 其他标签页移除该用户
}
```

### 2. 内容同步

```typescript
// 用户编辑时
onUpdate() {
  - 将内容变更发送到 documentChanges$ Subject
  - 经过 300ms 防抖
  - 广播 CONTENT_CHANGE 消息到其他标签页
}

// 其他标签页接收
onReceive(CONTENT_CHANGE) {
  - 检查不是自己的变更
  - 使用 setContent(content, false) 更新编辑器
  - false 参数防止触发新的 onUpdate 事件
}
```

### 3. 光标同步

```typescript
// 光标移动时
onSelectionUpdate() {
  - 将光标位置发送到 cursorUpdates$ Subject
  - 经过 100ms 防抖
  - 广播 CURSOR_UPDATE 消息
}

// 其他标签页接收
onReceive(CURSOR_UPDATE) {
  - 更新用户列表中该用户的光标位置
  - UI 显示光标图标
}
```

### 4. 防抖优化

使用 RxJS 的 `debounceTime` 操作符：

- **内容同步**: 300ms 防抖，避免每次按键都广播
- **光标同步**: 100ms 防抖，保证流畅度同时减少消息频率

## 消息类型

```typescript
type BroadcastMessage =
  | { type: 'USER_JOINED'; payload: User }
  | { type: 'USER_LEFT'; payload: { userId: string } }
  | { type: 'CONTENT_CHANGE'; payload: { content: any; userId: string } }
  | { type: 'CURSOR_UPDATE'; payload: { userId: string; position: { from: number; to: number } } }
```

## 数据流

```
用户输入
  ↓
TipTap onUpdate
  ↓
documentChanges$ Subject
  ↓
debounceTime(300ms)
  ↓
BroadcastChannel.postMessage()
  ↓
其他标签页 BroadcastChannel.onmessage
  ↓
messages$ Subject
  ↓
CollaborationExtension 处理
  ↓
editor.commands.setContent()
  ↓
UI 更新
```

## 浏览器兼容性

需要支持 BroadcastChannel API 的浏览器：

- ✅ Chrome 54+
- ✅ Firefox 38+
- ✅ Safari 15.4+
- ✅ Edge 79+

[查看完整兼容性](https://caniuse.com/broadcastchannel)

## 测试方法

1. 启动开发服务器：
   ```bash
   npm run dev
   ```

2. 打开浏览器访问 http://localhost:5174

3. 复制标签页（Cmd/Ctrl + T，输入同样的 URL）

4. 在任意标签页中编辑内容，观察其他标签页实时同步

5. 关闭某个标签页，观察用户列表更新

## 文件结构

```
packages/editor/src/
├── extensions/
│   └── collaboration.ts      # TipTap 协作扩展
├── hooks/
│   └── use-collaboration.ts  # React Hook
├── utils/
│   ├── broadcast.ts          # BroadcastChannel 封装
│   └── utils.ts              # 工具函数
├── types.ts                  # TypeScript 类型定义
└── index.tsx                 # 主组件
```

## 优势与限制

### 优势

- 🚀 无需后端，部署简单
- ⚡ 实时同步，延迟极低
- 💾 本地化，无需网络请求
- 🔒 数据安全，不经过服务器

### 限制

- ⚠️ 仅支持同一浏览器的多个标签页
- ⚠️ 不支持跨设备协作
- ⚠️ 标签页关闭后数据不持久化
- ⚠️ 需要浏览器支持 BroadcastChannel API

## 扩展建议

如需跨设备协作，可以考虑：

1. **WebSocket**: 实时双向通信
2. **Y.js**: 专业的 CRDT 协作框架
3. **Tiptap Collaboration**: 官方协作方案（基于 Y.js）
4. **Firebase/Supabase**: 实时数据库

## License

ISC
