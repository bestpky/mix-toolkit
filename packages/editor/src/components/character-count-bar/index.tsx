import { Editor } from '@tiptap/core'
import { useObservable } from '../../hooks/use-observable'
import type { EditorWithExtensions } from '../../types/editor'
import { useEffect } from 'react'

export const CharacterCountBar = (props: { editor: Editor | null }) => {
  const { editor } = props

  if (!editor) {
    return null
  }

  const typedEditor = editor as EditorWithExtensions
  const characterCountStore = typedEditor.storage.characterCount.characterCountStore
  const result = useObservable(characterCountStore?.store$)

  useEffect(() => {
    if (!characterCountStore) {
      return
    }
    return characterCountStore.init()
  }, [characterCountStore])

  const isInit = characterCountStore?.isInit

  return (
    isInit && (
      <div className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400">
        <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <span className="font-medium">字数:</span>
        <span className="font-semibold text-gray-900 dark:text-gray-100">{result?.words}</span>
        <span className="text-xs text-gray-500 dark:text-gray-500">字</span>
        <span className="font-medium">字符(不包含空格):</span>
        <span className="font-semibold text-gray-900 dark:text-gray-100">{result?.charsWithoutSpaces}</span>
        <span className="text-xs text-gray-500 dark:text-gray-500">字</span>
        <span className="font-medium">字符(包含空格):</span>
        <span className="font-semibold text-gray-900 dark:text-gray-100">{result?.charsIncludingSpaces}</span>
        <span className="text-xs text-gray-500 dark:text-gray-500">字</span>
      </div>
    )
  )
}
