import { ICanUsePattern } from 'src/2d'

export interface IFashionCanvasBasePeiYi {
  templateId: string | number
  originUrl: string
  /** 满幅套花区 */
  maskList?: IFwMaskItem[]
}

export interface IFwPatternAttribute {
  x: number
  y: number
  // 0-200 百分比 花型图和mask图的比例
  size: number
  // -180-180 旋转角度
  rotate: number
  // 循环方式
  cycleMode: 0 | 1
}

export type IFwPatternInfo = ICanUsePattern & IFwPatternAttribute

export interface IFwMaskItem {
  maskId: string
  maskURL: string
  maskAreaWidth: number
  maskAreaHeight: number
  maskAreaOriginX: number
  maskAreaOriginY: number
  patternInfo?: IFwPatternInfo
}

export interface IFashionCanvasBasePattern {
  // patternId: string | number
  patternCode?: string // 花型号
  url: string // 花型图原图
  thumbUrl?: string // 花型图缩略图
}

export interface IFashionCanvasPeiYi extends IFashionCanvasBasePeiYi {
  id: string
  width: number
  height: number
  resultUrl?: string
  lastResultUrl?: string
  /** 满幅套花区 */
  maskList: IFwMaskItem[]
}

export interface ISDK2ConstructorParams {
  canvasWidth: number
  canvasHeight: number
  container: HTMLDivElement | null
  originImage: HTMLImageElement
  resultImage: HTMLImageElement | null
  maskPatternList: IMaskPattern[]
}

export interface IMaskPattern {
  maskId: string
  maskImage: HTMLImageElement | null
  maskAreaWidth: number
  maskAreaHeight: number
  patternImage: HTMLImageElement | null
  patternX: number
  patternY: number
  patternScale: number
  rotate: number
  cycleMode: 0 | 1
}

export interface IMaskHighlight {
  maskId: string
  maskImage: HTMLImageElement | null
  maskAreaWidth: number
  maskAreaHeight: number
}

export interface IEditMaskList {
  templateId: string | number
  originURL: string
  originThumbURL: string
  tag?: string
  //   maskList: IPostTemplateMaskInfo['images']
}

export interface ICreateSingleTaskParams {
  patternURL: string
  patternImage: HTMLImageElement
  width: number
  height: number
  maskAreaOriginX: number
  maskAreaOriginY: number
  maskAreaHeight: number
  maskAreaWidth: number
  maskURL: string
  originURL: string
  id: string
  rotate: number
  size: number
  patternX: number
  patternY: number
  cycleMode: 0 | 1
}

export interface ICreateFWtaskData {
  /** 花型y轴相对位置 */
  parent_pos_y?: string
  /** 蒙版图链接 */
  mask_image_url?: string
  /** 模版图的高 */
  template_height?: number
  /** 花型图链接 */
  parent_image_url?: string
  /** 模版图的宽 */
  template_width?: number
  /** 花型x轴相对位置 */
  parent_pos_x?: string
  /** 用户定制ID */
  pod_personal_id?: string
  /** 花型相对高度 */
  parent_height?: string
  /** 模版图链接 */
  template_image_url?: string
  /** 前端模版图KEY */
  front_template_key?: string
  /** 旋转角度；逆时针方向，单位是度。如90代表逆时针方向旋转90度。 */
  parent_rotate_angle?: string
  /** 循环方式 0 全循环 1 不循环 */
  cycle_mode?: 0 | 1
}

export interface EditData {}
