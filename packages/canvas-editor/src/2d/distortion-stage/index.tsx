import update from 'immutability-helper'
import { FC, useCallback, useEffect, useRef, useState } from 'react'
import { v4 as uuid } from 'uuid'

import { imageUrlToBlob, loadImage } from '@mix-toolkit/utils'
import { getCenterPointByVertices } from '../get-default-vertices'
import { getMaxSize2 } from '../utils'
import { ICanUsePattern, IFashionCanvasPeiYi } from '../types'
import { DistortionSdk } from './sdk'
import { IDisPatternSdk } from './sdk.type'

interface IDistortionStageProps {
  currentPeiYi?: IFashionCanvasPeiYi
  onPeiYiUpdate?: (peiYi: IFashionCanvasPeiYi) => void
  onRightPanelPatternTabIndexChange?: (index: number) => void
}

export const DistortionStage: FC<IDistortionStageProps> = ({
  currentPeiYi,
  onPeiYiUpdate,
  onRightPanelPatternTabIndexChange
}) => {
  const canvasNode = useRef<HTMLCanvasElement>(null)

  const [canvasLoading, setCanvasLoading] = useState(false)

  const canvasRatio = currentPeiYi?.canvasRatio || 1
  const canvasWidth = (currentPeiYi?.width || 0) * canvasRatio
  const canvasHeight = (currentPeiYi?.height || 0) * canvasRatio

  const init = useCallback(async (peiYi: IFashionCanvasPeiYi) => {
    if (!canvasNode.current) return
    setCanvasLoading(true)
    const originImage = await loadImage(peiYi.originUrl, { crossOrigin: 'anonymous' })
    const promises = peiYi.distortionList.map<Promise<IDisPatternSdk>>(
      async ({ url, patternId, vertices, saturate, brightness, contrast, closeMixMode }) => {
        const patternImage = await loadImage(url, { crossOrigin: 'anonymous' })
        const centerPoint = getCenterPointByVertices(vertices)
        return {
          patternId,
          patternImage,
          vertices,
          centerPoint,
          brightness,
          contrast,
          saturate,
          closeMixMode
        }
      }
    )
    const patternList = await Promise.all(promises)
    setCanvasLoading(false)
    const presetVertices = peiYi.vertices
    const sdk = new DistortionSdk({
      canvas: canvasNode.current,
      originImage,
      patternList,
      isFront: true,
      presetVertices
    })
    sdk.reDraw()
    window.distortionSdk = sdk
    window.distortionSdkMap = {}
    window.distortionSdkMap[peiYi.id] = sdk
  }, [])

  useEffect(() => {
    window.distortionStage = {
      init
    }
    return () => {
      window.distortionStage = null
    }
  }, [init])

  // dragOver事件节流
  const dragOverPos = useRef({ x: 0, y: 0 })
  const handleDragOver: React.DragEventHandler<HTMLDivElement> = e => {
    e.preventDefault()
    if (e.clientX === dragOverPos.current.x && e.clientY === dragOverPos.current.y) {
      return
    }
    dragOverPos.current = { x: e.clientX, y: e.clientY }
    highligntPresetArea(e)
  }

  // 高亮预设区域
  const highligntPresetArea = (e: React.DragEvent) => {
    if (!window.distortionSdk) return
    const res = window.distortionSdk.isPointInPresetArea(e)
    if (res) {
      const { id } = res
      window.distortionSdk.highlightVerticeId = id
      window.distortionSdk.reDraw()
    } else {
      window.distortionSdk.highlightVerticeId = ''
      window.distortionSdk.reDraw()
    }
  }

  const handleDropPatternIntoStage: React.DragEventHandler<HTMLDivElement> = async e => {
    e.preventDefault()
    if (!currentPeiYi || !window.distortionSdk || !onPeiYiUpdate) return
    const dataStr = e.dataTransfer.getData('text/plain')
    const canUsePattern = JSON.parse(dataStr) as ICanUsePattern
    if (!canUsePattern) return
    const patternId = uuid()
    const res = window.distortionSdk.isPointInPresetArea(e)
    if (res) {
      const { id, sixteenPoints } = res
      const index = window.distortionSdk.presetVertices.findIndex(v => v.id === id)
      window.distortionSdk.setPresetRelativePatternId(index, patternId)
      appendToPatternLayerList(patternId, canUsePattern, sixteenPoints, index)
    }
  }

  const appendToPatternLayerList = async (
    patternId: string,
    image: ICanUsePattern,
    sixteenPoints: number[],
    index: number
  ) => {
    // TODO
    // if (!currentPeiYi || !window.distortionSdk || !onPeiYiUpdate) return
    // const { url } = image
    // // 补图
    // const file = await imageUrlToBlob(url)
    // const { ratio } = getMaxSize2(sixteenPoints)
    // const aspectRatio = ratio || '1'
    // try {
    //   const { file_url } = await uploadPatternImage({
    //     file,
    //     aspectRatio
    //   })
    //   const patternImage = await loadImage(file_url, { crossOrigin: 'anonymous' })
    //   const vertices = sixteenPoints
    //   const centerPoint = getCenterPointByVertices(vertices)
    //   const commonParams = {
    //     patternId,
    //     vertices,
    //     brightness: 50,
    //     contrast: 0,
    //     saturate: 50,
    //     closeMixMode: true
    //   }
    //   onRightPanelPatternTabIndexChange?.(0)
    //   const newPeiYi = update(currentPeiYi, {
    //     distortionList: {
    //       $push: [{ url: file_url, ...commonParams }]
    //     },
    //     vertices: {
    //       [index]: {
    //         relativePatternId: {
    //           $set: patternId
    //         }
    //       }
    //     }
    //   })
    //   onPeiYiUpdate(newPeiYi)
    //   window.distortionSdk.addPattern({
    //     patternImage,
    //     centerPoint,
    //     ...commonParams
    //   })
    //   window.distortionSdk.highlightVerticeId = ''
    //   window.distortionSdk.reDraw()
    // } finally {
    // }
  }

  return (
    <div className="flex-auto flex flex-col justify-between items-center overflow-y-auto">
      <div className="h-9 w-full bg-white"></div>
      <div
        id="eraser-canvas-wrapper"
        style={{
          position: 'relative',
          alignSelf: 'center',
          width: canvasWidth,
          height: canvasHeight
        }}
        onDragOver={handleDragOver}
        onDrop={handleDropPatternIntoStage}
      >
        <canvas
          ref={canvasNode}
          width={canvasWidth}
          height={canvasHeight}
          style={{ position: 'absolute', top: 0, left: 0 }}
        />
      </div>
      <div className="h-[30px] w-full"></div>
    </div>
  )
}
