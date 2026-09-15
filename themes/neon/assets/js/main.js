/* ==========================================================================
   Neon Theme · 交互脚本
   1) 主题切换（深/浅，记忆到 localStorage）
   2) 移动端菜单开合
   3) 目录滚动高亮（IntersectionObserver）
   4) 代码块一键复制
   5) 复制本文链接 / 分享（手机走系统分享，桌面弹自定义菜单；浮层定位由 placePop 夹在视口内；
      菜单项的点击另有「按坐标判定」的兜底，见下方 shareCopy 附近注释）
   6) 滚动进入动画
   无依赖，压缩后约 3KB。
   ========================================================================== */
(function () {
  'use strict';

  var doc = document;
  var root = doc.documentElement;
  var STORE_KEY = 'neon-theme';

  /* ---------------------------------------------------------------- 主题 */
  function currentTheme() {
    return root.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
  }

  function setTheme(theme) {
    root.setAttribute('data-theme', theme);
    root.style.colorScheme = theme;
    try { localStorage.setItem(STORE_KEY, theme); } catch (e) { /* 隐私模式忽略 */ }
    doc.querySelectorAll('[data-theme-toggle]').forEach(function (btn) {
      btn.setAttribute('aria-label', theme === 'light' ? '切换到深色模式' : '切换到浅色模式');
      var sun = btn.querySelector('[data-icon="sun"]');
      var moon = btn.querySelector('[data-icon="moon"]');
      if (sun && moon) {
        sun.hidden = theme !== 'light';
        moon.hidden = theme === 'light';
      }
    });
    giscusTheme();   // 评论区跟着换肤（没装 giscus 时是空操作）
  }

  doc.querySelectorAll('[data-theme-toggle]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      setTheme(currentTheme() === 'dark' ? 'light' : 'dark');
    });
  });
  setTheme(currentTheme());

  /* ------------------------------------------------------ 评论区主题跟随 */
  /* giscus 的评论区是跨域 iframe，自带一套皮肤，光改本站 CSS 动不了它，
     只能在切换时用 postMessage 通知里面的应用换主题。

     首次加载不需要在这里管：模板 partials/comments.html 是读着
     <html data-theme> 现造 <script> 标签的，一开始就是对的颜色。
     这里只负责两件事：
       1) 用户点右上角按钮 → 上面的 setTheme() 会调 giscusTheme()
       2) iframe 出现得比切换晚（giscus 是懒加载，要滚到评论区才建 iframe）
          → 盯住容器，等 iframe 建好、加载完了再补一次

     主题名从容器上的 data-theme-dark / data-theme-light 读，由模板渲染，
     改配色不用动这个文件。 */
  function giscusTheme() {
    var box = doc.querySelector('.giscus[data-theme-dark]');
    var frame = doc.querySelector('iframe.giscus-frame');
    if (!box || !frame || !frame.contentWindow) return;
    frame.contentWindow.postMessage({
      giscus: {
        setConfig: {
          theme: currentTheme() === 'light'
            ? box.getAttribute('data-theme-light')
            : box.getAttribute('data-theme-dark')
        }
      }
    }, 'https://giscus.app');
  }

  var giscusBox = doc.querySelector('.giscus[data-theme-dark]');
  if (giscusBox && 'MutationObserver' in window) {
    var giscusBound = null;
    /* 刻意不在监听到 iframe 的那一刻就 postMessage：那时里面还没初始化完，
       消息会被丢掉。只挂 load，等它真的加载完再校一次。 */
    new MutationObserver(function () {
      var frame = giscusBox.querySelector('iframe.giscus-frame');
      if (!frame || frame === giscusBound) return;
      giscusBound = frame;
      frame.addEventListener('load', giscusTheme);
    }).observe(giscusBox, { childList: true });
  }

  /* ------------------------------------------------------------ 移动菜单 */
  var burger = doc.querySelector('[data-menu-toggle]');
  var mobileNav = doc.querySelector('[data-mobile-nav]');
  if (burger && mobileNav) {
    burger.addEventListener('click', function () {
      var open = mobileNav.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    // 点到菜单里的链接就收起
    mobileNav.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        mobileNav.classList.remove('is-open');
        burger.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* -------------------------------------------------------- 目录滚动高亮 */
  var tocLinks = doc.querySelectorAll('.toc__list a[href^="#"]');
  if (tocLinks.length && 'IntersectionObserver' in window) {
    var linkMap = {};
    var targets = [];
    tocLinks.forEach(function (a) {
      var id = decodeURIComponent(a.getAttribute('href').slice(1));
      var el = doc.getElementById(id);
      if (el) { linkMap[id] = a; targets.push(el); }
    });

    if (targets.length) {
      var visible = {};
      var spy = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { visible[en.target.id] = en.isIntersecting; });
        var firstId = null;
        for (var i = 0; i < targets.length; i++) {
          if (visible[targets[i].id]) { firstId = targets[i].id; break; }
        }
        if (!firstId) return;
        tocLinks.forEach(function (a) { a.classList.remove('is-active'); });
        if (linkMap[firstId]) linkMap[firstId].classList.add('is-active');
      }, { rootMargin: '-96px 0px -70% 0px', threshold: 0 });
      targets.forEach(function (t) { spy.observe(t); });
    }
  }

  /* ------------------------------------------------------------ 代码复制 */
  /* 注意：这里用的是下面「复制链接」那节里的 copyText()（函数声明会提升，
     所以先写在这也没关系）。它内部已经把 navigator.clipboard.writeText 可能
     同步抛异常的情况兜住了 —— 原来这里直接调 writeText，同样的坑，
     在部分安卓 WebView 上点了没反应。 */
  doc.querySelectorAll('.prose pre').forEach(function (pre) {
    if (pre.querySelector('.copy-btn')) return;
    var btn = doc.createElement('button');
    btn.type = 'button';
    btn.className = 'copy-btn';
    btn.textContent = 'COPY';
    btn.addEventListener('click', function () {
      var code = pre.querySelector('code');
      copyText(code ? code.innerText : pre.innerText);
      btn.textContent = 'COPIED';
      btn.classList.add('is-done');
      setTimeout(function () {
        btn.textContent = 'COPY';
        btn.classList.remove('is-done');
      }, 1600);
    });
    pre.appendChild(btn);
  });

  /* ---------------------------------------- 复制链接 / 分享 / 下拉浮层 */

  /* 尽力把 text 写进剪贴板。**不返回结果、不接回调** —— 界面反馈由调用方同步触发，
     绝不能依赖这里的异步结果。这么设计是因为踩过一个只有真机才复现的坑：

       某些安卓 WebView 里 navigator.clipboard 存在，但 writeText 是 undefined。
       原来写成 navigator.clipboard.writeText(text).then(onDone, fallback)，
       这一行会**同步抛 TypeError**，异常冒泡出 copyText、再冒泡出点击处理函数，
       后面的 flashDone() 根本没执行 —— 现象就是「菜单关了，气泡不出现」，
       而且控制台之外看不出任何异常。桌面 Chrome 有 writeText，所以只有手机中招。

     同类失败模式还有两种，都靠下面的结构兜住：
       · writeText() 返回的 promise 永不 settle → 没人等它，无所谓
       · writeText() reject → 走 legacy()；legacy 里 execCommand 再抛也不影响反馈 */
  function copyText(text) {
    var legacy = function () {
      try {
        var ta = doc.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');   // 免得手机上弹出软键盘
        ta.style.position = 'fixed';
        ta.style.top = '0';                // 固定在视口顶部，select() 不会把页面滚跑
        ta.style.left = '0';
        ta.style.opacity = '0';
        doc.body.appendChild(ta);
        ta.select();
        ta.setSelectionRange(0, text.length);
        doc.execCommand('copy');
        doc.body.removeChild(ta);
      } catch (e) { /* 复制失败就算了，界面反馈不能受它影响 */ }
    };

    try {
      // 三个条件都要查：clipboard 存在、writeText 真的是函数、且在安全上下文里
      if (navigator.clipboard &&
          typeof navigator.clipboard.writeText === 'function' &&
          window.isSecureContext) {
        navigator.clipboard.writeText(text).then(null, legacy);
        return;
      }
    } catch (e) { /* 走到下面的老办法 */ }
    legacy();
  }

  /* 手机还是桌面？
     不能拿「有没有 navigator.share」当判据 —— Windows 版 Chrome 也实现了它，
     但调起来是 Windows 那套系统共享面板，经常直接弹「无法显示所有共享方法」。
     所以按 UA 判：手机走系统分享，桌面一律用自己弹的菜单。 */
  function isMobile() {
    var ua = navigator.userAgent || '';
    if (/Android|iPhone|iPod|Windows Phone|HarmonyOS|Mobile/i.test(ua)) return true;
    // iPadOS 13+ 的 UA 伪装成 Macintosh，只能靠触摸点数区分
    return /Macintosh/.test(ua) && navigator.maxTouchPoints > 1;
  }

  /* 把浮层夹在视口内，并算出小尖角该放哪。
     浮层默认「正对按钮居中」，但窄屏时 .post-head__meta 会换行，三个按钮整组可能
     贴到屏幕左边或右边（复制是最左那个、分享是中间那个），居中就会顶出去。

     这里刻意用 offsetWidth（布局宽度，不受 transform 影响）+ 按钮矩形来推算，
     而不是量浮层自己的 getBoundingClientRect()：后者在「刚加上 .is-show、
     过渡还没跑完」的那一刻会返回动画起始值（scale .94 那一帧），
     量出来偏小几像素，尖角就对不准按钮中心了。 */
  function placePop(el, btn) {
    var PAD = 12;    // 浮层离视口边缘至少留这么多
    var EDGE = 14;   // 尖角离浮层两端至少留这么多

    var w = el.offsetWidth;
    var b = btn.getBoundingClientRect();
    var bc = b.left + b.width / 2;   // 按钮中心
    var left = bc - w / 2;           // 居中时浮层的左边缘

    var shift = 0;
    if (left < PAD) shift = PAD - left;
    else if (left + w > window.innerWidth - PAD) shift = (window.innerWidth - PAD) - (left + w);

    el.style.setProperty('--pop-shift', shift.toFixed(1) + 'px');

    var cx = bc - (left + shift);
    cx = Math.max(EDGE, Math.min(w - EDGE, cx));
    el.style.setProperty('--pop-arrow', cx.toFixed(1) + 'px');
  }

  /* 统一的成功反馈：按钮切绿 + 正下方浮出绿色气泡，HOLD 毫秒后自动收起。
     气泡是 .copywrap 里的 .copytip（模板 single.html 里写死的），
     这里只管加/去 .is-show；连点会重置计时，不会闪。 */
  function flashDone(btn, baseLabel) {
    var HOLD = 1800;
    var wrap = btn.parentElement;
    var tip = wrap ? wrap.querySelector('.copytip') : null;

    btn.setAttribute('aria-label', '已复制链接');
    btn.classList.add('is-done');

    if (tip) {
      tip.classList.add('is-show');
      placePop(tip, btn);
      clearTimeout(btn._tipTimer);
      btn._tipTimer = setTimeout(function () { tip.classList.remove('is-show'); }, HOLD);
    }
    clearTimeout(btn._doneTimer);
    btn._doneTimer = setTimeout(function () {
      btn.setAttribute('aria-label', baseLabel);
      btn.classList.remove('is-done');
    }, HOLD);
  }

  doc.querySelectorAll('[data-copy-link]').forEach(function (btn) {
    var baseLabel = btn.getAttribute('aria-label') || '复制本文链接';
    btn.addEventListener('click', function () {
      copyText(location.href);
      flashDone(btn, baseLabel);   // 反馈同步出现，不等复制结果
    });
  });

  doc.querySelectorAll('[data-share]').forEach(function (btn) {
    var baseLabel = btn.getAttribute('aria-label') || '分享本文';
    var wrap = btn.parentElement;
    var menu = wrap ? wrap.querySelector('.sharemenu') : null;

    /* instant = true 时不做淡出，立刻消失。
       点「复制链接分享」必须用 instant：那张菜单卡片是不透明的，正好压在
       即将出现的绿色气泡上面，淡出要 0.28s —— 不立刻收掉的话，
       视觉上就是「菜单关了，但什么反馈都没有」。 */
    function closeMenu(instant) {
      if (!menu) return;
      if (instant) menu.classList.add('is-instant');
      menu.classList.remove('is-open');
      btn.setAttribute('aria-expanded', 'false');
    }

    btn.addEventListener('click', function (e) {
      e.stopPropagation();   // 别让下面「点别处收起」那个监听当场把它关掉

      // 手机：系统分享面板（微信 / QQ / Telegram / 复制链接都在里面），
      // 面板本身就是反馈，不再弹气泡；用户取消会 reject，忽略即可。
      if (isMobile() && navigator.share) {
        navigator.share({ title: doc.title, url: location.href }).catch(function () {});
        return;
      }

      // 桌面（Windows / Mac）：自己弹一个小菜单。
      // 桌面刻意不调 navigator.share —— Windows 那套共享面板基本是坏的。
      if (!menu) {
        copyText(location.href);
        flashDone(btn, baseLabel);
        return;
      }
      var willOpen = !menu.classList.contains('is-open');
      closeMenu();
      if (willOpen) {
        menu.classList.remove('is-instant');   // 恢复正常过渡，这次要淡入
        menu.classList.add('is-open');
        btn.setAttribute('aria-expanded', 'true');
        placePop(menu, btn);
      }
    });

    if (!menu) return;

    // 菜单里的「复制链接分享」：收菜单 + 弹气泡，两者都要有
    var item = menu.querySelector('[data-share-copy]');

    function shareCopy() {
      closeMenu(true);
      copyText(location.href);
      flashDone(btn, baseLabel);   // 和复制按钮一样，反馈同步出现
    }

    if (item) {
      item.addEventListener('click', function (e) {
        e.stopPropagation();
        shareCopy();
      });
    }

    /* 坐标兜底：部分安卓 WebView（已确认 Via）的命中测试不认这个浮层 ——
       菜单被正常画出来（有尺寸、visibility:visible、rect 也对），但
       elementFromPoint 在菜单正中心返回的却是页面容器 <div class="layout">，
       于是手指落在菜单项上时事件目标根本不是它，菜单项自己的监听收不到。

       所以这里再按「手指坐标是否落在菜单项矩形内」判一次。
       两条路互斥：菜单项能正常收到点击时会 stopPropagation，兜底不会触发。 */
    if (item) {
      doc.addEventListener('click', function (e) {
        if (!menu.classList.contains('is-open')) return;
        var r = item.getBoundingClientRect();
        if (!r.width || !r.height) return;
        if (e.clientX < r.left || e.clientX > r.right) return;
        if (e.clientY < r.top || e.clientY > r.bottom) return;
        shareCopy();
      });
    }

    // 点别处 / 按 Esc 收起（必须排在坐标兜底之后注册，否则会抢先收起菜单）
    doc.addEventListener('click', closeMenu);
    doc.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' || e.keyCode === 27) closeMenu();
    });
  });

  /* -------------------------------------------------------- 滚动进入动画 */
  var reveals = doc.querySelectorAll('.reveal');
  if (reveals.length) {
    if (!('IntersectionObserver' in window)) {
      reveals.forEach(function (el) { el.classList.add('is-visible'); });
    } else {
      var io = new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            en.target.classList.add('is-visible');
            obs.unobserve(en.target);
          }
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: .05 });
      reveals.forEach(function (el, i) {
        el.style.transitionDelay = Math.min(i, 6) * 60 + 'ms';
        io.observe(el);
      });
    }
  }
})();
