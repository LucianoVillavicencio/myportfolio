import React from 'react';
import { useI18n } from '../../i18n/LanguageContext';

interface BilingualFieldProps {
  label: string;
  es: string;
  en: string;
  onChange: (lang: 'es' | 'en', value: string) => void;
  /** Renders a textarea with this many rows instead of a single-line input. */
  rows?: number;
  placeholder?: string;
}

/** Side-by-side Spanish/English inputs for one translatable field. */
export const BilingualField: React.FC<BilingualFieldProps> = ({
  label,
  es,
  en,
  onChange,
  rows,
  placeholder,
}) => {
  const { t } = useI18n();
  const values = { es, en };

  return (
    <fieldset className="bilingual-field">
      <legend>{label}</legend>
      <div className="form-row">
        {(['es', 'en'] as const).map((lang) => {
          const props = {
            value: values[lang],
            lang,
            placeholder,
            'aria-label': `${label} (${lang.toUpperCase()})`,
            onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
              onChange(lang, e.target.value),
          };
          return (
            <label key={lang} className="form-field">
              <span className="lang-tag">{lang === 'es' ? t.admin.spanish : t.admin.english}</span>
              {rows ? <textarea rows={rows} {...props} /> : <input type="text" {...props} />}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
};
