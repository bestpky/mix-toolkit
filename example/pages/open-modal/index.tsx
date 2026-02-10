import { openModal, Modal } from '@pky/open-modal/src'
import { useState } from 'react'

export const OpenModalPage = () => {
  const [visible, setVisible] = useState(false)

  return (
    <div className="h-full bg-gray-50 overflow-auto">
      <div className="max-w-4xl mx-auto p-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Modal 模态框</h1>
          <p className="text-gray-600">灵活的模态框组件，支持多种打开方式和异步交互</p>
        </div>

        {/* 示例区域 */}
        <div className="space-y-6">
          {/* 普通模态框 */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">普通模态框</h3>
            <p className="text-sm text-gray-600 mb-4">
              使用组件方式控制模态框的显示和隐藏
            </p>
            <button
              onClick={() => setVisible(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              打开普通模态框
            </button>
          </div>

          {/* 函数调用方式 */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">函数调用方式</h3>
            <p className="text-sm text-gray-600 mb-4">
              通过 openModal 函数快速打开模态框，支持回调函数
            </p>
            <button
              onClick={async () => {
                openModal({
                  modalContent: <div className="p-6 text-center">
                    <p className="text-lg">这是一个函数式模态框</p>
                  </div>,
                  closeCb: () => {
                    console.log('Modal closed')
                  }
                })
              }}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              函数式打开模态框
            </button>
          </div>

          {/* 异步交互 */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">异步交互</h3>
            <p className="text-sm text-gray-600 mb-4">
              支持 Promise 返回值，可以获取模态框内部的提交数据
            </p>
            <button
              onClick={async () => {
                const res = await openModal<{ name: string }>({
                  modalContent: ({ onSubmit }) => {
                    return (
                      <div className="p-6 text-center">
                        <p className="text-lg mb-4">点击提交返回数据</p>
                        <button
                          onClick={() => onSubmit({ name: 'Kevin' })}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          提交数据
                        </button>
                      </div>
                    )
                  }
                })
                console.log('Modal result:', res.name)
                alert(`收到数据: ${res.name}`)
              }}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              异步打开模态框
            </button>
          </div>
        </div>
      </div>

      {/* 普通模态框组件 */}
      <Modal visible={visible} onClose={() => setVisible(false)}>
        <div className="p-6">
          <h3 className="text-xl font-semibold mb-4">普通模态框</h3>
          <p className="text-gray-600">这是一个通过组件方式控制的模态框</p>
        </div>
      </Modal>
    </div>
  )
}
