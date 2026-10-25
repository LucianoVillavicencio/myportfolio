import React from 'react';
import { TIMELINE_KINDS } from '../../../types';
import type { TimelineEntry, TimelineInput } from '../../../types';
import { api } from '../../../lib/api';
import { useI18n } from '../../../i18n/LanguageContext';
import { useFormState } from '../../../hooks/useFormState';
import { FormField } from '../../../components/form/FormField';
import { BilingualField } from '../../../components/form/BilingualField';
import { useAdminMutation } from '../useAdminMutation';

interface TimelineFormProps {
  /** Entry being edited; omit to create a new one. */
  entry?: TimelineEntry;
  onDone: () => void;
}

type TimelineFormValues = Omit<TimelineInput, 'sortYear'> & { sortYear: string };

function toFormValues(entry?: TimelineEntry): TimelineFormValues {
  return {
    kind: entry?.kind ?? 'education',
    period: entry?.period ?? '',
    sortYear: String(entry?.sortYear ?? new Date().getFullYear()),
    titleEs: entry?.titleEs ?? '',
    titleEn: entry?.titleEn ?? '',
    descriptionEs: entry?.descriptionEs ?? '',
    descriptionEn: entry?.descriptionEn ?? '',
  };
}

export const TimelineForm: React.FC<TimelineFormProps> = ({ entry, onDone }) => {
  const { t } = useI18n();
  const copy = t.admin.timeline;
  const { values, setField } = useFormState(toFormValues(entry));
  const { run, isBusy, error } = useAdminMutation();
  const missingTitle = !values.titleEs.trim() && !values.titleEn.trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (missingTitle) return;
    const input: TimelineInput = { ...values, sortYear: Number(values.sortYear) };
    const ok = await run((key) =>
      entry ? api.updateTimelineEntry(entry.id, input, key) : api.createTimelineEntry(input, key),
    );
    if (ok) onDone();
  };

  return (
    <form onSubmit={handleSubmit} className="admin-form">
      <FormField label={copy.fields.kind}>
        <select
          value={values.kind}
          onChange={(e) => setField('kind', e.target.value as TimelineInput['kind'])}
        >
          {TIMELINE_KINDS.map((kind) => (
            <option key={kind} value={kind}>
              {t.timeline.kinds[kind]}
            </option>
          ))}
        </select>
      </FormField>

      <div className="form-row">
        <FormField label={copy.fields.period}>
          <input
            type="text"
            value={values.period}
            onChange={(e) => setField('period', e.target.value)}
            placeholder={copy.placeholders.period}
            required
          />
        </FormField>
        <FormField label={copy.fields.sortYear}>
          <input
            type="number"
            min={1900}
            max={2100}
            step={1}
            value={values.sortYear}
            onChange={(e) => setField('sortYear', e.target.value)}
            required
          />
        </FormField>
      </div>
      <p className="admin-hint">{copy.sortYearHint}</p>

      <BilingualField
        label={copy.fields.title}
        es={values.titleEs}
        en={values.titleEn}
        onChange={(lang, value) => setField(lang === 'es' ? 'titleEs' : 'titleEn', value)}
      />
      <p className="admin-hint">{t.admin.bilingualHint}</p>

      <BilingualField
        label={copy.fields.description}
        es={values.descriptionEs}
        en={values.descriptionEn}
        onChange={(lang, value) =>
          setField(lang === 'es' ? 'descriptionEs' : 'descriptionEn', value)
        }
        rows={4}
      />
      <p className="admin-hint">{copy.descriptionHint}</p>

      {error && <p className="form-error">{error}</p>}

      <div className="dialog-actions">
        {entry && (
          <button type="button" className="btn-ghost" onClick={onDone}>
            {t.admin.cancel}
          </button>
        )}
        <button
          type="submit"
          className="btn-primary-mustard"
          disabled={isBusy || missingTitle}
        >
          {isBusy ? t.admin.saving : entry ? t.admin.saveChanges : copy.submit}
        </button>
      </div>
    </form>
  );
};
