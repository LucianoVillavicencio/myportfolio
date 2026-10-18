import React, { useState } from 'react';
import type { SupportCard, SupportCardInput } from '../../../types';
import { api } from '../../../lib/api';
import { useI18n } from '../../../i18n/LanguageContext';
import { useFormState } from '../../../hooks/useFormState';
import { BilingualField } from '../../../components/form/BilingualField';
import { useAdminMutation } from '../useAdminMutation';

interface CardFormProps {
  card: SupportCard;
  /** Refreshes the tab's data after a successful save. */
  onSaved: () => Promise<void>;
}

function toFormValues(card: SupportCard): SupportCardInput {
  return {
    enabled: card.enabled,
    titleEs: card.titleEs,
    titleEn: card.titleEn,
    introEs: card.introEs,
    introEn: card.introEn,
    offeringsEs: card.offeringsEs,
    offeringsEn: card.offeringsEn,
    areaEs: card.areaEs,
    areaEn: card.areaEn,
  };
}

type TextBase = 'title' | 'intro' | 'offerings' | 'area';

export const CardForm: React.FC<CardFormProps> = ({ card, onSaved }) => {
  const { t } = useI18n();
  const copy = t.admin.support;
  const { values, setField } = useFormState(toFormValues(card));
  const [saved, setSaved] = useState(false);
  const { run, isBusy, error } = useAdminMutation();
  const missingTitle = values.enabled && !values.titleEs.trim() && !values.titleEn.trim();

  const bilingual = (base: TextBase) => ({
    es: values[`${base}Es`],
    en: values[`${base}En`],
    onChange: (lang: 'es' | 'en', value: string) => {
      setSaved(false);
      setField(`${base}${lang === 'es' ? 'Es' : 'En'}`, value);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (missingTitle) return;
    const ok = await run((key) => api.updateSupportCard(values, key));
    if (ok) await onSaved();
    setSaved(ok);
  };

  return (
    <form onSubmit={handleSubmit} className="admin-form">
      <label className="admin-checkbox">
        <input
          type="checkbox"
          checked={values.enabled}
          onChange={(e) => {
            setSaved(false);
            setField('enabled', e.target.checked);
          }}
        />
        {copy.enabled}
      </label>
      {!values.enabled && <p className="admin-hint">{copy.disabledHint}</p>}

      <BilingualField label={copy.fields.title} {...bilingual('title')} />
      <p className="admin-hint">{t.admin.bilingualHint}</p>

      <BilingualField label={copy.fields.intro} {...bilingual('intro')} rows={4} />
      <p className="admin-hint">{copy.introHint}</p>

      <BilingualField label={copy.fields.offerings} {...bilingual('offerings')} rows={5} />
      <p className="admin-hint">{copy.offeringsHint}</p>

      <BilingualField label={copy.fields.area} {...bilingual('area')} />

      {error && <p className="form-error">{error}</p>}
      {saved && !error && (
        <p className="admin-hint" role="status">
          {copy.cardSaved}
        </p>
      )}

      <div className="dialog-actions">
        <button type="submit" className="btn-primary-mustard" disabled={isBusy || missingTitle}>
          {isBusy ? t.admin.saving : copy.saveCard}
        </button>
      </div>
    </form>
  );
};
