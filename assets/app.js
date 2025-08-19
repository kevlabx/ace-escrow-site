/* -------------------------------------------
   American Classic Escrow — site scripts
   ------------------------------------------- */

/* ========= Theme (light / dark) ========= */
const root = document.documentElement;
const savedTheme = localStorage.getItem('theme');
if (savedTheme) root.setAttribute('data-theme', savedTheme);

document.querySelector('.theme-toggle')?.addEventListener('click', () => {
  const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  root.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
});

/* ========= Mobile nav ========= */
const navToggle = document.querySelector('.nav-toggle');
const navLinks  = document.querySelector('.nav-links');
if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    const open = navLinks.style.display === 'flex';
    navLinks.style.display = open ? 'none' : 'flex';
    navToggle.setAttribute('aria-expanded', String(!open));
  });
}

/* ========= Smooth scroll for anchor links ========= */
function smoothTo(el) {
  if (!el) return;
  if ('startViewTransition' in document) {
    document.startViewTransition(() =>
      el.scrollIntoView({ behavior: 'instant', block: 'start' })
    );
  } else {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const id = a.getAttribute('href').slice(1);
    const el = document.getElementById(id);
    if (el) { e.preventDefault(); smoothTo(el); }
  });
});

/* ========= Footer year ========= */
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

/* ========= Fade / stagger on view ========= */
const fadeObs = new IntersectionObserver(es => {
  es.forEach(e => { if (e.isIntersecting) e.target.classList.add('in'); });
},{ threshold: 0.12 });

document.querySelectorAll('.card,.step,.contact-card,.stagger > *').forEach((el, i) => {
  el.classList.add('fade');
  el.style.transitionDelay = (i * 120) + 'ms';
  fadeObs.observe(el);
});

/* ========= Header style on scroll ========= */
addEventListener('scroll', () => {
  const h = document.querySelector('.site-header');
  if (!h) return;
  h.classList.toggle('scrolled', window.scrollY > 8);
});

/* ========= Active section highlight in nav ========= */
const sections = [...document.querySelectorAll('section[id]')];
const navMap = new Map(
  [...document.querySelectorAll('.nav-links a')]
    .map(a => [a.getAttribute('href').slice(1), a])
);
const secObs = new IntersectionObserver(es => {
  es.forEach(e => {
    if (!e.isIntersecting) return;
    const id = e.target.id;
    navMap.forEach(a => a.classList.remove('active'));
    navMap.get(id)?.classList.add('active');
  });
},{ rootMargin: '-40% 0px -55% 0px', threshold: [0, 1] });
sections.forEach(s => secObs.observe(s));

/* ========= Contact form → Google Apps Script =========
   Paste your Web App URL (must end with /exec) here.
   --------------------------------------------------- */
const GAS_URL = 'https://script.google.com/macros/s/AKfycbyn5s6DFM5TkUVq4YEDS6inC4HriZ4jLLa--gqFA8f02jVXXPqkONaGJ7bNxqgSzGCC/exec';

(function contactFormHandler () {
  const form = document.getElementById('contact-form');
  if (!form) return;

  const msg = form.querySelector('.form-msg');
  const btn = form.querySelector('button[type="submit"]');

  function setStatus(text, ok) {
    if (!msg) return;
    msg.textContent = text || '';
    msg.style.color = ok ? 'var(--accent)' : '#ef4444';
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    setStatus('');
    if (btn) { btn.disabled = true; btn.textContent = 'Submitting…'; }

    try {
      const fd = new FormData(form);
      fd.append('page', location.href);

      // Use x-www-form-urlencoded + no-cors so the request always goes out cleanly.
      await fetch(GAS_URL, {
        method: 'POST',
        body: new URLSearchParams(fd),
        mode: 'no-cors'
      });

      // On success, go to the thank-you page.
      window.location.href = 'thanks.html';
    } catch {
      setStatus('Network error. Please email escrow@aceescrowservices.com.', false);
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = 'Submit'; }
    }
  });
})();

/* ========= Ambient floating icons (with toggle) ========= */
(function ambient() {
  const container = document.createElement('div');
  container.className = 'ambient-layer';
  document.body.appendChild(container);

  const settings = {
    enabled: localStorage.getItem('ambient') !== 'off',
    count: 18,                 // how many bubbles/icons
    sizeMin: 22, sizeMax: 40,  // icon size (px)
    speed: 0.15,               // base drift speed
    repelRadius: 140,          // how far the pointer pushes
    repelForce: 18             // how strong the push feels
  };

  const ICONS = [
    '🏠','📄','🏦','🤝','🛡️','💵','✍️'
  ];

  const nodes = [];

  function rnd(a, b) { return Math.random() * (b - a) + a; }

  function spawnOne() {
    const el = document.createElement('span');
    el.className = 'ambient-icon';
    el.textContent = ICONS[Math.floor(Math.random() * ICONS.length)];
    const size = rnd(settings.sizeMin, settings.sizeMax);
    el.style.fontSize = size + 'px';
    el.style.opacity = '.65';
    container.appendChild(el);

    const node = {
      el,
      x: rnd(0, window.innerWidth),
      y: rnd(0, window.innerHeight * 1.2),
      vx: rnd(-settings.speed, settings.speed),
      vy: rnd(-settings.speed, settings.speed),
      size
    };
    el.style.transform = `translate(${node.x}px, ${node.y}px)`;
    nodes.push(node);
  }

  function clearAll() {
    nodes.splice(0).forEach(n => n.el.remove());
  }

  function spawnMany(n = settings.count) {
    clearAll();
    for (let i = 0; i < n; i++) spawnOne();
  }

  let mouseX = -9999, mouseY = -9999;
  addEventListener('mousemove', (e) => { mouseX = e.clientX; mouseY = e.clientY; });
  addEventListener('mouseleave', () => { mouseX = -9999; mouseY = -9999; });

  function tick() {
    if (settings.enabled) {
      for (const n of nodes) {
        // gentle drift
        n.x += n.vx; n.y += n.vy;

        // wrap around edges
        if (n.x < -50) n.x = innerWidth + 50;
        if (n.x > innerWidth + 50) n.x = -50;
        if (n.y < -50) n.y = innerHeight + 50;
        if (n.y > innerHeight + 50) n.y = -50;

        // pointer repulsion
        const dx = n.x - mouseX;
        const dy = n.y - mouseY;
        const d2 = dx*dx + dy*dy;
        const r2 = settings.repelRadius * settings.repelRadius;
        if (d2 < r2) {
          const d = Math.max(12, Math.sqrt(d2));
          const f = (settings.repelForce / d);
          n.x += (dx / d) * f * 4;
          n.y += (dy / d) * f * 4;
        }

        n.el.style.transform = `translate(${n.x}px, ${n.y}px)`;
      }
    }
    requestAnimationFrame(tick);
  }

  // Toggle button in header (moon icon sits next to it)
  const ambientBtn = document.querySelector('.ambient-toggle');
  function syncBtn() {
    if (!ambientBtn) return;
    ambientBtn.setAttribute('aria-pressed', String(settings.enabled));
    ambientBtn.title = settings.enabled ? 'Disable ambient icons' : 'Enable ambient icons';
  }
  ambientBtn?.addEventListener('click', () => {
    settings.enabled = !settings.enabled;
    localStorage.setItem('ambient', settings.enabled ? 'on' : 'off');
    if (settings.enabled && nodes.length === 0) spawnMany();
    syncBtn();
  });
  syncBtn();

  // Respect saved setting
  if (settings.enabled) spawnMany();

  // Reflow on resize
  let rid;
  addEventListener('resize', () => {
    cancelAnimationFrame(rid);
    rid = requestAnimationFrame(() => {
      if (settings.enabled) spawnMany();
    });
  });

  tick();
})();

/* ========= PWA (service worker) ========= */
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
