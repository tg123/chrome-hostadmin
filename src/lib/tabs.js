export const EDITOR_PATH = 'editor/editor.html';

/** Opens (or focuses) the editor tab, optionally moving the cursor to a zero-based line. */
export async function openEditor(line) {
  const base = chrome.runtime.getURL(EDITOR_PATH);
  const tabs = await chrome.tabs.query({});
  const existing = tabs.find((t) => t.url?.startsWith(base));

  if (!existing) {
    await chrome.tabs.create({ url: line == null ? base : `${base}#line=${line + 1}` });
    return;
  }
  await chrome.tabs.update(existing.id, { active: true });
  await chrome.windows.update(existing.windowId, { focused: true });
  if (line != null) {
    await chrome.runtime.sendMessage({ type: 'goto-line', line }).catch(() => {});
  }
}

/** Hostname of a web URL, or undefined for browser-internal pages. */
export function hostnameOf(url) {
  try {
    const u = new URL(url);
    return /^(https?|wss?|ftp):$/.test(u.protocol) ? u.hostname.replace(/^\[|\]$/g, '') : undefined;
  } catch {
    return undefined;
  }
}
