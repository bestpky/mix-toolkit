import { wait } from './wait'

/**
 * 选择文件
 * @template FileSuffix
 * @param {Object?} options 选项
 * @param {string[]?} options.types 文件后缀
 * @param {boolean?} options.folder 是否支持选文件夹
 * @param {boolean?} options.multiple 是否支持多选
 * @returns {Promise<File[]>} 文件对象
 */
export default function selectFiles(options?: {
  types?: string[]
  timeout?: number
  folder?: boolean
  multiple?: boolean
}): Promise<File[]> {
  const _options = options ?? {}
  const { types, folder = false, multiple = false } = _options
  const fileInput = document.createElement('input')
  fileInput.type = 'file'
  fileInput.style.display = 'none'
  if (types) {
    fileInput.accept = types.map(e => `.${e}`).join(', ')
  }
  if (multiple) {
    fileInput.multiple = multiple
  }
  if (folder) {
    Object.assign(fileInput, {
      webkitdirectory: true
    })
  }
  document.body.appendChild(fileInput)
  fileInput.click()

  return new Promise<File[]>(resolve => {
    let cancel: ((..._args: any[]) => any) | null = null
    // eslint-disable-next-line prefer-const
    let confirm: (..._args: any[]) => any
    let unbind: ((..._args: any[]) => any) | null = () => {
      if (cancel) {
        window.removeEventListener('focus', cancel)
      }
      fileInput.removeEventListener('change', confirm)
      document.body.removeChild(fileInput)
      unbind = null
    }
    cancel = async () => {
      await wait(2000)
      unbind?.()
    }
    confirm = async e => {
      if (Array.from(e.target.files ?? []).length === 0) {
        console.log(`测试代码：Array.from(e.target.files ?? []).length = 0，e.target.files=${e.target.files}`)
      }
      resolve(Array.from(e.target.files ?? []))
      unbind?.()
    }
    if (cancel) {
      window.addEventListener('focus', cancel)
    }
    fileInput.addEventListener('change', confirm)
  })
}
export { selectFiles }
