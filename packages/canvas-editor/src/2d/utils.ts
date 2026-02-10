import { selectFiles } from '@pky/utils'
import { IPoint } from './types'

// 获取16个点的中心点
export function getCenterPointByVertices(vertices: number[]): IPoint {
  let x = 0
  let y = 0
  for (let i = 0; i < vertices.length; i += 2) {
    x += vertices[i]
    y += vertices[i + 1]
  }
  x /= vertices.length / 2
  y /= vertices.length / 2

  return { x, y }
}

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
