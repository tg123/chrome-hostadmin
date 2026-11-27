import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  parse,
  toggleHost,
  toggleGroup,
  isGroupEnabled,
  canonicalHostname,
  activeEntry,
  isIP,
} from '../src/lib/hosts.js';

const SAMPLE = `127.0.0.1 localhost
# plain comment
#10.0.0.1 api.example.com # staging
10.0.0.2  api.example.com   # prod
::1 ip6.test

#==== Project 1
#127.0.0.1 a.test
127.0.0.1 b.test c.test
#====

#==== Secret # hide
1.1.1.1 secret.test
#====

1.2.3.4 single.test # hide
#hide_all_of_below
5.6.7.8 below.test`;

test('parses mappings, comments and enabled state', () => {
  const doc = parse(SAMPLE);
  const api = doc.hosts.get('api.example.com');
  assert.deepEqual(
    api.map(({ addr, enabled, comment }) => ({ addr, enabled, comment })),
    [
      { addr: '10.0.0.1', enabled: false, comment: 'staging' },
      { addr: '10.0.0.2', enabled: true, comment: 'prod' },
    ],
  );
  assert.equal(doc.hosts.get('ip6.test')[0].addr, '::1');
  assert.ok(!doc.hosts.has('plain'), 'comments are not hostnames');
});

test('one line can map several hostnames', () => {
  const doc = parse(SAMPLE);
  assert.strictEqual(doc.hosts.get('b.test')[0], doc.hosts.get('c.test')[0]);
});

test('groups get ids and names; hidden groups hide their entries', () => {
  const doc = parse(SAMPLE);
  const a = doc.hosts.get('a.test')[0];
  assert.equal(doc.groups.get(a.group), 'Project 1');
  assert.equal(a.hidden, false);

  const secret = doc.hosts.get('secret.test')[0];
  assert.equal(doc.groups.get(secret.group), 'Secret');
  assert.equal(secret.hidden, true);
  assert.equal(doc.hosts.get('localhost')[0].group, 0);
});

test('"# hide" comments and #hide_all_of_below hide entries', () => {
  const doc = parse(SAMPLE);
  assert.equal(doc.hosts.get('single.test')[0].hidden, true);
  assert.equal(doc.hosts.get('below.test')[0].hidden, true);
  assert.equal(doc.hosts.get('localhost')[0].hidden, false);
});

test('unnamed groups get a default name', () => {
  const doc = parse('#====\n1.1.1.1 x\n#====\n');
  assert.equal(doc.groups.get(doc.hosts.get('x')[0].group), 'Group 1');
});

test('toggleHost switches to the clicked address and disables alternatives', () => {
  const doc = parse(SAMPLE);
  const out = toggleHost(doc, 'api.example.com', 0);
  assert.match(out, /^10\.0\.0\.1 api\.example\.com # staging$/m);
  assert.match(out, /^#10\.0\.0\.2  api\.example\.com   # prod$/m);
  assert.equal(activeEntry(parse(out), 'api.example.com').addr, '10.0.0.1');
});

test('toggleHost on the active address disables it', () => {
  const doc = parse(SAMPLE);
  const out = toggleHost(doc, 'api.example.com', 1);
  assert.equal(activeEntry(parse(out), 'api.example.com'), undefined);
  // Everything else is untouched.
  assert.equal(out.split('\n').length, SAMPLE.split('\n').length + 1);
  assert.match(out, /^127\.0\.0\.1 localhost$/m);
});

test('toggleGroup enables the whole group, then disables it', () => {
  const text = `1.1.1.1 a.test
#==== G
#2.2.2.2 a.test
#2.2.2.2 b.test
#====
`;
  const doc = parse(text);
  const id = doc.hosts.get('b.test')[0].group;
  const hosts = ['a.test', 'b.test'];
  assert.equal(isGroupEnabled(doc, hosts, id), false);

  const on = parse(toggleGroup(doc, hosts, id));
  assert.equal(isGroupEnabled(on, hosts, id), true);
  assert.equal(activeEntry(on, 'a.test').addr, '2.2.2.2', 'conflicting entry outside the group is disabled');

  const off = parse(toggleGroup(on, hosts, id));
  assert.equal(isGroupEnabled(off, hosts, id), false);
  assert.equal(activeEntry(off, 'b.test'), undefined);
});

test('round-trips text without a trailing newline and with CRLF', () => {
  assert.equal(parse('1.1.1.1 a').lines.join(''), '1.1.1.1 a\n');
  const doc = parse('1.1.1.1 a\r\n#2.2.2.2 a\r\n');
  assert.equal(toggleHost(doc, 'a', 1), '#1.1.1.1 a\r\n2.2.2.2 a\r\n');
});

test('canonicalHostname is case-insensitive', () => {
  const doc = parse('1.1.1.1 MixedCase.test\n');
  assert.equal(canonicalHostname(doc, 'mixedcase.TEST'), 'MixedCase.test');
  assert.equal(canonicalHostname(doc, 'other.test'), undefined);
});

test('isIP accepts IPv4/IPv6 and rejects hostnames', () => {
  for (const ok of [
    '127.0.0.1',
    '255.255.255.255',
    '::1',
    '::',
    'fe80::1%lo0',
    '2001:db8::8a2e:370:7334',
    '::ffff:192.168.0.1',
    '1:2:3:4:5:6:7:8',
  ]) {
    assert.ok(isIP(ok), ok);
  }
  for (const bad of [
    '256.0.0.1',
    '1.2.3',
    'localhost',
    '1::2::3',
    '1:2:3:4:5:6:7:8:9',
    'abc:def',
    'fe80::1%',
  ]) {
    assert.ok(!isIP(bad), bad);
  }
});
