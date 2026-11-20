// Puts the dependency graph on the site at /fleet/deps.json, so tools that
// roll library releases through the graph read it from one stable URL.
//
//   node scripts/fetch-deps.mjs <site-dir>
//
// The graph comes from ci-builds' status branch, where its deps workflow
// commits it hourly. When that copy cannot be fetched or does not look like a
// graph, the copy already deployed is kept, so one bad fetch never takes the
// file off the site. Writes changed=true|false to $GITHUB_OUTPUT: a scheduled
// build deploys only when the graph changed.

import { appendFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

export const FRESH_URL = "https://raw.githubusercontent.com/jlt-commons/ci-builds/status/deps.json";
export const DEPLOYED_URL = "https://jlt-commons.github.io/fleet/deps.json";

// null when text is a usable graph, otherwise what is wrong with it.
export function checkDeps(text) {
  let g;
  try {
    g = JSON.parse(text);
  } catch {
    return "not JSON";
  }
  if (!g || typeof g !== "object") return "not an object";
  if (g.schema !== 1) return `unknown schema ${JSON.stringify(g.schema)}`;
  if (!Array.isArray(g.libraries)) return "no libraries array";
  if (!Array.isArray(g.edges)) return "no edges array";
  if (g.libraries.length === 0) return "no libraries, which points to a failed collection";
  return null;
}

export function pickDeps({ fresh, deployed }) {
  const deployedOk = deployed != null && checkDeps(deployed) === null;
  if (fresh != null && checkDeps(fresh) === null) {
    return { text: fresh, source: "fresh", changed: !deployedOk || fresh !== deployed };
  }
  if (deployedOk) return { text: deployed, source: "deployed", changed: false };
  return { text: null, source: null, changed: false };
}

async function get(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
    if (!res.ok) {
      console.warn(`::warning::${url}: HTTP ${res.status}`);
      return null;
    }
    return await res.text();
  } catch (e) {
    console.warn(`::warning::${url}: ${e.message}`);
    return null;
  }
}

async function main(siteDir) {
  const [fresh, deployed] = await Promise.all([get(FRESH_URL), get(DEPLOYED_URL)]);
  if (fresh != null && checkDeps(fresh)) console.warn(`::warning::${FRESH_URL}: ${checkDeps(fresh)}`);
  const pick = pickDeps({ fresh, deployed });
  if (pick.text) {
    mkdirSync(join(siteDir, "fleet"), { recursive: true });
    writeFileSync(join(siteDir, "fleet", "deps.json"), pick.text);
    console.log(`fleet/deps.json from the ${pick.source} copy, ${pick.changed ? "changed" : "unchanged"}`);
  } else {
    console.warn("::warning::no usable deps.json anywhere, the site goes out without one");
  }
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `changed=${pick.changed}\n`);
}

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  if (process.argv.length !== 3) {
    console.error("usage: node scripts/fetch-deps.mjs <site-dir>");
    process.exit(2);
  }
  await main(process.argv[2]);
}
