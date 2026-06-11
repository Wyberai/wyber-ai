const fs = require("fs");
const f = "src/components/dashboard/DashboardClient.tsx";
let t = fs.readFileSync(f, "utf8");

const broken = `    </div>
      <ProjectTypeChooser open={showTypePicker} onClose={() => setShowTypePicker(false)} onPick={(type) => { setShowTypePicker(false); startProject(pendingPrompt, type); }} />
  );
}`;

const fixed = `      <ProjectTypeChooser open={showTypePicker} onClose={() => setShowTypePicker(false)} onPick={(type) => { setShowTypePicker(false); startProject(pendingPrompt, type); }} />
    </div>
  );
}`;

if (t.includes(broken)) {
  t = t.replace(broken, fixed);
  fs.writeFileSync(f, t);
  console.log("FIXED: chooser moved inside root div");
} else {
  console.log("EXACT BLOCK NOT FOUND - paste last 6 lines");
}
