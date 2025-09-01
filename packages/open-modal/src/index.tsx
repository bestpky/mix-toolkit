import { ReactElement } from 'react'
import { createRoot } from 'react-dom/client'
import { ModalProps, Modal } from './modal'

export type OpenModalRenderProps<T> = { onClose: () => void; onSubmit: (v: T) => void }

type OpenModalParams<T> = {
  modalContent: ReactElement | ((p: OpenModalRenderProps<T>) => ReactElement)
  closeCb?: () => void
} & ModalProps

export { Modal } from './modal'
export const openModal = <T,>({ modalContent, closeCb, ...modalProps }: OpenModalParams<T>): Promise<T> => {
  return new Promise(resolve => {
    const div = document.createElement('div')
    const root = createRoot(div)

    function _render(currentProps: ModalProps) {
      const content =
        typeof modalContent === 'function'
          ? modalContent({
              onClose,
              onSubmit(v: T) {
                resolve(v)
                onClose()
              }
            })
          : modalContent

      root.render(<Modal {...currentProps}>{content}</Modal>)
    }

    let newProps = {
      ...modalProps,
      visible: true,
      onClose
    }

    function onClose() {
      newProps = {
        ...newProps,
        visible: false
      }
      _render(newProps)
      closeCb?.()
    }

    _render(newProps)
  })
}
