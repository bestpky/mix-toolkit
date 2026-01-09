# Mix-Toolkit Monorepo 架构详解

## 📋 目录

- [项目概述](#项目概述)
  - [技术栈](#技术栈)
  - [项目结构](#项目结构)
- [Monorepo 架构](#monorepo-架构)
  - [为什么选择 Monorepo？](#为什么选择-monorepo)
  - [pnpm workspace 配置](#pnpm-workspace-配置)
- [核心配置文件详解](#核心配置文件详解)
  - [vite.config.js - 开发服务器配置](#viteconfigjs---开发服务器配置)
  - [tsconfig.json - 根配置](#tsconfigjson---根配置)
  - [tsconfig.base.json - 基础配置](#tsconfigbasejson---基础配置)
  - [rollup.config.js - 打包配置](#rollupconfigjs---打包配置)
  - [包级别的 tsconfig](#包级别的-tsconfig)
- [TypeScript 配置的完整使用场景](#typescript-配置的完整使用场景)
  - [配置文件层级关系](#配置文件层级关系)
  - [场景 1：IDE 类型检查](#场景-1ide-类型检查vscodexebstorm)
  - [场景 2：命令行类型检查](#场景-2命令行类型检查tsc---noemit)
  - [场景 3：构建时类型声明生成](#场景-3构建时类型声明生成tsc--b)
  - [场景 4：Rollup 打包](#场景-4rollup-打包rollup--c)
  - [场景 5：用户安装后的类型提示](#场景-5用户安装后的类型提示)
  - [配置文件使用矩阵](#配置文件使用矩阵)
  - [常见问题解答](#常见问题解答)
    - [Q1: 为什么 IDE 有时找不到类型？](#q1-为什么-ide-有时找不到类型)
    - [Q2: 为什么需要两个 tsconfig？](#q2-为什么需要两个-tsconfig)
    - [Q3: composite: true 有什么用？](#q3-composite-true-有什么用)
    - [Q4: declarationMap 的作用？](#q4-declarationmap-的作用)
    - [Q5: 为什么 Rollup 要关闭 declaration？](#q5-为什么-rollup-要关闭-declaration)
    - [Q6: paths 和 references 有什么区别？](#q6-paths-和-references-有什么区别)
    - [Q7: composite 和 references 有什么关系？](#q7-composite-和-references-有什么关系)
    - [Q8: paths 是编译时映射还是运行时映射？](#q8-paths-是编译时映射还是运行时映射)
- [开发环境使用](#开发环境使用)
  - [1. 安装依赖](#1-安装依赖)
  - [2. 启动开发服务器](#2-启动开发服务器)
  - [3. 开发体验](#3-开发体验)
  - [4. 跨包开发](#4-跨包开发)
- [构建与发布流程](#构建与发布流程)
  - [构建流程](#构建流程)
  - [版本管理](#版本管理)
  - [发布流程](#发布流程)
- [最佳实践与设计亮点](#最佳实践与设计亮点)
  - [1. 类型系统设计](#1-类型系统设计)
  - [2. 样式方案设计](#2-样式方案设计)
  - [3. 构建性能优化](#3-构建性能优化)
  - [4. Monorepo 最佳实践](#4-monorepo-最佳实践)
  - [5. 值得学习的设计](#5-值得学习的设计)
- [总结](#总结)

---

## 项目概述

Mix-Toolkit 是一个基于 **pnpm workspace** 的 TypeScript Monorepo 项目，包含多个可独立发布的 npm 包。

### 技术栈

- **包管理**: pnpm workspace
- **构建工具**: Rollup (生产构建) + Vite (开发环境)
- **类型系统**: TypeScript Project References
- **样式方案**: Tailwind CSS + SCSS Modules
- **框架**: React 19

### 项目结构

```
mix-toolkit/
├── packages/                    # 所有子包
│   ├── canvas-editor/          # Canvas 2D 图案编辑器
│   ├── editor/                 # 富文本编辑器 (TipTap)
│   ├── editor-server/          # WebSocket 协同服务器
│   ├── better-lazy-image/      # 图片懒加载组件
│   ├── open-modal/             # 弹窗组件
│   ├── hooks/                  # React Hooks 工具集
│   └── utils/                  # 通用工具函数
├── example/                    # 开发示例应用
├── scripts/                    # 构建脚本
│   ├── build.js               # 构建所有包
│   ├── publish.js             # 发布到 npm
│   ├── version.js             # 版本管理
│   └── utils.js               # 脚本工具函数
├── vite.config.js             # 开发服务器配置
├── tsconfig.json              # 根 TS 配置（项目引用）
├── tsconfig.base.json         # 基础 TS 配置（共享）
├── rollup.config.js           # Rollup 打包配置
├── pnpm-workspace.yaml        # pnpm workspace 配置
└── package.json               # 根 package.json
```

---

## Monorepo 架构

### 为什么选择 Monorepo？

1. **代码共享**: 所有包可以轻松引用 monorepo 内其他包
2. **统一工具链**: 共享构建配置、依赖版本
3. **原子提交**: 跨包改动可以在一个 commit 中完成
4. **类型安全**: TypeScript Project References 提供跨包类型检查

### pnpm workspace 配置

```yaml
# pnpm-workspace.yaml
packages:
  - 'packages/*'
```

这个简单的配置告诉 pnpm：

- `packages/*` 下的所有目录都是独立的工作空间包
- 包之间可以通过 `workspace:` 协议互相依赖

---

## 核心配置文件详解

### vite.config.js - 开发服务器配置

```javascript
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  root: resolve(__dirname, './example'), // 🔥 关键：将 example 作为根目录
  plugins: [react()],
  resolve: {
    alias: {
      '@mix-toolkit': resolve(__dirname, './packages') // 🔥 别名映射
    }
  }
})
```

#### 作用

**开发时的热重载服务器**，专门为 `example/` 示例应用服务。

#### 设计亮点

1. **Root 设置为 example**

   - Vite 会把 `example/index.html` 作为入口
   - 开发时访问 `http://localhost:5173` 直接看到示例应用

2. **别名映射**

   ```javascript
   // example 中可以这样引用
   import { Stage } from '@mix-toolkit/canvas-editor/src'
   ```

   - `@mix-toolkit` → `./packages`
   - 直接引用源码，支持热更新
   - 无需构建即可实时预览修改

3. **为什么不直接用打包后的 dist？**
   - 开发体验：修改源码立即生效，无需重新构建
   - 调试方便：保留完整的 source map
   - 类型提示：IDE 可以直接跳转到源码定义

#### 开发流程

```bash
npm run dev
# → 启动 Vite 服务器
# → 监听 example/ 和 packages/ 的文件变化
# → 浏览器自动热更新
```

---

### tsconfig.json - 根配置

```json
{
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    "baseUrl": "."
  },
  "references": [
    { "path": "./packages/better-lazy-image" },
    { "path": "./packages/open-modal" },
    { "path": "./packages/utils" },
    { "path": "./packages/hooks" },
    { "path": "./packages/editor" },
    { "path": "./packages/canvas-editor" }
  ],
  "files": [] // 🔥 空文件列表，只做引用管理
}
```

#### 作用

**Monorepo 的类型系统协调器**，使用 TypeScript Project References。

#### 关键概念：Project References

这是 TypeScript 为 Monorepo 设计的特性：

1. **声明依赖关系**

   ```json
   "references": [{ "path": "./packages/utils" }]
   ```

   告诉 TypeScript："我依赖这个项目"

2. **增量编译**

   - `tsc -b` 只编译有变化的包
   - 构建速度提升 10 倍以上（大型项目）

3. **跨包类型检查**
   ```typescript
   // packages/canvas-editor/src/index.tsx
   import { debounce } from '@mix-toolkit/utils' // ✅ 类型正确
   ```
   TypeScript 会检查 `utils` 包的类型定义

#### 为什么 files: []？

- 根配置不编译任何文件
- 只负责协调子项目的编译顺序
- 实际编译由各个包的 `tsconfig.json` 处理

---

### tsconfig.base.json - 基础配置

```json
{
  "compilerOptions": {
    "target": "ES2020", // 目标语法
    "module": "ESNext", // 输出 ESM 模块
    "lib": ["ES2020", "DOM"], // 包含的库定义
    "moduleResolution": "node", // Node.js 模块解析
    "strict": true, // 严格模式
    "esModuleInterop": true, // CommonJS/ESM 互操作
    "skipLibCheck": true, // 跳过库文件检查（提升性能）
    "forceConsistentCasingInFileNames": true,

    // 🔥 关键配置
    "declaration": true, // 生成 .d.ts 文件
    "declarationMap": true, // 生成声明文件的 source map
    "sourceMap": false, // 不生成 JS source map（Rollup 负责）
    "composite": true // 启用项目引用支持
  }
}
```

#### 作用

**所有子包共享的 TypeScript 基础配置**。

#### 关键配置解析

1. **`composite: true`**

   - 启用 Project References
   - 必须配置 `declaration: true`
   - 生成 `.tsbuildinfo` 缓存文件

2. **`declaration: true`**

   - 为每个 `.ts` 文件生成 `.d.ts` 类型声明
   - 其他包可以获得类型提示

3. **`declarationMap: true`**

   - 生成 `.d.ts.map` 文件
   - IDE 可以"跳转到定义"时直接跳到 `.ts` 源码

4. **`skipLibCheck: true`**
   - 跳过 `node_modules` 中 `.d.ts` 的检查
   - 大幅提升编译速度（推荐）

---

### rollup.config.js - 打包配置

#### 1. 外部依赖处理

```javascript
const isExternal = id => {
  // 1. monorepo 内部包视为外部依赖
  if (id.startsWith('@mix-toolkit/')) {
    return true
  }

  // 2. node_modules 中的包视为外部依赖
  if (!id.startsWith('.') && !path.isAbsolute(id)) {
    return true
  }

  // 3. 相对路径但指向其他包的文件也视为外部依赖
  if (id.startsWith('../') && !id.startsWith(`../${TARGET}/`)) {
    return true
  }

  return false
}
```

**为什么要标记为外部？**

- `react`、`react-dom` 等作为 peer dependencies，不应该打包进去
- Monorepo 内其他包（如 `@mix-toolkit/utils`）也应该外部引用
- 减小打包体积，避免代码重复

#### 2. 插件配置

##### 2.1 PostCSS 插件（样式处理）

```javascript
postcss({
  extract: path.resolve(packageDir, 'dist/index.css'), // 提取到单独的 CSS 文件
  minimize: true, // 压缩 CSS

  // 🔥 针对不同包使用不同的处理方式
  use:
    TARGET === 'canvas-editor'
      ? []
      : [
          [
            'sass',
            {
              api: 'modern-compiler',
              silenceDeprecations: ['legacy-js-api'],
              includePaths: ['node_modules'],
              outputStyle: 'compressed'
            }
          ]
        ],

  // 🔥 CSS Modules 配置
  modules:
    TARGET === 'canvas-editor'
      ? false
      : {
          generateScopedName: '[name]__[local]___[hash:base64:5]'
        },

  // 🔥 Tailwind 支持
  config: ['canvas-editor', 'editor'].includes(TARGET)
    ? {
        path: path.resolve(packageDir, 'postcss.config.js')
      }
    : false
})
```

**处理两种样式方案**：

1. **Tailwind CSS（canvas-editor, editor）**

   - 不使用 SCSS 和 CSS Modules
   - 使用包级别的 `postcss.config.js` 处理 Tailwind

2. **SCSS Modules（其他包）**
   - 使用 Sass 编译
   - 启用 CSS Modules，生成 scoped class name
   - 示例：`.button` → `.style-module__button___7i95J`

##### 2.2 TypeScript 插件

```javascript
typescript({
  tsconfig: path.resolve(packageDir, 'tsconfig.build.json'), // 🔥 使用 build 配置
  outputToFilesystem: false, // 不输出 .js 文件（Rollup 负责输出）
  include: [`${packageDir}/src/**/*`, `${packageDir}/*.d.ts`]
})
```

**为什么有 tsconfig.build.json？**

- `tsconfig.json`：给 `tsc -b` 使用，生成类型声明（`.d.ts`）
- `tsconfig.build.json`：给 Rollup 使用，编译 JavaScript

#### 3. 输出配置

```javascript
output: [
  // ES Module (推荐)
  packageJson.module && {
    file: path.resolve(packageDir, packageJson.module), // dist/index.esm.js
    format: 'es',
    sourcemap: false
  },

  // CommonJS (兼容性)
  packageJson.main && {
    file: path.resolve(packageDir, packageJson.main), // dist/index.cjs.js
    format: 'cjs',
    exports: 'auto',
    sourcemap: false
  }
].filter(Boolean)
```

**生成两种格式**：

- **ESM**：现代构建工具（Vite、Webpack 5+）优先使用
- **CJS**：Node.js 和老版本构建工具使用

#### 设计亮点

1. **单包构建模式**

   ```bash
   rollup -c --environment TARGET:canvas-editor
   ```

   - 通过 `TARGET` 指定构建哪个包
   - 避免一次性构建所有包（提升效率）

2. **智能样式处理**

   - 根据包的不同自动选择 Tailwind 或 SCSS Modules
   - 统一提取到 `dist/index.css`

3. **类型声明分离**
   - TypeScript 编译器生成 `.d.ts`
   - Rollup 只负责打包 JavaScript
   - 职责清晰，构建速度快

---

### 包级别的 tsconfig

每个包有两个 TypeScript 配置文件：

#### 1. tsconfig.json（类型声明生成）

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "baseUrl": ".",
    "emitDeclarationOnly": true, // 🔥 只生成 .d.ts，不生成 .js
    "jsx": "react-jsx",
    "paths": {
      "@mix-toolkit/utils": ["../utils/src"] // 🔥 Monorepo 内部引用
    }
  },
  "include": ["src/**/*", "*.d.ts"],
  "exclude": ["dist", "node_modules"],
  "references": [{ "path": "../utils" }] // 🔥 声明依赖关系
}
```

**用途**：

- `tsc -b` 编译时使用
- 只生成 `.d.ts` 类型声明文件
- 支持 Project References

#### 2. tsconfig.build.json（Rollup 编译）

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "baseUrl": ".",
    "composite": false, // 🔥 关闭 composite
    "declaration": false, // 🔥 不生成 .d.ts
    "declarationMap": false, // 🔥 不生成 .d.ts.map
    "paths": {
      "@mix-toolkit/utils": ["../utils/src"]
    },
    "jsx": "react-jsx"
  },
  "include": ["src/**/*", "type.d.ts"],
  "exclude": ["dist", "node_modules"],
  "references": [{ "path": "../utils" }]
}
```

**用途**：

- Rollup 打包时使用
- 不生成类型声明（避免冲突）
- 只编译 JavaScript 代码

#### 为什么要分离？

| 配置文件              | 使用场景 | 输出文件              | composite |
| --------------------- | -------- | --------------------- | --------- |
| `tsconfig.json`       | `tsc -b` | `.d.ts`, `.d.ts.map`  | ✅ true   |
| `tsconfig.build.json` | Rollup   | 无（Rollup 输出 .js） | ❌ false  |

**职责分离**：

- TypeScript 专注类型系统
- Rollup 专注代码打包
- 避免冲突，提升构建速度

---

## TypeScript 配置的完整使用场景

本节详细讲解各个 `tsconfig` 文件在不同场景下如何被使用。

### 配置文件层级关系

```
项目根目录
├── tsconfig.json              # 根配置（项目引用协调器）
├── tsconfig.base.json         # 基础配置（所有包共享）
└── packages/
    ├── canvas-editor/
    │   ├── tsconfig.json      # 包配置（tsc 编译用）
    │   └── tsconfig.build.json # 构建配置（Rollup 用）
    ├── utils/
    │   ├── tsconfig.json
    │   └── tsconfig.build.json
    └── ...
```

### 场景 1：IDE 类型检查（VSCode/WebStorm）

#### 使用的配置文件

当你在 IDE 中打开一个 TypeScript 文件时：

```typescript
// packages/canvas-editor/src/index.tsx
import { debounce } from '@mix-toolkit/utils' // IDE 在此处提供类型提示
```

**IDE 的查找逻辑**：

1. **从当前文件向上查找最近的 `tsconfig.json`**

   ```
   packages/canvas-editor/src/index.tsx
   → 查找 packages/canvas-editor/tsconfig.json ✅ 找到
   ```

2. **读取配置**

   ```json
   {
     "extends": "../../tsconfig.base.json",
     "compilerOptions": {
       "paths": {
         "@mix-toolkit/utils": ["../utils/src"] // 🔥 路径映射
       }
     },
     "references": [{ "path": "../utils" }] // 🔥 项目引用
   }
   ```

3. **解析类型**

   - `@mix-toolkit/utils` → 映射到 `../utils/src`
   - 读取 `../utils/src/index.ts` 的类型定义
   - 提供智能提示：函数签名、参数类型、返回值类型

4. **跳转到定义**
   - 按住 Cmd/Ctrl 点击 `debounce`
   - 直接跳转到 `packages/utils/src/index.ts`（源码）

#### 配置文件的作用

| 配置项       | 作用         | IDE 行为         |
| ------------ | ------------ | ---------------- |
| `paths`      | 路径别名映射 | 解析模块导入     |
| `references` | 项目依赖声明 | 跨项目类型检查   |
| `baseUrl`    | 相对路径基准 | 计算模块路径     |
| `jsx`        | JSX 语法支持 | 识别 `.tsx` 文件 |

#### 示例：IDE 错误提示

```typescript
// packages/canvas-editor/src/index.tsx
import { debounce } from '@mix-toolkit/utils'

const fn = debounce(123) // ❌ IDE 提示错误
// Type 'number' is not assignable to parameter of type 'Function'
```

IDE 通过 `tsconfig.json` → `paths` 映射找到源码位置 `../utils/src/index.ts`，然后读取 `debounce` 的类型定义：

```typescript
// packages/utils/src/index.ts
export function debounce(fn: Function, delay: number): Function
```

### 场景 2：命令行类型检查（tsc --noEmit）

#### 使用的配置文件

```bash
cd packages/canvas-editor
tsc --noEmit
```

**执行流程**：

1. TypeScript 读取 `packages/canvas-editor/tsconfig.json`
2. 加载 `references` 中的依赖项（`../utils`）
3. 检查所有 `.ts`/`.tsx` 文件的类型
4. **不生成任何文件**（`--noEmit` 标志）
5. 只报告类型错误

#### 典型用途

- **CI/CD 流水线**：在构建前检查类型错误
- **Pre-commit Hook**：提交前验证类型正确性

```bash
# 检查所有包的类型
tsc --noEmit

# 只检查特定包
cd packages/canvas-editor && tsc --noEmit
```

### 场景 3：构建时类型声明生成（tsc -b）

#### 使用的配置文件

```bash
tsc -b
# 或
tsc --build
```

**执行流程**：

1. **读取根 `tsconfig.json`**

   ```json
   {
     "references": [{ "path": "./packages/utils" }, { "path": "./packages/canvas-editor" }]
   }
   ```

2. **按依赖顺序编译**

   - TypeScript 分析依赖关系：`canvas-editor` 依赖 `utils`
   - 先编译 `utils`，再编译 `canvas-editor`

3. **读取包级别的 `tsconfig.json`**

   ```json
   // packages/utils/tsconfig.json
   {
     "compilerOptions": {
       "outDir": "./dist",
       "emitDeclarationOnly": true, // 🔥 只生成 .d.ts
       "composite": true // 🔥 启用增量编译
     }
   }
   ```

4. **生成类型声明文件**

   ```
   packages/utils/src/index.ts
   → packages/utils/dist/index.d.ts
   → packages/utils/dist/index.d.ts.map
   ```

5. **生成 `.tsbuildinfo` 缓存**
   ```json
   // packages/utils/tsconfig.tsbuildinfo
   {
     "program": {
       "fileNames": ["..."],
       "fileInfos": {
         "1": { "version": "...", "signature": "..." }
       }
     }
   }
   ```

#### 增量编译原理

```bash
# 第一次编译
tsc -b  # 编译所有包，生成 .tsbuildinfo

# 修改 utils/src/index.ts
tsc -b  # 只重新编译 utils 和依赖它的包（canvas-editor）
```

TypeScript 对比 `.tsbuildinfo` 中的文件 hash，跳过未修改的文件。

#### 输出产物

```
packages/canvas-editor/dist/
├── index.d.ts          # 类型声明入口
├── index.d.ts.map      # Source Map（跳转到源码）
└── 2d/
    ├── index.d.ts
    ├── stage/
    │   ├── index.d.ts
    │   └── sdk.d.ts
    └── ...
```

### 场景 4：Rollup 打包（rollup -c）

#### 使用的配置文件

```bash
rollup -c --environment TARGET:canvas-editor
```

**执行流程**：

1. **Rollup 读取 `rollup.config.js`**

   ```javascript
   typescript({
     tsconfig: path.resolve(packageDir, 'tsconfig.build.json'), // 🔥 指定配置
     outputToFilesystem: false
   })
   ```

2. **读取 `tsconfig.build.json`**

   ```json
   {
     "compilerOptions": {
       "declaration": false, // 🔥 不生成 .d.ts
       "declarationMap": false, // 🔥 不生成 .d.ts.map
       "composite": false // 🔥 关闭项目引用
     }
   }
   ```

3. **编译 TypeScript 代码**

   - 将 `.tsx` 编译为 JavaScript（内存中）
   - 不写入文件系统（`outputToFilesystem: false`）
   - 交给 Rollup 继续处理（Tree-shaking、压缩等）

4. **Rollup 输出 JavaScript 文件**
   ```
   packages/canvas-editor/dist/
   ├── index.esm.js    # ES Module 格式
   └── index.cjs.js    # CommonJS 格式
   ```

#### 为什么不生成类型声明？

```json
{
  "declaration": false // 🔥 关键配置
}
```

**原因**：

- `.d.ts` 已经由 `tsc -b` 生成
- Rollup 只负责打包 JavaScript
- 避免重复生成和冲突

### 场景 5：用户安装后的类型提示

#### 包发布时的文件结构

```
@mix-toolkit/canvas-editor/
├── dist/
│   ├── index.esm.js         # 代码（ES Module）
│   ├── index.cjs.js         # 代码（CommonJS）
│   ├── index.d.ts           # 类型声明（入口）
│   ├── index.d.ts.map       # Source Map
│   └── 2d/                  # 子模块类型声明
│       └── ...
├── package.json
└── ...
```

#### package.json 配置

```json
{
  "name": "@mix-toolkit/canvas-editor",
  "main": "dist/index.cjs.js", // CommonJS 入口
  "module": "dist/index.esm.js", // ES Module 入口
  "types": "dist/index.d.ts" // 类型声明入口
}
```

#### 用户项目中使用

```typescript
// 用户的项目代码
import { Stage } from '@mix-toolkit/canvas-editor'
```

**IDE 的解析过程**：

1. 读取 `node_modules/@mix-toolkit/canvas-editor/package.json`
2. 找到 `"types": "dist/index.d.ts"`
3. 加载 `node_modules/@mix-toolkit/canvas-editor/dist/index.d.ts`
4. 提供类型提示

#### 跳转到定义的行为

当用户点击"跳转到定义"时：

**情况 1：没有 declarationMap**

```
跳转到 → node_modules/@mix-toolkit/canvas-editor/dist/index.d.ts
```

用户看到的是类型声明文件（不友好）。

**情况 2：有 declarationMap**

```
跳转到 → node_modules/@mix-toolkit/canvas-editor/dist/index.d.ts
         ↓ 读取 index.d.ts.map
跳转到 → 原始源码位置（如果有 sourceRoot）
```

这就是为什么 `tsconfig.json` 需要：

```json
{
  "compilerOptions": {
    "declarationMap": true // 生成 .d.ts.map
  }
}
```

### 配置文件使用矩阵

| 场景             | 使用的配置                              | 关键选项                                 | 输出文件             |
| ---------------- | --------------------------------------- | ---------------------------------------- | -------------------- |
| **IDE 类型检查** | `packages/*/tsconfig.json`              | `paths`, `references`                    | 无                   |
| **命令行检查**   | `packages/*/tsconfig.json`              | `strict`, `noEmit`                       | 无                   |
| **生成类型声明** | `packages/*/tsconfig.json`              | `declaration: true`, `composite: true`   | `.d.ts`, `.d.ts.map` |
| **Rollup 打包**  | `packages/*/tsconfig.build.json`        | `declaration: false`, `composite: false` | 无（交给 Rollup）    |
| **增量编译**     | 根 `tsconfig.json` + 包 `tsconfig.json` | `references`, `composite`                | `.tsbuildinfo`       |

### 常见问题解答

#### Q1: 为什么 IDE 有时找不到类型？

**A**: 检查 `paths` 配置是否正确：

```json
// packages/canvas-editor/tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@mix-toolkit/utils": ["../utils/src"] // 🔥 必须指向源码目录
    }
  }
}
```

#### Q2: 为什么需要两个 tsconfig？

**A**: 职责分离：

| 配置                  | 职责     | 使用者     |
| --------------------- | -------- | ---------- |
| `tsconfig.json`       | 类型系统 | `tsc`, IDE |
| `tsconfig.build.json` | 代码编译 | Rollup     |

避免冲突，提升构建速度。

#### Q3: composite: true 有什么用？

**A**: 启用 TypeScript Project References：

1. **增量编译**：只编译有变化的文件
2. **依赖管理**：通过 `references` 声明依赖
3. **强制要求**：必须配置 `declaration: true`

#### Q4: declarationMap 的作用？

**A**: 生成 `.d.ts.map` 文件：

- IDE 可以从类型声明跳转到源码
- 更好的开发体验
- 对用户调试有帮助

#### Q5: 为什么 Rollup 要关闭 declaration？

**A**: 避免重复生成：

```json
// tsconfig.build.json
{
  "compilerOptions": {
    "declaration": false // 🔥 Rollup 不生成类型
  }
}
```

类型声明已经由 `tsc -b` 生成，Rollup 再生成会覆盖或冲突。

#### Q6: paths 和 references 有什么区别？

**A**: 这两个配置项都用于处理跨包引用，但作用完全不同：

| 特性         | `paths`              | `references`                  |
| ------------ | -------------------- | ----------------------------- |
| **作用**     | 模块路径映射         | 项目依赖声明                  |
| **使用者**   | IDE、编译器          | TypeScript Project References |
| **影响范围** | 模块解析             | 编译顺序、增量编译            |
| **必须性**   | 可选（可用相对路径） | Monorepo 推荐使用             |

##### paths - 路径别名映射

```json
// packages/canvas-editor/tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@mix-toolkit/utils": ["../utils/src"] // 🔥 路径映射
    }
  }
}
```

**作用**：

1. **模块解析**：告诉 TypeScript 如何找到模块

   ```typescript
   import { debounce } from '@mix-toolkit/utils'
   // TypeScript 解析为：../utils/src/index.ts
   ```

2. **IDE 智能提示**：IDE 通过 `paths` 找到源码位置

   - 跳转到定义
   - 自动补全
   - 类型检查

3. **编译时路径重写**：编译器根据 `paths` 查找文件

**不影响**：

- ❌ 不影响编译顺序
- ❌ 不启用增量编译
- ❌ 不检查依赖关系

##### references - 项目依赖声明

```json
// packages/canvas-editor/tsconfig.json
{
  "references": [
    { "path": "../utils" } // 🔥 声明依赖
  ]
}
```

**作用**：

1. **声明依赖关系**：告诉 TypeScript "我依赖 utils 项目"

   ```
   canvas-editor → 依赖 → utils
   ```

2. **控制编译顺序**：`tsc -b` 会先编译 `utils`，再编译 `canvas-editor`

3. **启用增量编译**：

   - 只编译有变化的项目
   - 生成 `.tsbuildinfo` 缓存
   - 大幅提升构建速度

4. **类型检查一致性**：确保引用的类型是最新的

**不影响**：

- ❌ 不影响模块路径解析（还是需要 `paths` 或相对路径）
- ❌ 不提供路径别名功能

##### 实际使用场景

**场景 1：只使用 paths（不推荐）**

```json
// packages/canvas-editor/tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@mix-toolkit/utils": ["../utils/src"]
    }
  }
  // ❌ 没有 references
}
```

**问题**：

- ✅ IDE 可以找到类型
- ✅ 编译可以通过
- ❌ 无法使用增量编译
- ❌ 无法保证编译顺序
- ❌ 修改 utils 后需要手动重新编译 canvas-editor

**场景 2：只使用 references（不推荐）**

```json
// packages/canvas-editor/tsconfig.json
{
  "references": [{ "path": "../utils" }]
  // ❌ 没有 paths
}
```

**问题**：

- ❌ IDE 无法找到模块（除非用相对路径）
- ❌ 必须写完整的相对路径：
  ```typescript
  import { debounce } from '../utils/src' // 不优雅
  ```

**场景 3：同时使用（推荐）**

```json
// packages/canvas-editor/tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@mix-toolkit/utils": ["../utils/src"] // 🔥 路径映射
    }
  },
  "references": [
    { "path": "../utils" } // 🔥 依赖声明
  ]
}
```

**优点**：

- ✅ IDE 智能提示正常
- ✅ 编译顺序正确
- ✅ 增量编译生效
- ✅ 类型检查一致性
- ✅ 优雅的导入语法

##### 工作流程示例

```typescript
// packages/canvas-editor/src/index.tsx
import { debounce } from '@mix-toolkit/utils'
```

**步骤 1：模块解析（paths）**

```
1. TypeScript 读取 paths 配置
2. @mix-toolkit/utils → 映射到 ../utils/src
3. 读取 ../utils/src/index.ts
```

**步骤 2：类型检查（references）**

```
1. TypeScript 检查 references
2. 发现依赖 ../utils
3. 确保 utils 已经编译（有 .d.ts）
4. 读取 ../utils/dist/index.d.ts 进行类型检查
```

**步骤 3：增量编译（references + composite）**

```bash
# 修改 utils/src/index.ts
tsc -b

# TypeScript 执行：
1. 检测到 utils 有变化
2. 重新编译 utils（生成新的 .d.ts）
3. 发现 canvas-editor 依赖 utils（通过 references）
4. 自动重新编译 canvas-editor
```

##### 配置模板

**包级别 tsconfig.json（开发 + 编译）**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "baseUrl": ".",
    "composite": true, // 🔥 启用 Project References
    "paths": {
      // 🔥 路径映射（开发体验）
      "@mix-toolkit/utils": ["../utils/src"],
      "@mix-toolkit/hooks": ["../hooks/src"]
    }
  },
  "references": [
    // 🔥 依赖声明（编译顺序）
    { "path": "../utils" },
    { "path": "../hooks" }
  ]
}
```

##### 总结

- **`paths`**：给 IDE 和编译器看的"地图"，告诉它们如何找到模块
- **`references`**：给 TypeScript Project References 看的"依赖图"，控制编译顺序和增量编译

在 Monorepo 中，**两者配合使用**才能获得最佳的开发体验和构建性能。

#### Q7: composite 和 references 有什么关系？

**A**: `composite` 和 `references` 是 TypeScript Project References 的两个核心配置，密切相关但职责不同：

**简单理解**：

- **`composite: true`**：被依赖方的"资格证"（我可以被引用）
- **`references`**：依赖方的"声明书"（我依赖这些项目）

**关系图**：

```
utils (composite: true)  ←──── canvas-editor (references: [{ path: "../utils" }])
     ↓ 可以被引用                     ↓ 声明依赖
生成 .d.ts + .tsbuildinfo        确保编译顺序正确
```

**实际配置示例**：

```json
// packages/utils/tsconfig.json（基础包，被依赖）
{
  "compilerOptions": {
    "composite": true, // ✅ 允许被引用
    "outDir": "./dist"
  }
  // ✅ 没有 references（不依赖其他包）
}
```

```json
// packages/canvas-editor/tsconfig.json（应用包，依赖者）
{
  "compilerOptions": {
    "composite": true, // ✅ 自己也可以被引用
    "paths": {
      "@mix-toolkit/utils": ["../utils/src"]
    }
  },
  "references": [
    { "path": "../utils" } // ✅ 声明依赖 utils
  ]
}
```

**为什么需要两者配合**：

| 场景         | 只有 composite | 只有 references | 两者都有 |
| ------------ | -------------- | --------------- | -------- |
| 生成 .d.ts   | ✅             | ❌              | ✅       |
| 增量编译     | ✅             | ❌              | ✅       |
| 确定编译顺序 | ❌             | ✅              | ✅       |
| 跨包类型检查 | ❌             | ⚠️ 部分         | ✅       |

**tsc -b 编译时的工作流程**：

```bash
tsc -b

# 执行顺序：
1. 读取 canvas-editor 的 references，发现依赖 utils
2. 检查 utils 是否有 composite: true（✅ 有，可以作为依赖）
3. 先编译 utils（生成 .d.ts 和 .tsbuildinfo）
4. 再编译 canvas-editor（使用 utils 的 .d.ts）
```

**总结**：

- `composite: true` 是**被动的**（被别人引用的资格）
- `references` 是**主动的**（主动声明依赖关系）
- 两者配合使用，构成完整的 Project References 系统

#### Q8: paths 是编译时映射还是运行时映射？

**A**: **`paths` 只在编译时生效，不影响运行时**。这是一个非常容易混淆的概念。

##### paths 的工作机制

```json
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@mix-toolkit/utils": ["../utils/src"]
    }
  }
}
```

**作用范围**：

| 环境                      | 是否生效  | 说明                   |
| ------------------------- | --------- | ---------------------- |
| **TypeScript 编译器**     | ✅ 生效   | 类型检查、编译时使用   |
| **IDE (VSCode/WebStorm)** | ✅ 生效   | 智能提示、跳转定义     |
| **Node.js 运行时**        | ❌ 不生效 | Node.js 不认识 `paths` |
| **浏览器运行时**          | ❌ 不生效 | 浏览器不认识 `paths`   |
| **Webpack/Vite**          | ⚠️ 需配置 | 需要额外配置别名       |

##### 示例 1：TypeScript 编译后的代码

**源码（编译前）**：

```typescript
// packages/canvas-editor/src/index.tsx
import { debounce } from '@mix-toolkit/utils' // 使用 paths 别名

export function myFunc() {
  return debounce(() => {}, 300)
}
```

**编译后的 JavaScript**：

```javascript
// packages/canvas-editor/dist/index.esm.js
import { debounce } from '@mix-toolkit/utils' // ⚠️ 别名保持原样！

export function myFunc() {
  return debounce(() => {}, 300)
}
```

**关键点**：

- ❌ TypeScript 编译器**不会**将别名转换为相对路径
- ❌ 生成的 JavaScript 代码中**仍然保留**原始的 `@mix-toolkit/utils`
- ⚠️ 这意味着运行时需要其他机制来解析这个路径

##### 示例 2：为什么开发环境能工作？

```bash
npm run dev
# → vite
```

**Vite 配置**：

```javascript
// vite.config.js
export default defineConfig({
  resolve: {
    alias: {
      '@mix-toolkit': resolve(__dirname, './packages') // 🔥 Vite 的别名
    }
  }
})
```

**工作流程**：

1. **TypeScript 编译阶段**（内存中）

   ```typescript
   import { debounce } from '@mix-toolkit/utils'
   ```

   - TypeScript 通过 `paths` 找到 `../utils/src/index.ts`
   - 进行类型检查
   - 编译为 JavaScript（别名保持不变）

2. **Vite 模块解析阶段**
   ```javascript
   import { debounce } from '@mix-toolkit/utils'
   ```
   - Vite 读取 `alias` 配置
   - `@mix-toolkit/utils` → `./packages/utils/src/index.ts`
   - 加载实际文件

**关键点**：

- TypeScript 的 `paths` 和 Vite 的 `alias` 是**两个独立的配置**
- `paths`：给 TypeScript 类型检查用
- `alias`：给 Vite 模块解析用
- 需要保持两者一致

##### 示例 3：为什么生产环境能工作？

**场景 A：发布到 npm 后**

```bash
npm install @mix-toolkit/canvas-editor
```

用户项目中：

```typescript
import { Stage } from '@mix-toolkit/canvas-editor'
```

**解析过程**：

```
1. Node.js/打包工具查找 node_modules/@mix-toolkit/canvas-editor
2. 读取 package.json 的 "main" 或 "module" 字段
3. 加载 dist/index.esm.js
```

**canvas-editor 内部的导入**：

```javascript
// dist/index.esm.js
import { debounce } from '@mix-toolkit/utils' // 🔥 这是外部依赖
```

**解析过程**：

```
1. 打包工具识别这是外部依赖（通过 Rollup 的 external 配置）
2. 查找 node_modules/@mix-toolkit/utils
3. 加载对应的文件
```

**关键点**：

- 在 Rollup 配置中，我们将 `@mix-toolkit/*` 标记为 `external`
- 这意味着不打包进去，保持原始的 import 语句
- 用户安装后，通过 npm 的依赖解析机制找到对应的包

**场景 B：Monorepo 内部构建**

```javascript
// rollup.config.js
const isExternal = id => {
  // monorepo 内部包视为外部依赖
  if (id.startsWith('@mix-toolkit/')) {
    return true // 🔥 不打包，保持原始 import
  }
  return false
}

export default {
  external: isExternal
  // ...
}
```

##### 不同场景的路径解析机制

| 场景                 | 解析器     | 配置位置                        | 示例                                  |
| -------------------- | ---------- | ------------------------------- | ------------------------------------- |
| **开发时（Vite）**   | Vite       | `vite.config.js` → `alias`      | `@mix-toolkit` → `./packages`         |
| **构建时（Rollup）** | Rollup     | `rollup.config.js` → `external` | `@mix-toolkit/*` 标记为外部           |
| **IDE 类型检查**     | TypeScript | `tsconfig.json` → `paths`       | `@mix-toolkit/utils` → `../utils/src` |
| **用户安装后**       | npm/pnpm   | `node_modules`                  | 通过包名查找                          |

##### 常见陷阱

**陷阱 1：只配置了 TypeScript paths，没配置 Vite alias**

```json
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@utils": ["./utils/src"] // 只配置了 TypeScript
    }
  }
}
```

```javascript
// vite.config.js
export default defineConfig({
  // ❌ 没有配置 alias
})
```

**结果**：

- ✅ IDE 类型检查正常
- ❌ 开发时运行报错：`Cannot find module '@utils'`

**陷阱 2：paths 和 alias 不一致**

```json
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@utils": ["./utils/src"] // TypeScript 配置
    }
  }
}
```

```javascript
// vite.config.js
export default defineConfig({
  resolve: {
    alias: {
      '@utils': resolve(__dirname, './shared/utils') // ⚠️ 路径不一致！
    }
  }
})
```

**结果**：

- ✅ IDE 类型检查通过（检查的是 `./utils/src`）
- ❌ 运行时加载的是 `./shared/utils`（可能导致运行时错误）

**陷阱 3：以为 TypeScript 会转换路径**

```typescript
// 源码
import { debounce } from '@mix-toolkit/utils'
```

**错误理解**：

```javascript
// 编译后（错误预期）
import { debounce } from '../utils/src/index.js' // ❌ 不会这样
```

**实际情况**：

```javascript
// 编译后（实际）
import { debounce } from '@mix-toolkit/utils' // ✅ 保持原样
```

##### 最佳实践：保持配置一致

```javascript
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@mix-toolkit/utils": ["./packages/utils/src"]
    }
  }
}
```

```javascript
// vite.config.js
export default defineConfig({
  resolve: {
    alias: {
      '@mix-toolkit': resolve(__dirname, './packages') // 🔥 保持一致
    }
  }
})
```

```javascript
// rollup.config.js
const isExternal = id => {
  if (id.startsWith('@mix-toolkit/')) {
    // 🔥 标记为外部依赖
    return true
  }
  return false
}
```

##### 工具推荐：自动同步配置

可以使用 `vite-tsconfig-paths` 插件自动读取 TypeScript 的 `paths` 配置：

```bash
npm install -D vite-tsconfig-paths
```

```javascript
// vite.config.js
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [
    tsconfigPaths() // 🔥 自动读取 tsconfig.json 的 paths
  ]
})
```

这样就不需要手动维护两份配置了。

##### 总结

- **`paths` 是编译时配置**，只给 TypeScript 编译器和 IDE 使用
- **运行时需要其他机制**：
  - 开发时：Vite/Webpack 的 `alias`
  - 生产时：npm 的依赖解析 或 打包工具的 `external`
- **最佳实践**：保持 TypeScript `paths` 和构建工具 `alias` 一致
- **推荐方案**：使用插件自动同步配置

---

## 开发环境使用

### 1. 安装依赖

```bash
pnpm install
```

pnpm 会：

- 安装根目录的 devDependencies
- 自动 link workspace 内的包
- 创建 `node_modules/.pnpm` 硬链接结构

### 2. 启动开发服务器

```bash
npm run dev
```

执行流程：

1. Vite 读取 `vite.config.js`
2. 将 `example/` 作为根目录启动服务器
3. 监听 `packages/` 和 `example/` 的文件变化
4. 浏览器访问 `http://localhost:5173`

### 3. 开发体验

```typescript
// example/pages/canvas-editor-demo.tsx
import { Stage, Control } from '@mix-toolkit/canvas-editor/src'
import '@mix-toolkit/canvas-editor/src/index.css'

export default function Demo() {
  return (
    <div>
      <Stage canvasData={...} />
      <Control canvasData={...} />
    </div>
  )
}
```

**优势**：

- ✅ 修改 `packages/canvas-editor/src` 中的代码
- ✅ 浏览器自动热更新
- ✅ 无需运行 `npm run build`
- ✅ 完整的 TypeScript 类型提示
- ✅ Source Map 支持调试

### 4. 跨包开发

假设 `canvas-editor` 依赖 `utils`：

```typescript
// packages/canvas-editor/src/index.tsx
import { debounce } from '@mix-toolkit/utils'  // ✅ 直接引用源码

// packages/canvas-editor/tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@mix-toolkit/utils": ["../utils/src"]  // 🔥 别名映射
    }
  },
  "references": [{ "path": "../utils" }]  // 🔥 类型依赖
}
```

TypeScript 会：

1. 解析 `@mix-toolkit/utils` 到 `../utils/src`
2. 检查 `utils` 的类型定义
3. 提供完整的类型提示和跳转

---

## 构建与发布流程

### 构建流程

#### 1. 构建脚本概览

```bash
npm run build
# → node scripts/build.js
```

```javascript
// scripts/build.js
async function main() {
  // 1. 清理 dist 目录
  cleanAll()

  // 2. 编译类型声明（tsc -b）
  await compileAllTypes()

  // 3. 并行打包所有包（Rollup）
  const results = await Promise.all(pkgs.map(pkg => bundlePackage(pkg)))

  // 4. 验证构建结果
  validateBuild()
}
```

#### 2. 详细步骤

**步骤 1：清理 dist 目录**

```javascript
function cleanAll() {
  pkgs.forEach(pkg => {
    const distPath = `packages/${pkg}/dist`
    if (fs.existsSync(distPath)) {
      fs.rmSync(distPath, { recursive: true, force: true })
    }
  })
}
```

**步骤 2：编译类型声明**

```javascript
async function compileAllTypes() {
  await execa('npx', ['tsc', '-b', '--force'], {
    stdio: 'inherit'
  })
}
```

执行：

```bash
tsc -b --force
```

TypeScript 会：

- 读取根 `tsconfig.json` 的 `references`
- 按依赖顺序编译每个包
- 生成 `.d.ts` 和 `.d.ts.map` 文件
- 输出到 `packages/*/dist/`

**步骤 3：并行打包**

```javascript
async function bundlePackage(pkg) {
  await execa('rollup', ['-c', '--environment', `TARGET:${pkg}`], {
    stdio: 'inherit'
  })
}
```

对每个包执行：

```bash
rollup -c --environment TARGET:canvas-editor
```

Rollup 会：

- 读取 `rollup.config.js`
- 使用 `tsconfig.build.json` 编译 TypeScript
- 处理 CSS（Tailwind 或 SCSS Modules）
- 输出 `dist/index.esm.js` 和 `dist/index.cjs.js`
- 输出 `dist/index.css`

**步骤 4：验证构建结果**

```javascript
function validateBuild() {
  pkgs.forEach(pkg => {
    const packageJson = JSON.parse(fs.readFileSync(`packages/${pkg}/package.json`))
    const distPath = `packages/${pkg}/dist`

    // 检查必要的文件是否存在
    const expectedFiles = [
      packageJson.main && path.basename(packageJson.main), // index.cjs.js
      packageJson.module && path.basename(packageJson.module), // index.esm.js
      packageJson.types && path.basename(packageJson.types) // index.d.ts
    ].filter(Boolean)

    const actualFiles = fs.readdirSync(distPath)

    expectedFiles.forEach(expectedFile => {
      if (!actualFiles.includes(expectedFile)) {
        throw new Error(`Missing expected file ${expectedFile} in ${pkg}/dist`)
      }
    })
  })
}
```

#### 3. 构建产物

以 `canvas-editor` 为例：

```
packages/canvas-editor/dist/
├── index.esm.js         # ES Module 格式
├── index.cjs.js         # CommonJS 格式
├── index.css            # 样式文件（包含 Tailwind）
├── index.d.ts           # 类型声明入口
├── index.d.ts.map       # 类型声明 Source Map
└── 2d/                  # 子模块类型声明
    ├── index.d.ts
    ├── stage/
    │   ├── index.d.ts
    │   └── sdk.d.ts
    └── ...
```

---

### 版本管理

```bash
npm run version:patch         # 0.0.1 → 0.0.2
npm run version:minor         # 0.0.1 → 0.1.0
npm run version:major         # 0.0.1 → 1.0.0
```

#### 实现原理

```javascript
// scripts/version.js
function bumpVersion(version, type) {
  const [major, minor, patch] = version.split('.').map(Number)

  switch (type) {
    case 'major':
      return `${major + 1}.0.0`
    case 'minor':
      return `${major}.${minor + 1}.0`
    case 'patch':
      return `${major}.${minor}.${patch + 1}`
  }
}

function updatePackageVersion(pkg) {
  const packageJson = readPackageJson(pkg.path)
  const oldVersion = packageJson.version
  const newVersion = bumpVersion(oldVersion, versionType)

  packageJson.version = newVersion
  writePackageJson(pkg.path, packageJson)

  return { oldVersion, newVersion }
}
```

#### 单包版本更新

```bash
npm run version:minor canvas-editor
# → 只更新 canvas-editor 包的 minor 版本
```

#### 批量版本更新

```bash
npm run version:patch
# → 更新所有包的 patch 版本
```

---

### 发布流程

```bash
npm run publish              # 发布所有包
npm run publish canvas-editor # 发布指定包
```

#### 实现原理

```javascript
// scripts/publish.js

// 1. 检查 npm 登录状态
function checkNpmLogin() {
  try {
    const whoami = execSync('npm whoami', { encoding: 'utf8' }).trim()
    console.log(`✅ Logged in as: ${whoami}`)
    return true
  } catch {
    console.error('❌ Please run "npm login" first')
    return false
  }
}

// 2. 验证包
function validatePackage(pkg) {
  const distPath = path.resolve(pkg.path, 'dist')

  if (!fs.existsSync(distPath)) {
    return { valid: false, reason: 'dist directory not found' }
  }

  const packageJson = readPackageJson(pkg.path)

  if (!packageJson.name) {
    return { valid: false, reason: 'package name is required' }
  }

  if (!packageJson.version) {
    return { valid: false, reason: 'package version is required' }
  }

  return { valid: true }
}

// 3. 发布包
async function publishPackage(pkg) {
  execSync('npm publish', { cwd: pkg.path, stdio: 'inherit' })
}
```

#### 发布前检查

发布脚本会自动检查：

- ✅ npm 是否已登录
- ✅ `dist/` 目录是否存在
- ✅ `package.json` 是否包含 `name` 和 `version`
- ✅ 必要的构建产物是否齐全

#### 完整发布流程

```bash
# 1. 修改代码
# 2. 测试
npm run dev

# 3. 构建
npm run build

# 4. 更新版本
npm run version:patch

# 5. 提交代码
git add .
git commit -m "bump version"
git push

# 6. 发布到 npm
npm run publish

# 7. 验证发布
npm info @mix-toolkit/canvas-editor
```

---

## 最佳实践与设计亮点

### 1. 类型系统设计

#### Project References 的优势

**传统方式（无 Project References）**：

```bash
cd packages/utils && tsc
cd packages/hooks && tsc  # 需要等 utils 编译完
cd packages/canvas-editor && tsc  # 需要等 hooks 编译完
```

**使用 Project References**：

```bash
tsc -b  # 自动按依赖顺序编译，支持增量编译
```

#### 类型声明与代码分离

- **开发时**：直接引用源码 `.ts`
- **发布后**：用户使用 `.js` + `.d.ts`

```typescript
// 用户安装后
import { Stage } from '@mix-toolkit/canvas-editor'
// → 引用 dist/index.esm.js（代码）
// → 引用 dist/index.d.ts（类型）
```

---

### 2. 样式方案设计

#### 为什么同时支持 Tailwind 和 SCSS Modules？

| 方案             | 优势                   | 适用场景      | 使用包                |
| ---------------- | ---------------------- | ------------- | --------------------- |
| **Tailwind CSS** | 快速开发，无需命名     | UI 密集型组件 | canvas-editor, editor |
| **SCSS Modules** | 作用域隔离，可维护性强 | 通用组件库    | open-modal, toolbar   |

#### Tailwind 打包策略

```javascript
// rollup.config.js
postcss({
  // 🔥 canvas-editor 使用 Tailwind
  config:
    TARGET === 'canvas-editor'
      ? {
          path: path.resolve(packageDir, 'postcss.config.js')
        }
      : false
})
```

```javascript
// packages/canvas-editor/postcss.config.js
export default {
  plugins: {
    tailwindcss: {}, // 处理 @tailwind 指令
    autoprefixer: {} // 添加浏览器前缀
  }
}
```

```css
/* packages/canvas-editor/src/index.css */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**打包后**：

- Tailwind 会扫描 `src/**/*.tsx` 中使用的所有类
- 只打包实际使用的类（Tree-shaking）
- 输出到 `dist/index.css`（18KB 压缩后）

---

### 3. 构建性能优化

#### 并行构建

```javascript
// scripts/build.js
const bundlePromises = pkgs.map(async pkg => {
  return bundlePackage(pkg) // 并行执行
})

const results = await Promise.all(bundlePromises)
```

**效果**：

- 串行构建：60 秒
- 并行构建：15 秒（4 核 CPU）

#### 增量编译

```bash
tsc -b  # 只编译有变化的包
```

TypeScript 会生成 `.tsbuildinfo` 缓存文件：

```json
{
  "program": {
    "fileNames": ["..."],
    "fileInfos": {
      "hash": "..."
    }
  }
}
```

下次编译时，TypeScript 对比 hash，跳过未变化的文件。

---

### 4. Monorepo 最佳实践

#### 依赖管理

**原则**：

- devDependencies 放在根 `package.json`
- dependencies 放在各包的 `package.json`

```json
// 根 package.json（构建工具）
{
  "devDependencies": {
    "typescript": "^5.9.2",
    "rollup": "^4.48.0",
    "vite": "^7.1.3"
  }
}

// packages/canvas-editor/package.json（运行时依赖）
{
  "dependencies": {
    "uuid": "^13.0.0",
    "immutability-helper": "^3.1.1"
  }
}
```

#### Monorepo 内部引用

**开发时**（源码引用）：

```typescript
// packages/canvas-editor/src/index.tsx
import { debounce } from '@mix-toolkit/utils'  // → ../utils/src

// packages/canvas-editor/tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@mix-toolkit/utils": ["../utils/src"]
    }
  }
}
```

**发布后**（npm 引用）：

```typescript
// 用户项目
import { debounce } from '@mix-toolkit/utils' // → node_modules/@mix-toolkit/utils
```

---

### 5. 值得学习的设计

#### 智能入口查找

```javascript
const possibleEntries = ['src/index.tsx', 'src/index.ts', 'main.js']

function findEntry(packageDir) {
  for (const entry of possibleEntries) {
    const fullPath = path.resolve(packageDir, entry)
    if (fs.existsSync(fullPath)) {
      return fullPath
    }
  }
  throw new Error(`No entry file found`)
}
```

**好处**：

- 支持不同类型的包（React、纯 TS、纯 JS）
- 无需为每个包单独配置入口

#### 外部依赖自动检测

```javascript
const isExternal = id => {
  // Monorepo 内部包
  if (id.startsWith('@mix-toolkit/')) return true

  // npm 包
  if (!id.startsWith('.') && !path.isAbsolute(id)) return true

  return false
}
```

**好处**：

- 自动识别 Monorepo 内部依赖
- 无需手动维护 `external` 列表

#### 双 tsconfig 策略

| 文件                  | 用途        | 关键配置                                       |
| --------------------- | ----------- | ---------------------------------------------- |
| `tsconfig.json`       | 类型声明    | `emitDeclarationOnly: true`, `composite: true` |
| `tsconfig.build.json` | Rollup 编译 | `declaration: false`, `composite: false`       |

**好处**：

- 类型系统和构建系统解耦
- 避免生成重复的类型声明
- 提升构建速度

---

## 总结

这个 Monorepo 架构的核心设计理念：

1. **职责分离**

   - Vite 负责开发体验
   - Rollup 负责生产构建
   - TypeScript 负责类型系统

2. **性能优化**

   - 增量编译（tsc -b）
   - 并行构建
   - Tree-shaking

3. **开发体验**

   - 热更新
   - 类型提示
   - Source Map

4. **灵活性**
   - 支持多种样式方案
   - 智能适配不同包类型
   - 可选的单包构建/发布

这套架构适用于任何需要发布多个相关 npm 包的项目。
