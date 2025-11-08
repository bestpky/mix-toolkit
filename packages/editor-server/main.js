import { WebSocketServer } from 'ws'
import * as Y from 'yjs'
import * as awarenessProtocol from 'y-protocols/awareness'
import * as syncProtocol from 'y-protocols/sync'
import * as encoding from 'lib0/encoding'
import * as decoding from 'lib0/decoding'

const port = 1234
const wss = new WebSocketServer({ port })

console.log(`🚀 WebSocket server running on ws://localhost:${port}`)

// 消息类型常量 (y-protocols 标准)
const messageSync = 0
const messageAwareness = 1

// 存储文档和 awareness 实例
const docs = new Map()

// 获取或创建文档
const getYDoc = docname => {
  if (!docs.has(docname)) {
    const doc = new Y.Doc()
    const awareness = new awarenessProtocol.Awareness(doc)

    docs.set(docname, {
      doc,
      awareness,
      connections: new Set()
    })

    console.log(`📄 Created new document: ${docname}`)
  }
  return docs.get(docname)
}

wss.on('connection', (ws, req) => {
  console.log('📝 New client connected')

  // 解析 URL 获取文档名称
  const url = new URL(req.url || '/', `http://${req.headers.host}`)
  const docname = url.searchParams.get('room') || url.pathname.slice(1) || 'default-room'

  const docData = getYDoc(docname)
  const { doc, awareness, connections } = docData

  // 添加到连接集合
  connections.add(ws)
  ws.docname = docname

  // 存储客户端的 awareness clientID
  let clientID = null

  // 监听文档更新并广播给其他客户端
  const updateHandler = (update, origin) => {
    if (origin !== ws) {
      const encoder = encoding.createEncoder()
      encoding.writeVarUint(encoder, messageSync)
      syncProtocol.writeUpdate(encoder, update)
      ws.send(encoding.toUint8Array(encoder))
    }
  }
  doc.on('update', updateHandler)

  // 监听 awareness 变化并广播
  const awarenessChangeHandler = ({ added, updated, removed }) => {
    const changedClients = added.concat(updated).concat(removed)
    const awarenessEncoder = encoding.createEncoder()
    encoding.writeVarUint(awarenessEncoder, messageAwareness)
    encoding.writeVarUint8Array(
      awarenessEncoder,
      awarenessProtocol.encodeAwarenessUpdate(awareness, changedClients)
    )
    const message = encoding.toUint8Array(awarenessEncoder)

    connections.forEach(client => {
      if (client !== ws && client.readyState === client.OPEN) {
        client.send(message)
      }
    })
  }
  awareness.on('change', awarenessChangeHandler)

  // 发送初始同步消息
  const encoder = encoding.createEncoder()
  encoding.writeVarUint(encoder, messageSync)
  syncProtocol.writeSyncStep1(encoder, doc)
  ws.send(encoding.toUint8Array(encoder))

  // 发送当前 awareness 状态
  const awarenessStates = awareness.getStates()
  if (awarenessStates.size > 0) {
    const awarenessEncoder = encoding.createEncoder()
    encoding.writeVarUint(awarenessEncoder, messageAwareness)
    encoding.writeVarUint8Array(
      awarenessEncoder,
      awarenessProtocol.encodeAwarenessUpdate(awareness, Array.from(awarenessStates.keys()))
    )
    ws.send(encoding.toUint8Array(awarenessEncoder))
  }

  // 处理客户端消息
  ws.on('message', message => {
    try {
      const decoder = decoding.createDecoder(new Uint8Array(message))
      const messageType = decoding.readVarUint(decoder)

      switch (messageType) {
        case messageSync:
          // 同步消息
          const syncEncoder = encoding.createEncoder()
          encoding.writeVarUint(syncEncoder, messageSync)
          syncProtocol.readSyncMessage(decoder, syncEncoder, doc, ws)

          if (encoding.length(syncEncoder) > 1) {
            ws.send(encoding.toUint8Array(syncEncoder))
          }
          break

        case messageAwareness:
          // Awareness 消息 - applyAwarenessUpdate 会触发 'change' 事件，自动广播
          const update = decoding.readVarUint8Array(decoder)
          awarenessProtocol.applyAwarenessUpdate(awareness, update, ws)

          // 从 awareness update 中提取客户端 ID
          if (clientID === null) {
            const decoder2 = decoding.createDecoder(update)
            const len = decoding.readVarUint(decoder2)
            if (len > 0) {
              clientID = decoding.readVarUint(decoder2)
              console.log(`📍 Captured clientID: ${clientID}`)
            }
          }
          break
      }
    } catch (error) {
      console.error('❌ 处理消息时出错:', error)
    }
  })

  ws.on('close', () => {
    console.log('👋 Client disconnected', clientID ? `(clientID: ${clientID})` : '(no clientID)')

    // 从连接集合中移除
    connections.delete(ws)

    // 立即移除该客户端的 awareness 状态（在移除监听器之前）
    if (clientID !== null) {
      console.log(`🧹 Removing awareness state for client ${clientID}`)
      awarenessProtocol.removeAwarenessStates(awareness, [clientID], null)
    }

    // 移除监听器
    doc.off('update', updateHandler)
    awareness.off('change', awarenessChangeHandler)
  })

  ws.on('error', error => {
    console.error('❌ WebSocket error:', error)
  })
})

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...')
  wss.close(() => {
    process.exit(0)
  })
})
