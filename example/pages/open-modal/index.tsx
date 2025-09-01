import { Link } from 'react-router'

import { openModal, Modal } from '@mix-toolkit/open-modal/src'
import { useState } from 'react'

export const OpenModalPage = () => {
  const [visible, setVisible] = useState(false)

  return (
    <>
      <Link to="/">Go Back</Link>
      <div>
        <div>
          <button
            onClick={() => {
              setVisible(true)
            }}
          >
            Normal open
          </button>
        </div>
        <div>
          <button
            onClick={async () => {
              openModal({
                modalContent: <div>This is a modal</div>,
                closeCb: () => {
                  console.log('Modal closed')
                }
              })
            }}
          >
            Function open
          </button>
        </div>
        <div>
          <button
            onClick={async () => {
              const res = await openModal<{ name: string }>({
                modalContent: ({ onSubmit }) => {
                  return (
                    <div>
                      <button onClick={() => onSubmit({ name: 'Kevin' })}>Submit</button>
                    </div>
                  )
                }
              })
              console.log('Modal result:', res.name)
            }}
          >
            Function open async
          </button>
        </div>
      </div>
      <Modal visible={visible} onClose={() => setVisible(false)}>
        <div>Normal Modal</div>
      </Modal>
    </>
  )
}
