import { Extension } from '@tiptap/core'
import { BehaviorSubject, Subject, Subscription } from 'rxjs'
import { debounceTime, distinctUntilChanged } from 'rxjs/operators'
import type { Editor } from '@tiptap/core'
import { CollaborationStorage, User } from '../types'

interface CollaborationOptions {
  // 可选配置
  saveDebounceTime?: number
  onSave?: (content: any) => Promise<void>
  getCurrentUser?: () => User | null
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    collaboration: {
      /**
       * 加入协作
       */
      joinCollaboration: (user: User) => ReturnType
      /**
       * 离开协作
       */
      leaveCollaboration: (userId: string) => ReturnType
      /**
       * 手动保存文档
       */
      saveDocument: () => ReturnType
      /**
       * 获取协作状态
       */
      getCollaborationState: () => ReturnType
      /**
       * 更新当前用户光标
       */
      updateMyCursor: () => ReturnType
    }
  }
}

export const CollaborationExtension = Extension.create<CollaborationOptions, CollaborationStorage>({
  name: 'collaboration',

  addOptions() {
    return {
      saveDebounceTime: 2000,
      onSave: async (content: any) => {
        // 默认的保存实现
        return new Promise<void>(resolve => setTimeout(resolve, 1000))
      },
      getCurrentUser: (): User | null => {
        // 默认用户
        return {
          id: 'user-1',
          name: '张三',
          color: '#FF6B6B'
        }
      }
    }
  },

  addStorage() {
    // 初始化 RxJS Subjects
    const users$ = new BehaviorSubject<User[]>([])
    const documentChanges$ = new Subject<{ content: any; timestamp: number }>()
    const cursorUpdates$ = new Subject<{ userId: string; position: { from: number; to: number } }>()
    const saveStatus$ = new BehaviorSubject<'saved' | 'saving' | 'error'>('saved')
    const subscriptions: Subscription[] = []

    return {
      users$,
      documentChanges$,
      cursorUpdates$,
      saveStatus$,
      subscriptions,

      // 用户管理方法
      addUser: (user: User) => {
        const currentUsers = users$.value
        const existingIndex = currentUsers.findIndex(u => u.id === user.id)

        if (existingIndex >= 0) {
          currentUsers[existingIndex] = user
        } else {
          currentUsers.push(user)
        }

        users$.next([...currentUsers])
      },

      removeUser: (userId: string) => {
        const currentUsers = users$.value
        const filteredUsers = currentUsers.filter(u => u.id !== userId)
        users$.next(filteredUsers)
      },

      updateCursor: (userId: string, position: { from: number; to: number }) => {
        // 更新用户光标位置
        const currentUsers = users$.value
        const userIndex = currentUsers.findIndex(u => u.id === userId)

        if (userIndex >= 0) {
          currentUsers[userIndex] = {
            ...currentUsers[userIndex],
            cursor: position
          }
          users$.next([...currentUsers])
        }

        // 发送光标更新事件
        cursorUpdates$.next({ userId, position })
      },

      emitDocumentChange: (content: any) => {
        documentChanges$.next({
          content,
          timestamp: Date.now()
        })
      },

      cleanup: () => {
        // 清理所有订阅
        subscriptions.forEach(subscription => {
          subscription.unsubscribe()
        })
        subscriptions.length = 0

        // 完成所有 Subject
        users$.complete()
        documentChanges$.complete()
        cursorUpdates$.complete()
        saveStatus$.complete()
      }
    }
  },

  onCreate() {
    // 设置自动保存订阅
    const saveSubscription = this.storage.documentChanges$
      .pipe(
        debounceTime(this.options.saveDebounceTime || 2000),
        distinctUntilChanged((prev, curr) => JSON.stringify(prev.content) === JSON.stringify(curr.content))
      )
      .subscribe(async change => {
        try {
          this.storage.saveStatus$.next('saving')

          // 调用配置的保存方法
          if (this.options.onSave) {
            await this.options.onSave(change.content)
          }

          this.storage.saveStatus$.next('saved')
        } catch (error) {
          this.storage.saveStatus$.next('error')
          console.error('保存失败:', error)
        }
      })

    // 保存订阅引用以便清理
    this.storage.subscriptions.push(saveSubscription)
  },

  onUpdate() {
    // 当编辑器内容更新时，发送变更
    if (this.editor.isFocused) {
      this.storage.emitDocumentChange(this.editor.getJSON())
    }
  },

  onSelectionUpdate() {
    // 当光标位置更新时
    if (this.editor.isFocused) {
      const { from, to } = this.editor.state.selection
      const currentUser = this.options.getCurrentUser?.()

      if (currentUser) {
        this.storage.updateCursor(currentUser.id, { from, to })
      }
    }
  },

  onDestroy() {
    // 组件销毁时清理资源
    this.storage.cleanup()
  },

  // 添加命令
  addCommands() {
    return {
      joinCollaboration: (user: User) => () => {
        this.storage.addUser(user)
        return true
      },

      leaveCollaboration: (userId: string) => () => {
        this.storage.removeUser(userId)
        return true
      },

      // 手动触发保存
      saveDocument: () => () => {
        const content = this.editor.getJSON()
        this.storage.emitDocumentChange(content)
        return true
      },

      updateMyCursor: () => () => {
        const { from, to } = this.editor.state.selection
        const currentUser = this.options.getCurrentUser?.()

        if (currentUser) {
          this.storage.updateCursor(currentUser.id, { from, to })
        }
        return true
      }
    }
  }
})

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
