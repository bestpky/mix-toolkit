export const imageUrlToBlob = (url: string, type = 'image/jpeg'): Promise<Blob> =>
  new Promise(resolve => {
    // 创建一个 Image 对象
    const img = new Image()
    // 设置 Image 对象的 src，加载 PNG 图片
    img.src = url
    // 当 PNG 图片加载完成后执行
    img.onload = function () {
      // 创建一个 canvas 元素
      const canvas = document.createElement('canvas')

      // 设置 canvas 的宽和高为 PNG 图片的宽和高
      canvas.width = img.width
      canvas.height = img.height

      // 获取 canvas 的上下文对象，用于绘图
      const ctx = canvas.getContext('2d')

      // 在 canvas 上绘制 PNG 图片
      ctx!.drawImage(img, 0, 0)
      // 将 canvas 转换为 Blob 对象，指定 MIME 类型为 image/jpeg
      canvas.toBlob(
        function (blob) {
          blob && resolve(blob)
        },
        type,
        1
      )
    }
  })
