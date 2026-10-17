import React from 'react';
import type { Project } from '../../types';

export const ProjectCard: React.FC<{ project: Project }> = ({ project }) => (
  <article className="folio-card">
    <div className="folio-card-top">
      <span className="folio-date">{project.completedDate}</span>
      <div className="folio-links">
        {project.repoUrl && (
          <a href={project.repoUrl} target="_blank" rel="noreferrer">
            GitHub ↗
          </a>
        )}
        {project.liveUrl && (
          <a href={project.liveUrl} target="_blank" rel="noreferrer">
            Live ↗
          </a>
        )}
      </div>
    </div>

    <h3 className="folio-card-title">{project.title}</h3>
    <p className="folio-card-desc">{project.summary}</p>

    <div className="folio-tags">
      {project.techStack.map((tech) => (
        <span key={tech} className="folio-tag">
          {tech}
        </span>
      ))}
    </div>
  </article>
);
