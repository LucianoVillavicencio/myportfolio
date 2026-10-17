import React from 'react';
import type { Project } from '../../types';
import { SectionHead } from '../../components/layout/SectionHead';
import { ProjectCard } from '../../components/projects/ProjectCard';

export const ProjectsSection: React.FC<{ projects: Project[] }> = ({ projects }) => (
  <section id="projects-section" className="content-stage">
    <div className="content-inner">
      <SectionHead
        eyebrow="SOFTWARE · HARDWARE · NETWORKING"
        title="RECENT"
        accent="PROJECTS"
      />

      {projects.length === 0 ? (
        <p className="bf-empty">No projects published yet.</p>
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
