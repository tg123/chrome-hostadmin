// Messaging between extension pages (popup, editor) and the background.

const README = 'https://github.com/tg123/chrome-hostadmin#';

export const HELP = {
  NOHOST: README + '2-install-the-native-helper',
  EACCES: README + 'hosts-file-write-permission',
};

/**
 * @typedef {object} HostsState
 * @property {string|null} content
 * @property {string|null} version
 * @property {string|null} path
 * @property {{message: string, code: string}|null} error
 */

/** @returns {Promise<HostsState>} */
export function getState() {
  return chrome.runtime.sendMessage({ type: 'get-state' });
}

/** @returns {Promise<{ok: boolean, version?: string, code?: string, error?: string}>} */
export function saveHosts(content, baseVersion) {
  return chrome.runtime.sendMessage({ type: 'save', content, baseVersion });
}

/** @param {(state: HostsState) => void} callback */
export function onStateChange(callback) {
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg?.type === 'state') callback(msg.state);
  });
}

export function errorText(code, message) {
  switch (code) {
    case 'NOHOST':
      return 'The HostAdmin native helper is not installed or failed to start.';
    case 'EACCES':
      return 'Permission denied writing the hosts file.';
    case 'CONFLICT':
      return 'The hosts file was changed by another program. Reloaded the latest version.';
    case 'ENOENT':
      return 'The hosts file does not exist.';
    default:
      return message || 'Unexpected error.';
  }
}

/** Renders an error into `el`, with a help link when one is available. */
export function showError(el, code, message) {
  el.replaceChildren(errorText(code, message));
  if (HELP[code]) {
    const a = document.createElement('a');
    a.href = HELP[code];
    a.target = '_blank';
    a.textContent = 'How to fix';
    el.append(' ', a);
  }
  el.hidden = false;
}
