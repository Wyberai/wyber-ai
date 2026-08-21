// validate-templates.mjs  (v2 — understands single-file format + validates NORMALIZED layout)
// Checks every template in prebuilt_apps the same way the loader routes see them:
//  - single-file format ({ code: "..." }) → valid if code is a non-trivial React component
//  - multi-file format → paths normalized under src/ first, then every relative import must resolve
// Usage:  node validate-templates.mjs            (report only)
//         node validate-templates.mjs --mark     (writes valid=true/false flags)

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const env = {};
try {
  for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
} catch {
  console.error('Could not read .env.local — run from the repo root');
  process.exit(1);
}
const url = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_KEY || env.SUPABASE_SERVICE_ROLE;
if (!url || !key) { console.error('Missing Supabase URL or service key in .env.local'); process.exit(1); }

const supabase = createClient(url, key, { auth: { persistSession: false } });
const MARK = process.argv.includes('--mark');

// ── same normalization the routes use ─────────────────────────────
const ROOT_FILES = new Set(['index.html','vite.config.js','vite.config.ts','package.json','tsconfig.json','postcss.config.js','tailwind.config.js','.gitignore']);
const RESOLVE_EXTS = ['', '.jsx', '.tsx', '.js', '.ts', '.css', '/index.jsx', '/index.tsx', '/index.js'];

const contentOf = (v) => (typeof v === 'string' ? v : (v?.content ?? ''));
const normalizePath = (raw) => {
  const p = raw.replace(/^\.?\//, '');
  if (p.startsWith('src/')) return p;
  if (ROOT_FILES.has(p)) return p;
  return `src/${p}`;
};

function resolveImport(fromPath, imp, fileKeys) {
  const fromDir = fromPath.includes('/') ? fromPath.slice(0, fromPath.lastIndexOf('/')) : '';
  const parts = fromDir ? fromDir.split('/') : [];
  for (const seg of imp.split('/')) {
    if (seg === '.') continue;
    else if (seg === '..') parts.pop();
    else parts.push(seg);
  }
  const base = parts.join('/');
  // src/wyber-ui.tsx is injected into every project's virtual FS at preview/publish
  // time regardless of what's stored (src/lib/wyber-preview/engine.ts:174-177,
  // "user files always win; unused kit exports are tree-shaken") — never actually
  // persisted in prebuilt_apps.files, so it will never appear in fileKeys here even
  // though it always resolves for real. Treat it as always-present rather than
  // flagging every wyber-ui-kit-based template as broken.
  if (base === 'src/wyber-ui') return true;
  return RESOLVE_EXTS.some((ext) => fileKeys.has(base + ext));
}

function extractRelativeImports(code) {
  const out = [];
  const re = /(?:import\s[^'"]*?|from\s*|require\()\s*['"](\.{1,2}\/[^'"]+)['"]/g;
  let m;
  while ((m = re.exec(code)) !== null) out.push(m[1]);
  return out;
}

// ── main ──────────────────────────────────────────────────────────
const { data: templates, error } = await supabase.from('prebuilt_apps').select('id, app_id, name, files');
if (error) { console.error('Fetch failed:', error.message); process.exit(1); }

console.log(`Checking ${templates.length} templates...\n`);
const broken = [], ok = [];

for (const t of templates) {
  const raw = t.files || {};
  const problems = [];

  // ----- single-file format -----
  if (typeof raw.code === 'string' && raw.code.trim().length > 0) {
    const code = raw.code;
    if (code.length < 200) problems.push('single-file code suspiciously short');
    if (!/export\s+default/.test(code)) problems.push('single-file code has no default export');
    // relative imports in single-file code can never resolve (there are no other files)
    const rels = extractRelativeImports(code).filter((i) => !i.endsWith('.css'));
    if (rels.length > 0) problems.push(`single-file code imports local files: ${rels.slice(0,3).join(', ')}`);
  } else {
    // ----- multi-file format: validate the NORMALIZED layout -----
    const normalized = {};
    for (const [p, v] of Object.entries(raw)) {
      if (p === 'generated' || p === 'code') continue;
      normalized[normalizePath(p)] = contentOf(v);
    }
    const fileKeys = new Set(Object.keys(normalized));
    const hasApp = [...fileKeys].some((k) => /(^|\/)App\.(jsx|tsx)$/.test(k));
    if (!hasApp) problems.push('missing App.jsx/App.tsx (after normalization)');
    for (const [path, code] of Object.entries(normalized)) {
      if (!/\.(jsx?|tsx?)$/.test(path)) continue;
      for (const imp of extractRelativeImports(code)) {
        if (!resolveImport(path, imp, fileKeys)) problems.push(`${path} imports "${imp}" → not found`);
      }
    }
  }

  if (problems.length) broken.push({ app_id: t.app_id, id: t.id, name: t.name, problems });
  else ok.push({ app_id: t.app_id, id: t.id, name: t.name });
}

console.log(`✓ VALID:  ${ok.length}`);
console.log(`✗ BROKEN: ${broken.length}\n`);
if (broken.length) {
  console.log('──── BROKEN TEMPLATES ────');
  for (const b of broken) {
    console.log(`\n[${b.app_id}] ${b.name}`);
    for (const p of b.problems.slice(0, 5)) console.log(`   - ${p}`);
    if (b.problems.length > 5) console.log(`   ...and ${b.problems.length - 5} more`);
  }
}

if (MARK) {
  console.log('\nMarking valid flags...');
  if (ok.length) {
    const { error: e1 } = await supabase.from('prebuilt_apps').update({ valid: true }).in('id', ok.map(o => o.id));
    if (e1) console.error('valid=true failed:', e1.message);
  }
  if (broken.length) {
    const { error: e2 } = await supabase.from('prebuilt_apps').update({ valid: false }).in('id', broken.map(b => b.id));
    if (e2) console.error('valid=false failed:', e2.message);
  }
  console.log('Done.');
} else {
  console.log('\n(Report only. Run with --mark to write flags.)');
}
