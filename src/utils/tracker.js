const TRACK = import.meta.env.VITE_TRACK_ENDPOINT || 'https://nptel-feedback.sykik.workers.dev/track';

const send = (body) => {
  try {
    fetch(TRACK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).catch(() => {});
  } catch {
    /* tracking must never break the app */
  }
};

const beacon = (body) => {
  if (navigator.sendBeacon) {
    try {
      navigator.sendBeacon(TRACK, new Blob([JSON.stringify(body)], { type: 'application/json' }));
      return;
    } catch {
      /* fall through to fetch */
    }
  }
  send(body);
};

let secondsToSend = () => 0;

let started = false;

export function startTracking() {
  if (started || import.meta.env.DEV) return; // no counting in dev
  started = true;

  const fresh = !sessionStorage.getItem('trk-session');
  if (fresh) sessionStorage.setItem('trk-session', '1');
  send({ type: 'visit', new: fresh });

  let unsent = 0;
  secondsToSend = () => unsent;
  setInterval(() => {
    if (document.visibilityState === 'visible') {
      unsent += 1;
      if (unsent >= 60) {
        send({ type: 'time', seconds: unsent });
        unsent = 0;
      }
    }
  }, 1000);
  window.addEventListener('pagehide', () => {
    if (unsent > 0) beacon({ type: 'time', seconds: unsent });
  });
}

export function trackCourse(course) {
  if (!started) return;
  send({ type: 'course', course });
}
