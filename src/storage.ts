export type Item = { id: string | number; text: string; completed: boolean };
export const TASK_KEY = 'tiho-tasks-v1';
export function parseTasks(raw: string | null): Item[] {
  try {
    const value: unknown = JSON.parse(raw || '[]');
    return Array.isArray(value) ? value.filter((task): task is Item => !!task && (typeof task.id === 'string' || typeof task.id === 'number') && typeof task.text === 'string' && typeof task.completed === 'boolean') : [];
  } catch { return []; }
}
export function loadLocalTasks(): Item[] { try { return parseTasks(localStorage.getItem(TASK_KEY)); } catch { return []; } }
export function saveLocalTasks(tasks: Item[]): boolean { try { localStorage.setItem(TASK_KEY, JSON.stringify(tasks)); return true; } catch { return false; } }
export function plural(n: number): string { if (n % 100 >= 11 && n % 100 <= 19) return 'задач'; return n % 10 === 1 ? 'задача' : n % 10 >= 2 && n % 10 <= 4 ? 'задачи' : 'задач'; }
export const defaults = { palette: 'chalk', typeface: 'sans', density: 'roomy' };
export type Design = typeof defaults;
export const choices = { palette: [['chalk', 'Мел'], ['ink', 'Графит'], ['sand', 'Песок']], typeface: [['sans', 'Строгий'], ['serif', 'Книжный'], ['mono', 'Технический']], density: [['roomy', 'Свободно'], ['compact', 'Компактно']] };
export function loadDesign(): Design {
  const design = { ...defaults };
  try {
    const saved = JSON.parse(localStorage.getItem('tiho-design-v1') || 'null');
    if (saved && typeof saved === 'object') {
      for (const key of Object.keys(defaults) as (keyof Design)[]) if (choices[key].some(([value]) => value === saved[key])) design[key] = saved[key];
    } else if (localStorage.getItem('tiho-theme-v1') === 'dark') design.palette = 'ink';
  } catch { /* Invalid preferences fall back to defaults. */ }
  return design;
}
