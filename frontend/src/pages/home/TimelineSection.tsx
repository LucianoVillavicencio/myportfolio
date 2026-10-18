import React from 'react';
import type { TimelineEntry, TimelineKind } from '../../types';
import { ACCENTS } from '../../lib/books';
import { paragraphs } from '../../lib/text';
import { localized, useI18n } from '../../i18n/LanguageContext';
import { SectionHead } from '../../components/layout/SectionHead';

const KIND_ACCENT: Record<TimelineKind, string> = {
  education: ACCENTS[0],
  work: ACCENTS[1],
  competition: ACCENTS[2],
  certification: ACCENTS[0],
  project: ACCENTS[1],
};

export const TimelineSection: React.FC<{ entries: TimelineEntry[] }> = ({ entries }) => {
  const { lang, t } = useI18n();
  if (entries.length === 0) return null;

  return (
    <section id="journey" className="content-stage">
      <div className="content-inner">
        <SectionHead
          eyebrow={t.timeline.eyebrow}
          title={t.timeline.title}
          accent={t.timeline.accent}
        />
        <ol className="tl">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className="tl-item"
              style={{ '--tl-accent': KIND_ACCENT[entry.kind] } as React.CSSProperties}
            >
              <span className="tl-node" aria-hidden="true" />
              <div className="tl-meta">
                <span className="tl-period">{entry.period}</span>
                <span className="tl-badge">{t.timeline.kinds[entry.kind]}</span>
              </div>
              <h3 className="tl-title">{localized(lang, entry.titleEs, entry.titleEn)}</h3>
              {paragraphs(localized(lang, entry.descriptionEs, entry.descriptionEn)).map(
                (p, i) => (
                  <p key={i} className="tl-text">
                    {p}
                  </p>
                ),
              )}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
};
