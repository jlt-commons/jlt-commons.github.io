import { test } from "node:test";
import assert from "node:assert/strict";
import { layout, releaseSteps, renderDeps } from "../docs/fleet/deps.js";

const NOW = Date.parse("2026-11-20T12:00:00Z");
const sha = (c) => c.repeat(40);

const lib = (id, extra = {}) => ({
  id,
  org: id.split("/")[0],
  name: id.split("/")[1],
  url: `https://github.com/${id}`,
  latest: { tag: "v1.0.0", sha: sha("1") },
  has_deps: true,
  unreadable: false,
  upstream: [],
  waves: [],
  cycle: [],
  ...extra,
});

const edge = (from, to, state = "current", pin = { tag: "v1.0.0", sha: null }) => ({
  from,
  to,
  dep: `io.github.${from}`,
  state,
  pins: [{ ref: null, resolved: pin.tag, ...pin, state }],
});

// time <- a <- c, time <- c, and b -> a (b is upstream of a only).
const graph = () => ({
  schema: 1,
  generated_at: "2026-11-20T11:00:00Z",
  orgs: ["jlt-commons", "jolt-lang"],
  libraries: [
    lib("jlt-commons/a", { upstream: ["jlt-commons/b", "jolt-lang/time"], waves: [["jlt-commons/c"]] }),
    lib("jlt-commons/b", { waves: [["jlt-commons/a"], ["jlt-commons/c"]] }),
    lib("jlt-commons/c", { upstream: ["jlt-commons/a", "jlt-commons/b", "jolt-lang/time"] }),
    lib("jolt-lang/time", { latest: { tag: "v0.0.18", sha: sha("2") }, waves: [["jlt-commons/a"], ["jlt-commons/c"]] }),
    lib("jlt-commons/lonely", { has_deps: false }),
  ],
  edges: [
    edge("jlt-commons/a", "jlt-commons/c", "behind", { tag: "v0.9.0", sha: null }),
    edge("jlt-commons/b", "jlt-commons/a"),
    edge("jolt-lang/time", "jlt-commons/a", "behind", { tag: null, sha: sha("9") }),
    edge("jolt-lang/time", "jlt-commons/c"),
  ],
});

test("layout puts upstream left of the library and each wave to its right", () => {
  const l = layout(graph(), "jlt-commons/a");
  const layerOf = Object.fromEntries(l.nodes.map((n) => [n.id, n.layer]));
  assert.deepEqual(layerOf, {
    "jlt-commons/b": -1,
    "jolt-lang/time": -1,
    "jlt-commons/a": 0,
    "jlt-commons/c": 1,
  });
  assert.equal(l.edges.length, 4, "every edge between shown libraries is drawn");
});

test("an upstream library is placed one layer left of the furthest thing it feeds", () => {
  const l = layout(graph(), "jlt-commons/c");
  const layerOf = Object.fromEntries(l.nodes.map((n) => [n.id, n.layer]));
  assert.equal(layerOf["jlt-commons/a"], -1);
  assert.equal(layerOf["jlt-commons/b"], -2);
  assert.equal(layerOf["jolt-lang/time"], -2);
});

test("release steps list, per wave, the pins each dependent has to move", () => {
  const steps = releaseSteps(graph(), "jolt-lang/time");
  assert.equal(steps.length, 2);
  assert.deepEqual(steps[0].libs.map((x) => x.id), ["jlt-commons/a"]);
  assert.deepEqual(steps[1].libs[0].pins.map((e) => e.from), ["jlt-commons/a", "jolt-lang/time"]);
});

test("the detail names the selected library, its latest tag and the release order", () => {
  const html = renderDeps(graph(), "jolt-lang/time", NOW);
  assert.match(html, /<h2[^>]*>jolt-lang\/time<\/h2>/);
  assert.match(html, /v0\.0\.18/);
  assert.match(html, /Wave 1/);
  assert.match(html, /Wave 2/);
  assert.match(html, /<svg/);
  assert.match(html, /behind/);
});

test("a library with nothing downstream says so", () => {
  const html = renderDeps(graph(), "jlt-commons/c", NOW);
  assert.match(html, /Nothing depends on/);
});

test("with nothing selected the page asks for a pick and lists every library", () => {
  const html = renderDeps(graph(), null, NOW);
  assert.match(html, /Pick a library/);
  for (const id of ["jlt-commons/a", "jlt-commons/lonely", "jolt-lang/time"]) assert.ok(html.includes(`data-id="${id}"`));
});

test("an unknown selection is reported, not thrown", () => {
  assert.match(renderDeps(graph(), "nope/x", NOW), /No library named/);
});

test("names are escaped", () => {
  const g = graph();
  g.libraries.push(lib("jlt-commons/<img>"));
  assert.ok(!renderDeps(g, null, NOW).includes("<img>"));
});

test("an unknown schema or a day-old file is flagged", () => {
  assert.match(renderDeps({ schema: 2 }, null, NOW), /unknown data format/);
  const g = graph();
  g.generated_at = "2026-11-18T00:00:00Z";
  assert.match(renderDeps(g, null, NOW), /stale/);
});
