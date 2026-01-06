import { loadImage, selectFiles } from '@mix-toolkit/utils'
import { IPoint } from './types'

/**
 * 顶点坐标索引数组，先上三角后下三角
 */
export function getIndices(num: number) {
  let i, j
  const indices = []
  for (i = 0; i < num; i++) {
    for (j = 0; j < num; j++) {
      indices.push(i * (num + 1) + j, (i + 1) * (num + 1) + j, i * (num + 1) + j + 1)
      indices.push((i + 1) * (num + 1) + j, i * (num + 1) + j + 1, (i + 1) * (num + 1) + j + 1)
    }
  }
  return indices
}

/**
 * 顶点百分比
 */
export function getUVs(num: number) {
  const uvtData = []
  let i, j
  for (i = 0; i <= num; i++) {
    for (j = 0; j <= num; j++) {
      uvtData.push(i / num, j / num)
    }
  }
  return uvtData
}

export function getMaxSize2(vertices?: number[]) {
  if (!vertices) return { width: 0, height: 0, origin: { x: 0, y: 0 } }
  const ax = vertices[0]
  const ay = vertices[1]
  const bx = vertices[6]
  const by = vertices[7]
  const cx = vertices[24]
  const cy = vertices[25]
  const width = Math.sqrt(Math.pow(ax - cx, 2) + Math.pow(ay - cy, 2))
  const height = Math.sqrt(Math.pow(ax - bx, 2) + Math.pow(ay - by, 2))

  return {
    width,
    height,
    ratio: (width / height).toFixed(2)
  }
}

export function getPointList(vertices: number[]) {
  const pointList = []
  for (let i = 0; i < vertices.length; i += 2) {
    const obj: IPoint = { x: 0, y: 0 }
    obj.x = vertices[i]
    obj.y = vertices[i + 1]
    pointList.push(obj)
  }
  return pointList
}

export async function selectImages(params?: { suffix?: string[] }) {
  const { suffix = ['png', 'PNG', 'jpg', 'JPG', 'jpeg', 'JPEG'] } = params || {}
  const files = await selectFiles({
    types: suffix,
    multiple: true
  })
  return files
}
