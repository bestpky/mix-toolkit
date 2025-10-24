import { BehaviorSubject, Subject, Subscription } from 'rxjs'
import { TabBroadcast } from './utils/broadcast'

export interface User {
  id: string
  name: string
  color: string
  cursor?: { from: number; to: number }
}

export interface CollaborationStorage {
  // 当前标签页 ID
  currentTabId: string

  // 用户列表流
  users$: BehaviorSubject<User[]>

  // 当前用户流
  currentUser$: BehaviorSubject<User | null>

  // 文档变更流
  documentChanges$: Subject<{ content: any; userId: string }>

  // 光标位置流
  cursorUpdates$: Subject<{ userId: string; position: { from: number; to: number } }>

  // 订阅管理
  subscriptions: Subscription[]

  // 跨标签页通信
  broadcast: TabBroadcast

  // 方法
  addUser: (user: User) => void
  removeUser: (userId: string) => void
  updateCursor: (userId: string, position: { from: number; to: number }) => void
  setCurrentUser: (user: User) => void
  getCurrentUser: () => User | null
  cleanup: () => void
}
