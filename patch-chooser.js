const fs = require("fs");
const f = "src/components/dashboard/DashboardClient.tsx";
let t = fs.readFileSync(f, "utf8");
let ok = [];

// 1. Add import after the TemplatesShowcase import
const imp = "import { TemplatesShowcase } from '@/components/dashboard/TemplatesShowcase';";
if (t.includes(imp) && !t.includes("ProjectTypeChooser")) {
  t = t.replace(imp, imp + "\nimport { ProjectTypeChooser, type ProjectType } from '@/components/dashboard/ProjectTypeChooser';");
  ok.push("import added");
}

// 2. Add a pendingPrompt state next to showTypePicker
const sp = "const [showTypePicker, setShowTypePicker] = useState(false);";
if (t.includes(sp) && !t.includes("pendingPrompt")) {
  t = t.replace(sp, sp + "\n  const [pendingPrompt, setPendingPrompt] = useState<string | undefined>(undefined);");
  ok.push("pendingPrompt state added");
}

// 3. startProject signature: accept type param (default 'app')
const sig = "const startProject = async (prompt?: string) => {";
if (t.includes(sig)) {
  t = t.replace(sig, "const startProject = async (prompt?: string, type: ProjectType = 'app') => {");
  ok.push("startProject signature");
}

// 4. insert uses the chosen type
const ins = "project_type: 'app' })";
if (t.includes(ins)) { t = t.replace(ins, "project_type: type })"); ok.push("insert type"); }

// 5. route uses the chosen type
const route = "router.push(`/project/${data[0].id}?type=app`)";
if (t.includes(route)) { t = t.replace(route, "router.push(`/project/${data[0].id}?type=${type}`)"); ok.push("route type"); }

// 6. helper to open chooser
if (!t.includes("openChooser")) {
  t = t.replace(sig.replace("=>", "=>"), sig); // no-op anchor safety
  const anchor = "const startProject = async (prompt?: string, type: ProjectType = 'app') => {";
  t = t.replace(anchor, "const openChooser = (prompt?: string) => { setPendingPrompt(prompt); setShowTypePicker(true); };\n  " + anchor);
  ok.push("openChooser helper");
}

fs.writeFileSync(f, t);
console.log("APPLIED:", ok.join(" | "));
console.log("count startProject(:", (t.match(/startProject\(/g)||[]).length);
