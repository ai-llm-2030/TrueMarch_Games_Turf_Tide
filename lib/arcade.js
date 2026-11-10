/*
 * The few things every game in this folder needs, and nothing else.
 *
 * Deliberately not a framework. Each game owns its own rules and its own
 * drawing; what they genuinely share is the theme, a crisp canvas, a frame loop
 * that behaves when the tab is hidden, a best-score line, and the input
 * plumbing that is fiddly to get right and identical everywhere.
 */
(function () {
  'use strict';

  var params = new URLSearchParams(location.search);
  var theme = params.get('theme') === 'dark' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', theme);

  /** Read a colour from the shared stylesheet, so games never hard-code one. */
  function css(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  /**
   * Size a canvas for the display it is on.
   *
   * The game draws in fixed logical units (w x h) and never thinks about pixel
   * ratio: this sets the backing store to devicePixelRatio and scales the
   * context once, so a 2x screen gets sharp edges from the same code that draws
   * a 1x one. Re-run on resize because the dialog is resizable.
   */
  function fit(canvas, w, h) {
    var ctx = canvas.getContext('2d');
    function apply() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      // The DISPLAY size is left to CSS (see _arcade.css) so the playfield can
      // grow into the dialog; only the proportions are asserted here, from the
      // logical size the game draws in.
      canvas.style.aspectRatio = w + ' / ' + h;
      // The ratio as a number too, for the phone-portrait rule in
      // _arcade.css that sizes the canvas against BOTH sides of the field.
      canvas.style.setProperty('--ar', String(w / h));
      canvas.classList.add('arcade-fit');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = false;
    }
    apply();
    window.addEventListener('resize', apply);
    if (w / h >= 1.4) rotateTip();
    return ctx;
  }

  /**
   * "Turn your phone sideways" — once, for a wide game on an upright phone.
   *
   * A 16:9 playfield on a 356px-wide portrait screen is drawn at about a
   * third of the height it could have. The game still works (sized by the
   * phone rule in _arcade.css), so this is a hint, never a wall: it fades by
   * itself, never blocks a tap, and is not shown again in this tab.
   */
  function rotateTip() {
    var touch = window.matchMedia && matchMedia('(hover: none) and (pointer: coarse)').matches;
    if (!touch || window.innerWidth >= window.innerHeight) return;
    try { if (sessionStorage.getItem('gt.rotateTip')) return; sessionStorage.setItem('gt.rotateTip', '1'); } catch (e) { /* private mode */ }
    function show() {
      var tip = document.createElement('div');
      tip.className = 'rotate-tip';
      tip.setAttribute('role', 'status');
      tip.textContent = 'Turn your phone sideways for a bigger view';
      document.body.appendChild(tip);
      setTimeout(function () { tip.classList.add('gone'); }, 3800);
      setTimeout(function () { tip.remove(); }, 4400);
    }
    if (document.body) show(); else document.addEventListener('DOMContentLoaded', show);
  }

  /**
   * A frame loop that hands out seconds, not frames.
   *
   * `dt` is clamped: coming back to a tab that has been in the background for a
   * minute otherwise delivers one enormous step, and everything moving in the
   * game teleports through the walls it was supposed to collide with.
   */
  function loop(step) {
    var last = 0, raf = 0, running = true;
    function frame(now) {
      raf = requestAnimationFrame(frame);
      if (!last) last = now;
      var dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (running) step(dt);
    }
    raf = requestAnimationFrame(frame);
    document.addEventListener('visibilitychange', function () {
      running = !document.hidden;
      last = 0;
    });
    return {
      stop: function () { cancelAnimationFrame(raf); },
      set running(v) { running = v; last = 0; },
      get running() { return running; },
    };
  }

  /**
   * The best score for a game, kept per game id.
   *
   * `localStorage` rather than the session: a personal best that forgets itself
   * when the tab closes is not a personal best.
   */
  function best(id, value) {
    var key = 'gt.game.' + id;
    try {
      if (value === undefined) return Number(localStorage.getItem(key) || 0);
      if (value > Number(localStorage.getItem(key) || 0)) localStorage.setItem(key, String(value));
      return Number(localStorage.getItem(key) || 0);
    } catch (e) {
      return value || 0;   // private mode; the score just does not persist
    }
  }

  /**
   * Direction input, from the two places it can come from.
   *
   * Arrow keys and WASD together, because half the people who play a game with
   * one hand on the keyboard reach for each. `preventDefault` on the arrows
   * matters even inside an iframe: without it the frame scrolls behind the
   * canvas and the playfield drifts out of view while you play.
   */
  function keys(handler) {
    var MAP = {
      ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
      KeyW: 'up', KeyS: 'down', KeyA: 'left', KeyD: 'right',
      Space: 'action', Enter: 'action', KeyR: 'restart', KeyP: 'pause',
    };
    var down = {};
    window.addEventListener('keydown', function (e) {
      var k = MAP[e.code];
      if (!k) return;
      e.preventDefault();
      var repeat = down[k];
      down[k] = true;
      handler(k, true, repeat);
    });
    window.addEventListener('keyup', function (e) {
      var k = MAP[e.code];
      if (!k) return;
      e.preventDefault();
      down[k] = false;
      handler(k, false, false);
    });
    return down;
  }

  /** Swipes, for the same four directions, on touch screens. */
  function swipe(el, handler) {
    var x0 = 0, y0 = 0, live = false;
    el.addEventListener('touchstart', function (e) {
      var t = e.changedTouches[0];
      // A press on a button (the pad, Play, Undo…) is that button's, never a
      // swipe or a tap on the board: counted twice, a pad ← also rotated the
      // piece in Block Fall.
      if (e.target && e.target.closest && e.target.closest('button')) { live = false; return; }
      x0 = t.clientX; y0 = t.clientY; live = true;
    }, { passive: true });
    el.addEventListener('touchend', function (e) {
      if (!live) return;
      live = false;
      var t = e.changedTouches[0];
      var dx = t.clientX - x0, dy = t.clientY - y0;
      if (Math.abs(dx) < 24 && Math.abs(dy) < 24) { handler('tap'); return; }
      handler(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
    }, { passive: true });
  }

  /** Wire the on-screen arrow pad, where a game shows one. */
  function pad(el, handler) {
    if (!el) return;
    // On pointerDOWN, not click: a click lands when the finger LIFTS, a
    // tap's length late, and quick repeat taps get eaten as a double-tap.
    // `click` is still honoured when it comes from the keyboard (detail 0),
    // so Enter/Space on a focused pad button keeps working.
    el.addEventListener('pointerdown', function (e) {
      var b = e.target.closest('button[data-dir]');
      if (!b) return;
      e.preventDefault();
      handler(b.getAttribute('data-dir'));
    });
    el.addEventListener('click', function (e) {
      if (e.detail !== 0) return;
      var b = e.target.closest('button[data-dir]');
      if (b) handler(b.getAttribute('data-dir'));
    });
  }

  window.Arcade = {
    theme: theme,
    css: css,
    fit: fit,
    loop: loop,
    best: best,
    keys: keys,
    swipe: swipe,
    pad: pad,
    /** Tiny deterministic helpers every one of these games wanted. */
    clamp: function (v, a, b) { return v < a ? a : v > b ? b : v; },
    rand: function (n) { return Math.floor(Math.random() * n); },
  };
})();
