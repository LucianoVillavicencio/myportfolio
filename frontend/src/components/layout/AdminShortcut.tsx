import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/** Alt+A or Ctrl+Shift+A anywhere opens the owner panel. */
export function AdminShortcut() {
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isA = e.key.toLowerCase() === 'a';
      if (isA && (e.altKey || (e.ctrlKey && e.shiftKey))) {
        e.preventDefault();
        navigate('/admin');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navigate]);

  return null;
}
