import {
  useRef,
  useState,
  useEffect,
  forwardRef,
  ForwardRefRenderFunction,
  useImperativeHandle,
  ImgHTMLAttributes
} from 'react'
import { ioInstance, observeVm } from './observer'
import PlacementImage from './lazy-image-placement.svg'
import { imageLoadManager } from './image-load-manager'
import { filter } from 'rxjs/operators'

interface LazyImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  noLazy?: boolean
}

export interface LazyImageRef {
  imgRefCurrent: HTMLImageElement | null
}

const _LazyImage: ForwardRefRenderFunction<LazyImageRef, LazyImageProps> = (props, ref) => {
  const { noLazy, src, style, ...restProps } = props
  const imgRef = useRef<HTMLImageElement>(null)
  const [url, setUrl] = useState<ImgHTMLAttributes<HTMLImageElement>['src']>(PlacementImage)
  const [isEntry, setIsEntry] = useState(false)

  useEffect(() => {
    if (!ioInstance) return
    const imgElement = imgRef.current
    if (imgElement && !observeVm.has(imgElement)) {
      // 在Map里注册元素和setIsEntry方法的关系
      observeVm.set(imgElement, (v: boolean) => v && setIsEntry(v))
      // 监听元素进入视口
      ioInstance?.observe(imgElement)
    }
    return () => {
      imgElement && observeVm.delete(imgElement)
      imgElement && ioInstance && ioInstance.unobserve(imgElement)
    }
  }, [])

  useEffect(() => {
    if (!src) {
      return
    }
    if (isEntry) {
      console.log('图片进入视口，加入加载队列:', src)
      imageLoadManager.load(src)
    }
  }, [src, isEntry])

  // 监听加载完成事件
  useEffect(() => {
    if (!src) return

    const subscription = imageLoadManager.loadComplete$.pipe(filter(event => event.src === src)).subscribe(event => {
      if (event.type === 'success' && event.blobUrl) {
        console.log('图片加载成功:', src)
        setUrl(event.blobUrl) // 使用 blob URL，不会触发新的网络请求
      } else {
        console.log('图片加载失败:', src)
      }
    })

    return () => {
      subscription.unsubscribe()
      // 组件卸载时从队列移除
      imageLoadManager.unload(src)
    }
  }, [src])

  useImperativeHandle(ref, () => ({
    get imgRefCurrent() {
      return imgRef.current
    }
  }))

  return noLazy ? (
    <img src={src} style={style} {...restProps} data-src-no-lazy={src} />
  ) : (
    <img
      ref={imgRef}
      src={url}
      style={{
        display: 'inline-block',
        opacity: isEntry ? 1 : 0,
        transition: 'opacity 0.3s ease-in-out',
        ...style
      }}
      {...restProps}
    />
  )
}

export const LazyImage = forwardRef(_LazyImage)
