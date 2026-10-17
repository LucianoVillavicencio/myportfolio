import React from 'react';
import type { Profile } from '../../types';
import { socialLinks } from '../../lib/profile';
import { localized, useI18n } from '../../i18n/LanguageContext';

/** Right-hand info card of the hero: name, roles, status and links. */
export const InfoCard: React.FC<{ profile: Profile }> = ({ profile }) => {
  const { lang, t } = useI18n();
  const roleLines = localized(lang, profile.rolesEs, profile.rolesEn)
    .split('\n')
    .filter(Boolean);
  const availability = localized(lang, profile.availabilityEs, profile.availabilityEn);
  const links = socialLinks(profile).filter((l) => l.label !== 'Instagram');

  return (
    <aside className="info anim d5">
      <div>
        <div className="name">{profile.name.toUpperCase()}</div>
        <div className="role">
          {[profile.location, ...roleLines].filter(Boolean).map((line, i) => (
            <React.Fragment key={i}>
              {i > 0 && <br />}
              {line}
            </React.Fragment>
          ))}
        </div>
      </div>

      <dl>
        {availability && (
          <div>
            <dt>{t.hero.status}</dt>
            <dd>
              <span className="dot" aria-hidden="true" />
              {availability}
            </dd>
          </div>
        )}
        {profile.stack && (
          <div>
            <dt>{t.hero.stack}</dt>
            <dd>{profile.stack}</dd>
          </div>
        )}
      </dl>

      {links.length > 0 && (
        <div className="links">
          {links.map((link) => (
            <a key={link.label} href={link.url} target="_blank" rel="noreferrer">
              {link.label} ↗
            </a>
          ))}
        </div>
      )}
    </aside>
  );
};
