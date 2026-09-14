/* ==========================================================================
   Neon Theme · 交互脚本
   1) 主题切换（深/浅，记忆到 localStorage）
   2) 移动端菜单开合
   3) 目录滚动高亮（IntersectionObserver）
   4) 代码块一键复制
   5) 滚动进入动画
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
  }

  doc.querySelectorAll('[data-theme-toggle]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      setTheme(currentTheme() === 'dark' ? 'light' : 'dark');
    });
  });
  setTheme(currentTheme());

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
  doc.querySelectorAll('.prose pre').forEach(function (pre) {
    if (pre.querySelector('.copy-btn')) return;
    var btn = doc.createElement('button');
    btn.type = 'button';
    btn.className = 'copy-btn';
    btn.textContent = 'COPY';
    btn.addEventListener('click', function () {
      var code = pre.querySelector('code');
      var text = code ? code.innerText : pre.innerText;
      var done = function () {
        btn.textContent = 'COPIED';
        btn.classList.add('is-done');
        setTimeout(function () {
          btn.textContent = 'COPY';
          btn.classList.remove('is-done');
        }, 1600);
      };
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(done, function () { /* 忽略 */ });
      } else {
        var ta = doc.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        doc.body.appendChild(ta);
        ta.select();
        try { doc.execCommand('copy'); done(); } catch (e) { /* 忽略 */ }
        doc.body.removeChild(ta);
      }
    });
    pre.appendChild(btn);
  });

  /* -------------------------------------------------------- 复制本文链接 */
  /* 说明：原先还有一段 [data-share]「分享」逻辑，随文章头部分享按钮一起删除（2026-09-14）。
     copyText() 保留 —— [data-copy-link] 仍在使用。 */
  function copyText(text, onDone) {
    var fallback = function () {
      var ta = doc.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      doc.body.appendChild(ta);
      ta.select();
      try { doc.execCommand('copy'); onDone(); } catch (e) {}
      doc.body.removeChild(ta);
    };
    if (navigator.clipboard && window.isSecureContext) {
      // 新版接口被拒（权限 / 非 HTTPS 等）时退回老办法，别让提示不出现
      navigator.clipboard.writeText(text).then(onDone, fallback);
      return;
    }
    fallback();
  }

  doc.querySelectorAll('[data-copy-link]').forEach(function (btn) {
    var tip = btn.parentElement && btn.parentElement.querySelector('.copytip');
    var timer = null;
    var HOLD = 1800;
    btn.addEventListener('click', function () {
      copyText(location.href, function () {
        var old = btn.getAttribute('aria-label');
        btn.setAttribute('aria-label', '已复制链接');
        btn.classList.add('is-done');
        if (tip) {
          tip.classList.add('is-show');
          clearTimeout(timer);
          timer = setTimeout(function () { tip.classList.remove('is-show'); }, HOLD);
        }
        setTimeout(function () {
          btn.setAttribute('aria-label', old || '复制本文链接');
          btn.classList.remove('is-done');
        }, HOLD);
      });
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
