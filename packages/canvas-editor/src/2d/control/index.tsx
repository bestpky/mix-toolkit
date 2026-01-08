import { FC, useEffect, useState } from 'react'
import update from 'immutability-helper'
import classNames from 'classnames'

import { CanUseGridPatterns } from '../can-use-grid-patterns'
import { ICanUsePattern, ICanvasData } from '../types'
import { SliderItem } from '../slider-item'
import { useSdk } from '../sdk-context'

interface IControlProps {
  canvasData?: ICanvasData
  canUsePatterns?: ICanUsePattern[]
  onCanvasUpdate?: (data: ICanvasData) => void
  onCanUsePatternsChange?: (patterns: ICanUsePattern[]) => void
}

export const Control: FC<IControlProps> = ({
  canvasData,
  canUsePatterns = [],
  onCanvasUpdate,
  onCanUsePatternsChange
}) => {
  const sdk = useSdk()
  const [tabIndex, setTabIndex] = useState(0)
  const [eraserType, setEraserType] = useState<'eraser' | 'repair' | 'circling'>()
  const [eraserSize, setEraserSize] = useState(10)

  const patterns = canvasData?.patternList || []

  // 导出图片
  const handleExport = () => {
    if (!sdk) return
    const mergedCanvas = sdk.mergeImageData()
    if (!mergedCanvas) return

    // 转换为 blob 并下载
    mergedCanvas.toBlob(blob => {
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `canvas-export-${Date.now()}.png`
      a.click()
      URL.revokeObjectURL(url)
    }, 'image/png')
  }

  // 删除图案
  const handleDeletePattern = (patternId: string) => {
    if (!canvasData || !onCanvasUpdate || !sdk) return
    const index = sdk.patternList.findIndex(v => v.patternId === patternId)
    const verticesIndex = sdk.presetVertices.findIndex(v => v.relativePatternId === patternId)

    if (index !== undefined && index !== -1 && verticesIndex !== undefined && verticesIndex !== -1) {
      sdk.patternList.splice(index, 1)
      sdk.cleanPresetRelativePatternId(patternId)
      sdk.reDraw()

      const newCanvasData = update(canvasData, {
        patternList: { $splice: [[index, 1]] },
        vertices: {
          [verticesIndex]: {
            relativePatternId: { $set: undefined }
          }
        }
      })
      onCanvasUpdate(newCanvasData)
    }
  }

  // 切换橡皮擦类型
  const handleChangeEraserType = (type: 'eraser' | 'repair' | 'circling') => {
    if (type === eraserType) {
      setEraserType(undefined)
    } else {
      sdk?.setEraserSize(eraserSize)
      setEraserType(type)
    }
  }

  useEffect(() => {
    sdk?.setEraserType(eraserType)
  }, [eraserType, sdk])

  useEffect(() => {
    sdk?.setEraserSize(eraserSize)
  }, [eraserSize, sdk])

  return (
    <div className="bg-white w-[320px] border-l border-gray-200 flex flex-col overflow-hidden">
      {/* 标签页切换 */}
      <div className="flex border-b border-gray-200">
        {[
          { key: 0, text: '图案图层' },
          { key: 1, text: '可用图案' }
        ].map(({ key, text }) => (
          <button
            key={key}
            className={classNames(
              'flex-1 px-4 py-3 text-sm font-medium transition-colors',
              key === tabIndex
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            )}
            onClick={() => setTabIndex(key)}
          >
            {text}
          </button>
        ))}
      </div>

      {/* 图案图层面板 */}
      {tabIndex === 0 && (
        <div className="flex-1 overflow-y-auto">
          {patterns.length === 0 ? (
            <div className="flex flex-col items-center justify-center mt-20 text-gray-400">
              <div className="text-base">暂无图案</div>
              <div className="text-sm mt-2">从可用图案中添加图案</div>
            </div>
          ) : (
            <div className="p-4 space-y-2">
              {patterns.map(({ patternId, url, useMultiply }) => (
                <div
                  key={patternId}
                  className="group flex items-center gap-3 p-3 rounded hover:bg-gray-50 transition-colors"
                >
                  <img className="w-16 h-16 object-cover rounded bg-gray-100" src={url} alt="" />
                  <div className="flex-1 flex flex-col gap-2">
                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={useMultiply || false}
                        onChange={e => {
                          const checked = e.target.checked
                          sdk?.setPatternMultiply(patternId, checked)
                          if (canvasData && onCanvasUpdate) {
                            const index = canvasData.patternList.findIndex(p => p.patternId === patternId)
                            if (index !== -1) {
                              const newCanvasData = update(canvasData, {
                                patternList: {
                                  [index]: {
                                    useMultiply: { $set: checked }
                                  }
                                }
                              })
                              onCanvasUpdate(newCanvasData)
                            }
                          }
                        }}
                        className="w-4 h-4"
                      />
                      <span>混合模式</span>
                    </label>
                  </div>
                  <button
                    className="px-3 py-1 text-sm text-red-600 opacity-0 group-hover:opacity-100 hover:bg-red-50 rounded transition-opacity"
                    onClick={e => {
                      e.stopPropagation()
                      handleDeletePattern(patternId)
                    }}
                  >
                    删除
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* 橡皮擦工具 */}
          {patterns.length > 0 && (
            <div className="border-t border-gray-200 p-4 space-y-4">
              <div className="text-base font-medium">图案橡皮擦</div>

              <div className="flex gap-2">
                <button
                  className={classNames(
                    'flex-1 py-2 text-sm rounded transition-colors',
                    eraserType === 'eraser'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  )}
                  onClick={() => handleChangeEraserType('eraser')}
                >
                  去除
                </button>
                <button
                  className={classNames(
                    'flex-1 py-2 text-sm rounded transition-colors',
                    eraserType === 'repair'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  )}
                  onClick={() => handleChangeEraserType('repair')}
                >
                  恢复
                </button>
                <button
                  className={classNames(
                    'flex-1 py-2 text-sm rounded transition-colors',
                    eraserType === 'circling'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  )}
                  onClick={() => handleChangeEraserType('circling')}
                >
                  圈选
                </button>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <span className="text-gray-600">画笔尺寸</span>
                <div className="flex-1">
                  <SliderItem
                    name="画笔大小"
                    value={eraserSize}
                    digits={0}
                    min={1}
                    max={40}
                    onChange={setEraserSize}
                  />
                </div>
                <div
                  className="rounded-full bg-red-500 opacity-70"
                  style={{ width: eraserSize, height: eraserSize }}
                />
              </div>

              {/* 导出按钮 */}
              <div className="pt-4 mt-4 border-t border-gray-200">
                <button
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  onClick={handleExport}
                >
                  导出图片
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 可用图案面板 */}
      {tabIndex === 1 && (
        <div className="flex-1 overflow-y-auto">
          <CanUseGridPatterns
            text="拖拽图案到预设区域"
            canUsePatterns={canUsePatterns}
            onCanUsePatternsChange={onCanUsePatternsChange}
          />
        </div>
      )}
    </div>
  )
}
