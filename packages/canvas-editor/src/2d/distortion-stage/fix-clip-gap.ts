import { IWidhtHeight } from '../types'

/**
 * 修补Canvas clip产生的白色细线
 */
export const fixClipGap = (context: CanvasRenderingContext2D, size: IWidhtHeight) => {
  const { width, height } = size
  const imageData = new ImageData(context.getImageData(0, 0, width, height).data.slice(0), width, height)
  for (let i = 0; i < imageData.data.length; i += 4) {
    if (imageData.data[i + 3] !== 0) {
      imageData.data[i + 3] = 255
    }
  }
  // 清空整个画布
  context.clearRect(0, 0, width, height)
  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'
  // 重新将补偿过的ImageData绘制到画布上
  context.putImageData(imageData, 0, 0)
}
