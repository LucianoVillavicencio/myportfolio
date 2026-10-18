import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { Project } from '../../types';
import { usePortfolioData } from '../../context/PortfolioDataContext';
import { localized, useI18n } from '../../i18n/LanguageContext';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { ApiError, api } from '../../lib/api';
import { paragraphs } from '../../lib/text';
import { LanguageToggle } from '../../components/layout/LanguageToggle';
import { NotFoundPage } from '../NotFoundPage';

type Fetched = { slug: string; project: Project | null };

export const ProjectPage: React.FC = () => {
  const { slug = '' } = useParams<{ slug: string }>();
  const { projects, isLoading } = usePortfolioData();
  const fromContext = projects.find((p) => p.slug === slug) ?? null;
  const [fetched, setFetched] = useState<Fetched | null>(null);

  // Fall back to the API once the shared list has loaded without this slug
  useEffect(() => {
    if (isLoading || fromContext) return;
    let cancelled = false;
    api
      .getProjectBySlug(slug)
      .then((project) => !cancelled && setFetched({ slug, project }))
      .catch((err) => {
        if (cancelled) return;
        if (!(err instanceof ApiError) || err.status !== 404) console.error(err);
        setFetched({ slug, project: null });
      });
    return () => {
      cancelled = true;
    };
  }, [slug, isLoading, fromContext]);

  const project = fromContext ?? (fetched?.slug === slug ? fetched.project : null);
  const settled = fetched?.slug === slug;

  if (project) return <ProjectView project={project} />;
  if (isLoading || !settled) return null;
  return <NotFoundPage />;
};

const ProjectView: React.FC<{ project: Project }> = ({ project }) => {
  const { lang, t } = useI18n();
  const { profile } = usePortfolioData();
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const closeLightbox = useCallback(() => setOpenIndex(null), []);
  useDocumentTitle(profile ? `${project.title} — ${profile.name}` : project.title);

  const cs = t.caseStudy;
  const sections = [
    { key: 'problem', heading: cs.problem, es: project.problemEs, en: project.problemEn },
    { key: 'role', heading: cs.role, es: project.roleEs, en: project.roleEn },
    { key: 'decisions', heading: cs.decisions, es: project.decisionsEs, en: project.decisionsEn },
    { key: 'results', heading: cs.results, es: project.resultsEs, en: project.resultsEn },
  ]
    .map((s) => ({ ...s, text: localized(lang, s.es, s.en) }))
    .filter((s) => s.text.trim());
  const summary = localized(lang, project.summaryEs, project.summaryEn);

  return (
    <div className="pf cs-page">
      <div className="cs-topbar">
        <Link to="/#projects-section" className="pill pill--back anim d1">
          <span className="arr">←</span> {t.common.backHome}
        </Link>
        <LanguageToggle className="anim d2" />
      </div>

      <main className="cs-main">
        <header className="cs-head anim d2">
          <span className="folio-date">{project.completedDate}</span>
          <h1 className="cs-title">{project.title}</h1>
          {summary && <p className="cs-summary">{summary}</p>}
          <div className="folio-tags">
            {project.techStack.map((tech) => (
              <span key={tech} className="folio-tag">
                {tech}
              </span>
            ))}
          </div>
          {(project.repoUrl || project.liveUrl) && (
            <div className="cs-links">
              {project.repoUrl && (
                <a className="btn btn--o" href={project.repoUrl} target="_blank" rel="noreferrer">
                  {t.projects.repo} <span className="arr">↗</span>
                </a>
              )}
              {project.liveUrl && (
                <a className="btn btn--y" href={project.liveUrl} target="_blank" rel="noreferrer">
                  {t.projects.live} <span className="arr">↗</span>
                </a>
              )}
            </div>
          )}
        </header>

        {project.images.length > 0 && (
          <section className="cs-gallery" aria-label={cs.screenshots}>
            {project.images.map((src, i) => (
              <button
                key={src}
                type="button"
                className="cs-shot"
                onClick={() => setOpenIndex(i)}
                aria-label={cs.openImage(i + 1)}
              >
                <img
                  src={src}
                  alt={cs.imageAlt(project.title, i + 1)}
                  loading={i === 0 ? 'eager' : 'lazy'}
                />
              </button>
            ))}
          </section>
        )}

        {sections.map((s) => (
          <section key={s.key} className="cs-section">
            <h2 className="cs-h2">{s.heading}</h2>
            {paragraphs(s.text).map((p, i) => (
              <p key={i} className="cs-p">
                {p}
              </p>
            ))}
          </section>
        ))}
      </main>

      {openIndex !== null && (
        <ImageLightbox
          src={project.images[openIndex]}
          alt={cs.imageAlt(project.title, openIndex + 1)}
          onClose={closeLightbox}
        />
      )}
    </div>
  );
};

const ImageLightbox: React.FC<{ src: string; alt: string; onClose: () => void }> = ({
  src,
  alt,
  onClose,
}) => {
  const { t } = useI18n();

  // Same interaction as BookLightbox: Esc closes, page scroll locked while open
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  return (
    <div className="pf-lb" onClick={onClose} role="dialog" aria-modal="true" aria-label={alt}>
      <button
        type="button"
        className="pf-lb-close"
        onClick={onClose}
        aria-label={t.common.close}
        autoFocus
      >
        ✕
      </button>
      <img className="cs-lb-img" src={src} alt={alt} onClick={(e) => e.stopPropagation()} />
    </div>
  );
};
