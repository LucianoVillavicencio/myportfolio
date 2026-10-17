import React, { useState } from 'react';
import type { Profile, ProfileInput } from '../../types';
import { api } from '../../lib/api';
import { useFormState } from '../../hooks/useFormState';
import { FormField } from '../../components/form/FormField';
import { useAdminMutation } from './useAdminMutation';

function toFormValues(profile: Profile): ProfileInput {
  return {
    ...profile,
    githubUrl: profile.githubUrl ?? '',
    linkedinUrl: profile.linkedinUrl ?? '',
    instagramUrl: profile.instagramUrl ?? '',
  };
}

const PROFILE_FIELDS: (keyof ProfileInput)[] = [
  'name',
  'location',
  'roles',
  'leadHighlight',
  'leadText',
  'availability',
  'stack',
  'email',
  'githubUrl',
  'linkedinUrl',
  'instagramUrl',
];

export const ProfileForm: React.FC<{ profile: Profile }> = ({ profile }) => {
  const { values, setField } = useFormState(toFormValues(profile));
  const { run, isBusy, error } = useAdminMutation();
  const [saved, setSaved] = useState(false);

  const text = (key: keyof ProfileInput) => ({
    value: values[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setSaved(false);
      setField(key, e.target.value);
    },
  });

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
      <h2 className="admin-panel-title">PROFILE &amp; CONTACT</h2>
      <form onSubmit={handleSubmit} className="admin-form">
        <div className="form-row">
          <FormField label="Name">
            <input type="text" required {...text('name')} />
          </FormField>
          <FormField label="Location">
            <input type="text" {...text('location')} />
          </FormField>
        </div>

        <FormField label="Roles (one per line)">
          <textarea rows={2} {...text('roles')} />
        </FormField>

        <div className="form-row">
          <FormField label="Intro — bold sentence">
            <input type="text" {...text('leadHighlight')} />
          </FormField>
          <FormField label="Availability status">
            <input type="text" {...text('availability')} />
          </FormField>
        </div>

        <FormField label="Intro — rest of the paragraph">
          <textarea rows={3} {...text('leadText')} />
        </FormField>

        <FormField label="Stack & lab">
          <input type="text" {...text('stack')} />
        </FormField>

        <div className="form-row">
          <FormField label="Email">
            <input type="email" {...text('email')} />
          </FormField>
          <FormField label="GitHub URL">
            <input type="url" {...text('githubUrl')} />
          </FormField>
          <FormField label="LinkedIn URL">
            <input type="url" {...text('linkedinUrl')} />
          </FormField>
          <FormField label="Instagram URL">
            <input type="url" {...text('instagramUrl')} />
          </FormField>
        </div>

        {error && <p className="form-error">{error}</p>}
        {saved && <p className="form-success">Profile saved.</p>}

        <div className="dialog-actions">
          <button type="submit" className="btn-primary-mustard" disabled={isBusy}>
            {isBusy ? 'Saving...' : 'Save profile'}
          </button>
        </div>
      </form>
    </section>
  );
};
