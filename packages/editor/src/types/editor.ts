import type { Editor as TiptapEditor } from '@tiptap/core'
import type { CharacterCountStorage } from '../extensions/character-count'

export interface EditorWithExtensions extends TiptapEditor {
  storage: TiptapEditor['storage'] & {
    characterCount: CharacterCountStorage
  }
}
