export const FEEDBACK_ENDPOINT =
  import.meta.env.VITE_FEEDBACK_ENDPOINT || 'https://nptel-feedback.sykik.workers.dev/fb';

export async function sendFeedback(payload) {
  try {
    await fetch(FEEDBACK_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    /* never break the user's flow over a report */
  }
}
