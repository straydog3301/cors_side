// CYBER-OCCULT REPAIR SHOP — script.js
document.addEventListener('DOMContentLoaded', () => {

  // ── Scroll-driven fade-in animations ──
  const observerOptions = { threshold: 0.12, rootMargin: '0px 0px -40px 0px' };
  const fadeObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        fadeObserver.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll(
    '.about-card, .timeline-item, .char-card, .sys-card, .vdp-item, .phase, .dev-stat'
  ).forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    fadeObserver.observe(el);
  });

  // Add .visible style rule via JS (since we can't edit <style> from here easily)
  const style = document.createElement('style');
  style.textContent = `
    .visible { opacity: 1 !important; transform: translateY(0) !important; }
  `;
  document.head.appendChild(style);

  // ── Hero glitch text effect ──
  const titleEl = document.querySelector('.title-cyber');
  if (titleEl) {
    titleEl.addEventListener('mouseenter', () => {
      titleEl.style.textShadow = '3px 0 var(--magenta), -3px 0 var(--cyan), 0 0 30px rgba(0,255,245,0.5)';
      titleEl.style.transition = 'text-shadow 0.1s';
      setTimeout(() => {
        titleEl.style.textShadow = '0 0 30px rgba(0,255,245,0.5)';
      }, 150);
    });
  }

  // ── Nav smooth scroll (if nav existed) ──
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // ── Char art hover — slight scan effect ──
  document.querySelectorAll('.char-art').forEach(img => {
    img.addEventListener('mouseenter', () => {
      img.style.filter = 'saturate(1.1) brightness(1.05)';
    });
    img.addEventListener('mouseleave', () => {
      img.style.filter = 'saturate(0.9) brightness(0.95)';
    });
  });

  // ── Screenshot hover — reveal caption ──
  document.querySelectorAll('.screenshot').forEach(img => {
    img.addEventListener('click', () => {
      // Cycle brightness on click
      const current = img.style.filter || 'saturate(0.85) contrast(1.05)';
      img.style.filter = current.includes('1.3') ? 'saturate(0.85) contrast(1.05)' : 'saturate(1.1) contrast(1.2)';
    });
  });

  // ── Typing effect for tagline (one-time) ──
  const tagline = document.querySelector('.tagline-en');
  if (tagline && !sessionStorage.getItem('typed')) {
    const text = tagline.textContent;
    tagline.textContent = '';
    tagline.style.borderRight = '2px solid var(--cyan)';
    let i = 0;
    const typeInterval = setInterval(() => {
      if (i < text.length) {
        tagline.textContent += text[i++];
      } else {
        clearInterval(typeInterval);
        setTimeout(() => { tagline.style.borderRight = 'none'; }, 1000);
        sessionStorage.setItem('typed', '1');
      }
    }, 50);
  }

  // ── Stat bar animation when char card scrolls into view ──
  const charObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.querySelectorAll('.stat-fill').forEach(bar => {
          const targetWidth = bar.style.width;
          bar.style.width = '0%';
          bar.style.transition = 'width 1s ease';
          setTimeout(() => { bar.style.width = targetWidth; }, 100);
        });
        charObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });

  document.querySelectorAll('.char-card').forEach(card => charObserver.observe(card));

});