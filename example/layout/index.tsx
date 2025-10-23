import { Link, Outlet, useLocation } from 'react-router'

export const Layout = () => {
  const location = useLocation()

  const navItems = [
    {
      to: '/open-modal',
      title: 'Open Modal',
      description: '模态框组件',
      icon: '🪟',
    },
    {
      to: '/better-lazy-image',
      title: 'Lazy Image',
      description: '图片懒加载',
      icon: '🖼️',
    },
    {
      to: '/editor',
      title: 'Editor',
      description: '富文本编辑器',
      icon: '✏️',
    },
  ]

  const isActive = (path: string) => location.pathname === path

  return (
    <div className="flex h-screen bg-gray-50">
      {/* 左侧导航栏 */}
      <aside className="w-72 bg-gradient-to-b from-amber-50 to-yellow-100 shadow-xl flex flex-col">
        {/* Logo 区域 */}
        <div className="px-8 py-10">
          <Link to="/" className="block group">
            <div className="flex items-center space-x-3 mb-2">
              <div className="text-3xl">🎨</div>
              <h1 className="text-2xl font-bold text-amber-900 group-hover:text-amber-700 transition-colors">
                Mix Toolkit
              </h1>
            </div>
            <p className="text-sm text-amber-700 ml-12">
              组件库示例集合
            </p>
          </Link>
        </div>

        {/* 导航菜单 */}
        <nav className="flex-1 overflow-y-auto px-6 pb-6">
          <div className="space-y-3">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`
                  block px-5 py-4 rounded-xl transition-all duration-200
                  ${
                    isActive(item.to)
                      ? 'bg-amber-400 text-amber-900 shadow-lg shadow-amber-500/30 scale-105'
                      : 'bg-white/60 text-amber-800 hover:bg-white hover:shadow-md hover:scale-102'
                  }
                `}
              >
                <div className="flex items-center space-x-4">
                  <span className={`text-3xl transition-transform ${isActive(item.to) ? 'scale-110' : ''}`}>
                    {item.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold truncate ${isActive(item.to) ? 'text-amber-900' : 'text-amber-900'}`}>
                      {item.title}
                    </p>
                    <p className={`text-xs mt-0.5 truncate ${isActive(item.to) ? 'text-amber-800' : 'text-amber-700/80'}`}>
                      {item.description}
                    </p>
                  </div>
                  {isActive(item.to) && (
                    <div className="flex-shrink-0">
                      <svg className="w-5 h-5 text-amber-900" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </nav>

        {/* 底部信息 */}
        <div className="px-8 py-6 border-t border-amber-200/50">
          <div className="bg-white/50 rounded-lg px-4 py-3 text-center">
            <p className="text-xs font-medium text-amber-800">
              Version 1.0.0
            </p>
            <p className="text-xs text-amber-600 mt-1">
              Built with React
            </p>
          </div>
        </div>
      </aside>

      {/* 右侧内容区域 */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
