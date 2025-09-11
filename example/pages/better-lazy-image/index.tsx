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
    <>
      {/* <div className={styles.container}>
        <h1>Normal image list</h1>
        {data.map(item => (
          <div key={item.id} className={styles.item}>
            <img src={item.download_url} style={{ width: '100%' }} />
          </div>
        ))}
      </div> */}
      <div className={styles.container}>
        <h1>Use better lazy image list</h1>
        {data.map(item => (
          <div key={item.id} className={styles.item}>
            <LazyImage src={item.download_url} style={{ width: '100%' }} />
          </div>
        ))}
      </div>
    </>
  )
}
