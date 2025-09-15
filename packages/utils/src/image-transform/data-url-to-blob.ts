/**
 * dataURL转Blob对象
 */
export const dataUrlToBlob = (dataurl: string, mimeType = 'image/jpeg') => {
  // 获取到base64编码
  const arr = dataurl.split(',')
  // 将base64编码转为字符串
  const bstr = window.atob(arr[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n) // 创建初始化为0的，包含length个元素的无符号整型数组
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }
  return new Blob([u8arr], { type: mimeType })
}
