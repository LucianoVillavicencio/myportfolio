import type { Profile } from '../types';

export interface SocialLink {
  label: string;
  url: string;
}

/** The profile's social links that are actually set, in display order. */
export function socialLinks(profile: Profile): SocialLink[] {
  const links: [string, string | null][] = [
    ['GitHub', profile.githubUrl],
    ['LinkedIn', profile.linkedinUrl],
    ['Instagram', profile.instagramUrl],
  ];
  return links
    .filter((entry): entry is [string, string] => Boolean(entry[1]))
    .map(([label, url]) => ({ label, url }));
}
