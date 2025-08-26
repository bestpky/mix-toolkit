#!/usr/bin/env node
import { execSync } from "child_process";
import { getPackages, validatePackage, displayPackages } from "./utils.js";

// 检查npm登录状态
function checkNpmLogin() {
  try {
    const whoami = execSync("npm whoami", { encoding: "utf8" }).trim();
    console.log(`✅ Logged in as: ${whoami}`);
    return true;
  } catch {
    console.error('❌ Please run "npm login" first');
    return false;
  }
}

// 发布单个包
async function publishPackage(pkg) {
  console.log(`\n📦 Publishing ${pkg.name}...`);

  try {
    // 显示包信息
    console.log(`  📋 Package: ${pkg.npmName}@${pkg.version}`);

    // 发布包
    console.log(`  🚀 Publishing to npm...`);
    execSync("npm publish", { cwd: pkg.path, stdio: "inherit" });

    console.log(`  ✅ ${pkg.npmName} published successfully!`);
    return { success: true, pkg };
  } catch (error) {
    console.error(`  ❌ Failed to publish ${pkg.name}:`, error.message);
    return { success: false, pkg, error: error.message };
  }
}

// 发布指定包
async function publishSpecificPackage(packageName) {
  const packages = getPackages();
  const pkg = packages.find((p) => p.name === packageName);

  if (!pkg) {
    console.error(`❌ Package "${packageName}" not found`);
    console.log("\nAvailable packages:");
    displayPackages(packages);
    return false;
  }

  console.log(`🚀 Publishing specific package: ${packageName}\n`);

  // 检查登录和验证包
  if (!checkNpmLogin()) {
    return false;
  }

  const validation = validatePackage(pkg);
  if (!validation.valid) {
    console.error(`❌ Package validation failed: ${validation.reason}`);
    return false;
  }

  const result = await publishPackage(pkg);
  return result.success;
}

// 发布所有包
async function publishAllPackages() {
  const packages = getPackages();

  if (packages.length === 0) {
    console.error("❌ No packages found in packages directory");
    return false;
  }

  console.log("🚀 Publishing all packages...\n");
  displayPackages(packages);
  console.log("");

  // 检查npm登录
  if (!checkNpmLogin()) {
    return false;
  }

  // 验证所有包
  console.log("🔍 Validating packages...");
  for (const pkg of packages) {
    const validation = validatePackage(pkg);
    if (!validation.valid) {
      console.error(`❌ ${pkg.name}: ${validation.reason}`);
      return false;
    }
    console.log(`✅ ${pkg.name} validation passed`);
  }

  // 发布所有包
  console.log("\n🚀 Starting publication...");
  const results = [];

  for (const pkg of packages) {
    const result = await publishPackage(pkg);
    results.push(result);

    if (!result.success) {
      console.log("\n❌ Publication stopped due to error.");
      return false;
    }
  }

  // 显示结果
  const successCount = results.filter((r) => r.success).length;
  console.log(
    `\n🎉 All done! ${successCount}/${packages.length} packages published successfully.`
  );

  console.log("\n📋 Published packages:");
  results.forEach((r) => {
    if (r.success) {
      console.log(`  ✅ ${r.pkg.npmName}`);
    }
  });

  console.log("\n💡 Users can now install:");
  results.forEach((r) => {
    if (r.success) {
      console.log(`  npm install ${r.pkg.npmName}`);
    }
  });

  return true;
}

// 主函数
async function main() {
  const targetPackage = process.argv[2];

  let success;
  if (targetPackage) {
    success = await publishSpecificPackage(targetPackage);
  } else {
    success = await publishAllPackages();
  }

  process.exit(success ? 0 : 1);
}

main().catch((error) => {
  console.error("💥 Unexpected error:", error);
  process.exit(1);
});
