import React from 'react';
import { Link } from 'react-router-dom';
import type { Project } from '../../types';
import { track } from '../../lib/analytics';
import { localized, useI18n } from '../../i18n/LanguageContext';

export const ProjectCard: React.FC<{ project: Project }> = ({ project }) => {
  const { lang, t } = useI18n();
  const cover = project.images[0];
  // A project without a slug (should not happen after the backfill) renders without links
  const to = project.slug ? `/projects/${project.slug}` : null;

  return (
    <article className="folio-card">
      {cover && (
        <CoverWrap to={to} label={t.caseStudy.viewCase}>
          <img
            className="folio-cover"
            src={cover}
            alt={t.caseStudy.cover(project.title)}
            loading="lazy"
          />
        </CoverWrap>
      )}

      <div className="folio-card-top">
        <span className="folio-date">{project.completedDate}</span>
        <div className="folio-links">
          {project.repoUrl && (
            <a
              href={project.repoUrl}
              target="_blank"
              rel="noreferrer"
              onClick={() => project.slug && track('outbound', `${project.slug}:repo`)}
            >
              {t.projects.repo} ↗
            </a>
          )}
          {project.liveUrl && (
            <a
              href={project.liveUrl}
              target="_blank"
              rel="noreferrer"
              onClick={() => project.slug && track('outbound', `${project.slug}:live`)}
            >
              {t.projects.live} ↗
            </a>
          )}
        </div>
      </div>

      <h3 className="folio-card-title">
        {to ? (
          <Link to={to} className="folio-title-link">
            {project.title}
          </Link>
        ) : (
          project.title
        )}
      </h3>
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

/** Wraps the cover in a link when the project has a case-study page. */
const CoverWrap: React.FC<{ to: string | null; label: string; children: React.ReactNode }> = ({
  to,
  label,
  children,
}) =>
  to ? (
    <Link to={to} className="folio-cover-link" aria-label={label} tabIndex={-1}>
      {children}
    </Link>
  ) : (
    <div className="folio-cover-link">{children}</div>
  );
