import { FC, useState } from 'react'
import { Stage } from './stage'
import { Control } from './control'
import { SdkContext } from './sdk-context'
import { Sdk } from './stage/sdk'
import { ICanvasData, ICanUsePattern } from './types'

export interface CanvasEditorProps {
  /** 画布数据 */
  canvasData: ICanvasData
  /** 画布数据变化回调 */
  onCanvasUpdate: (data: ICanvasData) => void
  /** 可用图案列表 */
  canUsePatterns?: ICanUsePattern[]
  /** 可用图案变化回调 */
  onCanUsePatternsChange?: (patterns: ICanUsePattern[]) => void
}

export const CanvasEditor: FC<CanvasEditorProps> = ({
  canvasData,
  onCanvasUpdate,
  canUsePatterns = [],
  onCanUsePatternsChange
}) => {
  const [sdk, setSdk] = useState<Sdk | null>(null)

  return (
    <SdkContext.Provider value={{ sdk }}>
      <div className="flex h-full">
        {/* 左侧Canvas区域 */}
        <Stage canvasData={canvasData} onCanvasUpdate={onCanvasUpdate} onSdkChange={setSdk} />

        {/* 右侧控制面板 */}
        <Control
          canvasData={canvasData}
          canUsePatterns={canUsePatterns}
          onCanvasUpdate={onCanvasUpdate}
          onCanUsePatternsChange={onCanUsePatternsChange}
        />
      </div>
    </SdkContext.Provider>
  )
}
