import React from 'react';
import { Link } from 'react-router-dom';
import type { Profile } from '../../types';
import { localized, useI18n } from '../../i18n/LanguageContext';
import {
  HardwareNetworkEngineerIllustration,
  ShapeFan,
  ShapeLines,
  ShapeStar,
  ShapeSwirl,
} from '../../components/illustrations';
import { TopPills } from '../../components/layout/TopPills';
import { InfoCard } from './InfoCard';

interface HeroStageProps {
  profile: Profile | null;
  projectCount: number;
  bookCount: number;
}

export const HeroStage: React.FC<HeroStageProps> = ({
  profile,
  projectCount,
  bookCount,
}) => {
  const { lang, t } = useI18n();
  const [w1, w2, w3] = t.hero.headline;
  const highlight = profile && localized(lang, profile.leadHighlightEs, profile.leadHighlightEn);
  const lead = profile && localized(lang, profile.leadTextEs, profile.leadTextEn);

  return (
    <main className="stage">
      <div className="topbar">
        <TopPills />
      </div>

      <div className="middle">
        <h1 className="headline anim d1">
          <span className="w1">
            {w1}
            <ShapeFan />
          </span>
          <span className="w2">{w2}</span>
          <span className="w3">{w3}</span>
        </h1>

        <div className="art">
          <HardwareNetworkEngineerIllustration label={t.hero.illustration} />
        </div>

        <div className="ctext">
          {(highlight || lead) && (
            <p className="lead anim d3">
              {highlight && <strong>{highlight}</strong>} {lead}
            </p>
          )}

          <div className="btns anim d4">
            <a className="btn btn--y" href="#contact">
              {t.hero.getInTouch} <span className="arr">↓</span>
            </a>
            <a className="btn btn--o" href="#projects-section">
              {t.hero.projects} <span className="tag">{projectCount}</span>
            </a>
            <Link className="btn btn--o" to="/books">
              {t.hero.books} <span className="tag">{bookCount}</span>
            </Link>
            <a className="btn btn--o" href={`/cv_${lang}.pdf`} target="_blank" rel="noopener noreferrer">
              {t.hero.cv} <span className="arr">↗</span>
            </a>
          </div>
        </div>

        {profile && <InfoCard profile={profile} />}
      </div>

      <ShapeSwirl />
      <ShapeLines />
      <ShapeStar />
    </main>
  );
};
