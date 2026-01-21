import { FC, useMemo, useState } from 'react'
import { FullWidthStage } from './stage'
import { Control } from './control'
import { IFashionCanvasPeiYi, IFwPatternAttribute } from './types'
import { FullWidthContext } from './context'
import { ICanUsePattern } from 'src/2d'

export interface FullWidthCanvasEditorProps {
  /** 胚衣数据 */
  currentPeiYi: IFashionCanvasPeiYi
  /** 胚衣数据变化回调 */
  onPeiYiDataChange: (data: IFashionCanvasPeiYi) => void
  /** 可用图案列表 */
  canUsePatterns?: ICanUsePattern[]
  /** 可用图案变化回调 */
  onCanUsePatternsChange?: (patterns: ICanUsePattern[]) => void
}

export const FullWidthCanvasEditor: FC<FullWidthCanvasEditorProps> = ({
  currentPeiYi,
  onPeiYiDataChange,
  canUsePatterns = [],
  onCanUsePatternsChange
}) => {
  const [currentEditMaskId, setCurrentEditMaskId] = useState<string | undefined>('')
  const [wipPatternAttr, setWipPatternAttr] = useState<Record<string, IFwPatternAttribute>>({})
  const [fwSdk2, setFwSdk2] = useState<any>(null)

  const contextValue = useMemo(() => {
    console.log('📦 Context 更新:', { fwSdk2, hasGenerateMethod: !!fwSdk2?.generateEffectAndCreateTask })
    return { fwSdk2 }
  }, [fwSdk2])

  return (
    <FullWidthContext.Provider value={contextValue}>
      <div className="flex h-full">
        {/* 左侧：画布区域 */}
        <div className="flex-1 bg-gray-50 overflow-hidden">
          <FullWidthStage
            currentPeiYi={currentPeiYi}
            onPeiYiDataChange={onPeiYiDataChange}
            currentEditMaskId={currentEditMaskId}
            onCurrentEditMaskIdChange={setCurrentEditMaskId}
            onRightPanelPatternTabIndexChange={() => {}}
            wipPatternAttr={wipPatternAttr}
            onWipPatternAttrChange={setWipPatternAttr}
            onSdkReady={setFwSdk2}
          />
        </div>

        {/* 右侧：控制面板 */}
        <Control
          currentPeiYi={currentPeiYi}
          canUsePatterns={canUsePatterns}
          onPeiYiDataChange={onPeiYiDataChange}
          onCanUsePatternsChange={onCanUsePatternsChange}
          currentEditMaskId={currentEditMaskId}
          onCurrentEditMaskIdChange={setCurrentEditMaskId}
          wipPatternAttr={wipPatternAttr}
          onWipPatternAttrChange={setWipPatternAttr}
        />
      </div>
    </FullWidthContext.Provider>
  )
}
