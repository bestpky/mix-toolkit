import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 动态获取所有包
export function getPackages() {
  const packagesDir = path.join(__dirname, '../packages')

  if (!fs.existsSync(packagesDir)) {
    console.error('❌ packages directory not found')
    return []
  }

  const packages = []
  const entries = fs.readdirSync(packagesDir, { withFileTypes: true })

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const packagePath = path.join(packagesDir, entry.name)
      const packageJsonPath = path.join(packagePath, 'package.json')

      // 检查是否有 package.json
      if (fs.existsSync(packageJsonPath)) {
        try {
          const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))

          packages.push({
            name: entry.name, // 目录名：better-lazy-image
            path: packagePath, // 完整路径
            npmName: packageJson.name, // npm 包名：@mix-toolkit/better-lazy-image
            version: packageJson.version, // 版本号
            private: packageJson.private || false // 是否私有包
          })
        } catch (error) {
          console.warn(`⚠️  Invalid package.json in ${entry.name}: ${error.message}`)
        }
      }
    }
  }

  // 过滤掉私有包（不需要发布）
  return packages.filter(pkg => !pkg.private)
}

// 读取包的 package.json
export function readPackageJson(packagePath) {
  const packageJsonPath = path.join(packagePath, 'package.json')
  if (!fs.existsSync(packageJsonPath)) {
    throw new Error(`package.json not found at ${packageJsonPath}`)
  }
  return JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
}

// 写入包的 package.json
export function writePackageJson(packagePath, packageJson) {
  const packageJsonPath = path.join(packagePath, 'package.json')
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n')
}

// 根据包名获取包信息
export function getPackage(packageName) {
  const packages = getPackages()
  return packages.find(pkg => pkg.name === packageName)
}

// 验证包
export function validatePackage(pkg) {
  try {
    const packageJson = readPackageJson(pkg.path)

    // 基本字段检查
    if (!packageJson.name || !packageJson.version) {
      return { valid: false, reason: 'Missing name or version' }
    }

    // 检查 dist 目录是否存在
    const distPath = path.join(pkg.path, 'dist')
    if (!fs.existsSync(distPath)) {
      return { valid: false, reason: 'Missing dist directory. Please run build first.' }
    }

    return { valid: true }
  } catch (error) {
    return { valid: false, reason: error.message }
  }
}

// 显示包信息
export function displayPackages(packages) {
  console.log(`📦 Found ${packages.length} packages:`)
  packages.forEach((pkg, index) => {
    console.log(`  ${index + 1}. ${pkg.name} (${pkg.npmName}@${pkg.version})`)
  })
}
