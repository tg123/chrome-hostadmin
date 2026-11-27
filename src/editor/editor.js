import { EditorView, basicSetup } from 'codemirror';
import { Compartment, EditorState, Prec } from '@codemirror/state';
import { keymap } from '@codemirror/view';
import { oneDark } from '@codemirror/theme-one-dark';
import { hostsLanguage } from './hosts-language.js';
import { getState, saveHosts, onStateChange, showError } from '../lib/api.js';

const $save = document.getElementById('save');
const $status = document.getElementById('status');
const $path = document.getElementById('path');
const $banner = document.getElementById('banner');
const $dialog = document.getElementById('changed-dialog');

let version = null;
let savedContent = null;
let pendingExternal = null;
let saving = false;

const theme = new Compartment();
const readOnly = new Compartment();
const darkScheme = matchMedia('(prefers-color-scheme: dark)');
const themeFor = (dark) => (dark ? oneDark : []);

const view = new EditorView({
  parent: document.getElementById('editor'),
  state: EditorState.create({
    extensions: [
      basicSetup,
      hostsLanguage,
      theme.of(themeFor(darkScheme.matches)),
      readOnly.of(EditorState.readOnly.of(true)),
      Prec.high(keymap.of([{ key: 'Mod-s', preventDefault: true, run: () => (save(), true) }])),
      EditorView.updateListener.of((u) => u.docChanged && updateDirty()),
    ],
  }),
});

darkScheme.addEventListener('change', (e) =>
  view.dispatch({ effects: theme.reconfigure(themeFor(e.matches)) }),
);

const text = () => view.state.doc.toString();
const isDirty = () => savedContent !== null && text() !== savedContent;

function updateDirty() {
  const dirty = isDirty();
  $save.disabled = !dirty || saving;
  $status.textContent = dirty ? 'Unsaved changes' : '';
  document.title = `${dirty ? '● ' : ''}HostAdmin – Hosts Editor`;
}

function load(state) {
  const scroll = view.scrollDOM.scrollTop;
  view.dispatch({
    changes: { from: 0, to: view.state.doc.length, insert: state.content },
    effects: readOnly.reconfigure(EditorState.readOnly.of(false)),
  });
  view.scrollDOM.scrollTop = scroll;
  version = state.version;
  savedContent = state.content;
  updateDirty();
}

function onState(state) {
  if (state.path) $path.textContent = state.path;
  if (state.content === null) {
    if (state.error) showError($banner, state.error.code, state.error.message);
    return;
  }
  if (state.version === version) return;

  if (savedContent === null || !isDirty()) {
    load(state);
  } else if (state.content === text()) {
    // Our own save (or an identical external edit) — nothing to merge.
    version = state.version;
    savedContent = state.content;
    updateDirty();
  } else {
    pendingExternal = state;
    if (!$dialog.open) $dialog.showModal();
  }
}

$dialog.addEventListener('close', () => {
  if (!pendingExternal) return;
  if ($dialog.returnValue === 'reload') {
    load(pendingExternal);
  } else {
    // Keep the user's edits; saving will overwrite the external change.
    version = pendingExternal.version;
    savedContent = pendingExternal.content;
    updateDirty();
  }
  pendingExternal = null;
});

async function save() {
  if (!isDirty() || saving) return;
  saving = true;
  updateDirty();
  const content = text();
  try {
    const res = await saveHosts(content, version);
    if (res.ok) {
      version = res.version;
      savedContent = content;
      $banner.hidden = true;
    } else {
      showError($banner, res.code, res.error);
    }
  } finally {
    saving = false;
    updateDirty();
  }
}

function gotoLine(zeroBased) {
  const n = Math.min(Math.max(zeroBased + 1, 1), view.state.doc.lines);
  const line = view.state.doc.line(n);
  view.dispatch({
    selection: { anchor: line.from },
    effects: EditorView.scrollIntoView(line.from, { y: 'center' }),
  });
  view.focus();
}

function gotoLineFromHash() {
  const m = /line=(\d+)/.exec(location.hash);
  if (m) gotoLine(Number(m[1]) - 1);
}

$save.addEventListener('click', save);
window.addEventListener('hashchange', gotoLineFromHash);
window.addEventListener('beforeunload', (e) => {
  if (isDirty()) e.preventDefault();
});
chrome.runtime.onMessage.addListener((msg) => {
  if (msg?.type === 'goto-line') gotoLine(msg.line);
});
onStateChange(onState);

getState().then((state) => {
  onState(state);
  gotoLineFromHash();
});
