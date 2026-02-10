import { FC, useState } from 'react'
import { CanvasEditor, ICanvasData, ICanUsePattern } from '@pky/canvas-editor/src/2d'

// 使用 picsum.photos（真实图片，支持跨域）
// 使用固定的图片ID，确保每次加载同一个URL都是相同的图片
const SAMPLE_PATTERNS: ICanUsePattern[] = [
  {
    id: 'pattern-1',
    url: 'https://picsum.photos/id/237/400/400' // 固定ID: 237
  },
  {
    id: 'pattern-2',
    url: 'https://picsum.photos/id/238/400/400' // 固定ID: 238
  },
  {
    id: 'pattern-3',
    url: 'https://picsum.photos/id/239/400/400' // 固定ID: 239
  },
  {
    id: 'pattern-4',
    url: 'https://picsum.photos/id/240/400/400' // 固定ID: 240
  }
]

// 图片原始尺寸1340x1785，这里缩小到合适大小
const INITIAL_CANVAS_DATA: ICanvasData = {
  id: 'canvas-1',
  originUrl: '/template.jpeg',
  width: 670,
  height: 893,
  vertices: [
    {
      id: 'preset-1',
      // 16个点按列排布：方形区域 200x200
      sixteenPoints: [
        // Column 0: x=200
        200, 150, 200, 233, 200, 317, 200, 400,
        // Column 1: x=267
        267, 150, 267, 233, 267, 317, 267, 400,
        // Column 2: x=333
        333, 150, 333, 233, 333, 317, 333, 400,
        // Column 3: x=400
        400, 150, 400, 233, 400, 317, 400, 400
      ],
      relativePatternId: undefined
    },
    {
      id: 'preset-2',
      // 16个点按列排布：方形区域 200x200
      sixteenPoints: [
        // Column 0: x=200
        200, 450, 200, 533, 200, 617, 200, 700,
        // Column 1: x=267
        267, 450, 267, 533, 267, 617, 267, 700,
        // Column 2: x=333
        333, 450, 333, 533, 333, 617, 333, 700,
        // Column 3: x=400
        400, 450, 400, 533, 400, 617, 400, 700
      ],
      relativePatternId: undefined
    }
  ],
  patternList: []
}

export const TwoDEditor: FC = () => {
  const [canvasData, setCanvasData] = useState<ICanvasData>(INITIAL_CANVAS_DATA)
  const [canUsePatterns, setCanUsePatterns] = useState<ICanUsePattern[]>(SAMPLE_PATTERNS)

  return (
    <CanvasEditor
      canvasData={canvasData}
      onCanvasUpdate={setCanvasData}
      canUsePatterns={canUsePatterns}
      onCanUsePatternsChange={setCanUsePatterns}
    />
  )
}
