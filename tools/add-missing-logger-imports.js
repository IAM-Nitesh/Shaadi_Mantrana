#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const FRONTEND_SRC = path.join(ROOT, 'frontend', 'src');
const LOGGER_PATH = path.join(FRONTEND_SRC, 'utils', 'logger.ts');

function toPosix(p) { return p.split(path.sep).join('/'); }

function computeImportPath(file) {
  const rel = path.relative(path.dirname(file), LOGGER_PATH);
  let pos = toPosix(rel);
  if (!pos.startsWith('.')) pos = `./${pos}`;
  pos = pos.replace(/\.ts$/, '');
  return pos;
}

function processFile(file) {
  const src = fs.readFileSync(file, 'utf8');
  if (!/\blogger\s*\./.test(src)) return false; // no logger usage
  if (/import\s+logger\b/.test(src)) return false; // already has import

  const importPath = computeImportPath(file);
  const importLine = `import logger from '${importPath}';`;

  // find insertion point after last import
  const importRegex = /^import .*;$/mg;
  let lastImportIndex = -1;
  let match;
  while ((match = importRegex.exec(src)) !== null) {
    lastImportIndex = match.index + match[0].length;
  }

  let out;
  if (lastImportIndex >= 0) {
    out = src.slice(0, lastImportIndex) + '\n' + importLine + src.slice(lastImportIndex);
  } else {
    out = importLine + '\n' + src;
  }

  fs.writeFileSync(file, out, 'utf8');
  console.log('Inserted import in', file);
  return true;
}

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === 'node_modules' || ent.name === '.next') continue;
      walk(full);
    } else if (ent.isFile()) {
      if (/\.(ts|tsx|js|jsx)$/.test(ent.name)) {
        try { processFile(full); } catch (e) { console.error('err', full, e.message); }
      }
    }
  }
}

if (!fs.existsSync(FRONTEND_SRC)) { console.error('frontend/src not found'); process.exit(1); }
walk(FRONTEND_SRC);
console.log('Done.');
