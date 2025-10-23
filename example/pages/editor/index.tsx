import { CollaborationEditor } from '@mix-toolkit/editor/src/index'

export const EditorPage = () => {
  return (
    <div className="h-full bg-gray-50 overflow-auto">
      <div className="max-w-5xl mx-auto p-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Editor 富文本编辑器</h1>
          <p className="text-gray-600">
            基于 ProseMirror 的协同编辑器，支持实时协作和多用户编辑
          </p>
        </div>

        {/* 编辑器区域 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <CollaborationEditor />
        </div>

        {/* 使用说明 */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">功能特性</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• 支持实时协同编辑</li>
              <li>• 多用户光标显示</li>
              <li>• 富文本格式支持</li>
            </ul>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <h3 className="font-semibold text-green-900 mb-2">使用提示</h3>
            <ul className="text-sm text-green-800 space-y-1">
              <li>• 直接在编辑器中输入内容</li>
              <li>• 支持常用快捷键操作</li>
              <li>• 自动保存编辑内容</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
