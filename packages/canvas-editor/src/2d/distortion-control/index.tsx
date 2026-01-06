import update from 'immutability-helper'
import { CSSProperties, FC, useEffect } from 'react'

import classNames from 'classnames'
import Slider, { SliderProps } from 'rc-slider'
import { CanUseGridPatterns } from '../can-use-grid-patterns'
import { ICanUsePattern, IDistortionPattern, IFashionCanvasPeiYi } from '../types'
import { SliderItem } from '../slider-item'

const sliderStyles: Record<keyof Pick<SliderProps, 'style' | 'trackStyle' | 'handleStyle'>, CSSProperties> = {
  style: { width: 130 },
  trackStyle: {
    backgroundColor: 'var(--primary-color)'
  },
  handleStyle: {
    borderWidth: 1,
    borderColor: '#000',
    boxShadow: 'none'
  }
}

interface IDistortionControlProps {
  currentPeiYi?: IFashionCanvasPeiYi
  currentPresetPatternId?: string
  rightPanelPatternTabIndex?: number
  eraserType?: 'eraser' | 'repair' | 'circling'
  eraserSize?: number
  canUsePatterns?: ICanUsePattern[]
  onPeiYiUpdate?: (peiYi: IFashionCanvasPeiYi) => void
  onCurrentPresetPatternIdChange?: (patternId: string) => void
  onRightPanelPatternTabIndexChange?: (index: number) => void
  onEraserTypeChange?: (type: 'eraser' | 'repair' | 'circling' | undefined) => void
  onEraserSizeChange?: (size: number) => void
  onCanUsePatternsChange?: (patterns: ICanUsePattern[]) => void
}

export const DistortionControl: FC<IDistortionControlProps> = ({
  currentPeiYi,
  currentPresetPatternId,
  rightPanelPatternTabIndex = 0,
  eraserType,
  eraserSize = 10,
  canUsePatterns = [],
  onPeiYiUpdate,
  onCurrentPresetPatternIdChange,
  onRightPanelPatternTabIndexChange,
  onEraserTypeChange,
  onEraserSizeChange,
  onCanUsePatternsChange
}) => {
  const patterns = currentPeiYi?.distortionList || []
  const currentPattern = patterns.find(v => v.patternId === currentPresetPatternId)

  const onChangePattern = (data: Partial<IDistortionPattern>) => {
    if (!currentPattern || !currentPeiYi || !onPeiYiUpdate) return
    const index = patterns.findIndex(v => v.patternId === currentPattern.patternId)
    if (index === -1) return
    const newPattern = update(currentPattern, {
      $merge: data
    })
    const newPeiYi = update(currentPeiYi, {
      distortionList: {
        [index]: {
          $set: newPattern
        }
      }
    })
    onPeiYiUpdate(newPeiYi)
    window.distortionSdk?.updateCurrentEditPattern({ ...data, patternId: currentPattern.patternId })
  }

  const handleChangeEraserType = (type: 'eraser' | 'repair' | 'circling') => {
    if (!onEraserTypeChange) return
    if (type === eraserType) {
      onEraserTypeChange(undefined)
      return
    }
    window.distortionSdk?.setEraserSize(eraserSize)
    onEraserTypeChange(type)
  }

  useEffect(() => {
    window.distortionSdk?.setEraserType(eraserType)
  }, [eraserType])

  useEffect(() => {
    window.distortionSdk?.setEraserSize(eraserSize)
  }, [eraserSize])

  return (
    <div className="bg-white w-[304px] border-l border-[#e8ebf0] relative overflow-y-auto">
      <div className="text-base flex gap-2">
        {[
          { key: 0, text: '图案图层' },
          { key: 1, text: '可用图案' }
        ].map(({ key, text }) => (
          <span
            className={classNames('px-4 py-2 cursor-pointer', key === rightPanelPatternTabIndex && 'font-medium border-b-2 border-[var(--primary-color,#193AFF)]')}
            key={key}
            onClick={() => onRightPanelPatternTabIndexChange?.(key)}
          >
            {text}
          </span>
        ))}
      </div>
      {rightPanelPatternTabIndex === 0 && (
        <>
          {patterns.length === 0 && (
            <div className="flex flex-col items-center justify-center mt-[50px]">
              <div>暂无图案</div>
              <span className="text-[#6F7073] mt-1">从可用图案中添加图案</span>
            </div>
          )}
          <div className="overflow-y-auto">
            {patterns.map(({ patternId, url }) => (
              <div
                key={patternId}
                className={classNames('cursor-pointer flex items-center justify-between px-4 py-2 text-[#999da8]', patternId === currentPresetPatternId && 'bg-[#f5f7fa]')}
                onClick={() => onCurrentPresetPatternIdChange?.(patternId)}
              >
                <div className="flex items-center">
                  <img className="w-[60px] h-[60px] bg-[#fafafa]" src={url} alt="" />
                  <span
                    className="cursor-pointer ml-2 hidden group-hover:block"
                    onClick={e => {
                      e.stopPropagation()
                      if (!currentPeiYi || !onPeiYiUpdate) return
                      const index = window.distortionSdk?.patternList.findIndex(v => v.patternId === patternId)
                      const verticesIndex = window.distortionSdk?.presetVertices.findIndex(
                        v => v.relativePatternId === patternId
                      )
                      if (index !== undefined && index !== -1 && verticesIndex !== undefined && verticesIndex !== -1) {
                        window.distortionSdk?.patternList.splice(index, 1)
                        window.distortionSdk?.cleanPresetRelativePatternId(patternId)
                        window.distortionSdk?.reDraw()
                        const newPeiYi = update(currentPeiYi, {
                          distortionList: {
                            $splice: [[index, 1]]
                          },
                          vertices: {
                            [verticesIndex]: {
                              relativePatternId: {
                                $set: undefined
                              }
                            }
                          }
                        })
                        onPeiYiUpdate(newPeiYi)
                      }
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      {rightPanelPatternTabIndex === 1 && (
        <CanUseGridPatterns
          text="拖拽图案到预设区域"
          canUsePatterns={canUsePatterns}
          onCanUsePatternsChange={onCanUsePatternsChange}
        />
      )}
      {currentPattern && rightPanelPatternTabIndex === 0 && (
        <>
          <div className="px-4"></div>
          <div className="px-4 pb-4 text-base font-medium">图案设置</div>
          <div className="px-4">
            <div className="flex items-center justify-between mb-4 text-[#6F7073]">
              <span>亮度</span>
              <div className="flex items-center justify-between">
                <span className="mr-4">{currentPattern.brightness}</span>
                <Slider
                  {...sliderStyles}
                  startPoint={50}
                  min={0}
                  max={100}
                  value={currentPattern.brightness}
                  onChange={v =>
                    onChangePattern({
                      brightness: +v
                    })
                  }
                />
              </div>
            </div>
            <div className="flex items-center justify-between mb-4 text-[#6F7073]">
              <span>对比度</span>
              <div className="flex items-center justify-between">
                <span className="mr-4">{currentPattern.contrast}</span>
                <Slider
                  {...sliderStyles}
                  startPoint={0}
                  min={-100}
                  max={100}
                  value={currentPattern.contrast}
                  onChange={v =>
                    onChangePattern({
                      contrast: +v
                    })
                  }
                />
              </div>
            </div>
            <div className="flex items-center justify-between mb-4 text-[#6F7073]">
              <span>饱和度</span>
              <div className="flex items-center justify-between">
                <span className="mr-4">{currentPattern.saturate}</span>
                <Slider
                  {...sliderStyles}
                  startPoint={50}
                  min={0}
                  max={100}
                  value={currentPattern.saturate}
                  onChange={v =>
                    onChangePattern({
                      saturate: +v
                    })
                  }
                />
              </div>
            </div>
          </div>
          {/* <div className="flex-column" style={{ margin: '0 16px', gap: 8 }}>
            <span style={{ alignSelf: 'flex-start' }}>
              <checkbox
                checked={!currentPattern.closeMixMode}
                style={{ color: '#6F7073' }}
                onChange={c => onChangePattern({ closeMixMode: !c })}
              >
                混合模式
              </checkbox>
            </span>
          </div> */}
        </>
      )}
      {rightPanelPatternTabIndex === 0 && patterns.length > 0 && (
        <>
          <div className="px-4"></div>
          <div>
            <div className="px-4 text-base font-medium">图案橡皮擦</div>
            <div className="flex pt-4 px-4">
              <div
                className={classNames('relative w-20 h-[45px] flex items-center justify-center text-[var(--primary-text-color,#333)] bg-white cursor-pointer mr-2 hover:bg-[#f4f5f8]', eraserType === 'eraser' && 'bg-[#f4f5f8]')}
                onClick={handleChangeEraserType.bind(null, 'eraser')}
              >
                去除
              </div>
              <div
                className={classNames('relative w-20 h-[45px] flex items-center justify-center text-[var(--primary-text-color,#333)] bg-white cursor-pointer mr-2 hover:bg-[#f4f5f8]', eraserType === 'repair' && 'bg-[#f4f5f8]')}
                onClick={handleChangeEraserType.bind(null, 'repair')}
              >
                恢复
              </div>
              <div
                className={classNames('relative w-20 h-[45px] flex items-center justify-center text-[var(--primary-text-color,#333)] bg-white cursor-pointer mr-2 hover:bg-[#f4f5f8]', eraserType === 'circling' && 'bg-[#f4f5f8]')}
                onClick={handleChangeEraserType.bind(null, 'circling')}
              >
                <span>圈选</span>
              </div>
            </div>
            <div className="flex items-center pt-4 px-4">
              <div className="text-[var(--primary-text-color,#333)] flex items-center">
                画笔尺寸
                <div className="w-[90px] ml-2 relative top-px [&>div:first-child]:hidden">
                  <SliderItem
                    name="画笔大小"
                    value={eraserSize}
                    digits={0}
                    min={1}
                    max={40}
                    onChange={onEraserSizeChange}
                  />
                </div>
              </div>
              <span className="ml-4 rounded-full bg-red-500 opacity-70" style={{ width: eraserSize, height: eraserSize }} />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
