import fs from "fs";
import { execa } from "execa";
import path from "path";

const pkgs = fs.readdirSync("packages").filter((p) => {
  return fs.statSync(`packages/${p}`).isDirectory();
});

// 🔑 清理所有 dist 目录
const cleanAll = () => {
  console.log("🧹 Cleaning all dist directories...");
  pkgs.forEach((pkg) => {
    const distPath = `packages/${pkg}/dist`;
    if (fs.existsSync(distPath)) {
      fs.rmSync(distPath, { recursive: true, force: true });
    }
  });
};

// 🔑 使用 tsc -b 构建所有类型（在根目录执行）
const compileAllTypes = async () => {
  console.log("📝 Compiling all TypeScript projects with tsc -b...");

  try {
    await execa("npx", ["tsc", "-b", "--force"], {
      stdio: "inherit",
    });
    console.log("✅ All TypeScript projects compiled");
  } catch (error) {
    console.error("❌ Failed to compile TypeScript projects:", error.message);
    throw error;
  }
};

// 🔑 打包单个包
const bundlePackage = async (pkg) => {
  console.log(`📦 Bundling ${pkg}...`);

  try {
    await execa("rollup", ["-c", "--environment", `TARGET:${pkg}`], {
      stdio: "inherit",
    });
    console.log(`✅ Bundled ${pkg}`);
  } catch (error) {
    console.error(`❌ Failed to bundle ${pkg}:`, error.message);
    throw error;
  }
};

// 🔑 验证构建结果
const validateBuild = () => {
  console.log("🔍 Validating build results...");

  pkgs.forEach((pkg) => {
    const packageJsonPath = `packages/${pkg}/package.json`;
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
    const distPath = `packages/${pkg}/dist`;

    if (!fs.existsSync(distPath)) {
      throw new Error(`Missing dist directory for ${pkg}`);
    }

    // 检查必要的文件是否存在
    const expectedFiles = [
      packageJson.main && path.basename(packageJson.main),
      packageJson.module && path.basename(packageJson.module),
      packageJson.types && path.basename(packageJson.types),
    ].filter(Boolean);

    const actualFiles = fs.readdirSync(distPath);

    expectedFiles.forEach((expectedFile) => {
      if (!actualFiles.includes(expectedFile)) {
        throw new Error(`Missing expected file ${expectedFile} in ${pkg}/dist`);
      }
    });
  });

  console.log("✅ Build validation passed");
};

const main = async () => {
  console.log("🚀 Starting monorepo build...\n");

  try {
    // 1. 清理
    cleanAll();

    // 2. 编译所有类型声明文件（tsc -b 会按依赖顺序自动处理）
    await compileAllTypes();

    console.log("📦 Bundling all packages in parallel...");

    const bundlePromises = pkgs.map(async (pkg) => {
      console.log(`🔨 Starting bundle for ${pkg}...`);
      try {
        await bundlePackage(pkg);
        return { pkg, success: true };
      } catch (error) {
        console.error(`❌ Failed to bundle ${pkg}:`, error.message);
        return { pkg, success: false, error };
      }
    });

    // 3. 等待所有打包完成
    const results = await Promise.all(bundlePromises);

    // 检查是否有失败的包
    const failed = results.filter((r) => !r.success);
    if (failed.length > 0) {
      console.error(
        `❌ Failed to bundle: ${failed.map((r) => r.pkg).join(", ")}`
      );
      throw new Error("Some packages failed to bundle");
    }

    // 4. 验证构建结果
    validateBuild();

    console.log("✅ All packages bundled successfully");
  } catch (error) {
    console.error("\n❌ Build failed:", error.message);
    process.exit(1);
  }
};

main();
