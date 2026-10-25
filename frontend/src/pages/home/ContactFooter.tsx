import React from 'react';
import type { Profile } from '../../types';
import { socialLinks } from '../../lib/profile';
import { CopyEmailButton } from '../../components/layout/CopyEmailButton';
import { ContactForm } from './ContactForm';
import { useI18n } from '../../i18n/LanguageContext';

export const ContactFooter: React.FC<{ profile: Profile | null }> = ({ profile }) => {
  const { t } = useI18n();
  const links = profile ? socialLinks(profile) : [];

  return (
    <footer className="foot" id="contact">
      <div className="foot-inner">
        <h2 className="foot-title">
          <span className="fw1">{t.footer.title}</span>
          <span className="fw2">{t.footer.accent}</span>
        </h2>

        {profile && (
          <div className="foot-cols">
            <dl className="foot-data">
              {profile.email && (
                <div>
                  <dt>{t.footer.email}</dt>
                  <dd>
                    <a href={`mailto:${profile.email}`}>{profile.email}</a>
                    <CopyEmailButton email={profile.email} />
                  </dd>
                </div>
              )}
              {profile.location && (
                <div>
                  <dt>{t.footer.location}</dt>
                  <dd>{profile.location}</dd>
                </div>
              )}
            </dl>

            {links.length > 0 && (
              <div className="foot-social">
                <p className="foot-label">{t.footer.social}</p>
                <ul>
                  {links.map((link) => (
                    <li key={link.label}>
                      <a href={link.url} target="_blank" rel="noreferrer">
                        {link.label} <span className="arr">↗</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {profile.email && <ContactForm email={profile.email} />}
          </div>
        )}

        <p className="foot-note">
          © {new Date().getFullYear()} {profile?.name}
        </p>
      </div>
    </footer>
  );
};
