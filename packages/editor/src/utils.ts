import { Editor } from '@tiptap/core'
import { CollaborationStorage } from './types'

export function getCollaborationStorage(editor: Editor): CollaborationStorage | null {
  const collaborationExt = editor.extensionManager.extensions.find(ext => ext.name === 'collaboration')

  if (!collaborationExt) {
    return null
  }

  return (collaborationExt as any).storage as CollaborationStorage
}

export function getCollaborationState(editor: Editor) {
  const collaborationExt = editor.extensionManager.extensions.find(ext => ext.name === 'collaboration')

  if (!collaborationExt) {
    return { users: [], saveStatus: 'saved' as const }
  }

  const storage = (collaborationExt as any).storage as CollaborationStorage
  return {
    users: storage.users$.value,
    saveStatus: storage.saveStatus$.value
  }
}
