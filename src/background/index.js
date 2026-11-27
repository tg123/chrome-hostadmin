// Background service worker / event page.
//
// Owns the connection to the native host, keeps the latest hosts file
// content, updates the toolbar badge and serves the popup and editor.

import { NativeClient } from '../lib/native.js';
import { parse, canonicalHostname } from '../lib/hosts.js';
import { hostnameOf } from '../lib/tabs.js';

/** @type {import('../lib/api.js').HostsState} */
let state = { content: null, version: null, path: null, error: null };
let doc = parse('');
let loading = null;
let retryDelay = 1000;

const client = new NativeClient((msg) => {
  if (msg.type === 'changed') {
    apply({ ...state, content: msg.content, version: msg.version, error: null });
  } else if (msg.type === 'disconnected' && state.content !== null) {
    // Lost the watcher (host crashed or was updated); reconnect to keep watching.
    setTimeout(load, retryDelay);
    retryDelay = Math.min(retryDelay * 2, 5 * 60_000);
  }
});

function apply(next) {
  const previous = state.content;
  state = next;
  doc = parse(state.content ?? '');
  updateBadge();
  chrome.runtime.sendMessage({ type: 'state', state }).catch(() => {});
  if (previous !== null && previous !== state.content) {
    // Pages cached under the old mapping would otherwise keep loading.
    chrome.browsingData.removeCache({}).catch(() => {});
  }
}

function load() {
  loading ??= client
    .request('read')
    .then(
      (r) => {
        retryDelay = 1000;
        apply({ content: r.content, version: r.version, path: r.path, error: null });
      },
      (e) => apply({ ...state, error: { message: e.message, code: e.code } }),
    )
    .finally(() => {
      loading = null;
    });
  return loading;
}

async function save(content, baseVersion) {
  try {
    const r = await client.request('write', { content, baseVersion });
    apply({ ...state, content: content.replace(/\r\n/g, '\n'), version: r.version, error: null });
    return { ok: true, version: r.version };
  } catch (e) {
    if (e.code === 'CONFLICT' || e.code === 'NOHOST') load();
    return { ok: false, code: e.code, error: e.message };
  }
}

async function updateBadge() {
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  const host = canonicalHostname(doc, hostnameOf(tab?.url));
  const entries = host ? doc.hosts.get(host) : [];
  const active = entries.find((e) => e.enabled);

  let text = '';
  let title = 'HostAdmin';
  let color = '#1a7f37';
  if (state.error && state.content === null) {
    text = '!';
    title = `HostAdmin: ${state.error.message}`;
    color = '#cf222e';
  } else if (active) {
    text = active.comment || active.addr;
    title = `${host} → ${active.addr}${active.comment ? ` (${active.comment})` : ''}`;
  } else if (entries.length) {
    text = '*';
    title = `${host} is in the hosts file but not active`;
  }

  await Promise.all([
    chrome.action.setBadgeBackgroundColor({ color }),
    chrome.action.setBadgeText({ text }),
    chrome.action.setTitle({ title }),
  ]).catch(() => {});
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  switch (msg?.type) {
    case 'get-state':
      (state.content === null || !client.connected ? load() : Promise.resolve()).then(() =>
        sendResponse(state),
      );
      return true;
    case 'save':
      save(msg.content, msg.baseVersion).then(sendResponse);
      return true;
    default:
      return false;
  }
});

chrome.tabs.onActivated.addListener(() => updateBadge());
chrome.tabs.onUpdated.addListener((_id, change, tab) => {
  if (change.url && tab.active) updateBadge();
});
chrome.windows.onFocusChanged.addListener(() => updateBadge());
// Wake up at browser start so the badge is correct before the popup is opened.
chrome.runtime.onStartup.addListener(() => {});

load();
