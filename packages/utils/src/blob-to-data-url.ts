export const blobToDataURL = (blob: Blob): Promise<string | ArrayBuffer | null> =>
  new Promise(resolve => {
    const reader = new FileReader()
    reader.onloadend = e => resolve((e.target as FileReader).result)
    reader.readAsDataURL(blob)
  })
