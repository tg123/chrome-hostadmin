// Parser and editor for the HostAdmin hosts file dialect.
//
//   [#]IP HOST [HOST...] [# COMMENT]   mapping; a leading '#' disables it
//   #==== NAME [# hide]                 opens a group (closed by a bare #====)
//   #hide_all_of_below                  hides every following mapping
//   ... # hide                          hides a single mapping
//
// All functions are pure: they take text and return new text or data.

const IPV4 = /^((25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(25[0-5]|2[0-4]\d|1?\d?\d)$/;

export function isIPv4(s) {
  return IPV4.test(s);
}

export function isIPv6(s) {
  const zone = s.indexOf('%');
  const addr = zone >= 0 ? s.slice(0, zone) : s;
  if (zone === 0 || zone === s.length - 1 || !addr.includes(':')) return false;

  let head = addr;
  let groupsNeeded = 8;
  const lastColon = addr.lastIndexOf(':');
  const tail = addr.slice(lastColon + 1);
  if (tail.includes('.')) {
    if (!isIPv4(tail)) return false;
    head = addr.slice(0, lastColon + 1) + '0';
    groupsNeeded = 7;
  }

  const hex = /^[0-9a-fA-F]{1,4}$/;
  const halves = head.split('::');
  if (halves.length > 2) return false;
  const parse = (part) => (part === '' ? [] : part.split(':'));
  const left = parse(halves[0]);
  const right = halves.length === 2 ? parse(halves[1]) : [];
  if (![...left, ...right].every((g) => hex.test(g))) return false;
  const count = left.length + right.length;
  return halves.length === 2 ? count < groupsNeeded : count === groupsNeeded;
}

export function isIP(s) {
  return isIPv4(s) || isIPv6(s);
}

const DISABLED_PREFIX = /^(\s*#)+/;

function tokenize(line) {
  return line.replace(DISABLED_PREFIX, '#').replace(/#/g, ' # ').trim().split(/\s+/).filter(Boolean);
}

/**
 * @typedef {object} Entry
 * @property {string} addr
 * @property {boolean} enabled
 * @property {number} line     zero-based line index
 * @property {string} comment
 * @property {number} group    group id, 0 when not in a group
 * @property {boolean} hidden
 *
 * @typedef {object} HostsDoc
 * @property {string[]} lines            raw lines, each including its terminator
 * @property {Map<string, Entry[]>} hosts hostname -> entries, in file order
 * @property {Map<number, string>} groups group id -> display name
 */

/** @returns {HostsDoc} */
export function parse(text) {
  const lines = splitLines(text);
  const hosts = new Map();
  const groups = new Map();
  const hiddenGroups = new Set();

  let groupId = 0;
  let groupMarkers = 0;
  let inGroup = false;
  let hideBelow = false;

  lines.forEach((raw, lineNo) => {
    let tks = tokenize(raw);

    if (tks[0] === '#' && tks[1] === '====') {
      if (groupMarkers === 0) groupId++;
      if (groupMarkers++ % 2 === 0) {
        const rest = tks.slice(2);
        const hashAt = rest.indexOf('#');
        const nameTokens = hashAt >= 0 ? rest.slice(0, hashAt) : rest;
        const commentTokens = hashAt >= 0 ? rest.slice(hashAt + 1) : [];
        if (commentTokens.some((t) => t.toUpperCase() === 'HIDE')) hiddenGroups.add(groupId);
        groups.set(groupId, nameTokens.join(' ') || `Group ${groupId}`);
        inGroup = true;
      } else {
        inGroup = false;
        groupId++;
      }
      return;
    }

    if (tks[0] === '#' && tks[1]?.toUpperCase() === 'HIDE_ALL_OF_BELOW') {
      hideBelow = true;
    }

    let enabled = true;
    if (tks[0] === '#') {
      enabled = false;
      tks = tks.slice(1);
    }
    if (!tks[0] || !isIP(tks[0])) return;

    const addr = tks[0];
    const hashAt = tks.indexOf('#', 1);
    const names = tks.slice(1, hashAt >= 0 ? hashAt : undefined);
    const commentTokens = hashAt >= 0 ? tks.slice(hashAt + 1).filter((t) => t !== '#') : [];

    const entry = {
      addr,
      enabled,
      line: lineNo,
      comment: commentTokens.join(' '),
      group: inGroup ? groupId : 0,
      hidden:
        hideBelow ||
        commentTokens.some((t) => t.toUpperCase() === 'HIDE') ||
        (inGroup && hiddenGroups.has(groupId)),
    };

    for (const name of names) {
      if (!hosts.has(name)) hosts.set(name, []);
      hosts.get(name).push(entry);
    }
  });

  return { lines, hosts, groups };
}

function splitLines(text) {
  if (!text) return [];
  if (!text.endsWith('\n')) text += '\n';
  return text.match(/[^\n]*\n/g);
}

function setLineEnabled(lines, lineNo, enabled) {
  const line = lines[lineNo];
  const isEnabled = !DISABLED_PREFIX.test(line);
  if (enabled && !isEnabled) lines[lineNo] = line.replace(DISABLED_PREFIX, '');
  if (!enabled && isEnabled) lines[lineNo] = '#' + line;
}

/** Finds the hostname as written in the file, ignoring case. */
export function canonicalHostname(doc, hostname) {
  if (!hostname) return undefined;
  if (doc.hosts.has(hostname)) return hostname;
  const upper = hostname.toUpperCase();
  for (const name of doc.hosts.keys()) {
    if (name.toUpperCase() === upper) return name;
  }
  return undefined;
}

/**
 * Activates entry `index` of `hostname` (deactivating its alternatives), or
 * deactivates every entry if it was already active. Returns the new text.
 */
export function toggleHost(doc, hostname, index) {
  const entries = doc.hosts.get(hostname);
  if (!entries?.[index]) return doc.lines.join('');
  const { addr, enabled } = entries[index];
  const lines = [...doc.lines];
  for (const e of entries) setLineEnabled(lines, e.line, !enabled && e.addr === addr);
  return lines.join('');
}

export function isGroupEnabled(doc, hostnames, groupId) {
  return hostnames.every((h) => (doc.hosts.get(h) ?? []).every((e) => e.group !== groupId || e.enabled));
}

/**
 * Turns a whole group on (disabling conflicting entries of the same hosts
 * outside the group) or off if it is already fully on. Returns the new text.
 */
export function toggleGroup(doc, hostnames, groupId) {
  const turnOff = isGroupEnabled(doc, hostnames, groupId);
  const lines = [...doc.lines];
  for (const h of hostnames) {
    for (const e of doc.hosts.get(h) ?? []) {
      if (e.group === groupId) setLineEnabled(lines, e.line, !turnOff);
      else setLineEnabled(lines, e.line, false);
    }
  }
  return lines.join('');
}

/** The entry currently routing `hostname`, if any. */
export function activeEntry(doc, hostname) {
  const name = canonicalHostname(doc, hostname);
  return name ? doc.hosts.get(name).find((e) => e.enabled) : undefined;
}
