const storageKey = "habit-day-items";
const selectedDateKey = "habit-selected-date";

const welcomeCelebrationKey = "habit-day-welcome-celebration";

const DEFAULT_HABIT_TITLES = [
  "Message to minju",
  "Drink green-tea",
  "Wake up at 7am",
  "Watch drama Friends",
];

function createDefaultHabits() {
  return DEFAULT_HABIT_TITLES.map((title) => ({ id: makeId(), title }));
}

function shiftDateKey(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return formatDateKey(date);
}

function createDemoInitialData() {
  const habits = createDefaultHabits();
  const todayKey = getTodayKey();
  const yesterdayKey = shiftDateKey(-1);
  const dayBeforeKey = shiftDateKey(-2);
  const history = {
    [dayBeforeKey]: { [habits[0].id]: true },
    [yesterdayKey]: { [habits[1].id]: true },
    [todayKey]: {},
  };

  habits.forEach((habit) => {
    history[todayKey][habit.id] = true;
  });

  return { habits, history };
}

function markWelcomeCelebration() {
  sessionStorage.setItem(welcomeCelebrationKey, "1");
}

function consumeWelcomeCelebration() {
  if (sessionStorage.getItem(welcomeCelebrationKey) !== "1") {
    return false;
  }

  sessionStorage.removeItem(welcomeCelebrationKey);
  return true;
}

function shouldSeedDefaultHabits(habits, history) {
  if (!Array.isArray(habits) || habits.length > 0) {
    return false;
  }

  return !history || Object.keys(history).length === 0;
}

function seedInitialData() {
  const initial = createDemoInitialData();
  saveData(initial);
  markWelcomeCelebration();
  return initial;
}

function makeId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getTodayKey() {
  return formatDateKey(new Date());
}

function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateKey(dateKey) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function getMonthView(date) {
  return { year: date.getFullYear(), month: date.getMonth() };
}

function getSelectedDate() {
  return sessionStorage.getItem(selectedDateKey) || getTodayKey();
}

function setSelectedDate(dateKey) {
  sessionStorage.setItem(selectedDateKey, dateKey);
}

function loadData() {
  const saved = localStorage.getItem(storageKey);

  if (!saved) {
    return seedInitialData();
  }

  try {
    const parsed = JSON.parse(saved);

    if (Array.isArray(parsed)) {
      const today = getTodayKey();
      const habits = parsed.map((habit) => ({ id: habit.id, title: habit.title }));
      const history = {};

      if (parsed.some((habit) => habit.done)) {
        history[today] = {};
        parsed.forEach((habit) => {
          if (habit.done) {
            history[today][habit.id] = true;
          }
        });
      }

      if (shouldSeedDefaultHabits(habits, history)) {
        return seedInitialData();
      }

      return { habits, history };
    }

    if (parsed.habits && parsed.history) {
      const habits = Array.isArray(parsed.habits)
        ? parsed.habits.filter((habit) => habit && habit.id && habit.title)
        : [];
      const history = parsed.history && typeof parsed.history === "object" ? parsed.history : {};

      if (shouldSeedDefaultHabits(habits, history)) {
        return seedInitialData();
      }

      return { habits, history };
    }
  } catch {
    return seedInitialData();
  }

  return seedInitialData();
}

function saveData(data) {
  localStorage.setItem(storageKey, JSON.stringify(data));
}

function isHabitDone(data, habitId, dateKey = getSelectedDate()) {
  return Boolean(data.history[dateKey]?.[habitId]);
}

function setHabitDone(data, habitId, done, dateKey = getSelectedDate()) {
  if (!data.history[dateKey]) {
    data.history[dateKey] = {};
  }

  if (done) {
    data.history[dateKey][habitId] = true;
  } else {
    delete data.history[dateKey][habitId];
  }

  if (Object.keys(data.history[dateKey]).length === 0) {
    delete data.history[dateKey];
  }

  saveData(data);
}

function getDayProgress(data, dateKey) {
  const total = data.habits.length;

  if (total === 0) {
    return { total: 0, done: 0, percent: 0 };
  }

  const dayHistory = data.history[dateKey] || {};
  const done = data.habits.filter((habit) => dayHistory[habit.id]).length;

  return {
    total,
    done,
    percent: Math.round((done / total) * 100),
  };
}

function getWeekDates(referenceDate = new Date()) {
  const date = new Date(referenceDate);
  const sunday = new Date(date);
  sunday.setDate(date.getDate() - date.getDay());

  return Array.from({ length: 7 }, (_, index) => {
    const weekDate = new Date(sunday);
    weekDate.setDate(sunday.getDate() + index);
    return formatDateKey(weekDate);
  });
}

function formatMonthLabel(year, month) {
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${monthNames[month]} ${year}`;
}

function formatShortWeekday(dateKey) {
  const labels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return labels[parseDateKey(dateKey).getDay()];
}

function getCalendarDayClass(data, dateKey) {
  const { total, percent } = getDayProgress(data, dateKey);

  if (total === 0 || percent === 0) {
    return "none";
  }

  if (percent === 100) {
    return "complete";
  }

  return "partial";
}

function goToMainPage(dateKey) {
  if (dateKey) {
    setSelectedDate(dateKey);
  }

  window.location.href = "app.html";
}

const FRIENDS_ASSETS = {
  bunny: "assets/friends/banner.png",
};

const FRIENDS_SCENE_POOL = [
  "assets/friends/day-01.png",
  "assets/friends/day-02.png",
  "assets/friends/day-03.png",
  "assets/friends/day-04.png",
  "assets/friends/day-05.png",
  "assets/friends/day-06.png",
  "assets/friends/day-07.png",
  "assets/friends/day-08.png",
  "assets/friends/day-perfect.png",
  "assets/friends/scene-09.png",
  "assets/friends/scene-10.png",
  "assets/friends/scene-11.png",
  "assets/friends/scene-12.png",
  "assets/friends/scene-13.png",
  "assets/friends/scene-14.png",
  "assets/friends/scene-15.png",
  "assets/friends/scene-16.png",
  "assets/friends/scene-17.png",
  "assets/friends/scene-18.png",
];

function getFriendsSceneHash(dateKey, salt = 0) {
  let hash = salt;

  for (let index = 0; index < dateKey.length; index += 1) {
    hash = (hash * 31 + dateKey.charCodeAt(index)) >>> 0;
  }

  return hash;
}

function getFriendsSceneImage(dateKey, salt = 0) {
  const index = getFriendsSceneHash(dateKey, salt) % FRIENDS_SCENE_POOL.length;
  return FRIENDS_SCENE_POOL[index];
}

function getFriendsCalendarPhoto(data, dateKey) {
  const { total, done, percent } = getDayProgress(data, dateKey);

  if (total === 0 || done === 0) {
    return null;
  }

  if (percent === 100) {
    return FRIENDS_ASSETS.bunny;
  }

  return getFriendsSceneImage(dateKey);
}

const KUROMI_ASSETS = {
  celebrate: "assets/kuromi/celebrate.png",
};

const KUROMI_SCENE_POOL = [
  "assets/kuromi/scene-01.png",
  "assets/kuromi/scene-02.png",
  "assets/kuromi/scene-03.png",
  "assets/kuromi/scene-04.png",
  "assets/kuromi/scene-05.png",
];

function getKuromiSceneImage(dateKey, salt = 0) {
  const index = getFriendsSceneHash(dateKey, salt) % KUROMI_SCENE_POOL.length;
  return KUROMI_SCENE_POOL[index];
}

function getKuromiCalendarPhoto(data, dateKey) {
  const { total, done, percent } = getDayProgress(data, dateKey);

  if (total === 0 || done === 0) {
    return null;
  }

  if (percent === 100) {
    return KUROMI_ASSETS.celebrate;
  }

  return getKuromiSceneImage(dateKey);
}

const GINTAMA_ASSETS = {
  hero: "assets/gintama/banner.png",
  celebrate: "assets/gintama/celebrate.png",
};

const GINTAMA_SCENE_POOL = [
  "assets/gintama/scene-01.png",
  "assets/gintama/scene-02.png",
  "assets/gintama/scene-03.png",
  "assets/gintama/scene-04.png",
  "assets/gintama/scene-05.png",
  "assets/gintama/scene-06.png",
  "assets/gintama/scene-07.png",
  "assets/gintama/scene-08.png",
  "assets/gintama/scene-09.png",
  "assets/gintama/scene-10.png",
  "assets/gintama/scene-11.png",
  "assets/gintama/scene-12.png",
  "assets/gintama/scene-13.png",
  "assets/gintama/scene-14.png",
  "assets/gintama/scene-15.png",
  "assets/gintama/scene-16.png",
  "assets/gintama/scene-17.png",
  "assets/gintama/scene-18.png",
  "assets/gintama/scene-19.png",
  "assets/gintama/scene-20.png",
];

function getGintamaSceneImage(dateKey, salt = 0) {
  const index = getFriendsSceneHash(dateKey, salt) % GINTAMA_SCENE_POOL.length;
  return GINTAMA_SCENE_POOL[index];
}

const TOOTHLESS_ASSETS = {
  hero: "assets/toothless/banner.png",
  celebrate: "assets/toothless/celebrate.png",
};

const TOOTHLESS_SCENE_POOL = [
  "assets/toothless/scene-01.png",
  "assets/toothless/scene-02.png",
  "assets/toothless/scene-03.png",
  "assets/toothless/scene-04.png",
  "assets/toothless/scene-05.png",
  "assets/toothless/scene-06.png",
  "assets/toothless/scene-07.png",
  "assets/toothless/scene-08.png",
  "assets/toothless/scene-09.png",
  "assets/toothless/scene-10.png",
  "assets/toothless/scene-11.png",
  "assets/toothless/scene-12.png",
  "assets/toothless/scene-13.png",
  "assets/toothless/scene-14.png",
  "assets/toothless/scene-15.png",
  "assets/toothless/scene-16.png",
  "assets/toothless/scene-17.png",
  "assets/toothless/scene-18.png",
  "assets/toothless/scene-19.png",
  "assets/toothless/scene-20.png",
];

function getToothlessSceneImage(dateKey, salt = 0) {
  const index = getFriendsSceneHash(dateKey, salt) % TOOTHLESS_SCENE_POOL.length;
  return TOOTHLESS_SCENE_POOL[index];
}
