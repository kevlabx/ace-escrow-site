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

// Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(a=>{
  a.addEventListener('click', e=>{
    const id = a.getAttribute('href').slice(1);
    const el = document.getElementById(id);
    if(el){ e.preventDefault(); el.scrollIntoView({behavior:'smooth', block:'start'}); }
  });
});

// Dynamic year
document.getElementById('year').textContent = new Date().getFullYear();

// Simple intersection fade-in
const observer = new IntersectionObserver((entries)=>{
  entries.forEach(entry=>{
    if(entry.isIntersecting){ entry.target.classList.add('in'); }
  });
},{threshold:0.12});

document.querySelectorAll('.card,.step,.contact-card,.hero-media img').forEach(el=>{
  el.classList.add('fade');
  observer.observe(el);
});
