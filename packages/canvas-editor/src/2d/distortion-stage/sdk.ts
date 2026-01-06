import update from 'immutability-helper'
import { getIndices, getPointList, getUVs } from '../utils'
import { IDistortionPattern, IRect } from '../types'
import { drawTriangles } from './draw-triangles'
import { fixClipGap } from './fix-clip-gap'
import { IDisPatternSdk, IDistortionSdkParams, IPresetVertices } from './sdk.type'
import { popDropdown } from '../pop-dropdown'

const edgePointIndex = [0, 1, 2, 3, 7, 11, 15, 14, 13, 12, 8, 4]

export class DistortionSdk {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  originImage: HTMLImageElement
  patternList: IDisPatternSdk[] = []
  isFront = false
  presetVertices: IPresetVertices[] = []

  isTranslate = false // 拖动中心点平移
  isDragging = false // 拖动16个点变形
  activePatternId = '' // 编辑预设弹窗才用到
  draggingPatternIndex = -1
  draggingPointIndex = -1
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

  constructor({ canvas, originImage, patternList, isFront = false, presetVertices = [] }: IDistortionSdkParams) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d', { willReadFrequently: true }) as CanvasRenderingContext2D
    this.originImage = originImage
    this.patternList = patternList
    this.isFront = isFront
    this.presetVertices = presetVertices

    if (isFront) {
      const createCanvas = (parentElement: HTMLElement, isBgCanvas?: boolean) => {
        const canvas = document.createElement('canvas')
        parentElement.appendChild(canvas)
        canvas.width = this.canvas.width
        canvas.height = this.canvas.height
        canvas.style.position = 'absolute'
        canvas.style.top = '0'
        canvas.style.left = '0'
        if (isBgCanvas) {
          canvas.style.zIndex = '-1'
        }
        return canvas
      }
      // 橡皮擦功能
      const parentElement = canvas.parentElement
      if (!parentElement) return
      // 背景canvas，橡皮擦得分离
      this.backgroundCanvas = createCanvas(parentElement, true)
      this.backgroundCanvasCtx = this.backgroundCanvas.getContext('2d') as CanvasRenderingContext2D
      // 光标canvas
      this.cursorCanvas = createCanvas(parentElement)
      this.cursorCanvasCtx = this.cursorCanvas.getContext('2d') as CanvasRenderingContext2D
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
            const steps = Math.floor(distance / 2) // 控制插值密度

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
      // 初始换隐藏的原始画布，为了做恢复
      this.backupCanvas = document.createElement('canvas')
      this.backupCanvas.width = this.canvas.width
      this.backupCanvas.height = this.canvas.height
      this.backupCanvasCtx = this.backupCanvas.getContext('2d') as CanvasRenderingContext2D
      // 圈选canvas
      this.circlingCanvas = createCanvas(parentElement)
      this.circlingCanvas.style.display = 'none'
      this.circlingCanvasCtx = this.circlingCanvas.getContext('2d') as CanvasRenderingContext2D
      this.circlingCanvas.addEventListener('mousedown', e => {
        if (this.eraserType !== 'circling' || !this.circlingCanvasCtx || !this.circlingCanvas) return
        this.removeDropdown()
        ;[this.circlingStartX, this.circlingStartY] = [e.offsetX, e.offsetY]
        this.isDrawing = true
        // 每次开始绘图先清除上次的绘制
        this.circlingCanvasCtx.clearRect(0, 0, this.circlingCanvas.width, this.circlingCanvas.height)
      })

      this.circlingCanvas.addEventListener('mousemove', e => {
        if (this.eraserType !== 'circling' || !this.isDrawing || !this.circlingCanvasCtx || !this.circlingCanvas) return
        // 重新绘制以显示动态的蓝色方框
        const width = e.offsetX - this.circlingStartX
        const height = e.offsetY - this.circlingStartY
        this.circlingCanvasCtx.clearRect(0, 0, this.circlingCanvas.width, this.circlingCanvas.height) // 清除之前的绘图
        this.circlingCanvasCtx.setLineDash([5, 5])
        this.circlingCanvasCtx.strokeStyle = '#0019FF'
        this.circlingCanvasCtx.strokeRect(this.circlingStartX, this.circlingStartY, width, height)
      })

      this.circlingCanvas.addEventListener('mouseup', e => {
        if (this.eraserType !== 'circling' || !this.isDrawing) return
        this.isDrawing = false
        const endX = e.offsetX
        const endY = e.offsetY
        // 计算并显示框选区域的信息
        const x = Math.min(endX, this.circlingStartX)
        const y = Math.min(endY, this.circlingStartY)
        const width = Math.abs(endX - this.circlingStartX)
        const height = Math.abs(endY - this.circlingStartY)
        let intersection: IRect = { x, y, width, height }
        if (this.patternPosInfo.height > 0 && this.patternPosInfo.width > 0) {
          const _intersection = this.getRelativeIntersectionArea(
            {
              x: this.patternPosInfo.x,
              y: this.patternPosInfo.y,
              width: this.patternPosInfo.width,
              height: this.patternPosInfo.height
            },
            { x, y, width, height }
          )
          if (_intersection) {
            intersection = _intersection
          }
        } else {
          intersection = { x, y, width, height }
        }
        if (intersection) {
          if (width === 0 || height === 0) {
            return
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
        } else {
          this.removeCirclingBorder()
          this.removeDropdown()
        }
      })
    }
  }

  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
  }

  reDraw() {
    this.clear()
    if (this.backgroundCanvasCtx) {
      this.drawBgImage(this.backgroundCanvasCtx)
    } else {
      this.drawBgImage(this.ctx)
    }
    this.drawPatterns()
    if (this.isFront && this.presetVertices.length) {
      this.drawPresetArea()
    }
    // 同步备份画布
    this.backupCanvasCtx?.drawImage(this.canvas, 0, 0)
  }

  drawPresetArea() {
    this.presetVertices
      .filter(v => !v.relativePatternId)
      .forEach(({ sixteenPoints, id }) => {
        // 绘制预设区域
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

  addPattern(pattern: IDisPatternSdk) {
    this.patternList.push(pattern)
  }

  drawPatterns() {
    const indices = getIndices(3)
    const uvtData = getUVs(3)
    this.patternList.forEach(
      ({ patternId, patternImage, vertices, centerPoint, saturate, contrast, brightness, closeMixMode }) => {
        if (!this.isFront) {
          this.ctx.globalCompositeOperation = 'source-over'
        } else {
          if (closeMixMode) {
            this.ctx.globalCompositeOperation = 'source-over'
          } else {
            this.ctx.globalCompositeOperation = 'multiply'
          }
        }
        // 创建一个离屏canvas用于调整对比度、亮度、饱和度
        const offscreenCanvas = document.createElement('canvas')
        const offscreenCtx = offscreenCanvas.getContext('2d', { willReadFrequently: true }) as CanvasRenderingContext2D
        offscreenCanvas.width = this.canvas.width
        offscreenCanvas.height = this.canvas.height
        // 离屏canvas绘制图像
        drawTriangles({
          image: patternImage,
          vertices,
          indices,
          uvtData
        })(offscreenCtx)
        // 单独获取每个图案的图像数据，为了做每个图案对比度、亮度、饱和度的分离
        let imageData = offscreenCtx.getImageData(0, 0, offscreenCanvas.width, offscreenCanvas.height)
        // 将修改后的图像数据放回离屏 Canvas
        offscreenCtx.putImageData(imageData, 0, 0)
        // 消除透明细线
        fixClipGap(offscreenCtx, { width: this.canvas.width, height: this.canvas.height })
        // 将修改后的图片绘制回原始 Canvas
        this.ctx.drawImage(offscreenCanvas, 0, 0)
        // 在isFront=false时
        if (this.activePatternId === patternId) {
          // 绘制中心点
          this.drawCenterPoint(centerPoint.x, centerPoint.y)
          // 绘制16个点
          this.drawVertices(vertices)
        }
      }
    )
  }

  drawVertices(vertices: number[]) {
    vertices.forEach((v, i) => {
      if (i % 2 === 0) {
        this.drawVertice(v, vertices[i + 1])
      }
    })
  }

  drawVertice(x: number, y: number) {
    this.ctx.beginPath()
    this.ctx.arc(x, y, 5, 0, Math.PI * 2)
    this.ctx.fillStyle = '#196EFF'
    this.ctx.fill()
  }

  drawCenterPoint(x: number, y: number) {
    this.ctx.beginPath()
    this.ctx.arc(x, y, 5, 0, Math.PI * 2)
    this.ctx.fillStyle = '#196EFF'
    this.ctx.fill()
  }

  getMousePos = (e: React.MouseEvent | React.DragEvent | MouseEvent) => {
    const canvasRect = this.canvas.getBoundingClientRect()
    const x = e.clientX - canvasRect.left
    const y = e.clientY - canvasRect.top
    return { x, y }
  }

  onMouseDown: React.MouseEventHandler = e => {
    const mousePos = this.getMousePos(e)
    for (let i = 0; i < this.patternList.length; i++) {
      const { vertices, centerPoint, patternId } = this.patternList[i]
      if (patternId !== this.activePatternId) {
        continue
      }
      // 判断是否点击中心点
      if (Math.sqrt((mousePos.x - centerPoint.x) ** 2 + (mousePos.y - centerPoint.y) ** 2) <= 5) {
        this.draggingPatternIndex = i
        this.isTranslate = true
        break
      }
      // 判断是否点击16个点
      for (let j = 0; j < vertices.length; j += 2) {
        const x = vertices[j]
        const y = vertices[j + 1]
        const radius = 5
        if (Math.sqrt((mousePos.x - x) ** 2 + (mousePos.y - y) ** 2) <= radius) {
          this.draggingPatternIndex = i
          this.draggingPointIndex = j
          this.isDragging = true
          break
        }
      }
    }
  }

  onMouseMove: React.MouseEventHandler = e => {
    if (this.isDragging) {
      const deltaX = e.movementX
      const deltaY = e.movementY
      const newSdkPatternList = update(this.patternList, {
        [this.draggingPatternIndex]: {
          vertices: {
            [this.draggingPointIndex]: {
              $apply: v => v + deltaX
            },
            [this.draggingPointIndex + 1]: {
              $apply: v => v + deltaY
            }
          }
        }
      })
      this.patternList = newSdkPatternList
      this.reDraw()
    }
    if (this.isTranslate) {
      const deltaX = e.movementX
      const deltaY = e.movementY
      const newSdkPatternList = update(this.patternList, {
        [this.draggingPatternIndex]: {
          centerPoint: {
            x: {
              $apply: v => v + deltaX
            },
            y: {
              $apply: v => v + deltaY
            }
          },
          vertices(v) {
            return v.map((item, index) => (index % 2 === 0 ? item + deltaX : item + deltaY))
          }
        }
      })
      this.patternList = newSdkPatternList
      this.reDraw()
    }
  }

  onMouseUp: React.MouseEventHandler = () => {
    this.isDragging = false
    this.isTranslate = false
    this.draggingPatternIndex = -1
    this.draggingPointIndex = -1
  }

  updateCurrentEditPattern(params: Partial<IDistortionPattern>) {
    const index = this.patternList.findIndex(v => v.patternId === params.patternId)
    const newPatternList = update(this.patternList, {
      [index]: {
        $merge: params
      }
    })
    this.patternList = newPatternList
    this.reDraw()
  }

  // 以下为橡皮擦相关

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
    const eraserSize = this.eraserSize
    const halfSize = eraserSize / 2
    this.ctx.save()
    this.ctx.beginPath()
    this.ctx.arc(x, y, halfSize, 0, Math.PI * 2)
    this.ctx.clip()
    this.ctx.drawImage(this.backupCanvas, 0, 0)
    this.ctx.restore()
  }

  mergeImageData() {
    if (!this.backgroundCanvas || !this.backgroundCanvasCtx) return
    // 获取两个原始画布的像素数据
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
        // 例如这里检测像素alpha值是否小于128来判断是否"被擦除"
        data1[i] = data2[i]
        data1[i + 1] = data2[i + 1]
        data1[i + 2] = data2[i + 2]
        data1[i + 3] = data2[i + 3]
      }
    }

    // 将处理后的像素数据绘制到结果画布上
    resultCtx!.putImageData(imageData1, 0, 0)
    return resultCanvas
  }

  // 获取框选区域和图案区域的交集区域
  getRelativeIntersectionArea(rectA: IRect, rectB: IRect) {
    // 计算交集区域的绝对坐标和大小
    const xIntersect = Math.max(rectA.x, rectB.x)
    const yIntersect = Math.max(rectA.y, rectB.y)
    const rightIntersect = Math.min(rectA.x + rectA.width, rectB.x + rectB.width)
    const bottomIntersect = Math.min(rectA.y + rectA.height, rectB.y + rectB.height)

    const widthIntersect = rightIntersect - xIntersect
    const heightIntersect = bottomIntersect - yIntersect

    if (widthIntersect < 0 || heightIntersect < 0) {
      // 没有交集区域
      return null
    }

    // 计算相对于rectA的交集区域的坐标和大小
    const relativeX = xIntersect - rectA.x
    const relativeY = yIntersect - rectA.y

    // 返回相对交集区域的信息
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
