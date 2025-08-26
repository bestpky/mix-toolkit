# 工具杂烩

## 构建

```bash
# 构建所有包
npm run build
```

## 版本管理

```bash
# 升级所有包的版本
npm run version:patch   # 所有包 patch 版本 +1
npm run version:minor   # 所有包 minor 版本 +1
npm run version:major   # 所有包 major 版本 +1

# 升级单个包的版本
node scripts/version.js patch better-lazy-image
node scripts/version.js minor open-modal
```

## 发布

```bash
# 发布所有包
npm run publish

# 发布单个包
node scripts/publish.js better-lazy-image
node scripts/publish.js open-modal

```

## 关于 tsconfig

1. tsconfig.base.json：

   存放所有包共享的编译选项
   修改一次，影响所有包
   保证编译行为的一致性

2. 根目录 tsconfig.json：

   继承基础配置
   添加项目引用和全局路径映射
   作为 tsc -b 的入口点

3. 子包 tsconfig.json：

   继承基础配置
   添加包特定的路径和依赖配置
   用于生成类型声明文件

4. 子包 tsconfig.build.json：

   继承基础配置，但关闭 composite 和 declaration
   专门用于 Rollup 构建 JavaScript 代码
   解决 TypeScript 插件的警告问题
