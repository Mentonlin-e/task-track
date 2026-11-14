const STORAGE_KEY = "task-tracker-tasks";

const form = document.querySelector("#task-form");
const input = document.querySelector("#task-input");
const taskList = document.querySelector("#task-list");
const taskCount = document.querySelector("#task-count");
const emptyState = document.querySelector("#empty-state");
const chart = document.querySelector("#chart");
const chartTotal = document.querySelector("#chart-total");
const todayElement = document.querySelector("#today");

let tasks = loadTasks();

function loadTasks() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function dateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function renderTasks() {
  taskList.replaceChildren();

  for (const task of tasks) {
    const item = document.createElement("li");
    item.className = `task-item${task.completed ? " completed" : ""}`;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.completed;
    checkbox.setAttribute("aria-label", `Отметить задачу «${task.text}»`);
    checkbox.addEventListener("change", () => toggleTask(task.id));

    const text = document.createElement("span");
    text.className = "task-text";
    text.textContent = task.text;

    const deleteButton = document.createElement("button");
    deleteButton.className = "delete-button";
    deleteButton.type = "button";
    deleteButton.textContent = "Удалить";
    deleteButton.setAttribute("aria-label", `Удалить задачу «${task.text}»`);
    deleteButton.addEventListener("click", () => deleteTask(task.id));

    item.append(checkbox, text, deleteButton);
    taskList.append(item);
  }

  const activeTasks = tasks.filter((task) => !task.completed).length;
  taskCount.textContent = `${activeTasks} ${pluralize(activeTasks, "задача", "задачи", "задач")}`;
  emptyState.hidden = tasks.length !== 0;

  renderChart();
}

function pluralize(number, one, few, many) {
  const lastTwo = number % 100;
  const last = number % 10;

  if (lastTwo >= 11 && lastTwo <= 14) return many;
  if (last === 1) return one;
  if (last >= 2 && last <= 4) return few;
  return many;
}

function addTask(text) {
  tasks.unshift({
    id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
    text,
    completed: false,
    completedAt: null
  });

  saveTasks();
  renderTasks();
}

function toggleTask(id) {
  const task = tasks.find((item) => item.id === id);
  if (!task) return;

  task.completed = !task.completed;
  task.completedAt = task.completed ? dateKey(new Date()) : null;

  saveTasks();
  renderTasks();
}

function deleteTask(id) {
  tasks = tasks.filter((task) => task.id !== id);
  saveTasks();
  renderTasks();
}

function renderChart() {
  const today = new Date();
  const days = [];

  for (let offset = 6; offset >= 0; offset--) {
    const date = new Date(today);
    date.setDate(today.getDate() - offset);

    const key = dateKey(date);
    const count = tasks.filter(
      (task) => task.completed && task.completedAt === key
    ).length;

    days.push({ date, key, count });
  }

  const maxCount = Math.max(...days.map((day) => day.count), 1);
  const total = days.reduce((sum, day) => sum + day.count, 0);

  chartTotal.textContent = total;
  chart.replaceChildren();

  for (const day of days) {
    const isToday = day.key === dateKey(today);
    const column = document.createElement("div");
    column.className = "chart-day";
    column.title = `${day.date.toLocaleDateString("ru-RU")}: ${day.count}`;

    const value = document.createElement("span");
    value.className = "bar-value";
    value.textContent = day.count;

    const barArea = document.createElement("div");
    barArea.className = "bar-area";

    const bar = document.createElement("div");
    bar.className = `bar${isToday ? " today" : ""}`;
    bar.style.height = `${Math.max((day.count / maxCount) * 100, 4)}%`;

    const label = document.createElement("span");
    label.className = `day-label${isToday ? " today" : ""}`;
    label.textContent = new Intl.DateTimeFormat("ru-RU", {
      weekday: "short"
    }).format(day.date).replace(".", "");

    barArea.append(bar);
    column.append(value, barArea, label);
    chart.append(column);
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const text = input.value.trim();
  if (!text) return;

  addTask(text);
  form.reset();
  input.focus();
});

todayElement.textContent = new Intl.DateTimeFormat("ru-RU", {
  weekday: "long",
  day: "numeric",
  month: "long"
}).format(new Date());

renderTasks();