/** Pure text helpers for the hero (kept out of the component file for fast refresh). */

export function splitAccent(headline: string, accent: string): [string, string, string] {
  const idx = headline.indexOf(accent);
  if (idx === -1) return [headline, '', ''];
  return [headline.slice(0, idx).trim(), accent, headline.slice(idx + accent.length).trim()];
}

/** Splits a name after its first word: "Nguyễn Ngọc Tuyền" → ["Nguyễn", "Ngọc Tuyền"]. */
export function splitName(name: string): [string, string] {
  const clean = name.normalize('NFC').trim();
  const space = clean.indexOf(' ');
  return space === -1 ? [clean, ''] : [clean.slice(0, space), clean.slice(space + 1)];
}

/** Splits a stat like "2+" into its number and suffix so only the digits count up. */
export function splitStat(value: string): [number | null, string] {
  const match = /^(\d+)(.*)$/.exec(value);
  return match ? [Number(match[1]), match[2]] : [null, value];
}
