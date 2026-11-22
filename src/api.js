// The letter, photo and song are static files in /public, so the site runs on any static host.
export const api = {
  getLetter: async () => {
    const res = await fetch('/letter.json', { cache: 'no-cache' });
    if (!res.ok) throw new Error(`Request failed (${res.status})`);
    return res.json();
  },
};
