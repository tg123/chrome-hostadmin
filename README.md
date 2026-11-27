# HostAdmin

Switch domain → IP mappings (your hosts file) between environments in one click, right from the browser toolbar.

- **Popup**: search hosts, groups and comments, and click an address to switch to it. The badge shows which mapping the current tab uses.
- **Editor**: full hosts file editor with syntax highlighting. It warns you when another program changes the file.
- Works in **Chrome, Edge, Brave, Chromium, Vivaldi and Firefox** (Manifest V3).

Browsers no longer let extensions touch local files, so HostAdmin ships a tiny **native helper** (`hostadmin-host`). It can read and write only the system hosts file.

## Install

### 1. Install the extension

Install from your browser's store, or build it yourself (see [Development](#development)). To load your own build:

- **Chrome / Edge / Brave**: open `chrome://extensions`, enable _Developer mode_, click _Load unpacked_ and pick `dist/chrome`.
- **Firefox**: open `about:debugging#/runtime/this-firefox`, click _Load Temporary Add-on_ and pick `dist/firefox/manifest.json`.

### 2. Install the native helper

Download `hostadmin-host` for your platform from the [releases](https://github.com/tg123/chrome-hostadmin/releases) page, or build it with Go 1.22+:

```sh
cd native-host
go build -o bin/ ./cmd/hostadmin-host
```

Put the binary somewhere permanent, then register it with your browsers:

```sh
./hostadmin-host install
```

This writes a native messaging manifest for every supported browser it finds. On Windows it also adds the matching `HKCU` registry keys. The browser launches the binary from its current location, so re-run `install` if you move it. Remove everything with `./hostadmin-host uninstall`.

If you installed the extension from a store, or loaded it under a different ID, pass that ID:

```sh
./hostadmin-host install --chrome-id <id-from-chrome://extensions>
```

### Hosts file write permission

The helper runs as your user, so your user needs write access to the hosts file:

- **Windows**: `C:\Windows\System32\drivers\etc\hosts`. Open its _Properties → Security_ and give your user _Modify_ permission. Alternatively, run in an elevated prompt:
  ```bat
  icacls %SystemRoot%\System32\drivers\etc\hosts /grant "%USERNAME%":M
  ```
- **macOS / Linux**: `/etc/hosts`. For example:
  ```sh
  sudo chown "$USER" /etc/hosts      # or: sudo chmod a+w /etc/hosts
  ```

Security software may revert or block changes to the hosts file. Allow-list it if saves fail.

## Hosts file syntax

HostAdmin understands the standard hosts format plus a few comment-based extensions.

**Mappings**

```
[#]IP HOSTNAME [HOSTNAME...] [# COMMENT]
```

A leading `#` disables a mapping. The comment is shown as a label in the popup. A comment containing the word `hide` keeps the line out of the popup:

```
127.0.0.1   localhost      # hide
#10.0.0.1   api.example.com # staging
10.0.0.2    api.example.com # prod
```

**Groups**: clicking a group enables or disables all of its mappings at once. Add `# hide` after the name to hide the whole group.

```
#==== Project 1
#127.0.0.1  localhost1
127.0.0.1   localhost2
#====
```

**Bulk hide**: everything after this line is ignored by the popup:

```
#hide_all_of_below
```

## DNS caching

The browser may keep using connections opened under the old mapping. HostAdmin clears the HTTP cache whenever the hosts file changes. If a site still resolves to the old address, flush the socket pools at `chrome://net-internals/#sockets` (Chromium) or `about:networking#dns` (Firefox).

## Development

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MPL 2.0](LICENSE)
