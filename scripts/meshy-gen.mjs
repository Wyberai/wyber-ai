#!/usr/bin/env node
/**
 * Generate a textured 3D asset via Meshy text-to-3D → public/space/<name>.glb
 *
 * Usage: MESHY_API_KEY=msy_xxx node scripts/meshy-gen.mjs <name> "<prompt>" ["<negative>"]
 * Flow: preview (geometry) → refine (PBR textures) → download GLB.
 * ~15-20 credits per run.
 */

import { writeFile } from "node:fs/promises";
import path from "node:path";

const KEY = process.env.MESHY_API_KEY;
const [name, prompt, negativeArg] = process.argv.slice(2);
if (!KEY || !name || !prompt) {
  console.error('Usage: MESHY_API_KEY=... node scripts/meshy-gen.mjs <name> "<prompt>" ["<negative>"]');
  process.exit(1);
}
const NEGATIVE = negativeArg || "cartoon, low poly, blocky, toy, lego, dirty, rusty, damaged";

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
    let task;
    try {
      const res = await fetch(`${BASE}/${id}`, { headers: HEADERS });
      task = await res.json();
    } catch (err) {
      // transient network blip — the task keeps running server-side, just re-poll
      console.log(`[${name}] ${label}: poll failed (${err.cause?.code || err.message}), retrying…`);
      await new Promise((r) => setTimeout(r, 10000));
      continue;
    }
    if (task.status === "SUCCEEDED") return task;
    if (task.status === "FAILED" || task.status === "CANCELED")
      throw new Error(`${label} ${task.status}: ${task.task_error?.message || "unknown"}`);
    console.log(`[${name}] ${label}: ${task.status} ${task.progress ?? 0}%`);
    await new Promise((r) => setTimeout(r, 8000));
  }
}

console.log(`[${name}] prompt: ${prompt}`);
const previewId = await createTask({
  mode: "preview",
  prompt,
  negative_prompt: NEGATIVE,
  art_style: "realistic",
  should_remesh: true,
  topology: "triangle",
  target_polycount: 30000,
});
console.log(`[${name}] preview task ${previewId}`);
await waitForTask(previewId, "preview");

console.log(`[${name}] refining textures…`);
const refineId = await createTask({ mode: "refine", preview_task_id: previewId, enable_pbr: true });
const refined = await waitForTask(refineId, "refine");

const glbUrl = refined.model_urls?.glb;
if (!glbUrl) throw new Error(`No GLB url: ${JSON.stringify(refined.model_urls)}`);
const buf = Buffer.from(await (await fetch(glbUrl)).arrayBuffer());
const out = path.resolve(process.cwd(), `public/space/${name}.glb`);
await writeFile(out, buf);
console.log(`[${name}] DONE ${(buf.length / 1024 / 1024).toFixed(1)}MB → ${out}`);
