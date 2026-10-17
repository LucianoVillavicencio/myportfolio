import React from 'react';
import { Link } from 'react-router-dom';
import type { Profile } from '../../types';
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
}) => (
  <main className="stage">
    <div className="topbar">
      <TopPills />
    </div>

    <div className="middle">
      <h1 className="headline anim d1">
        <span className="w1">
          CODE
          <ShapeFan />
        </span>
        <span className="w2">PACKETS</span>
        <span className="w3">&amp; SILICON</span>
      </h1>

      <div className="art">
        <HardwareNetworkEngineerIllustration />
      </div>

      <div className="ctext">
        {profile && (
          <p className="lead anim d3">
            {profile.leadHighlight && <strong>{profile.leadHighlight}</strong>}{' '}
            {profile.leadText}
          </p>
        )}

        <div className="btns anim d4">
          <a className="btn btn--y" href="#contact">
            Get in touch <span className="arr">↓</span>
          </a>
          <a className="btn btn--o" href="#projects-section">
            Projects <span className="tag">{projectCount}</span>
          </a>
          <Link className="btn btn--o" to="/books">
            Books <span className="tag">{bookCount}</span>
          </Link>
        </div>
      </div>

      {profile && <InfoCard profile={profile} />}
    </div>

    <ShapeSwirl />
    <ShapeLines />
    <ShapeStar />
  </main>
);
