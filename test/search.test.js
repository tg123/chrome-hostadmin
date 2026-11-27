import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parse } from '../src/lib/hosts.js';
import { levenshtein, rank } from '../src/lib/search.js';

test('levenshtein distance', () => {
  assert.equal(levenshtein('kitten', 'sitting'), 3);
  assert.equal(levenshtein('', 'abc'), 3);
  assert.equal(levenshtein('same', 'same'), 0);
});

test('rank prefers prefix and substring matches', () => {
  const doc = parse('1.1.1.1 zzz.test\n1.1.1.1 api.example.com\n1.1.1.1 www.api.test\n');
  const order = rank(doc, 'api').hosts.map((h) => h.host);
  assert.deepEqual(order, ['api.example.com', 'www.api.test', 'zzz.test']);
});

test('rank matches comments and group names', () => {
  const doc = parse('1.1.1.1 a.test # staging\n#==== Production\n1.1.1.1 b.test\n#====\n1.1.1.1 c.test\n');
  assert.equal(rank(doc, 'staging').hosts[0].host, 'a.test');
  const r = rank(doc, 'production');
  assert.equal(r.hosts[0].host, 'b.test');
  assert.ok(r.groupScore < 0);
});

test('empty query keeps file order', () => {
  const doc = parse('1.1.1.1 b\n1.1.1.1 a\n1.1.1.1 c\n');
  assert.deepEqual(
    rank(doc, '').hosts.map((h) => h.host),
    ['b', 'a', 'c'],
  );
});
