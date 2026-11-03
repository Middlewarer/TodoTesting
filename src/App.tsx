import { useEffect, useState, type FormEvent } from 'react';
import { api, type Session, type User } from './api';
import TaskList from './components/TaskList';
import Modal from './components/Modal';
import Appearance from './components/Appearance';
import { loadLocalTasks, saveLocalTasks, plural, type Item } from './storage';

const filters = [['all', 'Все'], ['active', 'В планах'], ['completed', 'Готово']] as const;
type Filter = typeof filters[number][0];
const today = new Intl.DateTimeFormat('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Item[]>(loadLocalTasks);
  const [draft, setDraft] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [dialog, setDialog] = useState<'settings' | 'about' | 'auth' | null>(null);
  const [register, setRegister] = useState(false);
  const [authError, setAuthError] = useState('');
  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const session = await api<Session>('session/');
        const items = session.user ? await api<Item[]>('tasks/') : loadLocalTasks();
        if (active) { setUser(session.user); setTasks(items); }
      } catch { if (active) setError('Сервер недоступен. Сейчас доступен локальный список.'); }
      finally { if (active) setBusy(false); }
    })();
    return () => { active = false; };
  }, []);
  async function change(operation: () => Promise<Item[]>) {
    setBusy(true); setError('');
    try {
      const next = await operation();
      setTasks(next);
      if (!user && !saveLocalTasks(next)) setError('Список изменён, но браузер не разрешил его сохранить.');
    } catch (e) { setError(e instanceof Error ? e.message : 'Не удалось выполнить действие.'); }
    finally { setBusy(false); }
  }
  async function addTask(event: FormEvent) {
    event.preventDefault();
    const text = draft.trim();
    if (!text || busy) return;
    await change(async () => {
      const task = user ? await api<Item>('tasks/', 'POST', { text }) : { id: crypto.randomUUID(), text, completed: false };
      setDraft(''); setFilter('all');
      return [task, ...tasks];
    });
  }
  const toggleTask = (task: Item) => void change(async () => {
    const updated = user ? await api<Item>(`tasks/${task.id}/`, 'PATCH', { completed: !task.completed }) : { ...task, completed: !task.completed };
    return tasks.map(item => item.id === task.id ? updated : item);
  });
  const deleteTask = (task: Item) => void change(async () => {
    if (user) await api(`tasks/${task.id}/`, 'DELETE');
    return tasks.filter(item => item.id !== task.id);
  });
  const clearCompleted = () => change(async () => {
    if (user) await api('tasks/completed/', 'DELETE');
    return tasks.filter(task => !task.completed);
  });
  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setAuthError('');
    const data = new FormData(event.currentTarget);
    try {
      await api<Session>('session/');
      const session = await api<Session>(register ? 'register/' : 'login/', 'POST', Object.fromEntries(data));
      const items = await api<Item[]>('tasks/');
      setUser(session.user); setTasks(items); setError(''); setDialog(null);
    } catch (e) { setAuthError(e instanceof Error ? e.message : 'Не удалось войти.'); }
    finally { setBusy(false); }
  }
  async function signOut() {
    setBusy(true);
    try { await api('logout/', 'POST'); setUser(null); setTasks(loadLocalTasks()); setError(''); }
    catch (e) { setError(e instanceof Error ? e.message : 'Не удалось выйти.'); }
    finally { setBusy(false); }
  }
  const remaining = tasks.filter(task => !task.completed).length;
  const completed = tasks.length - remaining;
  const visible = tasks.filter(task => filter === 'all' || (filter === 'active' ? !task.completed : task.completed));
  return <>
  <main className="app-shell">
    <header className="topbar">
      <a className="brand" href="#" aria-label="тихо — список задач">тихо<span>.</span></a>
      <span className="edition">{user ? user.username : "ЛОКАЛЬНЫЙ СПИСОК"}</span><button className="account-button" onClick={() => user ? void signOut() : setDialog("auth")} disabled={busy}>{user ? "Выйти" : "Войти"}</button>
      <button className="settings-open" id="settings-open" onClick={() => setDialog("settings")} type="button" aria-haspopup="dialog">Оформление <span aria-hidden="true">◐</span></button>
    </header>
    <div className="workspace">
      <aside className="sidebar" aria-label="Обзор списка">
        <div className="sidebar-label">МОЙ СПИСОК</div>
        <div className="overview-number" id="overview-active">{String(remaining).padStart(2, "0")}</div>
        <p className="overview-caption">задач в работе</p>
        <div className="progress-track"><div id="progress-fill" style={{width: `${tasks.length ? completed / tasks.length * 100 : 0}%`}}></div></div>
        <p className="progress-caption" id="progress-caption">{tasks.length ? `${completed} из ${tasks.length} выполнено` : "Начните с одной задачи"}</p>
        <div className="sidebar-bottom"><span className="local-dot"></span> {user ? "Сохранено в вашем аккаунте" : "Хранится в этом браузере"}</div>
      </aside>
      <div className="main-column">
        <section className="intro" aria-labelledby="page-title">
          <div className="date-label">{today}</div>
          <h1 id="page-title">За дело<span>.</span></h1>
          <p className="intro-copy">Всё, что нужно сделать, — в одном месте.</p>
        </section>
    {error && <p className="error-message" role="alert">{error}</p>}<section className="task-board" aria-label="Ваш список дел">
      <form className="task-form" id="task-form" onSubmit={addTask}>
        <label className="sr-only" htmlFor="task-input">Новая задача</label>
        <span className="input-spark" aria-hidden="true">+</span>
        <input id="task-input" value={draft} onChange={event => setDraft(event.target.value)} disabled={busy} name="task" type="text" maxLength={120} placeholder="Запишите задачу…" autoComplete="off" required />
        <button className="add-button" type="submit" disabled={busy || !draft.trim()}><span>Добавить</span><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h12m-5-5 5 5-5 5"/></svg></button>
      </form>

      <div className="list-toolbar">
        <div className="list-heading"><h2>Задачи</h2><span className="task-count" id="task-count">{tasks.length}</span></div>
        <div className="filters" role="group" aria-label="Фильтр задач">{filters.map(([value, label]) => <button key={value} className={`filter-button ${filter === value ? 'is-active' : ''}`} aria-pressed={filter === value} onClick={() => setFilter(value)}>{label}</button>)}</div>
      </div>

      <TaskList tasks={visible} busy={busy} onToggle={toggleTask} onDelete={deleteTask} />
      {visible.length === 0 && <div className="empty-state"><div className="empty-art" aria-hidden="true"><span className="empty-check">✓</span></div><p className="empty-title">{filter === 'active' && tasks.length ? 'План выполнен' : 'Пока здесь свободно'}</p><p className="empty-copy">{filter === 'all' ? 'Добавьте первую задачу — и начнём.' : 'Задач с таким статусом нет.'}</p></div>}
      <footer className="list-footer"><span>{remaining ? `${remaining} ${plural(remaining)} ещё впереди` : tasks.length ? 'Все задачи выполнены — отлично!' : 'На сегодня — чистый лист'}</span>{completed > 0 && <button className="clear-button" disabled={busy} onClick={() => void clearCompleted()}>Удалить выполненные</button>}</footer>
    </section>

      </div>
    </div>
    <footer className="page-footer">
      <span>ТИХО / {user ? "ВАШ ЛИЧНЫЙ СПИСОК" : "МОЖНО БЕЗ РЕГИСТРАЦИИ"}</span>
      <div><button id="about-open" onClick={() => setDialog("about")} type="button">О проекте</button><a href="https://github.com/Middlewarer/TodoTesting" target="_blank" rel="noopener noreferrer">Код на GitHub ↗</a></div>
    </footer>
  </main>

    <Appearance open={dialog === 'settings'} onClose={() => setDialog(null)} />
    <Modal open={dialog === 'about'} onClose={() => setDialog(null)} title="О проекте">
      <p className="dialog-copy">Тестовое задание Алексея. React + TypeScript, Django REST Framework и PostgreSQL в серверном режиме. Разработано с помощью OpenAI Codex.</p>
      <p className="dialog-copy">Без входа задачи хранятся в браузере. После входа открывается отдельный список аккаунта, доступный с разных устройств. Локальные задачи остаются на этом устройстве.</p>
      <a className="source-link" href="https://github.com/Middlewarer/TodoTesting" target="_blank" rel="noopener noreferrer">Код и история изменений ↗</a>
    </Modal>
    <Modal open={dialog === 'auth'} onClose={() => setDialog(null)} title={register ? 'Создать аккаунт' : 'Войти'}>
      <p className="dialog-copy">Войдите, чтобы хранить задачи на сервере. Локальный список останется в этом браузере.</p>
      <form className="auth-form" onSubmit={signIn}>
        <label>Имя пользователя<input name="username" autoComplete="username" maxLength={150} required disabled={busy} /></label>
        <label>Пароль<input name="password" type="password" autoComplete={register ? 'new-password' : 'current-password'} minLength={register ? 8 : undefined} required disabled={busy} /></label>
        {register && <p className="dialog-copy">Не менее 8 символов. Избегайте распространённых паролей и паролей только из цифр.</p>}
        {authError && <p role="alert" className="error-message">{authError}</p>}
        <button className="add-button" disabled={busy}>{busy ? 'Подождите…' : register ? 'Создать аккаунт' : 'Войти'}</button>
        <button type="button" className="reset-design" disabled={busy} onClick={() => { setRegister(!register); setAuthError(''); }}>{register ? 'Уже есть аккаунт' : 'Создать аккаунт'}</button>
      </form>
    </Modal>
  </>;
}

