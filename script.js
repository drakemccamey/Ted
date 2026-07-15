document.addEventListener('DOMContentLoaded', () => {
  const year = document.getElementById('year');
  if (year) {
    year.textContent = new Date().getFullYear();
  }

  const navToggle = document.querySelector('.nav-toggle');
  const siteNav = document.getElementById('site-nav');

  if (navToggle && siteNav) {
    navToggle.addEventListener('click', () => {
      const isOpen = siteNav.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });

    siteNav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        siteNav.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (event) => {
      const targetId = anchor.getAttribute('href');
      const target = document.querySelector(targetId);

      if (target) {
        event.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  const brandBulbLayer = document.querySelector('.brand-bulb-layer');
  if (brandBulbLayer) {
    const bulbPositions = [
      { x: 9, y: 20, size: 6 },
      { x: 21, y: 10, size: 6 },
      { x: 38, y: 8, size: 7 },
      { x: 56, y: 6, size: 7 },
      { x: 74, y: 9, size: 6 },
      { x: 87, y: 19, size: 6 },
      { x: 87, y: 56, size: 6 },
      { x: 76, y: 79, size: 7 },
      { x: 58, y: 89, size: 7 },
      { x: 40, y: 91, size: 7 },
      { x: 20, y: 80, size: 6 },
      { x: 10, y: 58, size: 6 }
    ];

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    bulbPositions.forEach((position, index) => {
      const bulb = document.createElement('span');
      bulb.className = 'brand-bulb';
      bulb.dataset.group = String(index % 4);
      bulb.style.left = `${position.x}%`;
      bulb.style.top = `${position.y}%`;
      bulb.style.width = `${position.size}px`;
      bulb.style.height = `${position.size}px`;
      brandBulbLayer.appendChild(bulb);
    });

    const bulbs = Array.from(brandBulbLayer.querySelectorAll('.brand-bulb'));

    if (!reducedMotion) {
      let currentGroup = 0;
      const pulseBulbs = () => {
        bulbs.forEach((bulb) => {
          const isActive = Number(bulb.dataset.group) === currentGroup;
          bulb.classList.toggle('is-active', isActive);
        });
        currentGroup = (currentGroup + 1) % 4;
      };

      pulseBulbs();
      setInterval(pulseBulbs, 700);
    } else {
      bulbs.forEach((bulb) => bulb.classList.add('is-active'));
    }
  }
});
