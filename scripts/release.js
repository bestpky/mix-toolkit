#!/usr/bin/env node
import { execSync } from "child_process";
import {
  getPackages,
  readPackageJson,
  writePackageJson,
} from "./utils.js";

const versionType = process.argv[2];

if (!["patch", "minor", "major"].includes(versionType)) {
  console.error("Usage: node release.js <patch|minor|major>");
  process.exit(1);
}

function bumpVersion(version, type) {
  const [major, minor, patch] = version.split(".").map(Number);
  switch (type) {
    case "major": return `${major + 1}.0.0`;
    case "minor": return `${major}.${minor + 1}.0`;
    case "patch": return `${major}.${minor}.${patch + 1}`;
  }
}

function main() {
  const packages = getPackages();

  if (packages.length === 0) {
    console.error("❌ No packages found");
    process.exit(1);
  }

  // 取第一个包的版本作为基准（所有包版本一致）
  const baseVersion = readPackageJson(packages[0].path).version;
  const newVersion = bumpVersion(baseVersion, versionType);
  const tag = `v${newVersion}`;

  console.log(`\n🔄 Bumping ${versionType} version: ${baseVersion} → ${newVersion}\n`);

  // 更新所有包的版本
  for (const pkg of packages) {
    const packageJson = readPackageJson(pkg.path);
    packageJson.version = newVersion;
    writePackageJson(pkg.path, packageJson);
    console.log(`  📦 ${pkg.npmName}: ${newVersion}`);
  }

  // git commit + tag + push
  console.log(`\n🚀 Committing and tagging...\n`);
  execSync("git add .", { stdio: "inherit" });
  execSync(`git commit -m "bump version to ${newVersion}"`, { stdio: "inherit" });
  execSync(`git tag ${tag}`, { stdio: "inherit" });
  execSync("git push && git push --tags", { stdio: "inherit" });

  console.log(`\n✅ Released ${tag} — GitHub Actions will handle the rest.`);
}

main();
