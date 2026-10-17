import React from 'react';
import { usePortfolioData } from '../../context/PortfolioDataContext';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { HeroStage } from './HeroStage';
import { ProjectsSection } from './ProjectsSection';
import { ReadingSection } from './ReadingSection';
import { ContactFooter } from './ContactFooter';

export const HomePage: React.FC = () => {
  const { profile, books, projects, error } = usePortfolioData();
  useDocumentTitle(profile?.name ?? 'Portfolio');

  return (
    <div className="hero-page">
      <HeroStage
        profile={profile}
        projectCount={projects.length}
        bookCount={books.length}
      />
      {error && <p className="api-error-banner">{error}</p>}
      <ProjectsSection projects={projects} />
      <ReadingSection books={books} />
      <ContactFooter profile={profile} />
    </div>
  );
};
