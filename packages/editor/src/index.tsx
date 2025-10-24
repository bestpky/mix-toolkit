import StarterKit from '@tiptap/starter-kit'
import { CollaborationExtension } from './extensions/collaboration'
import Typography from '@tiptap/extension-typography'
import { EditorContent, useEditor } from '@tiptap/react'
import { useEffect, useState } from 'react'
import { User } from './types'

interface CollaborationEditorProps {
  userName?: string
  userColor?: string
  initialContent?: string
}

export function CollaborationEditor({ userName, userColor, initialContent }: CollaborationEditorProps = {}) {
  const [users, setUsers] = useState<User[]>([])
  const [currentUser, setCurrentUser] = useState<User | null>(null)

  const editor = useEditor(
    {
      extensions: [
        StarterKit,
        Typography,
        CollaborationExtension.configure({
          userName,
          userColor
        })
      ],
      content: initialContent || '<p>开始跨标签页协作编辑...</p>',
      editorProps: {
        attributes: {
          class: 'prose prose-sm sm:prose-base lg:prose-lg xl:prose-xl mx-auto focus:outline-none min-h-[400px] p-4'
        }
      }
    },
    [] // 添加空依赖数组，确保只创建一次
  )
  console.log(currentUser, users)
  useEffect(() => {
    if (!editor) {
      console.log('[useEffect] editor 未就绪')
      return
    }

    console.log('[useEffect] editor 已就绪，查找 collaboration extension')
    console.log('[useEffect] 所有 extensions:', editor.extensionManager.extensions.map(e => e.name))

    const collaborationExt = editor.extensionManager.extensions.find(ext => ext.name === 'collaboration')
    console.log('[useEffect] collaboration extension:', collaborationExt)

    const storage = collaborationExt?.storage

    if (!storage) {
      console.log('[useEffect] storage 未找到')
      return
    }

    console.log('[useEffect] storage 已找到:', storage)
    console.log('[useEffect] 初始 users$.value:', storage.users$.value)
    console.log('[useEffect] 初始 currentUser$.value:', storage.currentUser$.value)

    // 订阅用户列表变化
    const usersSubscription = storage.users$.subscribe((newUsers: User[]) => {
      console.log('[useEffect] users$ 更新:', newUsers)
      setUsers(newUsers)
    })

    // 订阅当前用户变化
    const currentUserSubscription = storage.currentUser$.subscribe((user: User | null) => {
      console.log('[useEffect] currentUser$ 更新:', user)
      setCurrentUser(user)
    })

    return () => {
      console.log('[useEffect] 清理订阅')
      usersSubscription.unsubscribe()
      currentUserSubscription.unsubscribe()
    }
  }, [editor])

  // 过滤出其他用户（不包括当前用户）
  const otherUsers = users.filter(user => user.id !== currentUser?.id)

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 头部标题 */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">跨标签页协作编辑器</h1>
          <p className="text-gray-600">实时同步，无需保存。打开多个标签页体验协作效果！</p>
        </div>

        {/* 在线用户状态栏 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            {/* 当前用户信息 */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700">当前用户:</span>
              {currentUser && (
                <div className="inline-flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-md border border-blue-200">
                  <div
                    className="w-3 h-3 rounded-full border-2 border-white shadow-sm"
                    style={{ backgroundColor: currentUser.color }}
                  />
                  <span className="text-sm font-medium text-gray-900">{currentUser.name}</span>
                  <span className="text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">你</span>
                </div>
              )}
            </div>

            {/* 在线人数 */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <div className="absolute inset-0 w-2 h-2 bg-green-500 rounded-full animate-ping opacity-75"></div>
                </div>
                <span className="text-sm font-medium text-gray-700">在线:</span>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                {users.length} 个标签页
              </span>
            </div>
          </div>

          {/* 其他标签页用户列表 */}
          {otherUsers.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <span className="text-sm font-medium text-gray-700">其他协作标签页:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {otherUsers.map(user => (
                  <div
                    key={user.id}
                    className="inline-flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-md border border-gray-200"
                  >
                    <div
                      className="w-3 h-3 rounded-full border border-white shadow-sm"
                      style={{ backgroundColor: user.color }}
                    />
                    <span className="text-sm text-gray-700">{user.name}</span>
                    {user.cursor && (
                      <span className="text-xs text-gray-500 bg-gray-200 px-1.5 py-0.5 rounded" title="光标位置">
                        <svg className="w-3 h-3 inline" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 编辑器容器 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200 px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-900">文档编辑区</h4>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-gray-600">实时同步</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-0">
            <EditorContent editor={editor} className="prose prose-sm sm:prose-base lg:prose-lg max-w-none" />
          </div>
        </div>

        {/* 底部提示信息 */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <div className="flex-1">
              <h5 className="text-sm font-medium text-blue-900 mb-1">使用提示</h5>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• 打开多个标签页（Cmd/Ctrl + T），访问同一个页面体验协作效果</li>
                <li>• 在任意标签页中编辑，其他标签页会实时同步内容</li>
                <li>• 关闭标签页时，该用户会自动从协作列表中移除</li>
                <li>• 所有操作都是本地的，使用 BroadcastChannel API 实现跨标签页通信</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
