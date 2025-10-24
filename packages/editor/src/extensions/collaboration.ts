import { Extension } from '@tiptap/core'
import { BehaviorSubject, Subject, Subscription } from 'rxjs'
import { debounceTime, filter } from 'rxjs/operators'
import { CollaborationStorage, User } from '../types'
import { TabBroadcast, generateTabId, generateRandomColor } from '../utils/broadcast'

interface CollaborationOptions {
  // 当前标签页用户信息（可选，如果不提供则自动生成）
  userName?: string
  userColor?: string
}

export const CollaborationExtension = Extension.create<CollaborationOptions, CollaborationStorage>({
  name: 'collaboration',

  addOptions() {
    return {
      userName: `用户${Math.floor(Math.random() * 1000)}`,
      userColor: generateRandomColor()
    }
  },

  addStorage() {
    // 生成当前标签页的唯一 ID
    const currentTabId = generateTabId()

    // 初始化 RxJS Subjects
    const users$ = new BehaviorSubject<User[]>([])
    const currentUser$ = new BehaviorSubject<User | null>(null)
    const documentChanges$ = new Subject<{ content: any; userId: string }>()
    const cursorUpdates$ = new Subject<{ userId: string; position: { from: number; to: number } }>()
    const subscriptions: Subscription[] = []

    // 初始化跨标签页通信
    const broadcast = new TabBroadcast()

    return {
      currentTabId,
      users$,
      currentUser$,
      documentChanges$,
      cursorUpdates$,
      subscriptions,
      broadcast,

      // 用户管理方法
      addUser: (user: User) => {
        const currentUsers = users$.value
        const existingIndex = currentUsers.findIndex(u => u.id === user.id)

        let newUsers: User[]
        if (existingIndex >= 0) {
          // 更新已存在的用户
          newUsers = [...currentUsers.slice(0, existingIndex), user, ...currentUsers.slice(existingIndex + 1)]
        } else {
          // 添加新用户
          newUsers = [...currentUsers, user]
        }

        users$.next(newUsers)

        // 如果是当前用户，同时更新 currentUser$
        if (user.id === currentTabId) {
          currentUser$.next(user)
        }
      },

      removeUser: (userId: string) => {
        const currentUsers = users$.value
        const filteredUsers = currentUsers.filter(u => u.id !== userId)
        users$.next(filteredUsers)
      },

      updateCursor: (userId: string, position: { from: number; to: number }) => {
        const currentUsers = users$.value
        const userIndex = currentUsers.findIndex(u => u.id === userId)

        if (userIndex >= 0) {
          const updatedUser = {
            ...currentUsers[userIndex],
            cursor: position
          }
          const newUsers = [...currentUsers.slice(0, userIndex), updatedUser, ...currentUsers.slice(userIndex + 1)]
          users$.next(newUsers)

          // 如果是当前用户，同时更新 currentUser$
          if (userId === currentTabId) {
            currentUser$.next(updatedUser)
          }
        }

        cursorUpdates$.next({ userId, position })
      },

      setCurrentUser: (user: User) => {
        currentUser$.next(user)
      },

      getCurrentUser: () => {
        return currentUser$.value
      },

      cleanup: () => {
        // 广播当前用户离开
        const currentUser = currentUser$.value
        if (currentUser) {
          broadcast.send({
            type: 'USER_LEFT',
            payload: { userId: currentUser.id }
          })
        }

        // 关闭广播通道
        broadcast.close()

        // 清理所有订阅
        subscriptions.forEach(subscription => {
          subscription.unsubscribe()
        })
        subscriptions.length = 0

        // 完成所有 Subject
        users$.complete()
        currentUser$.complete()
        documentChanges$.complete()
        cursorUpdates$.complete()
      }
    }
  },

  onCreate() {
    // 创建当前用户
    const currentUser: User = {
      id: this.storage.currentTabId,
      name: this.options.userName || `用户${Math.floor(Math.random() * 1000)}`,
      color: this.options.userColor || generateRandomColor()
    }
    console.log('[onCreate] 创建当前用户:', currentUser)

    this.storage.setCurrentUser(currentUser)
    console.log('[onCreate] setCurrentUser后，currentUser$.value:', this.storage.currentUser$.value)

    // 将当前用户添加到用户列表
    this.storage.addUser(currentUser)
    console.log('[onCreate] addUser后，users$.value:', this.storage.users$.value)

    // 广播当前用户加入
    this.storage.broadcast.send({
      type: 'USER_JOINED',
      payload: currentUser
    })

    // 订阅跨标签页消息
    const broadcastSubscription = this.storage.broadcast.messages$.subscribe(message => {
      switch (message.type) {
        case 'USER_JOINED':
          // 其他标签页用户加入
          this.storage.addUser(message.payload)
          // 回复自己的信息，让新标签页知道自己的存在
          this.storage.broadcast.send({
            type: 'USER_JOINED',
            payload: currentUser
          })
          break

        case 'USER_LEFT':
          // 其他标签页用户离开
          this.storage.removeUser(message.payload.userId)
          break

        case 'CONTENT_CHANGE':
          // 其他标签页的内容变更
          if (message.payload.userId !== currentUser.id) {
            // 更新编辑器内容，但不触发 onUpdate
            this.editor.commands.setContent(message.payload.content)
          }
          break

        case 'CURSOR_UPDATE':
          // 其他标签页的光标更新
          if (message.payload.userId !== currentUser.id) {
            this.storage.updateCursor(message.payload.userId, message.payload.position)
          }
          break
      }
    })

    this.storage.subscriptions.push(broadcastSubscription)

    // 设置内容变更防抖
    const contentChangeSubscription = this.storage.documentChanges$
      .pipe(
        debounceTime(300), // 300ms 防抖
        filter(change => change.userId === currentUser.id) // 只处理当前用户的变更
      )
      .subscribe(change => {
        // 广播内容变更
        this.storage.broadcast.send({
          type: 'CONTENT_CHANGE',
          payload: change
        })
      })

    this.storage.subscriptions.push(contentChangeSubscription)

    // 光标位置防抖
    const cursorUpdateSubscription = this.storage.cursorUpdates$
      .pipe(
        debounceTime(100), // 100ms 防抖
        filter(update => update.userId === currentUser.id)
      )
      .subscribe(update => {
        // 广播光标位置
        this.storage.broadcast.send({
          type: 'CURSOR_UPDATE',
          payload: update
        })
      })

    this.storage.subscriptions.push(cursorUpdateSubscription)

    // 监听页面关闭事件
    const handleBeforeUnload = () => {
      this.storage.broadcast.send({
        type: 'USER_LEFT',
        payload: { userId: currentUser.id }
      })
    }
    window.addEventListener('beforeunload', handleBeforeUnload)

    // 保存事件监听器引用，以便清理
    ;(this.storage as any)._beforeUnloadHandler = handleBeforeUnload
  },

  onUpdate() {
    // 当编辑器内容更新时，发送到防抖队列
    const currentUser = this.storage.getCurrentUser()
    if (this.editor.isFocused && currentUser) {
      const content = this.editor.getJSON()

      // 发送到防抖队列，会在 onCreate 中订阅并广播
      this.storage.documentChanges$.next({
        content,
        userId: currentUser.id
      })
    }
  },

  onSelectionUpdate() {
    // 当光标位置更新时，发送到防抖队列
    const currentUser = this.storage.getCurrentUser()
    if (this.editor.isFocused && currentUser) {
      const { from, to } = this.editor.state.selection

      // 更新本地光标
      this.storage.updateCursor(currentUser.id, { from, to })

      // 发送到防抖队列
      this.storage.cursorUpdates$.next({
        userId: currentUser.id,
        position: { from, to }
      })
    }
  },

  onDestroy() {
    // 移除页面关闭监听器
    const handler = (this.storage as any)._beforeUnloadHandler
    if (handler) {
      window.removeEventListener('beforeunload', handler)
    }

    // 清理资源
    this.storage.cleanup()
  }
})
