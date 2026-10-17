import React from 'react';
import type { Project, ProjectInput } from '../../../types';
import { api } from '../../../lib/api';
import { useI18n } from '../../../i18n/LanguageContext';
import { useFormState } from '../../../hooks/useFormState';
import { FormField } from '../../../components/form/FormField';
import { BilingualField } from '../../../components/form/BilingualField';
import { useAdminMutation } from '../useAdminMutation';

interface ProjectFormProps {
  /** Project being edited; omit to create a new one. */
  project?: Project;
  onDone: () => void;
}

type ProjectFormValues = Omit<ProjectInput, 'techStack'> & { techStack: string };

function toFormValues(locale: string, project?: Project): ProjectFormValues {
  return {
    title: project?.title ?? '',
    summaryEs: project?.summaryEs ?? '',
    summaryEn: project?.summaryEn ?? '',
    techStack: project?.techStack.join(', ') ?? '',
    repoUrl: project?.repoUrl ?? '',
    liveUrl: project?.liveUrl ?? '',
    featured: project?.featured ?? true,
    completedDate:
      project?.completedDate ??
      new Date().toLocaleDateString(locale, { month: 'short', year: 'numeric' }),
  };
}

function toInput(values: ProjectFormValues): ProjectInput {
  return {
    ...values,
    techStack: values.techStack
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean),
  };
}

export const ProjectForm: React.FC<ProjectFormProps> = ({ project, onDone }) => {
  const { t, locale } = useI18n();
  const copy = t.admin.projects;
  const { values, setField } = useFormState(toFormValues(locale, project));
  const { run, isBusy, error } = useAdminMutation();
  const missingSummary = !values.summaryEs.trim() && !values.summaryEn.trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (missingSummary) return;
    const input = toInput(values);
    const ok = await run((key) =>
      project ? api.updateProject(project.id, input, key) : api.createProject(input, key),
    );
    if (ok) onDone();
  };

  return (
    <form onSubmit={handleSubmit} className="admin-form">
      <div className="form-row">
        <FormField label={copy.fields.title}>
          <input
            type="text"
            value={values.title}
            onChange={(e) => setField('title', e.target.value)}
            placeholder={copy.placeholders.title}
            required
          />
        </FormField>
        <FormField label={copy.fields.date}>
          <input
            type="text"
            value={values.completedDate}
            onChange={(e) => setField('completedDate', e.target.value)}
            placeholder={copy.placeholders.date}
          />
        </FormField>
      </div>

      <BilingualField
        label={copy.fields.summary}
        es={values.summaryEs}
        en={values.summaryEn}
        onChange={(lang, value) => setField(lang === 'es' ? 'summaryEs' : 'summaryEn', value)}
        rows={3}
        placeholder={copy.placeholders.summary}
      />
      <p className="admin-hint">{t.admin.bilingualHint}</p>

      <FormField label={copy.fields.stack}>
        <input
          type="text"
          value={values.techStack}
          onChange={(e) => setField('techStack', e.target.value)}
          placeholder="React, TypeScript, NestJS, SQLite"
          required
        />
      </FormField>

      <div className="form-row">
        <FormField label={copy.fields.repo}>
          <input
            type="url"
            value={values.repoUrl}
            onChange={(e) => setField('repoUrl', e.target.value)}
            placeholder="https://github.com/..."
          />
        </FormField>
        <FormField label={copy.fields.live}>
          <input
            type="url"
            value={values.liveUrl}
            onChange={(e) => setField('liveUrl', e.target.value)}
            placeholder="https://..."
          />
        </FormField>
      </div>

      <label className="admin-checkbox">
        <input
          type="checkbox"
          checked={values.featured}
          onChange={(e) => setField('featured', e.target.checked)}
        />
        {copy.featured}
      </label>

      {error && <p className="form-error">{error}</p>}

      <div className="dialog-actions">
        {project && (
          <button type="button" className="btn-ghost" onClick={onDone}>
            {t.admin.cancel}
          </button>
        )}
        <button
          type="submit"
          className="btn-primary-mustard"
          disabled={isBusy || missingSummary}
        >
          {isBusy ? t.admin.saving : project ? t.admin.saveChanges : copy.submit}
        </button>
      </div>
    </form>
  );
};
