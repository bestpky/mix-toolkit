import { useState } from 'react'
import { TwoDEditor } from './2d'
import { FullWidthEditor } from './full-width'

export const CanvasEditorPage = () => {
  const [activeTab, setActiveTab] = useState<'2d' | 'full-width'>('2d')

  return (
    <div className="flex flex-col h-screen">
      {/* Tab 切换 */}
      <div className="border-b border-gray-200 bg-white px-6 py-3">
        <div className="inline-flex rounded-md border border-gray-300 overflow-hidden">
          <button
            onClick={() => setActiveTab('2d')}
            className={`
              px-4 py-1.5 text-sm font-medium transition-colors
              ${
                activeTab === '2d'
                  ? 'bg-yellow-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }
            `}
          >
            2D Canvas Editor
          </button>
          <button
            onClick={() => setActiveTab('full-width')}
            className={`
              px-4 py-1.5 text-sm font-medium transition-colors border-l border-gray-300
              ${
                activeTab === 'full-width'
                  ? 'bg-yellow-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }
            `}
          >
            Full Width Editor
          </button>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-hidden">
        {activeTab === '2d' ? <TwoDEditor /> : <FullWidthEditor />}
      </div>
    </div>
  )
}
