'use client'
import { useState, useEffect, useRef } from 'react'
import { useEditorStore } from '@/store/editor'

// ─── srcdoc builder ───────────────────────────────────────────────────────────
// Runs react-native-web in the iframe via UMD globals + Babel standalone.
// No Snack API call — srcdoc is generated directly from the file map.

function buildSrcdoc(files: Record<string, string>): string {
  // Escape </script so the HTML parser doesn't close the script tag prematurely
  const filesJson = JSON.stringify(files).replace(/<\/script/gi, '<\\/script')

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<style>
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
html,body,#root{height:100%;margin:0;padding:0;background:#fff;font-family:-apple-system,BlinkMacSystemFont,sans-serif}
#__err{display:none;position:fixed;inset:0;background:#1a0000;color:#ff6b6b;font-family:monospace;font-size:11px;padding:16px;overflow:auto;white-space:pre-wrap;z-index:9999}
</style>
</head>
<body>
<div id="root"></div>
<div id="__err"></div>

<!-- Error reporter: must run before any other script -->
<script>
window.__cdnFailed = [];
function __postErr(msg) {
  document.getElementById('__err').style.display='block';
  document.getElementById('__err').textContent = msg;
  try { window.parent.postMessage({ type: 'preview-error', message: msg }, '*'); } catch(e) {}
}
window.onerror = function(msg, src, line, col, err) {
  __postErr('Runtime error: ' + (err ? err.message : msg) + (src ? ' (' + src.split('/').pop() + ':' + line + ')' : ''));
};
window.addEventListener('unhandledrejection', function(e) {
  __postErr('Unhandled promise rejection: ' + (e.reason && e.reason.message ? e.reason.message : String(e.reason)));
});
</script>

<!-- UMD globals — jsDelivr, no crossorigin (avoids CORB), null-origin sandbox (no CSP inheritance) -->
<script src="https://cdn.jsdelivr.net/npm/react@18.2.0/umd/react.production.min.js" onerror="window.__cdnFailed.push('react')"></script>
<script src="https://cdn.jsdelivr.net/npm/react-dom@18.2.0/umd/react-dom.production.min.js" onerror="window.__cdnFailed.push('react-dom')"></script>
<script src="https://cdn.jsdelivr.net/npm/react-native-web@0.19.12/dist/react-native-web.js" onerror="window.__cdnFailed.push('react-native-web')"></script>
<script src="https://cdn.jsdelivr.net/npm/@babel/standalone@7.23.10/babel.min.js" onerror="window.__cdnFailed.push('@babel/standalone')"></script>

<script>
(function(){
'use strict';
var R = window.React;
var RD = window.ReactDOM;
var RNW = window.ReactNativeWeb;
var h = R.createElement;

if(window.__cdnFailed.length>0){
  __postErr('CDN scripts failed to load: ' + window.__cdnFailed.join(', ') + '\n\nThis is usually a network issue. Check your internet connection or try refreshing.');
  return;
}
if(!R||!RD||!RNW){
  __postErr('CDN globals missing (React=' + !!R + ', ReactDOM=' + !!RD + ', RNW=' + !!RNW + ').\nCheck that CDN scripts loaded correctly.');
  return;
}

// ── Navigation stubs ──────────────────────────────────────────────────────────
// Implements enough of react-navigation to render real tab/stack navigators in browser.

var NavContext = R.createContext({ navigate: function(){}, goBack: function(){}, canGoBack: function(){ return false; }, params: {} });

function useNavigation() { return R.useContext(NavContext); }
function useRoute() { return { params: {}, name: '' }; }

function NavigationContainer(props) { return h(R.Fragment, null, props.children); }

function makeStackNavigator() {
  function Navigator(props) {
    var children = R.Children.toArray(props.children);
    var initialName = props.initialRouteName || (children[0] && children[0].props && children[0].props.name);
    var state = R.useState(initialName);
    var current = state[0]; var setCurrent = state[1];
    var historyRef = R.useRef([initialName]);
    var paramsRef = R.useRef({});

    var nav = {
      navigate: function(name, params) { historyRef.current.push(name); paramsRef.current[name]=params||{}; setCurrent(name); },
      goBack: function() { if(historyRef.current.length>1){ historyRef.current.pop(); setCurrent(historyRef.current[historyRef.current.length-1]); } },
      canGoBack: function() { return historyRef.current.length>1; },
      params: paramsRef.current[current]||{},
    };

    var screen = children.find(function(c){ return c.props && c.props.name===current; }) || children[0];
    var Comp = screen && screen.props && (screen.props.component||screen.props.getComponent&&screen.props.getComponent());
    var title = screen && screen.props && screen.props.options && screen.props.options.title || (screen && screen.props && screen.props.name);

    return h(NavContext.Provider, { value: nav },
      h(RNW.View, { style: { flex:1, display:'flex', flexDirection:'column' } },
        // Header bar
        h(RNW.View, { style: { height:56, backgroundColor: props.screenOptions&&props.screenOptions.headerStyle&&props.screenOptions.headerStyle.backgroundColor||'#fff', flexDirection:'row', alignItems:'center', paddingHorizontal:16, borderBottomWidth:1, borderBottomColor:'#e5e5ea', shadowColor:'#000', shadowOffset:{width:0,height:1}, shadowOpacity:0.1, shadowRadius:2 } },
          nav.canGoBack() && h(RNW.TouchableOpacity, { onPress: nav.goBack, style:{ marginRight:12, padding:4 } },
            h(RNW.Text, { style:{ fontSize:16, color: props.screenOptions&&props.screenOptions.headerTintColor||'#007AFF' } }, '‹')
          ),
          h(RNW.Text, { style:{ fontSize:17, fontWeight:'600', color: props.screenOptions&&props.screenOptions.headerTitleStyle&&props.screenOptions.headerTitleStyle.color||'#000', flex:1 } }, title||'')
        ),
        // Screen content
        h(RNW.View, { style:{ flex:1 } },
          Comp && h(Comp, { navigation: nav, route: { name: current, params: nav.params } })
        )
      )
    );
  }
  function Screen(){ return null; }
  return { Navigator: Navigator, Screen: Screen };
}

function makeTabNavigator() {
  function Navigator(props) {
    var children = R.Children.toArray(props.children);
    var initialName = props.initialRouteName || (children[0]&&children[0].props&&children[0].props.name);
    var state = R.useState(initialName);
    var current = state[0]; var setCurrent = state[1];

    var nav = {
      navigate: function(name){ setCurrent(name); },
      goBack: function(){},
      canGoBack: function(){ return false; },
      params: {},
    };

    var screen = children.find(function(c){ return c.props&&c.props.name===current; })||children[0];
    var Comp = screen&&screen.props&&(screen.props.component||screen.props.getComponent&&screen.props.getComponent());
    var tabBarOpts = props.screenOptions||{};

    var tabActiveColor = tabBarOpts.tabBarActiveTintColor||'#007AFF';
    var tabInactiveColor = tabBarOpts.tabBarInactiveTintColor||'#8e8e93';
    var tabBarBg = tabBarOpts.tabBarStyle&&tabBarOpts.tabBarStyle.backgroundColor||'#fff';

    return h(NavContext.Provider, { value: nav },
      h(RNW.View, { style:{ flex:1, display:'flex', flexDirection:'column' } },
        h(RNW.View, { style:{ flex:1 } },
          Comp && h(Comp, { navigation: nav, route:{ name: current, params:{} } })
        ),
        // Tab bar
        h(RNW.View, { style:{ flexDirection:'row', backgroundColor: tabBarBg, borderTopWidth:1, borderTopColor:'#e5e5ea', paddingBottom:4 } },
          children.map(function(c){
            if(!c.props) return null;
            var name = c.props.name;
            var isActive = name===current;
            var opts = typeof c.props.options==='function'
              ? c.props.options({ route:{ name: name }, navigation: nav })
              : (c.props.options||{});
            var label = opts.tabBarLabel||opts.title||name;
            var TabIcon = opts.tabBarIcon;

            return h(RNW.TouchableOpacity, { key: name, onPress: function(){ nav.navigate(name); }, style:{ flex:1, alignItems:'center', paddingTop:8, paddingBottom:2 } },
              TabIcon && h(TabIcon, { color: isActive?tabActiveColor:tabInactiveColor, size:24, focused: isActive }),
              h(RNW.Text, { style:{ fontSize:10, color: isActive?tabActiveColor:tabInactiveColor, marginTop:2 } }, label)
            );
          })
        )
      )
    );
  }
  function Screen(){ return null; }
  return { Navigator: Navigator, Screen: Screen };
}

// ── Module stubs ──────────────────────────────────────────────────────────────

function stubIcon(name) {
  return function(props) {
    return h(RNW.Text, { style: Object.assign({ fontSize: props.size||20, color: props.color||'#000' }, props.style) }, '■');
  };
}

var STUBS = {
  'react': R,
  'react/jsx-runtime': { jsx: h, jsxs: h, Fragment: R.Fragment },
  'react-dom': RD,
  'react-native': RNW,
  'react-native-web': RNW,
  'react-native-safe-area-context': {
    SafeAreaProvider: function(p){ return h(RNW.View, { style:{ flex:1 } }, p.children); },
    SafeAreaView: function(p){ return h(RNW.View, { style: Object.assign({ flex:1 }, p.style) }, p.children); },
    useSafeAreaInsets: function(){ return { top:0, bottom:0, left:0, right:0 }; },
  },
  'react-native-screens': {
    enableScreens: function(){},
    Screen: function(p){ return h(RNW.View, { style:{ flex:1 } }, p.children); },
    ScreenContainer: function(p){ return h(RNW.View, { style:{ flex:1 } }, p.children); },
  },
  'react-native-gesture-handler': {
    GestureHandlerRootView: function(p){ return h(RNW.View, Object.assign({}, p), p.children); },
    TouchableOpacity: RNW.TouchableOpacity,
    ScrollView: RNW.ScrollView,
    PanGestureHandler: function(p){ return h(RNW.View, null, p.children); },
    State: {},
    Gesture: { Pan: function(){ return { onBegin:function(){return this;}, onUpdate:function(){return this;}, onEnd:function(){return this;} }; } },
    GestureDetector: function(p){ return h(RNW.View, null, p.children); },
  },
  'react-native-reanimated': {
    default: {
      View: RNW.View, Text: RNW.Text, ScrollView: RNW.ScrollView, Image: RNW.Image,
      createAnimatedComponent: function(C){ return C; },
    },
    useSharedValue: function(v){ return { value: v }; },
    useAnimatedStyle: function(fn){ return {}; },
    withTiming: function(v){ return v; },
    withSpring: function(v){ return v; },
    withDelay: function(_,v){ return v; },
    Easing: { in: function(e){ return e; }, out: function(e){ return e; }, bezier: function(){ return function(){}; } },
    interpolate: function(v){ return v; },
    runOnJS: function(fn){ return fn; },
  },
  'react-native-svg': {
    default: RNW.View,
    Svg: function(p){ return h('svg', { width:p.width, height:p.height, viewBox:p.viewBox }, p.children); },
    Path: function(p){ return h('path', { d:p.d, fill:p.fill, stroke:p.stroke }); },
    Circle: function(p){ return h('circle', { cx:p.cx, cy:p.cy, r:p.r, fill:p.fill }); },
    Rect: function(p){ return h('rect', { x:p.x, y:p.y, width:p.width, height:p.height, fill:p.fill }); },
    G: function(p){ return h('g', null, p.children); },
    Text: function(p){ return h('text', null, p.children); },
  },
  '@react-navigation/native': {
    NavigationContainer: NavigationContainer,
    useNavigation: useNavigation,
    useRoute: useRoute,
    useFocusEffect: R.useEffect,
    useIsFocused: function(){ return true; },
  },
  '@react-navigation/native-stack': { createNativeStackNavigator: makeStackNavigator },
  '@react-navigation/stack': { createStackNavigator: makeStackNavigator },
  '@react-navigation/bottom-tabs': { createBottomTabNavigator: makeTabNavigator },
  '@react-navigation/drawer': { createDrawerNavigator: makeTabNavigator },
  '@react-navigation/material-top-tabs': { createMaterialTopTabNavigator: makeTabNavigator },
  '@expo/vector-icons': new Proxy({}, {
    get: function(_, name){ return stubIcon(name); }
  }),
  'expo-status-bar': { StatusBar: function(){ return null; } },
  'expo-constants': { default: { statusBarHeight:44, manifest:{ name:'App' }, expoConfig:{ name:'App' } } },
  'expo-linear-gradient': {
    LinearGradient: function(props) {
      var colors = props.colors||['#667eea','#764ba2'];
      return h(RNW.View, {
        style: Object.assign({}, props.style, {
          background: 'linear-gradient(180deg,' + colors.join(',') + ')',
        }),
      }, props.children);
    },
  },
  'expo-blur': {
    BlurView: function(p){ return h(RNW.View, { style: Object.assign({ backdropFilter:'blur(10px)' }, p.style) }, p.children); },
  },
  'expo-image': {
    Image: RNW.Image,
  },
  'expo-font': {
    useFonts: function(){ return [true, null]; },
    loadAsync: function(){ return Promise.resolve(); },
  },
  'expo-splash-screen': {
    preventAutoHideAsync: function(){ return Promise.resolve(); },
    hideAsync: function(){ return Promise.resolve(); },
  },
  '@react-native-async-storage/async-storage': {
    default: {
      getItem: function(){ return Promise.resolve(null); },
      setItem: function(){ return Promise.resolve(); },
      removeItem: function(){ return Promise.resolve(); },
      clear: function(){ return Promise.resolve(); },
    },
  },
  'react-native-maps': {
    default: function(){ return h(RNW.View, { style:{ flex:1, backgroundColor:'#c8d8e4', alignItems:'center', justifyContent:'center' } }, h(RNW.Text, { style:{ color:'#666' } }, '🗺 Map Preview')); },
    Marker: function(){ return null; },
    Callout: function(){ return null; },
  },
};

// ── File registry + custom require ────────────────────────────────────────────

var __files__ = ${filesJson};
var __cache__ = {};

function normalizePath(path) {
  var parts = path.split('/');
  var result = [];
  for (var i=0; i<parts.length; i++) {
    if (parts[i]==='..'){ result.pop(); }
    else if (parts[i]!==''&&parts[i]!=='.'){ result.push(parts[i]); }
  }
  return result.join('/');
}

function resolveRelative(from, to) {
  var base = from.split('/').slice(0,-1).join('/');
  return normalizePath((base?base+'/':'')+to);
}

function findFile(path) {
  var exts = ['','.tsx','.ts','.jsx','.js','/index.tsx','/index.ts','/index.jsx','/index.js'];
  for(var i=0;i<exts.length;i++){
    if(__files__[path+exts[i]]!==undefined) return path+exts[i];
  }
  return null;
}

function requireModule(id, fromDir) {
  fromDir = fromDir || '';

  // External stub
  if (STUBS[id] !== undefined) return STUBS[id];

  // Relative import
  if (id.startsWith('.')) {
    var abs = resolveRelative((fromDir?fromDir+'/dummy':'dummy'), id);
    var resolved = findFile(abs);
    if (!resolved) throw new Error('Module not found: ' + id + ' (resolved: ' + abs + ')');

    if (__cache__[resolved]) return __cache__[resolved].exports;

    var source = __files__[resolved];
    var transpiled;
    try {
      transpiled = Babel.transform(source, {
        filename: resolved,
        presets: [
          ['react', { runtime: 'classic' }],
          'typescript',
        ],
        plugins: [
          ['transform-modules-commonjs', { strict: false }],
        ],
      }).code;
    } catch(e) {
      throw new Error('Transpile error in ' + resolved + ': ' + e.message);
    }

    var mod = { exports: {} };
    __cache__[resolved] = mod;
    var dir = resolved.split('/').slice(0,-1).join('/');
    var fn = new Function('require','module','exports', transpiled);
    fn(function(depId){ return requireModule(depId, dir); }, mod, mod.exports);
    return mod.exports;
  }

  // Unknown external — return empty stub
  console.warn('[preview] Unresolved module:', id);
  return {};
}

// ── Boot ──────────────────────────────────────────────────────────────────────

function showError(msg) { __postErr(msg); }

try {
  var appPath = null;
  var candidates = ['App.tsx','App.jsx','App.js','app/index.tsx','app/index.js'];
  for(var i=0;i<candidates.length;i++){
    if(__files__[candidates[i]]!==undefined){ appPath=candidates[i]; break; }
  }
  if(!appPath) throw new Error('No App.tsx entry point found.');

  var appModule = requireModule('./'+appPath, '');
  var App = appModule.default || appModule;
  if(typeof App !== 'function') throw new Error('App.tsx default export is not a React component.');

  RD.render(h(App), document.getElementById('root'));
} catch(e) {
  showError('Preview error: ' + e.message + (e.stack?'\n\n'+e.stack.split('\n').slice(0,8).join('\n'):''));
}

})();
</script>
</body>
</html>`
}

// ─── Component ────────────────────────────────────────────────────────────────

export function MobilePreviewPanel() {
  const { files, isGenerating } = useEditorStore()
  const [srcdoc, setSrcdoc] = useState<string | null>(null)
  const [snackUrl, setSnackUrl] = useState<string | null>(null)
  const [buildingSnack, setBuildingSnack] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const lastKeyRef = useRef('')

  // Listen for errors posted by the iframe
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'preview-error') setPreviewError(e.data.message as string)
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [])

  const hasApp = Object.keys(files ?? {}).some(p =>
    p.includes('App.tsx') || p.includes('App.jsx') || p.includes('App.js')
  )

  const buildPreview = () => {
    if (!hasApp) return
    const plainFiles: Record<string, string> = {}
    for (const [path, file] of Object.entries(files ?? {})) {
      const content = (file as { content?: string }).content || (file as unknown as string)
      if (typeof content === 'string') plainFiles[path] = content
    }
    const key = Object.keys(plainFiles).sort().map(p => `${p}:${plainFiles[p].length}`).join('|')
    if (key === lastKeyRef.current && srcdoc) return
    lastKeyRef.current = key
    setPreviewError(null)
    setSrcdoc(buildSrcdoc(plainFiles))

    // Also kick off Snack save in background (for "Open in Expo" link)
    setBuildingSnack(true)
    fetch('/api/snack', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ files: plainFiles }),
    })
      .then(r => r.json())
      .then(d => { if (d.snackUrl) setSnackUrl(d.snackUrl) })
      .catch(() => {})
      .finally(() => setBuildingSnack(false))
  }

  // Build preview whenever files change or generation ends (covers generation, gallery load, hydration)
  useEffect(() => {
    if (!isGenerating && hasApp) buildPreview()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files, isGenerating])

  const refresh = () => {
    lastKeyRef.current = ''
    setSrcdoc(null)
    setTimeout(() => buildPreview(), 50)
  }

  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', background: '#09090b' }}>
      {/* Toolbar */}
      <div style={{ height: 36, display: 'flex', alignItems: 'center', padding: '0 12px', gap: 8, borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#111118', flexShrink: 0 }}>
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: srcdoc ? '#22c55e' : isGenerating ? '#f59e0b' : '#3f3f46', transition: 'all 0.3s' }} />
        <span style={{ flex: 1, fontSize: 11, color: '#52525b', fontFamily: 'monospace' }}>
          {isGenerating ? 'Writing your app...' : srcdoc ? 'Live preview (react-native-web)' : 'Describe your app to get started'}
        </span>
        {snackUrl && (
          <a href={snackUrl} target="_blank" rel="noopener noreferrer"
            style={{ background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.3)', borderRadius: 5, color: '#0EA5E9', padding: '2px 10px', fontSize: 11, fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            Open in Expo
          </a>
        )}
        {hasApp && !isGenerating && (
          <button onClick={refresh}
            style={{ background: 'none', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 5, color: '#52525b', cursor: 'pointer', padding: '2px 8px', fontSize: 11 }}>⟳</button>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
        {/* Empty state */}
        {!hasApp && !isGenerating && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <rect x="12" y="2" width="24" height="44" rx="5" stroke="rgba(14,165,233,0.3)" strokeWidth="1.5" fill="rgba(14,165,233,0.04)"/>
              <rect x="20" y="6" width="8" height="2" rx="1" fill="rgba(14,165,233,0.4)"/>
              <circle cx="24" cy="42" r="2" fill="rgba(14,165,233,0.3)"/>
            </svg>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#e4e4e7' }}>Mobile preview</div>
            <div style={{ fontSize: 12, color: '#a1a1aa', maxWidth: 220, textAlign: 'center', lineHeight: 1.5 }}>Describe your React Native app and it'll render here instantly</div>
          </div>
        )}

        {/* Generating overlay */}
        {isGenerating && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, background: '#09090b', zIndex: 5 }}>
            <div style={{ width: 28, height: 28, border: '2px solid rgba(14,165,233,0.15)', borderTopColor: '#0EA5E9', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <div style={{ fontSize: 13, color: '#71717a', fontWeight: 500 }}>Writing your app...</div>
          </div>
        )}

        {/* Live preview iframe — phone-style centered frame */}
        {srcdoc && !isGenerating && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#09090b', padding: 16 }}>
            <div style={{
              width: 375, maxWidth: '100%',
              height: Math.min(812, window?.innerHeight ? window.innerHeight - 80 : 700),
              borderRadius: 40,
              overflow: 'hidden',
              boxShadow: '0 0 0 8px #1a1a1a, 0 0 0 9px #333, 0 30px 80px rgba(0,0,0,0.6)',
              border: '1px solid #222',
              background: '#000',
              flexShrink: 0,
            }}>
              {/* Notch */}
              <div style={{ height: 28, background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 90, height: 20, background: '#0a0a0a', borderRadius: 10 }} />
              </div>
              {previewError ? (
                <div style={{ width: '100%', height: 'calc(100% - 28px)', overflow: 'auto', background: '#1a0505', padding: 12 }}>
                  <div style={{ fontFamily: 'monospace', fontSize: 10, color: '#ff6b6b', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                    <strong style={{ display: 'block', marginBottom: 8, fontSize: 11 }}>Preview error</strong>
                    {previewError}
                  </div>
                </div>
              ) : (
                <iframe
                  ref={iframeRef}
                  srcDoc={srcdoc}
                  title="Mobile App Preview"
                  sandbox="allow-scripts"
                  style={{ width: '100%', height: 'calc(100% - 28px)', border: 'none', background: '#fff', display: 'block' }}
                />
              )}
            </div>
          </div>
        )}
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
