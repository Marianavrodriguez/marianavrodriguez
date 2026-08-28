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

  // Locks .nav-name to the width of its widest state (the fully-typed
  // name) so the link's box never grows/shrinks while typing. Without
  // this, the box resizing under a stationary mouse retriggers
  // mouseenter/mouseleave mid-animation (browsers re-run :hover hit
  // testing on layout change, not just on mousemove) — expand and
  // collapse would fire in a loop, which is what made the cursor get
  // stuck blinking and swallowed clicks anywhere but over the fixed
  // left edge (the "M").
  function lockNavWidth() {
    if (!navName) return;
    const prevText = el.textContent;
    navName.style.minWidth = '';
    el.textContent = full;
    navName.style.minWidth = navName.getBoundingClientRect().width + 'px';
    el.textContent = prevText;
  }

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

  lockNavWidth();
  // Re-measure once the real webfont has swapped in — the fallback font
  // active on first paint renders "Mariana Victoria" at a different
  // width than Bricolage Grotesque does, which would leave the lock
  // sized for the wrong font.
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(lockNavWidth);

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
/* cursorX/cursorY (eased position) are shared, module-scope so the
   CURSOR TRAIL block below can sample the exact same lagging point
   the visible arrow renders at, instead of the raw un-eased mouse
   position — otherwise the trail's freshest end runs ahead of the
   arrow rather than reading as trailing from behind it. */
let cursorX = 0, cursorY = 0;

(function () {
  const cursor = document.getElementById('cursor');
  if (!cursor) return;

  let mx = 0, my = 0, rx = 0, ry = 0;

  document.addEventListener('mousemove', (e) => { mx = e.clientX; my = e.clientY; });
  document.addEventListener('mouseenter', () => cursor.classList.add('visible'));
  document.addEventListener('mouseleave', () => cursor.classList.remove('visible'));

  document.querySelectorAll('a, .cat-item, .btn-primary, .btn-ghost, .cat-modal-close, #cat-image-wrap').forEach((el) => {
    el.addEventListener('mouseenter', () => cursor.classList.add('hovered'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('hovered'));
  });

  function loop() {
    rx += (mx - rx) * 0.2;
    ry += (my - ry) * 0.2;
    cursor.style.left = rx + 'px'; cursor.style.top = ry + 'px';
    cursorX = rx; cursorY = ry;
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();


/* ─── CURSOR TRAIL ────────────────────────────────────────── */
/* A single tapering, fading curve drawn on canvas each frame from
   recent cursor positions — reads as one comet trail rather than a
   string of discrete sparks or a faceted polygon. maxAge is how long
   the tail lags behind the live cursor. Points are sampled once per
   animation frame from the same eased cursorX/cursorY the visible
   arrow uses (not raw 'mousemove' events), which keeps the trail
   visually attached to the arrow and gives it many closely-spaced
   points to curve through instead of a few long straight jumps.
   Each segment is drawn as a quadratic curve through the midpoints
   of its neighbors (a standard polyline-smoothing trick) so tight,
   fast loops render as a round sweep rather than straight-line
   facets. */
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
  let hasMoved = false;
  document.addEventListener('mousemove', () => { hasMoved = true; }, { once: true });

  function loop() {
    const now = performance.now();
    if (hasMoved) points.push({ x: cursorX, y: cursorY, t: now });
    points = points.filter((p) => now - p.t < maxAge);
    ctx.clearRect(0, 0, innerWidth, innerHeight);

    if (points.length > 2) {
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      for (let i = 1; i < points.length - 1; i++) {
        const prev = points[i - 1], curr = points[i], next = points[i + 1];
        const midA = { x: (prev.x + curr.x) / 2, y: (prev.y + curr.y) / 2 };
        const midB = { x: (curr.x + next.x) / 2, y: (curr.y + next.y) / 2 };
        const age = 1 - (now - curr.t) / maxAge; // 1 = just drawn, 0 = about to expire
        ctx.beginPath();
        ctx.moveTo(midA.x, midA.y);
        ctx.quadraticCurveTo(curr.x, curr.y, midB.x, midB.y);
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
   with the page. Loops by animating startOffset across exactly one
   rendered instance of PHRASE (measured with getComputedTextLength,
   not estimated from an average char width) — since the text is that
   same phrase repeated back to back, wrapping startOffset by exactly
   one phrase-length lands it back on a character-for-character
   identical point, so the reset is invisible. Wrapping by a wave-tile
   length instead (the previous approach) doesn't line up with the
   text's own repeat period, which is what caused the visible
   jump-cut at every loop restart. Driven by rAF rather than SMIL so
   the loop timing is explicit and never stalls. */
(function () {
  const svg      = document.querySelector('.marquee-svg');
  const path     = document.getElementById('marquee-path');
  const textPath = document.getElementById('marquee-textpath');
  if (!svg || !path || !textPath) return;

  const PHRASE = 'BRAND STRATEGY  •  VISUAL DESIGN  •  PHOTOGRAPHY  •  CREATIVE DIRECTION  •  GRAPHIC DESIGN  •  CONTENT CREATION  •  ';
  const textEl = textPath.parentElement;

  let sweepPct = 0;

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

    // The visible strip window needs to sit well inside the path, with
    // margin on both sides, so the text is never mid-tile and never
    // runs dry at the reset point. leftMargin pushes the swept tile far
    // enough left that it stays fully off-screen; tileCount then adds
    // enough tiles to reach past the strip's right edge too.
    const leftMargin = 3 * period;
    const totalWidth = leftMargin + W + 2 * period;
    const tileCount  = Math.max(Math.ceil(totalWidth / (2 * period)), 2);

    let d = `M ${-leftMargin},${mid}`;
    for (let i = 0; i < tileCount; i++) {
      d += ` c ${half / 2},${-amp} ${half * 1.5},${-amp} ${period},0`;
      d += ` c ${half / 2},${amp} ${half * 1.5},${amp} ${period},0`;
    }
    path.setAttribute('d', d);

    const fontSize = Math.max(H * 0.22, 13);
    textEl.style.fontSize = fontSize + 'px';

    const totalLen = path.getTotalLength();

    // Measure one instance of PHRASE's real rendered length on this
    // path/font before deciding how many repeats are needed to cover it.
    textPath.textContent = PHRASE;
    const phraseLen = textPath.getComputedTextLength() || 1;
    const repeatsNeeded = Math.ceil((totalLen * 1.1) / phraseLen) + 2;
    textPath.textContent = PHRASE.repeat(Math.max(repeatsNeeded, 3));

    // Sweeping startOffset by exactly one phrase-length always resets
    // onto an identical character, regardless of the wave path's own
    // tiling — that's what makes the wrap invisible.
    sweepPct = (phraseLen / totalLen) * 100;
  }

  layout();
  window.addEventListener('resize', layout);
  // Re-measure once the real webfont has swapped in — the fallback
  // font active on first paint renders PHRASE at a different width,
  // which would otherwise throw the wrap point off again later.
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const DUR = 16000; // ms per loop
  let start = null;
  function tick(ts) {
    if (start === null) start = ts;
    const t = ((ts - start) % DUR) / DUR;
    textPath.setAttribute('startOffset', (t * sweepPct) + '%');
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


/* ─── CASE VIDEO PLAY/PAUSE TOGGLE ───────────────────────── */
(function () {
  const block = document.querySelector('.case-video');
  const video = block && block.querySelector('video');
  const toggle = block && block.querySelector('.case-video-toggle');
  if (!block || !video || !toggle) return;
  toggle.addEventListener('click', () => {
    if (video.paused) {
      video.play();
      toggle.classList.remove('paused');
      toggle.setAttribute('aria-label', 'Pause video');
    } else {
      video.pause();
      toggle.classList.add('paused');
      toggle.setAttribute('aria-label', 'Play video');
    }
  });
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


/* ─── CATEGORY SHOWCASE + POP-UP ─────────────────────────── */
(function () {
  const items  = document.querySelectorAll('.cat-item');
  const catImg = document.getElementById('cat-img');
  if (!items.length) return;

  let current = 0;
  let paused  = false;

  function activate(index) {
    const n = items.length;
    items.forEach((el, i) => {
      el.classList.toggle('active', i === index);
      // Shortest signed circular distance from the active index, used
      // by the mobile ticker (styles.css) to slide each label into a
      // prev/active/next slot — the same 3 nodes just cycle roles
      // rather than the strip actually scrolling.
      let d = i - index;
      if (d > n / 2) d -= n;
      if (d < -n / 2) d += n;
      el.dataset.slot = d === 0 ? 'active' : d === -1 ? 'prev' : d === 1 ? 'next' : 'hidden';
    });

    if (catImg) {
      const src = items[index].dataset.img;
      if (src && catImg.src !== src) {
        catImg.style.opacity = '0';
        setTimeout(() => { catImg.src = src; catImg.style.opacity = '1'; }, 300);
      }
    }
    current = index;
  }

  // Project data reused from the project cards further down the page,
  // keyed so each category can pull in only the projects it applies to.
  const PROJECTS = {
    mod:     { title: 'mod',            image: 'images/mod.jpg',     href: 'mod.html' },
    gruprv:  { title: 'GrupRV',         image: 'images/gruprv.jpg',  href: 'gruprv.html' },
    urbany:  { title: 'Urbany Hostels', image: 'images/urbany.jpg',  href: 'urbany.html' },
    bodasrv: { title: 'Bodas RV',       image: 'images/bodasrv.jpg', href: 'bodasrv.html' },
  };

  // One entry per .cat-item, in DOM order.
  const CATEGORIES = [
    {
      title: 'Visual Identities',
      desc: "A visual identity is more than a logo — it's a system. I develop the full toolkit: mark, color, typography, and the rules that hold it together across every touchpoint, so a brand looks like itself everywhere it shows up.",
      projects: ['mod', 'gruprv', 'bodasrv'],
    },
    {
      title: 'Creative Direction',
      desc: 'Someone has to keep every piece — campaign, packaging, social feed — pulling in the same direction. I set that vision and steer it from strategy through to final execution.',
      projects: ['gruprv', 'urbany'],
    },
    {
      title: 'Graphic Design',
      desc: 'The craft-level work: layouts, print collateral, signage, packaging — where strategy and identity get translated into something people actually hold, read, and remember.',
      projects: ['mod', 'urbany'],
    },
    // Temporarily hidden — matching .cat-item elements are commented out
    // in index.html. Un-comment both together to bring these back.
    // {
    //   title: 'Photography',
    //   desc: 'Art direction and photography for brand campaigns and editorial work. This part of the portfolio is still being built — check back soon.',
    //   projects: [],
    //   photoLink: 'photography.html',
    // },
    // {
    //   title: 'Content Creation',
    //   desc: "Campaign assets built to carry a brand's voice across digital and print — the in-between pieces that keep a brand feeling consistent.",
    //   projects: [],
    //   gallery: ['images/cat-content-01.jpg', 'images/cat-content-02.jpg', 'images/cat-content-03.jpg'],
    // },
  ];

  const modal       = document.getElementById('cat-modal');
  const modalImage   = document.getElementById('cat-modal-image');
  const modalTitle   = document.getElementById('cat-modal-title');
  const modalDesc    = document.getElementById('cat-modal-desc');
  const modalProjects = document.getElementById('cat-modal-projects');
  const cursor        = document.getElementById('cursor');
  let lastTrigger = null;

  // Modal content is injected after page load, so its hover targets
  // can't be picked up by the CUSTOM CURSOR block's initial querySelectorAll —
  // bind them here instead, each time they're created.
  function bindCursorHover(el) {
    el.addEventListener('mouseenter', () => cursor && cursor.classList.add('hovered'));
    el.addEventListener('mouseleave', () => cursor && cursor.classList.remove('hovered'));
  }

  function renderModal(index) {
    const cat = CATEGORIES[index];
    if (!cat || !modal) return;

    modalImage.src = items[index].dataset.img;
    modalImage.alt = cat.title;
    modalTitle.textContent = cat.title;
    modalDesc.textContent = cat.desc;

    modalProjects.innerHTML = '';
    if (cat.gallery && cat.gallery.length) {
      cat.gallery.forEach((src) => {
        const div = document.createElement('div');
        div.className = 'cat-modal-project cat-modal-project--plain';
        div.innerHTML =
          '<div class="cat-modal-project-image">' +
            '<img src="' + src + '" alt="" loading="lazy" onerror="this.style.opacity=\'0\'">' +
          '</div>';
        modalProjects.appendChild(div);
      });
    } else if (cat.projects.length) {
      cat.projects.forEach((key) => {
        const p = PROJECTS[key];
        if (!p) return;
        const a = document.createElement('a');
        a.className = 'cat-modal-project';
        a.href = p.href;
        a.innerHTML =
          '<div class="cat-modal-project-image">' +
            '<img src="' + p.image + '" alt="' + p.title + '" loading="lazy" onerror="this.style.opacity=\'0\'">' +
            '<div class="cat-modal-project-overlay"><span class="cat-modal-project-btn">See project &gt;</span></div>' +
          '</div>';
        bindCursorHover(a);
        modalProjects.appendChild(a);
      });
    } else if (cat.photoLink) {
      const a = document.createElement('a');
      a.className = 'cat-modal-photo-link';
      a.href = cat.photoLink;
      a.textContent = 'View photography page →';
      bindCursorHover(a);
      modalProjects.appendChild(a);
    }
  }

  function openModal(index) {
    if (!modal) return;
    renderModal(index);
    lastTrigger = items[index];
    paused = true;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    const closeBtn = modal.querySelector('.cat-modal-close');
    if (closeBtn) closeBtn.focus();
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    paused = false;
    if (lastTrigger) lastTrigger.focus();
  }

  if (modal) {
    modal.querySelectorAll('[data-close]').forEach((el) => el.addEventListener('click', closeModal));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
    });
  }

  items.forEach((item, i) => {
    item.addEventListener('mouseenter', () => {
      if (!modal || !modal.classList.contains('open')) paused = true;
      activate(i);
    });
    item.addEventListener('mouseleave', () => {
      if (!modal || !modal.classList.contains('open')) paused = false;
    });
    item.addEventListener('click', () => { activate(i); openModal(i); });
  });

  // Tapping the photo itself opens the currently-active category —
  // matters most on mobile, where the ticker's labels are the only
  // other click target and it's not otherwise obvious the image is
  // part of the same "tap for more" affordance (see .category-image-hint).
  const imgWrap = document.getElementById('cat-image-wrap');
  if (imgWrap) imgWrap.addEventListener('click', () => openModal(current));

  // Sets data-slot on load — without this the mobile ticker's labels
  // (which are opacity:0 until a data-slot role is assigned) would
  // stay invisible until the first 3s rotation tick.
  activate(current);

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
