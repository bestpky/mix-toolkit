export const observeVm = new WeakMap()

export let ioInstance: IntersectionObserver | null = null

export const initLazyImage = (root?: HTMLElement) => {
  if (ioInstance) return ioInstance

  ioInstance = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        const setIsEntry = observeVm.get(entry.target)
        if (!setIsEntry) {
          return
        }
        setIsEntry(entry.isIntersecting)
      })
    },
    {
      root, // 得设置滚动元素rootMargin才能生效
      rootMargin: '500px 200px', // 预加载视口上下500px、左右200px距离内的图片
      threshold: 0 // 刚进入视口就加载
    }
  )
  return ioInstance
}

export const destroyLazyImage = () => {
  if (ioInstance) {
    ioInstance.disconnect()
    ioInstance = null
  }
}
