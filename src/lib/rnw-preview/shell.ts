// Shared HTML shell for the in-house react-native-web mobile preview.
//
// The bundle (raw ESM `js`) is platform-AGNOSTIC and produced once by
// /api/rn-web-bundle. This shell wraps it into a full HTML document, injecting
// per-device globals (chosen platform + safe-area insets) BEFORE the module
// runs — so the CLIENT can switch iOS/Android and device models by re-wrapping
// the same bundle in a new srcDoc and remounting the iframe, with NO server
// round-trip. Only file edits trigger a re-bundle.
//
// Failures degrade calmly (import error / async throw / blank screen all resolve
// to the same "Preview unavailable" card) — we can't render on-device from here,
// so the preview must never show a raw stack or a white void.

// Pinned singletons. Duplicate React is the #1 cause of RN-web blank screens
// ("Invalid hook call"); the bundler tells every esm.sh dep to reuse these.
export const REACT_VERSION = '18.3.1'
export const RNW_VERSION = '0.19.13'
const ESM = 'https://esm.sh'
const RNW = `${ESM}/react-native-web@${RNW_VERSION}?external=react,react-dom`

export const IMPORT_MAP = {
  imports: {
    react: `${ESM}/react@${REACT_VERSION}`,
    'react-dom': `${ESM}/react-dom@${REACT_VERSION}?external=react`,
    'react-dom/client': `${ESM}/react-dom@${REACT_VERSION}/client?external=react`,
    'react/jsx-runtime': `${ESM}/react@${REACT_VERSION}/jsx-runtime`,
    'react/jsx-dev-runtime': `${ESM}/react@${REACT_VERSION}/jsx-dev-runtime`,
    'react-native': RNW,
    'react-native-web': RNW,
  },
}

export type PreviewPlatform = 'ios' | 'android'
export interface PreviewInsets { top: number; bottom: number }

export interface PreviewShellOpts {
  platform?: PreviewPlatform
  insets?: PreviewInsets
}

const DEFAULT_INSETS: PreviewInsets = { top: 47, bottom: 34 } // iPhone-ish default

/**
 * Wrap a compiled RN-web bundle into a ready-to-iframe HTML document.
 * Injects window.__WYBER_PLATFORM__ / __WYBER_INSETS__ (read by the boot module
 * to set Platform.OS + safe-area insets) via a classic script that runs before
 * the deferred module bundle.
 */
export function buildPreviewHtml(js: string, opts: PreviewShellOpts = {}): string {
  const platform: PreviewPlatform = opts.platform === 'android' ? 'android' : 'ios'
  const insets = opts.insets ?? DEFAULT_INSETS
  const importmap = JSON.stringify(IMPORT_MAP)
  const globals = JSON.stringify({ platform, insets })
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Preview</title>
<script type="importmap">${importmap}</script>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body,#root{height:100%;width:100%}
/* touch-action:manipulation stops the WebView/browser from treating taps as
   pan/zoom candidates (which swallowed presses and made the app feel dead);
   the tap-highlight + callout resets remove the grey flash / long-press menu so
   it feels like a native app, not a web page. */
html{touch-action:manipulation;-webkit-text-size-adjust:100%}
body{background:#FFFFFF;-webkit-font-smoothing:antialiased;overflow:hidden;touch-action:manipulation;-webkit-tap-highlight-color:transparent;-webkit-touch-callout:none}
#root{display:flex;touch-action:manipulation}
#wyber-fallback{display:none;position:fixed;inset:0;background:#0A0A0B;color:#F5F5F7;flex-direction:column;align-items:center;justify-content:center;padding:24px;text-align:center;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif}
#wyber-fallback .t{font-size:16px;font-weight:600;margin-bottom:6px}
#wyber-fallback .s{font-size:13px;color:#9A9AA5;max-width:280px;line-height:1.5}
</style>
</head>
<body>
<div id="root"></div>
<div id="wyber-fallback"><div class="t">Preview unavailable</div><div class="s">This screen uses a feature we can’t render in the in-app preview yet. It will still work in a full build.</div></div>
<script>
(function(){
  var g = ${globals};
  window.__WYBER_PLATFORM__ = g.platform;
  window.__WYBER_INSETS__ = g.insets;
  var shown=false;
  function calm(msg, detail){ if(shown)return; shown=true; var el=document.getElementById('wyber-fallback'); if(el)el.style.display='flex';
    try{ (window.parent||window).postMessage({type:'wyber-preview-error',message:String(msg||'load'),detail:String(detail||'')}, '*'); }catch(e){}
    try{ window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({type:'preview-error',message:String(msg||'load'),detail:String(detail||'')})); }catch(e){} }
  window.addEventListener('error', function(ev){ var loc = ev && ev.filename ? (String(ev.filename).split('/').pop()+':'+ev.lineno) : ''; calm(ev && ev.message, (ev && ev.error && ev.error.stack) || loc); });
  window.addEventListener('unhandledrejection', function(ev){ var r = ev && ev.reason; calm(r && (r.message||r), r && r.stack); });
  // Blank-screen watchdog: nothing mounted after 8s → calm card.
  setTimeout(function(){ var r=document.getElementById('root'); if(r && r.childElementCount===0) calm('timeout'); }, 8000);
})();
</script>
<script type="module">
${js}
</script>
</body></html>`
}
