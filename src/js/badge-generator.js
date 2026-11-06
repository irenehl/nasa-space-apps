'use strict';

(() => {
  const $ = (id) => document.getElementById(id);
  const canvas = $('badge');
  const ctx = canvas.getContext('2d');
  const config = window.SPACEAPPS_CONFIG || {};
  const city = config.city || 'San Salvador';
  const TAU = Math.PI * 2;
  const WIDTH = 1080;
  const MARGIN = 64;
  const RIGHT_EDGE = WIDTH - MARGIN;
  const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
  const MAX_UPLOAD_PIXELS = 40_000_000;
  const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

  const theme = {
    background: '#07173F',
    foreground: '#FFFFFF',
    secondary: '#2E96F5',
    accent: '#EAFE07',
    line: 'rgba(255,255,255,.22)',
    photoHole: '#0B2560',
    placeholder: '#0960E1',
    chip: 'rgba(255,255,255,.1)',
    mutedText: 'rgba(255,255,255,.7)',
    localDot: '#E43700',
  };

  const sponsors = [
    { src: 'assets/partners/ai-labs.svg' },
    { src: 'assets/partners/cognition.png' },
    { src: 'assets/partners/ieee.png' },
    { src: 'assets/partners/svnet.png' },
  ];

  const state = { format: 'post', photo: null, zoom: 1, position: 0.5 };
  let spaceAppsLogo = null;
  let uploadVersion = 0;

  const loadImage = (src) =>
    new Promise((resolve) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => resolve(null);
      image.src = src;
    });

  function measureInk(image) {
    const width = image.naturalWidth;
    const height = image.naturalHeight;
    const scratch = document.createElement('canvas');
    scratch.width = width;
    scratch.height = height;
    const scratchCtx = scratch.getContext('2d');
    scratchCtx.drawImage(image, 0, 0, width, height);
    const { data } = scratchCtx.getImageData(0, 0, width, height);

    let left = width;
    let top = height;
    let right = -1;
    let bottom = -1;
    let ink = 0;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const alpha = data[(y * width + x) * 4 + 3];
        if (alpha <= 24) continue;
        ink += alpha / 255;
        left = Math.min(left, x);
        right = Math.max(right, x);
        top = Math.min(top, y);
        bottom = Math.max(bottom, y);
      }
    }
    if (right < 0) return { sx: 0, sy: 0, sw: width, sh: height, density: 1 };
    const sw = right - left + 1;
    const sh = bottom - top + 1;
    return { sx: left, sy: top, sw, sh, density: ink / (sw * sh) };
  }

  const assetsReady = Promise.all([
    loadImage('assets/brand/space-apps-logo-white.svg').then((image) => {
      spaceAppsLogo = image;
    }),
    ...sponsors.map((sponsor) =>
      loadImage(sponsor.src).then((image) => {
        sponsor.image = image;
        if (image) sponsor.ink = measureInk(image);
      }),
    ),
    ...['900 40px "Fira Sans"', '700 40px "Fira Sans"', '400 40px "Overpass"', '700 40px "Overpass"'].map((font) =>
      document.fonts.load(font),
    ),
  ]);

  function withLetterSpacing(spacing, callback) {
    const supported = 'letterSpacing' in ctx;
    if (supported) ctx.letterSpacing = `${spacing}px`;
    const result = callback();
    if (supported) ctx.letterSpacing = '0px';
    return result;
  }

  function drawText(
    value,
    x,
    y,
    { size, font = 'Overpass', weight = 400, color, maxWidth = 952, align = 'left', spacing = 0 },
  ) {
    ctx.fillStyle = color;
    ctx.textAlign = align;
    withLetterSpacing(spacing, () => {
      let fontSize = size;
      do {
        ctx.font = `${weight} ${fontSize}px "${font}"`;
        if (ctx.measureText(value).width <= maxWidth) break;
        fontSize -= 1;
      } while (fontSize > 14);
      ctx.fillText(value, x, y);
    });
    ctx.textAlign = 'left';
  }

  function seededRandom(seed) {
    let value = seed;
    return () => (value = (value * 16807) % 2147483647) / 2147483647;
  }

  function drawPattern(height) {
    const random = seededRandom(7);
    ctx.strokeStyle = theme.line;
    ctx.lineWidth = 2;
    const crossCount = height > WIDTH ? 16 : 10;
    for (let i = 0; i < crossCount; i++) {
      const x = 40 + random() * 1000;
      const y = 260 + random() * (height - 500);
      const arm = 9 + random() * 7;
      ctx.beginPath();
      ctx.moveTo(x - arm, y);
      ctx.lineTo(x + arm, y);
      ctx.moveTo(x, y - arm);
      ctx.lineTo(x, y + arm);
      ctx.stroke();
    }
    ctx.lineWidth = 1.5;
    for (const radius of [260, 420, 600]) {
      ctx.beginPath();
      ctx.arc(WIDTH + 40, -60, radius, 0, TAU);
      ctx.stroke();
    }
  }

  function drawSatellite(cx, cy, orbitRadius, angle, size, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(cx + Math.cos(angle) * orbitRadius, cy + Math.sin(angle) * orbitRadius, size, 0, TAU);
    ctx.fill();
  }

  function drawPortrait(cx, cy, radius) {
    ctx.strokeStyle = theme.line;
    ctx.lineWidth = 2;
    for (const factor of [1.3, 1.64]) {
      ctx.beginPath();
      ctx.arc(cx, cy, radius * factor, 0, TAU);
      ctx.stroke();
    }
    drawSatellite(cx, cy, radius * 1.3, -2.5, 11, theme.accent);
    drawSatellite(cx, cy, radius * 1.64, 0.55, 7, theme.foreground);

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, TAU);
    ctx.clip();
    ctx.fillStyle = theme.photoHole;
    ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
    if (state.photo) {
      const { photo } = state;
      const scale = Math.max((radius * 2) / photo.width, (radius * 2) / photo.height) * state.zoom;
      const width = photo.width * scale;
      const height = photo.height * scale;
      ctx.drawImage(photo, cx - width / 2, cy - radius - (height - radius * 2) * state.position, width, height);
    } else {
      ctx.fillStyle = theme.placeholder;
      ctx.beginPath();
      ctx.arc(cx, cy - radius * 0.2, radius * 0.3, 0, TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(cx, cy + radius * 0.78, radius * 0.68, radius * 0.62, 0, 0, TAU);
      ctx.fill();
    }
    ctx.restore();

    ctx.strokeStyle = theme.accent;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(cx, cy, radius + 14, 0, TAU);
    ctx.stroke();
  }

  function drawChipIcon(kind, x, y) {
    ctx.strokeStyle = theme.foreground;
    ctx.lineWidth = 2.6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    if (kind === 'date') {
      ctx.roundRect(x, y + 3, 26, 24, 3);
      ctx.moveTo(x, y + 11);
      ctx.lineTo(x + 26, y + 11);
      ctx.moveTo(x + 7, y);
      ctx.lineTo(x + 7, y + 6);
      ctx.moveTo(x + 19, y);
      ctx.lineTo(x + 19, y + 6);
    } else {
      ctx.arc(x + 13, y + 14, 13, 0, TAU);
      ctx.moveTo(x, y + 14);
      ctx.lineTo(x + 26, y + 14);
      ctx.ellipse(x + 13, y + 14, 6, 13, 0, 0, TAU);
    }
    ctx.stroke();
  }

  function drawChips(x, y) {
    const chips = [
      ['date', config.dates],
      ['mode', config.mode],
    ];
    let cursor = x;
    for (const [kind, label] of chips) {
      if (!label) continue;
      ctx.font = '700 28px "Overpass"';
      const chipWidth = ctx.measureText(label).width + 92;
      ctx.fillStyle = theme.chip;
      ctx.beginPath();
      ctx.roundRect(cursor, y, chipWidth, 62, 31);
      ctx.fill();
      drawChipIcon(kind, cursor + 24, y + 16);
      drawText(label, cursor + 64, y + 42, { size: 28, weight: 700, color: theme.foreground });
      cursor += chipWidth + 14;
    }
  }

  function sponsorLayout(rowHeight) {
    const loaded = sponsors.filter((sponsor) => sponsor.image && sponsor.ink);
    const meanDensity = loaded.reduce((sum, sponsor) => sum + sponsor.ink.density, 0) / (loaded.length || 1);
    const targetArea = rowHeight * 4.2 * rowHeight;
    return loaded.map(({ image, ink }) => {
      const ratio = ink.sw / ink.sh;
      const height = Math.min(
        rowHeight * 1.15,
        Math.sqrt(targetArea / ratio) * Math.pow(meanDensity / ink.density, 0.3),
      );
      return { image, ...ink, width: height * ratio, height };
    });
  }

  function drawPoweredBy(centerY, rowHeight) {
    const dividerY = centerY - rowHeight - 14;
    ctx.strokeStyle = theme.line;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(MARGIN, dividerY);
    ctx.lineTo(RIGHT_EDGE, dividerY);
    ctx.stroke();

    const label = 'POWERED BY';
    ctx.font = '700 18px "Overpass"';
    const labelWidth = withLetterSpacing(3, () => ctx.measureText(label).width);
    drawText(label, MARGIN, centerY + 6, { size: 18, weight: 700, color: theme.mutedText, spacing: 3 });

    const gap = 44;
    const logos = sponsorLayout(rowHeight);
    const totalWidth = logos.reduce((sum, logo) => sum + logo.width, 0) + gap * (logos.length - 1);
    const available = RIGHT_EDGE - (MARGIN + labelWidth + gap);
    const fit = Math.min(1, available / totalWidth);
    let x = RIGHT_EDGE - totalWidth * fit;
    for (const logo of logos) {
      const width = logo.width * fit;
      const height = logo.height * fit;
      ctx.drawImage(logo.image, logo.sx, logo.sy, logo.sw, logo.sh, x, centerY - height / 2, width, height);
      x += width + gap * fit;
    }
  }

  function drawHeader(top) {
    if (spaceAppsLogo) {
      const logoWidth = 280;
      const logoHeight = (logoWidth * 221) / 561;
      const localX = MARGIN + logoWidth * 0.41;
      ctx.drawImage(spaceAppsLogo, MARGIN, top, logoWidth, logoHeight);
      ctx.fillStyle = theme.localDot;
      ctx.beginPath();
      ctx.arc(localX + 7, top + logoHeight + 22, 7, 0, TAU);
      ctx.fill();
      drawText(city.toUpperCase(), localX + 22, top + logoHeight + 30, {
        size: 21,
        weight: 700,
        color: theme.foreground,
        spacing: 1.5,
      });
    }
    drawText('#SpaceApps', RIGHT_EDGE, top + 34, { size: 28, weight: 700, color: theme.foreground, align: 'right' });
    drawText('#SpaceAppsSanSalvador', RIGHT_EDGE, top + 72, {
      size: 28,
      weight: 700,
      color: theme.secondary,
      align: 'right',
    });
  }

  function draw() {
    const isStory = state.format === 'story';
    const height = isStory ? 1920 : 1080;
    canvas.height = height;
    canvas.classList.toggle('story', isStory);

    ctx.fillStyle = theme.background;
    ctx.fillRect(0, 0, WIDTH, height);
    drawPattern(height);
    drawHeader(isStory ? 170 : 56);

    const titleY = isStory ? 500 : 270;
    const titleSize = isStory ? 106 : 88;
    const lineHeight = isStory ? 112 : 92;
    drawText('Participo en', MARGIN, titleY, { size: isStory ? 48 : 40, color: theme.accent });
    drawText('NASA Space Apps', MARGIN, titleY + lineHeight, {
      size: titleSize,
      font: 'Fira Sans',
      weight: 900,
      color: theme.foreground,
    });
    drawText(city, MARGIN, titleY + lineHeight * 2, {
      size: titleSize,
      font: 'Fira Sans',
      weight: 900,
      color: theme.secondary,
    });

    if (isStory) drawPortrait(540, 1000, 240);
    else drawPortrait(836, 604, 140);

    const name = $('name').value.trim() || 'Tu nombre';
    const role = $('role').value.trim();
    const nameY = isStory ? 1440 : 772;
    const textWidth = isStory ? 952 : 600;
    drawText(name, MARGIN, nameY, {
      size: isStory ? 82 : 60,
      font: 'Fira Sans',
      weight: 700,
      color: theme.foreground,
      maxWidth: textWidth,
    });
    if (role) {
      drawText(role, MARGIN + 2, nameY + (isStory ? 56 : 46), {
        size: isStory ? 36 : 28,
        color: theme.foreground,
        maxWidth: textWidth,
      });
    }
    drawChips(MARGIN, isStory ? 1530 : 846);
    drawPoweredBy(isStory ? 1690 : 1004, isStory ? 48 : 40);

    $('dimensions').textContent = `${WIDTH} × ${height} px`;
    canvas.setAttribute(
      'aria-label',
      `Badge de ${name} para NASA Space Apps ${city}, formato ${isStory ? 'story' : 'post'}`,
    );
  }

  function replayAnimation(element, className) {
    element.classList.remove(className);
    void element.offsetWidth;
    element.classList.add(className);
  }

  function setMessage(text) {
    $('message').textContent = text;
  }

  function slugify(value) {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/gi, '-')
      .toLowerCase()
      .replace(/^-|-$/g, '');
  }

  function resetPhotoControls() {
    $('photo').value = '';
    $('photo-controls').hidden = true;
    $('upload-label').textContent = 'Elegí o arrastrá una foto';
  }

  async function handlePhotoChange(event) {
    const [file] = event.target.files;
    if (!file) return;
    const version = ++uploadVersion;
    if (!ACCEPTED_TYPES.includes(file.type) || file.size > MAX_UPLOAD_BYTES) {
      setMessage('Elegí una imagen JPG, PNG o WebP de hasta 8 MB.');
      event.target.value = '';
      return;
    }
    const url = URL.createObjectURL(file);
    const image = new Image();
    try {
      image.src = url;
      await image.decode();
      if (version !== uploadVersion) return;
      if (image.width * image.height > MAX_UPLOAD_PIXELS) throw new Error('Image too large');
      Object.assign(state, { photo: image, zoom: 1, position: 0.5 });
      $('zoom').value = '1';
      $('position').value = '50';
      $('photo-controls').hidden = false;
      $('upload-label').textContent = 'Cambiar foto';
      setMessage('');
      draw();
      replayAnimation(canvas, 'swap');
    } catch {
      setMessage('No pudimos abrir esa foto. Probá con otra imagen de menor tamaño.');
      event.target.value = '';
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  async function handleDownload() {
    const name = $('name').value.trim();
    if (!name) {
      setMessage('Agregá tu nombre para descargar tu badge.');
      $('name').focus();
      return;
    }
    const button = $('download');
    button.disabled = true;
    setMessage('Generando imagen...');
    try {
      await assetsReady;
      draw();
      const blob = await new Promise((resolve, reject) =>
        canvas.toBlob((result) => (result ? resolve(result) : reject(new Error('Export failed'))), 'image/png'),
      );
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `spaceapps-sansalvador-${slugify(name) || 'badge'}-${state.format}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
      replayAnimation($('stage'), 'launch');
      setMessage('Listo, se descargó tu badge. Compartilo con #SpaceAppsSanSalvador.');
    } catch {
      setMessage('No pudimos generar la imagen. Volvé a intentar.');
    } finally {
      button.disabled = false;
    }
  }

  if (config.dates) $('chip-date').textContent = config.dates;
  if (config.mode) $('chip-mode').textContent = config.mode;

  for (const id of ['name', 'role']) {
    $(id).addEventListener('input', () => {
      setMessage('');
      draw();
    });
  }
  $('badge-form').addEventListener('submit', (event) => event.preventDefault());

  const formatButtons = document.querySelectorAll('[data-format]');
  formatButtons.forEach((button) =>
    button.addEventListener('click', () => {
      state.format = button.dataset.format;
      formatButtons.forEach((other) => other.setAttribute('aria-pressed', String(other === button)));
      draw();
      replayAnimation(canvas, 'swap');
    }),
  );

  $('photo').addEventListener('change', handlePhotoChange);
  $('zoom').addEventListener('input', (event) => {
    state.zoom = Number(event.target.value);
    draw();
  });
  $('position').addEventListener('input', (event) => {
    state.position = Number(event.target.value) / 100;
    draw();
  });
  $('remove-photo').addEventListener('click', () => {
    uploadVersion++;
    state.photo = null;
    resetPhotoControls();
    draw();
  });
  $('download').addEventListener('click', handleDownload);

  draw();
  assetsReady.then(draw);
})();
