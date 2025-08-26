import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import path from "path";
import fs from "fs";

const TARGET = process.env.TARGET;

if (!TARGET) {
  throw new Error(
    "TARGET package must be specified via --environment TARGET:package-name"
  );
}

const packageDir = path.resolve(`packages/${TARGET}`);
const packageJson = JSON.parse(
  fs.readFileSync(path.resolve(packageDir, "package.json"), "utf-8")
);

// 判断是否为外部依赖
const isExternal = (id) => {
  // 1. monorepo 内部包视为外部依赖（关键修改）
  if (id.startsWith("@mix-toolkit/")) {
    return true;
  }

  // 2. node_modules 中的包视为外部依赖
  if (!id.startsWith(".") && !path.isAbsolute(id)) {
    return true;
  }

  // 3. 相对路径但指向其他包的文件也视为外部依赖
  if (id.startsWith("../") && !id.startsWith(`../${TARGET}/`)) {
    return true;
  }

  return false;
};

const config = {
  input: path.resolve(packageDir, "src/index.ts"),
  external: isExternal,
  plugins: [
    resolve({
      preferBuiltins: false,
    }),
    commonjs(),
    typescript({
      tsconfig: path.resolve(packageDir, "tsconfig.build.json"),
      outputToFilesystem: false, // 不输出到文件系统，避免冲突
      exclude: ["**/*.test.ts", "**/*.spec.ts"],
    }),
  ],
  output: [
    // ES模块
    packageJson.module && {
      file: path.resolve(packageDir, packageJson.module),
      format: "es",
      sourcemap: false,
    },
    // CommonJS
    packageJson.main && {
      file: path.resolve(packageDir, packageJson.main),
      format: "cjs",
      exports: "auto",
      sourcemap: false,
    },
    // UMD (如果需要)
    packageJson.browser && {
      file: path.resolve(packageDir, packageJson.browser),
      format: "umd",
      name: `MixToolkit${TARGET.split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join("")}`,
      sourcemap: false,
      globals: {
        "@mix-toolkit/better-lazy-image": "MixToolkitBetterLazyImage",
      },
    },
  ].filter(Boolean),
};

export default config;
