const storageKey = "habit-day-items";

const defaultHabits = [
  { id: makeId(), title: "Drink water", done: false },
  { id: makeId(), title: "Take a 10 minute walk", done: false },
  { id: makeId(), title: "Plan 3 tasks for today", done: false },
];

const habitForm = document.querySelector("#habitForm");
const habitInput = document.querySelector("#habitInput");
const habitList = document.querySelector("#habitList");
const habitTemplate = document.querySelector("#habitTemplate");
const emptyState = document.querySelector("#emptyState");
const summaryText = document.querySelector("#summaryText");
const progressPercent = document.querySelector("#progressPercent");
const resetToday = document.querySelector("#resetToday");
const installPanel = document.querySelector("#installPanel");
const installButton = document.querySelector("#installButton");

let habits = loadHabits();
let installPromptEvent = null;

function makeId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function loadHabits() {
  const saved = localStorage.getItem(storageKey);

  if (!saved) {
    return defaultHabits;
  }

  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : defaultHabits;
  } catch {
    return defaultHabits;
  }
}

function saveHabits() {
  localStorage.setItem(storageKey, JSON.stringify(habits));
}

function renderProgress() {
  const total = habits.length;
  const done = habits.filter((habit) => habit.done).length;
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);

  emptyState.hidden = total > 0;
  progressPercent.textContent = `${percent}%`;

  if (total === 0) {
    summaryText.textContent = "Add one small habit and the day starts to take shape.";
    return;
  }

  if (done === total) {
    summaryText.textContent = `Nice work. You finished all ${total} habits today.`;
    return;
  }

  summaryText.textContent = `${done} of ${total} complete. ${total - done} left for today.`;
}

function renderHabits() {
  habitList.innerHTML = "";

  habits.forEach((habit) => {
    const item = habitTemplate.content.firstElementChild.cloneNode(true);
    const checkButton = item.querySelector(".check-button");
    const deleteButton = item.querySelector(".delete-button");
    const title = item.querySelector("strong");
    const status = item.querySelector("span");

    item.classList.toggle("done", habit.done);
    title.textContent = habit.title;
    status.textContent = habit.done ? "Done" : "Still open";
    checkButton.setAttribute("aria-pressed", String(habit.done));

    checkButton.addEventListener("click", () => {
      habit.done = !habit.done;
      saveHabits();
      renderHabits();
    });

    deleteButton.addEventListener("click", () => {
      habits = habits.filter((itemHabit) => itemHabit.id !== habit.id);
      saveHabits();
      renderHabits();
    });

    habitList.append(item);
  });

  renderProgress();
}

habitForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const title = habitInput.value.trim();

  if (!title) {
    habitInput.focus();
    return;
  }

  habits = [{ id: makeId(), title, done: false }, ...habits];
  habitInput.value = "";
  saveHabits();
  renderHabits();
});

resetToday.addEventListener("click", () => {
  habits = habits.map((habit) => ({ ...habit, done: false }));
  saveHabits();
  renderHabits();
});

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  installPromptEvent = event;

  if (installPanel) {
    installPanel.hidden = false;
  }
});

if (installButton) {
  installButton.addEventListener("click", async () => {
    if (!installPromptEvent) {
      return;
    }

    installPromptEvent.prompt();
    await installPromptEvent.userChoice;
    installPromptEvent = null;

    if (installPanel) {
      installPanel.hidden = true;
    }
  });
}

window.addEventListener("appinstalled", () => {
  installPromptEvent = null;

  if (installPanel) {
    installPanel.hidden = true;
  }
});

if ("serviceWorker" in navigator && location.protocol !== "file:") {
  navigator.serviceWorker.register("./sw.js").catch(() => {});
}

renderHabits();
