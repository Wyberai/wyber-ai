const fs = require("fs");
const f = "src/components/editor/ChatPanel.tsx";
let t = fs.readFileSync(f, "utf8");
// Insert a visible debug right after the plan fetch resolves
const marker = "if (!planRes.ok) return false";
const dbg = "console.log('[WYBER] plan status', planRes.status); if (!planRes.ok) { setStreamingContent('STAGED FAILED: plan call returned ' + planRes.status); return false }";
if (t.includes(marker)) { t = t.replace(marker, dbg); console.log("patched plan-status check"); }
else { console.log("MARKER NOT FOUND"); }
// Also surface the parsed manifest count
const m2 = "const plan = buildStagedPlan(manifest)";
if (t.includes(m2)) { t = t.replace(m2, m2 + "; setStreamingContent('STAGED: parsed ' + manifest.length + ' files, shouldStage=' + plan.shouldStage); await new Promise(r=>setTimeout(r,1500));"); console.log("patched manifest debug"); }
else { console.log("MARKER2 NOT FOUND"); }
fs.writeFileSync(f, t);
