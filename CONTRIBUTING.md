# Contributing to HostAdmin

Patches are welcome!

## Layout

```
src/                 browser extension (Manifest V3, ES modules)
  background/        service worker: native host connection, badge
  popup/             toolbar popup
  editor/            hosts file editor (CodeMirror 6)
  lib/               shared, browser-independent logic (parser, search)
  manifest.json      shared manifest; per-browser keys are added at build time
native-host/         Go native messaging host (hostadmin-host)
scripts/build.mjs    builds dist/chrome and dist/firefox with esbuild
test/                unit tests (node --test)
```

## Extension

Requires Node.js 20+.

```sh
npm install
npm run build   # → dist/chrome, dist/firefox
npm run watch   # rebuild on change
npm test        # unit tests
npm run format  # prettier
```

Load `dist/chrome` or `dist/firefox` as described in the [README](README.md#1-install-the-extension). The Chrome build pins its extension ID to `gipceghmgdijhnbhnbchagbkjlpoifnk`, which the native helper allows by default.

## Native host

Requires Go 1.22+.

```sh
cd native-host
go test ./...
go build -o bin/ ./cmd/hostadmin-host
./bin/hostadmin-host install
```

To try changes without touching the real hosts file, start the browser with `HOSTADMIN_HOSTS_FILE` pointing at a scratch file. The helper inherits the browser's environment.

The host speaks JSON over the [native messaging](https://developer.chrome.com/docs/extensions/develop/concepts/native-messaging) protocol. The protocol is documented in `native-host/internal/server/server.go`.
