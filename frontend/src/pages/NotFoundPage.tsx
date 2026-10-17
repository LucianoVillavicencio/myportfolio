import React from 'react';
import { Link } from 'react-router-dom';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { ShapeSwirl, ShapeLines, ShapeStar } from '../components/illustrations';
import { TopPills } from '../components/layout/TopPills';

export const NotFoundPage: React.FC = () => {
  useDocumentTitle('404 — Page Not Found');

  return (
    <div className="nf-page">
      <main className="nf-stage">
        <div className="topbar">
          <TopPills />
        </div>

        <div className="nf-body">
          <ShapeSwirl className="nf-swirl" />
          <ShapeLines className="nf-lines" />

          <p className="nf-eyebrow anim d1">Error 404</p>

          <h1 className="nf-code anim d2" aria-label="404">
            <span className="d">4</span>
            <ShapeStar className="nf-zero" />
            <span className="d">4</span>
          </h1>

          <p className="nf-title anim d3">PAGE NOT FOUND</p>

          <p className="nf-lead anim d4">
            It&apos;s not you, it&apos;s us. The page you&apos;re looking for may be
            retired, or never existed, or there could be a typo in the link that you
            followed.
          </p>

          <div className="btns anim d5">
            <Link className="btn btn--y" to="/">
              Back home <span className="arr">→</span>
            </Link>
            <Link className="btn btn--o" to="/#projects-section">
              See the projects <span className="arr">↗</span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};
