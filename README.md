# 🐳 dsh-plugin-whale-fenggu — 蓝色大肥鱼 · DeepSeek 峰谷提醒

> **现在是【梁文峰】还是【梁文谷】？小肥鱼帮你盯着，切换前提前喊你，顺便提醒你省 token、站起来蹬。**

一个为 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) Web GUI 设计的**纯前端、零依赖**插件：
按北京时间实时判断 DeepSeek 官方峰谷计价时段，在时段切换前按设定提前量提醒，
并附带一个可爱的「蓝色大肥鱼」看板（可自由拖动、位置自动记忆）。

## 🎭 梗科普：梁文峰 / 梁文谷

DeepSeek 创始人叫**梁文峰**。DeepSeek 官方 V4 采用**北京时间峰谷计价**，于是社区玩梗：

| 时段 | 名字 | 北京时间 | 价格 |
|---|---|---|---|
| ⛰️ 高峰 | **梁文峰** | 09:00–12:00、14:00–18:00 | 贵 💸 |
| 🌙 低谷 | **梁文谷** | 其余时间 | 便宜 🐟 |

本插件就是那个帮你盯着「峰峰/谷谷」谁在值班的小肥鱼 🐳

## ✨ 特性

- 🕐 **实时播报**：左下角小肥鱼卡片显示当前是梁文峰（⛰️ 高峰贵）还是梁文谷（🌙 谷时便宜）+ 北京时间 + 距切换倒计时
- ⏰ **提前提醒**：切换前 N 分钟弹出站内 toast（默认提前 10 分钟，可设 1–120 分钟）
- 🖐️ **自由拖动**：按住卡片任意空白处拖动，位置自动记忆（Cookie + localStorage 双持久化，**重启不丢**）
- ⚙️ **可配置**：启用开关、提前量、位置（左下/右下/自定义）、toast 开关、贴士轮播开关、一键复位
- 🧪 **整活**：手动播报、测试提醒、省 token 小贴士轮播（「站起来蹬！省下的每一分 token 都是小肥鱼的加餐！」）
- 📖 **省 token 手册**：卡片设置内置省 token 指南（合并请求、长会话开新档、高峰少跑重活……）
- 🎨 **皮肤适配**：UI 跟随「蓝色幻想 / blue-fantasy」风格（靛蓝紫调、毛玻璃、圆角、漂浮动画）
- 🛡️ **健壮**：位置永不离屏、组件被外部移除自动重建、单点错误隔离、防重复提醒

## 📷 截图

> 欢迎提交截图！占位：卡片 + 提醒 toast 效果图。

## 📥 安装

> 依赖：DSH Desktop（或 dsh web profile），DeepSeek 官方 V4 峰谷定价生效（2026-08-17 起）。

### 方式 A：正式安装（推荐，永久生效）

```sh
# 1. 克隆/解压本项目，或直接指向本目录
# 2. 安装（dsh plugin 会写 lockfile + 受保护事务，重启后不丢）
dsh plugin --profile web add <本项目路径>

# 3. 重启 DSH Desktop，Ctrl+Shift+R 强制刷新
```

> Windows 桌面端注意：**安装前请完全退出 DSH Desktop（含托盘图标）**，
> 否则 pnpm 会因文件占用报 `EPERM`。

### 方式 B：过渡注入（不想装插件时）

本项目提供 **`lib/widget.raw.js`**（自包含 IIFE，无任何依赖），
可以把它注入到任意**已加载的客户端插件**中（例如余额监控插件
`@rainronin/dsh-balance-monitor` 的 `lib/client.js`，在其工厂的
`return module.exports` 之前插入），刷新页面即可生效。

```js
// balance-monitor/lib/client.js 的 factory 内、module.exports 之前：
// 粘贴 lib/widget.raw.js 的全部内容（自带去重与 DOM ready 处理）
```

> ⚠️ 过渡注入的代价：node_modules 被 pnpm 重链（如安装/更新其他插件）时会被还原，需要重新注入。

## 🎮 使用

1. 启动后，左下角（默认位置）出现小肥鱼卡片，实时显示时段与倒计时
2. **拖动**：按住卡片任意空白处（头部、贴士区）拖动到任意位置
3. **设置**：点 ⚙️ 打开面板 —— 提前提醒分钟数 / 位置 / 开关 / 贴士 / **🔄 回左下角**复位
4. **播报**：📢 手动听小肥鱼报当前时段；🧪 测试提醒样式
5. **提醒**：到切换时间前 N 分钟，屏幕下方弹出小肥鱼的提示 toast（防重复，每个时段切换只提醒一次）

## ⚙️ 配置项

| 键 | 默认 | 说明 |
|---|---|---|
| `enabled` | true | 总开关 |
| `leadMinutes` | 10 | 切换前提前提醒分钟数（1–120） |
| `position` | left | 预设位置：左下 / 右下 |
| `pos` | null | 自定义坐标（拖动后自动记录 `{x,y}`） |
| `toast` | true | 站内 toast 提醒开关 |
| `tips` | true | 省 token 小贴士轮播开关 |
| `lastNotified` | {} | 已提醒记录（防重复，自动维护） |

配置存储：**Cookie + localStorage 双写**（`whaleFengguReminder:config`）。
Cookie 不区分端口 → DSH Desktop 每次启动换端口也不丢配置。

## 📂 项目结构

```
dsh-plugin-whale-fenggu/
├── lib/
│   ├── index.js        # 宿主半（空插件，占位）
│   ├── client.js       # 浏览器半（标准 dsh 客户端 bundle：__ModuleLoader__.load 包装）
│   └── widget.raw.js   # 自包含组件源码（过渡注入用，也是 client.js 的本体）
├── cordis.patch.yml    # dsh bundle 声明（insert 插件行）
├── package.json        # 插件包清单
├── README.md           # 本文档
├── docs/TUTORIAL.md    # 详细教程（原理 + 排错 + 贡献）
├── LICENSE             # MIT
└── .github/workflows/ci.yml  # 语法检查 CI
```

## 🔬 原理速览

- **北京时间**：`Intl.DateTimeFormat('Asia/Shanghai')`，无夏令时，与官方规则一致
- **峰谷规则**：每日边界 09:00 / 12:00 / 14:00 / 18:00；高峰 `[09:00,12:00)` 与 `[14:00,18:00)`
- **切换调度**：墙钟时间编码为统一 epoch 比较，取下一个边界计算剩余分钟数
- **持久化**：Cookie（跨端口）+ localStorage（当前端口）双写
- **健壮性**：坐标净化防 NaN 离屏、20s 自愈巡检、错误 try/catch 隔离、`__WHALE_FENGGU__` 全局去重

详见 [docs/TUTORIAL.md](docs/TUTORIAL.md)。

## ❓ 常见问题

**Q：为什么重启后卡片位置/设置没丢？**
A：配置存在 Cookie（跨端口）。DSH Desktop 每次启动端口不同，localStorage 按端口隔离，Cookie 不隔离。

**Q：卡片不见了？**
A：① 先 Ctrl+Shift+R 强制刷新；② 过渡注入被 pnpm 重链还原 → 重新注入或改用正式安装。

**Q：市场按钮 / 布局微调是什么？**
A：`lib/widget.raw.js` 内置了三条 UI 微调 CSS：隐藏「插件市场」底部按钮、让余额徽章独占一行（配合余额监控插件）。正式安装后随插件一并生效。

**Q：会重复提醒吗？**
A：不会。每次时段切换按「日期+目标时段」记录，只提醒一次。

## 📄 许可证

[MIT](LICENSE) © 2026 dsh-plugin-whale-fenggu contributors

## 🙏 致谢

- 峰谷计价规则参考 [@rainronin/dsh-balance-monitor](https://github.com/Rainronin/dsh-balance-monitor)
- 皮肤风格参考 dsh-web-ui 全家桶 / blue-fantasy
- 「梁文峰/梁文谷」梗来自 DeepSeek 社区
