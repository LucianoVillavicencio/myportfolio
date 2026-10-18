import React, { useState } from 'react';
import { useAdminAuth } from '../../../context/AdminAuthContext';
import { ImageListField } from '../../../components/form/ImageListField';
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
    slug: project?.slug ?? '',
    problemEs: project?.problemEs ?? '',
    problemEn: project?.problemEn ?? '',
    roleEs: project?.roleEs ?? '',
    roleEn: project?.roleEn ?? '',
    decisionsEs: project?.decisionsEs ?? '',
    decisionsEn: project?.decisionsEn ?? '',
    resultsEs: project?.resultsEs ?? '',
    resultsEn: project?.resultsEn ?? '',
    images: project?.images ?? [],
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
  const { adminKey } = useAdminAuth();
  const [uploading, setUploading] = useState(false);
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

      <fieldset className="bilingual-field">
        <legend>{copy.caseStudy.legend}</legend>
        <p className="admin-hint">{copy.caseStudy.hint}</p>
        {(
          [
            ['problem', copy.caseStudy.problem],
            ['role', copy.caseStudy.role],
            ['decisions', copy.caseStudy.decisions],
            ['results', copy.caseStudy.results],
          ] as const
        ).map(([name, label]) => (
          <BilingualField
            key={name}
            label={label}
            es={values[`${name}Es`]}
            en={values[`${name}En`]}
            onChange={(lang, value) => setField(lang === 'es' ? `${name}Es` : `${name}En`, value)}
            rows={4}
          />
        ))}
        <FormField label={copy.caseStudy.slug}>
          <input
            type="text"
            value={values.slug}
            onChange={(e) => setField('slug', e.target.value)}
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            placeholder="my-project"
          />
        </FormField>
        <p className="admin-hint">{copy.caseStudy.slugHint}</p>
      </fieldset>

      <ImageListField
        value={values.images}
        onChange={(urls) => setField('images', urls)}
        max={8}
        adminKey={adminKey ?? ''}
        onBusyChange={setUploading}
      />

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
          disabled={isBusy || uploading || missingSummary}
        >
          {isBusy ? t.admin.saving : project ? t.admin.saveChanges : copy.submit}
        </button>
      </div>
    </form>
  );
};
