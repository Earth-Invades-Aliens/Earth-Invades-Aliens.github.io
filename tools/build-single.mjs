import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

let html = read('index.html');
const css = read('style.css');

const scripts = ['js/core.js', 'js/data.js', 'js/art.js', 'js/game.js'];
html = html.replace('<link rel="stylesheet" href="style.css">', () => '<style>\n' + css + '\n</style>');
for (const src of scripts) {
  const marker = `<script src="${src}"></script>`;
  if (!html.includes(marker)) throw new Error('missing script marker: ' + marker);
  const js = read(src);
  html = html.replace(marker, () => '<script>\n' + js + '\n</script>');
}

if (html.includes('src="js/') || html.includes('href="style.css"')) {
  console.log('remaining src js:', html.includes('src="js/'));
  console.log('remaining style.css:', html.includes('href="style.css"'));
  const m = html.match(/.{0,50}(?:src="js\/|href="style\.css").{0,50}/g);
  console.log(m);
  throw new Error('single-file build still references external assets');
}

const out = path.join(root, 'TURBO_TOWER_MUST_FALL.html');
fs.writeFileSync(out, html);
console.log('wrote', out, (html.length / 1024).toFixed(1) + ' KB');
