# Full-Width Canvas Editor

满幅画布编辑器组件，用于配衣和花型的可视化编辑。

## 功能特性

- ✅ 拖拽花型到套花区
- ✅ 调整花型大小、位置、旋转角度
- ✅ 循环模式切换（全循环/不循环）
- ✅ 一键生成效果图（自动调用 AI 生成接口）
- ✅ 加载状态和错误处理

## 使用方式

### 基础用法

```tsx
import { FullWidthCanvasEditor, IFashionCanvasPeiYi, ICanUsePattern } from '@mix-toolkit/canvas-editor'

function App() {
  const [currentPeiYi, setCurrentPeiYi] = useState<IFashionCanvasPeiYi>({
    id: 'peiyi-001',
    templateId: 'template-001',
    originUrl: '/template.jpg',
    width: 670,
    height: 892,
    maskList: [
      {
        maskId: 'mask-001',
        maskURL: '/mask1.jpg',
        maskAreaWidth: 245,
        maskAreaHeight: 214,
        maskAreaOriginX: 683,
        maskAreaOriginY: 529
      }
    ]
  })

  const [canUsePatterns] = useState<ICanUsePattern[]>([
    { id: 'pattern-001', url: '/pattern.png' }
  ])

  return (
    <FullWidthCanvasEditor
      currentPeiYi={currentPeiYi}
      onPeiYiDataChange={setCurrentPeiYi}
      canUsePatterns={canUsePatterns}
    />
  )
}
```

### 使用 Context 访问 SDK

如果需要在组件外部访问 SDK 实例（例如在父组件中手动调用生成方法）：

```tsx
import { useFullWidthContext } from '@mix-toolkit/canvas-editor'

function CustomControl() {
  const { fwSdk2 } = useFullWidthContext()

  const handleCustomGenerate = async () => {
    if (fwSdk2?.generateEffectAndCreateTask) {
      const resultUrl = await fwSdk2.generateEffectAndCreateTask()
      console.log('生成完成:', resultUrl)
    }
  }

  return <button onClick={handleCustomGenerate}>自定义生成</button>
}
```

## API 接口

### Props

| 属性 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `currentPeiYi` | `IFashionCanvasPeiYi` | ✅ | 胚衣数据 |
| `onPeiYiDataChange` | `(data: IFashionCanvasPeiYi) => void` | ✅ | 胚衣数据变化回调 |
| `canUsePatterns` | `ICanUsePattern[]` | ❌ | 可用图案列表 |
| `onCanUsePatternsChange` | `(patterns: ICanUsePattern[]) => void` | ❌ | 可用图案变化回调 |

### 类型定义

#### IFashionCanvasPeiYi

```typescript
interface IFashionCanvasPeiYi {
  id: string
  templateId: string | number
  originUrl: string
  width: number
  height: number
  resultUrl?: string
  lastResultUrl?: string
  maskList: IFwMaskItem[]
}
```

#### IFwMaskItem

```typescript
interface IFwMaskItem {
  maskId: string
  maskURL: string
  maskAreaWidth: number
  maskAreaHeight: number
  maskAreaOriginX: number
  maskAreaOriginY: number
  patternInfo?: IFwPatternInfo
}
```

#### IFwPatternInfo

```typescript
interface IFwPatternInfo {
  id: string
  url: string
  x: number
  y: number
  size: number // 0-200 百分比
  rotate: number // -180-180 旋转角度
  cycleMode: 0 | 1 // 0: 全循环, 1: 不循环
}
```

#### ICanUsePattern

```typescript
interface ICanUsePattern {
  id: string
  url: string
}
```

## 内部实现

### 生成效果图流程

1. 用户点击"生成效果图"按钮
2. 收集所有套花区的花型数据
3. 为每个套花区调用 `createTask` API 创建 AI 任务
4. 轮询任务状态（每 5 秒检查一次）
5. 任务完成后，更新 `resultUrl` 并显示效果图

### Context 架构

组件使用 React Context 来共享 SDK 实例：

```
FullWidthCanvasEditor (Provider)
  ├─ FullWidthStage (创建 SDK 实例)
  └─ Control (通过 Context 访问 SDK)
```

这样避免了通过多层 props 传递 SDK 引用，代码更清晰。

## 注意事项

1. **API 依赖**: 组件依赖以下 API 接口：
   - `POST /api/v1/full-width/create-task` - 创建生成任务
   - `GET /api/v1/full-width/check-task/:taskId` - 查询任务状态

2. **跨域配置**: 图片加载使用 `crossOrigin: 'anonymous'`，确保服务器配置了正确的 CORS 头

3. **加载状态**: 组件内部管理加载状态，生成过程中会显示 Loading 指示器

4. **错误处理**: 所有错误会通过 `Message` 组件显示给用户
