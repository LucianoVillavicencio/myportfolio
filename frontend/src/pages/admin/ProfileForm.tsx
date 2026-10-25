import React, { useState } from 'react';
import type { Profile, ProfileInput } from '../../types';
import { api } from '../../lib/api';
import { useI18n } from '../../i18n/LanguageContext';
import { useFormState } from '../../hooks/useFormState';
import { FormField } from '../../components/form/FormField';
import { BilingualField } from '../../components/form/BilingualField';
import { useAdminMutation } from './useAdminMutation';

function toFormValues(profile: Profile): ProfileInput {
  return {
    ...profile,
    githubUrl: profile.githubUrl ?? '',
    linkedinUrl: profile.linkedinUrl ?? '',
    instagramUrl: profile.instagramUrl ?? '',
    readingGoal: profile.readingGoal == null ? '' : String(profile.readingGoal),
  };
}

const PROFILE_FIELDS: (keyof ProfileInput)[] = [
  'name',
  'location',
  'rolesEs',
  'rolesEn',
  'leadHighlightEs',
  'leadHighlightEn',
  'leadTextEs',
  'leadTextEn',
  'availabilityEs',
  'availabilityEn',
  'stack',
  'email',
  'githubUrl',
  'linkedinUrl',
  'instagramUrl',
  'readingGoal',
];

/** Translatable profile fields, as the base name shared by their Es/En pair. */
type BilingualKey = 'roles' | 'leadHighlight' | 'leadText' | 'availability';

export const ProfileForm: React.FC<{ profile: Profile }> = ({ profile }) => {
  const { t } = useI18n();
  const labels = t.admin.profile.fields;
  const { values, setField } = useFormState(toFormValues(profile));
  const { run, isBusy, error } = useAdminMutation();
  const [saved, setSaved] = useState(false);

  const update = (key: keyof ProfileInput, value: string) => {
    setSaved(false);
    setField(key, value);
  };

  const text = (key: keyof ProfileInput) => ({
    value: values[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => update(key, e.target.value),
  });

  const bilingual = (key: BilingualKey, rows?: number) => (
    <BilingualField
      label={labels[key]}
      es={values[`${key}Es`]}
      en={values[`${key}En`]}
      onChange={(lang, value) => update(`${key}${lang === 'es' ? 'Es' : 'En'}`, value)}
      rows={rows}
    />
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Only send known fields (the API rejects extras like id/updatedAt)
    const input = Object.fromEntries(
      PROFILE_FIELDS.map((key) => [key, values[key]]),
    ) as ProfileInput;
    setSaved(await run((key) => api.updateProfile(input, key)));
  };

  return (
    <section className="admin-panel admin-panel--wide">
      <h2 className="admin-panel-title">{t.admin.profile.title}</h2>
      <form onSubmit={handleSubmit} className="admin-form">
        <div className="form-row">
          <FormField label={labels.name}>
            <input type="text" required {...text('name')} />
          </FormField>
          <FormField label={labels.location}>
            <input type="text" {...text('location')} />
          </FormField>
        </div>

        <p className="admin-hint">{t.admin.bilingualHint}</p>
        {bilingual('roles', 2)}
        {bilingual('leadHighlight')}
        {bilingual('leadText', 3)}
        {bilingual('availability')}

        <FormField label={labels.stack}>
          <input type="text" {...text('stack')} />
        </FormField>

        <div className="form-row">
          <FormField label={labels.email}>
            <input type="email" {...text('email')} />
          </FormField>
          <FormField label={labels.github}>
            <input type="url" {...text('githubUrl')} />
          </FormField>
          <FormField label={labels.linkedin}>
            <input type="url" {...text('linkedinUrl')} />
          </FormField>
          <FormField label={labels.instagram}>
            <input type="url" {...text('instagramUrl')} />
          </FormField>
          <FormField label={labels.readingGoal}>
            <input type="number" min={1} max={500} step={1} {...text('readingGoal')} />
          </FormField>
        </div>

        {error && <p className="form-error">{error}</p>}
        {saved && <p className="form-success">{t.admin.profile.saved}</p>}

        <div className="dialog-actions">
          <button type="submit" className="btn-primary-mustard" disabled={isBusy}>
            {isBusy ? t.admin.saving : t.admin.profile.submit}
          </button>
        </div>
      </form>
    </section>
  );
};
