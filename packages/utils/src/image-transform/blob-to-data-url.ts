/**
 * Blob对象转DataURL
 * @param blob Blob对象
 * @returns string | ArrayBuffer | null
 */
export const blobToDataUrl = (blob: Blob): Promise<string | ArrayBuffer | null> =>
  new Promise(resolve => {
    const reader = new FileReader()
    reader.onloadend = e => resolve((e.target as FileReader).result)
    reader.readAsDataURL(blob)
  })
