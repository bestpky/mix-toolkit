#!/usr/bin/env node
import {
  getPackages,
  readPackageJson,
  writePackageJson,
  displayPackages,
} from "./utils.js";

const versionType = process.argv[2];
const targetPackage = process.argv[3]; // 可选：指定单个包

if (!["patch", "minor", "major"].includes(versionType)) {
  console.error("Usage: node version.js <patch|minor|major> [package-name]");
  console.error("Examples:");
  console.error(
    "  node version.js patch                    # 升级所有包的 patch 版本"
  );
  console.error(
    "  node version.js minor better-lazy-image  # 只升级指定包的 minor 版本"
  );
  process.exit(1);
}

function bumpVersion(version, type) {
  const [major, minor, patch] = version.split(".").map(Number);

  switch (type) {
    case "major":
      return `${major + 1}.0.0`;
    case "minor":
      return `${major}.${minor + 1}.0`;
    case "patch":
      return `${major}.${minor}.${patch + 1}`;
    default:
      throw new Error(`Invalid version type: ${type}`);
  }
}

function updatePackageVersion(pkg) {
  try {
    const packageJson = readPackageJson(pkg.path);
    const oldVersion = packageJson.version;
    const newVersion = bumpVersion(oldVersion, versionType);

    packageJson.version = newVersion;
    writePackageJson(pkg.path, packageJson);

    return { success: true, oldVersion, newVersion };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function main() {
  // 获取所有包
  const allPackages = getPackages();

  if (allPackages.length === 0) {
    console.error("❌ No packages found in packages directory");
    process.exit(1);
  }

  // 确定要更新的包
  let packagesToUpdate;

  if (targetPackage) {
    const pkg = allPackages.find((p) => p.name === targetPackage);
    if (!pkg) {
      console.error(`❌ Package "${targetPackage}" not found`);
      console.log("\nAvailable packages:");
      displayPackages(allPackages);
      process.exit(1);
    }
    packagesToUpdate = [pkg];
    console.log(`🔄 Bumping ${versionType} version for ${targetPackage}...\n`);
  } else {
    packagesToUpdate = allPackages;
    console.log(`🔄 Bumping ${versionType} version for all packages...\n`);
    displayPackages(packagesToUpdate);
    console.log("");
  }

  // 更新版本
  const results = [];
  let hasErrors = false;

  for (const pkg of packagesToUpdate) {
    const result = updatePackageVersion(pkg);

    if (result.success) {
      console.log(
        `📦 ${pkg.name}: ${result.oldVersion} → ${result.newVersion}`
      );
      results.push({
        name: pkg.name,
        npmName: pkg.npmName,
        oldVersion: result.oldVersion,
        newVersion: result.newVersion,
      });
    } else {
      console.error(`❌ ${pkg.name}: ${result.error}`);
      hasErrors = true;
    }
  }

  if (hasErrors) {
    console.error("\n❌ Some packages failed to update");
    process.exit(1);
  }

  // 显示结果
  console.log("\n✅ Version bump complete!");

  if (results.length > 0) {
    console.log("\n📋 Updated versions:");
    results.forEach((r) => {
      console.log(`  ${r.npmName}: ${r.oldVersion} → ${r.newVersion}`);
    });

    console.log("\n💡 Next steps:");
    console.log("  1. git add .");
    console.log('  2. git commit -m "bump version"');
    console.log("  3. npm run publish");
  }
}

main();
