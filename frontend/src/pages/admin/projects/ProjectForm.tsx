import React from 'react';
import type { Project, ProjectInput } from '../../../types';
import { api } from '../../../lib/api';
import { useFormState } from '../../../hooks/useFormState';
import { FormField } from '../../../components/form/FormField';
import { useAdminMutation } from '../useAdminMutation';

interface ProjectFormProps {
  /** Project being edited; omit to create a new one. */
  project?: Project;
  onDone: () => void;
}

type ProjectFormValues = Omit<ProjectInput, 'techStack'> & { techStack: string };

function toFormValues(project?: Project): ProjectFormValues {
  return {
    title: project?.title ?? '',
    summary: project?.summary ?? '',
    techStack: project?.techStack.join(', ') ?? '',
    repoUrl: project?.repoUrl ?? '',
    liveUrl: project?.liveUrl ?? '',
    featured: project?.featured ?? true,
    completedDate:
      project?.completedDate ??
      new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
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
  const { values, setField } = useFormState(toFormValues(project));
  const { run, isBusy, error } = useAdminMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const input = toInput(values);
    const ok = await run((key) =>
      project ? api.updateProject(project.id, input, key) : api.createProject(input, key),
    );
    if (ok) onDone();
  };

  return (
    <form onSubmit={handleSubmit} className="admin-form">
      <div className="form-row">
        <FormField label="Title">
          <input
            type="text"
            value={values.title}
            onChange={(e) => setField('title', e.target.value)}
            placeholder="e.g. Distributed Queue Engine"
            required
          />
        </FormField>
        <FormField label="Date / timeline">
          <input
            type="text"
            value={values.completedDate}
            onChange={(e) => setField('completedDate', e.target.value)}
            placeholder="e.g. Oct 2026"
          />
        </FormField>
      </div>

      <FormField label="Summary">
        <textarea
          rows={3}
          value={values.summary}
          onChange={(e) => setField('summary', e.target.value)}
          placeholder="What you built and why it matters..."
          required
        />
      </FormField>

      <FormField label="Tech stack (comma separated)">
        <input
          type="text"
          value={values.techStack}
          onChange={(e) => setField('techStack', e.target.value)}
          placeholder="React, TypeScript, NestJS, SQLite"
          required
        />
      </FormField>

      <div className="form-row">
        <FormField label="Repository URL (optional)">
          <input
            type="url"
            value={values.repoUrl}
            onChange={(e) => setField('repoUrl', e.target.value)}
            placeholder="https://github.com/..."
          />
        </FormField>
        <FormField label="Live demo URL (optional)">
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
        Featured — list this project first
      </label>

      {error && <p className="form-error">{error}</p>}

      <div className="dialog-actions">
        {project && (
          <button type="button" className="btn-ghost" onClick={onDone}>
            Cancel
          </button>
        )}
        <button type="submit" className="btn-primary-mustard" disabled={isBusy}>
          {isBusy ? 'Saving...' : project ? 'Save changes' : 'Publish project'}
        </button>
      </div>
    </form>
  );
};
