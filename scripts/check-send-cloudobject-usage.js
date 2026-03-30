const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const SCAN_DIRS = ['components', 'pages', 'scripts', 'store'];
const EXTENSIONS = new Set(['.js', '.vue', '.ts']);
const LEGACY_OBJECTS = [
  'send_email',
  'send_phone',
  'send_message',
  'send_time',
  'set_enable_sending'
];

function walk(dir, out) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, out);
      continue;
    }
    if (!entry.isFile()) continue;
    const ext = path.extname(entry.name).toLowerCase();
    if (EXTENSIONS.has(ext)) out.push(fullPath);
  }
}

function findLegacyCalls(source) {
  const hits = [];
  for (const name of LEGACY_OBJECTS) {
    const re = new RegExp(`importObject\\(\\s*['"]${name}['"]`, 'g');
    if (re.test(source)) hits.push(name);
  }
  return hits;
}

const files = [];
for (const dir of SCAN_DIRS) walk(path.join(ROOT, dir), files);

const violations = [];
for (const file of files) {
  const code = fs.readFileSync(file, 'utf8');
  const hits = findLegacyCalls(code);
  if (!hits.length) continue;

  const rel = path.relative(ROOT, file).replace(/\\/g, '/');
  violations.push({ file: rel, objects: hits });
}

if (!violations.length) {
  console.log('[OK] No legacy send cloud object calls found in app code.');
  process.exit(0);
}

console.error('[FAIL] Legacy send cloud object calls found:');
for (const item of violations) {
  console.error(`- ${item.file}: ${item.objects.join(', ')}`);
}
process.exit(1);
