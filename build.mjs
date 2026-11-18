// Bundle src (three.js + game) with esbuild and inline everything into one dist/index.html (copied to ./index.html)
import { build } from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
const r = await build({ entryPoints: ['src/main.js'], bundle: true, minify: true, format: 'iife', write: false, target: 'es2020', legalComments: 'none' });
const js = '/*! three.js | MIT License | Copyright 2010-2025 three.js authors | https://github.com/mrdoob/three.js */\n' + r.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
let html = readFileSync('src/index.html', 'utf8');
// favicon from assets/ (made by test/make-icon.mjs), inlined as data URIs so the game stays one offline file
const uri = f => 'data:image/png;base64,' + readFileSync(f).toString('base64');
if (existsSync('assets/icon-64.png')) html = html.replace('</title>', () => `</title>\n<link rel="icon" type="image/png" sizes="64x64" href="${uri('assets/icon-64.png')}">\n<link rel="icon" type="image/png" sizes="32x32" href="${uri('assets/icon-32.png')}">\n<link rel="apple-touch-icon" href="${uri('assets/icon-128.png')}">`);
html = html.replace('/*CSS*/', () => readFileSync('src/style.css', 'utf8')).replace('/*JS*/', () => js);
mkdirSync('dist', { recursive: true }); writeFileSync('dist/index.html', html);
// the same full game at the repo root, so https://kevin-nm.github.io/kyoka-survivor/ opens it directly (/dist/ keeps working;
// saves live in localStorage under fixed 'kyoka-*' keys, shared by the whole origin whatever the path)
writeFileSync('index.html', html);
console.log('dist/index.html + index.html', (html.length / 1024).toFixed(0) + ' KB (js ' + (js.length / 1024).toFixed(0) + ' KB)');
