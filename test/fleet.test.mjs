import { test } from "node:test";
import assert from "node:assert/strict";
import { staleness, renderStatus } from "../docs/fleet/fleet.js";

const NOW = Date.parse("2026-11-20T12:00:00Z");
const HOUR = 3600 * 1000;
const iso = (msAgo) => new Date(NOW - msAgo).toISOString().replace(".000Z", "Z");

const cell = (result, extra = {}) => ({
  failed_step: null,
  finished_at: iso(HOUR),
  installed: "0.8.27",
  result,
  run_url: "https://github.com/jlt-commons/x/actions/runs/1",
  version: "0.8.27",
  ...extra,
});

const project = (name, cells, pin = "0.8.27") => ({
  name,
  pin,
  cells: { latest: cell("pass"), nightly: cell("pass"), pin: cell("pass", { version: pin }), ...cells },
});

const status = (projects, extra = {}) => ({
  schema: 1,
  canary_run: "https://github.com/jlt-commons/ci-builds/actions/runs/9",
  generated_at: iso(HOUR),
  jolt: {
    latest: { version: "0.8.27" },
    nightly: { note: "n", published_at: iso(5 * HOUR), sha: "f4e82fc8eac874cae1658b7976518253027c4f6a" },
  },
  projects,
  uncovered: [],
  ...extra,
});

const render = (s, h = null, checked = iso(10 * 60 * 1000)) => renderStatus(s, h, checked, NOW);

test("a fail cell shows its failed step and links to its run", () => {
  const html = render(status([
    project("glitter", { latest: cell("fail", { failed_step: "Formatting", run_url: "https://github.com/jlt-commons/glitter/actions/runs/42" }) }),
  ]));
  assert.match(html, /fail at Formatting/);
  assert.match(html, /href="https:\/\/github\.com\/jlt-commons\/glitter\/actions\/runs\/42"/);
});

test("mismatch reads as the wrong jolt and never as a pass", () => {
  const html = render(status([project("a", { nightly: cell("mismatch") })]));
  assert.match(html, /ran on the wrong jolt/);
  const row = html.slice(html.indexOf('data-project="a"'));
  assert.equal((row.match(/>pass</g) || []).length, 2);
});

test("labels for the other results", () => {
  const html = render(status([project("a", {
    latest: cell("infra"), nightly: cell("not-run"), pin: cell("timed-out"),
  }), project("b", { latest: cell("dispatch-failed") })]));
  assert.match(html, /could not run: infra/);
  assert.match(html, /not tested yet/);
  assert.match(html, /timed out/);
  assert.match(html, /dispatch failed/);
});

test("a null cell is shown as not tested yet", () => {
  const html = render(status([project("a", { nightly: null })]));
  assert.match(html, /not tested yet/);
});

test("projects keep the order they arrive in, failing first", () => {
  const html = render(status([
    project("bad", { latest: cell("fail", { failed_step: "Test" }) }),
    project("good", {}),
  ]));
  assert.ok(html.indexOf('data-project="bad"') < html.indexOf('data-project="good"'));
});

test("columns are chosen by name, not by key order", () => {
  const html = render(status([project("a", {
    pin: cell("fail", { failed_step: "PINSTEP" }),
    latest: cell("fail", { failed_step: "LATESTSTEP" }),
    nightly: cell("fail", { failed_step: "NIGHTLYSTEP" }),
  })]));
  const at = (s) => html.indexOf(s);
  assert.ok(at("PINSTEP") < at("LATESTSTEP") && at("LATESTSTEP") < at("NIGHTLYSTEP"));
});

test("a pin behind latest gets a note", () => {
  const html = render(status([project("a", {}, "0.8.24")]));
  assert.match(html, /pins 0\.8\.24, latest 0\.8\.27/);
});

test("a pin equal to latest, with or without a v, gets no note", () => {
  const html = render(status([project("a", {}, "v0.8.27")]));
  assert.doesNotMatch(html, /pins /);
});

test("uncovered repos are listed with their reasons", () => {
  const html = render(status([], { uncovered: [{ name: "instaparse", reason: "no ci.yml" }] }));
  assert.match(html, /Not in the fleet yet/);
  assert.match(html, /instaparse/);
  assert.match(html, /no ci\.yml/);
});

test("staleness: fresh at 11 h, stale at 12 h and a minute", () => {
  assert.equal(staleness(iso(11 * HOUR), NOW), "fresh");
  assert.equal(staleness(iso(12 * HOUR + 60 * 1000), NOW), "stale");
  assert.equal(staleness("garbage", NOW), "stale");
});

test("a stale status shows a warning with generated_at", () => {
  const g = iso(13 * HOUR);
  const html = render(status([project("a", {})], { generated_at: g }));
  assert.match(html, /role="alert"/);
  assert.ok(html.includes(g));
});

test("a fresh status has no stale warning", () => {
  assert.doesNotMatch(render(status([project("a", {})])), /role="alert"/);
});

test("an unknown schema shows no grid", () => {
  const html = render(status([project("a", {})], { schema: 2 }));
  assert.match(html, /unknown data format/);
  assert.doesNotMatch(html, /data-project/);
});

test("a missing or malformed status shows no grid", () => {
  for (const bad of [null, {}, { schema: 1 }, { schema: 1, projects: "x" }]) {
    const html = render(bad);
    assert.match(html, /unknown data format/);
  }
});

test("interpolated strings are escaped", () => {
  const evil = "<b>x</b>";
  const html = render(status([
    project(evil, { latest: cell("fail", { failed_step: evil, run_url: 'https://x/"><script>' }) }),
  ], { uncovered: [{ name: evil, reason: evil }] }));
  assert.ok(!html.includes("<b>x</b>"));
  assert.ok(!html.includes("<script>"));
  assert.ok(html.includes("&lt;b&gt;x&lt;/b&gt;"));
});

test("a javascript: run url is not linked", () => {
  const html = render(status([project("a", { latest: cell("pass", { run_url: "javascript:alert(1)" }) })]));
  assert.ok(!html.includes("javascript:"));
});

test("the nightly age is computed from published_at", () => {
  const html = render(status([project("a", {})]));
  assert.match(html, /f4e82fc/);
  assert.match(html, /5 hours ago/);
});

test("a null nightly says so", () => {
  const s = status([project("a", {})]);
  s.jolt.nightly = null;
  assert.match(render(s), /no nightly/);
});

test("last checked: shown, or unknown when missing", () => {
  assert.match(render(status([project("a", {})])), /10 minutes ago/);
  assert.match(render(status([project("a", {})]), null, null), /Last checked[^]*unknown/);
});

test("last run link is labelled last run", () => {
  const html = render(status([project("a", {})]));
  assert.match(html, /last run/i);
  assert.doesNotMatch(html, /canary run/i);
});

test("history strip lists recent results as text, newest first", () => {
  const h = { schema: 1, projects: { a: {
    pin: [cell("pass")], latest: [cell("fail", { failed_step: "Test" }), cell("pass")], nightly: [], adhoc: [cell("pass")],
  } } };
  const html = render(status([project("a", {})]), h);
  assert.match(html, /<details/);
  assert.match(html, /fail at Test/);
});

test("without history there is no strip and no crash", () => {
  assert.doesNotMatch(render(status([project("a", {})]), null), /<details/);
});
