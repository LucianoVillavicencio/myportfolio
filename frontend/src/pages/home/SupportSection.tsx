import React from 'react';
import type { CaseStory, SupportCard } from '../../types';
import { paragraphs } from '../../lib/text';
import { localized, useI18n } from '../../i18n/LanguageContext';
import { SectionHead } from '../../components/layout/SectionHead';

interface SupportSectionProps {
  card: SupportCard | null;
  stories: CaseStory[];
}

export const SupportSection: React.FC<SupportSectionProps> = ({ card, stories }) => {
  const { lang, t } = useI18n();
  if (!card) return null;

  const title = localized(lang, card.titleEs, card.titleEn);
  const intro = paragraphs(localized(lang, card.introEs, card.introEn));
  const offerings = localized(lang, card.offeringsEs, card.offeringsEn)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  const area = localized(lang, card.areaEs, card.areaEn);

  return (
    <section id="support" className="content-stage">
      <div className="content-inner">
        <SectionHead
          eyebrow={t.support.eyebrow}
          title={t.support.title}
          accent={t.support.accent}
        />
        <div className="support-card">
          <h3 className="support-title">{title}</h3>
          {intro.map((p, i) => (
            <p key={i} className="support-text">
              {p}
            </p>
          ))}

          {offerings.length > 0 && (
            <>
              <p className="support-label support-label--gap">{t.support.offeringsLabel}</p>
              <ul className="support-tags">
                {offerings.map((item, i) => (
                  <li key={i} className="support-tag">
                    {item}
                  </li>
                ))}
              </ul>
            </>
          )}

          {area && (
            <p className="support-area">
              <span className="support-label">{t.support.areaLabel}</span> {area}
            </p>
          )}

          <a href="#contact" className="pill support-cta">
            {t.support.cta} <span aria-hidden="true">→</span>
          </a>
        </div>

        {stories.length > 0 && (
          <>
            <p className="support-label support-stories-label">{t.support.storiesLabel}</p>
            <div className="support-stories">
              {stories.map((story) => (
                <article key={story.id} className="support-story">
                  <h4 className="support-story-title">
                    {localized(lang, story.titleEs, story.titleEn)}
                  </h4>
                  {paragraphs(localized(lang, story.bodyEs, story.bodyEn)).map((p, i) => (
                    <p key={i} className="support-text">
                      {p}
                    </p>
                  ))}
                </article>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
};
