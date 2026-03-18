# mix-toolkit

## 发布流程

本项目通过 GitHub Actions 自动化发包，推送 tag 即可触发。

### 日常发版

```bash
pnpm release patch   # 补丁版本 0.0.1 → 0.0.2
pnpm release minor   # 次版本   0.0.1 → 0.1.0
pnpm release major   # 主版本   0.0.1 → 1.0.0
```

该命令会自动完成：

1. 更新所有包的 `package.json` 版本号
2. `git commit`
3. 打对应版本的 `git tag`
4. `git push` 推送代码和 tag

tag 推送后，GitHub Actions 会自动执行构建并发布到 npm。

### 首次配置

在 GitHub 仓库的 `Settings → Secrets and variables → Actions` 中添加：

| Secret 名称 | 说明 |
|------------|------|
| `NPM_TOKEN` | npm Access Token，需要有发包权限 |
