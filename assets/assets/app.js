/* ===============================
   Theme, nav, interactions, PWA
   =============================== */

// Theme persistence + toggle
const root = document.documentElement;
const savedTheme = localStorage.getItem('theme');
if (savedTheme) root.setAttribute('data-theme', savedTheme);
document.querySelector('.theme-toggle')?.addEventListener('click', () => {
  const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  root.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
});

// Mobile nav toggle
const toggle = document.querySelector('.nav-toggle');
const links = document.querySelector('.nav-links');
if (toggle && links) {
  toggle.addEventListener('click', () => {
    const open = links.style.display === 'flex';
    links.style.display = open ? 'none' : 'flex';
    toggle.setAttribute('aria-expanded', String(!open));
  });
}

// Smooth scroll; uses View Transitions if available
function smoothTo(el){
  if (!el) return;
  if ('startViewTransition' in document) {
    document.startViewTransition(() => el.scrollIntoView({behavior:'instant', block:'start'}));
  } else {
    el.scrollIntoView({behavior:'smooth', block:'start'});
  }
}
document.querySelectorAll('a[href^="#"]').forEach(a=>{
  a.addEventListener('click', e=>{
    const id = a.getAttribute('href').slice(1);
    const el = document.getElementById(id);
    if (el) { e.preventDefault(); smoothTo(el); }
  });
});

// Dynamic year (guarded)
const y = document.getElementById('year');
if (y) y.textContent = new Date().getFullYear();

// Intersection fades + stagger
const fadeObserver = new IntersectionObserver((entries)=>{
  entries.forEach(entry=>{
    if(entry.isIntersecting){ entry.target.classList.add('in'); }
  });
},{threshold:0.12});
document.querySelectorAll('.card,.step,.contact-card,.stagger > *').forEach((el,i)=>{
  el.classList.add('fade');
  el.style.transitionDelay = (i * 60) + 'ms';
  fadeObserver.observe(el);
});

// Header background on scroll
addEventListener('scroll',()=>{
  const header = document.querySelector('.site-header');
  if (!header) return;
  header.classList.toggle('scrolled', window.scrollY > 8);
});

// Active section highlight in navbar
const sections = [...document.querySelectorAll('section[id]')];
const navMap = new Map([...document.querySelectorAll('.nav-links a')].map(a=>[a.getAttribute('href').slice(1),a]));
const secObs = new IntersectionObserver(es=>{
  es.forEach(e=>{
    if(!e.isIntersecting) return;
    const id = e.target.id;
    navMap.forEach(a=>a.classList.remove('active'));
    navMap.get(id)?.classList.add('active');
  });
},{rootMargin:'-40% 0px -55% 0px', threshold:[0,1]});
sections.forEach(s=>secObs.observe(s));

// Form UX: disable submit after click
const form = document.querySelector('.form');
const btn  = form?.querySelector('button');
form?.addEventListener('submit',()=>{
  if(btn){ btn.disabled = true; btn.textContent = 'Submitting...'; }
});

// PWA: service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(()=>{});
}
