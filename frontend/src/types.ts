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

export type GoodreadsSyncStatus =
  | { ok: true; added: number; updated: number; removed: number }
  | { ok: false; error: string };

export interface GoodreadsStatus {
  userId: string | null;
  lastSyncAt: string | null;
  lastSyncResult: GoodreadsSyncStatus | null;
  isSyncing: boolean;
}

export interface GoodreadsSyncResult {
  added: number;
  updated: number;
  removed: number;
}

export type CvLang = 'es' | 'en';

export interface CvInfo {
  /** "upload" when replaced from the admin panel, "bundled" for the PDF shipped with the site. */
  source: 'upload' | 'bundled';
  size: number;
  updatedAt: string;
}

export type CvStatus = Record<CvLang, CvInfo | null>;
