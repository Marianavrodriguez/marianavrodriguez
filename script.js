/* ============================================================
   MARIANA V. RODRIGUEZ — script.js
   ============================================================ */

/* ─── TYPEWRITER ─────────────────────────────────────────── */
/* Loops the full reveal every 60s, and unfolds "mv_" into the
   full name on hover. runId cancels whichever sequence is
   mid-flight so hover and the auto-loop can never garble each
   other's typing. */
(function () {
  const el      = document.getElementById('nav-text');
  const cur     = document.getElementById('nav-cursor');
  const navName = document.querySelector('.nav-name');
  if (!el || !cur) return;

  const full  = 'Mariana Victoria';
  const short = 'mv';
  let runId = 0;
  let isHovering = false;

  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

  // Types/deletes are cancellable: if a newer sequence has started
  // (runId moved on), the older one just stops where it is.
  async function typeTo(str, mine) {
    for (let i = 0; i <= str.length; i++) {
      if (mine !== runId) return false;
      el.textContent = str.slice(0, i);
      await sleep(70 + Math.random() * 45);
    }
    return mine === runId;
  }
  async function deleteAll(mine) {
    let txt = el.textContent;
    while (txt.length > 0) {
      if (mine !== runId) return false;
      txt = txt.slice(0, -1);
      el.textContent = txt;
      await sleep(40 + Math.random() * 25);
    }
    return mine === runId;
  }

  // Initial page-load reveal: mv_ -> types full name -> holds -> back to mv_
  async function introSequence() {
    const mine = ++runId;
    await sleep(500);
    if (mine !== runId) return;
    if (!(await typeTo(full, mine))) return;
    cur.classList.add('blink');
    await sleep(1200);
    if (mine !== runId) return;
    cur.classList.remove('blink');
    cur.style.opacity = '1';
    if (!(await deleteAll(mine))) return;
    await sleep(200);
    if (mine !== runId) return;
    if (!(await typeTo(short, mine))) return;
    cur.classList.add('blink');
  }

  // Ambient replay of the same reveal, run automatically every 60s
  async function autoPeek() {
    if (isHovering) return;
    const mine = ++runId;
    cur.classList.remove('blink');
    cur.style.opacity = '1';
    if (!(await deleteAll(mine))) return;
    if (!(await typeTo(full, mine))) return;
    cur.classList.add('blink');
    await sleep(1200);
    if (mine !== runId) return;
    cur.classList.remove('blink');
    cur.style.opacity = '1';
    if (!(await deleteAll(mine))) return;
    await sleep(150);
    if (mine !== runId) return;
    if (!(await typeTo(short, mine))) return;
    cur.classList.add('blink');
  }

  // Hover: unfold to the full name and hold it there
  async function expandOnHover(mine) {
    cur.classList.remove('blink');
    cur.style.opacity = '1';
    if (!(await deleteAll(mine))) return;
    if (!(await typeTo(full, mine))) return;
    cur.classList.add('blink');
  }
  // Hover out: fold back to mv_
  async function collapseOnLeave(mine) {
    cur.classList.remove('blink');
    cur.style.opacity = '1';
    if (!(await deleteAll(mine))) return;
    if (!(await typeTo(short, mine))) return;
    cur.classList.add('blink');
  }

  introSequence().then(() => {
    setInterval(autoPeek, 60000);
  });

  if (navName) {
    navName.addEventListener('mouseenter', () => {
      isHovering = true;
      expandOnHover(++runId);
    });
    navName.addEventListener('mouseleave', () => {
      isHovering = false;
      collapseOnLeave(++runId);
    });
  }
})();


/* ─── CUSTOM CURSOR ──────────────────────────────────────── */
(function () {
  const cursor = document.getElementById('cursor');
  if (!cursor) return;

  let mx = 0, my = 0, rx = 0, ry = 0;

  document.addEventListener('mousemove', (e) => { mx = e.clientX; my = e.clientY; });
  document.addEventListener('mouseenter', () => cursor.classList.add('visible'));
  document.addEventListener('mouseleave', () => cursor.classList.remove('visible'));

  document.querySelectorAll('a, .cat-item, .btn-primary, .btn-ghost').forEach((el) => {
    el.addEventListener('mouseenter', () => cursor.classList.add('hovered'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('hovered'));
  });

  function loop() {
    rx += (mx - rx) * 0.2;
    ry += (my - ry) * 0.2;
    cursor.style.left = rx + 'px'; cursor.style.top = ry + 'px';
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();


/* ─── CURSOR TRAIL ────────────────────────────────────────── */
/* A single tapering, fading line drawn on canvas each frame from
   recent mouse positions — reads as one comet trail rather than a
   string of discrete sparks. maxAge is how long the tail lags
   behind the live cursor. */
(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!window.matchMedia('(hover: hover)').matches) return;

  const maxAge   = 750; // ms the trail lags behind the cursor
  const maxWidth = 4.5; // px, at the freshest point
  const lilacRGB = '190, 161, 250';

  const canvas = document.createElement('canvas');
  canvas.id = 'trail-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  let dpr = window.devicePixelRatio || 1;
  function resize() {
    dpr = window.devicePixelRatio || 1;
    canvas.width = innerWidth * dpr;
    canvas.height = innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);

  let points = [];
  document.addEventListener('mousemove', (e) => {
    points.push({ x: e.clientX, y: e.clientY, t: performance.now() });
  });

  function loop() {
    const now = performance.now();
    points = points.filter((p) => now - p.t < maxAge);
    ctx.clearRect(0, 0, innerWidth, innerHeight);

    if (points.length > 1) {
      ctx.lineCap = 'round';
      for (let i = 1; i < points.length; i++) {
        const a = points[i - 1], b = points[i];
        const age = 1 - (now - b.t) / maxAge; // 1 = just drawn, 0 = about to expire
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = `rgba(${lilacRGB}, ${(age * 0.8).toFixed(3)})`;
        ctx.lineWidth = Math.max(age * maxWidth, 0.4);
        ctx.stroke();
      }
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();


/* ─── HERO MARQUEE (curved, responsive) ──────────────────────
   Rebuilds the wave path, font-size and text length off the strip's
   actual rendered pixel size (not the SVG's viewBox width), so the
   text stays a legible size on narrow screens instead of shrinking
   with the page. Loops by animating startOffset across one repeat
   of a 3x-tiled path, then resetting — the tile is identical at
   that point, so the reset is invisible. Driven by rAF rather than
   SMIL so the loop timing is explicit and never stalls. */
(function () {
  const svg      = document.querySelector('.marquee-svg');
  const path     = document.getElementById('marquee-path');
  const textPath = document.getElementById('marquee-textpath');
  if (!svg || !path || !textPath) return;

  const PHRASE = 'BRAND STRATEGY  •  VISUAL DESIGN  •  PHOTOGRAPHY  •  CREATIVE DIRECTION  •  GRAPHIC DESIGN  •  CONTENT CREATION  •  ';
  const textEl = textPath.parentElement;

  function layout() {
    const rect = svg.getBoundingClientRect();
    const W = Math.max(rect.width, 1);
    const H = Math.max(rect.height, 1);
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

    // wave period scales with the strip's height, not its width, so
    // the curve keeps the same proportions at any screen size
    const period = H * 6;
    const half   = period / 2;
    const amp    = H * 0.28;
    const mid    = H * 0.55;
    let d = `M ${-period},${mid}`;
    for (let i = 0; i < 3; i++) {
      d += ` c ${half / 2},${-amp} ${half * 1.5},${-amp} ${period},0`;
      d += ` c ${half / 2},${amp} ${half * 1.5},${amp} ${period},0`;
    }
    path.setAttribute('d', d);

    const fontSize = Math.max(H * 0.22, 13);
    textEl.style.fontSize = fontSize + 'px';

    const approxCharWidth = fontSize * 0.62;
    const repeatsNeeded = Math.ceil((period * 3) / (PHRASE.length * approxCharWidth)) + 2;
    textPath.textContent = PHRASE.repeat(Math.max(repeatsNeeded, 3));
  }

  layout();
  window.addEventListener('resize', layout);

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const DUR = 16000; // ms per loop
  let start = null;
  function tick(ts) {
    if (start === null) start = ts;
    const t = ((ts - start) % DUR) / DUR;
    textPath.setAttribute('startOffset', (t * 33.3333) + '%');
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();


/* ─── SCROLL REVEAL ──────────────────────────────────────── */
(function () {
  const items = document.querySelectorAll('.reveal');
  if (!items.length) return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  items.forEach((el) => observer.observe(el));
})();


/* ─── FROSTED NAV ────────────────────────────────────────── */
(function () {
  const nav = document.getElementById('nav');
  if (!nav) return;
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 60);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();


/* ─── MOBILE NAV (hamburger) ─────────────────────────────── */
(function () {
  const burger = document.getElementById('nav-burger');
  const menu   = document.getElementById('nav-mobile');
  if (!burger || !menu) return;

  function close() {
    burger.setAttribute('aria-expanded', 'false');
    menu.classList.remove('open');
  }
  burger.addEventListener('click', () => {
    const open = burger.getAttribute('aria-expanded') === 'true';
    burger.setAttribute('aria-expanded', String(!open));
    menu.classList.toggle('open', !open);
  });
  menu.querySelectorAll('a').forEach((a) => a.addEventListener('click', close));
  window.addEventListener('resize', () => { if (window.innerWidth > 640) close(); });
})();


/* ─── CATEGORY SHOWCASE ──────────────────────────────────── */
(function () {
  const items  = document.querySelectorAll('.cat-item');
  const catImg = document.getElementById('cat-img');
  if (!items.length) return;

  let current = 0;
  let paused  = false;

  function activate(index) {
    items.forEach((el, i) => el.classList.toggle('active', i === index));

    if (catImg) {
      const src = items[index].dataset.img;
      if (src && catImg.src !== src) {
        catImg.style.opacity = '0';
        setTimeout(() => { catImg.src = src; catImg.style.opacity = '1'; }, 300);
      }
    }
    current = index;
  }

  items.forEach((item, i) => {
    item.addEventListener('mouseenter', () => { paused = true;  activate(i); });
    item.addEventListener('mouseleave', () => { paused = false; });
    item.addEventListener('click',      () => activate(i));
  });

  setInterval(() => {
    if (!paused) activate((current + 1) % items.length);
  }, 3000);
})();


/* ─── SMOOTH ANCHOR SCROLL ───────────────────────────────── */
(function () {
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href').slice(1);
      const target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth' });
    });
  });
})();
