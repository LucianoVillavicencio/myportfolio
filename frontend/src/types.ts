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
  finishedAt: string | null;
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
  /** YYYY-MM-DD or null to clear; omit to leave unchanged (the server stamps new completions). */
  finishedAt?: string | null;
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
  slug: string | null;
  problemEs: string;
  problemEn: string;
  roleEs: string;
  roleEn: string;
  decisionsEs: string;
  decisionsEn: string;
  resultsEs: string;
  resultsEn: string;
  /** Media URLs; the first one is the cover. */
  images: string[];
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
  /** Empty = generate from the title (create) or keep the current one (update). */
  slug: string;
  problemEs: string;
  problemEn: string;
  roleEs: string;
  roleEn: string;
  decisionsEs: string;
  decisionsEn: string;
  resultsEs: string;
  resultsEn: string;
  images: string[];
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
  readingGoal: number | null;
  showReadingStats: boolean;
}

export type ProfileInput = {
  [K in keyof Profile]: K extends 'showReadingStats' ? boolean : string;
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

export const TIMELINE_KINDS = [
  'education',
  'work',
  'competition',
  'certification',
  'project',
] as const;
export type TimelineKind = (typeof TIMELINE_KINDS)[number];

export interface TimelineEntry {
  id: string;
  kind: TimelineKind;
  period: string;
  sortYear: number;
  titleEs: string;
  titleEn: string;
  descriptionEs: string;
  descriptionEn: string;
  createdAt: string;
}

export interface TimelineInput {
  kind: TimelineKind;
  period: string;
  sortYear: number;
  titleEs: string;
  titleEn: string;
  descriptionEs: string;
  descriptionEn: string;
}

export interface SupportCard {
  id: string;
  enabled: boolean;
  titleEs: string;
  titleEn: string;
  introEs: string;
  introEn: string;
  /** One offering per line. */
  offeringsEs: string;
  offeringsEn: string;
  areaEs: string;
  areaEn: string;
}

export type SupportCardInput = Omit<SupportCard, 'id'>;

export interface CaseStory {
  id: string;
  titleEs: string;
  titleEn: string;
  bodyEs: string;
  bodyEn: string;
  sortOrder: number;
  createdAt: string;
}

export interface CaseStoryInput {
  titleEs: string;
  titleEn: string;
  bodyEs: string;
  bodyEn: string;
  sortOrder: number;
}

export interface SupportData {
  card: SupportCard | null;
  stories: CaseStory[];
}

export type AnalyticsEventType = 'view' | 'cv' | 'outbound' | 'contact';

export interface AnalyticsSummary {
  totals: Record<AnalyticsEventType, number>;
  daily: { day: string; views: number }[];
  top: { type: AnalyticsEventType; key: string; count: number }[];
}

export interface ReadingStats {
  year: number;
  finishedThisYear: number;
  pagesThisYear: number;
  goal: number | null;
  averageRating: number | null;
  byYear: { year: number; books: number; pages: number }[];
}

export interface SpotifyArtist {
  name: string;
  imageUrl: string | null;
  url: string | null;
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  imageUrl: string | null;
  url: string | null;
  trackCount: number | null;
  isPublic: boolean;
}

export interface SpotifyTopArtist {
  /** Most listened artist of the last four weeks. */
  artist: SpotifyArtist | null;
}

export interface SpotifyStatus {
  configured: boolean;
  connected: boolean;
  selectedIds: string[];
  playlistsSyncedAt: string | null;
}
