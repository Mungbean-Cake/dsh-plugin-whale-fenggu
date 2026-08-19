window.__ModuleLoader__.load({
  id: 'dsh-plugin-whale-fenggu',
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

    const inject = [];
    function apply() {
      /* widget 代码：在插件激活时运行（自带 DOM ready 处理与去重） */
      /*!
       * 蓝色大肥鱼 · 梁文峰 / 梁文谷 提醒插件 (whale-fenggu-reminder) v1.1.0
       * =====================================================================
       * 纯前端自包含模块：无依赖、无需构建。
       * v0.3.0 加固：
       *   - 位置永不离屏：始终写入显式 left/top（不再依赖类名预设），非法/NaN 坐标自动净化；
       *   - 自愈：组件被外部移除后自动重建，定时器防重复；
       *   - 错误隔离：render/提醒/初始化全部 try/catch，单点故障不影响页面；
       *   - 聚焦输入不被 20s 刷新覆盖；双击头部可复位到左下角。
       * 功能：北京时间峰谷播报（梁文峰/梁文谷）、切换前提前提醒、省 token 贴士、自由拖动。
       */
      (function () {
        'use strict';
      
        var NS = 'whaleFengguReminder';
        var CFG_KEY = NS + ':config';
        var MIN_MS = 60 * 1000;
        var DAY_MS = 24 * 60 * MIN_MS;
        var VERSION = '1.1.0';
      
        // 已存在且仍在文档里 → 不重复初始化；否则（被外部清掉）重建
        var existing = null;
        try { existing = document.getElementById(NS + '-root'); } catch (e) { existing = null; }
        if (window.__WHALE_FENGGU__ && existing && document.body && document.body.contains(existing)) return;
        window.__WHALE_FENGGU__ = true;
      
        var BOUNDARIES = [9 * 60, 12 * 60, 14 * 60, 18 * 60];
        var PEAKS = [
          [9 * 60, 12 * 60],
          [14 * 60, 18 * 60]
        ];
      
        var TIPS = [
          '小贴士：能合并的请求尽量合并发，token 不会自己游回来～',
          '小贴士：长会话记得及时开新档，旧账按峰谷计价，贵着呢！',
          '小贴士：高峰时段别跑批量任务，攒到谷时再冲业绩，省下来的都是饲料！',
          '站起来蹬！省下的每一分 token 都是小肥鱼的加餐！',
          '小贴士：一次性问清楚再动手，来回拉扯最费 token～',
          '小贴士：用 run_code 把小调用聚成一个大任务，省得来回折腾。',
          '谷时多干活，峰时多摸鱼——小肥鱼亲测有效！',
          '免费识图吃白饭的蓝色大肥鱼提醒你：付费 token 更要省着用！',
          '写完记得站起来蹬两圈，腰好腿好，token 省一半！',
          '拖动小肥鱼可以换位置，设置里可以复位～'
        ];
      
        var COPY = {
          peak: '🐳 现在是【梁文峰】！峰峰上岗，token 贵！小肥鱼帮你盯梢，能省的都省省，站起来蹬！',
          valley: '🐳 现在是【梁文谷】！谷谷值守，token 便宜！放心大胆写，但写累了记得站起来蹬～',
          toPeak: '⚠️ 还有 {n} 分钟【梁文峰】就要接岗了！贵的要来了，手头活先收个尾，站起来蹬两圈！',
          toValley: '🎉 还有 {n} 分钟【梁文谷】就要上岗了！便宜 token 马上到账，先伸个懒腰，马上开工！',
          armed: '🔔 已开启：切换前 {n} 分钟提醒（当前{phase}）。',
          test: '🧪 测试播报：{phase} 正在接岗，小肥鱼整活中，请勿当真～',
          reset: '🔄 已复位到左下角～双击头部随时可以复位！'
        };
      
        function loadCfg() {
          var base = {
            enabled: true,
            leadMinutes: 10,
            position: 'left',
            pos: null,
            toast: true,
            tips: true,
            opacity: 0.95,
            visible: true,
            minimal: false,
            lastNotified: '{}'
          };
          try {
            var raw = localStorage.getItem(CFG_KEY);
            if (!raw) {
              try {
                var parts = document.cookie.split(';');
                for (var ci = 0; ci < parts.length; ci++) {
                  var kv = parts[ci].trim();
                  if (kv.indexOf(NS + '=') === 0) { raw = decodeURIComponent(kv.slice(NS.length + 1)); break; }
                }
              } catch (ce) { /* ignore */ }
            }
            var saved = JSON.parse(raw || '{}');
            for (var k in saved) if (saved.hasOwnProperty(k)) base[k] = saved[k];
          } catch (e) { /* ignore */ }
          base.pos = sanitizePos(base.pos);
          if (base.pos) base.position = 'custom';
          return base;
        }
      
        function saveCfg(cfg) {
          try { localStorage.setItem(CFG_KEY, JSON.stringify(cfg)); } catch (e) { /* ignore */ }
          try {
            document.cookie = NS + '=' + encodeURIComponent(JSON.stringify(cfg)) + '; path=/; max-age=31536000; SameSite=Lax';
          } catch (e2) { /* ignore */ }
        }
      
        /** 位置净化：非法/越界一律钳制；完全非法则返回 null（回落预设）。 */
        function sanitizePos(pos) {
          if (!pos || typeof pos !== 'object') return null;
          var x = Number(pos.x);
          var y = Number(pos.y);
          if (!isFinite(x) || !isFinite(y)) return null;
          var w = root ? (root.offsetWidth || 240) : 240;
          var h = root ? (root.offsetHeight || 180) : 180;
          x = Math.min(Math.max(0, Math.round(x)), Math.max(0, (window.innerWidth || 800) - w));
          y = Math.min(Math.max(0, Math.round(y)), Math.max(0, (window.innerHeight || 600) - h));
          return { x: x, y: y };
        }
      
        function bjParts(now) {
          var p = new Intl.DateTimeFormat('zh-CN', {
            timeZone: 'Asia/Shanghai',
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', second: '2-digit',
            hour12: false
          }).formatToParts(now || new Date());
          function g(t) {
            var x = null;
            for (var i = 0; i < p.length; i++) if (p[i].type === t) x = p[i];
            return x ? parseInt(x.value, 10) : 0;
          }
          return { y: g('year'), mo: g('month'), d: g('day'), h: g('hour') % 24, mi: g('minute'), s: g('second') };
        }
      
        function bjWallMs(now) {
          var b = bjParts(now);
          return Date.UTC(b.y, b.mo - 1, b.d, b.h, b.mi, b.s);
        }
      
        function isPeakAt(min) {
          for (var i = 0; i < PEAKS.length; i++) {
            if (min >= PEAKS[i][0] && min < PEAKS[i][1]) return true;
          }
          return false;
        }
      
        function phaseOf(min) { return isPeakAt(min) ? '梁文峰' : '梁文谷'; }
      
        function wallClock(now) {
          var b = bjParts(now);
          function pad(n) { return (n < 10 ? '0' : '') + n; }
          return pad(b.h) + ':' + pad(b.mi) + ':' + pad(b.s);
        }
      
        function nextTransition(now) {
          var nowMs = bjWallMs(now);
          var day = Math.floor(nowMs / DAY_MS) * DAY_MS;
          var cur = Math.floor((nowMs - day) / MIN_MS);
          var next = null;
          for (var i = 0; i < BOUNDARIES.length; i++) {
            if (BOUNDARIES[i] > cur) { next = BOUNDARIES[i]; break; }
          }
          var atMs, toName;
          if (next === null) {
            atMs = day + DAY_MS + BOUNDARIES[0] * MIN_MS;
            toName = '梁文峰';
          } else {
            atMs = day + next * MIN_MS;
            toName = phaseOf(next);
          }
          return { toName: toName, minutesLeft: Math.max(0, Math.round((atMs - nowMs) / MIN_MS)), atWallMs: atMs };
        }
      
        function toast(msg) {
          try {
            var cfg = loadCfg();
            if (!cfg.toast) return;
            var host = document.getElementById(NS + '-toast-host');
            if (!host) {
              host = document.createElement('div');
              host.id = NS + '-toast-host';
              host.style.cssText =
                'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:2147483646;' +
                'display:flex;flex-direction:column;gap:8px;align-items:center;pointer-events:none;max-width:min(92vw,560px);';
              document.body.appendChild(host);
            }
            var el = document.createElement('div');
            el.style.cssText =
              'background:rgba(22,28,54,.94);color:#dbe4ff;border:1px solid rgba(122,140,255,.5);' +
              'border-radius:14px;padding:10px 16px;font-size:13px;line-height:1.5;box-shadow:0 6px 24px rgba(0,0,0,.4);' +
              'backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);' +
              'animation:' + NS + '-pop .25s ease-out;white-space:pre-wrap;text-align:center;pointer-events:auto;cursor:pointer;';
            el.textContent = msg;
            el.addEventListener('click', function () { el.remove(); });
            host.appendChild(el);
            while (host.children.length > 3) host.firstChild.remove();
            setTimeout(function () {
              el.style.transition = 'opacity .4s, transform .4s';
              el.style.opacity = '0';
              el.style.transform = 'translateY(-6px)';
              setTimeout(function () { el.remove(); }, 420);
            }, 9000);
          } catch (e) { /* toast 出错不影响其他 */ }
        }
      
        var root = null;
        var drag = null;
      
        function ensureStyle() {
          if (document.getElementById(NS + '-css')) return;
          var css = document.createElement('style');
          css.id = NS + '-css';
          css.textContent = [
            '@keyframes ' + NS + '-pop { from { opacity:0; transform:translateY(8px) scale(.96);} to { opacity:1; transform:translateY(0) scale(1);} }',
            '@keyframes ' + NS + '-float { 0%,100% { transform:translateY(0);} 50% { transform:translateY(-3px);} }',
            '#' + NS + '-root{position:fixed;z-index:2147483645;width:240px;border-radius:16px;padding:12px 14px;',
            'background:linear-gradient(160deg,rgba(36,44,84,.92),rgba(24,30,62,.95));',
            'color:#dfe6ff;border:1px solid rgba(122,140,255,.5);box-shadow:0 8px 28px rgba(0,0,0,.45);',
            'backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);',
            'font-family:inherit;font-size:13px;line-height:1.55;user-select:none;',
            'transition:opacity .3s, transform .3s;}',
            '#' + NS + '-root.wf-dragging{transition:none;user-select:none;cursor:grabbing;}',
            '#' + NS + '-head{display:flex;align-items:center;gap:8px;cursor:grab;touch-action:none;-webkit-user-drag:none;}',
            '#' + NS + '-head:active{cursor:grabbing;}',
            '#' + NS + '-avatar{font-size:20px;animation:' + NS + '-float 3s ease-in-out infinite;pointer-events:none;}',
            '#' + NS + '-title{font-weight:700;font-size:13px;pointer-events:none;}',
            '#' + NS + '-phase{font-weight:800;font-size:17px;background:linear-gradient(90deg,#8ea4ff,#c3a8ff);-webkit-background-clip:text;background-clip:text;color:transparent;}',
            '#' + NS + '-sub{margin-top:5px;color:#aab6e8;font-size:12px;}',
            '#' + NS + '-tip{margin-top:8px;padding:7px 9px;border-radius:10px;background:rgba(122,140,255,.12);color:#c7d2ff;font-size:12px;min-height:34px;}',
            '#' + NS + '-actions{display:flex;gap:6px;margin-top:9px;}',
            '#' + NS + '-actions button{flex:1;border:1px solid rgba(122,140,255,.5);background:rgba(122,140,255,.14);color:#dbe4ff;border-radius:9px;padding:5px 0;font-size:12px;cursor:pointer;}',
            '#' + NS + '-actions button:hover{background:rgba(122,140,255,.28);}',
            '#' + NS + '-panel{margin-top:9px;border-top:1px dashed rgba(122,140,255,.4);padding-top:9px;display:none;}',
            '#' + NS + '-root.wf-open #' + NS + '-panel{display:block;}',
            '#' + NS + '-panel label{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:5px 0;font-size:12px;}',
            '#' + NS + '-panel input[type=number]{width:62px;background:rgba(8,12,30,.6);border:1px solid rgba(122,140,255,.45);color:#dfe6ff;border-radius:7px;padding:3px 6px;font-size:12px;}',
            '#' + NS + '-panel input[type=checkbox]{accent-color:#8ea4ff;}',
            '#' + NS + '-panel select{background:rgba(8,12,30,.6);border:1px solid rgba(122,140,255,.45);color:#dfe6ff;border-radius:7px;padding:3px 5px;font-size:12px;}',
            '#' + NS + '-help{margin-top:8px;font-size:12px;color:#b9c4f0;}',
            '#' + NS + '-help li{margin:3px 0;}',
            '#' + NS + '-badge{display:inline-block;background:rgba(142,164,255,.18);border:1px solid rgba(142,164,255,.5);color:#c7d2ff;border-radius:999px;padding:1px 8px;font-size:11px;margin-left:6px;}',
            '#' + NS + '-dot{position:fixed;z-index:2147483644;width:44px;height:44px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:22px;cursor:pointer;background:rgba(36,44,84,.88);border:1px solid rgba(122,140,255,.55);box-shadow:0 4px 14px rgba(0,0,0,.35);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);}',
      '#' + NS + '-dot:hover{background:rgba(52,64,110,.95);}',
      '#' + NS + '-expand{display:none;flex:none;border:none;background:rgba(122,140,255,.16);color:#dbe4ff;border-radius:7px;padding:1px 8px;font-size:12px;cursor:pointer;margin-left:auto;}',
      '#' + NS + '-root.wf-minimal #' + NS + '-expand{display:inline-block;}',
      '#' + NS + '-root.wf-minimal #' + NS + '-tip{display:none;}',
      '#' + NS + '-root.wf-minimal #' + NS + '-actions{display:none;}',
      '#' + NS + '-root.wf-minimal #' + NS + '-panel{display:none;}',
      '#' + NS + '-root.wf-minimal #' + NS + '-drag-hint{display:none;}',
      '#' + NS + '-root.wf-minimal{width:auto;min-width:150px;padding:8px 12px;}',
      '#' + NS + '-opacity{accent-color:#8ea4ff;width:70px;height:18px;cursor:pointer;}',
      '#' + NS + '-opacity-val{min-width:38px;text-align:right;color:#c7d2ff;font-size:11px;}',
      '/* ===== UI 微调（原平衡插件内注入内容，现已并入本插件）===== */',
      '.dshMarketLauncher { display: none !important; }',
      '[class$="_footerActions"] { flex-wrap: wrap !important; }',
      '[class$="_footerActions"] > * { flex-basis: 100% !important; max-width: 100% !important; }',
      '[class$="_collapsed"] [class$="_footerActions"] > * { flex-basis: auto !important; max-width: none !important; }'
          ].join(String.fromCharCode(10));
          if (document.head) document.head.appendChild(css);
          else document.documentElement.appendChild(css);
        }
      
        /** 始终写入显式 left/top：即使数据异常也绝不落到文档流末尾。 */
        function applyPosition() {
          var cfg = loadCfg();
          var pos = sanitizePos(cfg.pos);
          var w = root.offsetWidth || 240;
          var h = root.offsetHeight || 180;
          var x, y;
          if (pos) {
            x = pos.x;
            y = pos.y;
          } else if (cfg.position === 'right') {
            x = Math.max(0, (window.innerWidth || 800) - w - 14);
            y = Math.max(0, (window.innerHeight || 600) - h - 18);
          } else {
            x = 14;
            y = Math.max(0, (window.innerHeight || 600) - h - 104);
          }
          root.style.left = x + 'px';
          root.style.top = y + 'px';
          root.style.right = 'auto';
          root.style.bottom = 'auto';
          root.classList.remove('wf-left', 'wf-right');
        }
      
        function positionDot() {
          try {
            var dotEl = document.getElementById(NS + '-dot');
            if (!dotEl) return;
            var cfg = loadCfg();
            var pos = sanitizePos(cfg.pos);
            var x, y;
            if (pos) { x = pos.x; y = pos.y; }
            else if (cfg.position === 'right') { x = Math.max(0, (window.innerWidth || 800) - 44 - 14); y = Math.max(0, (window.innerHeight || 600) - 44 - 18); }
            else { x = 14; y = Math.max(0, (window.innerHeight || 600) - 44 - 104); }
            dotEl.style.left = x + 'px';
            dotEl.style.top = y + 'px';
          } catch (e) { /* ignore */ }
        }
      
        function render() {
          try {
            var cfg = loadCfg();
            var now = new Date();
            var min = Math.floor((bjWallMs(now) % DAY_MS) / MIN_MS);
            var phase = phaseOf(min);
            var tr = nextTransition(now);
            var clock = wallClock(now);
      
            if (!root || !document.body.contains(root)) return;
            if (!drag) applyPosition();
            root.style.opacity = String(cfg.opacity);
            var dotEl = document.getElementById(NS + '-dot');
            if (cfg.visible) {
              root.style.display = '';
              if (dotEl) dotEl.style.display = 'none';
            } else {
              root.style.display = 'none';
              if (dotEl) { dotEl.style.display = 'flex'; positionDot(); }
            }
            root.classList.toggle('wf-minimal', !!cfg.minimal);
            root.querySelector('#' + NS + '-phase').textContent = phase;
            root.querySelector('#' + NS + '-badge').textContent = isPeakAt(min) ? '⛰️ 高峰贵' : '🌙 谷时便宜';
            root.querySelector('#' + NS + '-clock').textContent = '北京时间 ' + clock + ' · ' + tr.minutesLeft + ' 分钟后切【' + tr.toName + '】';
            root.querySelector('#' + NS + '-tip').textContent = cfg.tips
              ? TIPS[Math.floor(Math.random() * TIPS.length)]
              : '（小贴士已关闭，可在设置里打开）';
            var lead = root.querySelector('#' + NS + '-lead');
            if (document.activeElement !== lead) lead.value = cfg.leadMinutes;
            root.querySelector('#' + NS + '-enabled').checked = cfg.enabled;
            root.querySelector('#' + NS + '-position').value = cfg.pos ? 'custom' : cfg.position;
            root.querySelector('#' + NS + '-toast').checked = cfg.toast;
            root.querySelector('#' + NS + '-tips').checked = cfg.tips;
            var opEl = root.querySelector('#' + NS + '-opacity');
            if (opEl) opEl.value = String(cfg.opacity);
            var opvEl = root.querySelector('#' + NS + '-opacity-val');
            if (opvEl) opvEl.textContent = Math.round(cfg.opacity * 100) + '%';
            var visEl = root.querySelector('#' + NS + '-visible');
            if (visEl) visEl.checked = cfg.visible;
            var minEl = root.querySelector('#' + NS + '-minimal');
            if (minEl) minEl.checked = cfg.minimal;
            // 透明度由 cfg.opacity 控制
          } catch (e) {
            if (window.console && console.error) console.error(NS + ': render error', e);
          }
        }
      
        function checkReminder() {
          try {
            var cfg = loadCfg();
            if (!cfg.enabled) return;
            var tr = nextTransition(new Date());
            if (tr.minutesLeft <= 0 || tr.minutesLeft > cfg.leadMinutes) return;
            var dayKey = Math.floor(tr.atWallMs / DAY_MS);
            var key = dayKey + '-' + tr.toName;
            var done = {};
            try { done = JSON.parse(cfg.lastNotified || '{}'); } catch (e) { done = {}; }
            if (done[key]) return;
            done[key] = true;
            cfg.lastNotified = JSON.stringify(done);
            saveCfg(cfg);
            toast((tr.toName === '梁文峰' ? COPY.toPeak : COPY.toValley).replace('{n}', String(tr.minutesLeft)));
          } catch (e) {
            if (window.console && console.error) console.error(NS + ': reminder error', e);
          }
        }
      
        function build() {
          ensureStyle();
          if (document.getElementById(NS + '-root')) {
            root = document.getElementById(NS + '-root');
            if (document.body.contains(root)) return;
            root.remove();
            root = null;
          }
          root = document.createElement('div');
          root.id = NS + '-root';
          root.innerHTML =
            '<div id="' + NS + '-head" title="按住拖动换位置">' +
            '  <span id="' + NS + '-avatar">🐳</span>' +
            '  <button id="' + NS + '-expand" type="button" data-act="expand" title="退出极简模式">⤢</button>' +
            '  <div><div id="' + NS + '-title">蓝色大肥鱼<span id="' + NS + '-badge"></span></div>' +
            '  <div style="font-size:11px;color:#8fa0d8;">DeepSeek 峰谷提醒 v' + VERSION + '</div></div>' +
            '</div>' +
            '<div id="' + NS + '-phase">梁文峰</div>' +
            '<div id="' + NS + '-clock" class="' + NS + '-sub">北京时间 --:--:--</div>' +
            '<div id="' + NS + '-tip"></div>' +
            '<div id="' + NS + '-actions">' +
            '  <button type="button" data-act="toggle-panel">⚙️ 设置</button>' +
            '  <button type="button" data-act="announce">📢 播报</button>' +
            '  <button type="button" data-act="test">🧪 测试</button>' +
            '</div>' +
            '<div id="' + NS + '-panel">' +
            '  <label>启用提醒 <input type="checkbox" id="' + NS + '-enabled"></label>' +
            '  <label>提前提醒（分钟） <input type="number" id="' + NS + '-lead" min="1" max="120" step="1"></label>' +
            '  <label>位置 <select id="' + NS + '-position"><option value="left">左下</option><option value="right">右下</option><option value="custom">自定义（拖动）</option></select></label>' +
            '  <label>站内 toast <input type="checkbox" id="' + NS + '-toast"></label>' +
            '  <label>透明度 <input type="range" id="' + NS + '-opacity" min="0.2" max="1" step="0.05"><span id="' + NS + '-opacity-val">95%</span></label>' +
            '  <label>显示卡片 <input type="checkbox" id="' + NS + '-visible"></label>' +
            '  <label>极简模式（只显示状态） <input type="checkbox" id="' + NS + '-minimal"></label>' +
            '  <label>小贴士轮播 <input type="checkbox" id="' + NS + '-tips"></label>' +
            '  <label>复位位置 <button type="button" data-act="reset" style="flex:none;padding:2px 10px;border-radius:7px;border:1px solid rgba(122,140,255,.5);background:rgba(122,140,255,.14);color:#dbe4ff;font-size:12px;cursor:pointer;">🔄 回左下角</button></label>' +
            '  <div id="' + NS + '-help">🐳 省 token 手册：' +
            '    <ul><li>按住卡片任意空白处自由拖动，设置里可复位</li>' +
            '    <li>批量小任务合并成一个 run_code，省来回调度</li>' +
            '    <li>长会话开新档，旧上下文按量计费</li>' +
            '    <li>高峰少跑重活，谷时再冲业绩</li>' +
            '    <li>写累了站起来蹬，清醒省 token</li></ul></div>' +
            '</div>' +
            '<div id="' + NS + '-drag-hint">⠿ 按住拖动 · 设置里可复位</div>';
          document.body.appendChild(root);
      
          // ---- 位置钉死（内联样式，不依赖外部 CSS；即使后续渲染出错也不离屏）----
          root.style.position = 'fixed';
          root.style.zIndex = '2147483645';
          applyPosition();
      
          // ---- 隐藏态小鱼圆点 ----
          var oldDot = document.getElementById(NS + '-dot');
          if (oldDot) oldDot.remove();
          var dotEl = document.createElement('div');
          dotEl.id = NS + '-dot';
          dotEl.title = '点我恢复小肥鱼';
          dotEl.textContent = '🐳';
          dotEl.style.display = 'none';
          document.body.appendChild(dotEl);
          dotEl.addEventListener('click', function () {
            var cfgd = loadCfg();
            cfgd.visible = true;
            saveCfg(cfgd);
            render();
          });
          positionDot();
      
          // ---- 自由拖动 ----
          root.addEventListener('pointerdown', function (e) {
            var t = e.target;
            if (t && t.closest && t.closest('button, input, select, a, [data-act]')) return;
            var r = root.getBoundingClientRect();
            drag = {
              startX: e.clientX,
              startY: e.clientY,
              origX: r.left,
              origY: r.top,
              moved: false,
              pointerId: e.pointerId
            };
            root.classList.add('wf-dragging');
            try { root.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
            e.preventDefault();
          });
          root.addEventListener('pointermove', function (e) {
            if (!drag) return;
            var w = root.offsetWidth || 240;
            var h = root.offsetHeight || 180;
            var nx = drag.origX + (e.clientX - drag.startX);
            var ny = drag.origY + (e.clientY - drag.startY);
            nx = Math.min(Math.max(0, Math.round(nx)), Math.max(0, (window.innerWidth || 800) - w));
            ny = Math.min(Math.max(0, Math.round(ny)), Math.max(0, (window.innerHeight || 600) - h));
            root.style.left = nx + 'px';
            root.style.top = ny + 'px';
            root.style.right = 'auto';
            root.style.bottom = 'auto';
            drag.moved = true;
          });
          function endDrag() {
            if (!drag) return;
            if (drag.moved) {
              var nx = parseFloat(root.style.left);
              var ny = parseFloat(root.style.top);
              if (isFinite(nx) && isFinite(ny)) {
                var cfg = loadCfg();
                cfg.pos = sanitizePos({ x: nx, y: ny });
                cfg.position = 'custom';
                saveCfg(cfg);
              }
            }
            drag = null;
            root.classList.remove('wf-dragging');
            render();
          }
          root.addEventListener('pointerup', endDrag);
          root.addEventListener('pointercancel', endDrag);
      
      
      
          // 窗口缩放 → 钳回可视区
          window.addEventListener('resize', function () {
            try {
              var cfg = loadCfg();
              if (!cfg.pos) return;
              cfg.pos = sanitizePos(cfg.pos);
              cfg.position = 'custom';
              saveCfg(cfg);
              applyPosition();
            } catch (e) { /* ignore */ }
          });
      
          root.addEventListener('click', function (e) {
            var t = e.target;
            var act = t && t.getAttribute ? t.getAttribute('data-act') : null;
            if (act === 'toggle-panel') {
              root.classList.toggle('wf-open');
            } else if (act === 'announce') {
              var min = Math.floor((bjWallMs(new Date()) % DAY_MS) / MIN_MS);
              toast(COPY[isPeakAt(min) ? 'peak' : 'valley']);
            } else if (act === 'test') {
              var tr = nextTransition(new Date());
              toast(COPY.test.replace('{phase}', tr.toName));
            } else if (act === 'expand') {
              var cfgx = loadCfg();
              cfgx.minimal = false;
              saveCfg(cfgx);
              render();
            } else if (act === 'reset') {
              var cfg2 = loadCfg();
              cfg2.pos = null;
              cfg2.position = 'left';
              saveCfg(cfg2);
              applyPosition();
              toast(COPY.reset);
            }
          });
      
          root.addEventListener('change', function (e) {
            try {
              var cfg = loadCfg();
              var id = e.target && e.target.id ? e.target.id : '';
              if (id === NS + '-enabled') cfg.enabled = e.target.checked;
              else if (id === NS + '-lead') {
                var v = parseInt(e.target.value, 10);
                if (isNaN(v) || v < 1 || v > 120) v = 10;
                cfg.leadMinutes = v;
                e.target.value = v;
              } else if (id === NS + '-position') {
                var val = e.target.value;
                if (val === 'custom') {
                  if (!cfg.pos) cfg.pos = sanitizePos({ x: parseFloat(root.style.left) || 14, y: parseFloat(root.style.top) || 120 });
                  cfg.position = 'custom';
                } else {
                  cfg.position = val;
                  cfg.pos = null;
                }
              } else if (id === NS + '-toast') cfg.toast = e.target.checked;
              else if (id === NS + '-tips') cfg.tips = e.target.checked;
              else if (id === NS + '-opacity') {
                var ov = parseFloat(e.target.value);
                if (isFinite(ov)) cfg.opacity = Math.min(1, Math.max(0.2, ov));
              } else if (id === NS + '-visible') cfg.visible = e.target.checked;
              else if (id === NS + '-minimal') cfg.minimal = e.target.checked;
              saveCfg(cfg);
              render();
              var tr = nextTransition(new Date());
              toast(COPY.armed.replace('{n}', String(cfg.leadMinutes)).replace('{phase}', tr.toName));
            } catch (e2) { /* ignore */ }
          });
        }
      
        function tick() {
          try {
            // 自愈：组件被外部移除则重建
            if (!root || !document.body || !document.body.contains(root)) {
              build();
            }
            render();
            checkReminder();
          } catch (e) {
            if (window.console && console.error) console.error(NS + ': tick error', e);
          }
        }
      
        function init() {
          try {
            build();
            render();
            checkReminder();
            if (window.__WHALE_FENGGU_TIMER__) clearInterval(window.__WHALE_FENGGU_TIMER__);
            window.__WHALE_FENGGU_TIMER__ = setInterval(tick, 20 * 1000);
            document.addEventListener('visibilitychange', function () {
              if (document.visibilityState === 'visible') tick();
            });
          } catch (e) {
            if (window.console && console.error) console.error(NS + ': init error', e);
          }
        }
      
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', init);
        } else {
          init();
        }
      })();
    }

    module.exports = { inject, apply };
    return module.exports;
  }
});
