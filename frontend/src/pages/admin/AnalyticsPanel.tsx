import React, { useEffect, useState } from 'react';
import type { AnalyticsEventType, AnalyticsSummary } from '../../types';
import { ApiError, getAnalytics } from '../../lib/api';
import { ACCENTS } from '../../lib/books';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { useI18n } from '../../i18n/LanguageContext';

const RANGES = [7, 30, 90] as const;
const TILES: AnalyticsEventType[] = ['view', 'cv', 'outbound', 'contact'];

/** Daily-views bars, scaled to the busiest day (all-zero data renders flat). */
const ViewsChart: React.FC<{ daily: AnalyticsSummary['daily']; label: string }> = ({
  daily,
  label,
}) => {
  const max = Math.max(0, ...daily.map((d) => d.views));
  const W = 600;
  const H = 150;
  const slot = W / Math.max(1, daily.length);
  const barW = Math.max(1, slot * 0.7);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label={label}>
      <line x1="0" y1={H - 0.5} x2={W} y2={H - 0.5} stroke="var(--color-edge)" strokeWidth="1" />
      {daily.map((d, i) => {
        const h = max > 0 ? (d.views / max) * (H - 4) : 0;
        return (
          <rect
            key={d.day}
            x={i * slot + (slot - barW) / 2}
            y={H - h}
            width={barW}
            height={h}
            fill={ACCENTS[0]}
          >
            <title>{`${d.day}: ${d.views}`}</title>
          </rect>
        );
      })}
    </svg>
  );
};

export const AnalyticsPanel: React.FC = () => {
  const { adminKey } = useAdminAuth();
  const { t } = useI18n();
  const copy = t.admin.analytics;
  const [days, setDays] = useState<(typeof RANGES)[number]>(30);
  const [state, setState] = useState<{
    days: number;
    data?: AnalyticsSummary;
    error?: string;
  } | null>(null);

  useEffect(() => {
    if (!adminKey) return;
    let cancelled = false;
    getAnalytics(days, adminKey)
      .then((data) => !cancelled && setState({ days, data }))
      .catch((err) => {
        if (cancelled) return;
        setState({ days, error: err instanceof ApiError ? err.message : copy.loadError });
      });
    return () => {
      cancelled = true;
    };
  }, [days, adminKey, copy.loadError]);

  const current = state?.days === days ? state : null;
  const data = current?.data;

  const pages = data?.top.filter((r) => r.type === 'view') ?? [];
  const projects = data?.top.filter((r) => r.type === 'outbound') ?? [];
  const peak = data ? Math.max(0, ...data.daily.map((d) => d.views)) : 0;

  const renderTable = (rows: typeof pages, keyHead: string) =>
    rows.length === 0 ? (
      <p className="admin-hint">{copy.empty}</p>
    ) : (
      <table className="an-table">
        <thead>
          <tr>
            <th scope="col">{keyHead}</th>
            <th scope="col">{copy.colCount}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={`${r.type}:${r.key}`}>
              <td>{r.key}</td>
              <td>{r.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );

  return (
    <section aria-label={copy.title}>
      <div className="an-head">
        <div className="pf-tabs" role="group" aria-label={copy.range}>
          {RANGES.map((n) => (
            <button
              key={n}
              type="button"
              aria-pressed={days === n}
              className={`pf-tab ${days === n ? 'is-on' : ''}`}
              onClick={() => setDays(n)}
            >
              {copy.days(n)}
            </button>
          ))}
        </div>
        <p className="an-note">{copy.note}</p>
      </div>

      {current?.error && <p className="api-error-banner">{current.error}</p>}
      {!current && <p className="admin-hint">{copy.loading}</p>}

      {data && (
        <>
          <div className="an-tiles">
            {TILES.map((type) => (
              <div key={type} className="an-tile">
                <strong>{data.totals[type] ?? 0}</strong>
                <span>{copy.tiles[type]}</span>
              </div>
            ))}
          </div>

          <div className="an-chart">
            <h3>{copy.chartTitle}</h3>
            <ViewsChart
              daily={data.daily}
              label={copy.chartLabel(data.totals.view ?? 0, data.daily.length, peak)}
            />
          </div>

          <div className="an-tables">
            <div>
              <h3>{copy.topPages}</h3>
              {renderTable(pages, copy.colKey)}
            </div>
            <div>
              <h3>{copy.topProjects}</h3>
              {renderTable(projects, copy.colProject)}
            </div>
          </div>
        </>
      )}
    </section>
  );
};
