import { FC, useCallback, useEffect, useRef, useState } from 'react'
import { v4 as uuid } from 'uuid'
import update from 'immutability-helper'

import { loadImage } from '@pky/utils'
import { ICanUsePattern, ICanvasData } from '../types'
import { Sdk } from './sdk'
import { IPatternSdk } from './sdk.type'
import { getCenterPointByVertices } from '../utils'
interface IStageProps {
  canvasData: ICanvasData
  onCanvasUpdate?: (data: ICanvasData) => void
  onSdkChange?: (sdk: Sdk | null) => void
}

export const Stage: FC<IStageProps> = ({ canvasData, onCanvasUpdate, onSdkChange }) => {
  const canvasNode = useRef<HTMLCanvasElement>(null)
  const [loading, setLoading] = useState(false)
  const sdkRef = useRef<Sdk | null>(null)
  const initializedRef = useRef(false)

  const canvasWidth = canvasData?.width || 0
  const canvasHeight = canvasData?.height || 0

  // 初始化 SDK（仅执行一次）
  const init = useCallback(
    async (data: ICanvasData) => {
      if (!canvasNode.current) {
        console.warn('Canvas ref not ready')
        return
      }

      if (!data.width || !data.height) {
        console.warn('Canvas dimensions not set')
        return
      }

      setLoading(true)

      try {
        // 加载背景图
        const originImage = await loadImage(data.originUrl, { crossOrigin: 'anonymous' })

        // 加载所有图案
        const promises = data.patternList.map<Promise<IPatternSdk>>(
          async ({ url, patternId, vertices, useMultiply }) => {
            const patternImage = await loadImage(url, { crossOrigin: 'anonymous' })
            const centerPoint = getCenterPointByVertices(vertices)
            return {
              patternId,
              patternImage,
              vertices,
              centerPoint,
              useMultiply
            }
          }
        )
        const patternList = await Promise.all(promises)

        // 创建SDK实例
        const sdk = new Sdk({
          canvas: canvasNode.current,
          originImage,
          patternList,
          presetVertices: data.vertices
        })
        sdk.reDraw()

        // 保存SDK实例到ref
        sdkRef.current = sdk
        // 通过回调传递SDK实例
        onSdkChange?.(sdk)
        initializedRef.current = true
      } catch (error) {
        console.error('Failed to initialize canvas editor:', error)
        sdkRef.current = null
        onSdkChange?.(null)
      } finally {
        setLoading(false)
      }
    },
    [onSdkChange]
  )

  // 只在首次挂载时初始化
  useEffect(() => {
    if (!initializedRef.current) {
      init(canvasData)
    }
  }, [init, canvasData])

  // 拖拽时高亮预设区域
  const dragOverPos = useRef({ x: 0, y: 0 })
  const handleDragOver: React.DragEventHandler<HTMLDivElement> = e => {
    e.preventDefault()
    if (e.clientX === dragOverPos.current.x && e.clientY === dragOverPos.current.y) {
      return
    }
    dragOverPos.current = { x: e.clientX, y: e.clientY }
    highlightPresetArea(e)
  }

  const highlightPresetArea = (e: React.DragEvent) => {
    if (!sdkRef.current) return
    const res = sdkRef.current.isPointInPresetArea(e)
    if (res) {
      sdkRef.current.highlightVerticeId = res.id
    } else {
      sdkRef.current.highlightVerticeId = ''
    }
    sdkRef.current.reDraw()
  }

  // 拖放图案到画布
  const handleDropPattern: React.DragEventHandler<HTMLDivElement> = async e => {
    e.preventDefault()
    if (!canvasData || !sdkRef.current || !onCanvasUpdate) return

    const dataStr = e.dataTransfer.getData('text/plain')
    const canUsePattern = JSON.parse(dataStr) as ICanUsePattern
    if (!canUsePattern) return

    const res = sdkRef.current.isPointInPresetArea(e)
    if (!res) return

    const patternId = uuid()
    const { id, sixteenPoints } = res
    const index = sdkRef.current.presetVertices.findIndex(v => v.id === id)

    // 加载图案图片
    const patternImage = await loadImage(canUsePattern.url, { crossOrigin: 'anonymous' })
    const centerPoint = getCenterPointByVertices(sixteenPoints)

    // 添加到SDK
    const newPattern = {
      patternId,
      patternImage,
      vertices: sixteenPoints,
      centerPoint,
      useMultiply: false // 默认不使用混合模式
    }
    sdkRef.current.addPattern(newPattern)
    sdkRef.current.setPresetRelativePatternId(index, patternId)
    sdkRef.current.highlightVerticeId = ''
    sdkRef.current.reDraw()

    // 更新数据
    const newCanvasData = update(canvasData, {
      patternList: {
        $push: [
          {
            patternId,
            url: canUsePattern.url,
            vertices: sixteenPoints,
            useMultiply: false // 默认不使用混合模式
          }
        ]
      },
      vertices: {
        [index]: {
          relativePatternId: {
            $set: patternId
          }
        }
      }
    })
    onCanvasUpdate(newCanvasData)
  }

  return (
    <div className="flex-1 flex items-center justify-center bg-gray-50 overflow-auto relative">
      <div
        id="eraser-canvas-wrapper"
        style={{
          position: 'relative',
          width: canvasWidth,
          height: canvasHeight,
          backgroundColor: 'transparent'
        }}
        onDragOver={handleDragOver}
        onDrop={handleDropPattern}
      >
        <canvas
          id="canvas-patterns"
          ref={canvasNode}
          width={canvasWidth}
          height={canvasHeight}
          style={{ position: 'absolute', top: 0, left: 0, zIndex: 1 }}
        />
      </div>

      {/* 加载遮罩层 */}
      {loading && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg px-8 py-6 shadow-xl flex flex-col items-center gap-3">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <div className="text-gray-700 font-medium">加载中...</div>
          </div>
        </div>
      )}
    </div>
  )
}
