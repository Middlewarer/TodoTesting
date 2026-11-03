import { useEffect, useState } from 'react';
import Modal from './Modal';
import { choices, defaults, loadDesign, type Design } from '../storage';
export default function Appearance({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [design, setDesign] = useState(loadDesign);
  const [error, setError] = useState('');
  useEffect(() => { for (const key of Object.keys(design) as (keyof Design)[]) document.body.dataset[key] = design[key]; }, [design]);
  function change(next: Design) {
    setDesign(next); setError('');
    try { localStorage.setItem('tiho-design-v1', JSON.stringify(next)); }
    catch { setError('Не удалось сохранить оформление в браузере.'); }
  }
  const labels = { palette: 'Палитра', typeface: 'Характер', density: 'Плотность списка' };
  return <Modal open={open} onClose={onClose} title="Ваше пространство">
    <p className="dialog-copy">Настройте под себя. Выбор сохранится в этом браузере.</p>
    {(Object.keys(choices) as (keyof Design)[]).map(key => <fieldset key={key}><legend>{labels[key]}</legend><div className={key === 'palette' ? 'palette-options' : 'setting-options'}>
      {choices[key].map(([value, label]) => <button type="button" key={value} aria-pressed={design[key] === value} onClick={() => change({ ...design, [key]: value })}>{key === 'palette' && <span className={`palette-sample ${value}`} />}{label}</button>)}
    </div></fieldset>)}
    {error && <p role="alert" className="error-message">{error}</p>}
    <button className="reset-design" onClick={() => change({ ...defaults })}>Вернуть исходный вид</button>
  </Modal>;
}
