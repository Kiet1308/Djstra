/* ============================================================
   stage.js — render đồ thị mực-trên-giấy + camera.
   Mọi scene đều thao tác qua API này; không file nào tự vẽ node.
   Lưu ý GSAP/SVG: KHÔNG tween x/y trên element có transform gốc —
   camera có group riêng, node giữ translate cố định.
   ============================================================ */
window.DJ = window.DJ || {};

DJ.stage = (function () {
  const SVG_NS = "http://www.w3.org/2000/svg";
  const VIEW = { w: 1000, h: 640, cx: 500, cy: 320 };

  let svg, layers, floatRoot;
  let profile = null;
  let badgeOffsets = {};
  const nodeEls = new Map(); // name -> <g.node>
  const edgeEls = new Map(); // "A:B" (sorted) -> <line.edge>
  const labelEls = new Map(); // "A:B" (sorted) -> <g.edge-label>
  const badgeEls = new Map(); // name -> <g.cost-badge>
  const camState = { x: 0, y: 0, s: 1 };

  function el(tag, attrs = {}, cls = "") {
    const node = document.createElementNS(SVG_NS, tag);
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
    if (cls) node.setAttribute("class", cls);
    return node;
  }

  function key(a, b) {
    return a < b ? `${a}:${b}` : `${b}:${a}`;
  }

  let nodeClickHandler = null;

  function init() {
    svg = document.getElementById("stageSvg");
    floatRoot = document.getElementById("stageFloat");
    layers = {
      camera: document.getElementById("cameraLayer"),
      edges: document.getElementById("edgeLayer"),
      routes: document.getElementById("routeLayer"),
      edgeLabels: document.getElementById("edgeLabelLayer"),
      nodes: document.getElementById("nodeLayer"),
      badges: document.getElementById("badgeLayer"),
      annotations: document.getElementById("annotationLayer"),
    };
    layers.nodes.addEventListener("click", (e) => {
      const g = e.target.closest("[data-node]");
      if (g && g.classList.contains("is-clickable") && nodeClickHandler) nodeClickHandler(g.getAttribute("data-node"));
    });
    layers.nodes.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      const g = e.target.closest("[data-node]");
      if (g && g.classList.contains("is-clickable") && nodeClickHandler) {
        e.preventDefault();
        nodeClickHandler(g.getAttribute("data-node"));
      }
    });
  }

  function setNodeClickHandler(fn) {
    nodeClickHandler = fn;
  }

  function setClickable(names) {
    for (const g of nodeEls.values()) {
      const on = names.includes(g.getAttribute("data-node"));
      g.classList.toggle("is-clickable", on);
      if (on) {
        g.setAttribute("tabindex", "0");
        g.setAttribute("role", "button");
      } else {
        g.setAttribute("tabindex", "-1");
        g.removeAttribute("role");
      }
    }
  }

  /* ---------- Dựng đồ thị ---------- */
  function loadGraph(profileKey, opts = {}) {
    profile = DJ.data.graphProfiles[profileKey];
    badgeOffsets = opts.badgeOffsets || {};
    clearAll();
    nodeEls.clear();
    edgeEls.clear();
    labelEls.clear();
    badgeEls.clear();
    layers.edges.innerHTML = "";
    layers.edgeLabels.innerHTML = "";
    layers.nodes.innerHTML = "";

    const placements = opts.labelPlacements || {};

    for (const [a, b, w] of profile.edges) {
      const pa = profile.nodes[a];
      const pb = profile.nodes[b];
      const line = el("line", { x1: pa.x, y1: pa.y, x2: pb.x, y2: pb.y, "data-edge": key(a, b) }, "edge");
      layers.edges.appendChild(line);
      edgeEls.set(key(a, b), line);

      const place = placements[`${a}:${b}`] || placements[`${b}:${a}`] || { t: 0.5, n: 0 };
      const mx = pa.x + (pb.x - pa.x) * place.t;
      const my = pa.y + (pb.y - pa.y) * place.t;
      // dịch nhãn theo pháp tuyến của cạnh để không đè lên nét
      const len = Math.hypot(pb.x - pa.x, pb.y - pa.y) || 1;
      const nx = (-(pb.y - pa.y) / len) * (place.n || 0);
      const ny = ((pb.x - pa.x) / len) * (place.n || 0);
      const g = el("g", { transform: `translate(${mx + nx} ${my + ny})`, "data-edge": key(a, b) }, "edge-label");
      const wTxt = String(w);
      const pillW = Math.max(24, wTxt.length * 9 + 14);
      g.appendChild(el("rect", { x: -pillW / 2, y: -11, width: pillW, height: 22, rx: 6 }));
      const t = el("text");
      t.textContent = wTxt;
      g.appendChild(t);
      layers.edgeLabels.appendChild(g);
      labelEls.set(key(a, b), g);
    }

    for (const [name, p] of Object.entries(profile.nodes)) {
      const g = el("g", { transform: `translate(${p.x} ${p.y})`, "data-node": name, tabindex: "-1" }, "node");
      g.appendChild(el("circle", { r: 27 }, "node-halo"));
      g.appendChild(el("circle", { r: 21 }, "node-ring"));
      const t = el("text", {}, "node-name");
      t.textContent = name;
      g.appendChild(t);
      if (profile.terminalNodes.includes(name)) g.classList.add("is-terminal");
      if (profile.goal === name) g.classList.add("is-goal");
      layers.nodes.appendChild(g);
      nodeEls.set(name, g);
    }
  }

  function edgeWeight(a, b) {
    const e = profile.edges.find(([x, y]) => key(x, y) === key(a, b));
    return e ? e[2] : null;
  }

  function routeCost(path) {
    let sum = 0;
    for (let i = 0; i < path.length - 1; i++) sum += edgeWeight(path[i], path[i + 1]) || 0;
    return sum;
  }

  /* ---------- Trạng thái đỉnh ---------- */
  function setNodeState(name, state) {
    const g = nodeEls.get(name);
    if (!g) return;
    g.classList.remove("is-unknown", "is-open", "is-settled");
    if (state && state !== "plain") g.classList.add(`is-${state}`);
  }

  function applyState(stateMap, opts = {}) {
    for (const [name, st] of Object.entries(stateMap)) {
      setNodeState(name, st.state);
      if (opts.badges) {
        if (st.cost !== null && st.cost !== undefined && st.state !== "unknown") {
          showBadge(name, st.cost, st.state === "settled" ? "is-settled" : "");
        } else {
          hideBadge(name);
        }
      }
    }
  }

  /* ---------- Huy hiệu cost ---------- */
  function showBadge(name, value, extraCls = "") {
    let g = badgeEls.get(name);
    const p = profile.nodes[name];
    const off = badgeOffsets[name] || { x: 24, y: -26 };
    const txt = String(value);
    const pillW = Math.max(26, txt.length * 8.5 + 14);
    if (!g) {
      g = el("g", { transform: `translate(${p.x + off.x} ${p.y + off.y})` }, "cost-badge");
      g.appendChild(el("rect", { x: -pillW / 2, y: -12, width: pillW, height: 24, rx: 7 }));
      g.appendChild(el("text"));
      layers.badges.appendChild(g);
      badgeEls.set(name, g);
      // không tween y: sẽ đè mất translate gốc của <g> badge
      gsap.from(g, { opacity: 0, duration: DJ.dur(0.35), ease: "power2.out" });
    }
    g.setAttribute("class", `cost-badge ${extraCls}`.trim());
    g.querySelector("rect").setAttribute("x", -pillW / 2);
    g.querySelector("rect").setAttribute("width", pillW);
    g.querySelector("text").textContent = txt;
    return g;
  }

  function hideBadge(name) {
    const g = badgeEls.get(name);
    if (g) {
      badgeEls.delete(name);
      g.remove();
    }
  }

  /* ---------- Tuyến đường ---------- */
  function pathD(path) {
    const pts = path.map((n) => profile.nodes[n]);
    return pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  }

  function drawRoute(path, cls = "is-lit", opts = {}) {
    const p = el("path", { d: pathD(path), fill: "none" }, `edge ${cls}`);
    layers.routes.appendChild(p);
    const len = p.getTotalLength();
    p.style.strokeDasharray = opts.dash ? p.getAttribute("stroke-dasharray") || "" : `${len}`;
    if (!opts.instant) {
      p.style.strokeDashoffset = `${len}`;
      gsap.to(p, {
        strokeDashoffset: 0,
        duration: DJ.dur(opts.duration ?? 0.9),
        delay: DJ.dur(opts.delay ?? 0),
        ease: opts.ease || "power1.inOut",
      });
    }
    return p;
  }

  /* ---------- Camera ---------- */
  function cameraTransform(center, scale) {
    const x = VIEW.cx - scale * center.x;
    const y = VIEW.cy - scale * center.y;
    return { x, y, s: scale };
  }

  function camera(target, opts = {}) {
    const { x, y, s } = cameraTransform(target.center, target.scale);
    return gsap.to(camState, {
      x,
      y,
      s,
      duration: DJ.dur(opts.duration ?? 1.1),
      delay: DJ.dur(opts.delay ?? 0),
      ease: opts.ease || "power2.inOut",
      onUpdate() {
        layers.camera.setAttribute("transform", `translate(${camState.x} ${camState.y}) scale(${camState.s})`);
      },
    });
  }

  function cameraReset(opts = {}) {
    return camera({ center: { x: VIEW.cx, y: VIEW.cy }, scale: 1 }, opts);
  }

  function cameraSnap(target) {
    const { x, y, s } = target ? cameraTransform(target.center, target.scale) : { x: 0, y: 0, s: 1 };
    Object.assign(camState, { x, y, s });
    layers.camera.setAttribute("transform", `translate(${x} ${y}) scale(${s})`);
  }

  /* ---------- Toạ độ đồ thị -> pixel trên .stage (cho float card) ---------- */
  function project(gx, gy) {
    const rect = svg.getBoundingClientRect();
    const scale = Math.min(rect.width / VIEW.w, rect.height / VIEW.h);
    const ox = (rect.width - VIEW.w * scale) / 2;
    const oy = (rect.height - VIEW.h * scale) / 2;
    const sx = camState.x + camState.s * gx;
    const sy = camState.y + camState.s * gy;
    return { x: ox + sx * scale, y: oy + sy * scale };
  }

  /* ---------- Dọn dẹp ---------- */
  function clearAll() {
    layers.routes.innerHTML = "";
    layers.annotations.innerHTML = "";
    layers.badges.innerHTML = "";
    badgeEls.clear();
    floatRoot.innerHTML = "";
    nodeClickHandler = null;
    for (const g of nodeEls.values()) {
      g.setAttribute("class", g.getAttribute("class").replace(/is-(unknown|open|settled|clickable|wrong|correct)/g, "").replace(/\s+/g, " ").trim());
      g.style.opacity = "";
      g.setAttribute("tabindex", "-1");
      g.removeAttribute("role");
      gsap.killTweensOf(g);
      // node có thể bị kill giữa tween scale (Next/Replay nhanh) — trả về 1,
      // KHÔNG đụng x/y vì GSAP đã parse translate gốc vào đó
      gsap.set(g, { scale: 1 });
    }
    for (const line of edgeEls.values()) {
      line.setAttribute("class", "edge");
      line.style.opacity = "";
      gsap.killTweensOf(line);
    }
    for (const lb of labelEls.values()) {
      lb.classList.remove("is-dim", "is-lit");
      lb.style.opacity = "";
      gsap.killTweensOf(lb);
    }
    cameraSnap(null);
  }

  /* ---------- Tiện ích hiển thị chọn lọc (không góc nhìn thượng đế) ---------- */
  function setAlpha(els, value, opts = {}) {
    const list = Array.isArray(els) ? els : [els];
    for (const e of list) {
      if (!e) continue;
      if (opts.duration) {
        gsap.to(e, { opacity: value, duration: DJ.dur(opts.duration), delay: DJ.dur(opts.delay ?? 0), ease: "power2.out" });
      } else {
        e.style.opacity = value;
      }
    }
  }

  function node(name) {
    return nodeEls.get(name);
  }
  function edge(a, b) {
    return edgeEls.get(key(a, b));
  }
  function label(a, b) {
    return labelEls.get(key(a, b));
  }
  function badge(name) {
    return badgeEls.get(name);
  }
  function allNodes() {
    return [...nodeEls.values()];
  }
  function allEdges() {
    return [...edgeEls.values()];
  }
  function allLabels() {
    return [...labelEls.values()];
  }
  function nodePos(name) {
    return profile.nodes[name];
  }

  /* Pulse khi chốt một đỉnh */
  function pulse(name, color) {
    const p = profile.nodes[name];
    const ring = el("circle", { cx: p.x, cy: p.y, r: 22, fill: "none", stroke: color || "var(--moss)", "stroke-width": 3 });
    layers.routes.appendChild(ring);
    gsap.to(ring, { attr: { r: 44 }, opacity: 0, duration: DJ.dur(0.8), ease: "power1.out", onComplete: () => ring.remove() });
  }

  /* Card HTML nổi trên stage */
  function floatCard(html, style = {}) {
    const card = document.createElement("div");
    card.className = "float-card";
    card.innerHTML = html;
    Object.assign(card.style, style);
    floatRoot.appendChild(card);
    return card;
  }

  return {
    init,
    setNodeClickHandler,
    setClickable,
    loadGraph,
    clearAll,
    applyState,
    setNodeState,
    showBadge,
    hideBadge,
    badge,
    drawRoute,
    pathD,
    camera,
    cameraReset,
    cameraSnap,
    project,
    setAlpha,
    node,
    edge,
    label,
    allNodes,
    allEdges,
    allLabels,
    nodePos,
    edgeWeight,
    routeCost,
    pulse,
    floatCard,
    layersRef: () => layers,
    floatRootRef: () => floatRoot,
    VIEW,
  };
})();
