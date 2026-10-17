// Renders .claude-protocol/plan.json into the self-contained plan/plan.html tracker.
// Usage: node .claude-protocol/render-plan.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const plan = JSON.parse(
  readFileSync(join(root, ".claude-protocol/plan.json"), "utf8"),
);
const generatedAt = new Date().toISOString();
const payload = JSON.stringify({ ...plan, generatedAt }).replace(
  /</g,
  "\\u003c",
);

const html = `<!doctype html>
<html lang="en" data-theme="dark">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex" />
<title>${plan.title} — plan</title>
<style>
  :root {
    --bg: #000; --panel: #121212; --raised: #1f1f1f; --hi: #2a2a2a;
    --text: #fff; --muted: #b3b3b3; --line: rgb(255 255 255 / 0.1);
    --green: #1ed760; --amber: #ffa42b; --red: #f3727f; --blue: #539df5;
    --crit: rgb(30 215 96 / 0.12);
  }
  [data-theme="light"] {
    --bg: #f4f4f4; --panel: #fff; --raised: #f0f0f0; --hi: #e4e4e4;
    --text: #121212; --muted: #555; --line: rgb(0 0 0 / 0.12);
    --green: #12823b; --amber: #9a5b00; --red: #b3261e; --blue: #1d5fbf;
    --crit: rgb(18 130 59 / 0.1);
  }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--bg); color: var(--text);
    font: 15px/1.5 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
  .wrap { max-width: 1100px; margin: 0 auto; padding: 24px 16px 64px; }
  header.top { display: flex; flex-wrap: wrap; gap: 16px; align-items: flex-end;
    justify-content: space-between; margin-bottom: 16px; }
  h1 { font-size: clamp(1.6rem, 4vw, 2.6rem); line-height: 1.05; margin: 4px 0 0; letter-spacing: -0.03em; }
  .eyebrow { color: var(--muted); font-size: 13px; }
  .meta { color: var(--muted); font-size: 13px; margin-top: 6px; }
  .bar { height: 6px; background: var(--hi); border-radius: 99px; overflow: hidden; margin: 14px 0 6px; }
  .bar > i { display: block; height: 100%; background: var(--green); width: 0; transition: width .3s; }
  .toolbar { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin: 16px 0; }
  .chip { border: 0; border-radius: 99px; padding: 6px 14px; min-height: 32px; cursor: pointer;
    background: var(--raised); color: var(--text); font: inherit; font-size: 14px; }
  .chip[aria-pressed="true"] { background: var(--text); color: var(--bg); }
  .chip:focus-visible, select:focus-visible, summary:focus-visible, button:focus-visible {
    outline: 2px solid var(--text); outline-offset: 2px; }
  .spacer { flex: 1; }
  details.sprint, details.phase { background: var(--panel); border-radius: 8px; margin: 10px 0; }
  details.phase { background: var(--raised); margin: 8px 12px; }
  summary { cursor: pointer; padding: 12px 16px; list-style: none; display: flex; gap: 10px; align-items: baseline; }
  summary::-webkit-details-marker { display: none; }
  summary::before { content: "▸"; color: var(--muted); transition: transform .15s; }
  details[open] > summary::before { transform: rotate(90deg); }
  .sprint > summary { font-size: 18px; font-weight: 800; }
  .phase > summary { font-weight: 700; }
  .count { color: var(--muted); font-weight: 400; font-size: 13px; margin-left: auto; white-space: nowrap; }
  .task { margin: 8px 12px 12px; padding: 12px 14px; border-radius: 6px; background: var(--panel);
    border-left: 3px solid transparent; }
  .task.crit { border-left-color: var(--green); background: linear-gradient(90deg, var(--crit), transparent 60%), var(--panel); }
  .task-head { display: flex; flex-wrap: wrap; gap: 8px 12px; align-items: center; }
  .tid { font-variant-numeric: tabular-nums; color: var(--muted); font-size: 13px; min-width: 3.2em; }
  .ttitle { font-weight: 700; flex: 1 1 260px; }
  .badge { font-size: 12px; border-radius: 4px; padding: 2px 6px; background: var(--hi); color: var(--muted); white-space: nowrap; }
  .badge.crit { color: var(--green); }
  .badge.par { color: var(--blue); }
  select.status { font: inherit; font-size: 13px; border-radius: 99px; padding: 4px 10px; border: 1px solid var(--line);
    background: var(--raised); color: var(--text); }
  .status[data-s="done"] { color: var(--green); }
  .status[data-s="in_progress"] { color: var(--amber); }
  .status[data-s="blocked"] { color: var(--red); }
  .task ul { margin: 8px 0 6px 18px; padding: 0; color: var(--text); }
  .task li { margin: 3px 0; }
  .facts { display: grid; grid-template-columns: max-content 1fr; gap: 2px 12px; font-size: 13px; color: var(--muted); margin-top: 6px; }
  .facts code { color: var(--text); font-size: 12px; word-break: break-word; }
  .decisions { background: var(--panel); border-radius: 8px; padding: 4px 0; margin: 10px 0 18px; }
  .decisions dl { margin: 0; padding: 0 16px 12px; display: grid; grid-template-columns: max-content 1fr; gap: 6px 16px; font-size: 14px; }
  .decisions dt { color: var(--muted); }
  .decisions dd { margin: 0; }
  .hidden { display: none !important; }
  @media (max-width: 640px) { .decisions dl, .facts { grid-template-columns: 1fr; } }
  @media print {
    :root, [data-theme] { --bg: #fff; --panel: #fff; --raised: #fff; --hi: #eee; --text: #000; --muted: #444; --line: #ccc; --green: #0a6b2e; --crit: transparent; }
    .toolbar, #theme { display: none; }
    details > summary::before { content: ""; }
    details.sprint, details.phase, .task { break-inside: avoid; border: 1px solid #ccc; }
    select.status { border: 0; appearance: none; padding: 0; }
  }
</style>
</head>
<body>
<div class="wrap">
  <header class="top">
    <div>
      <div class="eyebrow">Protocol plan · scope <span id="scope"></span> · integration branch <code id="branch"></code></div>
      <h1 id="title"></h1>
      <div class="meta" id="meta"></div>
    </div>
    <button class="chip" id="theme" type="button" aria-pressed="false">Light mode</button>
  </header>
  <div class="bar" role="progressbar" aria-label="Tasks done" aria-valuemin="0" aria-valuemax="100" id="progress"><i></i></div>
  <div class="meta" id="progress-label"></div>
  <details class="decisions"><summary>Decisions</summary><dl id="decisions"></dl></details>
  <div class="toolbar" role="group" aria-label="Filter tasks by status">
    <button class="chip" type="button" data-filter="all" aria-pressed="true">All</button>
    <button class="chip" type="button" data-filter="todo" aria-pressed="false">To do</button>
    <button class="chip" type="button" data-filter="in_progress" aria-pressed="false">In progress</button>
    <button class="chip" type="button" data-filter="done" aria-pressed="false">Done</button>
    <button class="chip" type="button" data-filter="blocked" aria-pressed="false">Blocked</button>
    <span class="spacer"></span>
    <button class="chip" type="button" id="expand">Expand all</button>
    <button class="chip" type="button" id="collapse">Collapse all</button>
  </div>
  <main id="tree"></main>
</div>
<script id="plan-data" type="application/json">${payload}</script>
<script>
(function () {
  var plan = JSON.parse(document.getElementById("plan-data").textContent);
  var KEY = "plan:" + plan.feature;
  var STATUSES = [["todo", "To do"], ["in_progress", "In progress"], ["done", "Done"], ["blocked", "Blocked"]];
  var stored = null;
  try { stored = JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) { stored = null; }
  // A regenerated plan (new generatedAt) is the source of truth: it resets local overrides.
  var overrides = stored && stored.generatedAt === plan.generatedAt ? stored.statuses || {} : {};
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify({ generatedAt: plan.generatedAt, statuses: overrides })); } catch (e) {}
  }
  save();
  function statusOf(task) { return overrides[task.id] || task.status; }
  function el(tag, attrs, text) {
    var node = document.createElement(tag);
    for (var k in attrs || {}) node.setAttribute(k, attrs[k]);
    if (text != null) node.textContent = text;
    return node;
  }
  document.getElementById("title").textContent = plan.title || plan.feature;
  document.getElementById("scope").textContent = plan.scope;
  document.getElementById("branch").textContent = plan.integrationBranch || "";
  var tasks = [];
  plan.sprints.forEach(function (s) { s.phases.forEach(function (p) { p.tasks.forEach(function (t) { tasks.push(t); }); }); });
  var hours = tasks.reduce(function (a, t) { return a + (t.estimateHours || 0); }, 0);
  document.getElementById("meta").textContent = tasks.length + " tasks · ~" + hours + " h · generated " + new Date(plan.generatedAt).toLocaleString();
  var dl = document.getElementById("decisions");
  Object.keys(plan.decisions || {}).forEach(function (k) {
    var v = plan.decisions[k];
    if (typeof v === "object") v = Array.isArray(v) ? v.join(" · ") : Object.keys(v).map(function (x) { return x + ": " + (typeof v[x] === "object" ? JSON.stringify(v[x]) : v[x]); }).join(" · ");
    dl.appendChild(el("dt", null, k.replace(/_/g, " ")));
    dl.appendChild(el("dd", null, String(v)));
  });
  var tree = document.getElementById("tree");
  plan.sprints.forEach(function (s) {
    var sd = el("details", { class: "sprint", open: "" });
    var ss = el("summary");
    ss.appendChild(el("span", null, "Sprint " + s.id + " · " + s.name));
    ss.appendChild(el("span", { class: "count", "data-count": "" }));
    sd.appendChild(ss);
    s.phases.forEach(function (p) {
      var pd = el("details", { class: "phase", open: "" });
      var ps = el("summary");
      ps.appendChild(el("span", null, p.id + " " + p.name));
      ps.appendChild(el("span", { class: "count", "data-count": "" }));
      pd.appendChild(ps);
      p.tasks.forEach(function (t) {
        var card = el("article", { class: "task" + (t.criticalPath ? " crit" : ""), "data-task": t.id });
        var head = el("div", { class: "task-head" });
        head.appendChild(el("span", { class: "tid" }, t.id));
        head.appendChild(el("span", { class: "ttitle" }, t.title));
        if (t.criticalPath) head.appendChild(el("span", { class: "badge crit" }, "Critical path"));
        if (t.parallelizable) head.appendChild(el("span", { class: "badge par" }, "Parallelizable"));
        head.appendChild(el("span", { class: "badge" }, (t.estimateHours || 0) + " h"));
        var sel = el("select", { class: "status", "aria-label": "Status of task " + t.id });
        STATUSES.forEach(function (o) { var opt = el("option", { value: o[0] }, o[1]); sel.appendChild(opt); });
        sel.value = statusOf(t);
        sel.setAttribute("data-s", sel.value);
        sel.addEventListener("change", function () {
          overrides[t.id] = sel.value; sel.setAttribute("data-s", sel.value); save(); refresh();
        });
        head.appendChild(sel);
        card.appendChild(head);
        var ul = el("ul");
        (t.acceptance || []).forEach(function (a) { ul.appendChild(el("li", null, a)); });
        card.appendChild(ul);
        var facts = el("div", { class: "facts" });
        [["Depends on", (t.dependencies || []).join(", ") || "—"], ["Time / space", t.timeComplexity + " / " + t.spaceComplexity],
         ["Files", (t.files || []).join(", ")], ["Smoke test", t.smokeTest], ["CI jobs", (t.ciJobs || []).join(" → ")]].forEach(function (f) {
          facts.appendChild(el("span", null, f[0]));
          var dd = el("span"); dd.appendChild(el("code", null, f[1])); facts.appendChild(dd);
        });
        card.appendChild(facts);
        pd.appendChild(card);
      });
      sd.appendChild(pd);
    });
    tree.appendChild(sd);
  });
  var filter = "all";
  function refresh() {
    var done = 0;
    document.querySelectorAll("[data-task]").forEach(function (card) {
      var s = card.querySelector("select").value;
      if (s === "done") done++;
      card.classList.toggle("hidden", filter !== "all" && s !== filter);
    });
    document.querySelectorAll("details.phase, details.sprint").forEach(function (d) {
      var cards = d.querySelectorAll("[data-task]");
      var visible = d.querySelectorAll("[data-task]:not(.hidden)").length;
      var finished = Array.prototype.filter.call(cards, function (c) { return c.querySelector("select").value === "done"; }).length;
      d.querySelector(":scope > summary [data-count]").textContent = finished + "/" + cards.length + " done";
      d.classList.toggle("hidden", visible === 0);
    });
    var pct = Math.round((done / tasks.length) * 100);
    var bar = document.getElementById("progress");
    bar.setAttribute("aria-valuenow", String(pct));
    bar.firstElementChild.style.width = pct + "%";
    document.getElementById("progress-label").textContent = done + " of " + tasks.length + " tasks done (" + pct + "%)";
  }
  document.querySelectorAll("[data-filter]").forEach(function (b) {
    b.addEventListener("click", function () {
      filter = b.getAttribute("data-filter");
      document.querySelectorAll("[data-filter]").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
      refresh();
    });
  });
  document.getElementById("expand").addEventListener("click", function () { document.querySelectorAll("details").forEach(function (d) { d.open = true; }); });
  document.getElementById("collapse").addEventListener("click", function () { document.querySelectorAll("details.phase, details.sprint").forEach(function (d) { d.open = false; }); });
  var themeBtn = document.getElementById("theme");
  function applyTheme(t) {
    document.documentElement.setAttribute("data-theme", t);
    themeBtn.textContent = t === "dark" ? "Light mode" : "Dark mode";
    themeBtn.setAttribute("aria-pressed", String(t === "light"));
  }
  var theme = "dark";
  try { theme = localStorage.getItem(KEY + ":theme") || "dark"; } catch (e) {}
  applyTheme(theme);
  themeBtn.addEventListener("click", function () {
    theme = theme === "dark" ? "light" : "dark"; applyTheme(theme);
    try { localStorage.setItem(KEY + ":theme", theme); } catch (e) {}
  });
  window.addEventListener("beforeprint", function () { document.querySelectorAll("details").forEach(function (d) { d.open = true; }); });
  refresh();
})();
</script>
</body>
</html>
`;

writeFileSync(join(root, "plan/plan.html"), html);
console.log("plan/plan.html written", generatedAt);
