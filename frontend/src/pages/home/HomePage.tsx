import React from 'react';
import { usePortfolioData } from '../../context/PortfolioDataContext';
import { useI18n } from '../../i18n/LanguageContext';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { HeroStage } from './HeroStage';
import { ProjectsSection } from './ProjectsSection';
import { TimelineSection } from './TimelineSection';
import { ReadingSection } from './ReadingSection';
import { ContactFooter } from './ContactFooter';

export const HomePage: React.FC = () => {
  const { profile, books, projects, timeline, loadFailed } = usePortfolioData();
  const { t } = useI18n();
  useDocumentTitle(profile?.name ?? 'Portfolio');

  return (
    <div className="hero-page">
      <HeroStage
        profile={profile}
        projectCount={projects.length}
        bookCount={books.length}
      />
      {loadFailed && <p className="api-error-banner">{t.common.loadError}</p>}
      <ProjectsSection projects={projects} />
      <TimelineSection entries={timeline} />
      <ReadingSection books={books} />
      <ContactFooter profile={profile} />
    </div>
  );
};
