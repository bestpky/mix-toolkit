# Canvas Editor - 2D 图案变形编辑器

基于 Canvas 2D 的图案变形编辑器，支持图案拖拽、变形渲染、橡皮擦编辑和图片导出功能。

## 目录

- [基本功能](#基本功能)
- [核心概念](#核心概念)
- [技术实现](#技术实现)
  - [拖拽图案到画布预设区域](#拖拽图案到画布预设区域)
  - [图案橡皮擦](#图案橡皮擦)
  - [导出图片](#导出图片)
  - [SDK 设计](#sdk-设计)
- [使用示例](#使用示例)
- [API 文档](#api-文档)

---

## 基本功能

### 1. 图案管理
- **拖拽添加图案**：从图案库拖拽图案到画布预设区域
- **图案列表显示**：查看已添加的图案列表
- **删除图案**：从画布移除不需要的图案

### 2. 图案编辑
- **变形渲染**：基于 16 点网格的图案变形算法，将图案贴合到任意四边形区域
- **三种橡皮擦模式**：
  - **去除模式**：擦除图案内容
  - **恢复模式**：恢复被擦除的内容
  - **圈选模式**：框选区域批量擦除或恢复
- **可调节画笔尺寸**：支持 1-40px 的画笔大小调节

### 3. 导出功能
- **图片导出**：将背景图和图案合并导出为 PNG 图片
- **透明度处理**：自动处理透明区域，确保导出效果正确

---

## 核心概念

### 画布数据结构 (ICanvasData)

```typescript
interface ICanvasData {
  id: string                          // 画布唯一标识
  originUrl: string                   // 背景图 URL
  width: number                       // 画布宽度
  height: number                      // 画布高度
  vertices: IPresetVertices[]         // 预设区域列表
  patternList: IPattern[] // 已添加的图案列表
}
```

### 预设区域 (IPresetVertices)

预设区域是画布上预先定义的可放置图案的区域，每个区域由 **16 个控制点** 组成（4×4 网格）。

```typescript
interface IPresetVertices {
  id: string                          // 区域唯一标识
  sixteenPoints: number[]             // 16 个点的坐标 [x0,y0, x1,y1, ...]
  relativePatternId: string | undefined // 关联的图案 ID
}
```

**16 点布局规则**：
```
按列排布（列优先）：
列0: [x0,y0], [x0,y1], [x0,y2], [x0,y3]
列1: [x1,y0], [x1,y1], [x1,y2], [x1,y3]
列2: [x2,y0], [x2,y1], [x2,y2], [x2,y3]
列3: [x3,y0], [x3,y1], [x3,y2], [x3,y3]

对应数组索引：
[0,1,2,3,  4,5,6,7,  8,9,10,11,  12,13,14,15]
```

### 图案数据 (IPattern)

```typescript
interface IPattern {
  patternId: string                   // 图案唯一标识
  url: string                         // 图案图片 URL
  vertices: number[]                  // 图案的 16 个顶点坐标
}
```

---

## 技术实现

### 拖拽图案到画布预设区域

#### 实现原理

拖拽功能基于 HTML5 Drag and Drop API 实现，整个流程分为三个阶段：

1. **拖拽开始**（CanUseGridPatterns 组件）
   - 用户从图案库开始拖拽
   - 通过 `dataTransfer.setData()` 传递图案数据

2. **拖拽过程**（Stage 组件）
   - 监听 `onDragOver` 事件，实时高亮预设区域
   - 使用点在多边形内算法判断鼠标是否在预设区域内

3. **拖拽结束**（Stage 组件）
   - 监听 `onDrop` 事件，加载图案并渲染到画布

#### 关键代码解析

**1. 实时高亮预设区域**

[stage/index.tsx:83-102](packages/canvas-editor/src/2d/stage/index.tsx#L83-L102)

```typescript
const handleDragOver: React.DragEventHandler<HTMLDivElement> = e => {
  e.preventDefault()
  // 防抖优化：避免相同位置重复计算
  if (e.clientX === dragOverPos.current.x && e.clientY === dragOverPos.current.y) {
    return
  }
  dragOverPos.current = { x: e.clientX, y: e.clientY }
  highlightPresetArea(e)
}

const highlightPresetArea = (e: React.DragEvent) => {
  if (!sdkRef.current) return
  // 判断鼠标是否在预设区域内
  const res = sdkRef.current.isPointInPresetArea(e)
  if (res) {
    sdkRef.current.highlightVerticeId = res.id // 设置高亮 ID
  } else {
    sdkRef.current.highlightVerticeId = ''
  }
  sdkRef.current.reDraw() // 重绘画布
}
```

**2. 点在多边形内判断算法**

[stage/sdk.ts:309-322](packages/canvas-editor/src/2d/stage/sdk.ts#L309-L322)

使用射线法（Ray Casting Algorithm）判断点是否在多边形内部：

```typescript
isPointInPolygon(x: number, y: number, pointList: number[][]) {
  let isInside = false
  for (let i = 0, j = pointList.length - 1; i < pointList.length; j = i++) {
    const xi = pointList[i][0]
    const yi = pointList[i][1]
    const xj = pointList[j][0]
    const yj = pointList[j][1]
    // 判断射线是否与边相交
    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi
    if (intersect) {
      isInside = !isInside
    }
  }
  return isInside
}
```

**算法原理**：从目标点向右发出一条射线，统计射线与多边形边的交点数。如果交点数为奇数，点在多边形内；否则在外。

**3. 拖拽结束处理**

[stage/index.tsx:105-156](packages/canvas-editor/src/2d/stage/index.tsx#L105-L156)

```typescript
const handleDropPattern: React.DragEventHandler<HTMLDivElement> = async e => {
  e.preventDefault()
  if (!canvasData || !sdkRef.current || !onCanvasUpdate) return

  // 1. 获取拖拽的图案数据
  const dataStr = e.dataTransfer.getData('text/plain')
  const canUsePattern = JSON.parse(dataStr) as ICanUsePattern

  // 2. 判断是否在预设区域内
  const res = sdkRef.current.isPointInPresetArea(e)
  if (!res) return

  const patternId = uuid()
  const { id, sixteenPoints } = res
  const index = sdkRef.current.presetVertices.findIndex(v => v.id === id)

  // 3. 加载图案图片
  const patternImage = await loadImage(canUsePattern.url, { crossOrigin: 'anonymous' })
  const centerPoint = getCenterPointByVertices(sixteenPoints)

  // 4. 添加到 SDK 并渲染
  const newPattern = {
    patternId,
    patternImage,
    vertices: sixteenPoints,
    centerPoint
  }
  sdkRef.current.addPattern(newPattern)
  sdkRef.current.setPresetRelativePatternId(index, patternId)
  sdkRef.current.highlightVerticeId = ''
  sdkRef.current.reDraw()

  // 5. 更新数据状态
  const newCanvasData = update(canvasData, {
    patternList: {
      $push: [
        {
          patternId,
          url: canUsePattern.url,
          vertices: sixteenPoints
        }
      ]
    },
    vertices: {
      [index]: {
        relativePatternId: {
          $set: patternId
        }
      }
    }
  })
  onCanvasUpdate(newCanvasData)
}
```

---

### 图案橡皮擦

图案橡皮擦是本项目的核心功能，采用 **多层 Canvas 分离架构**，支持三种擦除模式。

#### 设计思路

**1. 核心问题**

如何在擦除图案的同时保持背景图不受影响？

**2. 解决方案：Canvas 分层架构**

将画布分为多个层次，每层独立渲染，通过 `z-index` 控制显示顺序：

```
Layer 0 (backgroundCanvas): 背景图层 - 不可擦除
Layer 1 (主 Canvas):        图案图层 - 可擦除
Layer 2 (cursorCanvas):     光标图层 - 显示橡皮擦光标
Layer 2 (circlingCanvas):   圈选图层 - 显示选区边框
```

**3. 关键技术点**

- **透明度分离**：主 Canvas 背景透明，只绘制图案，橡皮擦擦除时不会影响下层的 backgroundCanvas
- **备份机制**：使用离屏 Canvas (backupCanvas) 保存原始图案，用于恢复功能
- **光标跟随**：使用独立的 cursorCanvas 显示橡皮擦光标，避免频繁重绘主画布

#### 实现细节

**1. Canvas 分层初始化**

[stage/sdk.ts:62-98](packages/canvas-editor/src/2d/stage/sdk.ts#L62-L98)

```typescript
private initEraserCanvases() {
  const parentElement = this.canvas.parentElement
  if (!parentElement) return

  const createCanvas = (zIndex: string) => {
    const canvas = document.createElement('canvas')
    parentElement.appendChild(canvas)
    canvas.width = this.canvas.width
    canvas.height = this.canvas.height
    canvas.style.position = 'absolute'
    canvas.style.top = '0'
    canvas.style.left = '0'
    canvas.style.zIndex = zIndex
    return canvas
  }

  // 背景 Canvas (z-index: 0) - 不可擦除
  this.backgroundCanvas = createCanvas('0')
  this.backgroundCanvasCtx = this.backgroundCanvas.getContext('2d') as CanvasRenderingContext2D

  // 光标 Canvas (z-index: 2) - 显示橡皮擦光标
  this.cursorCanvas = createCanvas('2')
  this.cursorCanvasCtx = this.cursorCanvas.getContext('2d') as CanvasRenderingContext2D
  this.setupCursorEvents()

  // 备份 Canvas (不显示) - 用于恢复功能
  this.backupCanvas = document.createElement('canvas')
  this.backupCanvas.width = this.canvas.width
  this.backupCanvas.height = this.canvas.height
  this.backupCanvasCtx = this.backupCanvas.getContext('2d') as CanvasRenderingContext2D

  // 圈选 Canvas (z-index: 2) - 显示选区边框
  this.circlingCanvas = createCanvas('2')
  this.circlingCanvas.style.display = 'none'
  this.circlingCanvasCtx = this.circlingCanvas.getContext('2d') as CanvasRenderingContext2D
  this.setupCirclingEvents()
}
```

**2. 重绘逻辑：背景与图案分离**

[stage/sdk.ts:237-257](packages/canvas-editor/src/2d/stage/sdk.ts#L237-L257)

```typescript
reDraw() {
  this.clear()

  // 背景图只绘制到 backgroundCanvas（下层），不绘制到主 canvas
  if (this.backgroundCanvasCtx) {
    this.backgroundCanvasCtx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    this.drawBgImage(this.backgroundCanvasCtx)
  } else {
    // 如果没有 backgroundCanvas，背景图绘制到主 canvas
    this.drawBgImage(this.ctx)
  }

  // 主 canvas 只绘制图案和预设区域（背景透明）
  this.drawPatterns()
  if (this.presetVertices.length) {
    this.drawPresetArea()
  }

  // 备份画布只备份主 canvas 的内容（图案 + 预设区域，不包含背景）
  this.backupCanvasCtx?.drawImage(this.canvas, 0, 0)
}
```

**3. 三种擦除模式实现**

**① 去除模式 (eraser)**

使用 `globalCompositeOperation = 'destination-out'` 擦除像素。

[stage/sdk.ts:409-427](packages/canvas-editor/src/2d/stage/sdk.ts#L409-L427)

```typescript
erase(x: number, y: number) {
  if (!this.ctx) return
  // 设置为擦除模式
  this.ctx.globalCompositeOperation = 'destination-out'
  this.ctx.beginPath()
  this.ctx.arc(x, y, this.eraserSize / 2, 0, Math.PI * 2)
  this.ctx.fill()

  // 将路径连接起来，解决断点问题
  this.ctx.lineWidth = this.eraserSize
  this.ctx.beginPath()
  this.ctx.moveTo(this.lastX, this.lastY)
  this.ctx.lineTo(x, y)
  this.ctx.stroke()

  // 恢复正常绘制模式
  this.ctx.globalCompositeOperation = 'source-over'

  this.lastX = x
  this.lastY = y
}
```

**关键技术**：
- `destination-out` 模式：擦除目标像素
- 线段插值：连接两次鼠标位置，避免移动过快时出现断点

**② 恢复模式 (repair)**

从备份 Canvas 恢复被擦除的内容。

[stage/sdk.ts:429-438](packages/canvas-editor/src/2d/stage/sdk.ts#L429-L438)

```typescript
restore(x: number, y: number) {
  if (!this.ctx || !this.backupCanvas) return
  const halfSize = this.eraserSize / 2
  this.ctx.save()
  // 创建圆形裁剪区域
  this.ctx.beginPath()
  this.ctx.arc(x, y, halfSize, 0, Math.PI * 2)
  this.ctx.clip()
  // 从备份 Canvas 恢复内容
  this.ctx.drawImage(this.backupCanvas, 0, 0)
  this.ctx.restore()
}
```

**关键技术**：
- `clip()` 裁剪：只恢复圆形区域内的内容
- 从 backupCanvas 读取原始图案数据

**③ 圈选模式 (circling)**

框选区域后批量擦除或恢复。

[stage/sdk.ts:154-231](packages/canvas-editor/src/2d/stage/sdk.ts#L154-L231)

```typescript
private setupCirclingEvents() {
  if (!this.circlingCanvas) return

  // 鼠标按下：开始绘制选区
  this.circlingCanvas.addEventListener('mousedown', e => {
    if (this.eraserType !== 'circling' || !this.circlingCanvasCtx || !this.circlingCanvas) return
    this.removeDropdown()
    this.circlingStartX = e.offsetX
    this.circlingStartY = e.offsetY
    this.isDrawing = true
    this.circlingCanvasCtx.clearRect(0, 0, this.circlingCanvas.width, this.circlingCanvas.height)
  })

  // 鼠标移动：绘制虚线边框
  this.circlingCanvas.addEventListener('mousemove', e => {
    if (this.eraserType !== 'circling' || !this.isDrawing || !this.circlingCanvasCtx || !this.circlingCanvas) return
    const width = e.offsetX - this.circlingStartX
    const height = e.offsetY - this.circlingStartY
    this.circlingCanvasCtx.clearRect(0, 0, this.circlingCanvas.width, this.circlingCanvas.height)
    this.circlingCanvasCtx.setLineDash([5, 5]) // 虚线样式
    this.circlingCanvasCtx.strokeStyle = '#0019FF'
    this.circlingCanvasCtx.strokeRect(this.circlingStartX, this.circlingStartY, width, height)
  })

  // 鼠标释放：弹出操作菜单
  this.circlingCanvas.addEventListener('mouseup', e => {
    if (this.eraserType !== 'circling' || !this.isDrawing) return
    this.isDrawing = false
    this.handleCirclingComplete(e)
  })
}

private handleCirclingComplete(e: MouseEvent) {
  const endX = e.offsetX
  const endY = e.offsetY
  const x = Math.min(endX, this.circlingStartX)
  const y = Math.min(endY, this.circlingStartY)
  const width = Math.abs(endX - this.circlingStartX)
  const height = Math.abs(endY - this.circlingStartY)

  if (width === 0 || height === 0) return

  let intersection: IRect = { x, y, width, height }

  // 弹出操作菜单
  const container = document.querySelector(`#eraser-canvas-wrapper`) as HTMLElement
  popDropdown({
    x: e.offsetX,
    y: e.offsetY,
    container,
    handleClickEraser: () => {
      // 擦除选区内容
      this.ctx?.clearRect(intersection.x, intersection.y, intersection.width, intersection.height)
      this.removeCirclingBorder()
      this.removeDropdown()
    },
    handleClickRestore: () => {
      // 恢复选区内容
      if (!this.backupCanvas) return
      this.ctx?.drawImage(
        this.backupCanvas,
        intersection.x,
        intersection.y,
        intersection.width,
        intersection.height,
        intersection.x,
        intersection.y,
        intersection.width,
        intersection.height
      )
      this.removeCirclingBorder()
      this.removeDropdown()
    }
  })
}
```

**关键技术**：
- 独立的 circlingCanvas 用于绘制选区边框
- 虚线样式：`setLineDash([5, 5])`
- 下拉菜单组件：提供"删除选区内容"和"恢复选区内容"两个操作

**4. 光标跟随效果**

[stage/sdk.ts:100-151](packages/canvas-editor/src/2d/stage/sdk.ts#L100-L151)

```typescript
private setupCursorEvents() {
  if (!this.cursorCanvas) return

  this.cursorCanvas.addEventListener('mouseenter', e => {
    this.lastX = e.offsetX
    this.lastY = e.offsetY
  })

  this.cursorCanvas.addEventListener('mousedown', e => {
    this.isErasing = true
    this.lastX = e.offsetX
    this.lastY = e.offsetY
  })

  this.cursorCanvas.addEventListener('mousemove', e => {
    const mousePos = this.getMousePos(e)
    // 绘制光标
    this.drawCursor(mousePos.x, mousePos.y)

    // 如果正在擦除，执行擦除或恢复操作
    if (this.isErasing) {
      if (this.eraserType === 'eraser') {
        this.erase(e.offsetX, e.offsetY)
      }
      if (this.eraserType === 'repair') {
        const x = e.offsetX
        const y = e.offsetY
        // 使用线段插值，避免断点
        const distance = Math.sqrt(Math.pow(x - this.lastX, 2) + Math.pow(y - this.lastY, 2))
        const steps = Math.floor(distance / 2)

        for (let i = 0; i <= steps; i++) {
          const t = i / steps
          const pointX = this.lastX + (x - this.lastX) * t
          const pointY = this.lastY + (y - this.lastY) * t
          this.restore(pointX, pointY)
        }

        this.lastX = x
        this.lastY = y
      }
    }
  })

  this.cursorCanvas.addEventListener('mouseup', () => {
    this.isErasing = false
  })

  this.cursorCanvas.addEventListener('mouseleave', () => {
    if (!this.cursorCanvasCtx || !this.cursorCanvas) return
    this.cursorCanvasCtx.clearRect(0, 0, this.cursorCanvas.width, this.cursorCanvas.height)
  })
}

drawCursor(x: number, y: number) {
  if (!this.cursorCanvas || !this.cursorCanvasCtx || this.eraserType === 'circling' || !this.eraserType) return
  this.cursorCanvasCtx.clearRect(0, 0, this.cursorCanvas.width, this.cursorCanvas.height)
  // 擦除模式：红色光标，恢复模式：绿色光标
  this.cursorCanvasCtx.fillStyle = this.eraserType === 'eraser' ? 'rgba(255, 0, 0, 0.7)' : 'rgba(82, 196, 26, 1)'
  this.cursorCanvasCtx.beginPath()
  this.cursorCanvasCtx.arc(x, y, this.eraserSize / 2, 0, Math.PI * 2)
  this.cursorCanvasCtx.fill()
}
```

---

### 导出图片

导出功能将背景图和图案合并为一张完整的 PNG 图片。

#### 设计思路

**问题**：如何将分层的 Canvas（backgroundCanvas + 主 Canvas）合并为一张图片？

**解决方案**：通过像素级别的 Alpha 通道判断，将两层 Canvas 的像素数据合并。

#### 实现细节

**1. 合并图片数据**

[stage/sdk.ts:440-465](packages/canvas-editor/src/2d/stage/sdk.ts#L440-L465)

```typescript
mergeImageData() {
  if (!this.backgroundCanvas || !this.backgroundCanvasCtx) return

  // 1. 获取两层 Canvas 的像素数据
  const imageData1 = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height) // 图案层
  const imageData2 = this.backgroundCanvasCtx.getImageData(0, 0, this.backgroundCanvas.width, this.backgroundCanvas.height) // 背景层

  if (!imageData1 || !imageData2) return
  const data1 = imageData1.data // RGBA 数组
  const data2 = imageData2.data

  // 2. 创建结果 Canvas
  const resultCanvas = document.createElement('canvas')
  resultCanvas.width = this.canvas.width
  resultCanvas.height = this.canvas.height
  const resultCtx = resultCanvas.getContext('2d')

  // 3. 像素级别合并：如果图案层透明度 < 128，使用背景层像素
  for (let i = 0; i < data1.length; i += 4) {
    if (data1[i + 3] < 128) { // Alpha 通道小于 128，视为透明
      data1[i] = data2[i]       // R
      data1[i + 1] = data2[i + 1] // G
      data1[i + 2] = data2[i + 2] // B
      data1[i + 3] = data2[i + 3] // A
    }
  }

  // 4. 将合并后的像素数据绘制到结果 Canvas
  resultCtx!.putImageData(imageData1, 0, 0)
  return resultCanvas
}
```

**关键技术**：
- **ImageData API**：`getImageData()` 获取像素数据（RGBA 数组）
- **Alpha 通道判断**：`data[i + 3] < 128` 判断像素是否透明
- **像素替换**：透明区域用背景层像素填充

**2. 导出下载**

[control/index.tsx:31-46](packages/canvas-editor/src/2d/control/index.tsx#L31-L46)

```typescript
const handleExport = () => {
  if (!sdk) return
  const mergedCanvas = sdk.mergeImageData()
  if (!mergedCanvas) return

  // 转换为 Blob 并下载
  mergedCanvas.toBlob(blob => {
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `canvas-export-${Date.now()}.png`
    a.click()
    URL.revokeObjectURL(url)
  }, 'image/png')
}
```

**关键技术**：
- `toBlob()` 方法：将 Canvas 转换为 Blob 对象
- `createObjectURL()` 创建临时下载链接
- 自动触发下载：创建隐藏的 `<a>` 标签并触发点击

---

### SDK 设计

Sdk 是整个编辑器的核心，负责 Canvas 渲染、事件处理和图案管理。

#### 设计思路

**1. 职责划分**

- **Sdk**：Canvas 底层操作、渲染逻辑、橡皮擦功能
- **Stage**：React 组件封装、拖拽交互、数据流转
- **Control**：UI 控制面板、参数调节

**2. 数据流设计**

```
用户操作 → React 组件 (Stage/Control)
         ↓
         调用 SDK 方法
         ↓
         SDK 更新内部状态并重绘 Canvas
         ↓
         通过 onCanvasUpdate 回调更新外部数据
```

**3. Context 状态管理**

使用 React Context 共享 SDK 实例，避免全局变量污染。

[sdk-context.tsx](packages/canvas-editor/src/2d/sdk-context.tsx)

```typescript
interface ISdkContext {
  sdk: Sdk | null
}

export const SdkContext = createContext<ISdkContext>({
  sdk: null
})

export const useSdk = () => {
  const context = useContext(SdkContext)
  if (!context) {
    throw new Error('useSdk must be used within SdkProvider')
  }
  return context.sdk
}
```

**使用示例**：

```typescript
// 父组件：提供 Context
export const CanvasEditorPage = () => {
  const [sdk, setSdk] = useState<Sdk | null>(null)

  return (
    <SdkContext.Provider value={{ sdk }}>
      <Stage onSdkChange={setSdk} />
      <Control />
    </SdkContext.Provider>
  )
}

// 子组件：消费 Context
export const Control = () => {
  const sdk = useSdk()

  const handleExport = () => {
    if (!sdk) return
    const mergedCanvas = sdk.mergeImageData()
    // ...
  }
}
```

#### 核心方法

**1. 初始化**

```typescript
constructor({ canvas, originImage, patternList, presetVertices }: ISdkParams) {
  this.canvas = canvas
  this.ctx = canvas.getContext('2d', { willReadFrequently: true })
  this.originImage = originImage
  this.patternList = patternList
  this.presetVertices = presetVertices
  this.initEraserCanvases() // 初始化橡皮擦相关 Canvas
}
```

**2. 图案渲染**

```typescript
drawPatterns() {
  const indices = getIndices(3) // 获取三角形索引
  const uvtData = getUVs(3)     // 获取纹理坐标

  this.patternList.forEach(({ patternImage, vertices }) => {
    this.ctx.globalCompositeOperation = 'multiply'

    // 创建离屏 Canvas 用于变形渲染
    const offscreenCanvas = document.createElement('canvas')
    const offscreenCtx = offscreenCanvas.getContext('2d', { willReadFrequently: true })
    offscreenCanvas.width = this.canvas.width
    offscreenCanvas.height = this.canvas.height

    // 绘制变形后的图案（基于三角形网格）
    drawTriangles({
      image: patternImage,
      vertices,
      indices,
      uvtData
    })(offscreenCtx)

    // 消除透明细线
    fixClipGap(offscreenCtx, { width: this.canvas.width, height: this.canvas.height })

    // 绘制到主画布
    this.ctx.drawImage(offscreenCanvas, 0, 0)
  })
}
```

**关键技术**：
- **三角形网格变形**：将 16 点网格分解为多个三角形，逐个绘制实现变形效果
- **离屏渲染**：在离屏 Canvas 上绘制，避免闪烁
- **Multiply 混合模式**：`globalCompositeOperation = 'multiply'` 实现图案与背景的自然融合

**3. 图案管理**

```typescript
// 添加图案
addPattern(pattern: IPatternSdk) {
  this.patternList.push(pattern)
}

// 关联预设区域
setPresetRelativePatternId(index: number, patternId: string | undefined) {
  const newPresetVertices = update(this.presetVertices, {
    [index]: {
      relativePatternId: {
        $set: patternId
      }
    }
  })
  this.presetVertices = newPresetVertices
}

// 清除关联
cleanPresetRelativePatternId(patternId: string) {
  const index = this.presetVertices.findIndex(v => v.relativePatternId === patternId)
  if (index !== -1) {
    this.setPresetRelativePatternId(index, undefined)
  }
}
```

**4. 橡皮擦控制**

```typescript
// 设置橡皮擦尺寸
setEraserSize(val: number) {
  this.eraserSize = val
}

// 设置橡皮擦类型
setEraserType(val: 'eraser' | 'repair' | 'circling' | undefined) {
  this.eraserType = val
  this.removeDropdown()
  this.removeCirclingBorder()
  if (this.circlingCanvas) {
    if (val === 'circling') {
      this.circlingCanvas.style.display = 'block'
    } else {
      this.circlingCanvas.style.display = 'none'
    }
  }
}
```

---

## 使用示例

### 基本使用

```tsx
import { useState } from 'react'
import {
  Stage,
  Control,
  ICanvasData,
  ICanUsePattern,
  SdkContext
} from '@mix-toolkit/canvas-editor/src/2d'
import { Sdk } from '@mix-toolkit/canvas-editor/src/2d/stage/sdk'

const SAMPLE_PATTERNS: ICanUsePattern[] = [
  {
    id: 'pattern-1',
    url: 'https://example.com/pattern1.png'
  },
  {
    id: 'pattern-2',
    url: 'https://example.com/pattern2.png'
  }
]

const INITIAL_CANVAS_DATA: ICanvasData = {
  id: 'canvas-1',
  originUrl: '/background.jpg',
  width: 800,
  height: 600,
  vertices: [
    {
      id: 'preset-1',
      sixteenPoints: [
        // 16 个点的坐标（列优先）
        200, 150,  200, 233,  200, 317,  200, 400,
        267, 150,  267, 233,  267, 317,  267, 400,
        333, 150,  333, 233,  333, 317,  333, 400,
        400, 150,  400, 233,  400, 317,  400, 400
      ],
      relativePatternId: undefined
    }
  ],
  patternList: []
}

export const CanvasEditorPage = () => {
  const [canvasData, setCanvasData] = useState<ICanvasData>(INITIAL_CANVAS_DATA)
  const [canUsePatterns, setCanUsePatterns] = useState<ICanUsePattern[]>(SAMPLE_PATTERNS)
  const [sdk, setSdk] = useState<Sdk | null>(null)

  return (
    <SdkContext.Provider value={{ sdk }}>
      <div className="flex h-screen">
        {/* 左侧 Canvas 区域 */}
        <Stage
          canvasData={canvasData}
          onCanvasUpdate={setCanvasData}
          onSdkChange={setSdk}
        />

        {/* 右侧控制面板 */}
        <Control
          canvasData={canvasData}
          canUsePatterns={canUsePatterns}
          onCanvasUpdate={setCanvasData}
          onCanUsePatternsChange={setCanUsePatterns}
        />
      </div>
    </SdkContext.Provider>
  )
}
```

---

## API 文档

### Stage

Canvas 渲染组件。

#### Props

| 属性 | 类型 | 必填 | 说明 |
|------|------|------|------|
| canvasData | ICanvasData | ✓ | 画布数据 |
| onCanvasUpdate | (data: ICanvasData) => void | - | 画布数据更新回调 |
| onSdkChange | (sdk: Sdk \| null) => void | - | SDK 实例变化回调 |

---

### Control

控制面板组件。

#### Props

| 属性 | 类型 | 必填 | 说明 |
|------|------|------|------|
| canvasData | ICanvasData | - | 画布数据 |
| canUsePatterns | ICanUsePattern[] | - | 可用图案列表 |
| onCanvasUpdate | (data: ICanvasData) => void | - | 画布数据更新回调 |
| onCanUsePatternsChange | (patterns: ICanUsePattern[]) => void | - | 可用图案变化回调 |

---

### Sdk

核心 SDK 类。

#### 构造函数

```typescript
new Sdk({
  canvas: HTMLCanvasElement,
  originImage: HTMLImageElement,
  patternList: IPatternSdk[],
  presetVertices?: IPresetVertices[]
})
```

#### 主要方法

| 方法 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| reDraw() | - | void | 重绘画布 |
| addPattern(pattern) | IPatternSdk | void | 添加图案 |
| setEraserType(type) | 'eraser' \| 'repair' \| 'circling' \| undefined | void | 设置橡皮擦类型 |
| setEraserSize(size) | number | void | 设置橡皮擦尺寸 |
| mergeImageData() | - | HTMLCanvasElement \| undefined | 合并背景和图案 |
| isPointInPresetArea(e) | React.MouseEvent \| React.DragEvent | { sixteenPoints, id } \| undefined | 判断点是否在预设区域内 |
| setPresetRelativePatternId(index, id) | number, string \| undefined | void | 关联预设区域和图案 |
| cleanPresetRelativePatternId(id) | string | void | 清除预设区域关联 |

---

## 技术栈

- **React 18**: UI 框架
- **TypeScript**: 类型安全
- **Canvas 2D API**: 图形渲染
- **immutability-helper**: 不可变数据更新
- **TailwindCSS**: 样式

---

## 性能优化

1. **拖拽防抖**：避免相同位置重复计算高亮区域
2. **离屏渲染**：图案变形在离屏 Canvas 完成，避免闪烁
3. **备份 Canvas**：橡皮擦恢复功能使用备份 Canvas，无需重新绘制
4. **Context 优化**：`willReadFrequently: true` 提示浏览器优化像素读取

---

## 浏览器兼容性

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

---

## 许可证

MIT
