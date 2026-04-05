function createParticles() {
  const bg = document.getElementById('particles-bg');
  if (!bg) return;
  const colors = ['#7c3aed', '#a855f7', '#2563eb', '#60a5fa', '#f97316', '#fb923c'];
  const count = 30;

  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.classList.add('particle');
    const size = Math.random() * 12 + 4;
    const color = colors[Math.floor(Math.random() * colors.length)];
    const left = Math.random() * 100;
    const duration = Math.random() * 20 + 15;
    const delay = Math.random() * 15;

    p.style.cssText = `
      width: ${size}px;
      height: ${size}px;
      left: ${left}%;
      bottom: -20px;
      background: ${color};
      animation-duration: ${duration}s;
      animation-delay: ${delay}s;
      filter: blur(${size > 10 ? 2 : 0}px);
    `;
    bg.appendChild(p);
  }
}

function initBurger() {
  const burger = document.getElementById('burger');
  const mobileNav = document.getElementById('mobile-nav');
  if (!burger || !mobileNav) return;

  burger.addEventListener('click', () => {
    const isOpen = mobileNav.classList.toggle('open');
    burger.querySelector('.b1').style.transform = isOpen ? 'rotate(45deg) translate(5px, 6px)' : '';
    burger.querySelector('.b2').style.opacity = isOpen ? '0' : '1';
    burger.querySelector('.b3').style.transform = isOpen ? 'rotate(-45deg) translate(5px, -6px)' : '';
  });

  document.querySelectorAll('#mobile-nav a').forEach(link => {
    link.addEventListener('click', () => {
      mobileNav.classList.remove('open');
      burger.querySelector('.b1').style.transform = '';
      burger.querySelector('.b2').style.opacity = '1';
      burger.querySelector('.b3').style.transform = '';
    });
  });
}

function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (href === '#') return;
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        const navH = 70;
        const top = target.getBoundingClientRect().top + window.scrollY - navH;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });
}

function initFadeUp() {
  const elements = document.querySelectorAll('.fade-up');
  if (!elements.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1 });

  elements.forEach(el => observer.observe(el));
}

document.addEventListener('DOMContentLoaded', () => {
  createParticles();
  initBurger();
  initSmoothScroll();
  initFadeUp();
});
