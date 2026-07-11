#!/usr/bin/env node
/**
 * Generate the custom WyberAi ship via Meshy text-to-3D and drop it into
 * public/space/wyber-ship.glb, ready for the /space-journey page.
 *
 * Usage:
 *   MESHY_API_KEY=msy_xxx node scripts/meshy-ship.mjs
 *   node scripts/meshy-ship.mjs msy_xxx
 *   node scripts/meshy-ship.mjs msy_xxx "custom prompt override"
 *
 * Flow: preview task (geometry) → refine task (PBR textures) → download GLB.
 * Costs ~20 Meshy credits (~$0.50–1) per full run. Re-run freely to iterate.
 */

import { writeFile } from "node:fs/promises";
import path from "node:path";

const KEY = process.env.MESHY_API_KEY || process.argv[2];
if (!KEY) {
  console.error("No API key. Pass MESHY_API_KEY env var or first argument.");
  process.exit(1);
}

const PROMPT =
  process.argv[3] ||
  [
    "sleek futuristic spaceship, elongated aerodynamic fuselage,",
    "glossy white ceramic hull with cyan glowing accent lines and dark slate underbelly,",
    "single large engine with cyan ion thruster, swept delta wings, cockpit canopy,",
    "premium product-design aesthetic, SpaceX x Apple styling, high detail",
  ].join(" ");

const NEGATIVE = "cartoon, low poly, blocky, toy, lego, dirty, rusty, damaged, asymmetric";

const BASE = "https://api.meshy.ai/openapi/v2/text-to-3d";
const HEADERS = { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };

async function createTask(body) {
  const res = await fetch(BASE, { method: "POST", headers: HEADERS, body: JSON.stringify(body) });
  const json = await res.json();
  if (!res.ok) throw new Error(`Meshy ${res.status}: ${JSON.stringify(json)}`);
  return json.result;
}

async function waitForTask(id, label) {
  for (;;) {
    const res = await fetch(`${BASE}/${id}`, { headers: HEADERS });
    const task = await res.json();
    if (task.status === "SUCCEEDED") return task;
    if (task.status === "FAILED" || task.status === "CANCELED")
      throw new Error(`${label} task ${task.status}: ${task.task_error?.message || "unknown"}`);
    process.stdout.write(`\r${label}: ${task.status} ${task.progress ?? 0}%   `);
    await new Promise((r) => setTimeout(r, 5000));
  }
}

const previewId = await createTask({
  mode: "preview",
  prompt: PROMPT,
  negative_prompt: NEGATIVE,
  art_style: "realistic",
  should_remesh: true,
  topology: "triangle",
  target_polycount: 30000,
});
console.log(`preview task: ${previewId}`);
await waitForTask(previewId, "preview");
console.log("\npreview geometry done — refining textures…");

const refineId = await createTask({ mode: "refine", preview_task_id: previewId, enable_pbr: true });
const refined = await waitForTask(refineId, "refine");

const glbUrl = refined.model_urls?.glb;
if (!glbUrl) throw new Error(`No GLB url in refine result: ${JSON.stringify(refined.model_urls)}`);
const buf = Buffer.from(await (await fetch(glbUrl)).arrayBuffer());
const out = path.resolve(process.cwd(), "public/space/wyber-ship.glb");
await writeFile(out, buf);
console.log(`\nSaved ${(buf.length / 1024 / 1024).toFixed(1)}MB → ${out}`);
console.log("Next: in src/app/space-journey/page.tsx change craft_speederD.glb → wyber-ship.glb");
