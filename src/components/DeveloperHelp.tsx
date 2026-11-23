import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Code2, X, Instagram, MessageCircle } from 'lucide-react';

export default function DeveloperHelp({ onOpen }: { onOpen?: () => void }) {
  const [open, setOpen] = useState(false);
  return <>
    <button type="button" className="developer-help" onClick={() => { onOpen?.(); setOpen(true); }}>
      <Code2 size={21} aria-hidden="true" />
      <span><strong>Precisou de ajuda?</strong><small>Fale com o dev</small></span>
    </button>
    {open && createPortal(<>
      <button className="drawer-backdrop" aria-label="Fechar contato do desenvolvedor" onClick={() => setOpen(false)} />
      <section className="edit-drawer developer-dialog" role="dialog" aria-modal="true" aria-labelledby="developer-title">
        <header className="drawer-header"><div><p className="eyebrow">Suporte ao site GPATF</p><h2 id="developer-title">Fale com o dev</h2></div><button className="icon-button" onClick={() => setOpen(false)} aria-label="Fechar"><X size={22} /></button></header>
        <div className="developer-identity"><div className="team-initial">BV</div><div><h3>Brian Vianna</h3><p>Desenvolvedor do site</p></div></div>
        <p className="muted-text">Escolha como entrar em contato para tirar dúvidas ou relatar um problema.</p>
        <a className="developer-contact" href="https://www.instagram.com/brianl.vianna/" target="_blank" rel="noopener noreferrer"><Instagram size={22} /><span><strong>Instagram</strong><small>@brianl.vianna</small></span></a>
        <a className="developer-contact" href="https://wa.me/553187069488" target="_blank" rel="noopener noreferrer"><MessageCircle size={22} /><span><strong>WhatsApp</strong><small>+55 (31) 8706-9488</small></span></a>
      </section>
    </>, document.body)}
  </>;
}
