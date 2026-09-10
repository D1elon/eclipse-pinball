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
const instagram = JSON.parse(await readFile(new URL('instagram.json', root), 'utf8'));
for (const post of instagram.posts) paths.add(post.image);
for (const path of paths) await access(new URL(path, root));
for (const id of ['bigCount', 'chipCount']) {
  assert.equal(Number(html.match(new RegExp(`id="${id}">(\\d+)`))[1]), data.machines.length);
}
assert(!html.includes('This list syncs from'), 'Do not promise a live roster.');
assert(css.includes('[hidden]{display:none!important}'));
assert(css.includes('prefers-reduced-motion'));
console.log(`Validated ${data.machines.length} machines, embedded fallback, scripts, metadata, anchors, and ${paths.size} local assets.`);
