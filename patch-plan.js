const fs = require("fs");
const f = "src/app/api/generate/route.ts";
let t = fs.readFileSync(f, "utf8");
const s = t.indexOf("if (stage === 'plan') {");
if (s === -1) { console.log("ANCHOR NOT FOUND"); process.exit(1); }
const fp = t.indexOf("fullSystemPrompt =", s);
const le = t.indexOf("\n", fp);
const newPrompt = "You are a software architect. Given an app request, output ONLY a JSON array of the files needed to build it. Each item must be {\"path\":\"src/...\",\"purpose\":\"short feature description\"}. List shell files (src/index.css, src/App.tsx, src/components/Sidebar.tsx) FIRST, then one file per feature. Aim for 5-9 files. Output ONLY the raw JSON array starting with [ and ending with ]. No prose, no markdown, no code fences.";
const nl = "fullSystemPrompt = " + JSON.stringify(newPrompt);
t = t.slice(0, fp) + nl + t.slice(le);
fs.writeFileSync(f, t);
console.log("REPLACED:", t.includes("software architect"));
