// 获取图片列表（包含作者信息）
export const getImages = async (limit = 10) => {
  const response = await fetch(`https://picsum.photos/v2/list?page=1&limit=${limit}`)
  return await response.json()
}
