const calendarGrid = document.querySelector("#calendarGrid");
const calendarMonthLabel = document.querySelector("#calendarMonthLabel");
const calendarPrev = document.querySelector("#calendarPrev");
const calendarNext = document.querySelector("#calendarNext");
const dayPhotosOverlay = document.querySelector("#calendarDayPhotos");
const dayPhotosTitle = document.querySelector("#calendarDayPhotosTitle");
const dayPhotosGrid = document.querySelector("#calendarDayPhotosGrid");
const dayPhotosClose = document.querySelector("#calendarDayPhotosClose");
const dayPhotosBackdrop = document.querySelector(".calendar-day-photos-backdrop");
const dayPhotosOpen = document.querySelector("#calendarDayPhotosOpen");

let data = loadData();
const selectedDate = getSelectedDate();
let calendarView = getMonthView(parseDateKey(selectedDate));
let snapsByDate = {};
let viewerDateKey = null;

function getTheme() {
  return document.documentElement.dataset.theme || "original";
}

function isFriendsTheme() {
  return getTheme() === "friends";
}

function isKuromiTheme() {
  return getTheme() === "kuromi";
}

function getHabitTitle(habitId) {
  const habit = data.habits.find((item) => item.id === habitId);
  return habit?.title || "Habit";
}

function getSnapsForDay(dateKey) {
  return snapsByDate[dateKey] || [];
}

function getCellPhotoUrl(dateKey, themedPhoto) {
  const snaps = getSnapsForDay(dateKey);

  if (snaps.length) {
    return snaps[0].dataUrl;
  }

  return themedPhoto;
}

function formatDayPhotosTitle(dateKey) {
  const date = parseDateKey(dateKey);
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${monthNames[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

function closeDayPhotos() {
  viewerDateKey = null;

  if (dayPhotosOverlay) {
    dayPhotosOverlay.hidden = true;
  }

  document.body.classList.remove("calendar-photos-open");
}

function openDayPhotos(dateKey) {
  const snaps = getSnapsForDay(dateKey);

  if (!snaps.length || !dayPhotosOverlay || !dayPhotosGrid) {
    goToMainPage(dateKey);
    return;
  }

  viewerDateKey = dateKey;

  if (dayPhotosTitle) {
    dayPhotosTitle.textContent = formatDayPhotosTitle(dateKey);
  }

  dayPhotosGrid.innerHTML = "";

  const ordered = [...snaps].sort((a, b) => {
    const indexA = data.habits.findIndex((habit) => habit.id === a.habitId);
    const indexB = data.habits.findIndex((habit) => habit.id === b.habitId);
    return (indexA < 0 ? 999 : indexA) - (indexB < 0 ? 999 : indexB);
  });

  ordered.forEach((snap) => {
    const card = document.createElement("figure");
    card.className = "calendar-day-photo-card";

    const img = document.createElement("img");
    img.src = snap.dataUrl;
    img.alt = `${getHabitTitle(snap.habitId)} photo`;
    img.loading = "lazy";

    const caption = document.createElement("figcaption");
    caption.textContent = getHabitTitle(snap.habitId);

    card.append(img, caption);
    dayPhotosGrid.append(card);
  });

  dayPhotosOverlay.hidden = false;
  document.body.classList.add("calendar-photos-open");
}

async function loadSnapsByDate() {
  if (typeof HabitPhotos === "undefined") {
    snapsByDate = {};
    return;
  }

  try {
    await HabitPhotos.ready();
    snapsByDate = await HabitPhotos.getSnapsGroupedByDate();
  } catch {
    snapsByDate = {};
  }
}

async function renderCalendar() {
  await loadSnapsByDate();

  const { year, month } = calendarView;
  const firstDay = new Date(year, month, 1);
  const startOffset = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const themedPhotos =
    isFriendsTheme() ||
    isKuromiTheme() ||
    UserPhotos.usesUserPhotos() ||
    Boolean(UserPhotos.getStarredPerfectUrl());

  calendarMonthLabel.textContent = formatMonthLabel(year, month);
  calendarGrid.innerHTML = "";

  for (let index = 0; index < startOffset; index += 1) {
    const emptyCell = document.createElement("div");
    emptyCell.className = "calendar-day is-empty";
    emptyCell.setAttribute("aria-hidden", "true");
    calendarGrid.append(emptyCell);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const dateKey = formatDateKey(new Date(year, month, day));
    const { percent } = getDayProgress(data, dateKey);
    const daySnaps = getSnapsForDay(dateKey);
    const cell = document.createElement("button");
    cell.type = "button";
    cell.className = `calendar-day ${getCalendarDayClass(data, dateKey)}`;
    cell.dataset.date = dateKey;
    cell.title = daySnaps.length
      ? `${day} · ${percent}% · ${daySnaps.length} photo${daySnaps.length > 1 ? "s" : ""}`
      : `${day} · ${percent}%`;

    if (dateKey === getTodayKey()) {
      cell.classList.add("is-today");
    }

    if (dateKey === selectedDate) {
      cell.classList.add("is-selected");
    }

    const themedPhoto = UserPhotos.resolveThemedCalendarPhoto(data, dateKey, getTheme());
    const photo = getCellPhotoUrl(dateKey, themedPhoto);

    if (photo) {
      cell.classList.add("has-photo");
    }

    if (daySnaps.length) {
      cell.classList.add("has-habit-snaps");
      cell.dataset.snapCount = String(daySnaps.length);
    }

    if (photo && percent === 100) {
      cell.classList.add("is-perfect");
    }

    cell.innerHTML = `
      ${photo ? '<span class="calendar-day-bg" aria-hidden="true"></span>' : ""}
      <span class="calendar-day-number">${day}</span>
      ${themedPhotos && photo ? "" : '<span class="calendar-day-dot" aria-hidden="true"></span>'}
      ${daySnaps.length ? '<span class="calendar-day-snap-badge" aria-hidden="true"></span>' : ""}
    `;

    if (photo) {
      const bg = cell.querySelector(".calendar-day-bg");

      if (bg) {
        bg.style.backgroundImage = `url("${photo}")`;
        bg.style.backgroundSize = "cover";
        bg.style.backgroundPosition = "center";
      }
    }

    cell.addEventListener("click", () => {
      if (daySnaps.length) {
        openDayPhotos(dateKey);
        return;
      }

      goToMainPage(dateKey);
    });

    calendarGrid.append(cell);
  }
}

calendarPrev.addEventListener("click", () => {
  calendarView.month -= 1;

  if (calendarView.month < 0) {
    calendarView.month = 11;
    calendarView.year -= 1;
  }

  renderCalendar();
});

calendarNext.addEventListener("click", () => {
  calendarView.month += 1;

  if (calendarView.month > 11) {
    calendarView.month = 0;
    calendarView.year += 1;
  }

  renderCalendar();
});

if (dayPhotosClose) {
  dayPhotosClose.addEventListener("click", closeDayPhotos);
}

if (dayPhotosBackdrop) {
  dayPhotosBackdrop.addEventListener("click", closeDayPhotos);
}

if (dayPhotosOpen) {
  dayPhotosOpen.addEventListener("click", () => {
    if (viewerDateKey) {
      goToMainPage(viewerDateKey);
    }
  });
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && viewerDateKey) {
    closeDayPhotos();
  }
});

window.addEventListener("habit-theme-change", renderCalendar);
window.addEventListener("habit-photos-change", renderCalendar);

Promise.all([UserPhotos.ready(), typeof HabitPhotos !== "undefined" ? HabitPhotos.ready() : Promise.resolve()]).then(
  renderCalendar
);
