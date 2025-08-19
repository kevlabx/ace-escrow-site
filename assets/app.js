// ----------------------------
// Theme toggle (persists)
// ----------------------------
const root = document.documentElement;
const savedTheme = localStorage.getItem('theme');
if (savedTheme) root.setAttribute('data-theme', savedTheme);

const themeBtn = document.querySelector('.theme-toggle');
function setThemeIcon() {
  const t = root.getAttribute('data-theme') || 'light';
  if (themeBtn) themeBtn.textContent = t === 'dark' ? '☀️' : '🌙';
}
setThemeIcon();

themeBtn?.addEventListener('click', () => {
  const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  root.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
  setThemeIcon();
});

// ----------------------------
// Mobile nav toggle
// ----------------------------
const navToggle = document.querySelector('.nav-toggle');
const navLinks  = document.querySelector('.nav-links');
if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    const open = navLinks.style.display === 'flex';
    navLinks.style.display = open ? 'none' : 'flex';
    navToggle.setAttribute('aria-expanded', String(!open));
  });
}

// ----------------------------
// Smooth scroll for hash links
// ----------------------------
function smoothTo(el){
  if(!el) return;
  if('startViewTransition' in document){
    document.startViewTransition(()=>el.scrollIntoView({behavior:'instant',block:'start'}));
  }else{
    el.scrollIntoView({behavior:'smooth',block:'start'});
  }
}
document.querySelectorAll('a[href^="#"]').forEach(a=>{
  a.addEventListener('click',e=>{
    const id = a.getAttribute('href').slice(1);
    const el = document.getElementById(id);
    if(el){ e.preventDefault(); smoothTo(el); }
  });
});

// ----------------------------
// Year in footer
// ----------------------------
const y = document.getElementById('year');
if (y) y.textContent = new Date().getFullYear();

// ----------------------------
// Fade-in + stagger on scroll
// ----------------------------
const fadeObs = new IntersectionObserver(es=>{
  es.forEach(e=>{ if(e.isIntersecting) e.target.classList.add('in'); });
},{threshold:0.12});
document.querySelectorAll('.card,.step,.contact-card,.stagger > *').forEach((el,i)=>{
  el.classList.add('fade'); el.style.transitionDelay=(i*120)+'ms'; fadeObs.observe(el);
});

// ----------------------------
// Header style on scroll
// ----------------------------
addEventListener('scroll', ()=>{
  const h = document.querySelector('.site-header');
  if (!h) return;
  h.classList.toggle('scrolled', window.scrollY > 8);
});

// ----------------------------
// Active section highlight
// ----------------------------
const sections = [...document.querySelectorAll('section[id]')];
const navMap = new Map([...document.querySelectorAll('.nav-links a')]
  .map(a => [a.getAttribute('href').slice(1), a]));
const secObs = new IntersectionObserver(es=>{
  es.forEach(e=>{
    if(!e.isIntersecting) return;
    const id = e.target.id;
    navMap.forEach(a => a.classList.remove('active'));
    navMap.get(id)?.classList.add('active');
  });
},{rootMargin:'-40% 0px -55% 0px',threshold:[0,1]});
sections.forEach(s => secObs.observe(s));

// ----------------------------
// Form UX + "Open order" intent
// ----------------------------
const form = document.querySelector('#contact-form');
const submitBtn = form?.querySelector('button');
const formMsg = document.querySelector('.form-msg');
form?.addEventListener('submit', (e) => {
  if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Submitting...'; }
});

// Set hidden "intent" field when CTA buttons are used
function setIntentFrom(el){
  const intent = el?.dataset?.intent || '';
  const field = document.getElementById('intent-field');
  if (field) field.value = intent;
}
document.getElementById('open-order-hero')?.addEventListener('click', e => setIntentFrom(e.currentTarget));
document.getElementById('open-order-nav')?.addEventListener('click',  e => setIntentFrom(e.currentTarget));
document.getElementById('open-order-sticky')?.addEventListener('click', e => setIntentFrom(e.currentTarget));

// ----------------------------
// (Legacy) tiny hero tokens – safe no-op if none exist
// ----------------------------
(function(){
  const tokens = [...document.querySelectorAll('.token')];
  if (!tokens.length) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  let mouseX = 0, mouseY = 0;
  addEventListener('mousemove', (e)=>{ mouseX=e.clientX; mouseY=e.clientY; }, {passive:true});

  function loop(t){
    const W = innerWidth, H = innerHeight;
    tokens.forEach((el,i)=>{
      const speed = Number(el.dataset.speed || 6);
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width/2, cy = rect.top + rect.height/2;
      const dx = ((mouseX || W/2) - cx) / W;
      const dy = ((mouseY || H/2) - cy) / H;

      const fy = Math.sin((t/1000)+i)*4;
      const fx = Math.cos((t/1200)+i*0.7)*3;
      const px = dx * speed;
      const py = dy * speed;

      el.style.transform = `translate3d(${fx+px}px, ${fy+py}px, 0)`;
    });
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();

// ----------------------------
// Service worker: don't cache during local dev
// ----------------------------
if ('serviceWorker' in navigator) {
  if (location.hostname === 'aceescrowservices.com') {
    navigator.serviceWorker.register('/sw.js').catch(()=>{});
  } else {
    navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(r => r.unregister()));
  }
}

// ----------------------------
// Floating icons engine (global overlay)
// Bigger icons + strong repulsion + on/off button
// ----------------------------
(function(){
  let container, icons=[], animId=null, running=false;

  const ambientBtn = document.querySelector('.ambient-toggle');
  function setAmbientButton(on){
    if (!ambientBtn) return;
    ambientBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
    ambientBtn.title = on ? 'Disable floating icons' : 'Enable floating icons';
    ambientBtn.textContent = on ? '🫧' : '⛔';
  }

  function themeLightness(){
    return (document.documentElement.getAttribute('data-theme') === 'dark') ? 70 : 40;
  }

  function start(){
    if (running) return;

    // Respect motion + screen width + user preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (window.innerWidth < 920) return;
    if (localStorage.getItem('ambient') === 'off') { setAmbientButton(false); return; }

    container = document.querySelector('.ambient-global');
    if (!container) return;

    running = true;
    icons.length = 0;

    const NS = 'http://www.w3.org/2000/svg';
    const svgEl = (tag, attrs={}) => {
      const el = document.createElementNS(NS, tag);
      for (const k in attrs) el.setAttribute(k, attrs[k]);
      return el;
    };

    // Icon shapes (house, shield, doc, key, "1031")
    const makeHouse = () => { const s=svgEl('svg',{viewBox:'0 0 64 64'}),g=svgEl('g');
      g.appendChild(svgEl('path',{d:'M8 30 L32 12 L56 30'}));
      g.appendChild(svgEl('rect',{x:'18',y:'30',width:'28',height:'22',rx:'4'}));
      g.appendChild(svgEl('circle',{cx:'44',cy:'44',r:'3'}));
      s.appendChild(g); return s; };
    const makeShield = () => { const s=svgEl('svg',{viewBox:'0 0 64 64'}),g=svgEl('g');
      g.appendChild(svgEl('path',{d:'M32 10 L52 16 v16 c0 12 -8 20 -20 26 C20 52 12 44 12 32 V16 Z'}));
      g.appendChild(svgEl('path',{d:'M22 34 l8 8 l12 -12'}));
      s.appendChild(g); return s; };
    const makeDoc = () => { const s=svgEl('svg',{viewBox:'0 0 64 64'}),g=svgEl('g');
      g.appendChild(svgEl('rect',{x:'16',y:'12',width:'32',height:'40',rx:'4'}));
      g.appendChild(svgEl('path',{d:'M22 26 h20 M22 32 h20'}));
      g.appendChild(svgEl('path',{d:'M22 40 l6 6 l14 -14'}));
      s.appendChild(g); return s; };
    const makeKey = () => { const s=svgEl('svg',{viewBox:'0 0 64 64'}),g=svgEl('g');
      g.appendChild(svgEl('circle',{cx:'28',cy:'36',r:'6'}));
      g.appendChild(svgEl('path',{d:'M34 36 l18 0 l0 6 l-6 0 l0 6'}));
      s.appendChild(g); return s; };
    const make1031 = () => { const s=svgEl('svg',{viewBox:'0 0 64 64'}),g=svgEl('g');
      g.appendChild(svgEl('rect',{x:'12',y:'18',width:'40',height:'28',rx:'6'}));
      g.appendChild(svgEl('path',{d:'M20 24 v16'}));
      g.appendChild(svgEl('circle',{cx:'30',cy:'32',r:'6'}));
      g.appendChild(svgEl('path',{d:'M40 26 c4 0 6 2 6 6 s-2 6 -6 6'}));
      g.appendChild(svgEl('path',{d:'M48 24 v16'}));
      s.appendChild(g); return s; };

    const MAKERS = [makeHouse, makeShield, makeDoc, makeKey, make1031];

    // More visible: more and bigger icons, but still smooth
    const COUNT = Math.min(24, Math.max(14, Math.round(window.innerWidth / 70)));

    function spawn(i){
      const wrap = document.createElement('div');
      wrap.className = 'icon-float';
      const svg = MAKERS[i % MAKERS.length]();
      wrap.appendChild(svg);
      container.appendChild(wrap);

      const W = window.innerWidth, H = window.innerHeight;
      const s = 36 + Math.random()*20;       // 36–56 px (bigger than before)
      wrap.style.width = s+'px'; wrap.style.height = s+'px';

      const hue = Math.random()*360;
      wrap.style.color = `hsl(${hue}, 70%, ${themeLightness()}%)`;

      icons.push({
        el: wrap,
        x: Math.random()*W,
        y: Math.random()*H,
        vx: (Math.random()-0.5)*0.5,
        vy: (Math.random()-0.5)*0.5,
        h: hue,
        l: themeLightness(),
        phase: Math.random()*Math.PI*2
      });
    }
    for (let i=0; i<COUNT; i++) spawn(i);

    // Mouse repulsion (stronger so you can't touch them)
    let mx = window.innerWidth/2, my = window.innerHeight/2, active=false;
    window.addEventListener('mousemove', e => { mx=e.clientX; my=e.clientY; active=true; }, {passive:true});
    window.addEventListener('mouseleave', () => { active=false; });

    // Update brightness on theme change
    themeBtn?.addEventListener('click', ()=>{
      const L = themeLightness();
      icons.forEach(b => { b.l = L; });
    });

    function tick(t){
      const W = window.innerWidth, H = window.innerHeight;
      for (const b of icons){
        // gentle float
        b.vx += Math.cos(t/1100 + b.phase) * 0.003;
        b.vy += Math.sin(t/1000 + b.phase) * 0.004;

        // strong repulsion
        if (active){
          const dx = b.x - mx, dy = b.y - my;
          const d2 = dx*dx + dy*dy, R = 220;
          if (d2 < R*R){
            const d = Math.max(Math.sqrt(d2), 0.001);
            const f = (R - d)/R * 1.6;
            b.vx += (dx/d) * f * 1.2;
            b.vy += (dy/d) * f * 1.2;
          }
        }

        // clamp + move
        const max = 1.35;
        b.vx = Math.max(-max, Math.min(max, b.vx));
        b.vy = Math.max(-max, Math.min(max, b.vy));
        b.x += b.vx; b.y += b.vy;

        // wrap around
        if (b.x < -40) b.x = W+40;
        if (b.x > W+40) b.x = -40;
        if (b.y < -40) b.y = H+40;
        if (b.y > H+40) b.y = -40;

        // hue cycle + draw
        b.h = (b.h + 0.18) % 360;
        b.el.style.color = `hsl(${b.h}, 70%, ${b.l}%)`;
        b.el.style.transform = `translate3d(${b.x}px, ${b.y}px, 0)`;
      }
      animId = requestAnimationFrame(tick);
    }
    animId = requestAnimationFrame(tick);
    setAmbientButton(true);
  }

  function stop(){
    if (!running) return;
    running = false;
    if (animId) cancelAnimationFrame(animId);
    icons.forEach(b => b.el.remove());
    icons.length = 0;
    setAmbientButton(false);
  }

  // Hook up the button (remember choice)
  if (ambientBtn){
    let on = (localStorage.getItem('ambient') !== 'off');
    setAmbientButton(on);

    ambientBtn.addEventListener('click', ()=>{
      on = !on;
      localStorage.setItem('ambient', on ? 'on' : 'off');
      if (on) start(); else stop();
    });
  }

  // Autostart after DOM if user hasn't turned it off
  function maybeStart(){
    if (localStorage.getItem('ambient') !== 'off') start();
    else setAmbientButton(false);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', maybeStart);
  } else {
    maybeStart();
  }

  // Expose for debugging
  window.Ambient = { start, stop, isRunning: () => running };
})();

// ----------------------------
// GOOGLE APPS SCRIPT SUBMISSION
// ----------------------------
(function(){
  const GAS_URL = 'https://script.google.com/macros/s/AKfycbyn5s6DFM5TkUVq4YEDS6inC4HriZ4jLLa--gqFA8f02jVXXPqkONaGJ7bNxqgSzGCC/exec';
  const form = document.querySelector('#contact-form');
  if (!form) return;

  const submitBtn = form.querySelector('button');
  const msgEl = document.querySelector('.form-msg');

  function setStatus(text, isError=false){
    if (msgEl) {
      msgEl.textContent = text;
      msgEl.style.color = isError ? '#b91c1c' : 'inherit';
    }
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // basic front-end validation
    if (!form.checkValidity()) {
      setStatus('Please fix the highlighted fields.');
      submitBtn?.removeAttribute('disabled');
      submitBtn && (submitBtn.textContent = 'Submit');
      return;
    }

    // honeypot trap (Apps Script expects _gotcha)
    const hp = form.querySelector('input[name="_gotcha"]');
    if (hp && hp.value.trim() !== '') {
      setStatus('Thanks!'); // silently ignore bots
      submitBtn && (submitBtn.textContent = 'Submitted');
      return;
    }

    setStatus('Sending…');

    try {
      const fd = new FormData(form);
      fd.append('site', location.hostname);
      fd.append('page', location.href); // show which page produced the message

      // Apps Script often lacks CORS headers; use no-cors to avoid blocking
      await fetch(GAS_URL, {
        method: 'POST',
        mode: 'no-cors',
        cache: 'no-store',
        body: fd
      });

      // We can't read the response in no-cors mode; assume success and redirect
      location.href = 'thanks.html';
    } catch (err) {
      setStatus('Could not send right now. Please email escrow@aceescrowservices.com or call (562) 860-3881.', true);
      submitBtn?.removeAttribute('disabled');
      submitBtn && (submitBtn.textContent = 'Submit');
    }
  }, { passive: false });
})();
