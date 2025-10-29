import StarterKit from '@tiptap/starter-kit'
import Typography from '@tiptap/extension-typography'
import Placeholder from '@tiptap/extension-placeholder'
import { EditorContent, useEditor } from '@tiptap/react'
import { Toolbar } from './components/toolbar'
import styles from './styles.module.scss'
import { CharacterCountBar } from './components/character-count-bar'
import { CharacterCount } from './extensions/character-count'

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
        placeholder: '开始创作...'
      }),
      CharacterCount
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
      <CharacterCountBar editor={editor} />
      <Toolbar editor={editor} />
      <div className={styles.container}>
        <div className={styles.editor}>
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  )
}
