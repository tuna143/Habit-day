const HabitSnapBadges = (() => {
  const THEMED = new Set(["friends", "kuromi", "gintama", "toothless"]);

  const TOOTHLESS_FLOWER_SVG =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 28' fill='none'%3E%3Cpath d='M12 24V11' stroke='%239bc94a' stroke-width='1.6' stroke-linecap='round'/%3E%3Cellipse cx='12' cy='8.2' rx='2.4' ry='3.4' fill='%23e8dcfa'/%3E%3Cellipse cx='8.6' cy='10.4' rx='2.1' ry='3' fill='%23cfc0ee'/%3E%3Cellipse cx='15.4' cy='10.4' rx='2.1' ry='3' fill='%23cfc0ee'/%3E%3Cellipse cx='10.2' cy='12.8' rx='1.9' ry='2.7' fill='%23b8a4e4'/%3E%3Cellipse cx='13.8' cy='12.8' rx='1.9' ry='2.7' fill='%23b8a4e4'/%3E%3Ccircle cx='12' cy='6.6' r='1.1' fill='%23f4f0fc'/%3E%3C/svg%3E";

  const MARKS = {
    friends: { type: "emoji", value: "🥕" },
    kuromi: { type: "emoji", value: "♥" },
    gintama: { type: "emoji", value: "🍓" },
    toothless: { type: "svg", src: TOOTHLESS_FLOWER_SVG, aspect: 28 / 24 },
  };

  /** Even spread — matches camera overlay positions */
  const PLACEMENTS = [
    { x: 0.2, y: 0.24, rot: -14, scale: 1 },
    { x: 0.76, y: 0.3, rot: 11, scale: 0.92 },
    { x: 0.28, y: 0.72, rot: -8, scale: 0.98 },
    { x: 0.7, y: 0.68, rot: 10, scale: 0.88 },
  ];

  let flowerImagePromise = null;

  function getTheme() {
    return document.documentElement.dataset.theme || "original";
  }

  function isThemed(theme) {
    return THEMED.has(theme || getTheme());
  }

  function loadFlowerImage() {
    if (!flowerImagePromise) {
      flowerImagePromise = new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = TOOTHLESS_FLOWER_SVG;
      });
    }

    return flowerImagePromise;
  }

  async function drawBadges(ctx, width, height, theme) {
    if (!isThemed(theme)) {
      return;
    }

    const mark = MARKS[theme];

    if (!mark) {
      return;
    }

    const baseSize = Math.min(width, height) * 0.1;
    const flowerImage = mark.type === "svg" ? await loadFlowerImage() : null;

    PLACEMENTS.forEach((place) => {
      const size = baseSize * place.scale;
      const x = place.x * width;
      const y = place.y * height;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((place.rot * Math.PI) / 180);
      ctx.shadowColor = "rgba(0, 0, 0, 0.55)";
      ctx.shadowBlur = Math.max(2, size * 0.14);

      if (mark.type === "emoji") {
        ctx.font = `${Math.round(size)}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(mark.value, 0, 0);
      } else if (flowerImage) {
        const drawW = size;
        const drawH = size * (mark.aspect || 1);
        ctx.drawImage(flowerImage, -drawW / 2, -drawH / 2, drawW, drawH);
      }

      ctx.restore();
    });
  }

  async function stampCanvas(canvas, theme) {
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      return canvas;
    }

    await drawBadges(ctx, canvas.width, canvas.height, theme || getTheme());
    return canvas;
  }

  async function stampFile(file, theme) {
    const activeTheme = theme || getTheme();

    if (!file || !isThemed(activeTheme)) {
      return file;
    }

    const bitmap = await createImageBitmap(file);
    const canvas = document.createElement("canvas");

    canvas.width = bitmap.width;
    canvas.height = bitmap.height;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(bitmap, 0, 0);
    bitmap.close();

    await drawBadges(ctx, canvas.width, canvas.height, activeTheme);

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }

          resolve(
            new File([blob], file.name || `habit-${Date.now()}.jpg`, {
              type: "image/jpeg",
            })
          );
        },
        "image/jpeg",
        0.88
      );
    });
  }

  return {
    isThemed,
    getTheme,
    stampCanvas,
    stampFile,
    PLACEMENTS,
  };
})();
