/**
 * 呈现一组三角形（通常用于扭曲位图），并为其指定三维外观。drawTriangles() 方法使用一组 (uvtData,v) 坐标将当前填充或位图填充映射到三角形面。
 * @param  vertices 由数字构成的矢量，其中的每一对数字将被视为一个坐标位置（一个 x, y 对）。vertices 参数是必需的。
 * @param  indices 一个由整数或索引构成的矢量，其中每三个索引定义一个三角形。如果 indexes 参数为 null，则每三个顶点（vertices 矢量中的 6 对 x,y）定义一个三角形。否则，每个索引将引用一个顶点，即 vertices 矢量中的一对数字。例如，indexes[1] 引用 (vertices[2], vertices[3])。indexes 参数是可选的，但 indexes 通常会减少提交的数据量和计算的数据量。
 * @param  uvtData 由用于应用纹理映射的标准坐标构成的矢量。每个坐标引用用于填充的位图上的一个点。每个顶点必须具有一个 UV 或一个 UVT 坐标。对于 UV 坐标，(0,0) 是位图的左上角，(1,1) 是位图的右下角。
 * @param  thickness 一个整数，以点为单位表示线条的粗细,默认为0；
 * @param linecolor 线的颜色
 */
export function drawTriangles(params: {
  image: HTMLImageElement
  vertices: number[]
  indices: number[]
  uvtData: number[]
  thickness?: number
  linecolor?: string
}) {
  const { image, vertices, indices, uvtData } = params
  const { width, height } = image
  let i, j
  const l = indices.length

  return function (c: CanvasRenderingContext2D) {
    const v = vertices
    let k, sw, sh
    for (i = 0, j = 0; i < l; i += 3) {
      c.save()
      c.beginPath()
      c.moveTo(v[indices[i] * 2], v[indices[i] * 2 + 1])
      c.lineTo(v[indices[i + 1] * 2], v[indices[i + 1] * 2 + 1])
      c.lineTo(v[indices[i + 2] * 2], v[indices[i + 2] * 2 + 1])
      c.lineTo(v[indices[i] * 2], v[indices[i] * 2 + 1])
      c.closePath()
      c.clip()
      if (i % 6 == 0) {
        // 上三角
        sw = -1
        let w = (uvtData[indices[i + 1 + j] * 2] - uvtData[indices[i + j] * 2]) * width
        let h = (uvtData[indices[i + 2] * 2 + 1] - uvtData[indices[i] * 2 + 1]) * height
        if (j == 0 && w < 0) {
          for (k = i + 9; k < l; k += 3) {
            if (uvtData[indices[i + 2] * 2 + 1] == uvtData[indices[k + 2] * 2 + 1]) {
              j = k - i
              break
            }
          }
          if (j == 0) {
            j = l - i
          }
          w = (uvtData[indices[i + 1 + j] * 2] - uvtData[indices[i + j] * 2]) * width
        }
        if (i + j >= l) {
          w = (uvtData[indices[i + j - l] * 2] - uvtData[indices[i + 1] * 2]) * width
          sw = uvtData[indices[i] * 2] == 1 ? 0 : width * uvtData[indices[i] * 2] + w
          if (sw > width) {
            sw -= width
          }
        } else {
          sw = width * uvtData[indices[i + j] * 2]
        }
        sh = height * uvtData[indices[i] * 2 + 1]
        if (h < 0) {
          h =
            (uvtData[indices[i + 2 - (i > 0 ? 6 : -6)] * 2 + 1] - uvtData[indices[i - (i > 0 ? 6 : -6)] * 2 + 1]) *
            height
          sh = 0
        }
        const t1 = (v[indices[i + 1] * 2] - v[indices[i] * 2]) / w
        const t2 = (v[indices[i + 1] * 2 + 1] - v[indices[i] * 2 + 1]) / w
        const t3 = (v[indices[i + 2] * 2] - v[indices[i] * 2]) / h
        const t4 = (v[indices[i + 2] * 2 + 1] - v[indices[i] * 2 + 1]) / h
        c.transform(t1, t2, t3, t4, v[indices[i] * 2], v[indices[i] * 2 + 1])
        c.drawImage(image, sw, sh, w, h, 0, 0, w, h)
      } else {
        // 下三角
        let w = (uvtData[indices[i + 2 + j] * 2] - uvtData[indices[i + 1 + j] * 2]) * width
        let h = (uvtData[indices[i + 2] * 2 + 1] - uvtData[indices[i] * 2 + 1]) * height
        if (j == 0 && w < 0) {
          for (k = i + 9; k < l; k += 3) {
            if (uvtData[indices[i + 2] * 2 + 1] == uvtData[indices[k + 2] * 2 + 1]) {
              j = k - i
              break
            }
          }
          if (j == 0) {
            j = l - i
          }
          w = (uvtData[indices[i + 2 + j] * 2] - uvtData[indices[i + 1 + j] * 2]) * width
        }
        if (i + 1 + j >= l) {
          w = (uvtData[indices[i + 1 + j - l] * 2] - uvtData[indices[i + 2] * 2]) * width
          sw = uvtData[indices[i + 1] * 2] == 1 ? 0 : width * uvtData[indices[i + 1] * 2] + w
          if (sw > width) {
            sw -= width
          }
        } else {
          sw = width * uvtData[indices[i + 1 + j] * 2]
        }
        sh = height * uvtData[indices[i] * 2 + 1]
        if (h < 0) {
          h =
            (uvtData[indices[i + 2 - (i > 0 ? 6 : -6)] * 2 + 1] - uvtData[indices[i - (i > 0 ? 6 : -6)] * 2 + 1]) *
            height
          sh = 0
        }
        const t1 = (v[indices[i + 2] * 2] - v[indices[i + 1] * 2]) / w
        const t2 = (v[indices[i + 2] * 2 + 1] - v[indices[i + 1] * 2 + 1]) / w
        const t3 = (v[indices[i + 2] * 2] - v[indices[i] * 2]) / h
        const t4 = (v[indices[i + 2] * 2 + 1] - v[indices[i] * 2 + 1]) / h
        c.transform(t1, t2, t3, t4, v[indices[i + 1] * 2], v[indices[i + 1] * 2 + 1])
        c.drawImage(image, sw, sh, w, h, 0, -h, w, h)
      }
      c.restore()
    }
  }
}
