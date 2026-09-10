#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);
const html = await readFile(new URL('index.html', root), 'utf8');
const data = JSON.parse(await readFile(new URL('games.json', root), 'utf8'));
const snapshot = JSON.parse(html.match(/var SNAPSHOT = ([^\n]+);/)[1]);
const markup = html.replace(/<script[^>]*>[\s\S]*?<\/script>/g, '').replace(/<!--[\s\S]*?-->/g, '');
assert.deepEqual(snapshot, data, 'Run node tools/sync-games.mjs to update the fallback.');
assert(data.machines.length > 0);
assert.equal(data.location.id, 15825);
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
assert.equal(new Set(ids).size, ids.length, 'Duplicate HTML ids');
for (const match of html.matchAll(/href="#([^"]+)"/g)) assert(ids.includes(match[1]), `Missing anchor ${match[1]}`);
for (const match of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)) {
  if (match[1].includes('application/ld+json')) JSON.parse(match[2]);
  else new vm.Script(match[2]);
}
const paths = new Set(['assets/site.css', 'games.json', 'instagram.json', 'og-image.jpg', 'CNAME']);
for (const match of markup.matchAll(/(?:src|href)="([^"#]+)"/g)) {
  if (!/^(?:[a-z]+:|\/\/)/i.test(match[1])) paths.add(match[1]);
}
const css = await readFile(new URL('assets/site.css', root), 'utf8');
for (const match of css.matchAll(/url\('([^']+)'\)/g)) paths.add(`assets/${match[1]}`);
const documents = new Map([['index.html', html]]);
for (const name of ['privacy.html', 'accessibility.html']) {
  documents.set(name, await readFile(new URL(name, root), 'utf8'));
}
for (const [name, document] of documents) {
  const content = document.replace(/<script[^>]*>[\s\S]*?<\/script>/g, '').replace(/<!--[\s\S]*?-->/g, '');
  const documentIds = [...content.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(new Set(documentIds).size, documentIds.length, `Duplicate ids in ${name}`);
  assert.equal((content.match(/<h1\b/g) || []).length, 1, `Expected one h1 in ${name}`);
  assert(content.includes('<html lang="en">'), `Missing language in ${name}`);
  for (const policy of ['privacy.html', 'accessibility.html']) {
    assert(content.includes(`href="${policy}"`), `Missing ${policy} link in ${name}`);
  }
  for (const match of content.matchAll(/(?:src|href)="([^"\s]+)"/g)) {
    if (/^(?:[a-z]+:|\/\/)/i.test(match[1])) continue;
    const target = new URL(match[1], new URL(name, root));
    const anchor = target.hash.slice(1);
    target.hash = ''; target.search = '';
    await access(target);
    paths.add(target.href.slice(root.href.length));
    if (anchor && target.pathname.endsWith('.html')) {
      const linked = await readFile(target, 'utf8');
      assert(linked.includes(`id="${decodeURIComponent(anchor)}"`), `Missing target ${match[1]} in ${name}`);
    }
  }
}
const workflow = await readFile(new URL('.github/workflows/deploy.yml', root), 'utf8');
assert(/cp index\.html privacy\.html accessibility\.html/.test(workflow), 'Policy pages must be included in the Pages upload.');
const instagram = JSON.parse(await readFile(new URL('instagram.json', root), 'utf8'));
for (const post of instagram.posts) paths.add(post.image);
for (const path of paths) await access(new URL(path, root));
for (const id of ['bigCount', 'chipCount']) {
  assert.equal(Number(html.match(new RegExp(`id="${id}">(\\d+)`))[1]), data.machines.length);
}
assert(!html.includes('This list syncs from'), 'Do not promise a live roster.');
assert(css.includes('[hidden]{display:none!important}'));
assert(css.includes('prefers-reduced-motion'));
console.log(`Validated ${data.machines.length} machines, embedded fallback, scripts, metadata, all ${documents.size} pages, local links/assets, and policy deployment coverage.`);
