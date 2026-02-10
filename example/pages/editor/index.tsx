import { MixEditor } from '@pky/editor/src/index'

// 生成随机用户信息
const generateUser = () => {
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8']
  const names = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Henry']

  return {
    name: names[Math.floor(Math.random() * names.length)],
    color: colors[Math.floor(Math.random() * colors.length)]
  }
}

const currentUser = generateUser()

export const EditorPage = () => {
  const { name, color } = currentUser
  return (
    <MixEditor
      collaboration={{
        enabled: true,
        serverUrl: 'ws://localhost:1234',
        documentName: 'my-document',
        user: {
          name,
          color
        }
      }}
    />
  )
}
