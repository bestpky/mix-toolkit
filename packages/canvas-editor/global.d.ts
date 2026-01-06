import type { DistortionSdk } from './src/2d/distortion-stage/sdk'
import type { IFashionCanvasPeiYi } from './src/2d/types'

declare global {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  interface Window {
    fullWidthStage: {
      init: (peiYi: IFashionCanvasPeiYi) => void
    } | null
    distortionStage: {
      init: (peiYi: IFashionCanvasPeiYi) => void
    } | null
    distortionSdk: DistortionSdk | null
    distortionSdkMap: Record<string, DistortionSdk>
  }
}
