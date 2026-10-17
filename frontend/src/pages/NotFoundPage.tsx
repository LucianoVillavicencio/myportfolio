import React from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../i18n/LanguageContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { ShapeSwirl, ShapeLines, ShapeStar } from '../components/illustrations';
import { TopPills } from '../components/layout/TopPills';

export const NotFoundPage: React.FC = () => {
  const { t } = useI18n();
  useDocumentTitle(t.notFound.docTitle);

  return (
    <div className="nf-page">
      <main className="nf-stage">
        <div className="topbar">
          <TopPills />
        </div>

        <div className="nf-body">
          <ShapeSwirl className="nf-swirl" />
          <ShapeLines className="nf-lines" />

          <p className="nf-eyebrow anim d1">{t.notFound.eyebrow}</p>

          <h1 className="nf-code anim d2" aria-label="404">
            <span className="d">4</span>
            <ShapeStar className="nf-zero" />
            <span className="d">4</span>
          </h1>

          <p className="nf-title anim d3">{t.notFound.title}</p>

          <p className="nf-lead anim d4">{t.notFound.lead}</p>

          <div className="btns anim d5">
            <Link className="btn btn--y" to="/">
              {t.notFound.back} <span className="arr">→</span>
            </Link>
            <Link className="btn btn--o" to="/#projects-section">
              {t.notFound.projects} <span className="arr">↗</span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};
