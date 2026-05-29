/**
 * Canvas fireworks — vivid contrast, sparkle accents, natural burst shapes.
 */
const CelebrationFireworks = (() => {
  const GOLDEN = Math.PI * (3 - Math.sqrt(5));

  const SCHEMES_FRIENDS = [
    {
      name: "pearl",
      core: [252, 252, 255],
      head: [218, 224, 242],
      tail: [72, 80, 108],
      glow: [195, 205, 228],
      accent: [248, 246, 255],
      rocket: [228, 232, 242],
    },
    {
      name: "champagne",
      core: [255, 252, 248],
      head: [228, 205, 158],
      tail: [98, 78, 52],
      glow: [210, 188, 145],
      accent: [255, 246, 228],
      rocket: [238, 228, 210],
    },
    {
      name: "twilight",
      core: [248, 250, 255],
      head: [148, 172, 218],
      tail: [42, 54, 88],
      glow: [118, 142, 192],
      accent: [198, 212, 242],
      rocket: [208, 216, 232],
    },
    {
      name: "blush",
      core: [255, 250, 252],
      head: [225, 178, 188],
      tail: [88, 62, 72],
      glow: [205, 165, 178],
      accent: [255, 238, 242],
      rocket: [238, 222, 228],
    },
  ];

  const SCHEMES_KUROMI = [
    {
      name: "deep-violet",
      core: [252, 250, 255],
      head: [170, 130, 220],
      tail: [55, 32, 95],
      glow: [130, 90, 185],
      accent: [210, 185, 245],
      rocket: [225, 215, 240],
    },
    {
      name: "plum",
      core: [255, 252, 255],
      head: [140, 95, 190],
      tail: [45, 25, 80],
      glow: [115, 75, 170],
      accent: [195, 170, 235],
      rocket: [215, 205, 235],
    },
    {
      name: "grape",
      core: [248, 246, 255],
      head: [120, 80, 175],
      tail: [38, 20, 68],
      glow: [100, 65, 155],
      accent: [180, 155, 225],
      rocket: [205, 198, 230],
    },
    {
      name: "lilac",
      core: [255, 255, 255],
      head: [185, 155, 225],
      tail: [65, 42, 100],
      glow: [155, 120, 200],
      accent: [225, 210, 248],
      rocket: [230, 222, 245],
    },
  ];

  let activeSchemes = SCHEMES_FRIENDS;
  let heartMode = false;
  let onBurst = null;

  const QUALITY = (() => {
    const mobile = /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent);
    const cores = navigator.hardwareConcurrency || 4;
    const memory = navigator.deviceMemory || 4;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduced) {
      return { dpr: 1, maxParticles: 400, maxSmoke: 5, shells: 58, glitter: 10, launchEvery: 0.72, doubleLaunch: 0.14, initialRockets: 3 };
    }
    if (mobile || cores <= 4 || memory < 4) {
      return { dpr: 1, maxParticles: 720, maxSmoke: 8, shells: 74, glitter: 14, launchEvery: 0.5, doubleLaunch: 0.22, initialRockets: 3 };
    }
    return {
      dpr: Math.min(window.devicePixelRatio || 1, 1.5),
      maxParticles: 1050,
      maxSmoke: 10,
      shells: 92,
      glitter: 18,
      launchEvery: 0.42,
      doubleLaunch: 0.3,
      initialRockets: 4,
    };
  })();

  let container = null;
  let canvas = null;
  let ctx = null;
  let running = false;
  let frameId = 0;
  let width = 0;
  let height = 0;
  let lastTime = 0;
  let launchTimer = 0;
  let slowFrames = 0;
  let sparklePhase = 0;
  let burstStartTime = 0;
  let launchCount = 0;
  let burstEnded = false;

  const BURST_DURATION_MS = 4200;
  const MAX_BURST_LAUNCHES = 7;

  const rockets = [];
  const particles = [];
  const smoke = [];
  const hearts = [];

  const HEART_COLORS = [
    "rgba(120, 85, 175, 0.9)",
    "rgba(95, 65, 150, 0.88)",
    "rgba(145, 115, 195, 0.9)",
    "rgba(69, 32, 112, 0.92)",
    "rgba(165, 140, 210, 0.9)",
  ];

  function pickScheme() {
    return activeSchemes[Math.floor(Math.random() * activeSchemes.length)];
  }

  function mixColor(from, to, amount, alpha = 1) {
    const t = Math.max(0, Math.min(1, amount));
    const r = Math.round(from[0] + (to[0] - from[0]) * t);
    const g = Math.round(from[1] + (to[1] - from[1]) * t);
    const b = Math.round(from[2] + (to[2] - from[2]) * t);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  function canAdd(count = 1) {
    return particles.length + count <= QUALITY.maxParticles;
  }

  function resize() {
    if (!container || !canvas) {
      return;
    }
    const rect = container.getBoundingClientRect();
    width = Math.max(1, Math.floor(rect.width) || window.innerWidth);
    height = Math.max(1, Math.floor(rect.height) || window.innerHeight);
    canvas.width = Math.floor(width * QUALITY.dpr);
    canvas.height = Math.floor(height * QUALITY.dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(QUALITY.dpr, 0, 0, QUALITY.dpr, 0, 0);
  }

  function spawnParticle(options) {
    if (!canAdd()) {
      return;
    }

    particles.push({
      x: options.x,
      y: options.y,
      vx: options.vx,
      vy: options.vy,
      life: options.life,
      maxLife: options.life,
      size: options.size,
      scheme: options.scheme,
      drag: options.drag ?? 0.988,
      gravity: options.gravity ?? 0.038,
      prevX: options.x,
      prevY: options.y,
      taper: options.taper ?? 1,
      kind: options.kind ?? "spark",
      sparkle: options.sparkle ?? false,
      phase: Math.random() * Math.PI * 2,
    });
  }

  function addSmoke(x, y, radius) {
    if (smoke.length >= QUALITY.maxSmoke) {
      smoke.shift();
    }
    smoke.push({
      x,
      y,
      radius,
      alpha: 0.12 + Math.random() * 0.06,
      grow: 0.26 + Math.random() * 0.16,
      drift: (Math.random() - 0.5) * 0.1,
    });
  }

  function shellFlash(x, y, scheme) {
    for (let index = 0; index < 10; index += 1) {
      if (!canAdd()) {
        break;
      }
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.8 + Math.random() * 2.2;
      spawnParticle({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.14 + Math.random() * 0.1,
        size: 3 + Math.random() * 2.5,
        scheme,
        drag: 0.88,
        kind: "flash",
        sparkle: true,
      });
    }
  }

  function drawHeartShape(x, y, size, rotation, alpha, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    const scale = size;
    ctx.beginPath();
    ctx.moveTo(0, scale * 0.25);
    ctx.bezierCurveTo(0, -scale * 0.35, -scale * 0.55, -scale * 0.35, -scale * 0.55, scale * 0.05);
    ctx.bezierCurveTo(-scale * 0.55, scale * 0.45, 0, scale * 0.75, 0, scale);
    ctx.bezierCurveTo(0, scale * 0.75, scale * 0.55, scale * 0.45, scale * 0.55, scale * 0.05);
    ctx.bezierCurveTo(scale * 0.55, -scale * 0.35, 0, -scale * 0.35, 0, scale * 0.25);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function spawnHeart(x, y, vx, vy, size, life) {
    if (hearts.length > 80) {
      hearts.shift();
    }

    hearts.push({
      x,
      y,
      vx,
      vy,
      size,
      life,
      maxLife: life,
      rotation: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.12,
      color: HEART_COLORS[Math.floor(Math.random() * HEART_COLORS.length)],
    });
  }

  function burstHearts(x, y, power = 1) {
    const count = Math.floor((10 + QUALITY.glitter * 0.6) * power);

    for (let index = 0; index < count; index += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.2 + Math.random() * 3.8 * power;
      spawnHeart(
        x + (Math.random() - 0.5) * 8,
        y + (Math.random() - 0.5) * 8,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        3 + Math.random() * 5 * power,
        0.9 + Math.random() * 1.1
      );
    }
  }

  function burstGlitter(x, y, scheme, power = 1) {
    if (heartMode) {
      burstHearts(x, y, power);
    }

    const count = Math.floor(QUALITY.glitter * power * (heartMode ? 0.45 : 1));

    for (let index = 0; index < count; index += 1) {
      if (!canAdd()) {
        break;
      }

      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 4.5 * power;

      spawnParticle({
        x: x + (Math.random() - 0.5) * 6,
        y: y + (Math.random() - 0.5) * 6,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.35 + Math.random() * 0.45,
        size: 0.5 + Math.random() * 1.2,
        scheme,
        drag: 0.94,
        kind: "glitter",
        sparkle: true,
      });
    }
  }

  function burstPeony(x, y, scheme, power = 1) {
    const count = Math.floor(QUALITY.shells * power);
    const baseSpeed = (4.2 + Math.random() * 2) * power;
    let angle = Math.random() * Math.PI * 2;

    shellFlash(x, y, scheme);
    burstGlitter(x, y, scheme, power);

    for (let index = 0; index < count; index += 1) {
      if (!canAdd(6)) {
        break;
      }

      angle += GOLDEN + (Math.random() - 0.5) * 0.12;
      const distBias = Math.pow(Math.random(), 0.5);
      const speed = baseSpeed * (0.5 + distBias * 0.5);
      const isSparkle = Math.random() < 0.1;

      spawnParticle({
        x: x + (Math.random() - 0.5) * 4,
        y: y + (Math.random() - 0.5) * 4,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.3 + distBias * 1.5 + Math.random() * 0.5,
        size: (isSparkle ? 1.4 : 0.8) + distBias * 1.8,
        scheme,
        drag: 0.981 + Math.random() * 0.01,
        gravity: 0.034 + Math.random() * 0.01,
        taper: 0.55 + distBias * 0.45,
        sparkle: isSparkle,
        kind: "spark",
      });
    }
  }

  function burstWillow(x, y, scheme, power = 1) {
    const count = Math.floor(QUALITY.shells * 0.58 * power);
    const baseSpeed = (3.5 + Math.random() * 1.4) * power;

    shellFlash(x, y, scheme);
    burstGlitter(x, y, scheme, power * 0.7);

    for (let index = 0; index < count; index += 1) {
      if (!canAdd()) {
        break;
      }

      const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.9;
      const speed = baseSpeed * (0.55 + Math.random() * 0.45);

      spawnParticle({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed * 0.88,
        life: 2.4 + Math.random() * 1.3,
        size: 0.7 + Math.random() * 1.1,
        scheme,
        drag: 0.97 + Math.random() * 0.008,
        gravity: 0.05 + Math.random() * 0.012,
        taper: 0.4,
        sparkle: Math.random() < 0.06,
        kind: "willow",
      });
    }
  }

  function burstChrysanthemum(x, y, scheme, power = 1) {
    burstPeony(x, y, scheme, power * 0.7);

    window.setTimeout(() => {
      if (!running || !canAdd(30)) {
        return;
      }
      shellFlash(x, y, scheme);
      const inner = Math.floor(QUALITY.shells * 0.4 * power);
      const baseSpeed = 2.8 * power;
      let angle = Math.random() * Math.PI * 2;

      for (let index = 0; index < inner; index += 1) {
        if (!canAdd()) {
          break;
        }
        angle += GOLDEN;
        const speed = baseSpeed * (0.65 + Math.random() * 0.35);
        spawnParticle({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1 + Math.random() * 0.7,
          size: 1 + Math.random() * 1.2,
          scheme,
          drag: 0.984,
          sparkle: Math.random() < 0.14,
          kind: "spark",
        });
      }
      burstGlitter(x, y, scheme, power * 0.6);
    }, 60 + Math.random() * 40);
  }

  function notifyBurst(x, y, burstType) {
    if (!onBurst || !width || !height) {
      return;
    }

    onBurst({
      x,
      y,
      w: width,
      h: height,
      burstType,
    });
  }

  function explode(x, y, scheme) {
    const roll = Math.random();
    addSmoke(x, y, 20 + Math.random() * 28);

    if (heartMode) {
      burstHearts(x, y, 1.1);
    }

    let burstType = "chrysanthemum";

    if (roll < 0.34) {
      burstType = "willow";
      burstWillow(x, y, scheme);
    } else if (roll < 0.68) {
      burstType = "peony";
      burstPeony(x, y, scheme);
    } else {
      burstChrysanthemum(x, y, scheme);
    }

    notifyBurst(x, y, burstType);

    if (Math.random() < 0.24 && canAdd(50)) {
      window.setTimeout(() => {
        if (!running) {
          return;
        }
        burstPeony(
          x + (Math.random() - 0.5) * 40,
          y + 10 + Math.random() * 28,
          scheme,
          0.5
        );
      }, 170 + Math.random() * 160);
    }
  }

  function launchRocket() {
    if (!canAdd(12) || burstEnded) {
      return;
    }

    launchCount += 1;
    const scheme = pickScheme();
    const rocket = {
      x: width * (0.08 + Math.random() * 0.84),
      y: height + 6,
      vx: (Math.random() - 0.5) * 0.4,
      vy: -(7.2 + Math.random() * 3),
      targetY: height * (0.12 + Math.random() * 0.38),
      scheme,
      trail: [],
    };

    rockets.push(rocket);

    if (Math.random() < 0.4) {
      notifyBurst(rocket.x, height - 8, "launch");
    }
  }

  function updateRockets(dt) {
    for (let index = rockets.length - 1; index >= 0; index -= 1) {
      const rocket = rockets[index];
      rocket.trail.push({ x: rocket.x, y: rocket.y });
      if (rocket.trail.length > 12) {
        rocket.trail.shift();
      }

      rocket.x += rocket.vx;
      rocket.y += rocket.vy;
      rocket.vy += 0.04 * (dt * 60);

      if (rocket.vy >= -0.28 || rocket.y <= rocket.targetY) {
        explode(rocket.x, rocket.y, rocket.scheme);
        rockets.splice(index, 1);
      }
    }
  }

  function updateParticles(dt) {
    for (let index = particles.length - 1; index >= 0; index -= 1) {
      const particle = particles[index];
      particle.prevX = particle.x;
      particle.prevY = particle.y;
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vx *= particle.drag;
      particle.vy *= particle.drag;
      particle.vy += particle.gravity;
      particle.life -= dt;

      if (particle.life <= 0) {
        particles.splice(index, 1);
      }
    }
  }

  function updateHearts(dt) {
    for (let index = hearts.length - 1; index >= 0; index -= 1) {
      const heart = hearts[index];
      heart.x += heart.vx;
      heart.y += heart.vy;
      heart.vx *= 0.985;
      heart.vy *= 0.985;
      heart.vy += 0.028;
      heart.rotation += heart.spin;
      heart.life -= dt;

      if (heart.life <= 0) {
        hearts.splice(index, 1);
      }
    }
  }

  function updateSmoke(dt) {
    for (let index = smoke.length - 1; index >= 0; index -= 1) {
      const puff = smoke[index];
      puff.radius += puff.grow * 40 * dt;
      puff.x += puff.drift * 22 * dt;
      puff.y += 0.05 * 22 * dt;
      puff.alpha -= dt * 0.04;
      if (puff.alpha <= 0) {
        smoke.splice(index, 1);
      }
    }
  }

  function drawParticle(particle) {
    const lifeRatio = particle.life / particle.maxLife;
    const fadeIn = Math.min(1, (1 - lifeRatio) * 5);
    const fadeOut = Math.pow(lifeRatio, particle.kind === "willow" ? 0.55 : 0.95);
    let alpha = Math.min(1, fadeIn * fadeOut);

    if (alpha < 0.02) {
      return;
    }

    if (particle.sparkle || particle.kind === "glitter" || particle.kind === "flash") {
      const twinkle = 0.88 + 0.12 * Math.sin(sparklePhase * 5 + particle.phase);
      alpha = Math.min(1, alpha * twinkle * 1.05);
    }

    const speed = Math.hypot(particle.vx, particle.vy);
    const scheme = particle.scheme;
    const isHot = particle.kind === "flash" || particle.kind === "glitter" || particle.sparkle;

    let headColor;
    let tailColor;
    let glowColor;

    if (isHot && lifeRatio > 0.5) {
      headColor = mixColor(scheme.core, scheme.accent, 0.2, alpha);
      tailColor = mixColor(scheme.accent, scheme.head, 0.4, alpha * 0.75);
      glowColor = mixColor(scheme.core, scheme.glow, 0.15, alpha * 0.55);
    } else if (lifeRatio > 0.65) {
      headColor = mixColor(scheme.core, scheme.head, 0.2, alpha);
      tailColor = mixColor(scheme.head, scheme.tail, 0.35, alpha * 0.8);
      glowColor = mixColor(scheme.glow, scheme.head, 0.2, alpha * 0.5);
    } else {
      headColor = mixColor(scheme.head, scheme.accent, 0.15, alpha * 0.95);
      tailColor = mixColor(scheme.head, scheme.tail, 0.5, alpha * 0.55);
      glowColor = mixColor(scheme.glow, scheme.tail, 0.3, alpha * 0.38);
    }

    const trailLen = Math.hypot(particle.x - particle.prevX, particle.y - particle.prevY);

    if (trailLen > 0.35) {
      const lineWidth = particle.size * particle.taper * (0.55 + Math.min(1.4, speed * 0.18));
      ctx.beginPath();
      ctx.moveTo(particle.prevX, particle.prevY);
      ctx.lineTo(particle.x, particle.y);
      ctx.strokeStyle = tailColor;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = "round";
      ctx.stroke();
    }

    const glowSize = particle.size * (1.85 + speed * 0.1);
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, glowSize, 0, Math.PI * 2);
    ctx.fillStyle = glowColor;
    ctx.fill();

    if (isHot && lifeRatio > 0.4) {
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size * 0.42, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(1, alpha * 0.9)})`;
      ctx.fill();
    }

    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fillStyle = headColor;
    ctx.fill();
  }

  function drawRocketTrail(rocket) {
    const points = rocket.trail;
    if (points.length < 2) {
      return;
    }

    const scheme = rocket.scheme;
    ctx.lineCap = "round";
    ctx.globalCompositeOperation = "lighter";

    for (let index = 1; index < points.length; index += 1) {
      const from = points[index - 1];
      const to = points[index];
      const t = index / points.length;
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.strokeStyle = mixColor(scheme.rocket, scheme.head, t * 0.6, 0.25 + t * 0.5);
      ctx.lineWidth = 1.4 + t * 1.2;
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.arc(rocket.x, rocket.y, 2.4, 0, Math.PI * 2);
    ctx.fillStyle = mixColor(scheme.core, scheme.accent, 0.1, 1);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(rocket.x, rocket.y, 1.2, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
    ctx.fill();
  }

  function trimIfHeavy() {
    if (particles.length > QUALITY.maxParticles) {
      particles.splice(0, particles.length - QUALITY.maxParticles);
    }
  }

  function frame(timestamp) {
    if (!running) {
      return;
    }

    const dt = Math.min(0.05, (timestamp - lastTime) / 1000 || 0.016);
    lastTime = timestamp;
    sparklePhase += dt;

    if (dt > 0.03) {
      slowFrames += 1;
    } else if (slowFrames > 0) {
      slowFrames -= 1;
    }

    launchTimer += dt * (slowFrames > 10 ? 0.55 : 1);

    if (!burstEnded && heartMode && Math.random() < 0.04) {
      spawnHeart(
        Math.random() * width,
        height * (0.15 + Math.random() * 0.5),
        (Math.random() - 0.5) * 0.8,
        0.5 + Math.random() * 1.2,
        3 + Math.random() * 4,
        2 + Math.random() * 1.5
      );
    }

    if (!burstEnded) {
      const burstElapsed = performance.now() - burstStartTime;
      if (launchCount >= MAX_BURST_LAUNCHES || burstElapsed >= BURST_DURATION_MS) {
        burstEnded = true;
      }
    }

    if (!burstEnded && launchTimer > QUALITY.launchEvery) {
      launchTimer = 0;
      launchRocket();
      if (Math.random() < QUALITY.doubleLaunch) {
        window.setTimeout(() => {
          if (running && !burstEnded) {
            launchRocket();
          }
        }, 100 + Math.random() * 180);
      }
    }

    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = heartMode ? "rgba(18, 8, 28, 0.2)" : "rgba(2, 4, 12, 0.22)";
    ctx.fillRect(0, 0, width, height);

    updateRockets(dt);
    updateParticles(dt);
    updateHearts(dt);
    updateSmoke(dt);
    trimIfHeavy();

    ctx.globalCompositeOperation = "lighter";

    for (const heart of hearts) {
      const lifeRatio = heart.life / heart.maxLife;
      const alpha = Math.min(1, lifeRatio * 1.1);
      drawHeartShape(heart.x, heart.y, heart.size, heart.rotation, alpha, heart.color);
    }

    for (const puff of smoke) {
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = `rgba(70, 65, 95, ${puff.alpha * 0.28})`;
      ctx.beginPath();
      ctx.arc(puff.x, puff.y, puff.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = "lighter";
    }

    for (const particle of particles) {
      drawParticle(particle);
    }

    ctx.globalCompositeOperation = "lighter";
    for (const rocket of rockets) {
      drawRocketTrail(rocket);
    }

    if (
      burstEnded &&
      rockets.length === 0 &&
      particles.length === 0 &&
      hearts.length === 0 &&
      smoke.length === 0
    ) {
      running = false;
      if (frameId) {
        cancelAnimationFrame(frameId);
        frameId = 0;
      }
      return;
    }

    frameId = requestAnimationFrame(frame);
  }

  function start(target, theme = "friends") {
    stop();
    heartMode = theme === "kuromi";
    activeSchemes = heartMode ? SCHEMES_KUROMI : SCHEMES_FRIENDS;
    container = target;
    if (!container) {
      return;
    }

    canvas = document.createElement("canvas");
    canvas.className = "fw-canvas";
    canvas.setAttribute("aria-hidden", "true");
    container.append(canvas);
    ctx = canvas.getContext("2d", { alpha: true, desynchronized: true });

    running = true;
    lastTime = 0;
    launchTimer = 0.08;
    slowFrames = 0;
    sparklePhase = 0;
    burstStartTime = performance.now();
    launchCount = 0;
    burstEnded = false;
    window.addEventListener("resize", resize);

    const boot = () => {
      resize();
      if (width < 8 || height < 8) {
        requestAnimationFrame(boot);
        return;
      }
      const initialBurst = Math.min(QUALITY.initialRockets, MAX_BURST_LAUNCHES);
      for (let index = 0; index < initialBurst; index += 1) {
        window.setTimeout(() => {
          if (running && !burstEnded) {
            launchRocket();
          }
        }, index * 280);
      }
      frameId = requestAnimationFrame(frame);
    };

    requestAnimationFrame(boot);
  }

  function stop() {
    running = false;
    window.removeEventListener("resize", resize);
    if (frameId) {
      cancelAnimationFrame(frameId);
      frameId = 0;
    }
    rockets.length = 0;
    particles.length = 0;
    smoke.length = 0;
    hearts.length = 0;
    heartMode = false;
    burstEnded = false;
    launchCount = 0;
    burstStartTime = 0;
    onBurst = null;
    if (container) {
      container.innerHTML = "";
    }
    container = null;
    canvas = null;
    ctx = null;
  }

  function setOnBurst(handler) {
    onBurst = typeof handler === "function" ? handler : null;
  }

  return { start, stop, setOnBurst };
})();
