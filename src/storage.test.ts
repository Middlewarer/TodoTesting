import { describe, expect, it } from 'vitest';
import { parseTasks, plural } from './storage';
describe('existing local data migration', () => {
  it('preserves tasks from the original static app', () => { const old = [{ id: 'original', text: 'Моя задача', completed: true, createdAt: '2026-11-03' }]; expect(parseTasks(JSON.stringify(old))).toEqual(old); });
  it('rejects malformed storage without crashing', () => { expect(parseTasks('{broken')).toEqual([]); expect(parseTasks('{}')).toEqual([]); expect(parseTasks('[null, {"id":"1"}]')).toEqual([]); });
  it('retains untrusted text as text data', () => { expect(parseTasks('[{"id":"x","text":"<img onerror=alert(1)>","completed":false}]')[0].text).toContain('<img'); });
});
it('uses correct Russian task forms', () => { expect([1,2,5,11,21,22,112].map(plural)).toEqual(['задача','задачи','задач','задач','задача','задачи','задач']); });
