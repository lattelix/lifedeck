// Synthetic Calendar responses for theme QA; never use production credentials.
import './github-preload.mjs';
const previousFetch = globalThis.fetch;
globalThis.fetch = async (input, init) => {
  const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url);
  if (url.hostname === 'oauth2.googleapis.com') return Response.json({ access_token: 'fixture' });
  if (url.hostname === 'www.googleapis.com') return Response.json({ items: [{ id: 'fixture', summary: 'Focus block', start: { dateTime: new Date().toISOString() }, end: { dateTime: new Date(Date.now() + 3600000).toISOString() } }] });
  return previousFetch(input, init);
};
