import { useEffect, useId, useRef, type ReactNode } from 'react';
export default function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  useEffect(() => { const element = ref.current; if (open && !element?.open) element?.showModal(); else if (!open && element?.open) element.close(); }, [open]);
  return <dialog ref={ref} aria-labelledby={id} onCancel={onClose} onClose={onClose} onClick={event => {
    if (event.target !== event.currentTarget) return;
    const rect = event.currentTarget.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onClose();
  }}>
    <div className="dialog-header"><h2 id={id}>{title}</h2><button className="close-button" type="button" aria-label="Закрыть окно" onClick={onClose}>×</button></div>
    {children}
  </dialog>;
}
