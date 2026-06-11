const fs = require("fs");
const f = "src/components/dashboard/DashboardClient.tsx";
let t = fs.readFileSync(f, "utf8");
let ok = [];

// A. Point the 3 startProject triggers at openChooser instead
// Trigger 1 (line ~107): startProject(promptInput.trim() || undefined);
t = t.replace("startProject(promptInput.trim() || undefined);", "openChooser(promptInput.trim() || undefined);");
// Trigger 2 (line ~214): onClick={() => startProject(promptInput.trim() || undefined)}
t = t.replace("onClick={() => startProject(promptInput.trim() || undefined)}", "onClick={() => openChooser(promptInput.trim() || undefined)}");
// Trigger 3 (line ~242): onClick={() => startProject()}
t = t.replace("onClick={() => startProject()}", "onClick={() => openChooser()}");
ok.push("3 triggers -> openChooser");

// B. Render the chooser. Insert right after the opening of the returned JSX.
// Find the first "return (" inside the component and inject after the first wrapper div.
// Safer: inject before the final closing of the component's return using a known anchor.
if (!t.includes("<ProjectTypeChooser")) {
  // anchor: the ReferralCard is rendered somewhere; inject chooser right before component closes.
  // Use the last "</div>\n  );" as anchor is risky; instead append before final ");}"
  const marker = "\n  );\n}";
  const idx = t.lastIndexOf(marker);
  if (idx !== -1) {
    const chooser = "\n      <ProjectTypeChooser open={showTypePicker} onClose={() => setShowTypePicker(false)} onPick={(type) => { setShowTypePicker(false); startProject(pendingPrompt, type); }} />";
    t = t.slice(0, idx) + chooser + t.slice(idx);
    ok.push("chooser rendered");
  } else { ok.push("RENDER ANCHOR NOT FOUND"); }
}

fs.writeFileSync(f, t);
console.log("APPLIED:", ok.join(" | "));
console.log("openChooser count:", (t.match(/openChooser\(/g)||[]).length);
console.log("ProjectTypeChooser tag present:", t.includes("<ProjectTypeChooser"));
