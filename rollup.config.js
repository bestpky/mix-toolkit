import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import typescript from '@rollup/plugin-typescript'
import path from 'path'
import fs from 'fs'
import postcss from 'rollup-plugin-postcss'
import url from '@rollup/plugin-url'
import sass from 'sass'

const TARGET = process.env.TARGET

if (!TARGET) {
  throw new Error('TARGET package must be specified via --environment TARGET:package-name')
}

const packageDir = path.resolve(`packages/${TARGET}`)
const packageJson = JSON.parse(fs.readFileSync(path.resolve(packageDir, 'package.json'), 'utf-8'))

// 判断是否为外部依赖
const isExternal = id => {
  // 1. monorepo 内部包视为外部依赖（关键修改）
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

const possibleEntries = ['src/index.tsx', 'src/index.ts']
function findEntry(packageDir) {
  for (const entry of possibleEntries) {
    const fullPath = path.resolve(packageDir, entry)
    if (fs.existsSync(fullPath)) {
      return fullPath
    }
  }
  throw new Error(`No entry file found. Tried: ${possibleEntries.join(', ')}`)
}

const config = {
  input: findEntry(packageDir),
  external: isExternal,
  plugins: [
    resolve({
      preferBuiltins: false
    }),
    commonjs(),
    url({
      include: ['**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.gif', '**/*.svg', '**/*.webp'],
      limit: 8192, // 8KB 以下内联为 base64
      fileName: 'assets/[name].[hash][extname]', // 大文件输出路径
      publicPath: '../assets/', // 公共路径
      emitFiles: true // 输出文件到 dist
    }),
    postcss({
      extract: path.resolve(packageDir, 'dist/index.css'),
      minimize: true, // 压缩 CSS
      use: [
        [
          'sass',
          {
            api: 'modern-compiler', // 使用现代编译器 API
            silenceDeprecations: ['legacy-js-api'], // 临时抑制废弃警告
            includePaths: ['node_modules'],
            outputStyle: 'compressed'
          }
        ]
      ],
      modules: {
        // CSS 模块支持
        generateScopedName: '[name]__[local]___[hash:base64:5]'
      }
    }),
    typescript({
      tsconfig: path.resolve(packageDir, 'tsconfig.build.json'),
      outputToFilesystem: false, // 不输出到文件系统，避免冲突
      include: [`${packageDir}/src/**/*`, `${packageDir}/*.d.ts`]
    })
  ],
  output: [
    // ES模块
    packageJson.module && {
      file: path.resolve(packageDir, packageJson.module),
      format: 'es',
      sourcemap: false
    },
    // CommonJS
    packageJson.main && {
      file: path.resolve(packageDir, packageJson.main),
      format: 'cjs',
      exports: 'auto',
      sourcemap: false
    },
    // UMD (如果需要)
    packageJson.browser && {
      file: path.resolve(packageDir, packageJson.browser),
      format: 'umd',
      name: `MixToolkit${TARGET.split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join('')}`,
      sourcemap: false,
      globals: {
        '@mix-toolkit/better-lazy-image': 'MixToolkitBetterLazyImage',
        react: 'React',
        'react-dom': 'ReactDOM',
        'react/jsx-runtime': 'ReactJSXRuntime',
        'react-dom/client': 'ReactDOMClient',
        classnames: 'classNames',
        rxjs: 'rxjs',
        'rxjs/operators': 'rxjs.operators'
      }
    }
  ].filter(Boolean)
}

export default config
