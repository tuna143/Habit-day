const calendarGrid = document.querySelector("#calendarGrid");
const calendarMonthLabel = document.querySelector("#calendarMonthLabel");
const calendarPrev = document.querySelector("#calendarPrev");
const calendarNext = document.querySelector("#calendarNext");

let data = loadData();
const selectedDate = getSelectedDate();
let calendarView = getMonthView(parseDateKey(selectedDate));

function getTheme() {
  return document.documentElement.dataset.theme || "original";
}

function isFriendsTheme() {
  return getTheme() === "friends";
}

function isKuromiTheme() {
  return getTheme() === "kuromi";
}

function renderCalendar() {
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
    const cell = document.createElement("button");
    cell.type = "button";
    cell.className = `calendar-day ${getCalendarDayClass(data, dateKey)}`;
    cell.dataset.date = dateKey;
    cell.title = `${day} · ${percent}%`;

    if (dateKey === getTodayKey()) {
      cell.classList.add("is-today");
    }

    if (dateKey === selectedDate) {
      cell.classList.add("is-selected");
    }

    const photo = UserPhotos.resolveThemedCalendarPhoto(data, dateKey, getTheme());

    if (photo) {
      cell.classList.add("has-photo");

      if (percent === 100) {
        cell.classList.add("is-perfect");
      }
    }

    cell.innerHTML = `
      ${photo ? '<span class="calendar-day-bg" aria-hidden="true"></span>' : ""}
      <span class="calendar-day-number">${day}</span>
      ${themedPhotos && photo ? "" : '<span class="calendar-day-dot" aria-hidden="true"></span>'}
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

window.addEventListener("habit-theme-change", renderCalendar);
window.addEventListener("habit-photos-change", renderCalendar);

UserPhotos.ready().then(renderCalendar);
