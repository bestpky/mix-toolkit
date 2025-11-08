import Collaboration from '@tiptap/extension-collaboration'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import { Awareness } from 'y-protocols/awareness'

export interface CollaborationOptions {
  serverUrl: string
  documentName: string
  user: {
    name: string
    color: string
    avatar?: string
  }
}

export class CollaborationManager {
  public ydoc: Y.Doc
  public provider: WebsocketProvider

  constructor(options: CollaborationOptions) {
    // 创建 Yjs document
    this.ydoc = new Y.Doc()

    // 创建自定义 awareness，设置更短的超时时间（3秒，默认是30秒）
    // 这样当用户离线时，其他客户端会更快地收到更新
    const customAwareness = new Awareness(this.ydoc)
    // 修改 awareness 的超时时间常量
    ;(customAwareness as any).TIMEOUT = 3000

    // 连接到 WebSocket 服务器，使用自定义 awareness
    this.provider = new WebsocketProvider(
      options.serverUrl,
      options.documentName,
      this.ydoc,
      {
        awareness: customAwareness
      }
    )

    // 设置用户信息到 awareness
    this.provider.awareness.setLocalStateField('user', {
      name: options.user.name,
      color: options.user.color,
      avatar: options.user.avatar
    })
  }

  destroy() {
    this.provider.destroy()
    this.ydoc.destroy()
  }
}
