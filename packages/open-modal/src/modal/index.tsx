import classNames from 'classnames'
import { ReactNode, useEffect, useState } from 'react'
import closeIcon from './close.png'

import { createPortal } from 'react-dom'
import styles from './index.module.scss'

export interface ModalProps {
  children?: ReactNode
  visible?: boolean
  onClose?: () => void
  style?: React.CSSProperties
  className?: string
  contentClassName?: string
  fullHeight?: boolean
}

/**
 * 全屏弹窗，从下向上弹出
 */
export const Modal = ({ children, visible, onClose, style, className, contentClassName, fullHeight }: ModalProps) => {
  const [modalElement, setModalElement] = useState<HTMLDivElement | null>(null)

  useEffect(() => {
    if (visible) {
      const newModalElement = document.createElement('div')
      newModalElement.setAttribute('data-body-portal', '')
      document.body.appendChild(newModalElement)
      setModalElement(newModalElement)

      return () => {
        document.body.removeChild(newModalElement)
      }
    }
  }, [visible])

  if (!visible || modalElement === null) return null

  return createPortal(
    <div className={classNames(styles.modal, className)} style={style}>
      {!fullHeight && (
        <div className={styles.topBar}>
          <span onClick={onClose} style={{ cursor: 'pointer' }}>
            <img src={closeIcon} width={34} style={{ padding: '0 8px' }} alt="close" />
          </span>
        </div>
      )}
      <div className={classNames(styles.content, contentClassName, fullHeight && styles.fullHeight)}>{children}</div>
    </div>,
    modalElement
  )
}
