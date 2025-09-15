/**
 * 通过fetch图片url的方式转blob，url是http url | data url | blob url
 */
export const fetchUrlToBlob: (params: { url: string; mimeType?: string }) => Promise<Blob> = async ({
  url,
  mimeType = 'image/jpeg'
}) => {
  const response = await fetch(url)

  // 将响应的 Blob 数据读取为 ArrayBuffer
  const arrayBuffer = await response.arrayBuffer()

  // 创建 Blob 对象
  const blob = new Blob([arrayBuffer], { type: mimeType })

  // 返回 Blob 对象
  return blob
}
