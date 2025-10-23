import { Editor } from '@tiptap/core'
import { useState, useEffect, useCallback } from 'react'
import { User } from '../types'
import { getCollaborationState, getCollaborationStorage } from '../utils'

export function useCollaboration(editor: Editor | null) {
  const [users, setUsers] = useState<User[]>([])
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved')

  useEffect(() => {
    if (!editor) return

    const storage = getCollaborationStorage(editor)
    if (!storage) return

    // 订阅用户列表变化
    const usersSubscription = storage.users$.subscribe(setUsers)

    // 订阅保存状态变化
    const saveStatusSubscription = storage.saveStatus$.subscribe(setSaveStatus)

    // 订阅光标更新（可选）
    const cursorSubscription = storage.cursorUpdates$.subscribe(({ userId, position }) => {
      console.log(`用户 ${userId} 光标位置:`, position)
    })

    return () => {
      usersSubscription.unsubscribe()
      saveStatusSubscription.unsubscribe()
      cursorSubscription.unsubscribe()
    }
  }, [editor])

  const joinCollaboration = useCallback(
    (user: User) => {
      editor?.commands.joinCollaboration(user)
    },
    [editor]
  )

  const leaveCollaboration = useCallback(
    (userId: string) => {
      editor?.commands.leaveCollaboration(userId)
    },
    [editor]
  )

  const saveDocument = useCallback(() => {
    editor?.commands.saveDocument()
  }, [editor])

  const updateMyCursor = useCallback(() => {
    editor?.commands.updateMyCursor()
  }, [editor])

  // 获取当前状态的方法
  const getCurrentState = useCallback(() => {
    if (!editor) return { users: [], saveStatus: 'saved' as const }
    return getCollaborationState(editor)
  }, [editor])

  return {
    users,
    saveStatus,
    joinCollaboration,
    leaveCollaboration,
    saveDocument,
    updateMyCursor,
    getCurrentState
  }
}
