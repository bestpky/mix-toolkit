import { Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import { useEffect, useRef, useState } from 'react'
import { CollaborationExtension } from './extensions/collaboration'
import { useCollaboration } from './hooks/use-collaboration'
import Typography from '@tiptap/extension-typography'
import { EditorContent } from '@tiptap/react'

export function CollaborationEditor() {
  const editorRef = useRef<HTMLDivElement>(null)
  const [editor, setEditor] = useState<Editor | null>(null)
  const { users, saveStatus, joinCollaboration, leaveCollaboration, getCurrentState } = useCollaboration(editor)

  useEffect(() => {
    if (!editorRef.current) return

    const editorInstance = new Editor({
      element: editorRef.current, // 正确的挂载方式
      extensions: [
        StarterKit,
        Typography,
        CollaborationExtension.configure({
          onSave: async content => {
            console.log('保存文档:', content)
            await new Promise(resolve => setTimeout(resolve, 1000))
          },
          getCurrentUser: () => ({
            id: 'current-user',
            name: '当前用户',
            color: '#10b981'
          })
        })
      ],
      content: '<p>开始协作编辑...</p>',
      editorProps: {
        attributes: {
          class: 'prose prose-sm sm:prose-base lg:prose-lg xl:prose-xl mx-auto focus:outline-none min-h-[200px] p-4'
        }
      }
    })

    setEditor(editorInstance)

    return () => {
      editorInstance.destroy()
    }
  }, [])

  const handleJoin = () => {
    const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#6366f1', '#8b5cf6', '#ec4899']
    const names = ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十']

    joinCollaboration({
      id: `user-${Date.now()}`,
      name: names[Math.floor(Math.random() * names.length)],
      color: colors[Math.floor(Math.random() * colors.length)]
    })
  }

  const handleSave = () => {
    if (editor) {
      editor.commands.saveDocument()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 头部标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">协作编辑器</h1>
          <p className="text-gray-600">实时协作文档编辑，支持多用户同时编辑</p>
        </div>

        {/* 工具栏 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={handleJoin}
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                加入协作
              </button>

              <button
                onClick={handleSave}
                disabled={saveStatus === 'saving'}
                className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium text-sm rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                {saveStatus === 'saving' ? '保存中...' : '保存文档'}
              </button>
            </div>

            {/* 保存状态指示器 */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">状态:</span>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  saveStatus === 'saved'
                    ? 'bg-green-100 text-green-800'
                    : saveStatus === 'saving'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {saveStatus === 'saved' && (
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
                {saveStatus === 'saving' && (
                  <svg className="animate-spin w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                )}
                {saveStatus === 'error' && (
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
                {saveStatus === 'saved' ? '已保存' : saveStatus === 'saving' ? '保存中' : '保存失败'}
              </span>
            </div>
          </div>
        </div>

        {/* 用户列表 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-medium text-gray-900">协作用户</h3>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {users.length} 人在线
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {users.map(user => (
              <div
                key={user.id}
                className="inline-flex items-center gap-2 bg-gray-50 hover:bg-gray-100 px-3 py-2 rounded-md border border-gray-200 transition-colors duration-200"
              >
                <div
                  className="w-3 h-3 rounded-full border border-white shadow-sm"
                  style={{ backgroundColor: user.color }}
                />
                <span className="text-sm font-medium text-gray-700">{user.name}</span>
                {user.cursor && (
                  <span className="text-xs text-gray-500 bg-gray-200 px-1.5 py-0.5 rounded">
                    {user.cursor.from}-{user.cursor.to}
                  </span>
                )}
                <button
                  onClick={() => leaveCollaboration(user.id)}
                  className="ml-1 inline-flex items-center justify-center w-5 h-5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors duration-200"
                  title="移除用户"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
            {users.length === 0 && <p className="text-sm text-gray-500 italic">暂无协作用户，点击"加入协作"开始</p>}
          </div>
        </div>

        {/* 编辑器容器 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200 px-4 py-2 bg-gray-50">
            <h4 className="text-sm font-medium text-gray-700">文档编辑区</h4>
          </div>

          <div className="p-0">
            <EditorContent editor={editor} className="prose prose-sm sm:prose-base lg:prose-lg max-w-none" />
          </div>
        </div>

        {/* 底部信息 */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">支持 Markdown 语法，自动保存，实时协作</p>
        </div>
      </div>
    </div>
  )
}
