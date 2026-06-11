const fs = require("fs");
const f = "src/lib/starter-templates.ts";
let t = fs.readFileSync(f, "utf8");
let changes = 0;

// 1. React App.tsx: heading text + color (grey #666 -> readable, brand sky blue heading)
const h1Old = `      <h1 style={{ fontSize: 32, fontWeight: 700 }}>Hello from Wyber AI</h1>`;
const h1New = `      <h1 style={{ fontSize: 28, fontWeight: 700, color: '#0EA5E9' }}>Your app will appear here</h1>`;
if (t.includes(h1Old)) { t = t.split(h1Old).join(h1New); changes++; }

// 2. Subtitle: lighten grey #666 so it's readable on dark, reword
const pOld = `      <p style={{ color: '#666' }}>Edit this file or describe what you want to build.</p>`;
const pNew = `      <p style={{ color: '#a1a1aa', fontSize: 15 }}>Describe what you want to build in the chat &rarr;</p>`;
if (t.includes(pOld)) { t = t.split(pOld).join(pNew); changes++; }

// 3. Remove the entire Count button block (the confusing "Count: 0")
const btnOld = `      <button
        onClick={() => setCount(c => c + 1)}
        style={{ padding: '10px 24px', fontSize: 16, borderRadius: 8, border: 'none', background: '#7c6ef7', color: 'white', cursor: 'pointer' }}
      >
        Count: {count}
      </button>`;
if (t.includes(btnOld)) { t = t.split(btnOld).join(''); changes++; }

// 4. Remove now-unused useState/count line to avoid lint/unused (safe: replace the hook line)
const stateOld = `  const [count, setCount] = useState(0);\n`;
if (t.includes(stateOld)) { t = t.split(stateOld).join(''); changes++; }
const importOld = `import { useState } from 'react';\n`;
// only remove the import if no other useState remains in the React starter
// (keep it simple: leave import, harmless. skip)

// 5. Other framework variants: generic "Hello from Wyber AI" + Count text
t = t.split(`<h1>Hello from Wyber AI</h1>`).join(`<h1 style="color:#0EA5E9">Your app will appear here</h1>`);
t = t.split(`Count: {{ count }}`).join(`Describe what you want to build`);
t = t.split(`Count: 0`).join(`Describe what you want to build`);

fs.writeFileSync(f, t);
console.log("Stub edits applied. changes:", changes);
console.log("'Count:' remaining?", t.includes("Count:"));
console.log("'Hello from Wyber AI' remaining?", t.includes("Hello from Wyber AI"));
