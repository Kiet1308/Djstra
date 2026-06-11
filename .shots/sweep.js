/* Full sweep: chụp toàn bộ intro + 34 scene, gom lỗi console/exception.
   Chrome chạy sẵn với --remote-debugging-port=9333. */

const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = "D:/Djstra/Visualizer";
const OUT = "D:/Djstra/.shots/sweep";
const PORT = 8123;
const CDP_PORT = 9333;

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".png": "image/png",
  ".woff2": "font/woff2",
};

const SHOTS = [
  { name: "intro1", url: "/", delay: 3200 },
  { name: "intro2", url: "/", delay: 1200, steps: [["[data-next]", 2400]] },
];
const SCENES = { 1: 6, 2: 12, 3: 12, 4: 4 };
const EXTRA_DELAY = {
  "1-2": 9500, "1-3": 8500, "1-5": 8000, "1-6": 7500,
  "3-12": 14000,
};
for (const [part, count] of Object.entries(SCENES)) {
  for (let s = 1; s <= count; s++) {
    SHOTS.push({ name: `p${part}s${s}`, url: `/?part=${part}&scene=${s}`, delay: EXTRA_DELAY[`${part}-${s}`] || 4500 });
  }
}
// các bước tương tác chính
SHOTS.push(
  { name: "p2s8-wrong", url: "/?part=2&scene=8", delay: 3000, steps: [[".candidate-chip[data-node='D']", 1500]] },
  { name: "p2s8-right", url: "/?part=2&scene=8", delay: 3000, steps: [[".candidate-chip[data-node='C']", 1800]] },
  { name: "p2s9-wrong", url: "/?part=2&scene=9", delay: 3000, steps: [[".candidate-chip[data-node='E']", 1500]] },
  { name: "p2s10-full", url: "/?part=2&scene=10", delay: 2600, steps: [[".action-button", 1200], [".candidate-chip[data-node='E']", 1800]] },
  { name: "p2s11-all", url: "/?part=2&scene=11", delay: 2600, steps: [["#nextBtn", 1000], ["#nextBtn", 1000], ["#nextBtn", 1000], ["#nextBtn", 1800]] },
  { name: "p4s1-full", url: "/?part=4&scene=1", delay: 2500, steps: [["#nextBtn", 2300], ["#nextBtn", 2300], ["#nextBtn", 2300], ["#nextBtn", 2300], ["#nextBtn", 2300], ["#nextBtn", 2300], ["#nextBtn", 2300], ["#nextBtn", 3000]] },
  { name: "p4s3-full", url: "/?part=4&scene=3", delay: 2200, steps: [["#nextBtn", 900], ["#nextBtn", 900], ["#nextBtn", 1800]] },
);

function serve() {
  const server = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split("?")[0]);
    if (p === "/") p = "/index.html";
    fs.readFile(path.join(ROOT, p), (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end("not found");
        return;
      }
      res.writeHead(200, { "Content-Type": TYPES[path.extname(p)] || "application/octet-stream", "Cache-Control": "no-store" });
      res.end(data);
    });
  });
  return new Promise((resolve) => server.listen(PORT, () => resolve(server)));
}

function connect(wsUrl) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    let id = 0;
    const pending = new Map();
    ws.onopen = () =>
      resolve({
        send(method, params = {}) {
          return new Promise((res, rej) => {
            const mid = ++id;
            pending.set(mid, { res, rej });
            ws.send(JSON.stringify({ id: mid, method, params }));
          });
        },
        close: () => ws.close(),
      });
    ws.onerror = reject;
    ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && pending.has(msg.id)) {
        const { res, rej } = pending.get(msg.id);
        pending.delete(msg.id);
        msg.error ? rej(new Error(msg.error.message)) : res(msg.result);
      }
    };
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const server = await serve();
  const list = await (await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`)).json();
  const page = list.find((t) => t.type === "page");
  const cdp = await connect(page.webSocketDebuggerUrl);
  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");
  await cdp.send("Network.enable");
  await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
  await cdp.send("Page.addScriptToEvaluateOnNewDocument", {
    source: `window.__errs = []; window.addEventListener('error', e => __errs.push(String(e.message))); window.addEventListener('unhandledrejection', e => __errs.push('rejection: ' + String(e.reason)));`,
  });
  await cdp.send("Emulation.setDeviceMetricsOverride", { width: 1536, height: 864, deviceScaleFactor: 1, mobile: false });

  let failures = 0;
  for (const shot of SHOTS) {
    await cdp.send("Page.navigate", { url: `http://127.0.0.1:${PORT}${shot.url}` });
    await sleep(shot.delay);
    for (const [sel, wait] of shot.steps || []) {
      await cdp.send("Runtime.evaluate", { expression: `document.querySelector(${JSON.stringify(sel)})?.click()` });
      await sleep(wait);
    }
    const errs = await cdp.send("Runtime.evaluate", { expression: "JSON.stringify(window.__errs||[])", returnByValue: true });
    if (errs.result?.value && errs.result.value !== "[]") {
      failures++;
      console.log(`!! ${shot.name} ERRORS:`, errs.result.value);
    }
    const { data } = await cdp.send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(OUT, `${shot.name}.png`), Buffer.from(data, "base64"));
    console.log("ok", shot.name);
  }
  console.log(failures ? `DONE with ${failures} pages having errors` : "DONE — no console errors");
  cdp.close();
  server.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
