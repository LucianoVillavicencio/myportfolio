export type TrackType = 'view' | 'outbound' | 'contact';

const NO_TRACK_KEY = 'portfolio_no_track';
const ENDPOINT = '/api/analytics/event';
// Mirrors the backend key validation
const KEY_RE = /^[a-z0-9/_:.-]{1,120}$/i;

export function setNoTrack(): void {
  try {
    localStorage.setItem(NO_TRACK_KEY, '1');
  } catch {
    /* storage unavailable */
  }
}

function isOptedOut(): boolean {
  try {
    return localStorage.getItem(NO_TRACK_KEY) === '1';
  } catch {
    return false;
  }
}

/** Fire-and-forget, cookieless event. Never throws. */
export function track(type: TrackType, key: string): void {
  try {
    if (isOptedOut() || !KEY_RE.test(key)) return;
    const body = JSON.stringify({ type, key });
    // A Blob keeps the JSON content type (a plain string would go as text/plain)
    if (
      typeof navigator !== 'undefined' &&
      typeof navigator.sendBeacon === 'function' &&
      navigator.sendBeacon(ENDPOINT, new Blob([body], { type: 'application/json' }))
    ) {
      return;
    }
    void fetch(ENDPOINT, {
      method: 'POST',
      keepalive: true,
      headers: { 'Content-Type': 'application/json' },
      body,
    }).catch(() => undefined);
  } catch {
    /* analytics must never break the page */
  }
}
