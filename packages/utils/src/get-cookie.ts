/**
 * 获取 cookie
 * @param name cookie name
 * @returns
 */
export function getCookie(name: string) {
  const cookies = document.cookie.split(';') // 将 cookie 字符串拆分成数组
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i].trim() // 移除每个 cookie 值中的空格
    if (cookie.startsWith(name + '=')) {
      const cookieValue = cookie.substring(name.length + 1).trim() // 获取 cookie 值，并移除空格
      // 如果 cookie 值带有双引号，则去除双引号
      if (cookieValue.startsWith('"') && cookieValue.endsWith('"')) {
        return cookieValue.substring(1, cookieValue.length - 1)
      }
      return cookieValue
    }
  }
  return null // 找不到指定的 cookie，则返回 null
}
