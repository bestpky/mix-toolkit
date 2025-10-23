import { BehaviorSubject, Subject, Subscription } from 'rxjs'

export interface User {
  id: string
  name: string
  color: string
  cursor?: { from: number; to: number }
}

export interface CollaborationStorage {
  // 用户列表流
  users$: BehaviorSubject<User[]>

  // 文档变更流
  documentChanges$: Subject<{ content: any; timestamp: number }>

  // 光标位置流
  cursorUpdates$: Subject<{ userId: string; position: { from: number; to: number } }>

  // 保存状态流
  saveStatus$: BehaviorSubject<'saved' | 'saving' | 'error'>

  // 订阅管理
  subscriptions: Subscription[]

  // 方法
  addUser: (user: User) => void
  removeUser: (userId: string) => void
  updateCursor: (userId: string, position: { from: number; to: number }) => void
  emitDocumentChange: (content: any) => void
  cleanup: () => void
}
