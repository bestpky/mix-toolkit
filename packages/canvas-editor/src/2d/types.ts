import { IPresetVertices } from './distortion-stage/sdk.type'

export type IFashionCanvasType = 0 | 1 // 0: 定位 1: 满幅 默认0
export type IFashionCanvasMode = 0 | 1 | 2 // 0: 手动 1: AI 2: 变形

export interface ICanUsePattern {
  id: string
  url: string
  root_parent_id?: number // 外部系统跳转过来的才有
}

// 入参胚衣列表
export interface IFashionCanvasBasePeiYi {
  embryoCode?: string
  photographyCode?: string
  tag?: string
  templateId: string | number
  type?: IFashionCanvasType
  originUrl: string
  thumbUrl?: string
  accessoryUrl?: string // 配件图
  /** 满幅套花区 */
  maskList?: IFwMaskItem[]
  /** 预设模式16个点坐标 */
  vertices?: IPresetVertices[]
}

// 入参图案列表
export interface IFashionCanvasBasePattern {
  // patternId: string | number
  patternCode?: string // 花型号
  url: string // 花型图原图
  thumbUrl?: string // 花型图缩略图
}

export interface IDistortionPattern {
  url: string // 补图后的花型图
  patternId: string
  vertices: number[]
  brightness: number
  contrast: number
  saturate: number
  closeMixMode: boolean
}

export interface IFashionCanvasPeiYi extends IFashionCanvasBasePeiYi {
  id: string
  type: IFashionCanvasType
  mode: IFashionCanvasMode
  width: number
  height: number
  resultUrl?: string
  lastResultUrl?: string
  colorCorrectionUrl?: string
  isFromCroped?: boolean
  isFromCopy?: boolean
  /** 满幅套花区 */
  maskList: IFwMaskItem[]
  /** 预设模式16个点坐标 */
  vertices: IPresetVertices[]
  /** 画布缩放比例，首次formatData和本地上传会初始化，后续画布尺寸会根据这个比例，缩放视口高度画布不会自适应 */
  canvasRatio: number
  /** 是否完成定制 */
  isFinish?: 0 | 1
  /** 是否本地上传 */
  isLocalUpload?: 0 | 1
  /** 预设模式图层 */
  distortionList: IDistortionPattern[]
}

export type IInputSystem = 'aifd' | 'csrp'

export interface IInputFashionCanvasData {
  system: IInputSystem
  templateList: IFashionCanvasBasePeiYi[]
  patternList?: IFashionCanvasBasePattern[]
}

export interface IOutputList {
  embryoCode?: string
  photographyCode?: string
  templateId: string | number
  patternList?: IFashionCanvasBasePattern[]
  originHttpUrl: string // 原图http url
  resultDataUrl?: string // base64
  resultHttpUrl?: string // 结果图http url
}

export interface IFwMaskItem {
  maskId: string
  maskURL: string
  maskURL_front: string
  maskAreaWidth: number
  maskAreaHeight: number
  maskAreaOriginX: number
  maskAreaOriginY: number
  patternInfo?: IFwPatternInfo
  cj_mask_path: string
  cj_template_path: string
}

export type IFwPatternInfo = ICanUsePattern & IFwPatternAttribute

export interface IFwPatternAttribute {
  x: number
  y: number
  // 0-200 百分比 花型图和mask图的比例
  size: number
  // -180-180 旋转角度
  rotate: number
  // 亮度  0-100
  brightness: number
  // 对比度 0-100
  contrast: number
  // 饱和度 0-100
  saturation: number
  // 循环方式
  cycleMode: 0 | 1
}

export interface IWidhtHeight {
  width: number
  height: number
}

export interface IRect {
  x: number
  y: number
  width: number
  height: number
}

export interface IPoint {
  x: number
  y: number
}
