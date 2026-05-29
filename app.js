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

  const CELEBRATION_BURST_STYLES = ["pop-scatter", "pop-scatter-wide", "pop-scatter-sway", "pop-arc"];
  let celebrationBurstPool = [];
  let celebrationBurstCounter = 0;

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
    gintama: "Gintoki's habit",
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

  function pickBurstStyle(burstType, index) {
    if (burstType === "willow") {
      return "pop-scatter-sway";
    }

    if (burstType === "peony") {
      return "pop-scatter-wide";
    }

    if (burstType === "chrysanthemum") {
      return "pop-scatter";
    }

    return CELEBRATION_BURST_STYLES[index % CELEBRATION_BURST_STYLES.length];
  }

  function spawnCelebrationPhotoBurst(detail) {
    if (!celebrationPhotoBursts || !celebrationBurstPool.length || !detail) {
      return;
    }

    const { w, h, burstType } = detail;
    const slotCount = burstType === "launch" ? 1 : Math.random() < 0.28 ? 2 : 1;

    for (let slot = 0; slot < slotCount; slot += 1) {
      const index = celebrationBurstCounter;
      celebrationBurstCounter += 1;

      const sizeW = Math.round(Math.min(68, Math.max(44, w * (0.12 + Math.random() * 0.05))));
      const sizeH = Math.round(sizeW * (1.06 + Math.random() * 0.12));
      const lane = (index * 0.19 + slot * 0.37 + Math.random() * 0.62) % 1;
      const left = Math.max(4, Math.min(w - sizeW - 4, w * (0.02 + lane * 0.96) - sizeW / 2));
      const top = h - sizeH - (4 + Math.random() * 36);
      const driftX = Math.round((Math.random() - 0.5) * w * (0.2 + Math.random() * 0.12));
      const driftMidX = Math.round((Math.random() - 0.5) * w * 0.1);
      const rot = Math.round(-24 + Math.random() * 48);

      const img = document.createElement("img");
      const style = pickBurstStyle(burstType, index + slot);

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
      img.style.setProperty("--burst-mid-x", `${driftMidX}px`);
      img.style.setProperty("--burst-rot", `${rot}deg`);

      const remove = () => {
        if (img.isConnected) {
          img.remove();
        }
      };

      img.addEventListener("animationend", remove, { once: true });
      window.setTimeout(remove, 4200);
      celebrationPhotoBursts.append(img);
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

      const w = window.innerWidth;
      const h = window.innerHeight;

      for (let burst = 0; burst < 6; burst += 1) {
        window.setTimeout(() => {
          if (!themeCelebration.hidden) {
            spawnCelebrationPhotoBurst({
              x: w * 0.5,
              y: h,
              w,
              h,
              burstType: burst % 3 === 0 ? "peony" : burst % 3 === 1 ? "willow" : "chrysanthemum",
            });
          }
        }, burst * 150 + Math.random() * 140);
      }
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
      await HabitPhotos.saveSnap(activeDateKey, habitId, file);
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
  navigator.serviceWorker.register("./sw.js?v=48").catch(() => {});
}
