import { IPoint } from '../types'

export interface IPresetVertices {
  id: string
  sixteenPoints: number[] // 16个点的坐标 [x0,y0, x1,y1, ...]
  relativePatternId: string | undefined // 关联的图案ID
}

// SDK 初始化参数
export interface ISdkParams {
  canvas: HTMLCanvasElement
  originImage: HTMLImageElement
  patternList: IPatternSdk[]
  presetVertices?: IPresetVertices[]
}

// SDK 内部使用的图案数据结构
export interface IPatternSdk {
  patternId: string
  patternImage: HTMLImageElement
  vertices: number[] // 16个顶点坐标
  centerPoint: IPoint
  useMultiply?: boolean // 是否使用混合模式 (multiply)
}
