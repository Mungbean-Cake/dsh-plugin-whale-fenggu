# 📘 dsh-plugin-whale-fenggu 使用与开发教程

> 从「这是什么」到「怎么装、怎么用、怎么改、怎么发布」，一篇讲完。

---

## 目录

1. [背景：DeepSeek 峰谷计价与梗](#1-背景deepseek-峰谷计价与梗)
2. [安装：两种方式逐步来](#2-安装两种方式逐步来)
3. [使用指南：卡片、拖动、设置](#3-使用指南卡片拖动设置)
4. [配置详解](#4-配置详解)
5. [原理剖析：它是怎么工作的](#5-原理剖析它是怎么工作的)
6. [故障排查](#6-故障排查)
7. [二次开发与贡献](#7-二次开发与贡献)
8. [发布到 GitHub](#8-发布到-github)

---

## 1. 背景：DeepSeek 峰谷计价与梗

DeepSeek 官方 V4 API 自 **2026-08-17 00:00（北京时间）** 起实行**峰谷计价**：

| 时段 | 北京时间 | 价格档位 |
|---|---|---|
| 高峰 | 09:00–12:00、14:00–18:00 | 贵 |
| 低谷 | 其余时间（00:00–09:00、12:00–14:00、18:00–24:00） | 便宜 |

DeepSeek 创始人叫**梁文峰**，社区就玩起了谐音梗：
- **梁文峰** = 高峰时段（「峰」）💸
- **梁文谷** = 低谷时段（「谷」）🐟

本插件就是一只**蓝色大肥鱼**，常驻屏幕角落帮你盯「现在是梁文峰还是梁文谷」，并在切换前提前喊你。

---

## 2. 安装：两种方式逐步来

### 2.1 方式 A：正式安装（推荐）

**适用**：有 dsh CLI、希望插件随 profile 持久加载。

1. 把本项目放到任意目录（或 clone 下来）：
   ```sh
   git clone https://github.com/<你的用户名>/dsh-plugin-whale-fenggu.git
   ```
2. 安装到 web profile：
   ```sh
   dsh plugin --profile web add <本项目路径>
   ```
3. **Windows 桌面端**：安装前务必**完全退出 DSH Desktop（含托盘图标）**，否则 pnpm 会因 `lightningcss` 等被占用报 `EPERM`
4. 重启 DSH Desktop，页面按 **Ctrl+Shift+R** 强制刷新

> 安装后插件写入 profile 的 `package.json` + `pnpm-lock.yaml`，并记录「受保护安装事务」——重启、更新依赖都不会丢。

### 2.2 方式 B：过渡注入（零安装）

**适用**：不想动 profile、想先试试效果。

`lib/widget.raw.js` 是**自包含的 IIFE**（无依赖、无构建），可以注入到任何一个已加载的客户端插件里。以余额监控插件为例：

1. 打开（例如）`~/.dsh/profiles/web/node_modules/@rainronin/dsh-balance-monitor/lib/client.js`
2. 找到工厂函数末尾的 `return module.exports;`
3. 在它**之前**粘贴 `lib/widget.raw.js` 的全部内容
4. 保存 → 页面 **Ctrl+Shift+R** 强制刷新

> ⚠️ 过渡注入的代价：node_modules 被 pnpm 重链时会被还原（比如安装/更新了其他插件），需要重新注入。

---

## 3. 使用指南：卡片、拖动、设置

### 3.1 卡片信息

卡片分三块：
- **头部**：🐳 蓝色大肥鱼 + 「DeepSeek 峰谷提醒 v1.0.0」
- **主区**：当前时段（梁文峰 ⛰️ / 梁文谷 🌙）+ 高峰/谷时徽标 + 北京时间 + 距切换倒计时
- **贴士区**：省 token 小贴士轮播（每次刷新随机一条）

### 3.2 自由拖动

- **拖动**：按住卡片**任意空白处**（头部、贴士区、拖拽提示条）移动，松手即保存位置
- **记忆**：位置写入 Cookie + localStorage——DSH Desktop 每次启动端口都不同，Cookie 不区分端口，所以**重启后位置还在**
- **边界**：拖不出屏幕；窗口缩放时自动钳回可视区

### 3.3 设置面板

点 **⚙️ 设置** 展开：

| 控件 | 作用 |
|---|---|
| 启用提醒 | 总开关（关闭后卡片半透明） |
| 提前提醒（分钟） | 切换前 N 分钟提醒，1–120 |
| 位置 | 左下 / 右下 / 自定义（拖动） |
| 站内 toast | 提醒气泡开关 |
| 小贴士轮播 | 贴士区开关 |
| 🔄 回左下角 | 一键复位到默认位置 |

### 3.4 播报与测试

- **📢 播报**：立即弹出当前时段的小肥鱼台词
- **🧪 测试**：模拟一次切换提醒的 toast 样式

### 3.5 提前提醒机制

- 每 20 秒检查一次（页面可见时额外立即校准）
- 当距下一时段切换 **≤ 提前量** 时弹出 toast
- 每个「日期+目标时段」只提醒一次（`lastNotified` 记录），不会反复打扰

---

## 4. 配置详解

配置键 `whaleFengguReminder:config`（Cookie 与 localStorage 双写）：

```json
{
  "enabled": true,
  "leadMinutes": 10,
  "position": "left",
  "pos": { "x": 640, "y": 320 },
  "toast": true,
  "tips": true,
  "lastNotified": "{}"
}
```

| 键 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `enabled` | boolean | true | 总开关 |
| `leadMinutes` | number | 10 | 提前提醒分钟数（1–120） |
| `position` | string | left | `left` / `right` / `custom` |
| `pos` | {x,y} | null | 拖动后的像素坐标 |
| `toast` | boolean | true | toast 提醒开关 |
| `tips` | boolean | true | 贴士轮播开关 |
| `lastNotified` | string(JSON) | {} | 已提醒记录 |

> 想手动改配置？浏览器控制台执行：
> ```js
> localStorage.setItem('whaleFengguReminder:config', JSON.stringify({ enabled:true, leadMinutes:15, position:'right', pos:null, toast:true, tips:true, lastNotified:'{}' }));
> ```

---

## 5. 原理剖析：它是怎么工作的

### 5.1 北京时间

用 `Intl.DateTimeFormat('zh-CN', { timeZone: 'Asia/Shanghai' })` 取北京墙钟时分秒。
北京无夏令时，因此把「北京墙钟时间」编码成统一 epoch（`Date.UTC(y,mo-1,d,h,mi,s)`）做比较与排程，天然无时区坑。

### 5.2 峰谷判定

```js
// 每日分钟数 minuteOfDay = h*60 + mi
// 高峰：minuteOfDay ∈ [540,720) ∪ [840,1080)
// 即 09:00–12:00 与 14:00–18:00
```

### 5.3 切换调度

取下一个大于当前分钟的边界（09/12/14/18 点），跨日则回到次日 09:00，返回 `{ toName, minutesLeft }`。

### 5.4 持久化（跨端口）

DSH Desktop 每次启动端口随机，而 `localStorage` 按**源（协议+主机+端口）**隔离——端口一变配置就丢。
**Cookie 不区分端口**（同主机共享），所以插件把配置**双写**：
`localStorage`（当前端口快速读）+ `document.cookie`（跨端口兜底）。

### 5.5 健壮性设计

- **坐标净化** `sanitizePos()`：NaN/越界一律钳制回可视区，绝不落到文档流末尾
- **自愈**：每 20s 巡检，卡片被外部移除会自动重建；定时器防重复（`__WHALE_FENGGU_TIMER__`）
- **去重**：`window.__WHALE_FENGGU__` 保证同一页面只初始化一次（多插件注入也不会出现两张卡片）
- **错误隔离**：渲染/提醒/初始化全部 try/catch，单点故障不影响页面

---

## 6. 故障排查

| 现象 | 原因 | 处理 |
|---|---|---|
| 卡片不见了 | 页面缓存旧 bundle / 注入被还原 | Ctrl+Shift+R；重新注入或正式安装 |
| 位置回到左下角 | 端口变了且配置未持久化 | v1.0.0 已用 Cookie 跨端口持久化；升级后重新拖动一次即可 |
| 市场按钮回来了 | UI 微调 CSS 被还原 | 重新注入 / 正式安装 |
| 余额显示没了 | 页面停在失败状态 | 强制刷新 |
| 安装报 `EPERM` | 桌面端未完全退出 | 退出（含托盘）后再装 |
| 安装报「another recovery transaction is pending」 | 旧的终态恢复事务未清理 | 删除 `%APPDATA%/DSH Desktop/plugin-install-recovery/state.json`（确认 phase 为 rolled-back/verified 后再删） |
| 启动报「loaded without registering」 | 客户端 bundle 缺 `__ModuleLoader__.load` 包装 | 用本仓库 `lib/client.js`（标准包装版），不要用裸 `widget.raw.js` 当插件包 |

---

## 7. 二次开发与贡献

### 7.1 改什么

- 台词/贴士：`lib/widget.raw.js` 里的 `TIPS` / `COPY`
- 样式：`ensureStyle()` 里的 CSS 数组（与 blue-fantasy 皮肤一致的靛蓝紫调）
- 峰谷规则：`BOUNDARIES` / `PEAKS`（一般不需要动）

### 7.2 改完怎么验证

```sh
node --check lib/client.js
node --check lib/widget.raw.js
node --check lib/index.js
```

### 7.3 改完怎么组装

改完 `widget.raw.js` 后，需要重新包一层客户端注册外壳：

```js
window.__ModuleLoader__.load({
  id: 'dsh-plugin-whale-fenggu',
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
    const inject = [];
    function apply() {
      /* 粘贴 widget.raw.js 内容 */
    }
    module.exports = { inject, apply };
    return module.exports;
  }
});
```

### 7.4 提 PR

1. Fork 本仓库
2. 新建分支 → 修改 → `node --check` 通过 → 提交 PR
3. CI 会自动跑语法检查（`.github/workflows/ci.yml`）

---

## 8. 发布到 GitHub

### 8.1 网页上传（不需要 git）

1. 打开 https://github.com/new ，填仓库名（如 `dsh-plugin-whale-fenggu`），选 Public，勾选 README（可跳过）
2. 创建后进入仓库页 → 点 **Add file → Upload files**
3. 把本项目**除 `install-whale-fenggu.cmd` 外**的所有文件拖进去（`client.js`、`lib/`、`docs/`、`package.json`、`cordis.patch.yml`、`README.md`、`LICENSE`、`.gitignore`、`.github/`）
4. Commit changes

### 8.2 用 git 命令行（推荐）

```sh
# 在项目目录执行
git init
git add .
git commit -m "feat: whale-fenggu-reminder v1.0.0"

# 关联远程仓库（<USER> 换成你的 GitHub 用户名）
git remote add origin https://github.com/<USER>/dsh-plugin-whale-fenggu.git
git branch -M main
git push -u origin main
```

> 如果本机没装 git：到 https://git-scm.com/download/win 安装后重开终端；
> 或者用 GitHub Desktop（https://desktop.github.com）图形化操作。

### 8.3 发布后建议

- 把 `package.json` 里的 `repository` / `homepage` 从 `YOUR_NAME` 占位改成你的真实地址
- 补两张真实截图到 README 的「截图」小节
- 在仓库 About 里加标签：`dsh` `plugin` `deepseek` `峰谷提醒`

---

## 免责声明

时段划分依据 DeepSeek 官方 V4 峰谷定价公告；如官方调整以官方为准。
本插件只负责提醒，不负责替你省钱（但真的很想帮你省）。
