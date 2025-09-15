const arrayEquals = (arr1: number[], arr2: number[]) => {
  if (!arr1 || !arr2) {
    return false
  }
  if (arr1 instanceof Array && arr2 instanceof Array) {
    if (arr1.length !== arr2.length) {
      return false
    }
    for (let i = 0; i < arr1.length; i++) {
      if (arr1[i] !== arr2[i]) {
        return false
      }
    }
    return true
  }
  return false
}

const arraycopy = (src: number[], index: number, dist: number[], distIndex: number, size: number) => {
  for (let i = 0; i < size; i++) {
    dist[distIndex + i] = src[index + i]
  }
}

// 使用magicNumber判断图片类型
// 一句话形容magic Number就是：文件的唯一标识
// 对 JPEG、GIF、PNG 的 magic number 的检测如下：
const pngMagic = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
const jpegMagicStart = [0xff, 0xd8]
const jpegMagicEnd = [0xff, 0xd9]
const gifMagic0 = [0x47, 0x49, 0x46, 0x38, 0x37, 0x61]
const getGifMagic1 = [0x47, 0x49, 0x46, 0x38, 0x39, 0x61]

const getMime = (buf: number[]) => {
  const isGif = (data: number[]) => arrayEquals(data, gifMagic0) || arrayEquals(data, getGifMagic1)
  const isPng = (data: number[]) => arrayEquals(data, pngMagic)

  if (!buf || buf.length < 8) {
    return null
  }

  let bytes: number[] = []

  arraycopy(buf, 0, bytes, 0, 6)
  if (isGif(bytes)) {
    return 'gif'
  }
  bytes = []

  arraycopy(buf, 0, bytes, 0, 2)
  if (arrayEquals(bytes, jpegMagicStart)) {
    return 'jpeg'
  }

  bytes = []
  arraycopy(buf, buf.length - 2, bytes, 0, 2)
  if (arrayEquals(bytes, jpegMagicEnd)) {
    return 'jpeg'
  }

  bytes = []
  arraycopy(buf, 0, bytes, 0, 8)
  if (isPng(bytes)) {
    return 'png'
  }

  return null
}

type ImgMime = 'gif' | 'jpeg' | 'png'
/**
 * 获取图片文件mime类型
 * @param file 文件
 * @returns mime类型字符串
 */
export const getImgMime: (file: File) => Promise<ImgMime | null> = (file: File) => {
  if (!file || !(file instanceof File)) throw '文件不存在'
  return new Promise(resolve => {
    const reader = new FileReader()
    reader.onload = evt => {
      const sliceArr = evt.target?.result?.slice(0, 11)
      if (sliceArr) {
        //取前11Bytes转换成Uint8Array
        const fileBuf = new Uint8Array(sliceArr as ArrayBuffer)
        // 转成number[]
        const numberArr = Array.from(fileBuf)
        const mime = getMime(numberArr)
        resolve(mime)
      }
    }
    reader.onerror = () => {
      resolve(null)
    }
    //读取文件为ArrayBuffer
    reader.readAsArrayBuffer(file)
  })
}
