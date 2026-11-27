// Fuzzy ranking used by the popup search box.

export function levenshtein(a, b) {
  if (a === b) return 0;
  if (!a) return b.length;
  if (!b) return a.length;
  let prev = Array.from({ length: a.length + 1 }, (_, i) => i);
  for (let j = 1; j <= b.length; j++) {
    const cur = [j];
    for (let i = 1; i <= a.length; i++) {
      cur[i] = a[i - 1] === b[j - 1] ? prev[i - 1] : 1 + Math.min(prev[i], cur[i - 1], prev[i - 1]);
    }
    prev = cur;
  }
  return prev[a.length];
}

/** Lower is a better match of `query` against `text` (case-insensitive). */
export function score(query, text) {
  query = query.toLowerCase();
  text = text.toLowerCase();
  const longest = Math.max(query.length, text.length) || 1;
  let s = levenshtein(query, text) / longest;
  const at = text.indexOf(query);
  if (at === 0) s -= 0.15;
  else if (at > 0) s -= 0.1;
  if (query && query[0] === text[0]) s -= 0.1;
  return s;
}

/**
 * Ranks hostnames (by name, group name and comment) against `query`.
 * Returns the hostnames best first and the score of the best matching group,
 * which the popup uses to place its group list among the hosts.
 */
export function rank(doc, query) {
  let bestGroup = 1;
  const ranked = [];
  for (const [host, entries] of doc.hosts) {
    let best = score(query, host);
    for (const e of entries) {
      const groupName = doc.groups.get(e.group);
      if (groupName) {
        const g = score(query, groupName);
        best = Math.min(best, g);
        bestGroup = Math.min(bestGroup, g);
      }
      if (e.comment) best = Math.min(best, score(query, e.comment));
    }
    ranked.push({ host, score: best });
  }
  // Array.prototype.sort is stable, so ties keep file order.
  ranked.sort((a, b) => a.score - b.score);
  return { hosts: ranked, groupScore: bestGroup };
}
