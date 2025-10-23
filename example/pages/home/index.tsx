export const HomePage = () => {
  return (
    <div className="flex items-center justify-center h-full bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center px-8">
        <div className="mb-8">
          <div className="text-6xl mb-4">🎨</div>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            欢迎使用 Mix Toolkit
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            这是一个现代化的 React 组件库示例集合
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 max-w-4xl mx-auto">
          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="text-3xl mb-3">⚡</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">高性能</h3>
            <p className="text-sm text-gray-600">
              优化的组件性能，提供流畅的用户体验
            </p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="text-3xl mb-3">🎯</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">易用性</h3>
            <p className="text-sm text-gray-600">
              简洁的 API 设计，快速上手使用
            </p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="text-3xl mb-3">🔧</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">可定制</h3>
            <p className="text-sm text-gray-600">
              灵活的配置选项，满足不同需求
            </p>
          </div>
        </div>

        <div className="mt-12">
          <p className="text-gray-500 text-sm">
            请从左侧导航栏选择要查看的组件示例 👈
          </p>
        </div>
      </div>
    </div>
  )
}
