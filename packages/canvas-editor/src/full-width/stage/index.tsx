import { dataUrlToBlob, loadImage } from '@pky/utils'
import {
  ICreateFWtaskData,
  IMaskHighlight,
  IMaskPattern,
  ICreateSingleTaskParams,
  IFwMaskItem,
  IFwPatternAttribute,
  IFashionCanvasPeiYi
} from '../types'
import { FullWidthCanvasSDK2 } from '../sdk'
import {
  calcPatternPosInMask,
  calcPatternScaleBySize,
  createClipPathFromBinaryImageData,
  isPointInPath
} from '../utils'
import update from 'immutability-helper'
import { FC, useCallback, useEffect, useRef, useState } from 'react'
import { ICanUsePattern } from 'src/2d'

// 临时类型定义 - 这些需要从正确的位置导入
const throttle = (fn: Function, delay: number) => {
  let timeout: number | null = null
  return (...args: any[]) => {
    if (timeout) clearTimeout(timeout)
    timeout = window.setTimeout(() => fn(...args), delay)
  }
}

// 临时组件 - 这些需要从正确的位置导入
const LoadingIcon: FC<{ color?: string; style?: React.CSSProperties }> = () => <div>Loading...</div>

// 临时 API 函数 - 这些需要从正确的位置导入
const uploadChaoJiOss = async (_file: Blob): Promise<string> => ''
const getFWcreativeTaskV2 = async (_params: any): Promise<any> => ({ items: [] })
const imageOverSize = async (url: string): Promise<{ result: string | Blob }> => ({ result: url })
const uploadDxOssImages = async (_file: Blob): Promise<Array<{ image_url: string }>> => []
const Message = {
  warn: (msg: string) => console.warn(msg),
  error: (msg: string) => console.error(msg)
}

interface FullWidthStageProps {
  currentPeiYi: IFashionCanvasPeiYi
  onPeiYiDataChange: (data: IFashionCanvasPeiYi) => void
  currentEditMaskId?: string
  onCurrentEditMaskIdChange?: (maskId: string) => void
  onRightPanelPatternTabIndexChange?: (index: number) => void
  wipPatternAttr: Record<string, IFwPatternAttribute>
  onWipPatternAttrChange: (attr: Record<string, IFwPatternAttribute>) => void
  onSdkReady?: (sdk: FullWidthCanvasSDK2 | null) => void
}

export const FullWidthStage: FC<FullWidthStageProps> = ({
  currentPeiYi,
  onPeiYiDataChange,
  currentEditMaskId,
  onCurrentEditMaskIdChange,
  onRightPanelPatternTabIndexChange,
  wipPatternAttr,
  onWipPatternAttrChange,
  onSdkReady
}) => {
  const canvasParentNode = useRef<HTMLDivElement>(null)
  const fwSdk2Ref = useRef<FullWidthCanvasSDK2 | null>(null)

  const [canvasLoading, setCanvasLoading] = useState(false)

  const currentPeiYiRef = useRef<IFashionCanvasPeiYi>(currentPeiYi)
  useEffect(() => {
    currentPeiYiRef.current = currentPeiYi
  }, [currentPeiYi])

  const currentEditMaskIdRef = useRef<string | undefined>(currentEditMaskId)
  useEffect(() => {
    currentEditMaskIdRef.current = currentEditMaskId
  }, [currentEditMaskId])

  const wipPatternAttrRef = useRef(wipPatternAttr)
  useEffect(() => {
    wipPatternAttrRef.current = wipPatternAttr
  }, [wipPatternAttr])

  const resultURLmapRef = useRef<Record<string, string | undefined>>({})

  const canvasWidth = currentPeiYi.width
  const canvasHeight = currentPeiYi.height

  const init = useCallback(async (_peiYi: IFashionCanvasPeiYi) => {
    try {
      const canvasWidth = _peiYi.width
      const canvasHeight = _peiYi.height
      const peiYi = getMergePatternInfoPeiYi(_peiYi)
      setCanvasLoading(true)
      const originImage = await loadImage(peiYi.originUrl, { crossOrigin: 'anonymous' })
      let resultImage: HTMLImageElement | null = null
      if (peiYi.resultUrl) {
        resultImage = await loadImage(peiYi.resultUrl, { crossOrigin: 'anonymous' })
      }
      const maskList: IMaskPattern[] = []
      for (const mask of peiYi.maskList) {
        const { maskId, patternInfo, maskURL, maskAreaWidth, maskAreaHeight, maskAreaOriginX, maskAreaOriginY } = mask
        const maskImage = await loadImage(maskURL, { crossOrigin: 'anonymous' })
        if (patternInfo) {
          const patternImage = await loadImage(patternInfo.url, { crossOrigin: 'anonymous' })
          const patternScale = calcPatternScaleBySize({
            maskHeight: maskAreaHeight,
            patternSize: patternInfo.size,
            patternHeight: patternImage.height,
            canvasRatio: 1
          })
          let patternX = patternInfo.x || 0,
            patternY = patternInfo.y || 0
          if (!patternInfo.x || !patternInfo.y) {
            const maskCenterX = maskAreaOriginX + maskAreaWidth / 2
            const maskCenterY = maskAreaOriginY + maskAreaHeight / 2
            patternX = maskCenterX - ((patternImage.width || 0) / 2) * patternScale
            patternY = maskCenterY - ((patternImage.height || 0) / 2) * patternScale
          }
          maskList.push({
            maskId,
            maskImage,
            maskAreaWidth,
            maskAreaHeight,
            patternImage,
            patternX,
            patternY,
            patternScale,
            rotate: patternInfo.rotate,
            cycleMode: patternInfo.cycleMode
          })
        }
      }
      fwSdk2Ref.current = new FullWidthCanvasSDK2({
        container: canvasParentNode.current,
        canvasWidth,
        canvasHeight,
        originImage,
        resultImage,
        maskPatternList: maskList
      })
      fwSdk2Ref.current.drawAll()
      if (currentEditMaskIdRef.current) {
        fwSdk2Ref.current.setCurrentEditMaskId(currentEditMaskIdRef.current)
      }

      // 附加生成方法到 SDK 实例
      console.log('🔧 SDK 初始化完成，附加生成方法')
      ;(fwSdk2Ref.current as any).generateEffectAndCreateTask = generateEffectAndCreateTask
      console.log('✅ 生成方法已附加:', typeof (fwSdk2Ref.current as any).generateEffectAndCreateTask)

      onSdkReady?.(fwSdk2Ref.current)
    } finally {
      setCanvasLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 初始化 SDK
  useEffect(() => {
    if (currentPeiYi) {
      init(currentPeiYi)
    }
  }, [currentPeiYi.id, init])

  const enterMaskAreaRef = useRef(false)
  const maskImageMap = useRef<{
    [key: string]: {
      imageElement: HTMLImageElement
      maskCtx: CanvasRenderingContext2D
      path: Path2D
      mask: IFwMaskItem
      hadResultURL: boolean
    }
  }>({})

  useEffect(() => {
    if (currentPeiYi) {
      const { maskList, resultUrl } = currentPeiYi
      maskList.forEach(async mask => {
        const canvasEle = document.createElement('canvas')
        canvasEle.width = canvasWidth
        canvasEle.height = canvasHeight
        const maskCtx = canvasEle.getContext('2d') as CanvasRenderingContext2D
        const maskImage = await loadImage(mask.maskURL, { crossOrigin: 'anonymous' })
        maskCtx.drawImage(maskImage, 0, 0, canvasEle.width, canvasEle.height)
        const imageData = maskCtx.getImageData(0, 0, canvasEle.width, canvasEle.height)
        const path = createClipPathFromBinaryImageData(imageData)
        maskImageMap.current[mask.maskId] = {
          imageElement: maskImage,
          maskCtx,
          path,
          mask,
          hadResultURL: !!resultUrl
        }
      })
    }
    return () => {
      maskImageMap.current = {}
    }
  }, [canvasHeight, canvasWidth, currentPeiYi])

  const handleDragEnter: React.DragEventHandler<HTMLDivElement> = () => {
    // 无套花区提示
    if (!currentPeiYi) return
    const { maskList } = currentPeiYi
    if (!maskList || maskList.length === 0) {
      Message.warn('当前模板无套花区，请先添加套花区')
    }
  }

  // dragOver事件节流
  const dragOverPos = useRef({ x: 0, y: 0 })
  const handleDragOver: React.DragEventHandler<HTMLDivElement> = e => {
    e.preventDefault()
    if (e.clientX === dragOverPos.current.x && e.clientY === dragOverPos.current.y) {
      return
    }
    dragOverPos.current = { x: e.clientX, y: e.clientY }
    handleMouseMoveOrDragOver(e.clientX, e.clientY)
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (fwSdk2Ref.current?.maskCtxList) {
      // 找到在哪个mask
      const canvasRect = canvasParentNode.current!.getBoundingClientRect()
      const x = e.clientX - canvasRect.left
      const y = e.clientY - canvasRect.top
      for (let maskIndex = 0; maskIndex < fwSdk2Ref.current.maskCtxList.length; maskIndex++) {
        const { maskId, ctx, path } = fwSdk2Ref.current.maskCtxList[maskIndex]
        if (ctx.isPointInPath(path, x, y)) {
          fwSdk2Ref.current?.setCurrentEditMaskId(maskId)
          fwSdk2Ref.current?.setIsMovingOn()
          onCurrentEditMaskIdChange?.(maskId)
          return
        }
      }
    }
  }

  // 高亮套花区
  const handleMouseMoveOrDragOver = throttle((clientX: number, clientY: number) => {
    const canvasRect = canvasParentNode.current!.getBoundingClientRect()
    for (const maskId in maskImageMap.current) {
      const maskInfo = maskImageMap.current[maskId]
      if (!maskInfo || maskInfo.hadResultURL) return
      removeHighlight()
      const pointInPath = maskInfo.maskCtx.isPointInPath(
        maskInfo.path,
        clientX - canvasRect.left,
        clientY - canvasRect.top
      )
      if (pointInPath) {
        const maskPatternEle = canvasParentNode.current?.querySelector(`[data-mask-id="${maskId}"]`)
        if (maskPatternEle) {
          return
        }
        // 高亮当前套花区
        const lhMask: IMaskHighlight = {
          maskId: maskInfo.mask.maskId,
          maskImage: maskInfo.imageElement,
          maskAreaWidth: maskInfo.mask.maskAreaWidth,
          maskAreaHeight: maskInfo.mask.maskAreaHeight
        }
        fwSdk2Ref.current?.appendMaskHighlightCanvas(lhMask)
        enterMaskAreaRef.current = true
        return
      }
    }
  }, 200)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    handleMouseMoveOrDragOver(e.clientX, e.clientY)
    fwSdk2Ref.current?.setPatternPosition(e.movementX, e.movementY)
  }

  const removeHighlight = () => {
    const highlightEle = canvasParentNode.current?.querySelectorAll(`[data-mask-id="highlight"]`)
    if (highlightEle) {
      highlightEle.forEach(ele => {
        canvasParentNode.current?.removeChild(ele)
      })
      enterMaskAreaRef.current = false
    }
  }

  const handleMouseUp = () => {
    removeHighlight()
    fwSdk2Ref.current?.setIsMovingOff()
    // 更新attr
    const maskId = currentEditMaskIdRef.current
    const matchPattern = fwSdk2Ref.current?.maskPatternList.find(mask => mask.maskId === maskId)
    if (!maskId || !matchPattern || !('patternImage' in matchPattern)) return
    const newWipPatternAttr = update(wipPatternAttr, {
      [maskId]: {
        $merge: {
          x: matchPattern.patternX,
          y: matchPattern.patternY
        }
      }
    })
    onWipPatternAttrChange(newWipPatternAttr)
  }

  const handleDropPatternIntoStage: React.DragEventHandler<HTMLDivElement> = async e => {
    e.preventDefault()
    if (!currentPeiYi) return
    const { maskList } = currentPeiYi
    const dataStr = e.dataTransfer.getData('text/plain')
    const canUsePattern = JSON.parse(dataStr) as ICanUsePattern
    if (!canUsePattern) return
    const { id, url } = canUsePattern
    // 根据drop的位置，找到对应的maskId
    for (const mask of maskList) {
      const maskImageElement = await loadImage(mask.maskURL, { crossOrigin: 'anonymous' })
      const canvasRect = canvasParentNode.current!.getBoundingClientRect()
      const pointInPath = isPointInPath({
        imageElement: maskImageElement,
        canvasWidth,
        canvasHeight,
        x: e.clientX - canvasRect.left,
        y: e.clientY - canvasRect.top
      })
      removeHighlight()
      if (pointInPath) {
        // 图案款默认不循环，满幅款默认全循环
        const cycleMode = 0
        const matchMaskId = mask.maskId
        const matchMaskIndex = maskList.findIndex(m => m.maskId === matchMaskId)
        if (matchMaskIndex === -1) return
        const matchMaskPatternInfo = maskList[matchMaskIndex].patternInfo

        // 移除旧的canvas
        const oldCanvas = canvasParentNode.current?.querySelector(
          `[data-mask-id="${matchMaskId}"]`
        ) as HTMLCanvasElement
        if (oldCanvas) {
          canvasParentNode.current?.removeChild(oldCanvas)
        }

        let newPeiYiData: IFashionCanvasPeiYi
        if (!matchMaskPatternInfo) {
          // 新增
          const commonParams: IFwPatternAttribute = {
            size: 100,
            x: 0,
            y: 0,
            rotate: 0,
            cycleMode
          }
          newPeiYiData = update(currentPeiYi, {
            maskList: {
              [matchMaskIndex]: {
                patternInfo: {
                  $set: {
                    id,
                    url,
                    ...commonParams
                  }
                }
              }
            }
          })
          onPeiYiDataChange(newPeiYiData)
          onWipPatternAttrChange({
            ...wipPatternAttr,
            [matchMaskId]: commonParams
          })
        } else {
          // 替换
          newPeiYiData = update(currentPeiYi, {
            maskList: {
              [matchMaskIndex]: {
                patternInfo: {
                  $merge: {
                    id,
                    url
                  }
                }
              }
            }
          })
          onPeiYiDataChange(newPeiYiData)
        }

        onRightPanelPatternTabIndexChange?.(0)
        onCurrentEditMaskIdChange?.(matchMaskId)
        fwSdk2Ref.current?.setCurrentEditMaskId(matchMaskId)
        const maskImage = await loadImage(mask.maskURL, { crossOrigin: 'anonymous' })
        const patternImage = await loadImage(url, { crossOrigin: 'anonymous' })

        const newMask = newPeiYiData.maskList[matchMaskIndex]
        const patternScale = calcPatternScaleBySize({
          maskHeight: newMask.maskAreaHeight,
          patternSize: newMask.patternInfo?.size || 0,
          patternHeight: patternImage.height,
          canvasRatio: 1
        })
        const maskCenterX = newMask.maskAreaOriginX + newMask.maskAreaWidth / 2
        const maskCenterY = newMask.maskAreaOriginY + newMask.maskAreaHeight / 2
        const patternX = maskCenterX - ((patternImage.width || 0) / 2) * patternScale
        const patternY = maskCenterY - ((patternImage.height || 0) / 2) * patternScale
        const maskObj: IMaskPattern = {
          maskId: matchMaskId,
          maskImage,
          maskAreaWidth: newMask.maskAreaWidth,
          maskAreaHeight: newMask.maskAreaHeight,
          patternImage,
          patternX,
          patternY,
          patternScale,
          rotate: newMask.patternInfo?.rotate || 0,
          cycleMode: newMask.patternInfo?.cycleMode || cycleMode
        }

        const index = fwSdk2Ref.current?.maskPatternList.findIndex(mask => mask.maskId === matchMaskId)
        if (index !== undefined && index !== -1) {
          fwSdk2Ref.current?.maskPatternList.splice(index, 1, maskObj)
        } else {
          fwSdk2Ref.current?.maskPatternList.push(maskObj)
        }
        fwSdk2Ref.current?.appendMaskPatternCanvas(maskObj)

        return
      }
    }
    Message.warn('请拖拽到套花区内')
  }

  // 将相对路径转换为完整 URL
  const normalizeUrl = (url: string): string => {
    if (!url) return url
    // 如果已经是完整 URL，直接返回
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url
    }
    // 相对路径转换为完整 URL
    const baseUrl = window.location.origin
    return `${baseUrl}${url.startsWith('/') ? url : '/' + url}`
  }

  const getMergePatternInfoPeiYi = (peiYi: IFashionCanvasPeiYi) => {
    const newPeiYi = { ...peiYi }
    const maskList = []
    const wipAttrs = wipPatternAttrRef.current
    for (let i = 0; i < newPeiYi.maskList.length; i++) {
      const mask = newPeiYi.maskList[i]
      const wipPatternInfo = wipAttrs[mask.maskId]
      if (!wipPatternInfo) {
        maskList.push(mask)
        continue
      }
      const mergePatternInfoPeiYi = update(mask, {
        patternInfo: {
          $merge: {
            ...wipPatternInfo
          }
        }
      })
      maskList.push(mergePatternInfoPeiYi)
    }
    newPeiYi.maskList = maskList
    return newPeiYi
  }

  const createTask = async (params: ICreateSingleTaskParams) => {
    if (!params) return

    console.log('🔧 createTask 接收的参数:', params)

    const {
      id,
      width,
      height,
      patternURL,
      patternImage,
      size,
      rotate,
      patternX,
      patternY,
      maskAreaHeight,
      maskAreaOriginX,
      maskAreaOriginY,
      maskAreaWidth,
      maskURL,
      originURL,
      cycleMode
    } = params
    const patternImagedataURL = await fwSdk2Ref.current!.getPatternImageDataURL(patternImage)
    const patternFile = dataUrlToBlob(patternImagedataURL, 'pattern.jpg')
    const parent_height = size / 100 + ''
    const parent_rotate_angle = `${-rotate || 0}`
    const patternImageWidth = patternImage.width
    const patternImageHeight = patternImage.height
    const { patternCenterXInMask, patternCenterYInMask } = calcPatternPosInMask({
      patternX,
      patternY,
      maskAreaOriginX,
      maskAreaOriginY,
      canvasRatio: 1,
      patternSize: size / 100,
      maskAreaHeight,
      maskAreaWidth,
      patternRatio: patternImageWidth / patternImageHeight
    })
    // 标准化 URL（将相对路径转换为完整 URL）
    const normalizedMaskURL = normalizeUrl(maskURL)
    const normalizedPatternURL = normalizeUrl(patternURL)
    const normalizedOriginURL = normalizeUrl(originURL)

    const data: ICreateFWtaskData = {
      mask_image_url: normalizedMaskURL,
      template_height: height,
      parent_image_url: normalizedPatternURL,
      template_width: width,
      template_image_url: normalizedOriginURL,
      front_template_key: id,
      parent_pos_x: patternCenterXInMask + '',
      parent_pos_y: patternCenterYInMask + '',
      parent_rotate_angle,
      parent_height,
      cycle_mode: cycleMode
    }

    console.log('📦 准备发送的数据:')
    console.log('  - mask_image_url:', normalizedMaskURL)
    console.log('  - parent_image_url:', normalizedPatternURL)
    console.log('  - template_image_url:', normalizedOriginURL)
    console.log('  - template_width:', width, 'template_height:', height)
    console.log('  - parent_pos_x:', data.parent_pos_x, 'parent_pos_y:', data.parent_pos_y)
    console.log('  - parent_height:', parent_height, 'parent_rotate_angle:', parent_rotate_angle)
    console.log('  - cycle_mode:', cycleMode)
    console.log('  - front_template_key:', id)

    // 生图接口可以用python实现
    // await createTaskApi(data)
    return true
  }

  const checkTask = (front_template_key: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const timeId = setInterval(async () => {
        const { items } = await getFWcreativeTaskV2({
          front_template_key
        })
        const [firstItem] = items
        if (firstItem.status_code === 3) {
          clearInterval(timeId)
          let resultURL = firstItem.final_image_url
          const { result } = await imageOverSize(firstItem.final_image_url)
          if (typeof result === 'string') {
            resultURL = result
          } else {
            const [{ image_url }] = await uploadDxOssImages(result)
            resultURL = image_url
          }
          resolve(resultURL)
        } else if (firstItem.status_code === -1) {
          // 失败
          Message.error('AI生成失败，请稍后重试，front_template_key=' + front_template_key)
          clearInterval(timeId)
          reject()
        }
      }, 5000)
    })
  }

  /**
   * 生成效果图并创建任务
   * @returns Promise<生成的效果图URL>
   */
  const generateEffectAndCreateTask = useCallback(async () => {
    console.log('🎨 开始生成效果图...')

    if (!fwSdk2Ref.current || !currentPeiYiRef.current) {
      console.error('❌ 画布未初始化')
      Message.error('画布未初始化')
      return
    }

    const peiYi = getMergePatternInfoPeiYi(currentPeiYiRef.current)
    const { maskList, originUrl, width, height } = peiYi

    console.log('📋 配衣数据:', { maskList: maskList.length, originUrl, width, height })

    // 检查是否所有mask都有花型
    const masksWithPattern = maskList.filter(mask => mask.patternInfo)
    console.log('🎭 有花型的套花区数量:', masksWithPattern.length)

    if (masksWithPattern.length === 0) {
      console.warn('⚠️ 没有花型')
      Message.warn('请先添加花型')
      return
    }

    setCanvasLoading(true)
    console.log('⏳ 开始创建任务...')

    try {
      // 为每个有花型的mask创建任务
      const taskPromises = masksWithPattern.map(async (mask, index) => {
        console.log(`🎯 处理第 ${index + 1} 个套花区: ${mask.maskId}`)
        const { maskId, patternInfo, maskURL, maskAreaWidth, maskAreaHeight, maskAreaOriginX, maskAreaOriginY } = mask

        if (!patternInfo) return null

        console.log(`📸 加载花型图片: ${patternInfo.url}`)
        const patternImage = await loadImage(patternInfo.url, { crossOrigin: 'anonymous' })

        const params: ICreateSingleTaskParams = {
          id: maskId,
          width,
          height,
          patternURL: patternInfo.url,
          patternImage,
          size: patternInfo.size,
          rotate: patternInfo.rotate,
          patternX: patternInfo.x,
          patternY: patternInfo.y,
          maskAreaHeight,
          maskAreaOriginX,
          maskAreaOriginY,
          maskAreaWidth,
          maskURL,
          originURL: originUrl,
          cycleMode: patternInfo.cycleMode
        }

        console.log(`📤 调用 createTask API...`)
        const result = await createTask(params)
        console.log(`✅ 任务创建完成:`, result)
        return result
      })

      // 等待所有任务创建完成
      console.log('⏳ 等待所有任务创建完成...')
      await Promise.all(taskPromises)
      console.log('✅ 所有任务创建完成')

      // 轮询检查任务状态（使用第一个mask的ID作为front_template_key）
      const firstMaskId = masksWithPattern[0].maskId
      console.log(`🔄 开始轮询任务状态: ${firstMaskId}`)
      const resultURL = await checkTask(firstMaskId)
      console.log(`✅ 任务完成，结果图片: ${resultURL}`)

      // 更新peiYi数据，设置结果图
      const newPeiYiData = update(currentPeiYiRef.current, {
        resultUrl: {
          $set: resultURL
        },
        lastResultUrl: {
          $set: currentPeiYiRef.current.resultUrl
        }
      })

      onPeiYiDataChange(newPeiYiData)
      resultURLmapRef.current[firstMaskId] = resultURL

      console.log('🎉 效果图生成成功!')
      Message.warn('效果图生成成功')
      return resultURL
    } catch (error) {
      console.error('❌ 生成效果图失败:', error)
      Message.error('生成效果图失败：' + (error instanceof Error ? error.message : '未知错误'))
      throw error
    } finally {
      setCanvasLoading(false)
      console.log('🏁 生成流程结束')
    }
  }, [onPeiYiDataChange])

  // 更新生成方法（当依赖变化时）
  useEffect(() => {
    if (fwSdk2Ref.current) {
      console.log('🔄 更新 SDK 的生成方法')
      ;(fwSdk2Ref.current as any).generateEffectAndCreateTask = generateEffectAndCreateTask
    }
  }, [generateEffectAndCreateTask])

  useEffect(() => {
    return () => {
      // 清空状态
      fwSdk2Ref.current = null
      enterMaskAreaRef.current = false
      maskImageMap.current = {}
      resultURLmapRef.current = {}
    }
  }, [])

  return (
    <div className="relative flex h-full flex-col items-center overflow-y-auto">
      {currentPeiYi && (
        <div
          className="relative w-full flex-auto mb-3 [&_canvas]:absolute [&_canvas]:top-1/2 [&_canvas]:left-1/2 [&_canvas]:-translate-x-1/2 [&_canvas]:-translate-y-1/2"
          style={{
            height: canvasHeight,
            minHeight: canvasHeight,
            width: canvasWidth
          }}
          ref={canvasParentNode}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDrop={handleDropPatternIntoStage}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {canvasLoading && (
            <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
              <LoadingIcon color="#333" />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
