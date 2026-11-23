import { useEffect, useRef, useState } from 'react';

export function useSmoothView<T extends string>(initial: T) {
  const [view, setView] = useState<T>(initial);
  const [loading, setLoading] = useState(false);
  const timer = useRef<number | null>(null);
  useEffect(() => () => { if (timer.current !== null) window.clearTimeout(timer.current); }, []);

  function navigate(next: T) {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = null;
    if (next === view) { setLoading(false); return; }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setView(next); setLoading(false); return;
    }
    setLoading(true);
    timer.current = window.setTimeout(() => {
      timer.current = null;
      setView(next);
      setLoading(false);
    }, 420);
  }
  return { view, loading, navigate };
}
