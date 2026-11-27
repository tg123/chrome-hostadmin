// Request/response wrapper around a native messaging port.

export const NATIVE_HOST = 'com.github.tg123.hostadmin';
const REQUEST_TIMEOUT_MS = 10_000;

export class NativeError extends Error {
  constructor(message, code = 'EIO') {
    super(message);
    this.code = code;
  }
}

export class NativeClient {
  #port = null;
  #pending = new Map();
  #nextId = 1;
  #onEvent;

  /** @param {(msg: object) => void} onEvent receives unsolicited host messages */
  constructor(onEvent) {
    this.#onEvent = onEvent;
  }

  get connected() {
    return this.#port !== null;
  }

  #connect() {
    const port = chrome.runtime.connectNative(NATIVE_HOST);
    port.onMessage.addListener((msg) => {
      const pending = msg.id ? this.#pending.get(msg.id) : undefined;
      if (!pending) {
        this.#onEvent(msg);
        return;
      }
      this.#pending.delete(msg.id);
      clearTimeout(pending.timer);
      if (msg.ok) pending.resolve(msg);
      else pending.reject(new NativeError(msg.error || 'Unknown error', msg.code));
    });
    port.onDisconnect.addListener(() => {
      const reason = chrome.runtime.lastError?.message || port.error?.message || 'Native host disconnected';
      this.#port = null;
      const err = new NativeError(reason, 'NOHOST');
      for (const p of this.#pending.values()) {
        clearTimeout(p.timer);
        p.reject(err);
      }
      this.#pending.clear();
      this.#onEvent({ type: 'disconnected', error: reason });
    });
    this.#port = port;
    return port;
  }

  request(cmd, payload = {}) {
    const port = this.#port ?? this.#connect();
    const id = this.#nextId++;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.#pending.delete(id);
        reject(new NativeError(`Native host did not answer "${cmd}"`, 'TIMEOUT'));
      }, REQUEST_TIMEOUT_MS);
      this.#pending.set(id, { resolve, reject, timer });
      try {
        port.postMessage({ id, cmd, ...payload });
      } catch (e) {
        this.#pending.delete(id);
        clearTimeout(timer);
        reject(new NativeError(e.message, 'NOHOST'));
      }
    });
  }
}
