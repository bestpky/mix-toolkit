export interface IWidhtHeight {
  width: number
  height: number
}

export interface IPoint {
  x: number
  y: number
}

// 可用图案
export interface ICanUsePattern {
  id: string
  url: string
  thumbUrl?: string
}

// 预设区域的16点定义
export interface IPresetVertices {
  id: string
  sixteenPoints: number[] // 16个点的坐标 [x0,y0, x1,y1, ...]
  relativePatternId: string | undefined // 关联的图案ID
}

// 已添加的图案
export interface IPattern {
  patternId: string
  url: string // 图案URL
  vertices: number[] // 16个顶点坐标
}

// 画布数据
export interface ICanvasData {
  id: string
  originUrl: string // 背景图URL
  width: number
  height: number
  vertices: IPresetVertices[] // 预设区域列表
  patternList: IPattern[] // 已添加的图案列表
}
