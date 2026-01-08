import update from 'immutability-helper'
import { getIndices, getPointList, getUVs } from '../utils'
import { IPattern } from '../types'
import { drawTriangles } from './draw-triangles'
import { fixClipGap } from './fix-clip-gap'
import { IPatternSdk, ISdkParams, IPresetVertices } from './sdk.type'
import { popDropdown } from '../pop-dropdown'

const edgePointIndex = [0, 1, 2, 3, 7, 11, 15, 14, 13, 12, 8, 4]

interface IRect {
  x: number
  y: number
  width: number
  height: number
}

export class Sdk {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  originImage: HTMLImageElement
  patternList: IPatternSdk[] = []
  presetVertices: IPresetVertices[] = []

  // 预设区域高亮
  highlightVerticeId = ''

  // 橡皮擦相关
  backgroundCanvas: HTMLCanvasElement | null = null
  backgroundCanvasCtx: CanvasRenderingContext2D | null = null
  cursorCanvas: HTMLCanvasElement | null = null
  cursorCanvasCtx: CanvasRenderingContext2D | null = null
  backupCanvas: HTMLCanvasElement | null = null
  backupCanvasCtx: CanvasRenderingContext2D | null = null
  circlingCanvas: HTMLCanvasElement | null = null
  circlingCanvasCtx: CanvasRenderingContext2D | null = null
  eraserSize = 0
  eraserType: 'eraser' | 'repair' | 'circling' | undefined = undefined
  isErasing = false
  lastX = 0
  lastY = 0
  circlingStartX = 0
  circlingStartY = 0
  isDrawing = false
  patternPosInfo: IRect = { x: 0, y: 0, width: 0, height: 0 }

  constructor({ canvas, originImage, patternList, presetVertices = [] }: ISdkParams) {
    this.canvas = canvas
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) {
      throw new Error('Failed to get 2d context from canvas')
    }
    this.ctx = ctx
    this.originImage = originImage
    this.patternList = patternList
    this.presetVertices = presetVertices

    this.initEraserCanvases()
  }

  // 初始化橡皮擦相关的Canvas
  private initEraserCanvases() {
    const parentElement = this.canvas.parentElement
    if (!parentElement) return

    const createCanvas = (zIndex: string, id: string) => {
      const canvas = document.createElement('canvas')
      parentElement.appendChild(canvas)
      canvas.id = id
      canvas.width = this.canvas.width
      canvas.height = this.canvas.height
      canvas.style.position = 'absolute'
      canvas.style.top = '0'
      canvas.style.left = '0'
      canvas.style.zIndex = zIndex
      return canvas
    }

    // 背景canvas (显示原始背景图, z-index: 0)
    this.backgroundCanvas = createCanvas('0', 'canvas-background')
    this.backgroundCanvasCtx = this.backgroundCanvas.getContext('2d') as CanvasRenderingContext2D

    // 光标canvas (显示橡皮擦光标, z-index: 2)
    this.cursorCanvas = createCanvas('2', 'canvas-cursor')
    this.cursorCanvasCtx = this.cursorCanvas.getContext('2d') as CanvasRenderingContext2D
    this.setupCursorEvents()

    // 备份canvas (用于恢复功能, 不显示)
    this.backupCanvas = document.createElement('canvas')
    this.backupCanvas.id = 'canvas-backup'
    this.backupCanvas.width = this.canvas.width
    this.backupCanvas.height = this.canvas.height
    this.backupCanvasCtx = this.backupCanvas.getContext('2d') as CanvasRenderingContext2D

    // 圈选canvas (z-index: 2)
    this.circlingCanvas = createCanvas('2', 'canvas-circling')
    this.circlingCanvas.style.display = 'none'
    this.circlingCanvasCtx = this.circlingCanvas.getContext('2d') as CanvasRenderingContext2D
    this.setupCirclingEvents()
  }

  // 设置光标Canvas的事件
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
      this.drawCursor(mousePos.x, mousePos.y)

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

  // 设置圈选Canvas的事件
  private setupCirclingEvents() {
    if (!this.circlingCanvas) return

    this.circlingCanvas.addEventListener('mousedown', e => {
      if (this.eraserType !== 'circling' || !this.circlingCanvasCtx || !this.circlingCanvas) return
      this.removeDropdown()
      this.circlingStartX = e.offsetX
      this.circlingStartY = e.offsetY
      this.isDrawing = true
      this.circlingCanvasCtx.clearRect(0, 0, this.circlingCanvas.width, this.circlingCanvas.height)
    })

    this.circlingCanvas.addEventListener('mousemove', e => {
      if (this.eraserType !== 'circling' || !this.isDrawing || !this.circlingCanvasCtx || !this.circlingCanvas) return
      const width = e.offsetX - this.circlingStartX
      const height = e.offsetY - this.circlingStartY
      this.circlingCanvasCtx.clearRect(0, 0, this.circlingCanvas.width, this.circlingCanvas.height)
      this.circlingCanvasCtx.setLineDash([5, 5])
      this.circlingCanvasCtx.strokeStyle = '#0019FF'
      this.circlingCanvasCtx.strokeRect(this.circlingStartX, this.circlingStartY, width, height)
    })

    this.circlingCanvas.addEventListener('mouseup', e => {
      if (this.eraserType !== 'circling' || !this.isDrawing) return
      this.isDrawing = false
      this.handleCirclingComplete(e)
    })
  }

  // 处理圈选完成
  private handleCirclingComplete(e: MouseEvent) {
    const endX = e.offsetX
    const endY = e.offsetY
    const x = Math.min(endX, this.circlingStartX)
    const y = Math.min(endY, this.circlingStartY)
    const width = Math.abs(endX - this.circlingStartX)
    const height = Math.abs(endY - this.circlingStartY)

    if (width === 0 || height === 0) return

    let intersection: IRect = { x, y, width, height }

    // 如果有图案区域限制,计算交集
    if (this.patternPosInfo.height > 0 && this.patternPosInfo.width > 0) {
      const _intersection = this.getRelativeIntersectionArea(this.patternPosInfo, { x, y, width, height })
      if (_intersection) {
        intersection = _intersection
      }
    }

    const container = document.querySelector(`#eraser-canvas-wrapper`) as HTMLElement
    popDropdown({
      x: e.offsetX,
      y: e.offsetY,
      container,
      handleClickEraser: () => {
        this.ctx?.clearRect(intersection.x, intersection.y, intersection.width, intersection.height)
        this.removeCirclingBorder()
        this.removeDropdown()
      },
      handleClickRestore: () => {
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

  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
  }

  reDraw() {
    this.clear()

    // 背景图绘制到backgroundCanvas（下层）
    if (this.backgroundCanvasCtx) {
      this.backgroundCanvasCtx.clearRect(0, 0, this.canvas.width, this.canvas.height)
      this.drawBgImage(this.backgroundCanvasCtx)

      // 如果有图案使用混合模式，需要先在主canvas绘制背景
      const hasMultiplyPattern = this.patternList.some(p => p.useMultiply)
      if (hasMultiplyPattern) {
        this.drawBgImage(this.ctx)
      }
    } else {
      // 如果没有backgroundCanvas，背景图绘制到主canvas
      this.drawBgImage(this.ctx)
    }

    // 主canvas绘制图案和预设区域
    this.drawPatterns()
    if (this.presetVertices.length) {
      this.drawPresetArea()
    }

    // 备份画布只备份主canvas的内容（图案+预设区域，不包含背景）
    this.backupCanvasCtx?.drawImage(this.canvas, 0, 0)
  }

  drawPresetArea() {
    this.presetVertices
      .filter(v => !v.relativePatternId)
      .forEach(({ sixteenPoints, id }) => {
        this.ctx.save()
        this.ctx.beginPath()
        const points = getPointList(sixteenPoints)
        const newPoints = edgePointIndex.map(index => points[index])
        this.ctx.moveTo(newPoints[0].x, newPoints[0].y)
        newPoints.forEach(({ x, y }) => {
          this.ctx.lineTo(x, y)
        })
        this.ctx.fillStyle = id === this.highlightVerticeId ? 'rgba(255, 0, 0, 0.5)' : 'rgba(255, 0, 0, 0.2)'
        this.ctx.fill()
        this.ctx.closePath()
        this.ctx.restore()
      })
  }

  isPointInPresetArea(e: React.MouseEvent | React.DragEvent) {
    const { x, y } = this.getMousePos(e)
    for (const { sixteenPoints, id } of this.presetVertices) {
      const points = getPointList(sixteenPoints)
      const newPoints = edgePointIndex.map(index => points[index])
      const pointList = newPoints.map(({ x, y }) => [x, y])
      const isInsidePolygon = this.isPointInPolygon(x, y, pointList)
      if (isInsidePolygon) {
        return { sixteenPoints, id }
      }
    }
  }

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

  cleanPresetRelativePatternId(patternId: string) {
    const index = this.presetVertices.findIndex(v => v.relativePatternId === patternId)
    if (index !== -1) {
      this.setPresetRelativePatternId(index, undefined)
    }
  }

  isPointInPolygon(x: number, y: number, pointList: number[][]) {
    let isInside = false
    for (let i = 0, j = pointList.length - 1; i < pointList.length; j = i++) {
      const xi = pointList[i][0]
      const yi = pointList[i][1]
      const xj = pointList[j][0]
      const yj = pointList[j][1]
      const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi
      if (intersect) {
        isInside = !isInside
      }
    }
    return isInside
  }

  drawBgImage(ctx: CanvasRenderingContext2D) {
    ctx.drawImage(this.originImage, 0, 0, this.canvas.width, this.canvas.height)
  }

  addPattern(pattern: IPatternSdk) {
    this.patternList.push(pattern)
  }

  drawPatterns() {
    const indices = getIndices(3)
    const uvtData = getUVs(3)
    this.patternList.forEach(({ patternImage, vertices, useMultiply }) => {
      // 保存当前状态
      this.ctx.save()

      // 根据 useMultiply 属性设置混合模式
      this.ctx.globalCompositeOperation = useMultiply ? 'multiply' : 'source-over'

      // 创建离屏canvas用于调整颜色
      const offscreenCanvas = document.createElement('canvas')
      const offscreenCtx = offscreenCanvas.getContext('2d', { willReadFrequently: true }) as CanvasRenderingContext2D
      offscreenCanvas.width = this.canvas.width
      offscreenCanvas.height = this.canvas.height

      // 绘制变形后的图案
      drawTriangles({
        image: patternImage,
        vertices,
        indices,
        uvtData
      })(offscreenCtx)

      const imageData = offscreenCtx.getImageData(0, 0, offscreenCanvas.width, offscreenCanvas.height)
      offscreenCtx.putImageData(imageData, 0, 0)

      // 消除透明细线
      fixClipGap(offscreenCtx, { width: this.canvas.width, height: this.canvas.height })

      // 绘制到主画布
      this.ctx.drawImage(offscreenCanvas, 0, 0)

      // 恢复状态
      this.ctx.restore()
    })
  }

  getMousePos = (e: React.MouseEvent | React.DragEvent | MouseEvent) => {
    const canvasRect = this.canvas.getBoundingClientRect()
    const x = e.clientX - canvasRect.left
    const y = e.clientY - canvasRect.top
    return { x, y }
  }

  updateCurrentEditPattern(params: Partial<IPattern>) {
    const index = this.patternList.findIndex(v => v.patternId === params.patternId)
    const newPatternList = update(this.patternList, {
      [index]: {
        $merge: params
      }
    })
    this.patternList = newPatternList
    this.reDraw()
  }

  // 更新图案的混合模式
  setPatternMultiply(patternId: string, useMultiply: boolean) {
    const index = this.patternList.findIndex(v => v.patternId === patternId)
    if (index === -1) return
    const newPatternList = update(this.patternList, {
      [index]: {
        useMultiply: {
          $set: useMultiply
        }
      }
    })
    this.patternList = newPatternList
    this.reDraw()
  }

  // 橡皮擦方法

  setEraserSize(val: number) {
    this.eraserSize = val
  }

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

  drawCursor(x: number, y: number) {
    if (!this.cursorCanvas || !this.cursorCanvasCtx || this.eraserType === 'circling' || !this.eraserType) return
    this.cursorCanvasCtx.clearRect(0, 0, this.cursorCanvas.width, this.cursorCanvas.height)
    this.cursorCanvasCtx.fillStyle = this.eraserType === 'eraser' ? 'rgba(255, 0, 0, 0.7)' : 'rgba(82, 196, 26, 1)'
    this.cursorCanvasCtx.beginPath()
    this.cursorCanvasCtx.arc(x, y, this.eraserSize / 2, 0, Math.PI * 2)
    this.cursorCanvasCtx.fill()
  }

  erase(x: number, y: number) {
    if (!this.ctx) return
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

    this.ctx.globalCompositeOperation = 'source-over'

    this.lastX = x
    this.lastY = y
  }

  restore(x: number, y: number) {
    if (!this.ctx || !this.backupCanvas) return
    const halfSize = this.eraserSize / 2
    this.ctx.save()
    this.ctx.beginPath()
    this.ctx.arc(x, y, halfSize, 0, Math.PI * 2)
    this.ctx.clip()
    this.ctx.drawImage(this.backupCanvas, 0, 0)
    this.ctx.restore()
  }

  mergeImageData() {
    if (!this.backgroundCanvas || !this.backgroundCanvasCtx) return
    const imageData1 = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height)
    const imageData2 = this.backgroundCanvasCtx.getImageData(
      0,
      0,
      this.backgroundCanvas.width,
      this.backgroundCanvas.height
    )

    if (!imageData1 || !imageData2) return
    const data1 = imageData1.data
    const data2 = imageData2.data

    const resultCanvas = document.createElement('canvas')
    resultCanvas.width = this.canvas.width
    resultCanvas.height = this.canvas.height
    const resultCtx = resultCanvas.getContext('2d')

    for (let i = 0; i < data1.length; i += 4) {
      if (data1[i + 3] < 128) {
        data1[i] = data2[i]
        data1[i + 1] = data2[i + 1]
        data1[i + 2] = data2[i + 2]
        data1[i + 3] = data2[i + 3]
      }
    }

    resultCtx!.putImageData(imageData1, 0, 0)
    return resultCanvas
  }

  getRelativeIntersectionArea(rectA: IRect, rectB: IRect) {
    const xIntersect = Math.max(rectA.x, rectB.x)
    const yIntersect = Math.max(rectA.y, rectB.y)
    const rightIntersect = Math.min(rectA.x + rectA.width, rectB.x + rectB.width)
    const bottomIntersect = Math.min(rectA.y + rectA.height, rectB.y + rectB.height)

    const widthIntersect = rightIntersect - xIntersect
    const heightIntersect = bottomIntersect - yIntersect

    if (widthIntersect < 0 || heightIntersect < 0) {
      return null
    }

    const relativeX = xIntersect - rectA.x
    const relativeY = yIntersect - rectA.y

    return { x: relativeX, y: relativeY, width: widthIntersect, height: heightIntersect }
  }

  removeDropdown() {
    const dropdown = document.getElementById('dropdown')
    if (dropdown) {
      dropdown.remove()
    }
  }

  removeCirclingBorder() {
    if (!this.circlingCanvasCtx || !this.circlingCanvas) return
    this.circlingCanvasCtx.clearRect(0, 0, this.circlingCanvas.width, this.circlingCanvas.height)
  }
}
