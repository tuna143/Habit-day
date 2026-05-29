const weeklyOverview = document.querySelector("#weeklyOverview");
const weeklyChart = document.querySelector("#weeklyChart");
const weeklySummary = document.querySelector("#weeklySummary");

let data = loadData();
const selectedDate = getSelectedDate();

function formatDayOfMonth(dateKey) {
  return parseDateKey(dateKey).getDate();
}

function getWeekStatusLabel({ total, done, percent }) {
  if (total === 0) {
    return "No habits";
  }

  if (percent === 100) {
    return "Complete";
  }

  if (done > 0) {
    return "In progress";
  }

  return "Open";
}

function getWeekStatusClass({ total, done, percent }) {
  if (total === 0 || done === 0) {
    return "is-open";
  }

  if (percent === 100) {
    return "is-complete";
  }

  return "is-partial";
}

function renderWeeklyStats() {
  const weekDates = getWeekDates(parseDateKey(selectedDate));
  const weekProgress = weekDates.map((dateKey) => ({
    dateKey,
    ...getDayProgress(data, dateKey),
  }));
  const activeDays = weekProgress.filter((day) => day.total > 0 && day.done > 0);
  const average =
    weekProgress.length === 0
      ? 0
      : Math.round(weekProgress.reduce((sum, day) => sum + day.percent, 0) / weekProgress.length);
  const bestDay = weekProgress.reduce((best, day) => (day.percent > best.percent ? day : best), weekProgress[0]);

  weeklyOverview.innerHTML = `
    <article class="weekly-stat">
      <span class="weekly-stat-label">Average</span>
      <strong class="weekly-stat-value">${average}%</strong>
    </article>
    <article class="weekly-stat">
      <span class="weekly-stat-label">Active days</span>
      <strong class="weekly-stat-value">${activeDays.length}<span class="weekly-stat-suffix">/7</span></strong>
    </article>
    <article class="weekly-stat">
      <span class="weekly-stat-label">Best day</span>
      <strong class="weekly-stat-value">${bestDay.percent}%</strong>
      <span class="weekly-stat-note">${formatShortWeekday(bestDay.dateKey)}</span>
    </article>
  `;

  weeklyChart.innerHTML = "";

  weekDates.forEach((dateKey) => {
    const progress = getDayProgress(data, dateKey);
    const statusClass = getWeekStatusClass(progress);
    const day = document.createElement("button");
    day.type = "button";
    day.className = `week-day ${statusClass}`;
    day.dataset.date = dateKey;

    if (dateKey === getTodayKey()) {
      day.classList.add("is-today");
    }

    if (dateKey === selectedDate) {
      day.classList.add("is-selected");
    }

    day.innerHTML = `
      <div class="week-day-head">
        <span class="week-day-label">${formatShortWeekday(dateKey)}</span>
        <span class="week-day-date">${formatDayOfMonth(dateKey)}</span>
      </div>
      <div class="week-track" aria-hidden="true">
        <span class="week-track-fill" style="width: ${progress.percent}%"></span>
      </div>
      <div class="week-day-foot">
        <span class="week-day-value">${progress.percent}%</span>
        <span class="week-day-status">${getWeekStatusLabel(progress)}</span>
      </div>
    `;

    day.addEventListener("click", () => {
      goToMainPage(dateKey);
    });

    weeklyChart.append(day);
  });

  if (data.habits.length === 0) {
    weeklySummary.textContent = "Add habits on the main page to see weekly stats.";
    return;
  }

  weeklySummary.textContent = `${activeDays.length} day${activeDays.length === 1 ? "" : "s"} with at least one habit done this week.`;
}

renderWeeklyStats();
