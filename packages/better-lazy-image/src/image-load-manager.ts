import { Subject } from 'rxjs'

interface LoadEvent {
  src: string
  type: 'success' | 'error'
  blobUrl?: string
}

export class ImageLoadManager {
  private waitQueue: string[] = [] // 等待队列，后进先出
  private loadingSet = new Set<string>() // 正在加载的图片
  private blobCache = new Map<string, string>() // 缓存 blob URL
  private maxConcurrent: number

  public loadComplete$ = new Subject<LoadEvent>()

  constructor(maxConcurrent: number = 3) {
    this.maxConcurrent = maxConcurrent
  }

  /**
   * 添加图片到加载队列（后进先出）
   */
  load(src: string): void {
    if (!src) return

    // 如果已有 blob 缓存，直接返回
    if (this.blobCache.has(src)) {
      const blobUrl = this.blobCache.get(src)!
      this.loadComplete$.next({ src, type: 'success', blobUrl })
      return
    }

    // 如果已经在加载中，直接返回
    if (this.loadingSet.has(src)) {
      return
    }

    // 从队列中移除（如果存在），然后添加到队首
    const index = this.waitQueue.indexOf(src)
    if (index !== -1) {
      this.waitQueue.splice(index, 1)
    }
    this.waitQueue.unshift(src) // 添加到队首，实现后进先出

    this._processQueue()
  }

  unload(src: string): void {
    const index = this.waitQueue.indexOf(src)
    if (index !== -1) {
      this.waitQueue.splice(index, 1)
    }

    // 清理 blob URL
    const blobUrl = this.blobCache.get(src)
    if (blobUrl) {
      URL.revokeObjectURL(blobUrl)
      this.blobCache.delete(src)
    }
  }

  /**
   * 处理加载队列
   */
  private async _processQueue() {
    // 如果达到并发限制或队列为空，直接返回
    if (this.loadingSet.size >= this.maxConcurrent || this.waitQueue.length === 0) {
      return
    }

    // 从队首取出图片（最新进入的）
    const src = this.waitQueue.shift()!
    this.loadingSet.add(src)

    try {
      // 使用 fetch 获取图片数据
      const response = await fetch(src)
      if (!response.ok) throw new Error('Network response was not ok')

      const blob = await response.blob()
      const blobUrl = URL.createObjectURL(blob)

      // 缓存 blob URL
      this.blobCache.set(src, blobUrl)

      this.loadingSet.delete(src)
      this.loadComplete$.next({ src, type: 'success', blobUrl })
      this._processQueue()
    } catch (error) {
      this.loadingSet.delete(src)
      this.loadComplete$.next({ src, type: 'error' })
      this._processQueue()
    }
  }
}

// 创建全局单例
export const imageLoadManager = new ImageLoadManager(10)
