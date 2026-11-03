export type Task = { id: number; text: string; completed: boolean; created_at: string };
export type User = { username: string };
export type Session = { user: User | null; csrfToken: string };
let csrfToken = '';
export async function api<T>(path: string, method = 'GET', data?: unknown): Promise<T> {
  const response = await fetch(`/api/${path}`, { method, credentials: 'same-origin', headers: { 'Content-Type': 'application/json', ...(method !== 'GET' ? { 'X-CSRFToken': csrfToken } : {}) }, body: data === undefined ? undefined : JSON.stringify(data) });
  if (response.status === 204) return undefined as T;
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(payload?.detail || (payload ? Object.values(payload).flat().join(' ') : 'Сервер недоступен. Повторите попытку.'));
  if (payload?.csrfToken) csrfToken = payload.csrfToken;
  return payload as T;
}
