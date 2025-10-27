import StarterKit from '@tiptap/starter-kit'
import Typography from '@tiptap/extension-typography'
import Placeholder from '@tiptap/extension-placeholder'
import { EditorContent, useEditor } from '@tiptap/react'
import styles from './styles.module.scss'

export function MixEditor() {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6]
        }
      }),
      Typography,
      Placeholder.configure({
        placeholder: '开始创作...',
        emptyEditorClass: 'is-editor-empty'
      })
    ],
    content: '<p></p>',
    editorProps: {
      attributes: {
        class: 'focus:outline-none'
      }
    }
  })

  return (
    <div className={styles.wrapper}>
      <div className={styles.container}>
        <div className={styles.editor}>
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  )
}
