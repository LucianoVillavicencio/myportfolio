import React, { useState } from 'react';
import type { CaseStory, CaseStoryInput } from '../../../types';
import { api } from '../../../lib/api';
import { useI18n } from '../../../i18n/LanguageContext';
import { useFormState } from '../../../hooks/useFormState';
import { FormField } from '../../../components/form/FormField';
import { BilingualField } from '../../../components/form/BilingualField';

interface StoryFormProps {
  /** Story being edited; omit to create a new one. */
  story?: CaseStory;
  /** Suggested sort order for a new story. */
  nextOrder: number;
  mutate: (action: (adminKey: string) => Promise<unknown>) => Promise<boolean>;
  onDone: () => void;
}

type StoryFormValues = Omit<CaseStoryInput, 'sortOrder'> & { sortOrder: string };

export const StoryForm: React.FC<StoryFormProps> = ({ story, nextOrder, mutate, onDone }) => {
  const { t } = useI18n();
  const copy = t.admin.support;
  const { values, setField } = useFormState<StoryFormValues>({
    titleEs: story?.titleEs ?? '',
    titleEn: story?.titleEn ?? '',
    bodyEs: story?.bodyEs ?? '',
    bodyEn: story?.bodyEn ?? '',
    sortOrder: String(story?.sortOrder ?? nextOrder),
  });
  const [busy, setBusy] = useState(false);
  const missingTitle = !values.titleEs.trim() && !values.titleEn.trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (missingTitle) return;
    const input: CaseStoryInput = { ...values, sortOrder: Number(values.sortOrder) };
    setBusy(true);
    const ok = await mutate((key) =>
      story ? api.updateCaseStory(story.id, input, key) : api.createCaseStory(input, key),
    );
    setBusy(false);
    if (ok) onDone();
  };

  return (
    <form onSubmit={handleSubmit} className="admin-form">
      <BilingualField
        label={copy.storyFields.title}
        es={values.titleEs}
        en={values.titleEn}
        onChange={(lang, value) => setField(lang === 'es' ? 'titleEs' : 'titleEn', value)}
      />
      <p className="admin-hint">{t.admin.bilingualHint}</p>

      <BilingualField
        label={copy.storyFields.body}
        es={values.bodyEs}
        en={values.bodyEn}
        onChange={(lang, value) => setField(lang === 'es' ? 'bodyEs' : 'bodyEn', value)}
        rows={4}
      />
      <p className="admin-hint">{copy.introHint}</p>

      <FormField label={copy.storyFields.sortOrder}>
        <input
          type="number"
          step={1}
          value={values.sortOrder}
          onChange={(e) => setField('sortOrder', e.target.value)}
          required
        />
      </FormField>
      <p className="admin-hint">{copy.sortOrderHint}</p>

      <div className="dialog-actions">
        {story && (
          <button type="button" className="btn-ghost" onClick={onDone}>
            {t.admin.cancel}
          </button>
        )}
        <button type="submit" className="btn-primary-mustard" disabled={busy || missingTitle}>
          {busy ? t.admin.saving : story ? t.admin.saveChanges : copy.submitStory}
        </button>
      </div>
    </form>
  );
};
