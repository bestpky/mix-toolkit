import { FC, useState } from 'react'
import classNames from 'classnames'
import update from 'immutability-helper'
import { IFashionCanvasPeiYi, IFwPatternAttribute } from '../types'
import { SliderItem } from '../../2d/slider-item'
import { useFullWidthContext } from '../context'
import { ICanUsePattern } from 'src/2d'

interface IControlProps {
  currentPeiYi?: IFashionCanvasPeiYi
  canUsePatterns?: ICanUsePattern[]
  onPeiYiDataChange?: (data: IFashionCanvasPeiYi) => void
  onCanUsePatternsChange?: (patterns: ICanUsePattern[]) => void
  currentEditMaskId?: string
  onCurrentEditMaskIdChange?: (maskId: string | undefined) => void
  wipPatternAttr?: Record<string, IFwPatternAttribute>
  onWipPatternAttrChange?: (attr: Record<string, IFwPatternAttribute>) => void
}

export const Control: FC<IControlProps> = ({
  currentPeiYi,
  canUsePatterns = [],
  onPeiYiDataChange,
  onCanUsePatternsChange,
  currentEditMaskId,
  wipPatternAttr = {},
  onWipPatternAttrChange,
  onCurrentEditMaskIdChange
}) => {
  const [tabIndex, setTabIndex] = useState(0)
  const { fwSdk2 } = useFullWidthContext()

  const maskList = currentPeiYi?.maskList || []
  const hasMasks = maskList.length > 0
  const hasPatterns = maskList.some(mask => mask.patternInfo)
  const currentWipAttr = currentEditMaskId ? wipPatternAttr[currentEditMaskId] : undefined

  // 生成效果图
  const handleGenerate = async () => {
    console.log('🖱️ 点击生成按钮')
    console.log('🔍 检查 SDK 实例:', fwSdk2)
    console.log('🔍 检查生成方法:', fwSdk2?.generateEffectAndCreateTask)

    if (fwSdk2?.generateEffectAndCreateTask) {
      console.log('✅ 开始调用生成方法')
      try {
        await fwSdk2.generateEffectAndCreateTask()
        console.log('✅ 生成方法调用完成')
      } catch (error) {
        console.error('❌ 生成方法调用失败:', error)
      }
    } else {
      console.error('❌ SDK 或生成方法不存在')
    }
  }

  // 图案大小调整
  const handleSizeChange = (value: number) => {
    if (!currentEditMaskId || !onWipPatternAttrChange) return
    const newWipPatternAttr = update(wipPatternAttr, {
      [currentEditMaskId]: {
        size: { $set: value }
      }
    })
    onWipPatternAttrChange(newWipPatternAttr)

    // 调用 SDK 更新显示
    const currentSdkMask = fwSdk2?.maskPatternList.find((v: any) => v.maskId === currentEditMaskId)
    const currentMask = maskList.find(m => m.maskId === currentEditMaskId)
    if (currentSdkMask && currentMask) {
      const patternHeight = currentSdkMask.patternImage?.height || 1
      const maskHeight = currentMask.maskAreaHeight
      const patternScale = (value / 100) * (maskHeight / patternHeight)
      fwSdk2?.setPatternScale(patternScale)
    }
  }

  // 旋转角度调整
  const handleRotateChange = (value: number) => {
    if (!currentEditMaskId || !onWipPatternAttrChange) return
    const newWipPatternAttr = update(wipPatternAttr, {
      [currentEditMaskId]: {
        rotate: { $set: value }
      }
    })
    onWipPatternAttrChange(newWipPatternAttr)
    fwSdk2?.setPatternRotate(value)
  }

  // 删除图案
  const handleDeletePattern = (mask: (typeof maskList)[0]) => {
    if (!currentPeiYi || !onPeiYiDataChange) return

    const maskIndex = currentPeiYi.maskList.findIndex(m => m.maskId === mask.maskId)
    if (maskIndex === -1) return

    // 更新数据：移除 patternInfo
    const newPeiYi = update(currentPeiYi, {
      maskList: {
        [maskIndex]: {
          $unset: ['patternInfo']
        }
      }
    })
    onPeiYiDataChange(newPeiYi)

    // 清空编辑状态
    if (currentEditMaskId === mask.maskId) {
      // Clear current edit
      fwSdk2?.setCurrentEditMaskId(undefined)
    }

    // 清空 wipPatternAttr
    if (onWipPatternAttrChange) {
      const newWipPatternAttr = { ...wipPatternAttr }
      delete newWipPatternAttr[mask.maskId]
      onWipPatternAttrChange(newWipPatternAttr)
    }

    // 移除画布上的图案
    const oldCanvas = document.querySelector(`[data-mask-id="${mask.maskId}"]`) as HTMLCanvasElement
    if (oldCanvas) {
      oldCanvas.remove()
    }

    // 从 SDK 的 maskPatternList 中移除
    if (fwSdk2?.maskPatternList) {
      const maskPatternIndex = fwSdk2.maskPatternList.findIndex((v: any) => v.maskId === mask.maskId)
      if (maskPatternIndex !== -1) {
        fwSdk2.maskPatternList.splice(maskPatternIndex, 1)
      }
    }
  }

  return (
    <div className="bg-white w-[320px] border-l border-gray-200 flex flex-col overflow-hidden">
      {/* 标签页切换 */}
      <div className="flex border-b border-gray-200">
        {[
          { key: 0, text: '套花区' },
          { key: 1, text: '可用图案' }
        ].map(({ key, text }) => (
          <button
            key={key}
            className={classNames(
              'flex-1 px-4 py-3 text-sm font-medium transition-colors',
              key === tabIndex ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-900'
            )}
            onClick={() => setTabIndex(key)}
          >
            {text}
          </button>
        ))}
      </div>

      {/* 套花区面板 */}
      {tabIndex === 0 && (
        <div className="flex-1 overflow-y-auto">
          {/* 胚衣信息 */}
          <div className="p-4 border-b border-gray-200">
            <div className="text-sm font-semibold text-gray-700 mb-2">胚衣信息</div>
            <div className="text-xs text-gray-600 space-y-1">
              <div>ID: {currentPeiYi?.templateId || '-'}</div>
              <div>
                尺寸: {currentPeiYi?.width || 0} × {currentPeiYi?.height || 0}
              </div>
              <div>套花区数量: {maskList.length}</div>
            </div>
          </div>

          {/* 套花区列表 */}
          {!hasMasks ? (
            <div className="flex flex-col items-center justify-center mt-20 text-gray-400">
              <div className="text-base">暂无套花区</div>
              <div className="text-sm mt-2">请选择包含套花区的胚衣</div>
            </div>
          ) : (
            <div className="p-4">
              <div className="text-sm font-semibold text-gray-700 mb-3">套花区列表</div>
              <div className="space-y-2">
                {maskList.map((mask, index) => (
                  <div key={mask.maskId}>
                    {/* 套花区 */}
                    <div className="group flex items-start gap-3 p-3 rounded hover:bg-gray-50 transition-colors">
                      {/* 缩略图 */}
                      <div className="w-12 h-12 bg-gray-200 rounded flex-shrink-0 overflow-hidden">
                        {mask.maskURL && <img src={mask.maskURL} alt="" className="w-full h-full object-cover" />}
                      </div>

                      {/* 信息 */}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900">套花区 {index + 1}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {mask.maskAreaWidth} × {mask.maskAreaHeight}
                        </div>
                        {!mask.patternInfo && <div className="text-xs text-gray-400 mt-1">未添加图案</div>}
                      </div>
                    </div>

                    {/* 已应用的图案 */}
                    {mask.patternInfo && (
                      <div
                        className={classNames(
                          'flex items-center justify-between px-3 py-2 ml-8 rounded cursor-pointer transition-colors',
                          currentEditMaskId === mask.maskId
                            ? 'bg-blue-50 border border-blue-200'
                            : 'bg-gray-50 hover:bg-gray-100'
                        )}
                        onClick={() => {
                          fwSdk2?.setCurrentEditMaskId(mask.maskId)
                          onCurrentEditMaskIdChange?.(mask.maskId)
                        }}
                      >
                        <div className="flex items-center gap-2">
                          {/* 连接线 */}
                          <svg width="16" height="20" viewBox="0 0 16 20" className="flex-shrink-0">
                            <path d="M 0,0 L 0,10 L 16,10" stroke="#D1D5DB" strokeWidth="1" fill="none" />
                          </svg>

                          {/* 图案缩略图 */}
                          <div className="w-12 h-12 bg-white border border-gray-200 rounded overflow-hidden flex-shrink-0">
                            <img
                              src={mask.patternInfo.url}
                              alt=""
                              className="w-full h-full object-cover"
                              draggable={false}
                            />
                          </div>

                          <span className="text-xs text-gray-600">已应用图案</span>
                        </div>

                        {/* 删除按钮 */}
                        <button
                          className="text-gray-400 hover:text-red-500 transition-colors"
                          onClick={e => {
                            e.stopPropagation()
                            handleDeletePattern(mask)
                          }}
                        >
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 图案设置 */}
          {currentEditMaskId && currentWipAttr && (
            <div className="border-t border-gray-200 p-4">
              <div className="text-sm font-semibold text-gray-700 mb-3">图案设置</div>

              {/* 图案大小 */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-600">图案大小</span>
                  <span className="text-xs text-gray-900 font-medium">{currentWipAttr.size || 100}</span>
                </div>
                <SliderItem
                  name="图案大小"
                  value={currentWipAttr.size || 100}
                  digits={0}
                  min={1}
                  max={200}
                  onChange={handleSizeChange}
                />
              </div>

              {/* 旋转角度 */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-600">旋转角度</span>
                  <span className="text-xs text-gray-900 font-medium">{currentWipAttr.rotate || 0}°</span>
                </div>
                <SliderItem
                  name="旋转角度"
                  value={currentWipAttr.rotate || 0}
                  digits={0}
                  min={-180}
                  max={180}
                  onChange={handleRotateChange}
                />
              </div>
            </div>
          )}

          {/* 生成按钮 */}
          {hasMasks && (
            <div className="border-t border-gray-200 p-4">
              <button
                onClick={handleGenerate}
                disabled={!hasPatterns}
                className={classNames(
                  'w-full py-2.5 px-4 rounded text-sm font-medium transition-colors',
                  hasPatterns
                    ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                )}
              >
                {hasPatterns ? '生成效果图' : '请先添加图案'}
              </button>
              {currentPeiYi?.resultUrl && <div className="text-xs text-green-600 text-center mt-2">✓ 已生成效果图</div>}
            </div>
          )}
        </div>
      )}

      {/* 可用图案面板 */}
      {tabIndex === 1 && (
        <div className="flex-1 overflow-y-auto p-4">
          <div className="text-sm text-gray-600 mb-3">拖拽图案到套花区</div>
          {canUsePatterns.length === 0 ? (
            <div className="flex flex-col items-center justify-center mt-20 text-gray-400">
              <div className="text-base">暂无可用图案</div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {canUsePatterns.map(pattern => (
                <div
                  key={pattern.id}
                  className="aspect-square bg-gray-100 rounded border border-gray-200 overflow-hidden cursor-move hover:border-blue-400 transition-colors"
                  draggable
                  onDragStart={e => {
                    e.dataTransfer.setData('text/plain', JSON.stringify(pattern))
                  }}
                >
                  <img src={pattern.url} alt={pattern.id} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
