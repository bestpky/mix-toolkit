import { FC, useState } from 'react'
import { FullWidthCanvasEditor, IFashionCanvasPeiYi } from '@pky/canvas-editor/src/full-width'
import { ICanUsePattern } from '@pky/canvas-editor/src/2d'

export const FullWidthEditor: FC = () => {
  // 示例胚衣数据
  const [currentPeiYi, setCurrentPeiYi] = useState<IFashionCanvasPeiYi>({
    id: 'peiyi-001',
    templateId: 'template-001',
    originUrl: '/template-fw.jpg',
    width: 1340 / 2,
    height: 1785 / 2,
    maskList: [
      {
        maskId: 'mask-001',
        maskURL: '/mask1.jpg',
        maskAreaWidth: 245,
        maskAreaHeight: 214,
        maskAreaOriginX: 683,
        maskAreaOriginY: 529
      },
      {
        maskId: 'mask-002',
        maskURL: '/mask2.jpg',
        maskAreaWidth: 452,
        maskAreaHeight: 717,
        maskAreaOriginX: 541,
        maskAreaOriginY: 870
      }
    ]
  })

  // 示例可用图案列表
  const [canUsePatterns] = useState<ICanUsePattern[]>([{ id: 'pattern-001', url: '/pattern.png' }])

  return (
    <FullWidthCanvasEditor
      currentPeiYi={currentPeiYi}
      onPeiYiDataChange={setCurrentPeiYi}
      canUsePatterns={canUsePatterns}
    />
  )
}
