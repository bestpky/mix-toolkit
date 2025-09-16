import { useEffect, useState } from 'react'

//  复制上传图片
export const usePasteFile = () => {
  const [fileArr, setFileArr] = useState<File[]>([])
  useEffect(() => {
    async function handlePaste(e: ClipboardEvent) {
      const cbd = e.clipboardData
      if (!(cbd && cbd.items)) {
        return
      }
      const arr = []
      for (let i = 0; i < cbd.items.length; i++) {
        const item = cbd.items[i]
        if (item.kind == 'file') {
          const blob = item.getAsFile()
          if (!blob || blob.size === 0) {
            return
          }
          arr.push(blob)
        }
      }
      setFileArr(arr)
    }
    document.addEventListener('paste', handlePaste)
    return () => document.removeEventListener('paste', handlePaste)
  }, [])

  return fileArr
}
