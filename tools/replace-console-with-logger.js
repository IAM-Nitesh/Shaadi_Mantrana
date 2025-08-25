#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const FRONTEND_SRC = path.join(ROOT, 'frontend', 'src');
const LOGGER_PATH = path.join(FRONTEND_SRC, 'utils', 'logger.ts');

function toPosix(p) {
  return p.split(path.sep).join('/');
}

function computeImportPath(file) {
  const rel = path.relative(path.dirname(file), LOGGER_PATH);
  let pos = toPosix(rel);
  if (!pos.startsWith('.')) pos = `./${pos}`;
  // remove .ts extension
  pos = pos.replace(/\.ts$/, '');
  return pos;
}

function shouldSkip(filePath, content) {
  // skip ConsoleSuppressor explicitly
  if (filePath.endsWith('ConsoleSuppressor.tsx')) return true;
  return false;
}

function replaceInFile(filePath) {
  let src = fs.readFileSync(filePath, 'utf8');
  if (shouldSkip(filePath, src)) return false;

  const importPath = computeImportPath(filePath);

  // Ensure we don't modify commented console statements: only replace console where not preceded by // on the same line
  // We'll use a line-by-line approach for safety
  const lines = src.split('\n');
  let changed = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    // skip full-line comments
    if (trimmed.startsWith('//')) continue;
    // simple replacements
    let newLine = line
      .replace(/console\.log\s*\(/g, 'logger.debug(')
      .replace(/console\.info\s*\(/g, 'logger.info(')
      .replace(/console\.warn\s*\(/g, 'logger.warn(')
      .replace(/console\.error\s*\(/g, 'logger.error(')
      .replace(/console\.debug\s*\(/g, 'logger.debug(');
    if (newLine !== line) {
      lines[i] = newLine;
      changed = true;
    }
  }

  if (!changed) return false;

  src = lines.join('\n');

  // add import if not present
  if (!/\blogger\b/.test(src)) {
    // find last import position
    const importRegex = /^import .*;$/mg;
    let lastImportIndex = -1;
    let match;
    while ((match = importRegex.exec(src)) !== null) {
      lastImportIndex = match.index + match[0].length;
    }
    const importLine = `import logger from '${importPath}';`;
    if (lastImportIndex >= 0) {
      src = src.slice(0, lastImportIndex) + '\n' + importLine + src.slice(lastImportIndex);
    } else {
      src = importLine + '\n' + src;
    }
  }

  fs.writeFileSync(filePath, src, 'utf8');
  console.log('Updated', filePath);
  return true;
}

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      // skip node_modules and .next
      if (ent.name === 'node_modules' || ent.name === '.next') continue;
      walk(full);
    } else if (ent.isFile()) {
      if (/\.(ts|tsx|js|jsx)$/.test(ent.name)) {
        try {
          replaceInFile(full);
        } catch (e) {
          console.error('Error processing', full, e.message);
        }
      }
    }
  }
}

if (!fs.existsSync(FRONTEND_SRC)) {
  console.error('frontend/src not found at expected path:', FRONTEND_SRC);
  process.exit(1);
}

walk(FRONTEND_SRC);

console.log('Done.');
