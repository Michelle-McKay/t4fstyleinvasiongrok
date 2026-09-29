#!/usr/bin/env node
'use strict';
/* Builds the phone checklist page (one self-contained HTML file) from tools/artcatalog.js.
   node tools/checklist.js out.html   Assets already in assets/manifest.json show as "in the game". */
const fs = require('fs'), path = require('path');
const c = require('./artcatalog').build();
let have = []; try { have = Object.keys(JSON.parse(fs.readFileSync(path.join(__dirname, '../assets/manifest.json'), 'utf8')).files || {}); } catch (e) { }
const data = JSON.stringify({ style: c.style, groups: c.groups, items: c.items, have }).replace(/</g, '\\u003c');
const html = fs.readFileSync(path.join(__dirname, 'checklist.template.html'), 'utf8').replace('/*DATA*/null', () => data);
fs.writeFileSync(process.argv[2] || 'art-checklist.html', html);
console.log('wrote', process.argv[2] || 'art-checklist.html', Math.round(html.length / 1024) + ' KB');
