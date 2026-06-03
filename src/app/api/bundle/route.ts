export const runtime = 'nodejs'
export const maxDuration = 30

import { NextRequest, NextResponse } from 'next/server'

const ESM_IMPORTS: Record<string, string> = {
  'react':             'https://esm.sh/react@18.3.1',
  'react-dom':         'https://esm.sh/react-dom@18.3.1',
  'react-dom/client':  'https://esm.sh/react-dom@18.3.1/client',
  'react/jsx-runtime': 'https://esm.sh/react@18.3.1/jsx-runtime',
  'lucide-react':      'https://esm.sh/lucide-react@0.383.0',
  'recharts':          'https://esm.sh/recharts@2.12.0',
  'clsx':              'https://esm.sh/clsx@2.1.1',
  'react-router-dom':  'https://esm.sh/react-router-dom@6.28.0',
  'framer-motion':     'https://esm.sh/framer-motion@11.0.0',
  'date-fns':          'https://esm.sh/date-fns@3.6.0',
  'zustand':           'https://esm.sh/zustand@4.5.2',
}

const EXTERNALS = Object.keys(ESM_IMPORTS)

function normalise(p: string): string {
  if (!p.startsWith('/')) p = '/' + p
  if (!p.match(/\.[a-z]+$/i)) p += '.tsx'
  return p
}

function resolveImport(from: string, to: string): string {
  const dir = from.substring(0, from.lastIndexOf('/'))
  const parts = (dir + '/' + to).split('/')
  const out: string[] = []
  for (const p of parts) {
    if (p === '..') out.pop()
    else if (p !== '.') out.push(p)
  }
  return out.join('/')
}

export async function POST(req: NextRequest) {
  try {
    const { files } = await req.json()
    if (!files || Object.keys(files).length === 0) {
      return NextResponse.json({ error: 'No files' }, { status: 400 })
    }

    // Build file map
    const fileMap: Record<string, string> = {}
    let css = ''
    for (const [path, file] of Object.entries(files)) {
      const np = normalise(path)
      const content = (file as any)?.content ?? String(file)
      fileMap[np] = content
      if (np.endsWith('.css')) css += content + '\n'
    }

    // Find entry
    const entry = ['/src/App.tsx', '/src/App.jsx', '/App.tsx'].find(e => fileMap[e])
      || Object.keys(fileMap).find(k => k.endsWith('.tsx'))
      || ''
    if (!entry) return NextResponse.json({ error: 'No App.tsx found' }, { status: 400 })

    // Use esbuild via require (Node.js only)
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const esbuild = require('esbuild')

    const result = await esbuild.build({
      entryPoints: [entry],
      bundle: true,
      format: 'esm',
      write: false,
      minify: false,
      jsx: 'automatic',
      jsxImportSource: 'react',
      external: EXTERNALS,
      loader: { '.tsx': 'tsx', '.ts': 'ts', '.jsx': 'jsx', '.js': 'js', '.css': 'css', '.json': 'json' },
      plugins: [{
        name: 'virtual',
        setup(build: any) {
          build.onResolve({ filter: /.*/ }, (args: any) => {
            // Named external packages
            if (EXTERNALS.includes(args.path)) return { path: args.path, external: true }
            if (EXTERNALS.some((e: string) => args.path.startsWith(e + '/'))) return { path: args.path, external: true }

            // Relative or absolute path — resolve against virtual FS
            if (args.path.startsWith('.') || args.path.startsWith('/')) {
              const resolved = args.importer ? resolveImport(args.importer, args.path) : normalise(args.path)
              for (const s of ['', '.tsx', '.ts', '.jsx', '.js', '/index.tsx', '/index.ts']) {
                if (fileMap[resolved + s]) return { path: resolved + s, namespace: 'virtual' }
              }
              // Not found in virtual FS — skip
              return { path: resolved, external: true }
            }

            // Unknown npm package — load from esm.sh CDN
            return { path: `https://esm.sh/${args.path}`, external: true }
          })
          build.onLoad({ filter: /.*/, namespace: 'virtual' }, (args: any) => {
            const content = fileMap[args.path]
            if (!content) return { errors: [{ text: `Not found: ${args.path}` }] }
            const ext = args.path.split('.').pop()
            if (ext === 'css') { css += content + '\n'; return { contents: '', loader: 'js' } }
            const loader = ext === 'ts' ? 'ts' : (ext === 'js' || ext === 'jsx') ? 'jsx' : 'tsx'
            return { contents: content, loader }
          })
        },
      }],
    })

    if (result.errors?.length > 0) {
      const msg = result.errors.map((e: any) => `${e.text}${e.location ? ` (${e.location.file}:${e.location.line})` : ''}`).join('\n')
      return NextResponse.json({ error: msg }, { status: 422 })
    }

    const js = result.outputFiles?.[0]?.text ?? ''
    const importmap = JSON.stringify({ imports: ESM_IMPORTS })

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Preview</title>
<script type="importmap">${importmap}</script>
<style>*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}html,body,#root{height:100%;width:100%}body{-webkit-font-smoothing:antialiased}#wyber-err{display:none;position:fixed;inset:0;background:#09090b;color:#ef4444;font-family:monospace;font-size:13px;padding:24px;overflow:auto;white-space:pre-wrap;z-index:9999}</style>
<style>${css}</style>
</head>
<body>
<div id="root"></div><div id="wyber-err"></div>
<script type="module">
window.onerror=(m,f,l,c,e)=>{const el=document.getElementById('wyber-err');if(el){el.style.display='block';el.textContent='Error: '+m+'\\n'+(e?.stack||f+':'+l+':'+c);}};
window.onunhandledrejection=e=>{const el=document.getElementById('wyber-err');if(el){el.style.display='block';el.textContent=''+e.reason;}};
${js}

// Click-to-edit bridge — sends element info to parent when clicked
(function(){
  let overlay = null;
  document.addEventListener('click', function(e){
    const el = e.target;
    if(!el || el.id === 'wyber-err') return;
    const tag = el.tagName.toLowerCase();
    const text = (el.innerText || '').trim().slice(0, 60);
    const cls = el.className && typeof el.className === 'string' ? el.className.split(' ')[0] : '';
    const info = [tag, cls && '.'+cls, text && '"'+text+'"'].filter(Boolean).join(' ');
    try { window.parent.postMessage({ type: 'wyber-click', element: info, tag, className: cls, text }, '*'); } catch(e){}
  }, true);
})();
</script>
</body></html>\``

    return NextResponse.json({ html })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
