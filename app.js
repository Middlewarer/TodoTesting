(() => {
  const STORAGE_KEY = "tiho-tasks-v1";
  const form = document.querySelector("#task-form");
  const input = document.querySelector("#task-input");
  const list = document.querySelector("#task-list");
  const count = document.querySelector("#task-count");
  const empty = document.querySelector("#empty-state");
  const emptyTitle = document.querySelector("#empty-title");
  const emptyCopy = document.querySelector("#empty-copy");
  const remainingLabel = document.querySelector("#remaining-label");
  const clearCompleted = document.querySelector("#clear-completed");
  const toast = document.querySelector("#toast");
  let tasks = loadTasks();
  let filter = "all";
  let toastTimer;

  function loadTasks() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      return Array.isArray(saved) ? saved.filter((task) => task && typeof task.id === "string" && typeof task.text === "string" && typeof task.completed === "boolean") : [];
    } catch {
      return [];
    }
  }

  function saveTasks() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch {
      showToast("Не удалось сохранить задачи в этом браузере");
    }
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2600);
  }

  function icon(markup) {
    const template = document.createElement("template");
    template.innerHTML = markup;
    return template.content.firstElementChild;
  }

  function render() {
    const visibleTasks = tasks.filter((task) => filter === "all" || (filter === "active" && !task.completed) || (filter === "completed" && task.completed));
    const remaining = tasks.filter((task) => !task.completed).length;
    const completed = tasks.length - remaining;
    list.replaceChildren();

    for (const task of visibleTasks) {
      const item = document.createElement("li");
      item.className = `task-item${task.completed ? " is-completed" : ""}`;

      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "check-button";
      toggle.setAttribute("aria-label", task.completed ? `Вернуть задачу «${task.text}» в план` : `Отметить «${task.text}» выполненной`);
      toggle.setAttribute("aria-pressed", String(task.completed));
      toggle.append(icon('<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m3.5 8.5 3 3 6-7"/></svg>'));
      toggle.addEventListener("click", () => {
        task.completed = !task.completed;
        saveTasks();
        render();
      });

      const text = document.createElement("span");
      text.className = "task-text";
      text.textContent = task.text;

      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "delete-button";
      remove.setAttribute("aria-label", `Удалить задачу «${task.text}»`);
      remove.append(icon('<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 6h12m-10 0 .7 10h6.6L14 6m-6-2h4m-3 5v4m2-4v4"/></svg>'));
      remove.addEventListener("click", () => {
        tasks = tasks.filter((entry) => entry.id !== task.id);
        saveTasks();
        render();
        showToast("Задача удалена");
      });

      item.append(toggle, text, remove);
      list.append(item);
    }

    count.textContent = String(tasks.length);
    empty.hidden = visibleTasks.length > 0;
    list.hidden = visibleTasks.length === 0;
    clearCompleted.hidden = completed === 0;
    remainingLabel.textContent = tasks.length === 0 ? "На сегодня — чистый лист" : remaining === 0 ? "Все задачи выполнены — отлично!" : `${remaining} ${plural(remaining, "задача", "задачи", "задач")} ещё впереди`;

    if (tasks.length === 0) {
      emptyTitle.textContent = filter === "all" ? "Пока здесь свободно" : "Пока ничего нет";
      emptyCopy.textContent = filter === "all" ? "Добавьте первую задачу — и начнём." : "Измените фильтр или добавьте новую задачу.";
    } else if (visibleTasks.length === 0) {
      emptyTitle.textContent = filter === "active" ? "План выполнен" : "Здесь пока пусто";
      emptyCopy.textContent = filter === "active" ? "Отлично! Все задачи уже закрыты." : "Выполненные задачи появятся здесь.";
    }
  }

  function plural(number, one, few, many) {
    const value = number % 100;
    if (value >= 11 && value <= 19) return many;
    const last = number % 10;
    if (last === 1) return one;
    if (last >= 2 && last <= 4) return few;
    return many;
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const text = input.value.trim();
    if (!text) {
      input.focus();
      return;
    }
    tasks.unshift({ id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`, text, completed: false, createdAt: new Date().toISOString() });
    saveTasks();
    filter = "all";
    document.querySelectorAll(".filter-button").forEach((button) => {
      const active = button.dataset.filter === filter;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    render();
    form.reset();
    input.focus();
    showToast("Задача добавлена в список");
  });

  document.querySelectorAll(".filter-button").forEach((button) => button.addEventListener("click", () => {
    filter = button.dataset.filter;
    document.querySelectorAll(".filter-button").forEach((item) => {
      const active = item === button;
      item.classList.toggle("is-active", active);
      item.setAttribute("aria-pressed", String(active));
    });
    render();
  }));

  clearCompleted.addEventListener("click", () => {
    tasks = tasks.filter((task) => !task.completed);
    saveTasks();
    render();
    showToast("Выполненные задачи удалены");
  });

  document.querySelector(".theme-button").addEventListener("click", () => {
    document.body.classList.toggle("dark-theme");
    try { localStorage.setItem("tiho-theme-v1", document.body.classList.contains("dark-theme") ? "dark" : "light"); } catch { /* Theme still works for this session. */ }
  });
  try { if (localStorage.getItem("tiho-theme-v1") === "dark") document.body.classList.add("dark-theme"); } catch { /* Use the default light theme. */ }

  const today = new Intl.DateTimeFormat("ru-RU", { weekday: "long", day: "numeric", month: "long" }).format(new Date());
  document.querySelector("#today-date").textContent = today;
  render();
})();
