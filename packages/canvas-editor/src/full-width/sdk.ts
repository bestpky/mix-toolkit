import update from 'immutability-helper'
import { createClipPathFromBinaryImageData } from './utils'
import { IMaskHighlight, IMaskPattern, ISDK2ConstructorParams } from './types'

export class FullWidthCanvasSDK2 {
  canvasWidth: number
  canvasHeight: number
  container: HTMLDivElement | null = null
  originImage: HTMLImageElement | null = null
  resultImage: HTMLImageElement | null = null
  maskPatternList: IMaskPattern[] = []
  maskCtxList: {
    maskId: string
    ctx: CanvasRenderingContext2D
    path: Path2D
  }[] = []

  moving = false
  currentEditMaskId: string | undefined = undefined

  constructor({
    canvasHeight,
    canvasWidth,
    originImage,
    resultImage,
    maskPatternList,
    container
  }: ISDK2ConstructorParams) {
    this.canvasWidth = canvasWidth
    this.canvasHeight = canvasHeight
    this.container = container
    this.originImage = originImage
    this.resultImage = resultImage
    this.maskPatternList = maskPatternList

    // 在forEach中使用this，需要绑定this
    this.appendMaskPatternCanvas = this.appendMaskPatternCanvas.bind(this)
  }

  clearAllCanvas() {
    if (!this.container) return
    const canvases = Array.from(this.container.querySelectorAll('canvas'))
    for (let i = 0; i < canvases.length; i++) {
      this.container.removeChild(canvases[i])
    }
  }

  async drawAll() {
    this.clearAllCanvas()
    this.maskCtxList = []
    if (this.resultImage) {
      this.appendImageCanvas(this.resultImage)
    } else {
      if (!this.originImage) return
      this.appendImageCanvas(this.originImage)
      this.maskPatternList.forEach(this.appendMaskPatternCanvas)
    }
  }

  appendMaskPatternCanvas(mask: IMaskPattern) {
    const canvas = this.createMaskPatternCanvas(mask)
    if (!canvas) return
    this.container?.appendChild(canvas)
  }

  appendMaskHighlightCanvas(mask: IMaskHighlight) {
    const canvas = this.createMaskHighlightCanvas(mask)
    if (!canvas) return
    this.container?.appendChild(canvas)
  }

  createMaskHighlightCanvas(params: IMaskHighlight) {
    const { maskImage } = params
    if (!maskImage) return
    const { canvas, ctx } = this.createImageCanvas(maskImage, 'highlight')
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const path = createClipPathFromBinaryImageData(imageData)
    const data = imageData.data
    for (let i = 0; i < data.length; i += 4) {
      // 判断是否为黑色像素 (r=0, g=0, b=0)
      if (data[i] === 0 && data[i + 1] === 0 && data[i + 2] === 0) {
        data[i + 3] = 0 // 将 alpha 值设置为 0
      }
    }
    // 修改黑色像素为透明
    ctx.putImageData(imageData, 0, 0)
    ctx.fillStyle = 'rgba(101, 25, 255, 0.8)'
    ctx.fill(path)
    canvas.style.mixBlendMode = 'lighten'
    // ctx.globalCompositeOperation = 'source-in'
    return canvas
  }

  createMaskPatternCanvas(params: IMaskPattern) {
    const {
      maskId,
      maskImage,
      maskAreaHeight,
      maskAreaWidth,
      patternImage,
      patternX,
      patternY,
      patternScale,
      rotate,
      cycleMode = 0
    } = params
    if (!maskImage || !patternImage) return
    const { canvas, ctx } = this.createImageCanvas(maskImage, maskId)

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const path = createClipPathFromBinaryImageData(imageData)

    this.maskCtxList.push({ maskId, ctx, path })

    const patternWidth = patternImage.width * patternScale
    const patternHeight = patternImage.height * patternScale
    const centerX = patternX + patternWidth / 2
    const centerY = patternY + patternHeight / 2
    if (cycleMode === 0) {
      // 计算网格行数和列数，* 2 是为了扩大边界
      const rows = Math.ceil(maskAreaHeight / patternHeight) * 2
      const cols = Math.ceil(maskAreaWidth / patternWidth) * 2
      // 生成网格点坐标，实现四方连续效果
      const gridPoints = generateGridPoints(patternX, patternY, patternWidth, patternHeight, rows, cols)
      // 中心点坐标
      for (const point of gridPoints) {
        this.drawPattern({
          ctx,
          patternImage,
          patternScale,
          x: point.x,
          y: point.y,
          centerX,
          centerY,
          rotate
        })
        // 画蓝框
        if (point.x === patternX && point.y === patternY) {
          this.drawWireframe({ ctx, x: point.x, y: point.y, centerX, centerY, patternWidth, patternHeight, rotate })
        }
      }
    } else {
      this.drawPattern({
        ctx,
        patternImage,
        patternScale,
        x: patternX,
        y: patternY,
        centerX,
        centerY,
        rotate
      })
    }

    ctx.globalCompositeOperation = 'destination-in'

    // 绘制裁剪路径，使用 fill 方法填充路径
    ctx.fill(path)

    ctx.globalCompositeOperation = 'source-over'

    return canvas
  }

  drawPattern(params: {
    ctx: CanvasRenderingContext2D
    patternImage: HTMLImageElement
    patternScale: number
    x: number
    y: number
    centerX: number
    centerY: number
    rotate: number
  }) {
    const { ctx, patternImage, patternScale, x, y, centerX, centerY, rotate } = params
    // 单独对花型图进行变换，不影响其他图层，需要保存和恢复状态
    ctx.save()

    // 移动上下文到旋转中心
    ctx.translate(centerX, centerY)
    // 执行旋转
    ctx.rotate(rotate * (Math.PI / 180))
    // 回到图形的原始位置
    ctx.translate(-centerX, -centerY)

    ctx.drawImage(patternImage, x, y, patternImage.width * patternScale, patternImage.height * patternScale)

    ctx.restore()
  }

  setPatternParams(maskCtx: CanvasRenderingContext2D) {
    let imageData = maskCtx.getImageData(0, 0, this.canvasWidth, this.canvasHeight)
    maskCtx.putImageData(imageData, 0, 0)
  }

  drawWireframe(params: {
    ctx: CanvasRenderingContext2D
    x: number
    y: number
    centerX: number
    centerY: number
    patternWidth: number
    patternHeight: number
    rotate: number
  }) {
    const { ctx, x, y, centerX, centerY, patternHeight, patternWidth, rotate } = params
    ctx.save()
    ctx.strokeStyle = 'rgb(0, 25, 255)'
    ctx.lineWidth = 2
    ctx.translate(centerX, centerY)
    ctx.rotate(rotate * (Math.PI / 180))
    ctx.translate(-centerX, -centerY)
    ctx.strokeRect(x, y, patternWidth, patternHeight)
    ctx.restore()
  }

  setIsMovingOn() {
    this.moving = true
  }

  setIsMovingOff() {
    this.moving = false
  }

  setPatternCycleMode(mode: 0 | 1) {
    const index = this.getCurrentEditMaskIndex()
    if (index === -1) return
    const newMaskList = update(this.maskPatternList, {
      [index]: {
        cycleMode: {
          $set: mode
        }
      }
    })
    this.maskPatternList = newMaskList
    this.drawAll()
  }

  setPatternPosition(movementX: number, movementY: number) {
    if (!this.moving) {
      return
    }
    const index = this.getCurrentEditMaskIndex()
    if (index === -1) return
    const newMaskList = update(this.maskPatternList, {
      [index]: {
        patternX: {
          $apply: x => x + movementX
        },
        patternY: {
          $apply: y => y + movementY
        }
      }
    })
    this.maskPatternList = newMaskList
    this.drawAll()
  }

  getPatternImageDataURL(imageElement: HTMLImageElement) {
    const exportCanvas = document.createElement('canvas')
    exportCanvas.width = imageElement.width
    exportCanvas.height = imageElement.height
    const ctx = exportCanvas.getContext('2d', { willReadFrequently: true }) as CanvasRenderingContext2D
    ctx.drawImage(imageElement, 0, 0)
    let imageData = ctx.getImageData(0, 0, exportCanvas.width, exportCanvas.height)
    ctx.putImageData(imageData, 0, 0)
    const dataURL = exportCanvas.toDataURL('image/png')
    return dataURL
  }

  createImageCanvas(imageElement: HTMLImageElement, id?: string) {
    const canvas = document.createElement('canvas')
    if (id) {
      canvas.setAttribute('data-mask-id', id)
    }
    canvas.width = this.canvasWidth
    canvas.height = this.canvasHeight
    const ctx = canvas.getContext('2d', { willReadFrequently: true }) as CanvasRenderingContext2D
    ctx.drawImage(imageElement, 0, 0, canvas.width, canvas.height)
    return { canvas, ctx }
  }

  appendImageCanvas(imageElement: HTMLImageElement) {
    this.clearAllCanvas()
    const { canvas } = this.createImageCanvas(imageElement)
    if (!canvas) return
    this.container?.appendChild(canvas)
  }

  setCurrentEditMaskId(maskId: string | undefined) {
    this.currentEditMaskId = maskId
  }

  getCurrentEditMaskIndex() {
    return this.maskPatternList.findIndex(mask => mask.maskId === this.currentEditMaskId)
  }

  updateCurrentEditMask(params: Partial<IMaskPattern>) {
    const index = this.getCurrentEditMaskIndex()
    if (index === -1) return
    const newMaskList = update(this.maskPatternList, {
      [index]: {
        $merge: params
      }
    })
    this.maskPatternList = newMaskList
    this.drawAll()
  }

  setPatternScale(patternScale: number) {
    this.updateCurrentEditMask({ patternScale })
  }

  setPatternRotate(rotate: number) {
    this.updateCurrentEditMask({ rotate })
  }
}

function generateGridPoints(x: number, y: number, dx: number, dy: number, numRows: number, numCols: number) {
  const points = []
  const halfRows = numRows / 2 // 网格行数的一半
  const halfCols = numCols / 2 // 网格列数的一半

  for (let i = 0; i < numRows; i++) {
    for (let j = 0; j < numCols; j++) {
      // 计算当前点的坐标
      const newX = x + dx * (j - halfCols)
      const newY = y + dy * (i - halfRows)

      // 将新的点坐标添加到数组中
      points.push({ x: newX, y: newY })
    }
  }

  return points
}
