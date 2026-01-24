# HostAdmin Electron

This folder hosts a minimal Electron wrapper that runs the existing HostAdmin UI as a standalone desktop app.

## Quick start

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the app:
   ```bash
   npm run start
   ```

The Electron wrapper loads the existing `core/editor.html` UI and talks to the main process through a preload bridge.
