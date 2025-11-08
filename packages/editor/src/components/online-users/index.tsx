import { useEffect, useState } from 'react'
import { WebsocketProvider } from 'y-websocket'

interface User {
  clientId: number
  name: string
  color: string
  avatar?: string
}

interface OnlineUsersProps {
  provider: WebsocketProvider | null
}

export const OnlineUsers = ({ provider }: OnlineUsersProps) => {
  const [users, setUsers] = useState<User[]>([])

  useEffect(() => {
    if (!provider) return

    const awareness = provider.awareness

    const updateUsers = () => {
      const states = awareness.getStates()
      const userList: User[] = []

      states.forEach((state, clientId) => {
        if (state.user) {
          userList.push({
            clientId,
            ...state.user
          })
        }
      })

      setUsers(userList)
    }

    // 初始化
    updateUsers()

    // 监听 awareness 变化
    awareness.on('change', updateUsers)

    return () => {
      awareness.off('change', updateUsers)
    }
  }, [provider])

  if (users.length === 0) {
    return null
  }

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-white border-b border-gray-200 dark:bg-gray-900 dark:border-gray-700">
      <span className="text-sm text-gray-600 dark:text-gray-400">在线用户 ({users.length}):</span>
      <div className="flex gap-2">
        {users.map(user => (
          <div
            key={user.clientId}
            className="flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800"
            title={user.name}
          >
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-6 h-6 rounded-full" />
            ) : (
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: user.color }}
              >
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
