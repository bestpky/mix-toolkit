import { useEffect, useState } from 'react'
import { getImages } from './get-images'
import styles from './index.module.scss'
import { LazyImage } from '@mix-toolkit/better-lazy-image/src/index'
import { initLazyImage } from '@mix-toolkit/better-lazy-image/src/observer'

interface ImageItem {
  author: string
  download_url: string
  height: number
  id: string
  url: string
  width: number
}

export const BetterLazyImagePage = () => {
  const [data, setData] = useState<ImageItem[]>([])

  useEffect(() => {
    initLazyImage()
    getImages(100).then(setData)
  }, [])

  return (
    <div className="h-full bg-gray-50 overflow-auto">
      <div className="max-w-6xl mx-auto p-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Lazy Image 懒加载图片</h1>
          <p className="text-gray-600">
            基于 Intersection Observer API 实现的高性能图片懒加载组件
          </p>
        </div>

        {/* 图片列表 */}
        <div className={styles.container}>
          {data.map(item => (
            <div key={item.id} className={styles.item}>
              <LazyImage src={item.download_url} style={{ width: '100%' }} />
              <div className="mt-2 text-sm text-gray-600">
                <p>作者: {item.author}</p>
              </div>
            </div>
          ))}
        </div>

        {data.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">🖼️</div>
            <p className="text-gray-600">加载图片中...</p>
          </div>
        )}
      </div>
    </div>
  )
}
