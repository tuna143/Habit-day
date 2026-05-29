const habitForm = document.querySelector("#habitForm");
const habitInput = document.querySelector("#habitInput");
const habitList = document.querySelector("#habitList");
const habitTemplate = document.querySelector("#habitTemplate");
const emptyState = document.querySelector("#emptyState");
const summaryText = document.querySelector("#summaryText");
const progressPercent = document.querySelector("#progressPercent");
const progressCard = document.querySelector("#progressCard");
const resetToday = document.querySelector("#resetToday");
const appTitle = document.querySelector("#app-title");
const appEyebrow = document.querySelector("#app-eyebrow");
const themeProgressFill = document.querySelector("#themeProgressFill");
const themeProgressPct = document.querySelector("#themeProgressPct");

let data = loadData();
const selectedDate = getSelectedDate();
let wasAllDone = false;

const themeCelebration = document.querySelector("#themeCelebration");
const celebrationFireworks = document.querySelector("#celebrationFireworks");
const celebrationPhoto = document.querySelector(".celebration-photo");
const celebrationTagline = document.querySelector(".celebration-tagline");
const celebrationRing = document.querySelector(".celebration-photo-ring");

function getTheme() {
  return document.documentElement.dataset.theme || "original";
}

function isFriendsTheme() {
  return getTheme() === "friends";
}

function isKuromiTheme() {
  return getTheme() === "kuromi";
}

function hasThemedCelebration() {
  return (
    isFriendsTheme() ||
    isKuromiTheme() ||
    UserPhotos.usesUserPhotos() ||
    Boolean(UserPhotos.getStarredPerfectUrl())
  );
}

function formatSelectedTitle(dateKey) {
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const date = parseDateKey(dateKey);
  const monthDay = `${monthNames[date.getMonth()]} ${date.getDate()}`;

  if (isFriendsTheme()) {
    return dateKey === getTodayKey() ? "Friend's Habit" : `${monthDay} · Friend's`;
  }

  if (isKuromiTheme()) {
    return dateKey === getTodayKey() ? "Kuromi's Habits" : `${monthDay} · Kuromi`;
  }

  return dateKey === getTodayKey() ? "Today's Habits" : `${monthDay} Habits`;
}

function renderHeader() {
  appTitle.textContent = formatSelectedTitle(selectedDate);

  if (appEyebrow) {
    if (isFriendsTheme()) {
      appEyebrow.textContent = "Central Perk";
    } else if (isKuromiTheme()) {
      appEyebrow.textContent = "My Melody";
    } else {
      appEyebrow.textContent = "Habit Day";
    }
  }

  resetToday.textContent = selectedDate === getTodayKey() ? "Reset today" : "Reset selected day";
}

function renderHabits() {
  habitList.innerHTML = "";

  data.habits.forEach((habit) => {
    const item = habitTemplate.content.firstElementChild.cloneNode(true);
    const checkButton = item.querySelector(".check-button");
    const deleteButton = item.querySelector(".delete-button");
    const title = item.querySelector("strong");
    const status = item.querySelector("span");
    const done = isHabitDone(data, habit.id, selectedDate);

    item.classList.toggle("done", done);
    title.textContent = habit.title;
    status.textContent = done ? "Done" : "Still open";
    checkButton.setAttribute("aria-pressed", String(done));

    checkButton.addEventListener("click", () => {
      setHabitDone(data, habit.id, !isHabitDone(data, habit.id, selectedDate), selectedDate);
      renderAll();
    });

    deleteButton.addEventListener("click", () => {
      data.habits = data.habits.filter((itemHabit) => itemHabit.id !== habit.id);

      Object.keys(data.history).forEach((dateKey) => {
        delete data.history[dateKey][habit.id];

        if (Object.keys(data.history[dateKey]).length === 0) {
          delete data.history[dateKey];
        }
      });

      saveData(data);
      renderAll();
    });

    habitList.append(item);
  });

  renderProgress();
}

function updateEmptyState(total) {
  if (!emptyState) {
    return;
  }

  const hasHabits = total > 0;
  emptyState.hidden = hasHabits;
  emptyState.style.display = hasHabits ? "none" : "";
}

function hideCelebration() {
  if (!themeCelebration) {
    return;
  }

  CelebrationFireworks.stop();
  themeCelebration.hidden = true;
  themeCelebration.classList.remove("is-active");
  document.body.classList.remove("celebration-open");
}

function showCelebration() {
  if (!themeCelebration || !hasThemedCelebration()) {
    return;
  }

  if (celebrationRing) {
    celebrationRing.classList.toggle("is-friends", isFriendsTheme());
    celebrationRing.classList.toggle("is-kuromi", isKuromiTheme());
  }

  if (celebrationPhoto) {
    const celebrationSrc = UserPhotos.resolveCelebrationUrl(getTheme());

    if (celebrationSrc) {
      celebrationPhoto.src = celebrationSrc;
      celebrationPhoto.alt = "Celebration";
    }

    celebrationPhoto.classList.toggle("is-kuromi-art", isKuromiTheme() && !UserPhotos.usesUserPhotos());
    celebrationPhoto.classList.toggle(
      "is-user-photo",
      Boolean(celebrationSrc && celebrationSrc.startsWith("data:"))
    );
  }

  if (celebrationTagline) {
    if (UserPhotos.getStarredPerfectUrl() || UserPhotos.usesUserPhotos()) {
      celebrationTagline.textContent = "Perfect day!";
    } else if (isFriendsTheme()) {
      celebrationTagline.textContent = "The bunny approves.";
    } else {
      celebrationTagline.textContent = "Kuromi approves.";
    }
  }

  themeCelebration.hidden = false;
  themeCelebration.classList.add("is-active");
  document.body.classList.add("celebration-open");

  requestAnimationFrame(() => {
    CelebrationFireworks.start(celebrationFireworks, getTheme());
  });
}

function syncCelebrationGate(total, done) {
  wasAllDone = total > 0 && done === total;
}

function updateCelebration(total, done) {
  const allDone = total > 0 && done === total;

  if (!hasThemedCelebration() || !allDone) {
    wasAllDone = false;
    hideCelebration();
    return;
  }

  if (!wasAllDone) {
    showCelebration();
    wasAllDone = true;
    return;
  }
}

function themedSummary(total, done) {
  if (total === 0) {
    if (isFriendsTheme()) {
      return "Add a habit — the gang is waiting.";
    }
    if (isKuromiTheme()) {
      return "Add a habit — Kuromi is watching.";
    }
    return "Add one small habit and the day starts to take shape.";
  }

  if (done === total) {
    if (isFriendsTheme()) {
      return `You did it. All ${total} habits done today.`;
    }
    if (isKuromiTheme()) {
      return `Perfect. All ${total} habits done today.`;
    }
    return `Nice work. You finished all ${total} habits today.`;
  }

  const left = total - done;

  if (isFriendsTheme()) {
    return `${done} of ${total} done · ${left} to go.`;
  }
  if (isKuromiTheme()) {
    return `${done} of ${total} done · ${left} left.`;
  }
  return `${done} of ${total} complete. ${left} left for today.`;
}

function renderProgress() {
  const { total, done, percent } = getDayProgress(data, selectedDate);

  updateEmptyState(total);
  updateCelebration(total, done);

  if (progressPercent) {
    progressPercent.textContent = `${percent}%`;
  }

  if (themeProgressFill) {
    themeProgressFill.style.width = `${percent}%`;
  }

  if (themeProgressPct) {
    themeProgressPct.textContent = `${percent}%`;
  }

  summaryText.textContent = themedSummary(total, done);
}

function renderAll() {
  renderHeader();
  renderHabits();
}

habitForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const title = habitInput.value.trim();

  if (!title) {
    habitInput.focus();
    return;
  }

  data.habits = [{ id: makeId(), title }, ...data.habits];
  habitInput.value = "";
  saveData(data);
  renderAll();
});

resetToday.addEventListener("click", () => {
  delete data.history[selectedDate];
  saveData(data);
  wasAllDone = false;
  hideCelebration();
  renderAll();
});

if (themeCelebration) {
  themeCelebration.addEventListener("click", hideCelebration);
}

window.addEventListener("habit-theme-change", () => {
  hideCelebration();
  const { total, done } = getDayProgress(data, selectedDate);
  syncCelebrationGate(total, done);
  renderAll();
});

UserPhotos.ready().then(() => {
  const initialProgress = getDayProgress(data, selectedDate);
  syncCelebrationGate(initialProgress.total, initialProgress.done);
  renderAll();
});

window.addEventListener("habit-photos-change", () => {
  const progress = getDayProgress(data, selectedDate);
  syncCelebrationGate(progress.total, progress.done);
  renderAll();
});
