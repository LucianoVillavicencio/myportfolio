import React from 'react';
import { useI18n } from '../../i18n/LanguageContext';
import { LANGUAGES } from '../../i18n/translations';

/** ES / EN segmented switch shown next to the top pills. */
export const LanguageToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { lang, setLang, t } = useI18n();

  return (
    <div className={`lang-toggle ${className}`} role="group" aria-label={t.common.language}>
      {LANGUAGES.map((code) => (
        <button
          key={code}
          type="button"
          lang={code}
          aria-pressed={lang === code}
          className={lang === code ? 'is-on' : ''}
          onClick={() => setLang(code)}
        >
          {code.toUpperCase()}
        </button>
      ))}
    </div>
  );
};
