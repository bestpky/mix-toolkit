import { IPoint } from '../types'

export interface IDistortionSdkParams {
  canvas: HTMLCanvasElement
  originImage: HTMLImageElement
  patternList: IDisPatternSdk[]
  isFront?: boolean // 是否在stage里用
  presetVertices?: IPresetVertices[]
}

export interface IDisPatternSdk {
  patternId: string
  patternImage: HTMLImageElement
  vertices: number[]
  centerPoint: IPoint
  brightness: number
  contrast: number
  saturate: number
  closeMixMode: boolean
}

export interface IPresetVertices {
  id: string // 高亮用到
  sixteenPoints: number[]
  relativePatternId: string | undefined // 没有则为undefined
}
