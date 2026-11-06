'use strict';

(() => {
  document.documentElement.classList.remove('no-js');

  const prefersReducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasFinePointer = matchMedia('(pointer: fine)').matches;
  const config = window.SPACEAPPS_CONFIG || {};
  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

  function initHeader() {
    const header = document.getElementById('header');
    const update = () => header.classList.toggle('scrolled', scrollY > 40);
    addEventListener('scroll', update, { passive: true });
    update();
  }

  function countUp(element) {
    const target = Number(element.dataset.count);
    const suffix = element.dataset.suffix || '';
    const format = (value) => `${Math.round(value).toLocaleString('en-US')}${suffix}`;
    if (prefersReducedMotion) {
      element.textContent = format(target);
      return;
    }
    const startTime = performance.now();
    const duration = 1800;
    const step = (now) => {
      const progress = clamp((now - startTime) / duration);
      element.textContent = format(target * (1 - Math.pow(1 - progress, 4)));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  function initReveals() {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add('in');
          observer.unobserve(entry.target);
          entry.target.querySelectorAll('[data-count]').forEach(countUp);
        }
      },
      { threshold: 0.15 },
    );
    document.querySelectorAll('[data-reveal], .join').forEach((element) => observer.observe(element));
  }

  function initStepsProgress() {
    const steps = document.getElementById('steps');
    if (!steps) return;
    const items = [...steps.children];
    const update = () => {
      const rect = steps.getBoundingClientRect();
      const progress = prefersReducedMotion
        ? 1
        : clamp((innerHeight * 0.75 - rect.top) / (rect.height + innerHeight * 0.2));
      const isVertical = innerWidth <= 900;
      steps.style.setProperty('--progress', progress.toFixed(3));
      items.forEach((item, index) => {
        const threshold = isVertical ? index / items.length : index / (items.length - 1);
        item.classList.toggle('on', progress >= threshold - 0.001);
      });
    };
    addEventListener('scroll', update, { passive: true });
    addEventListener('resize', update);
    update();
  }

  function initCountdown() {
    const countdown = document.getElementById('countdown');
    const target = config.eventStart ? new Date(config.eventStart).getTime() : NaN;
    if (!countdown || Number.isNaN(target)) return;

    const units = { d: 86400000, h: 3600000, m: 60000, s: 1000 };
    const cells = Object.fromEntries(
      [...countdown.querySelectorAll('[data-unit]')].map((cell) => [cell.dataset.unit, cell]),
    );
    const tick = () => {
      let remaining = target - Date.now();
      if (remaining <= 0) {
        countdown.hidden = true;
        return;
      }
      for (const [unit, milliseconds] of Object.entries(units)) {
        const value = Math.floor(remaining / milliseconds);
        remaining -= value * milliseconds;
        cells[unit].textContent = String(value).padStart(2, '0');
      }
      setTimeout(tick, 1000 - (Date.now() % 1000));
    };
    countdown.hidden = false;
    tick();
  }

  function initPreviewTilt() {
    const wrapper = document.getElementById('canvas-wrap');
    const badge = document.getElementById('badge');
    if (!hasFinePointer || prefersReducedMotion || !wrapper || !badge) return;
    wrapper.addEventListener('pointermove', (event) => {
      const rect = badge.getBoundingClientRect();
      badge.style.setProperty('--ry', `${((event.clientX - rect.left) / rect.width - 0.5) * 10}deg`);
      badge.style.setProperty('--rx', `${((event.clientY - rect.top) / rect.height - 0.5) * -10}deg`);
    });
    wrapper.addEventListener('pointerleave', () => {
      badge.style.setProperty('--rx', '0deg');
      badge.style.setProperty('--ry', '0deg');
    });
  }

  function initDropzone() {
    const upload = document.getElementById('upload');
    if (!upload) return;
    ['dragenter', 'dragover'].forEach((type) => upload.addEventListener(type, () => upload.classList.add('drag')));
    ['dragleave', 'drop'].forEach((type) => upload.addEventListener(type, () => upload.classList.remove('drag')));
  }

  initHeader();
  initReveals();
  initStepsProgress();
  initCountdown();
  initPreviewTilt();
  initDropzone();
})();
