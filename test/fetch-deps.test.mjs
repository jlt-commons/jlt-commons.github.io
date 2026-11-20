import { test } from "node:test";
import assert from "node:assert/strict";
import { checkDeps, pickDeps } from "../scripts/fetch-deps.mjs";

const good = JSON.stringify({
  schema: 1,
  generated_at: "2026-11-20T15:00:00Z",
  libraries: [{ id: "jlt-commons/a", waves: [] }],
  edges: [],
});

test("a schema 1 graph with libraries and edges passes", () => {
  assert.equal(checkDeps(good), null);
});

test("anything else names what is wrong", () => {
  assert.match(checkDeps("not json"), /not JSON/);
  assert.match(checkDeps(JSON.stringify({ schema: 2, libraries: [], edges: [] })), /schema/);
  assert.match(checkDeps(JSON.stringify({ schema: 1, edges: [] })), /libraries/);
  assert.match(checkDeps(JSON.stringify({ schema: 1, libraries: [], edges: [] })), /no libraries/);
});

test("the fresh file wins, and is a change when it differs from the deployed one", () => {
  const older = good.replace("15:00", "14:00");
  assert.deepEqual(pickDeps({ fresh: good, deployed: older }), { text: good, source: "fresh", changed: true });
  assert.deepEqual(pickDeps({ fresh: good, deployed: good }), { text: good, source: "fresh", changed: false });
});

test("a bad or missing fresh file falls back to the deployed one, which is no change", () => {
  assert.deepEqual(pickDeps({ fresh: "{", deployed: good }), { text: good, source: "deployed", changed: false });
  assert.deepEqual(pickDeps({ fresh: null, deployed: good }), { text: good, source: "deployed", changed: false });
});

test("with neither usable there is nothing to publish", () => {
  assert.deepEqual(pickDeps({ fresh: null, deployed: "<html>404</html>" }), { text: null, source: null, changed: false });
});

test("a first publish with no deployed copy is a change", () => {
  assert.deepEqual(pickDeps({ fresh: good, deployed: null }), { text: good, source: "fresh", changed: true });
});
