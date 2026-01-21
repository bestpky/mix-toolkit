import { loadImage } from '@mix-toolkit/utils'

export const getCanvasRatio = (viewportHeight: number, imageHeight?: number) => {
  if (!imageHeight) {
    return 1
  }
  return (viewportHeight - 160) / imageHeight
}

// 根据图片像素计算画布缩放比例
export const calcCanvasRatio = (params: {
  viewportHeight: number
  viewportWidth: number
  imageHeight: number
  imageWidth: number
}) => {
  const { viewportHeight, viewportWidth, imageHeight, imageWidth } = params
  if (imageHeight >= imageWidth) {
    return (viewportHeight - 160) / imageHeight
  } else {
    // 左右两边宽度和padding
    return (viewportWidth - 221 - 304 - 16 * 2) / imageWidth
  }
}

// 获取透明底图的图片的图像内容分辨率
export const getImageDimension = async (url: string) => {
  const image = await loadImage(url, { crossOrigin: 'anonymous' })
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  canvas.width = image.width
  canvas.height = image.height

  ctx!.drawImage(image, 0, 0)

  const imageData = ctx!.getImageData(0, 0, canvas.width, canvas.height)
  const data = imageData.data

  let minX = canvas.width,
    minY = canvas.height,
    maxX = 0,
    maxY = 0

  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const alpha = data[(y * canvas.width + x) * 4 + 3]
      if (alpha > 0) {
        minX = Math.min(minX, x)
        maxX = Math.max(maxX, x)
        minY = Math.min(minY, y)
        maxY = Math.max(maxY, y)
      }
    }
  }

  const width = maxX - minX + 1
  const height = maxY - minY + 1

  return {
    width,
    height,
    minX,
    minY
  }
}

/**
 * 『关键』图案大小换算公式
 * maskHeight * (patternSize / 100) * canvasRatio = patternHeight * patternScale
 *
 * maskHeight = mask区域的高度 [0-1785]
 * patternSize = 图案大小 [0-200]
 * canvasRatio = 画布和实际图片大小比例 [0-1]
 * patternHeight = 花型图像素高度
 * patternScale = 缩放比例 [0-1]
 */
export const calcPatternScaleBySize = (params: {
  maskHeight: number
  patternSize: number
  patternHeight: number
  canvasRatio: number
}) => {
  const { maskHeight, patternSize, patternHeight, canvasRatio } = params
  const patternScale = (maskHeight * patternSize * canvasRatio) / (100 * patternHeight)
  return patternScale
}

/**
 * 『关键』计算图案在 mask 区域的位置
 * 面料中心位置x：面料图中心点横坐标相对替换区域的横向位置，默认0.5表示面料中心点在替换区域横向一半的位置。坐标原点在左上角。
 * 面料中心位置y：面料图中心点纵坐标相对替换区域的纵向位置，默认0.5表示面料中心点在替换区域纵向一半的位置。坐标原点在左上角。
 */
export const calcPatternPosInMask = (params: {
  patternX: number
  patternY: number
  maskAreaOriginX: number
  maskAreaOriginY: number
  canvasRatio: number
  patternSize: number
  maskAreaHeight: number
  maskAreaWidth: number
  patternRatio: number
}) => {
  const {
    patternX,
    patternY,
    maskAreaOriginX,
    maskAreaOriginY,
    canvasRatio,
    patternSize,
    maskAreaWidth,
    maskAreaHeight,
    patternRatio
  } = params
  // 转成在canvas里的坐标
  const patternXInMaskArea = patternX - maskAreaOriginX * canvasRatio
  const patternYInMaskArea = patternY - maskAreaOriginY * canvasRatio
  const patternHeight = maskAreaHeight * canvasRatio * patternSize
  const patternWidth = patternHeight * patternRatio
  const patternCenterX = patternXInMaskArea + patternWidth / 2
  const patternCenterY = patternYInMaskArea + patternHeight / 2
  const patternCenterXInMask = patternCenterX / (maskAreaWidth * canvasRatio)
  const patternCenterYInMask = patternCenterY / (maskAreaHeight * canvasRatio)
  return { patternCenterXInMask, patternCenterYInMask }
}

// 从二值图像数据创建裁剪路径
export function createClipPathFromBinaryImageData(imageData: ImageData) {
  const path = new Path2D()
  const { width, height, data } = imageData

  for (let y = 0; y < height; y++) {
    let startX = null // 记录当前连续白色像素段的起始 x 坐标

    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4
      const isWhite = data[index] === 255

      if (isWhite) {
        if (startX === null) {
          // 遇到新的白色像素段，记录起始 x 坐标
          startX = x
        }
      } else {
        if (startX !== null) {
          // 遇到黑色像素，结束当前白色像素段
          path.rect(startX, y, x - startX, 1) // 创建一个矩形路径表示当前白色像素段
          startX = null
        }
      }
    }

    // 处理每行末尾的白色像素段
    if (startX !== null) {
      path.rect(startX, y, width - startX, 1)
    }
  }

  return path
}

export function isPointInPath(params: {
  canvasWidth: number
  canvasHeight: number
  imageElement: HTMLImageElement
  x: number
  y: number
}) {
  const { imageElement, canvasHeight, canvasWidth, x, y } = params
  const canvas = document.createElement('canvas')
  canvas.width = canvasWidth
  canvas.height = canvasHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    return false
  }
  ctx.drawImage(imageElement, 0, 0, imageElement.width, imageElement.height, 0, 0, canvas.width, canvas.height)
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const path = createClipPathFromBinaryImageData(imageData)
  return ctx.isPointInPath(path, x, y)
}
