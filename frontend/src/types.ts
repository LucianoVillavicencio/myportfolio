export type ReadingStatus = 'READING' | 'COMPLETED' | 'WANT_TO_READ';

export interface Book {
  id: string;
  title: string;
  author: string;
  coverUrl: string | null;
  status: ReadingStatus;
  totalPages: number;
  rating: number | null;
  thoughts: string | null;
  goodreadsId: string | null;
  lockedFields: string[];
  startedAt: string;
  updatedAt: string;
}

export interface BookInput {
  title: string;
  author: string;
  coverUrl: string;
  status: ReadingStatus;
  totalPages: number;
  rating: number | null;
  thoughts: string;
}

export interface Project {
  id: string;
  title: string;
  summaryEs: string;
  summaryEn: string;
  techStack: string[];
  repoUrl: string | null;
  liveUrl: string | null;
  featured: boolean;
  completedDate: string;
  createdAt: string;
}

export interface ProjectInput {
  title: string;
  summaryEs: string;
  summaryEn: string;
  techStack: string[];
  repoUrl: string;
  liveUrl: string;
  featured: boolean;
  completedDate: string;
}

export interface Profile {
  name: string;
  location: string;
  /** Newline-separated list of roles. */
  rolesEs: string;
  rolesEn: string;
  leadHighlightEs: string;
  leadHighlightEn: string;
  leadTextEs: string;
  leadTextEn: string;
  availabilityEs: string;
  availabilityEn: string;
  stack: string;
  email: string;
  githubUrl: string | null;
  linkedinUrl: string | null;
  instagramUrl: string | null;
}

export type ProfileInput = {
  [K in keyof Profile]: string;
};
