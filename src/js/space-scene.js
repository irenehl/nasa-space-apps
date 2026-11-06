'use strict';

(() => {
  const canvas = document.getElementById('space');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const prefersReducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasFinePointer = matchMedia('(pointer: fine)').matches;
  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  const TAU = Math.PI * 2;

  const FAR_PLANE = 3200;
  const NEAR_PLANE = 8;
  const FIELD_SPREAD = 2200;
  const RING_RADIUS = 430;
  const RING_SPACING = 400;
  const RING_COUNT = FAR_PLANE / RING_SPACING;
  const BASE_SPEED = 0.085;
  const SATELLITE_COLORS = ['#FFFFFF', '#EAFE07', '#FFFFFF', '#2E96F5'];

  const rings = Array.from({ length: RING_COUNT }, (_, index) => ({
    z: RING_SPACING * (index + 1),
    phase: index * 2.1,
    direction: index % 2 ? 1 : -1,
    color: SATELLITE_COLORS[index % SATELLITE_COLORS.length],
  }));
  const pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };

  let width = 0;
  let height = 0;
  let focalLength = 600;
  let stars = [];
  let crosses = [];
  let distanceTravelled = 0;
  let scrollBoost = 0;
  let lastFrameTime = 0;
  let lastScrollY = scrollY;
  let running = false;

  function spawnParticle(particle, atFarPlane) {
    particle.x = (Math.random() * 2 - 1) * FIELD_SPREAD;
    particle.y = (Math.random() * 2 - 1) * FIELD_SPREAD;
    particle.z = atFarPlane ? FAR_PLANE * (0.55 + Math.random() * 0.45) : NEAR_PLANE + Math.random() * FAR_PLANE;
    particle.twinkle = Math.random() * TAU;
    return particle;
  }

  function resize() {
    const pixelRatio = Math.min(devicePixelRatio || 1, 2);
    width = innerWidth;
    height = innerHeight;
    canvas.width = width * pixelRatio;
    canvas.height = height * pixelRatio;
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    focalLength = Math.max(width, height) * 0.55;
    const starCount = Math.min(760, Math.round((width * height) / 1700));
    stars = Array.from({ length: starCount }, () => spawnParticle({}, false));
    crosses = Array.from({ length: 26 }, () => spawnParticle({}, false));
    render(lastFrameTime, true);
  }

  function vanishingPoint() {
    const isWide = width >= 900;
    return [
      (isWide ? width * 0.72 : width * 0.5) - pointer.x * 50,
      (isWide ? height * 0.5 : height * 0.22) - pointer.y * 40,
    ];
  }

  function tunnelBend(depth) {
    return [Math.sin(depth * 0.00055) * 300, Math.cos(depth * 0.0004) * 160];
  }

  function drawGlow(vx, vy, heroVisibility) {
    const glow = ctx.createRadialGradient(vx, vy, 0, vx, vy, focalLength * 0.55);
    glow.addColorStop(0, `rgba(46,150,245,${0.28 * heroVisibility})`);
    glow.addColorStop(1, 'rgba(46,150,245,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);
  }

  function drawStars(vx, vy, step, time) {
    ctx.lineCap = 'round';
    for (const star of stars) {
      const previousZ = star.z;
      star.z -= step;
      if (star.z < NEAR_PLANE) {
        spawnParticle(star, true);
        continue;
      }
      const scale = focalLength / star.z;
      const x = vx + star.x * scale;
      const y = vy + star.y * scale;
      if (x < -60 || x > width + 60 || y < -60 || y > height + 60) {
        spawnParticle(star, true);
        continue;
      }
      const depth = 1 - star.z / FAR_PLANE;
      const size = Math.max(0.35, depth * 2.3);
      const twinkle = prefersReducedMotion ? 0.85 : 0.7 + 0.3 * Math.sin(star.twinkle + time * 0.002);
      ctx.globalAlpha = clamp(depth * 1.1) * twinkle;

      if (scrollBoost > 0.12) {
        const tailScale = focalLength / Math.min(FAR_PLANE, previousZ + step * 5);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = size;
        ctx.beginPath();
        ctx.moveTo(vx + star.x * tailScale, vy + star.y * tailScale);
        ctx.lineTo(x, y);
        ctx.stroke();
      } else {
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(x, y, size, 0, TAU);
        ctx.fill();
      }
    }
  }

  function drawCoordinateCrosses(vx, vy, step) {
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    for (const cross of crosses) {
      cross.z -= step * 0.6;
      if (cross.z < NEAR_PLANE * 20) {
        spawnParticle(cross, true);
        continue;
      }
      const scale = focalLength / cross.z;
      const x = vx + cross.x * scale;
      const y = vy + cross.y * scale;
      const arm = clamp(scale * 14, 3, 14);
      ctx.globalAlpha = 0.25 * clamp((1 - cross.z / FAR_PLANE) * 2);
      ctx.beginPath();
      ctx.moveTo(x - arm, y);
      ctx.lineTo(x + arm, y);
      ctx.moveTo(x, y - arm);
      ctx.lineTo(x, y + arm);
      ctx.stroke();
    }
  }

  function drawOrbitRings(vx, vy, step, time, heroVisibility) {
    const [cameraBendX, cameraBendY] = tunnelBend(distanceTravelled);
    rings.sort((a, b) => b.z - a.z);
    for (const ring of rings) {
      ring.z -= step;
      if (ring.z < 40) ring.z += FAR_PLANE;

      const [bendX, bendY] = tunnelBend(distanceTravelled + ring.z);
      const scale = focalLength / ring.z;
      const centerX = vx + (bendX - cameraBendX) * scale;
      const centerY = vy + (bendY - cameraBendY) * scale;
      const radius = RING_RADIUS * scale;
      const fadeIn = clamp((FAR_PLANE - ring.z) / 900);
      const fadeOut = clamp((ring.z - 40) / 260);
      const opacity = fadeIn * fadeOut * heroVisibility;
      if (opacity <= 0) continue;

      ctx.globalAlpha = 0.4 * opacity;
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = clamp(scale * 1.4, 0.6, 2.6);
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, TAU);
      ctx.stroke();

      const angle = ring.phase + (prefersReducedMotion ? 0 : time * 0.00045 * ring.direction);
      const satelliteSize = clamp(scale * 6, 1.4, 9);
      ctx.globalAlpha = opacity;
      ctx.fillStyle = ring.color;
      ctx.shadowColor = ring.color;
      ctx.shadowBlur = satelliteSize * 3;
      ctx.beginPath();
      ctx.arc(centerX + Math.cos(angle) * radius, centerY + Math.sin(angle) * radius, satelliteSize, 0, TAU);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  function render(time, still = false) {
    const elapsed = still ? 0 : Math.min(48, time - lastFrameTime);
    lastFrameTime = time;

    pointer.x += (pointer.targetX - pointer.x) * 0.04;
    pointer.y += (pointer.targetY - pointer.y) * 0.04;

    const scrollDelta = Math.abs(scrollY - lastScrollY);
    lastScrollY = scrollY;
    scrollBoost += (Math.min(scrollDelta * 0.045, 3) - scrollBoost) * (scrollDelta ? 0.2 : 0.05);

    const step = prefersReducedMotion || still ? 0 : (BASE_SPEED + scrollBoost) * elapsed;
    distanceTravelled += step;

    const heroVisibility = clamp(1 - scrollY / (height * 0.9));
    const [vx, vy] = vanishingPoint();

    ctx.clearRect(0, 0, width, height);
    if (heroVisibility > 0) drawGlow(vx, vy, heroVisibility);
    drawStars(vx, vy, step, time);
    drawCoordinateCrosses(vx, vy, step);
    if (heroVisibility > 0) drawOrbitRings(vx, vy, step, time, heroVisibility);
    ctx.globalAlpha = 1;
  }

  function loop(time) {
    if (!running) return;
    render(time);
    requestAnimationFrame(loop);
  }

  function start() {
    if (prefersReducedMotion || running || document.hidden) return;
    running = true;
    requestAnimationFrame((time) => {
      lastFrameTime = time;
      loop(time);
    });
  }

  addEventListener('resize', resize);
  document.addEventListener('visibilitychange', () => {
    running = false;
    start();
  });
  if (prefersReducedMotion) {
    addEventListener('scroll', () => render(lastFrameTime, true), { passive: true });
  }
  if (hasFinePointer && !prefersReducedMotion) {
    addEventListener(
      'pointermove',
      (event) => {
        pointer.targetX = event.clientX / innerWidth - 0.5;
        pointer.targetY = event.clientY / innerHeight - 0.5;
      },
      { passive: true },
    );
  }

  resize();
  start();
})();
