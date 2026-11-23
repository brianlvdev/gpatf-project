import { useEffect } from 'react';
export default function DialogAccessibility() {
  useEffect(() => {
    let current: HTMLElement | null = null; let previous: HTMLElement | null = null; const overflow = document.body.style.overflow;
    function sync() { const dialog = document.querySelector<HTMLElement>('.edit-drawer'); if (dialog === current) return; if (!dialog) { current = null; document.body.style.overflow = overflow; previous?.focus(); return; } previous = document.activeElement as HTMLElement; current = dialog; dialog.setAttribute('role','dialog'); dialog.setAttribute('aria-modal','true'); dialog.tabIndex = -1; document.body.style.overflow = 'hidden'; dialog.focus(); }
    const observer = new MutationObserver(sync); observer.observe(document.body,{childList:true,subtree:true}); sync();
    function key(e: KeyboardEvent) { if(!current) return; if(e.key==='Escape') { const close = current.querySelector<HTMLButtonElement>('button[aria-label="Fechar"]'); if(close && !close.disabled) close.click(); } if(e.key==='Tab') { const controls = Array.from(current.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),a[href]')).filter(el=>el.offsetParent!==null); const first=controls[0],last=controls[controls.length-1]; if(!first){e.preventDefault();return;} if(e.shiftKey&&(document.activeElement===first||document.activeElement===current)){e.preventDefault();last.focus();}else if(!e.shiftKey&&(document.activeElement===last||document.activeElement===current)){e.preventDefault();first.focus();} } }
    document.addEventListener('keydown',key);return()=>{observer.disconnect();document.removeEventListener('keydown',key);document.body.style.overflow=overflow;};
  },[]);return null;
}
