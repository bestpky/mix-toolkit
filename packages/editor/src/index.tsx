import './index.css'
import { useState, useEffect } from 'react'
import StarterKit from '@tiptap/starter-kit'
import Typography from '@tiptap/extension-typography'
import Placeholder from '@tiptap/extension-placeholder'
import { EditorContent, useEditor } from '@tiptap/react'
import { Toolbar } from './components/toolbar'
import styles from './styles.module.scss'
import { CharacterCountBar } from './components/character-count-bar'
import { CharacterCount } from './extensions/character-count'
import './styles/collaboration.scss'
import { CollaborationManager } from './extensions/collaboration'
import { OnlineUsers } from './components/online-users'
import Collaboration from '@tiptap/extension-collaboration'
interface MixEditorProps {
  // 协同配置
  collaboration?: {
    enabled: boolean
    serverUrl: string
    documentName: string
    user: {
      name: string
      color: string
      avatar?: string
    }
  }
}

export function MixEditor({ collaboration }: MixEditorProps) {
  const [collabManager, setCollabManager] = useState<CollaborationManager | null>(null)

  // 初始化协同管理器
  useEffect(() => {
    if (collaboration?.enabled) {
      const manager = new CollaborationManager({
        serverUrl: collaboration.serverUrl,
        documentName: collaboration.documentName,
        user: collaboration.user
      })

      setCollabManager(manager)

      return () => {
        manager.destroy()
      }
    } else {
      setCollabManager(null)
    }
  }, [collaboration?.enabled, collaboration?.serverUrl, collaboration?.documentName])

  const extensions = [
    StarterKit.configure({
      // 当启用协作时禁用历史记录，因为 Yjs 有自己的 undo/redo
      // history: !collaboration?.enabled,
      heading: {
        levels: [1, 2, 3, 4, 5, 6]
      }
    }),
    Typography,
    Placeholder.configure({
      placeholder: '开始创作...'
    }),
    CharacterCount,
    // 添加协同扩展
    collabManager
      ? Collaboration.configure({
          document: collabManager.ydoc
        })
      : null
  ].filter(v => v !== null)

  const editor = useEditor(
    {
      extensions,
      // 只有在非协作模式或协作管理器已就绪时才设置初始内容
      content: collabManager ? undefined : '<p></p>',
      editorProps: {
        attributes: {
          class: 'focus:outline-none'
        }
      }
    },
    [collabManager, collaboration?.enabled]
  )

  return (
    <div className={styles.wrapper}>
      {/* 在线用户列表 */}
      {collabManager && <OnlineUsers provider={collabManager.provider} />}
      <Toolbar editor={editor} />
      <div className={styles.container}>
        <div className={styles.editor}>
          <EditorContent editor={editor} />
        </div>
      </div>
      <CharacterCountBar editor={editor} />
    </div>
  )
}
