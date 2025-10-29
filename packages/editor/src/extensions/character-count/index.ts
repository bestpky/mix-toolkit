import { Extension } from '@tiptap/core'
import { CharacterCountStore } from './utils'

interface CharacterCountOptions {
  debounceTime?: number
}

export interface CharacterCountStorage {
  characterCountStore?: CharacterCountStore
}

export const CharacterCount = Extension.create<CharacterCountOptions, CharacterCountStorage>({
  name: 'characterCount',

  addOptions() {
    return {
      debounceTime: 500
    }
  },

  addStorage() {
    return {}
  },

  onBeforeCreate() {
    this.storage.characterCountStore = new CharacterCountStore(this.editor, this.options.debounceTime)
  }
})
