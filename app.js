const habitForm = document.querySelector("#habitForm");
const habitFormMobile = document.querySelector("#habitFormMobile");

if (!habitForm && !habitFormMobile) {
  /* Not the habit checklist page */
} else if (typeof loadData !== "function") {
  console.warn("Habit Day: shared.js must load before app.js");
} else {
  const habitInput = document.querySelector("#habitInput");
  const habitInputMobile = document.querySelector("#habitInputMobile");
  const habitAddSheet = document.querySelector("#habitAddSheet");
  const habitAddClose = document.querySelector("#habitAddClose");
  const habitAddBackdrop = document.querySelector(".habit-add-backdrop");
  const sideAddHabit = document.querySelector("#sideAddHabit");
  const habitList = document.querySelector("#habitList");
  const habitTemplate = document.querySelector("#habitTemplate");
  const emptyState = document.querySelector("#emptyState");
  const summaryText = document.querySelector("#summaryText");
  const progressPercent = document.querySelector("#progressPercent");
  const resetToday = document.querySelector("#resetToday");
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

  let data = normalizeData(loadData());
  let activeDateKey = getSelectedDate();
  let previousPercent = null;

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

  const CELEBRATION_COPY = {
    friends: { tagline: "The bunny approves.", title: "Perfect day" },
    kuromi: { tagline: "Perfect chaos.", title: "Perfect day" },
    original: { tagline: "You did it.", title: "Perfect day" },
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

  function updateDateHeading() {
    const label = formatDisplayDate(activeDateKey);
    const isToday = activeDateKey === getTodayKey();

    if (appEyebrow) {
      appEyebrow.textContent = isToday ? "Habit Day" : label;
    }

    if (appTitle) {
      appTitle.textContent = isToday ? "Today's Habits" : `Habits for ${label}`;
    }

    if (resetToday) {
      resetToday.textContent = isToday ? "Reset today" : "Reset this day";
    }
  }

  function shouldCelebrate() {
    const theme = document.documentElement.dataset.theme || "original";

    if (theme === "friends" || theme === "kuromi") {
      return true;
    }

    return typeof UserPhotos !== "undefined" && UserPhotos.isEnabled();
  }

  function getCelebrationTheme() {
    const theme = document.documentElement.dataset.theme || "original";

    if (theme === "friends" || theme === "kuromi") {
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

    return null;
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
      celebrationPhotoRing.classList.remove("is-friends", "is-kuromi");
      celebrationPhotoRing.classList.add(theme === "kuromi" ? "is-kuromi" : "is-friends");
    }

    if (celebrationPhoto) {
      const url = resolveCelebrationImage(theme);
      celebrationPhoto.classList.toggle("is-kuromi-art", theme === "kuromi");

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
    themeCelebration.hidden = false;
    themeCelebration.classList.add("is-active");
    document.body.classList.add("celebration-open");

    if (typeof CelebrationFireworks !== "undefined" && celebrationFireworks) {
      CelebrationFireworks.start(celebrationFireworks, theme);
    }
  }

  function hideCelebration() {
    if (!themeCelebration) {
      return;
    }

    themeCelebration.hidden = true;
    themeCelebration.classList.remove("is-active");
    document.body.classList.remove("celebration-open");

    if (typeof CelebrationFireworks !== "undefined") {
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

  function renderHabits() {
    if (!habitList || !habitTemplate) {
      return;
    }

    habitList.innerHTML = "";

    data.habits.forEach((habit) => {
      const done = isHabitDone(data, habit.id, activeDateKey);
      const item = habitTemplate.content.firstElementChild.cloneNode(true);
      const checkButton = item.querySelector(".check-button");
      const deleteButton = item.querySelector(".delete-button");
      const title = item.querySelector("strong");
      const status = item.querySelector("span");

      item.classList.toggle("done", done);
      title.textContent = habit.title;
      status.textContent = done ? "Done" : "Still open";
      checkButton.setAttribute("aria-pressed", String(done));

      checkButton.addEventListener("click", () => {
        const currentlyDone = isHabitDone(data, habit.id, activeDateKey);
        setHabitDone(data, habit.id, !currentlyDone, activeDateKey);
        renderHabits();
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
    const mobileOpen = habitAddSheet && !habitAddSheet.hidden;

    if (mobileOpen && habitInputMobile) {
      return habitInputMobile.value.trim();
    }

    return habitInput ? habitInput.value.trim() : "";
  }

  function clearHabitDraft() {
    if (habitInput) {
      habitInput.value = "";
    }

    if (habitInputMobile) {
      habitInputMobile.value = "";
    }
  }

  function focusHabitDraft() {
    const mobileOpen = habitAddSheet && !habitAddSheet.hidden;

    if (mobileOpen && habitInputMobile) {
      habitInputMobile.focus();
      return;
    }

    if (habitInput) {
      habitInput.focus();
    }
  }

  function openHabitSheet() {
    if (!habitAddSheet) {
      return;
    }

    habitAddSheet.hidden = false;
    document.body.classList.add("habit-sheet-open");

    if (habitInputMobile) {
      window.setTimeout(() => habitInputMobile.focus(), 50);
    }
  }

  function closeHabitSheet() {
    if (!habitAddSheet) {
      return;
    }

    habitAddSheet.hidden = true;
    document.body.classList.remove("habit-sheet-open");
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
      closeHabitSheet();
    }
  }

  if (habitForm) {
    habitForm.addEventListener("submit", (event) => {
      event.preventDefault();
      addHabitFromInput();
    });
  }

  if (habitFormMobile) {
    habitFormMobile.addEventListener("submit", (event) => {
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

  if (sideAddHabit) {
    sideAddHabit.addEventListener("click", openHabitSheet);
  }

  if (habitAddClose) {
    habitAddClose.addEventListener("click", closeHabitSheet);
  }

  if (habitAddBackdrop) {
    habitAddBackdrop.addEventListener("click", closeHabitSheet);
  }

  if (resetToday) {
    resetToday.addEventListener("click", () => {
      if (data.history[activeDateKey]) {
        delete data.history[activeDateKey];
        persistData();
      }

      renderHabits();
    });
  }

  if (themeCelebration) {
    themeCelebration.addEventListener("click", hideCelebration);
  }

  window.addEventListener("habit-theme-change", () => {
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
  }

  boot();

  if (typeof UserPhotos !== "undefined") {
    UserPhotos.ready().then(renderHabits).catch(() => {});
  }
}

if ("serviceWorker" in navigator && location.protocol !== "file:") {
  navigator.serviceWorker.register("./sw.js?v=16").catch(() => {});
}
