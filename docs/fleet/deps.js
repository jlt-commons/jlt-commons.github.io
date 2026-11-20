// The dependency page. layout, releaseSteps and renderDeps are pure so
// node --test can exercise them (test/deps.test.mjs). loadAndRender is the only
// part that touches the network and the DOM.
//
// deps.json comes from jlt-commons/ci-builds (fleet:deps). Each edge points
// from a dependency to a library that pins it, with the pin's state: current
// (the latest tag, or the head of an untagged library), behind, or unknown.
// Each library carries the waves its dependents are retagged in after it gets
// a new tag.

// The site's own copy first (the stable URL tools read, refreshed hourly by
// the site build), then the status branch it is copied from.
export const DEPS_URL = "/fleet/deps.json";
export const DEPS_FALLBACK_URL = "https://raw.githubusercontent.com/jlt-commons/ci-builds/status/deps.json";
export const DEPS_RUNS_PAGE = "https://github.com/jlt-commons/ci-builds/actions/workflows/deps.yml";

const STALE_MS = 26 * 3600 * 1000;
const COL_W = 230;
const NODE_W = 190;
const NODE_H = 38;
const ROW_H = 50;
const PAD = 12;

export function escapeHtml(v) {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function safeUrl(u) {
  if (typeof u !== "string") return null;
  try {
    const x = new URL(u);
    return x.protocol === "https:" && x.hostname === "github.com" && !x.username && !x.password ? x.href : null;
  } catch {
    return null;
  }
}

function ext(url, text) {
  const u = safeUrl(url);
  return u ? `<a href="${escapeHtml(u)}" rel="noopener">${escapeHtml(text)}</a>` : escapeHtml(text);
}

function self(id, text = id) {
  return `<a href="#${escapeHtml(encodeURIComponent(id))}" data-id="${escapeHtml(id)}">${escapeHtml(text)}</a>`;
}

function group(edges, key) {
  const m = new Map();
  for (const e of edges) {
    if (!m.has(e[key])) m.set(e[key], []);
    m.get(e[key]).push(e);
  }
  return m;
}

function byId(graph) {
  return new Map(graph.libraries.map((l) => [l.id, l]));
}

// Columns for one library: what it depends on to the left, at one layer left
// of the furthest thing each feeds; the library at 0; then its update waves;
// then anything caught in a cycle with it.
export function layout(graph, id) {
  const libs = byId(graph);
  const sel = libs.get(id);
  const incoming = group(graph.edges, "to");
  const outgoing = group(graph.edges, "from");
  const layer = new Map([[id, 0]]);

  const up = new Set(sel.upstream || []);
  const depth = new Map([[id, 0]]);
  const visiting = new Set();
  const upDepth = (u) => {
    if (depth.has(u)) return depth.get(u);
    if (visiting.has(u)) return 0;
    visiting.add(u);
    let d = 0;
    for (const e of outgoing.get(u) || []) {
      if (e.to === id || up.has(e.to)) d = Math.max(d, upDepth(e.to) + 1);
    }
    visiting.delete(u);
    depth.set(u, d);
    return d;
  };
  for (const u of up) layer.set(u, -upDepth(u));

  (sel.waves || []).forEach((wave, i) => wave.forEach((d) => layer.set(d, i + 1)));
  const cycleLayer = (sel.waves || []).length + 1;
  for (const c of sel.cycle || []) if (c !== id) layer.set(c, cycleLayer);

  const shown = new Set(layer.keys());
  const edges = graph.edges.filter((e) => shown.has(e.from) && shown.has(e.to));

  // Order each column by where its neighbours in the previous columns sit, so
  // edges cross less. One sweep left to right is enough at this size.
  const layers = [...new Set(layer.values())].sort((a, b) => a - b);
  const row = new Map();
  for (const L of layers) {
    const ids = [...shown].filter((n) => layer.get(n) === L);
    const score = (n) => {
      const ns = [...(incoming.get(n) || []).map((e) => e.from), ...(outgoing.get(n) || []).map((e) => e.to)]
        .filter((m) => row.has(m));
      return ns.length ? ns.reduce((s, m) => s + row.get(m), 0) / ns.length : Infinity;
    };
    ids
      .map((n) => [n, score(n)])
      .sort((a, b) => (a[1] - b[1]) || a[0].localeCompare(b[0]))
      .forEach(([n], i) => row.set(n, i));
  }
  const nodes = [...shown].map((n) => ({ id: n, layer: layer.get(n), row: row.get(n), lib: libs.get(n) }));
  return { nodes, edges, layers };
}

// For each wave after id gets a new tag: the libraries to retag and the pins
// in each that move, i.e. its edges from id or from an earlier wave.
export function releaseSteps(graph, id) {
  const sel = byId(graph).get(id);
  const incoming = group(graph.edges, "to");
  const moved = new Set([id]);
  return (sel.waves || []).map((wave, i) => {
    const libs = wave.map((d) => ({
      id: d,
      pins: (incoming.get(d) || []).filter((e) => moved.has(e.from)).sort((a, b) => a.from.localeCompare(b.from)),
    }));
    wave.forEach((d) => moved.add(d));
    return { wave: i + 1, libs };
  });
}

function pinText(e) {
  const p = (e.pins && e.pins[0]) || {};
  const at = p.tag || (p.sha ? String(p.sha).slice(0, 7) : null) || (p.ref ? `ref ${p.ref}` : "?");
  const resolved = !p.tag && p.resolved ? ` (${p.resolved})` : "";
  const more = e.pins && e.pins.length > 1 ? ` +${e.pins.length - 1} more` : "";
  return `${at}${resolved}${more}`;
}

function stateBadge(state) {
  const s = ["current", "behind"].includes(state) ? state : "unknown";
  return `<span class="pin pin-${s}">${s}</span>`;
}

function latestText(l) {
  if (!l || !l.latest) return "unknown";
  if (l.latest.tag) return l.latest.tag;
  return l.latest.sha ? `untagged, head ${String(l.latest.sha).slice(0, 7)}` : "untagged";
}

// The node subtitle: the tag, or the head commit of an untagged library. The
// organization is in the node's tooltip, since it would not fit.
function shortLatest(l) {
  if (!l || !l.latest) return "";
  return l.latest.tag || (l.latest.sha ? `head ${String(l.latest.sha).slice(0, 7)}` : "untagged");
}

function renderSvg(lay, selId) {
  if (lay.nodes.length < 2) return "";
  const rows = Math.max(...lay.nodes.map((n) => n.row)) + 1;
  const w = (lay.layers.length - 1) * COL_W + NODE_W + 2 * PAD;
  const h = rows * ROW_H + 2 * PAD;
  const colIndex = new Map(lay.layers.map((L, i) => [L, i]));
  const pos = new Map(
    lay.nodes.map((n) => [n.id, { x: PAD + colIndex.get(n.layer) * COL_W, y: PAD + n.row * ROW_H }]),
  );
  const edges = lay.edges
    .map((e) => {
      const a = pos.get(e.from);
      const b = pos.get(e.to);
      const x1 = a.x + NODE_W, y1 = a.y + NODE_H / 2, x2 = b.x, y2 = b.y + NODE_H / 2;
      const dx = Math.max(40, Math.abs(x2 - x1) / 2);
      const s = ["current", "behind"].includes(e.state) ? e.state : "unknown";
      return `<path class="edge edge-${s}" d="M${x1},${y1} C${x1 + dx},${y1} ${x2 - dx},${y2} ${x2},${y2}" marker-end="url(#arrow-${s})"><title>${escapeHtml(`${e.to} pins ${e.from} at ${pinText(e)}: ${s}`)}</title></path>`;
    })
    .join("");
  const nodes = lay.nodes
    .map((n) => {
      const p = pos.get(n.id);
      const cls = n.id === selId ? "node node-sel" : "node";
      const name = n.lib ? n.lib.name : n.id;
      return `<a href="#${escapeHtml(encodeURIComponent(n.id))}" class="${cls}"><title>${escapeHtml(n.id)}</title>` +
        `<rect x="${p.x}" y="${p.y}" width="${NODE_W}" height="${NODE_H}" rx="6"/>` +
        `<text x="${p.x + 10}" y="${p.y + 16}" class="node-name">${escapeHtml(name.length > 24 ? name.slice(0, 23) + "…" : name)}</text>` +
        `<text x="${p.x + 10}" y="${p.y + 31}" class="node-tag">${escapeHtml(n.lib ? shortLatest(n.lib) : "")}</text></a>`;
    })
    .join("");
  const marker = (s) =>
    `<marker id="arrow-${s}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="arrow-${s}"/></marker>`;
  return `<div class="graph-wrap" tabindex="0" role="region" aria-label="Dependency graph">
<svg class="deps-graph" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="Libraries upstream on the left, dependents in update order on the right">
<defs>${marker("current")}${marker("behind")}${marker("unknown")}</defs>${edges}${nodes}</svg></div>
<p class="legend"><span class="pin pin-current">current</span> pins the latest tag (or head, if untagged) <span class="pin pin-behind">behind</span> pins something older <span class="pin pin-unknown">unknown</span> could not tell</p>`;
}

function renderList(graph, selId) {
  const out = group(graph.edges, "from");
  const inc = group(graph.edges, "to");
  const items = [...graph.libraries]
    .sort((a, b) => a.name.localeCompare(b.name) || a.org.localeCompare(b.org))
    .map((l) => {
      const down = (out.get(l.id) || []).length;
      const up = (inc.get(l.id) || []).length;
      const stale = (inc.get(l.id) || []).filter((e) => e.state === "behind").length;
      const counts = `<span class="counts" title="${up} direct dependencies, ${down} direct dependents">${up ? `↑${up}` : ""} ${down ? `↓${down}` : ""}</span>`;
      const flag = stale ? `<span class="pin pin-behind" title="${stale} of its pins are behind">${stale}</span>` : "";
      const cls = l.id === selId ? ' class="sel"' : "";
      return `<li${cls} data-filter="${escapeHtml(l.id.toLowerCase())}"><span class="lname">${self(l.id, l.name)} <span class="dim org">${escapeHtml(l.org)}</span></span>${flag}${counts}</li>`;
    })
    .join("");
  return `<nav class="deps-list" aria-label="Libraries">
<input type="search" id="deps-filter" placeholder="Filter libraries" aria-label="Filter libraries" autocomplete="off">
<ul>${items}</ul></nav>`;
}

function renderDetail(graph, id) {
  const libs = byId(graph);
  const l = libs.get(id);
  if (!l) return `<p class="fleet-warn" role="alert">No library named ${escapeHtml(id)} is in the data.</p>`;
  const incoming = graph.edges.filter((e) => e.to === id).sort((a, b) => a.from.localeCompare(b.from));
  const flags = [
    !l.has_deps ? "no deps.edn at the repository root" : null,
    l.unreadable ? "its deps.edn could not be read, so what it pins is unknown" : null,
  ].filter(Boolean);
  const head = `<header class="deps-head"><h2 id="deps-selected">${escapeHtml(l.id)}</h2>
<p>${ext(l.url, "repository")} · latest <code>${escapeHtml(latestText(l))}</code>${flags.map((f) => ` · <span class="note">${escapeHtml(f)}</span>`).join("")}</p></header>`;

  const steps = releaseSteps(graph, id);
  const plan = steps.length
    ? `<ol class="waves">${steps
        .map(
          (s) => `<li><h4>Wave ${s.wave}</h4><ul>${s.libs
            .map(
              (d) => `<li>${self(d.id)}<ul class="pins">${d.pins
                .map((e) => `<li>pins ${self(e.from, libs.get(e.from) ? libs.get(e.from).name : e.from)} at <code>${escapeHtml(pinText(e))}</code> ${stateBadge(e.state)}</li>`)
                .join("")}</ul></li>`,
            )
            .join("")}</ul></li>`,
        )
        .join("")}</ol>`
    : `<p class="dim">Nothing depends on ${escapeHtml(l.name)}, so a new tag needs no follow-up releases.</p>`;
  const total = steps.reduce((n, s) => n + s.libs.length, 0);
  const cycle = (l.cycle || []).length
    ? `<p class="fleet-warn" role="alert">${(l.cycle || []).map((c) => escapeHtml(c)).join(", ")} depend on each other in a cycle, so they cannot be put in release order and are left out of the waves.</p>`
    : "";

  const deps = incoming.length
    ? `<ul class="direct">${incoming
        .map((e) => `<li>${self(e.from)} at <code>${escapeHtml(pinText(e))}</code>, latest <code>${escapeHtml(latestText(libs.get(e.from)))}</code> ${stateBadge(e.state)}</li>`)
        .join("")}</ul>`
    : `<p class="dim">No dependencies inside jlt-commons or jolt-lang.</p>`;

  return `${head}${renderSvg(layout(graph, id), id)}${cycle}
<section><h3>After a new ${escapeHtml(l.name)} tag</h3>
<p class="dim">${total ? `${total} ${total === 1 ? "library needs" : "libraries need"} a pin moved and a new tag, in this order. A wave can be released together once the waves before it are tagged.` : ""}</p>${plan}</section>
<section><h3>${escapeHtml(l.name)} depends on</h3>${deps}</section>`;
}

export function renderDeps(graph, selId, nowMs) {
  if (!graph || typeof graph !== "object" || graph.schema !== 1 || !Array.isArray(graph.libraries) || !Array.isArray(graph.edges)) {
    return `<p class="fleet-warn" role="alert">The dependency file has an unknown data format, so nothing is shown. See the <a href="${DEPS_RUNS_PAGE}">deps runs</a>.</p>`;
  }
  const t = Date.parse(graph.generated_at);
  const stale = Number.isNaN(t) || nowMs - t > STALE_MS
    ? `<p class="fleet-warn" role="alert">This data is stale. It was generated at ${escapeHtml(graph.generated_at)}, more than a day ago. Check the <a href="${DEPS_RUNS_PAGE}">deps runs</a>.</p>`
    : "";
  const behind = graph.edges.filter((e) => e.state === "behind").length;
  const meta = `<p class="dim">${graph.libraries.length} repositories, ${graph.edges.length} pins between them, ${behind} behind. Generated ${escapeHtml(graph.generated_at)}.</p>`;
  const detail = selId ? renderDetail(graph, selId) : `<p class="dim">Pick a library to see what it depends on, what depends on it, and the order to retag its dependents after a new release.</p>`;
  return `${stale}${meta}<div class="deps-layout">${renderList(graph, selId)}<div class="deps-detail" id="deps-detail">${detail}</div></div>`;
}

function selected() {
  const h = decodeURIComponent(location.hash.slice(1));
  return h || null;
}

export async function loadAndRender(rootEl) {
  const get = async (url) => {
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
    return res.json();
  };
  let graph;
  try {
    graph = await get(DEPS_URL).catch(() => get(DEPS_FALLBACK_URL));
  } catch (e) {
    rootEl.innerHTML = `<p class="fleet-warn" role="alert">The dependency data could not be loaded (${escapeHtml(e && e.message)}). Try again later, or look at the <a href="${DEPS_RUNS_PAGE}">deps runs</a>.</p>`;
    return;
  }
  const draw = () => {
    const filter = document.getElementById("deps-filter");
    const keep = filter ? filter.value : "";
    rootEl.innerHTML = renderDeps(graph, selected(), Date.now());
    const input = document.getElementById("deps-filter");
    const apply = () => {
      const q = input.value.trim().toLowerCase();
      for (const li of rootEl.querySelectorAll(".deps-list li")) li.hidden = q !== "" && !li.dataset.filter.includes(q);
    };
    input.value = keep;
    input.addEventListener("input", apply);
    apply();
    // Scroll the list itself, not the page, to the selected library.
    const list = rootEl.querySelector(".deps-list ul");
    const sel = rootEl.querySelector(".deps-list li.sel");
    if (list && sel) list.scrollTop = sel.offsetTop - list.offsetTop - list.clientHeight / 2;
  };
  window.addEventListener("hashchange", () => {
    draw();
    const h = document.getElementById("deps-selected");
    if (h && window.matchMedia("(max-width: 50rem)").matches) h.scrollIntoView();
  });
  draw();
}
