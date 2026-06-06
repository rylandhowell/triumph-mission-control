import fs from "node:fs";
import path from "node:path";
import { put } from "@vercel/blob";

const snapshotPath = path.resolve("safari-localstorage-export.json");
if (!fs.existsSync(snapshotPath)) {
  console.error(`Snapshot not found: ${snapshotPath}`);
  process.exit(1);
}

const raw = JSON.parse(fs.readFileSync(snapshotPath, "utf8"));
const data = raw?.data ?? {};
const state = {};
for (const job of ["job-201", "job-202", "job-203", "job-204", "job-205"]) {
  const v = data[`checklist-${job}`];
  if (!v) continue;
  try {
    state[job] = JSON.parse(v);
  } catch {}
}

const token = process.env.BLOB_READ_WRITE_TOKEN;
if (!token) {
  console.error("Missing BLOB_READ_WRITE_TOKEN env var");
  process.exit(1);
}

const res = await put("state/checklist-state.json", JSON.stringify(state), {
  access: "private",
  addRandomSuffix: false,
  allowOverwrite: true,
  contentType: "application/json",
  token,
});

console.log("Restored checklist-state.json", res.url);
console.log("Jobs restored:", Object.keys(state));
