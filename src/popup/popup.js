import { parse, toggleHost, toggleGroup, isGroupEnabled, canonicalHostname } from '../lib/hosts.js';
import { rank } from '../lib/search.js';
import { getState, saveHosts, onStateChange, showError } from '../lib/api.js';
import { openEditor, hostnameOf } from '../lib/tabs.js';

const $search = document.getElementById('search');
const $list = document.getElementById('list');
const $banner = document.getElementById('banner');
const hostTemplate = document.getElementById('host-template');
const entryTemplate = document.getElementById('entry-template');

let state = { content: null, version: null, error: null };
let doc = parse('');
let groupsFirst = false;

function setBanner(source, code, message) {
  if (code) {
    showError($banner, code, message);
    $banner.dataset.source = source;
  } else if ($banner.dataset.source === source) {
    $banner.hidden = true;
  }
}

function setState(next) {
  state = next;
  doc = parse(state.content ?? '');
  setBanner('state', state.error?.code, state.error?.message);
}

async function commit(text) {
  const res = await saveHosts(text, state.version);
  setBanner('save', res.ok ? null : res.code, res.error);
}

function highlight(text, query) {
  const at = query ? text.toLowerCase().indexOf(query.toLowerCase()) : -1;
  if (at < 0) return [text];
  const mark = document.createElement('mark');
  mark.textContent = text.slice(at, at + query.length);
  return [text.slice(0, at), mark, text.slice(at + query.length)];
}

function hostSection(title, query) {
  const section = hostTemplate.content.firstElementChild.cloneNode(true);
  section.querySelector('.name').append(...highlight(title, query));
  return section;
}

function entryItem({ label, tag, on, onToggle, onEdit, editTitle }) {
  const li = entryTemplate.content.firstElementChild.cloneNode(true);
  li.classList.toggle('on', on);
  const toggle = li.querySelector('.toggle');
  toggle.setAttribute('aria-pressed', String(on));
  toggle.addEventListener('click', onToggle);
  li.querySelector('.addr').textContent = label;
  const tagEl = li.querySelector('.tag');
  tagEl.textContent = tag;
  tagEl.title = tag;
  const edit = li.querySelector('.edit-line');
  if (onEdit) {
    edit.title = editTitle;
    edit.addEventListener('click', onEdit);
  } else {
    edit.remove();
  }
  return li;
}

function renderHost(host, query, groupMembers) {
  const section = hostSection(host, query);
  const open = section.querySelector('.open-site');
  open.title = `Open http://${host}`;
  open.setAttribute('aria-label', open.title);
  open.addEventListener('click', () => chrome.tabs.create({ url: `http://${host}` }));

  const ul = section.querySelector('.entries');
  const shown = new Set();
  doc.hosts.get(host).forEach((entry, index) => {
    if (entry.hidden) return;
    const groupName = doc.groups.get(entry.group);
    if (groupName) {
      const members = groupMembers.get(entry.group) ?? new Set();
      groupMembers.set(entry.group, members.add(host));
    }
    const tag = entry.comment || groupName || '';
    // Collapse duplicate addresses unless a label tells them apart.
    if (!tag && shown.has(entry.addr)) return;
    shown.add(entry.addr);
    ul.append(
      entryItem({
        label: entry.addr,
        tag,
        on: entry.enabled,
        onToggle: () => commit(toggleHost(doc, host, index)),
        onEdit: () => openEditor(entry.line).then(() => window.close()),
        editTitle: `Edit line ${entry.line + 1}`,
      }),
    );
  });
  return ul.children.length ? section : null;
}

function renderGroups(groupMembers) {
  const section = hostSection('GROUPS', '');
  const sortButton = section.querySelector('.open-site');
  sortButton.textContent = groupsFirst ? '↓' : '↑';
  sortButton.title = groupsFirst ? 'Rank groups with search results' : 'Always show groups first';
  sortButton.setAttribute('aria-label', sortButton.title);
  sortButton.addEventListener('click', async () => {
    groupsFirst = !groupsFirst;
    await chrome.storage.local.set({ groupsFirst });
    render();
  });

  const ul = section.querySelector('.entries');
  for (const groupId of [...groupMembers.keys()].sort((a, b) => a - b)) {
    const hosts = [...groupMembers.get(groupId)];
    ul.append(
      entryItem({
        label: doc.groups.get(groupId),
        tag: `${hosts.length} host${hosts.length === 1 ? '' : 's'}`,
        on: isGroupEnabled(doc, hosts, groupId),
        onToggle: () => commit(toggleGroup(doc, hosts, groupId)),
      }),
    );
  }
  return section;
}

function render() {
  const query = $search.value.trim();
  const { hosts, groupScore } = rank(doc, query);
  const groupMembers = new Map();
  const sections = [];
  let groupIndex = 0;

  for (const { host, score } of hosts) {
    const section = renderHost(host, query, groupMembers);
    if (!section) continue;
    sections.push(section);
    if (score <= groupScore) groupIndex = sections.length;
  }

  if (groupMembers.size) {
    sections.splice(groupsFirst ? 0 : groupIndex, 0, renderGroups(groupMembers));
  }

  if (!sections.length && state.content !== null) {
    const empty = document.createElement('p');
    empty.className = 'empty';
    empty.textContent = 'No mappings in the hosts file yet. Open the editor to add some.';
    sections.push(empty);
  }
  $list.replaceChildren(...sections);
}

$search.addEventListener('input', () => {
  render();
  $list.scrollTop = 0;
});

document.addEventListener('keydown', (e) => {
  if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey && document.activeElement !== $search) {
    $search.focus();
  }
});

document
  .getElementById('open-editor')
  .addEventListener('click', () => openEditor().then(() => window.close()));

onStateChange((next) => {
  setState(next);
  render();
});

async function init() {
  const [stored, [tab], initial] = await Promise.all([
    chrome.storage.local.get('groupsFirst'),
    chrome.tabs.query({ active: true, currentWindow: true }),
    getState(),
  ]);
  groupsFirst = Boolean(stored.groupsFirst);
  setState(initial);
  const current = canonicalHostname(doc, hostnameOf(tab?.url));
  if (current) {
    $search.value = current;
    $search.select();
  } else {
    $search.focus();
  }
  render();
}

init();
