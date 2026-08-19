# Changelog

## [v1.1.0] - 2026-08-19

### Added
- 透明度调节（0.2–1，设置面板滑块）
- 显示/隐藏开关：关闭后卡片缩成小鱼圆点，点击恢复
- 极简模式：只显示当前状态（梁文峰/梁文谷），⤢ 一键退出

# Changelog

## [v1.0.1] - 2026-08-19

### Fixed
- 卡片位置改为构建时内联钉死（`position:fixed` + 立即定位），不再依赖外部 CSS 与后续渲染
- `render()` 改为位置优先，任何 DOM 更新出错都不会导致卡片掉到页面底部
- 样式注入增加 `documentElement` 兜底（`head` 不可用时）

## [v1.0.0] - 2026-08-19

### Added
- 北京时间峰谷实时播报（梁文峰 ⛰️ / 梁文谷 🌙），规则与 DeepSeek 官方 V4 一致
- 切换前 N 分钟提前提醒（默认 10 分钟，可设 1–120）
- 自由拖动 + 位置记忆（Cookie 跨端口 + localStorage 双持久化）
- 设置面板：启用/提前量/位置/toast/贴士/一键复位
- 省 token 小贴士轮播（站起来蹬！）
- UI 微调：隐藏插件市场底部按钮、余额徽章独占一行
- 健壮性：坐标净化、20s 自愈、错误隔离、防重复提醒、全局去重
- 标准 dsh bundle：宿主半 + 客户端半（`__ModuleLoader__.load` 包装）
- 文档：README（梗科普/安装/使用/FAQ）+ docs/TUTORIAL.md（原理/排错/开发/发布）
- CI：`.github/workflows/ci.yml` 语法检查；MIT License
