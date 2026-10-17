import React, { useState } from 'react';
import type { Project } from '../../../types';
import { api } from '../../../lib/api';
import { usePortfolioData } from '../../../context/PortfolioDataContext';
import { useI18n } from '../../../i18n/LanguageContext';
import { useAdminMutation } from '../useAdminMutation';
import { AdminRow, ManagerLayout } from '../ManagerLayout';
import { ProjectForm } from './ProjectForm';

export const ProjectsManager: React.FC = () => {
  const { projects } = usePortfolioData();
  const { t } = useI18n();
  const copy = t.admin.projects;
  const { run, isBusy, error } = useAdminMutation();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);

  const editingProject = projects.find((p) => p.id === editingId);

  const closeForm = () => {
    setEditingId(null);
    setFormKey((k) => k + 1);
  };

  const toggleFeatured = (project: Project) =>
    run((key) => api.updateProject(project.id, { featured: !project.featured }, key));

  const remove = async (project: Project) => {
    if (!window.confirm(t.admin.confirmDelete(project.title))) return;
    const ok = await run((key) => api.deleteProject(project.id, key));
    if (ok && project.id === editingId) closeForm();
  };

  return (
    <ManagerLayout
      listTitle={copy.listTitle(projects.length)}
      onNew={editingProject ? closeForm : undefined}
      newLabel={t.admin.newItem}
      list={
        <>
          {error && <p className="form-error">{error}</p>}
          {projects.length === 0 ? (
            <p className="admin-hint">{copy.empty}</p>
          ) : (
            <ul className="admin-list">
              {projects.map((project) => (
                <AdminRow
                  key={project.id}
                  isSelected={project.id === editingId}
                  title={project.title}
                  meta={[project.completedDate, project.techStack.join(', ')]
                    .filter(Boolean)
                    .join(' · ')}
                  actions={
                    <>
                      <button
                        type="button"
                        className={project.featured ? 'is-on' : ''}
                        disabled={isBusy}
                        onClick={() => toggleFeatured(project)}
                        title={project.featured ? copy.unfeature : copy.feature}
                        aria-pressed={project.featured}
                      >
                        ★
                      </button>
                      <button type="button" onClick={() => setEditingId(project.id)}>
                        {t.admin.edit}
                      </button>
                      <button
                        type="button"
                        className="danger-btn"
                        disabled={isBusy}
                        onClick={() => remove(project)}
                        aria-label={t.admin.deleteLabel(project.title)}
                      >
                        {t.admin.delete}
                      </button>
                    </>
                  }
                />
              ))}
            </ul>
          )}
        </>
      }
      formTitle={editingProject ? copy.editTitle : copy.addTitle}
      form={
        <ProjectForm
          key={editingProject?.id ?? `new-${formKey}`}
          project={editingProject}
          onDone={closeForm}
        />
      }
    />
  );
};
