// The fleet dashboard. renderStatus and staleness are pure so node --test can
// exercise them (test/fleet.test.mjs). loadAndRender is the only part that
// touches the network and the DOM.

const BASE = "https://raw.githubusercontent.com/jlt-commons/ci-builds/status";
export const STATUS_URL = `${BASE}/status.json`;
export const HISTORY_URL = `${BASE}/history.json`;
export const CANARY_RUNS_API =
  "https://api.github.com/repos/jlt-commons/ci-builds/actions/workflows/canary.yml/runs?per_page=1";
export const CANARY_RUNS_PAGE = "https://github.com/jlt-commons/ci-builds/actions/workflows/canary.yml";

const STALE_MS = 12 * 3600 * 1000;
// Display order. Selected by name, since the JSON writes keys alphabetically.
const COLUMNS = [
  ["pin", "Own pin"],
  ["latest", "Latest release"],
  ["nightly", "Nightly"],
];

export function escapeHtml(v) {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function staleness(generatedAtISO, nowMs) {
  const t = Date.parse(generatedAtISO);
  if (Number.isNaN(t)) return "stale";
  return nowMs - t > STALE_MS ? "stale" : "fresh";
}

function plural(n, unit) {
  return `${n} ${unit}${n === 1 ? "" : "s"}`;
}

function ago(iso, nowMs) {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "unknown";
  const mins = Math.max(0, Math.floor((nowMs - t) / 60000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${plural(mins, "minute")} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 48) return `${plural(hours, "hour")} ago`;
  return `${plural(Math.floor(hours / 24), "day")} ago`;
}

function safeUrl(u) {
  return typeof u === "string" && /^https:\/\//.test(u) ? u : null;
}

function link(url, text) {
  const u = safeUrl(url);
  return u ? `<a href="${escapeHtml(u)}" rel="noopener">${escapeHtml(text)}</a>` : escapeHtml(text);
}

function parseVersion(v) {
  const m = /^v?(\d+)\.(\d+)\.(\d+)/.exec(String(v ?? ""));
  return m ? [+m[1], +m[2], +m[3]] : null;
}

function isBehind(pin, latest) {
  const a = parseVersion(pin);
  const b = parseVersion(latest);
  if (!a || !b) return false;
  for (let i = 0; i < 3; i++) {
    if (a[i] !== b[i]) return a[i] < b[i];
  }
  return false;
}

function label(c) {
  switch (c && c.result) {
    case "pass": return "pass";
    case "fail": return c.failed_step ? `fail at ${c.failed_step}` : "fail";
    case "infra": return "could not run: infra";
    case "timed-out": return "timed out";
    case "dispatch-failed": return "dispatch failed";
    case "mismatch": return "ran on the wrong jolt";
    default: return "not tested yet";
  }
}

function resultClass(c) {
  const r = c && c.result;
  return ["pass", "fail", "infra", "timed-out", "dispatch-failed", "mismatch"].includes(r) ? r : "not-run";
}

function renderCell(c) {
  const cls = resultClass(c);
  const text = label(c);
  const body = c && c.run_url ? link(c.run_url, text) : escapeHtml(text);
  // The result text is the sole content of its element so it reads on its own.
  let out = `<span class="res res-${cls}">${body}</span>`;
  if (c && c.installed) out += `<span class="ver">jolt ${escapeHtml(c.installed)}</span>`;
  return out;
}

function renderHeader(status, lastCheckedISO, nowMs) {
  const latest = status.jolt && status.jolt.latest && status.jolt.latest.version;
  const nightly = status.jolt && status.jolt.nightly;
  const nightlyText = nightly
    ? `${escapeHtml(String(nightly.sha || "").slice(0, 7))}, published ${escapeHtml(ago(nightly.published_at, nowMs))}`
    : "no nightly";
  const checked = lastCheckedISO
    ? `${escapeHtml(ago(lastCheckedISO, nowMs))} <span class="dim">(${escapeHtml(lastCheckedISO)})</span>`
    : "unknown";
  const run = safeUrl(status.canary_run);
  return `<dl class="fleet-meta">
<div><dt>Jolt latest release</dt><dd>${latest ? escapeHtml(latest) : "unknown"}</dd></div>
<div><dt>Jolt nightly</dt><dd>${nightlyText}</dd></div>
<div><dt>Last checked</dt><dd>${checked}</dd></div>
<div><dt>Data generated</dt><dd>${escapeHtml(status.generated_at)}${run ? ` (<a href="${escapeHtml(run)}" rel="noopener">last run</a>)` : ""}</dd></div>
</dl>`;
}

function renderHistory(name, history) {
  const h = history && history.schema === 1 && history.projects && history.projects[name];
  if (!h) return "";
  const rows = COLUMNS.map(([key, title]) => {
    const cells = Array.isArray(h[key]) ? h[key] : [];
    const items = cells.length
      ? cells.map((c) => `<li class="res res-${resultClass(c)}">${link(c.run_url, label(c))}${c.installed ? ` <span class="ver">${escapeHtml(c.installed)}</span>` : ""}</li>`).join("")
      : `<li class="dim">no runs yet</li>`;
    return `<div><h4>${escapeHtml(title)}</h4><ol class="hist">${items}</ol></div>`;
  }).join("");
  return `<details class="hist-box"><summary>History for ${escapeHtml(name)}</summary><div class="hist-cols">${rows}</div></details>`;
}

function renderRow(p, latestVersion, history) {
  const cells = p.cells || {};
  const behind = isBehind(p.pin, latestVersion)
    ? `<span class="note">pins ${escapeHtml(p.pin)}, latest ${escapeHtml(latestVersion)}</span>`
    : "";
  const tds = COLUMNS.map(([key]) => `<td>${renderCell(cells[key])}</td>`).join("");
  return `<tr data-project="${escapeHtml(p.name)}"><th scope="row">${link(`https://github.com/jlt-commons/${encodeURIComponent(p.name)}`, p.name)}${behind}${renderHistory(p.name, history)}</th>${tds}</tr>`;
}

function renderUncovered(list) {
  if (!Array.isArray(list) || !list.length) return "";
  const items = list
    .map((u) => `<li>${link(`https://github.com/jlt-commons/${encodeURIComponent(u.name)}`, u.name)} <span class="dim">${escapeHtml(u.reason)}</span></li>`)
    .join("");
  return `<section class="fleet-uncovered"><h2>Not in the fleet yet</h2>
<p>These repos are not built against each jolt. The reason is as the check found it, and some of them do have tests under another workflow name.</p>
<ul>${items}</ul></section>`;
}

export function renderStatus(status, history, lastCheckedISO, nowMs) {
  if (!status || typeof status !== "object" || status.schema !== 1 || !Array.isArray(status.projects)) {
    return `<p class="fleet-warn" role="alert">The status file has an unknown data format, so nothing is shown. The raw data is on the <a href="${CANARY_RUNS_PAGE}">canary runs page</a>.</p>`;
  }
  const stale = staleness(status.generated_at, nowMs) === "stale"
    ? `<p class="fleet-warn" role="alert">This data is stale. It was generated at ${escapeHtml(status.generated_at)}, more than 12 hours ago, so the canary may have stopped. Check the <a href="${CANARY_RUNS_PAGE}">canary runs</a>.</p>`
    : "";
  const latest = status.jolt && status.jolt.latest && status.jolt.latest.version;
  const head = COLUMNS.map(([, t]) => `<th scope="col">${escapeHtml(t)}</th>`).join("");
  const rows = status.projects.map((p) => renderRow(p, latest, history)).join("");
  return `${stale}${renderHeader(status, lastCheckedISO, nowMs)}
<div class="grid-wrap" tabindex="0" role="region" aria-label="Build results by project"><table class="fleet-grid">
<thead><tr><th scope="col">Project</th>${head}</tr></thead>
<tbody>${rows}</tbody></table></div>
${renderUncovered(status.uncovered)}`;
}

async function getJson(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  return res.json();
}

async function getLastChecked() {
  try {
    const body = await getJson(CANARY_RUNS_API);
    const t = body.workflow_runs && body.workflow_runs[0] && body.workflow_runs[0].created_at;
    return typeof t === "string" ? t : null;
  } catch {
    return null;
  }
}

export async function loadAndRender(rootEl) {
  try {
    const [status, history, checked] = await Promise.all([
      getJson(STATUS_URL),
      getJson(HISTORY_URL).catch(() => null),
      getLastChecked(),
    ]);
    const note = history ? "" : `<p class="fleet-warn" role="alert">The history file could not be loaded, so the per-project history is hidden.</p>`;
    rootEl.innerHTML = note + renderStatus(status, history, checked, Date.now());
  } catch (e) {
    rootEl.innerHTML = `<p class="fleet-warn" role="alert">The fleet data could not be loaded (${escapeHtml(e && e.message)}). Try again later, or look at the <a href="${CANARY_RUNS_PAGE}">canary runs</a> directly.</p>`;
  }
}
