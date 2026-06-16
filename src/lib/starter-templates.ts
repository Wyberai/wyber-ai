import { Framework, FileNode } from '@/store/editor';

type FileMap = Record<string, FileNode>;

function f(path: string, content: string): FileNode {
  const ext = path.split('.').pop() ?? '';
  const langMap: Record<string, string> = {
    ts: 'typescript', tsx: 'typescript', js: 'javascript', jsx: 'javascript',
    css: 'css', html: 'html', json: 'json', md: 'markdown', vue: 'vue',
  };
  return { path, content: content.trim(), language: langMap[ext] ?? 'plaintext' };
}

export const STARTER_TEMPLATES: Record<Framework, FileMap> = {
  'react-vite': {
    'index.html': f('index.html', `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`),
    'src/main.tsx': f('src/main.tsx', `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`),
    'src/App.tsx': f('src/App.tsx', `import { useState } from 'react';
export default function App() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui', gap: 16 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, color: '#0EA5E9' }}>Your app will appear here</h1>
      <p style={{ color: '#a1a1aa', fontSize: 15 }}>Describe what you want to build in the chat &rarr;</p>

    </div>
  );
}`),
    'src/index.css': f('src/index.css', `*, *::before, *::after { box-sizing: border-box; }
body { margin: 0; padding: 0; }`),
    'package.json': f('package.json', `{
  "name": "app",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.0",
    "typescript": "^5.5.0",
    "vite": "^5.4.0"
  }
}`),
    'vite.config.ts': f('vite.config.ts', `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({ plugins: [react()] });`),
  },
  'vue': {
    'index.html': f('index.html', `<!DOCTYPE html>
<html lang="en">
  <head><meta charset="UTF-8" /><title>App</title></head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.js"></script>
  </body>
</html>`),
    'src/main.js': f('src/main.js', `import { createApp } from 'vue';
import App from './App.vue';
createApp(App).mount('#app');`),
    'src/App.vue': f('src/App.vue', `<template>
  <div class="app">
    <h1 style="color:#0EA5E9">Your app will appear here</h1>
    <p>Edit this file or describe what you want to build.</p>
    <button @click="count++">Describe what you want to build</button>
  </div>
</template>
<script setup>
import { ref } from 'vue';
const count = ref(0);
</script>
<style>
.app { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; font-family: system-ui; gap: 16px; }
button { padding: 10px 24px; font-size: 16px; border-radius: 8px; border: none; background: #7c6ef7; color: white; cursor: pointer; }
</style>`),
    'package.json': f('package.json', `{
  "name": "app",
  "version": "0.1.0",
  "type": "module",
  "scripts": { "dev": "vite", "build": "vite build" },
  "dependencies": { "vue": "^3.5.0" },
  "devDependencies": { "@vitejs/plugin-vue": "^5.0.0", "vite": "^5.4.0" }
}`),
  },
  'vanilla': {
    'index.html': f('index.html', `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>App</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <div id="app">
    <h1 style="color:#0EA5E9">Your app will appear here</h1>
    <p>Edit this file or describe what you want to build.</p>
    <button id="btn">Describe what you want to build</button>
  </div>
  <script src="main.js"></script>
</body>
</html>`),
    'style.css': f('style.css', `*, *::before, *::after { box-sizing: border-box; }
body { margin: 0; font-family: system-ui; }
#app { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; }
h1 { font-size: 32px; font-weight: 700; margin: 0; }
p { color: #666; margin: 0; }
button { padding: 10px 24px; font-size: 16px; border-radius: 8px; border: none; background: #7c6ef7; color: white; cursor: pointer; }`),
    'main.js': f('main.js', `let count = 0;
const btn = document.getElementById('btn');
btn.addEventListener('click', () => {
  count++;
  btn.textContent = 'Count: ' + count;
});`),
  },
  'next': {
    'app/page.tsx': f('app/page.tsx', `'use client';
import { useState } from 'react';
export default function Home() {
  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, fontFamily: 'system-ui' }}>
      <h1 style="color:#0EA5E9">Your app will appear here</h1>
      <button onClick={() => setCount(c => c + 1)} style={{ padding: '10px 24px', fontSize: 16, borderRadius: 8, border: 'none', background: '#7c6ef7', color: 'white', cursor: 'pointer' }}>
        Count: {count}
      </button>
    </main>
  );
}`),
    'app/layout.tsx': f('app/layout.tsx', `export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}`),
    'package.json': f('package.json', `{
  "name": "app",
  "version": "0.1.0",
  "scripts": { "dev": "next dev", "build": "next build" },
  "dependencies": { "next": "^15.0.0", "react": "^18.3.0", "react-dom": "^18.3.0" },
  "devDependencies": { "typescript": "^5.5.0", "@types/react": "^18.3.0", "@types/node": "^22.0.0" }
}`),
  },

  'react-native': {
    'App.tsx': f('App.tsx', `import React from 'react';
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function App() {
  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.center}>
        <Text style={styles.title}>WyberAi Mobile</Text>
        <Text style={styles.subtitle}>Describe your app in the chat to get started</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#09090b' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  title: { fontSize: 22, fontWeight: '700', color: '#f4f4f5', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: '#71717a', textAlign: 'center', lineHeight: 22 },
});
`),
  },
};
