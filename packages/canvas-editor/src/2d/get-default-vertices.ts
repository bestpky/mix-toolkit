import { IPoint, IRect } from './types'

// 根据花型位置和大小生成16个点
export function calcNormalVertices(params: IRect) {
  const { x, y, height, width } = params
  const stepX = width / 3
  const stepY = height / 3
  const vertices = []
  for (let j = 0; j < 4; j++) {
    for (let i = 0; i < 4; i++) {
      vertices.push(x + stepX * j, y + stepY * i)
    }
  }
  return vertices
}

export function getDefaultVertices(width: number, height: number): number[] {
  const centerPeiYiX = width / 2
  const centerPeiYiY = height / 2
  const patternWidth = width / 5
  const patternHeight = height / 5
  const x = centerPeiYiX - patternWidth / 2
  const y = centerPeiYiY - patternHeight / 2
  const defaultVertices = calcNormalVertices({
    x,
    y,
    width: patternWidth,
    height: patternHeight
  })
  return defaultVertices
}

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
