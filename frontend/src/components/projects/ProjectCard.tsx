import React from 'react';
import type { Project } from '../../types';
import { localized, useI18n } from '../../i18n/LanguageContext';

export const ProjectCard: React.FC<{ project: Project }> = ({ project }) => {
  const { lang, t } = useI18n();

  return (
    <article className="folio-card">
      <div className="folio-card-top">
        <span className="folio-date">{project.completedDate}</span>
        <div className="folio-links">
          {project.repoUrl && (
            <a href={project.repoUrl} target="_blank" rel="noreferrer">
              {t.projects.repo} ↗
            </a>
          )}
          {project.liveUrl && (
            <a href={project.liveUrl} target="_blank" rel="noreferrer">
              {t.projects.live} ↗
            </a>
          )}
        </div>
      </div>

      <h3 className="folio-card-title">{project.title}</h3>
      <p className="folio-card-desc">
        {localized(lang, project.summaryEs, project.summaryEn)}
      </p>

      <div className="folio-tags">
        {project.techStack.map((tech) => (
          <span key={tech} className="folio-tag">
            {tech}
          </span>
        ))}
      </div>
    </article>
  );
};
