import React from 'react';
import type { Project } from '../../types';
import { useI18n } from '../../i18n/LanguageContext';
import { SectionHead } from '../../components/layout/SectionHead';
import { ProjectCard } from '../../components/projects/ProjectCard';

export const ProjectsSection: React.FC<{ projects: Project[] }> = ({ projects }) => {
  const { t } = useI18n();

  return (
    <section id="projects-section" className="content-stage">
      <div className="content-inner">
        <SectionHead
          eyebrow={t.projects.eyebrow}
          title={t.projects.title}
          accent={t.projects.accent}
        />

        {projects.length === 0 ? (
          <p className="bf-empty">{t.projects.empty}</p>
        ) : (
          <div className="cards-grid">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
