import type { Item } from '../storage';
type Props = { tasks: Item[]; busy: boolean; onToggle: (task: Item) => void; onDelete: (task: Item) => void };
export default function TaskList({ tasks, busy, onToggle, onDelete }: Props) {
  return <ul className="task-list" aria-label="Задачи" aria-busy={busy}>
    {tasks.map(task => <li key={task.id} className={`task-item ${task.completed ? 'is-completed' : ''}`}>
      <button className="check-button" disabled={busy} onClick={() => onToggle(task)} aria-pressed={task.completed} aria-label={`${task.completed ? 'Вернуть в план' : 'Выполнить'}: ${task.text}`}><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m3.5 8.5 3 3 6-7" /></svg></button>
      <span className="task-text">{task.text}</span>
      <button className="delete-button" disabled={busy} onClick={() => onDelete(task)} aria-label={`Удалить задачу «${task.text}»`}><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 6h12m-10 0 .7 10h6.6L14 6m-6-2h4m-3 5v4m2-4v4" /></svg></button>
    </li>)}
  </ul>;
}
