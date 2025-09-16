/**
 * 下载文件
 * @param uri
 * @param name
 */
export const downloadURI = (uri: string, name: string) => {
  const link = document.createElement('a')
  link.style.display = 'none'
  link.download = name
  link.href = uri
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
