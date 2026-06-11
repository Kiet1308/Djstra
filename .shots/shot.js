/* Generic screenshot runner.
   Usage:
     node shot.js out=DIR "name|url|delayMs|sel@wait,sel@wait" ...
   Chrome must run with --remote-debugging-port=9333.
   Serves D:/Djstra/Visualizer on :8123. Cache disabled (CDP).
   Console errors / exceptions are printed to stdout. */

const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = "D:/Djstra/Visualizer";
const PORT = 8123;
const CDP_PORT = 9333;

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".png": "image/png",
  ".woff2": "font/woff2",
};

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
      res.writeHead(200, {
        "Content-Type": TYPES[path.extname(p)] || "application/octet-stream",
        "Cache-Control": "no-store",
      });
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
    const listeners = [];
    ws.onopen = () =>
      resolve({
        send(method, params = {}) {
          return new Promise((res, rej) => {
            const mid = ++id;
            pending.set(mid, { res, rej });
            ws.send(JSON.stringify({ id: mid, method, params }));
          });
        },
        on(event, fn) {
          listeners.push([event, fn]);
        },
        close: () => ws.close(),
        _dispatch(msg) {
          for (const [ev, fn] of listeners) if (ev === msg.method) fn(msg.params);
        },
      });
    ws.onerror = reject;
    ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && pending.has(msg.id)) {
        const { res, rej } = pending.get(msg.id);
        pending.delete(msg.id);
        msg.error ? rej(new Error(msg.error.message)) : res(msg.result);
      } else if (msg.method) {
        ws._target?._dispatch?.(msg);
        if (ws._cdp) ws._cdp._dispatch(msg);
      }
    };
    ws.addEventListener("open", () => {});
    setTimeout(() => {}, 0);
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const args = process.argv.slice(2);
  let out = "D:/Djstra/.shots/cur";
  const shots = [];
  for (const a of args) {
    if (a.startsWith("out=")) {
      out = `D:/Djstra/.shots/${a.slice(4)}`;
      continue;
    }
    const [name, url, delay, steps, clip] = a.split("|");
    shots.push({
      name,
      url,
      delay: parseInt(delay || "2500", 10),
      steps: (steps || "")
        .split(",")
        .filter(Boolean)
        .map((s) => {
          const [sel, wait] = s.split("@");
          return { sel, wait: parseInt(wait || "900", 10) };
        }),
      clip: clip
        ? (() => {
            const [x, y, w, h] = clip.split(",").map(Number);
            return { x, y, width: w, height: h, scale: 2 };
          })()
        : undefined,
    });
  }
  if (!shots.length) {
    console.error("no shots given");
    process.exit(1);
  }

  fs.mkdirSync(out, { recursive: true });
  const server = await serve();

  const list = await (await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`)).json();
  const page = list.find((t) => t.type === "page");
  if (!page) throw new Error("no page target");
  const cdp = await connect(page.webSocketDebuggerUrl);

  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");
  await cdp.send("Network.enable");
  await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
  cdp.on?.("Runtime.exceptionThrown", (p) => console.log("EXC:", p.exceptionDetails?.text, p.exceptionDetails?.exception?.description || ""));
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: 1536,
    height: 864,
    deviceScaleFactor: 1,
    mobile: false,
  });

  for (const shot of shots) {
    await cdp.send("Page.navigate", { url: `http://127.0.0.1:${PORT}${shot.url}` });
    await sleep(shot.delay);
    for (const step of shot.steps) {
      await cdp.send("Runtime.evaluate", {
        expression: `document.querySelector(${JSON.stringify(step.sel)})?.click()`,
      });
      await sleep(step.wait);
    }
    // thu lỗi console tích luỹ trên trang
    const errs = await cdp.send("Runtime.evaluate", {
      expression: "JSON.stringify(window.__errs || [])",
      returnByValue: true,
    });
    if (errs.result?.value && errs.result.value !== "[]") console.log(`${shot.name} page errors:`, errs.result.value);
    const { data } = await cdp.send("Page.captureScreenshot", { format: "png", clip: shot.clip });
    fs.writeFileSync(path.join(out, `${shot.name}.png`), Buffer.from(data, "base64"));
    console.log("saved", path.join(out, `${shot.name}.png`));
  }

  cdp.close();
  server.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
