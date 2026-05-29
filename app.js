const habitForm = document.querySelector("#habitForm");

if (!habitForm) {
  /* Not the habit checklist page */
} else if (typeof loadData !== "function") {
  console.warn("Habit Day: shared.js must load before app.js");
} else {
  const habitInput = document.querySelector("#habitInput");
  const habitList = document.querySelector("#habitList");
  const habitTemplate = document.querySelector("#habitTemplate");
  const emptyState = document.querySelector("#emptyState");
  const summaryText = document.querySelector("#summaryText");
  const progressPercent = document.querySelector("#progressPercent");
  const appEyebrow = document.querySelector("#app-eyebrow");
  const appTitle = document.querySelector("#app-title");
  const themeProgressFill = document.querySelector("#themeProgressFill");
  const themeProgressPct = document.querySelector("#themeProgressPct");
  const themeCelebration = document.querySelector("#themeCelebration");
  const celebrationFireworks = document.querySelector("#celebrationFireworks");
  const celebrationPhoto = document.querySelector(".celebration-photo");
  const celebrationPhotoRing = document.querySelector(".celebration-photo-ring");
  const celebrationTagline = document.querySelector(".celebration-tagline");
  const celebrationTitle = document.querySelector(".celebration-title");
  const celebrationPhotoBursts = document.querySelector("#celebrationPhotoBursts");
  const habitCameraInput = document.querySelector("#habitCameraInput");

  const CELEBRATION_BURST_STYLES = ["pop-launch", "pop-launch-fast", "pop-launch-wide"];
  const CELEBRATION_BURST_TARGET = 5;
  const CELEBRATION_BURST_BADGE_TARGET = 4;
  const CELEBRATION_BURST_MAX = 18;
  const CELEBRATION_BADGE_THEMES = ["friends", "kuromi", "gintama", "toothless"];
  let celebrationBurstPool = [];
  let celebrationBurstCounter = 0;
  let celebrationActiveTheme = "friends";

  let data = normalizeData(loadData());
  let activeDateKey = getSelectedDate();
  let previousPercent = null;
  let pendingHabitCapture = null;

  function normalizeData(raw) {
    if (!raw || !Array.isArray(raw.habits)) {
      return { habits: [], history: {} };
    }

    return {
      habits: raw.habits.filter((habit) => habit && habit.id && habit.title),
      history: raw.history && typeof raw.history === "object" ? raw.history : {},
    };
  }

  function persistData() {
    try {
      saveData(data);
      return true;
    } catch (error) {
      console.error("Habit Day save failed:", error);

      if (summaryText) {
        summaryText.textContent = "Could not save on this device. Try Safari/Chrome (not private mode).";
      }

      return false;
    }
  }

  const THEME_TODAY_TITLES = {
    friends: "Friend's Habit",
    kuromi: "Kromi's Habit",
    gintama: "銀魂's habit",
    toothless: "Dragon's habit",
  };

  const CELEBRATION_COPY = {
    friends: {
      tagline:
        "Central Perk would be proud — you showed up for every habit today, and the bunny is very impressed.",
      title: "Perfect day",
    },
    kuromi: {
      tagline:
        "Every habit done, zero mercy for laziness — chaotic good energy only, and the skull stamp of approval.",
      title: "Perfect day",
    },
    gintama: {
      tagline: "All habits done. The strawberry panties salute your discipline. Truly silver soul energy.",
      title: "Perfect day",
    },
    toothless: {
      tagline: "Every habit done — Night Fury approved. Those green eyes are very proud of you.",
      title: "Perfect day",
    },
    original: { tagline: "You did it — every habit checked off. Keep this streak going.", title: "Perfect day" },
  };

  function pruneHabitHistory(habitId) {
    Object.keys(data.history).forEach((dateKey) => {
      if (data.history[dateKey][habitId]) {
        delete data.history[dateKey][habitId];
      }

      if (Object.keys(data.history[dateKey]).length === 0) {
        delete data.history[dateKey];
      }
    });

    if (typeof HabitPhotos !== "undefined") {
      HabitPhotos.removeSnapsForHabit(habitId).catch(() => {});
    }
  }

  function formatDisplayDate(dateKey) {
    const date = parseDateKey(dateKey);
    const today = getTodayKey();

    if (dateKey === today) {
      return "Today";
    }

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${monthNames[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  }

  function getThemeTodayTitle() {
    if (typeof HabitTheme !== "undefined" && typeof HabitTheme.getTodayTitle === "function") {
      return HabitTheme.getTodayTitle();
    }

    const theme = document.documentElement.dataset.theme || "original";

    return THEME_TODAY_TITLES[theme] || null;
  }

  function updateDateHeading() {
    const label = formatDisplayDate(activeDateKey);
    const isToday = activeDateKey === getTodayKey();
    const themeTitle = isToday ? getThemeTodayTitle() : null;

    if (appEyebrow) {
      appEyebrow.textContent = themeTitle || (isToday ? "Habit Day" : label);
    }

    if (appTitle) {
      appTitle.textContent = themeTitle || (isToday ? "Today's Habits" : `Habits for ${label}`);
    }
  }

  function shouldCelebrate() {
    const theme = document.documentElement.dataset.theme || "original";

    if (theme === "friends" || theme === "kuromi" || theme === "gintama" || theme === "toothless") {
      return true;
    }

    return typeof UserPhotos !== "undefined" && UserPhotos.isEnabled();
  }

  function getCelebrationTheme() {
    const theme = document.documentElement.dataset.theme || "original";

    if (theme === "friends" || theme === "kuromi" || theme === "gintama" || theme === "toothless") {
      return theme;
    }

    return "friends";
  }

  function resolveCelebrationImage(theme) {
    if (typeof UserPhotos !== "undefined") {
      const url = UserPhotos.resolveCelebrationUrl(theme);

      if (url) {
        return url;
      }
    }

    if (theme === "friends") {
      return FRIENDS_ASSETS.bunny;
    }

    if (theme === "kuromi") {
      return KUROMI_ASSETS.celebrate;
    }

    if (theme === "gintama") {
      return GINTAMA_ASSETS.celebrate;
    }

    if (theme === "toothless") {
      return TOOTHLESS_ASSETS.celebrate;
    }

    return null;
  }

  function getThemeScenePool(theme) {
    if (theme === "friends" && typeof FRIENDS_SCENE_POOL !== "undefined") {
      return [...FRIENDS_SCENE_POOL];
    }

    if (theme === "kuromi" && typeof KUROMI_SCENE_POOL !== "undefined") {
      return [...KUROMI_SCENE_POOL];
    }

    if (theme === "gintama" && typeof GINTAMA_SCENE_POOL !== "undefined") {
      return [...GINTAMA_SCENE_POOL];
    }

    if (theme === "toothless" && typeof TOOTHLESS_SCENE_POOL !== "undefined") {
      return [...TOOTHLESS_SCENE_POOL];
    }

    return [];
  }

  function prepareCelebrationBurstPool(theme) {
    const mainUrl = resolveCelebrationImage(theme);
    const pool = getThemeScenePool(theme).filter((url) => url !== mainUrl);

    celebrationBurstPool = pool.length ? pool : getThemeScenePool(theme);
    celebrationBurstCounter = 0;
  }

  function clearCelebrationBurstPhotos() {
    if (celebrationPhotoBursts) {
      celebrationPhotoBursts.replaceChildren();
    }

    celebrationBurstCounter = 0;
  }

  function clearCelebrationBursts() {
    clearCelebrationBurstPhotos();
    celebrationBurstPool = [];
  }

  function pickBurstStyle(index) {
    return CELEBRATION_BURST_STYLES[index % CELEBRATION_BURST_STYLES.length];
  }

  function isCelebrationBadgeTheme(theme) {
    return CELEBRATION_BADGE_THEMES.includes(theme);
  }

  function appendCelebrationBurst(node) {
    const remove = () => {
      if (node.isConnected) {
        node.remove();
      }
    };

    node.addEventListener("animationend", remove, { once: true });
    window.setTimeout(remove, 3200);
    celebrationPhotoBursts.append(node);
  }

  function pickBurstLaunchPosition(w, h, sizeW, sizeH, laneIndex) {
    const lane = Math.random();
    const left = Math.max(6, Math.min(w - sizeW - 6, w * (0.05 + lane * 0.9) - sizeW / 2));
    const top = h - sizeH - (8 + Math.random() * 32);
    const driftX = Math.round((Math.random() - 0.5) * w * 0.18);
    const rot = Math.round(-16 + Math.random() * 32);

    return { left, top, driftX, rot };
  }

  function getCelebrationMainPhotoSize() {
    const ring = celebrationPhotoRing || document.querySelector(".celebration-photo-ring");

    if (ring) {
      const rect = ring.getBoundingClientRect();

      if (rect.width > 0 && rect.height > 0) {
        return { w: rect.width, h: rect.height };
      }
    }

    const viewportW = window.innerWidth;

    return {
      w: Math.min(200, viewportW * 0.52),
      h: Math.min(220, viewportW * 0.56),
    };
  }

  function spawnCelebrationPhotoPop(w, h) {
    if (!celebrationPhotoBursts || !celebrationBurstPool.length || !w || !h) {
      return;
    }

    if (celebrationBurstCounter >= CELEBRATION_BURST_MAX) {
      return;
    }

    const index = celebrationBurstCounter;
    celebrationBurstCounter += 1;

    const mainPhoto = getCelebrationMainPhotoSize();
    const burstScale = Math.sqrt(0.25) * 0.92 * (0.96 + Math.random() * 0.08);
    const sizeW = Math.round(mainPhoto.w * burstScale);
    const sizeH = Math.round(mainPhoto.h * burstScale);
    const { left, top, driftX, rot } = pickBurstLaunchPosition(w, h, sizeW, sizeH, index);
    const style = pickBurstStyle(index);

    const img = document.createElement("img");
    img.className = `celebration-burst-photo celebration-burst-photo--${style}`;
    img.src = celebrationBurstPool[index % celebrationBurstPool.length];
    img.alt = "";
    img.width = sizeW;
    img.height = sizeH;
    img.style.left = `${left}px`;
    img.style.top = `${top}px`;
    img.style.width = `${sizeW}px`;
    img.style.height = `${sizeH}px`;
    img.style.setProperty("--burst-dx", `${driftX}px`);
    img.style.setProperty("--burst-rot", `${rot}deg`);
    appendCelebrationBurst(img);
  }

  function spawnCelebrationBadgePop(w, h, theme, index) {
    if (!celebrationPhotoBursts || !isCelebrationBadgeTheme(theme)) {
      return;
    }

    if (celebrationBurstCounter >= CELEBRATION_BURST_MAX) {
      return;
    }

    celebrationBurstCounter += 1;

    const size = 40;
    const { left, top, driftX, rot } = pickBurstLaunchPosition(w, h, size, size, index + 0.5);
    const style = pickBurstStyle(index + 1);
    const badge = document.createElement("div");

    badge.className = `celebration-burst-badge celebration-burst-badge--${theme} celebration-burst-photo--${style}`;
    badge.setAttribute("aria-hidden", "true");
    badge.style.left = `${left}px`;
    badge.style.top = `${top}px`;
    badge.style.setProperty("--burst-dx", `${driftX}px`);
    badge.style.setProperty("--burst-rot", `${rot}deg`);

    const mark = document.createElement("span");
    mark.className = "celebration-burst-badge__mark";
    badge.append(mark);
    appendCelebrationBurst(badge);
  }

  function spawnCelebrationPhotoBurst(detail) {
    if (!detail || celebrationBurstCounter >= CELEBRATION_BURST_MAX) {
      return;
    }

    if (detail.burstType === "launch") {
      if (Math.random() > 0.18) {
        return;
      }
    } else if (Math.random() > 0.22) {
      return;
    }

    if (isCelebrationBadgeTheme(celebrationActiveTheme) && Math.random() < 0.32) {
      spawnCelebrationBadgePop(detail.w, detail.h, celebrationActiveTheme, celebrationBurstCounter);
      return;
    }

    spawnCelebrationPhotoPop(detail.w, detail.h);
  }

  function launchCelebrationPhotoPops(theme) {
    const w = window.innerWidth;
    const h = window.innerHeight;

    for (let burst = 0; burst < CELEBRATION_BURST_TARGET; burst += 1) {
      window.setTimeout(() => {
        if (!themeCelebration || themeCelebration.hidden) {
          return;
        }

        spawnCelebrationPhotoPop(w, h);
      }, burst * 280 + Math.random() * 200);
    }

    if (!isCelebrationBadgeTheme(theme)) {
      return;
    }

    for (let badge = 0; badge < CELEBRATION_BURST_BADGE_TARGET; badge += 1) {
      window.setTimeout(() => {
        if (!themeCelebration || themeCelebration.hidden) {
          return;
        }

        spawnCelebrationBadgePop(w, h, theme, badge);
      }, badge * 300 + 160 + Math.random() * 180);
    }
  }

  function updateCelebrationPanel(theme) {
    const copy = CELEBRATION_COPY[theme] || CELEBRATION_COPY.original;

    if (celebrationTagline) {
      celebrationTagline.textContent = copy.tagline;
    }

    if (celebrationTitle) {
      celebrationTitle.textContent = copy.title;
    }

    if (celebrationPhotoRing) {
      celebrationPhotoRing.classList.remove("is-friends", "is-kuromi", "is-gintama", "is-toothless");
      celebrationPhotoRing.classList.add(
        theme === "kuromi"
          ? "is-kuromi"
          : theme === "gintama"
            ? "is-gintama"
            : theme === "toothless"
              ? "is-toothless"
              : "is-friends"
      );
    }

    if (celebrationPhoto) {
      const url = resolveCelebrationImage(theme);
      celebrationPhoto.classList.toggle("is-kuromi-art", theme === "kuromi");
      celebrationPhoto.classList.toggle("is-gintama-art", theme === "gintama");
      celebrationPhoto.classList.toggle("is-toothless-art", theme === "toothless");

      if (url) {
        celebrationPhoto.src = url;
        celebrationPhoto.hidden = false;
      } else {
        celebrationPhoto.removeAttribute("src");
        celebrationPhoto.hidden = true;
      }
    }
  }

  function showCelebration() {
    if (!themeCelebration || !shouldCelebrate()) {
      return;
    }

    const theme = getCelebrationTheme();
    celebrationActiveTheme = theme;
    updateCelebrationPanel(theme);
    clearCelebrationBurstPhotos();
    prepareCelebrationBurstPool(theme);
    themeCelebration.hidden = false;
    themeCelebration.classList.add("is-active");
    document.body.classList.add("celebration-open");

    if (typeof CelebrationFireworks !== "undefined") {
      if (CelebrationFireworks.setOnBurst) {
        CelebrationFireworks.setOnBurst(spawnCelebrationPhotoBurst);
      }

      if (celebrationFireworks) {
        CelebrationFireworks.start(celebrationFireworks, theme);
      }

      launchCelebrationPhotoPops(theme);
    }
  }

  function hideCelebration() {
    if (!themeCelebration) {
      return;
    }

    themeCelebration.hidden = true;
    themeCelebration.classList.remove("is-active");
    document.body.classList.remove("celebration-open");
    clearCelebrationBursts();

    if (typeof CelebrationFireworks !== "undefined") {
      if (CelebrationFireworks.setOnBurst) {
        CelebrationFireworks.setOnBurst(null);
      }

      CelebrationFireworks.stop();
    }
  }

  function maybeCelebrate(percent) {
    if (previousPercent !== null && previousPercent < 100 && percent === 100) {
      showCelebration();
    }

    previousPercent = percent;
  }

  function renderProgress() {
    const { total, done, percent } = getDayProgress(data, activeDateKey);

    if (emptyState) {
      emptyState.hidden = total > 0;
    }

    if (progressPercent) {
      progressPercent.textContent = `${percent}%`;
    }

    if (themeProgressFill) {
      themeProgressFill.style.width = `${percent}%`;
    }

    if (themeProgressPct) {
      themeProgressPct.textContent = `${percent}%`;
    }

    if (!summaryText) {
      maybeCelebrate(percent);
      return;
    }

    if (total === 0) {
      summaryText.textContent = "Add one small habit and the day starts to take shape.";
    } else if (done === total) {
      summaryText.textContent = `Nice work. You finished all ${total} habits for this day.`;
    } else {
      summaryText.textContent = `${done} of ${total} complete. ${total - done} left for this day.`;
    }

    maybeCelebrate(percent);
  }

  async function loadDaySnaps() {
    if (typeof HabitPhotos === "undefined") {
      return {};
    }

    try {
      await HabitPhotos.ready();
      return await HabitPhotos.getSnapsForDate(activeDateKey);
    } catch {
      return {};
    }
  }

  async function processHabitPhoto(file, habitId) {
    if (!file) {
      return;
    }

    if (typeof HabitPhotos === "undefined") {
      setHabitDone(data, habitId, true, activeDateKey);
      renderHabits();
      return;
    }

    try {
      let stampedFile = file;

      if (typeof HabitSnapBadges !== "undefined") {
        stampedFile = await HabitSnapBadges.stampFile(file);
      }

      await HabitPhotos.saveSnap(activeDateKey, habitId, stampedFile);
      setHabitDone(data, habitId, true, activeDateKey);

      if (persistData()) {
        await renderHabits();
      }
    } catch (error) {
      if (summaryText) {
        summaryText.textContent = error.message || "Could not save that photo.";
      }
    }
  }

  async function openHabitCamera(habitId) {
    if (typeof HabitCamera !== "undefined" && HabitCamera.supportsInline()) {
      const file = await HabitCamera.capturePhoto();
      await processHabitPhoto(file, habitId);
      return;
    }

    if (!habitCameraInput) {
      setHabitDone(data, habitId, true, activeDateKey);
      renderHabits();
      return;
    }

    pendingHabitCapture = { habitId };
    habitCameraInput.value = "";
    habitCameraInput.click();
  }

  async function renderHabits() {
    if (!habitList || !habitTemplate) {
      return;
    }

    const daySnaps = await loadDaySnaps();

    habitList.innerHTML = "";

    data.habits.forEach((habit) => {
      const done = isHabitDone(data, habit.id, activeDateKey);
      const snapUrl = daySnaps[habit.id];
      const item = habitTemplate.content.firstElementChild.cloneNode(true);
      const checkButton = item.querySelector(".check-button");
      const deleteButton = item.querySelector(".delete-button");
      const title = item.querySelector("strong");
      const status = item.querySelector("span");
      const snapFrame = item.querySelector(".habit-snap");
      const snapImg = item.querySelector(".habit-snap-img");

      item.classList.toggle("done", done);
      item.classList.toggle("has-snap", Boolean(done && snapUrl));
      title.textContent = habit.title;
      status.textContent = done ? (snapUrl ? "Done · photo saved" : "Done") : "Tap circle to take a photo";
      checkButton.setAttribute("aria-pressed", String(done));
      checkButton.setAttribute(
        "aria-label",
        done ? "Undo habit (removes photo)" : "Take photo and complete habit"
      );

      if (snapFrame && snapImg && snapUrl) {
        snapFrame.hidden = false;
        snapImg.src = snapUrl;
        snapImg.alt = `${habit.title} photo`;
      } else if (snapFrame) {
        snapFrame.hidden = true;
      }

      checkButton.addEventListener("click", () => {
        const currentlyDone = isHabitDone(data, habit.id, activeDateKey);

        if (currentlyDone) {
          setHabitDone(data, habit.id, false, activeDateKey);

          if (typeof HabitPhotos !== "undefined") {
            HabitPhotos.removeSnap(activeDateKey, habit.id).catch(() => {});
          }

          renderHabits();
          return;
        }

        openHabitCamera(habit.id);
      });

      deleteButton.addEventListener("click", () => {
        data.habits = data.habits.filter((itemHabit) => itemHabit.id !== habit.id);
        pruneHabitHistory(habit.id);
        persistData();
        renderHabits();
      });

      habitList.append(item);
    });

    updateDateHeading();
    renderProgress();
  }

  function readHabitDraft() {
    return habitInput ? habitInput.value.trim() : "";
  }

  function clearHabitDraft() {
    if (habitInput) {
      habitInput.value = "";
    }
  }

  function focusHabitDraft() {
    if (habitInput) {
      habitInput.focus();
    }
  }

  function addHabitFromInput() {
    const title = readHabitDraft();

    if (!title) {
      focusHabitDraft();
      return;
    }

    data.habits = [{ id: makeId(), title }, ...data.habits];
    clearHabitDraft();

    if (persistData()) {
      renderHabits();
    }
  }

  if (habitForm) {
    habitForm.addEventListener("submit", (event) => {
      event.preventDefault();
      addHabitFromInput();
    });
  }

  const habitAddButton = document.querySelector("#habitAddButton");

  if (habitAddButton) {
    habitAddButton.addEventListener("click", (event) => {
      event.preventDefault();
      addHabitFromInput();
    });
  }

  if (habitCameraInput) {
    habitCameraInput.addEventListener("change", async () => {
      const file = habitCameraInput.files?.[0];
      const pending = pendingHabitCapture;

      habitCameraInput.value = "";
      pendingHabitCapture = null;

      if (!file || !pending) {
        return;
      }

      await processHabitPhoto(file, pending.habitId);
    });
  }

  if (themeCelebration) {
    themeCelebration.addEventListener("click", hideCelebration);
  }

  window.addEventListener("habit-theme-change", () => {
    updateDateHeading();

    if (themeCelebration && !themeCelebration.hidden) {
      updateCelebrationPanel(getCelebrationTheme());
    }
  });

  window.addEventListener("habit-profile-change", () => {
    updateDateHeading();
  });

  window.addEventListener("habit-photos-change", () => {
    if (themeCelebration && !themeCelebration.hidden) {
      updateCelebrationPanel(getCelebrationTheme());
    }

    renderHabits();
  });

  function boot() {
    activeDateKey = getSelectedDate();
    data = normalizeData(loadData());
    renderHabits();

    if (typeof consumeWelcomeCelebration === "function" && consumeWelcomeCelebration()) {
      const { percent } = getDayProgress(data, activeDateKey);

      if (percent === 100 && activeDateKey === getTodayKey()) {
        previousPercent = 99;
        showCelebration();
        previousPercent = 100;
      }
    }
  }

  boot();

  const photoReady = [];

  if (typeof HabitPhotos !== "undefined") {
    photoReady.push(HabitPhotos.ready());
  }

  if (typeof UserPhotos !== "undefined") {
    photoReady.push(UserPhotos.ready());
  }

  if (photoReady.length) {
    Promise.all(photoReady).then(() => renderHabits()).catch(() => {});
  }
}

if ("serviceWorker" in navigator && location.protocol !== "file:") {
  navigator.serviceWorker.register("./sw.js?v=49").catch(() => {});
}
