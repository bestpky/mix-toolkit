import { FC } from 'react'
import { v4 as uuid } from 'uuid'

import { selectImages } from '../utils'
import { ICanUsePattern } from '../types'

interface IProps {
  text?: string
  canUsePatterns?: ICanUsePattern[]
  onCanUsePatternsChange?: (patterns: ICanUsePattern[]) => void
}

export const CanUseGridPatterns: FC<IProps> = ({
  text = '拖动图案到套花区域',
  canUsePatterns = [],
  onCanUsePatternsChange
}) => {
  const handleClickUploadBtn = async () => {
    if (!onCanUsePatternsChange) return
    const files = await selectImages()
    if (!files) return
    // Demo 模式：使用本地 blob URL 而不是上传到 OSS
    const newItems = Array.from(files).map(file => ({
      url: URL.createObjectURL(file),
      id: uuid()
    }))
    onCanUsePatternsChange([...canUsePatterns, ...newItems])
  }

  const handleDragPatternIntoStage = async (e: React.DragEvent<HTMLDivElement>, image: ICanUsePattern) => {
    e.dataTransfer.setData('text/plain', JSON.stringify(image))
    const dom = e.target as HTMLDivElement
    const maskDom = dom.lastChild as HTMLDivElement
    maskDom.setAttribute('style', 'opacity: 0')
  }

  const handleDragPatternEnd = (e: React.DragEvent<HTMLDivElement>) => {
    const dom = e.target as HTMLDivElement
    const maskDom = dom.lastChild as HTMLDivElement
    maskDom.setAttribute('style', 'opacity: 1')
  }
  return (
    <div className="px-4 overflow-y-auto">
      <div className="my-2 text-[#6F7073] text-xs">{text}</div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(70px,1fr))] gap-y-2 gap-x-2.5 mb-4">
        {canUsePatterns.map(({ url, id }) => (
          <div
            draggable
            key={id}
            className="p-1 border border-black/[0.08] aspect-square relative group"
            onDragStart={e => handleDragPatternIntoStage(e, { url, id })}
            onDragEnd={handleDragPatternEnd}
          >
            <img src={url} alt="" draggable={false} className="w-full h-full" />
            <div
              className="absolute bottom-0 left-0 bg-black/50 flex items-center justify-center text-xs text-white py-0.5 w-full invisible group-hover:visible cursor-pointer"
              onClick={() => {
                onCanUsePatternsChange?.(canUsePatterns.filter(v => v.id !== id))
              }}
            >
              删除
            </div>
          </div>
        ))}
        <div
          className="flex flex-col items-center justify-center border border-dashed border-[#e8ebf0] aspect-square text-[#6F7073] cursor-pointer"
          onClick={handleClickUploadBtn}
        >
          <span className="mt-1 text-xs">图片上传</span>
        </div>
      </div>
    </div>
  )
}
