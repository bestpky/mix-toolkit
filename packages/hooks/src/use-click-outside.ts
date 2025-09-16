import { RefObject, useEffect } from 'react'

type Handler = (event: MouseEvent) => void

/**
 * 监听点击容器外
 * @param ref
 * @param handler
 */
export function useClickOutside<T extends HTMLElement = HTMLElement>(ref: RefObject<T>, handler: Handler) {
  useEffect(() => {
    const listener = (event: MouseEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return
      }
      handler(event)
    }
    document.addEventListener('mousedown', listener)
    return () => {
      document.removeEventListener('mousedown', listener)
    }
  }, [ref, handler])
}
