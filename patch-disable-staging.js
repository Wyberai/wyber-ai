const fs = require("fs");
const f = "src/components/editor/ChatPanel.tsx";
let t = fs.readFileSync(f, "utf8");

// 1. Make runStagedBuild a clean no-op: return false immediately at the top of its try.
//    This restores exact old one-shot behaviour with NO plan call and NO dangling spinner.
const anchor = "const runStagedBuild = useCallback(async (userMsg: string, assistantId: string): Promise<boolean> => {\n    try {";
const replacement = "const runStagedBuild = useCallback(async (userMsg: string, assistantId: string): Promise<boolean> => {\n    return false; // STAGING DISABLED — rebuild cleanly next session\n    try {";
if (t.includes(anchor)) {
  t = t.replace(anchor, replacement);
  console.log("DISABLED staging (early return added)");
} else {
  console.log("ANCHOR NOT FOUND — staging function signature differs");
}

fs.writeFileSync(f, t);
console.log("CHECK:", t.includes("STAGING DISABLED"));
