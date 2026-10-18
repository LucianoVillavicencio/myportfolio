import React, { useEffect, useRef, useState } from 'react';
import { useI18n } from '../../i18n/LanguageContext';

export const CopyEmailButton: React.FC<{ email: string }> = ({ email }) => {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  const timer = useRef<number>();

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(email);
    } catch {
      // Clipboard API unavailable: select the visible address so Ctrl+C works
      const link = document.querySelector<HTMLElement>(`a[href="mailto:${email}"]`);
      if (link) {
        const range = document.createRange();
        range.selectNodeContents(link);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
      return;
    }
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button type="button" className="copy-pill" onClick={copy} aria-label={t.footer.copyLabel}>
      <span aria-live="polite">{copied ? t.footer.copied : t.footer.copy}</span>
    </button>
  );
};
