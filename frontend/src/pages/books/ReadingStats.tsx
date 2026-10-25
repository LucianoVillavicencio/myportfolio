import React, { useEffect, useState } from 'react';
import type { Book, ReadingStats as ReadingStatsData } from '../../types';
import { api } from '../../lib/api';
import { ACCENTS } from '../../lib/books';
import { useI18n } from '../../i18n/LanguageContext';

const CHART_W = 320;
const CHART_H = 120;
const LABEL_H = 18;
const VALUE_H = 14;

/**
 * Reading stats for the current year. Refetches when `books` changes (admin edits reload
 * the list), and renders nothing if the request fails or there are no completed books.
 */
export const ReadingStats: React.FC<{ books: Book[] }> = ({ books }) => {
  const { t, locale } = useI18n();
  const [stats, setStats] = useState<ReadingStatsData | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .getReadingStats()
      .then((data) => {
        if (!cancelled) setStats(data);
      })
      .catch(() => {
        if (!cancelled) setStats(null);
      });
    return () => {
      cancelled = true;
    };
  }, [books]);

  if (!stats) return null;
  if (stats.finishedThisYear === 0 && stats.byYear.length === 0 && stats.averageRating === null) {
    return null;
  }

  const copy = t.books.readingStats;
  const fmt = (n: number) => n.toLocaleString(locale);
  const goal = stats.goal;
  const pct = goal ? Math.min(100, Math.round((stats.finishedThisYear / goal) * 100)) : 0;
  const years = [...stats.byYear].sort((a, b) => a.year - b.year);
  const maxBooks = Math.max(1, ...years.map((y) => y.books));
  const barW = CHART_W / Math.max(1, years.length);
  const plotH = CHART_H - LABEL_H - VALUE_H;

  return (
    <section className="bf-rs" aria-labelledby="bf-rs-heading">
      <h2 id="bf-rs-heading" className="bf-rs-heading">
        {copy.heading(stats.year)}
      </h2>

      <div className="bf-rs-tiles">
        <div className="bf-rs-tile">
          <span className="bf-rs-num">{fmt(stats.finishedThisYear)}</span>
          <span className="bf-stat-label">{copy.finished}</span>
        </div>
        <div className="bf-rs-tile">
          <span className="bf-rs-num">{fmt(stats.pagesThisYear)}</span>
          <span className="bf-stat-label">{copy.pages}</span>
        </div>
        <div className="bf-rs-tile">
          <span className="bf-rs-num">
            {stats.averageRating === null
              ? '–'
              : `${stats.averageRating.toLocaleString(locale, { maximumFractionDigits: 1 })} ★`}
          </span>
          <span className="bf-stat-label">{copy.rating}</span>
        </div>
      </div>

      {goal !== null && (
        <div className="bf-rs-goal">
          <div className="bf-rs-goal-head">
            <span className="bf-stat-label">{copy.goalLabel(stats.year)}</span>
            <span className="bf-rs-goal-text">{copy.goal(fmt(stats.finishedThisYear), fmt(goal))}</span>
          </div>
          <div
            className="bf-rs-bar"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={goal}
            aria-valuenow={Math.min(stats.finishedThisYear, goal)}
            aria-valuetext={copy.goal(fmt(stats.finishedThisYear), fmt(goal))}
            aria-label={copy.goalLabel(stats.year)}
          >
            <div className="bf-rs-bar-fill" style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}

      {years.length >= 2 && (
        <div className="bf-rs-chart">
          <span className="bf-stat-label">{copy.byYear}</span>
          <svg
            viewBox={`0 0 ${CHART_W} ${CHART_H}`}
            role="img"
            aria-label={copy.chartLabel(years.map((y) => `${y.year}: ${fmt(y.books)}`).join(', '))}
          >
            {years.map((y, i) => {
              const h = Math.max(2, (y.books / maxBooks) * plotH);
              const x = i * barW + barW * 0.15;
              const w = barW * 0.7;
              const top = VALUE_H + plotH - h;
              return (
                <g key={y.year}>
                  <rect x={x} y={top} width={w} height={h} fill={ACCENTS[i % ACCENTS.length]} />
                  <text x={x + w / 2} y={top - 3} textAnchor="middle" className="bf-rs-svg-val">
                    {fmt(y.books)}
                  </text>
                  <text x={x + w / 2} y={CHART_H - 4} textAnchor="middle" className="bf-rs-svg-year">
                    {y.year}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      )}
    </section>
  );
};
