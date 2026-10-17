import React from 'react';
import type { Profile } from '../../types';
import { socialLinks } from '../../lib/profile';

export const ContactFooter: React.FC<{ profile: Profile | null }> = ({ profile }) => {
  const links = profile ? socialLinks(profile) : [];

  return (
    <footer className="foot" id="contact">
      <div className="foot-inner">
        <h2 className="foot-title">
          <span className="fw1">LET’S</span>
          <span className="fw2">TALK</span>
        </h2>

        {profile && (
          <div className="foot-cols">
            <dl className="foot-data">
              {profile.email && (
                <div>
                  <dt>Email</dt>
                  <dd>
                    <a href={`mailto:${profile.email}`}>{profile.email}</a>
                  </dd>
                </div>
              )}
              {profile.location && (
                <div>
                  <dt>Location</dt>
                  <dd>{profile.location}</dd>
                </div>
              )}
            </dl>

            {links.length > 0 && (
              <div className="foot-social">
                <p className="foot-label">Social</p>
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
          </div>
        )}

        <p className="foot-note">
          © {new Date().getFullYear()} {profile?.name}
        </p>
      </div>
    </footer>
  );
};
