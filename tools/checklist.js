#!/usr/bin/env node
'use strict';
/* Builds the phone checklist page (one self-contained HTML file) from tools/artcatalog.js.
   node tools/checklist.js out.html   Assets already in assets/manifest.json show as "in the game". */
const fs = require('fs'), path = require('path');
const c = require('./artcatalog').build();
let have = [], old = []; try { const m = JSON.parse(fs.readFileSync(path.join(__dirname, '../assets/manifest.json'), 'utf8')); have = m.clean || []; old = Object.keys(m.files || {}).filter(k => !have.includes(k)); } catch (e) { }
const FIRST = ['city', 'march', 'tab', 'quest', 'ally'];   // what Michelle wants painted next, shown first among unfinished sections
const groups = c.groups.slice().sort((a, b) => (FIRST.indexOf(a.id) + 1 || 99) - (FIRST.indexOf(b.id) + 1 || 99));
const data = JSON.stringify({ style: c.style, groups, items: c.items, have, old }).replace(/</g, '\\u003c');
const html = fs.readFileSync(path.join(__dirname, 'checklist.template.html'), 'utf8').replace('/*DATA*/null', () => data);
fs.writeFileSync(process.argv[2] || 'art-checklist.html', html);
console.log('wrote', process.argv[2] || 'art-checklist.html', Math.round(html.length / 1024) + ' KB');
