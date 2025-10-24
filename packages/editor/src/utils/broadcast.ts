import { Subject } from 'rxjs'
import { User } from '../types'

export type BroadcastMessage =
  | { type: 'USER_JOINED'; payload: User }
  | { type: 'USER_LEFT'; payload: { userId: string } }
  | { type: 'CONTENT_CHANGE'; payload: { content: any; userId: string } }
  | { type: 'CURSOR_UPDATE'; payload: { userId: string; position: { from: number; to: number } } }
  | { type: 'HEARTBEAT'; payload: { userId: string } }

export class TabBroadcast {
  private channel: BroadcastChannel
  private message$ = new Subject<BroadcastMessage>()

  constructor(channelName: string = 'tiptap-collaboration') {
    this.channel = new BroadcastChannel(channelName)

    this.channel.onmessage = (event) => {
      this.message$.next(event.data as BroadcastMessage)
    }
  }

  send(message: BroadcastMessage) {
    this.channel.postMessage(message)
  }

  get messages$() {
    return this.message$.asObservable()
  }

  close() {
    this.channel.close()
    this.message$.complete()
  }
}

// 生成唯一的标签页 ID
export function generateTabId(): string {
  return `tab-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

// 生成随机颜色
export function generateRandomColor(): string {
  const colors = [
    '#ef4444', '#f97316', '#eab308', '#22c55e',
    '#06b6d4', '#6366f1', '#8b5cf6', '#ec4899',
    '#10b981', '#3b82f6', '#a855f7', '#f43f5e'
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}
