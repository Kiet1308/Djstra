/* ============================================================
   part2.js — Phần 2: tư duy ngược (12 scene).
   Trái tim bài nói: không góc nhìn thượng đế — chỉ hiện phần đã biết.
   Quiz: bấm đỉnh sai → vẽ phản ví dụ rẻ hơn để bác bỏ.
   ============================================================ */
window.DJ = window.DJ || {};

(function () {
  const SVG_NS = "http://www.w3.org/2000/svg";
  const stage = () => DJ.stage;
  const states = () => DJ.data.part2States;

  /* Vị trí nhãn cost trên cạnh */
  DJ.partGraphOpts = DJ.partGraphOpts || {};
  const labelPlacements = {
    "A:C": { t: 0.58, n: 14 },
    "A:B": { t: 0.42, n: 14 },
    "A:D": { t: 0.55, n: 16 },
    "A:E": { t: 0.63, n: 14 },
    "C:B": { t: 0.38, n: 14 },
    "C:D": { t: 0.52, n: 16 },
    "B:E": { t: 0.58, n: 13 },
    "E:F": { t: 0.5, n: 14 },
    "E:G": { t: 0.54, n: 16 },
    "D:F": { t: 0.48, n: 16 },
    "D:G": { t: 0.56, n: 14 },
    "F:K": { t: 0.52, n: 14 },
    "G:K": { t: 0.52, n: 14 },
  };
  /* Badge cost né các cạnh đi qua quanh từng đỉnh */
  const badgeOffsets = {
    A: { x: -28, y: -30 },
    B: { x: -30, y: 28 },
    D: { x: -4, y: 40 },
    E: { x: -8, y: -38 },
    G: { x: 4, y: 40 },
  };
  DJ.partGraphOpts.part2 = { labelPlacements, badgeOffsets };
  DJ.partGraphOpts.part3 = { labelPlacements, badgeOffsets };
  DJ.partGraphOpts.part4 = { labelPlacements, badgeOffsets };

  const cams = {
    aTight: { center: { x: 150, y: 350 }, scale: 1.9 },
    frontier: { center: { x: 294, y: 348 }, scale: 1.36 },
    middle: { center: { x: 442, y: 388 }, scale: 1.12 },
    toK: { center: { x: 548, y: 386 }, scale: 1.02 },
    full: { center: { x: 500, y: 380 }, scale: 0.96 },
    kSide: { center: { x: 712, y: 372 }, scale: 1.32 },
    chain: { center: { x: 596, y: 390 }, scale: 1.1 },
  };

  const EG = {
    fromA: [["A", "C"], ["A", "B"], ["A", "D"], ["A", "E"]],
    fromC: [["C", "B"], ["C", "D"]],
    fromB: [["B", "E"]],
    fromE: [["E", "F"], ["E", "G"]],
    fromD: [["D", "F"], ["D", "G"]],
    toK: [["F", "K"], ["G", "K"]],
  };
  const ALL_NODES = DJ.data.part2NodeOrder;

  function edgeKey(a, b) {
    return a < b ? `${a}:${b}` : `${b}:${a}`;
  }

  /* ---------- render(spec): trạng thái hiển thị một phát ăn ngay ----------
     spec = {
       nodes: { A: "settled" | "open" | "unknown" | "plain" },
       contextNodes: ["F"],          // hiện mờ giữ ngữ cảnh
       edges: [["A","C"],…],         // nét đầy đủ
       goodEdges: [...],             // cây đường tốt (rêu)
       contextEdges: [...],          // mờ
       badges: { A: [0,"settled"], C: [2,"open"], F: ["?","open"] },
       litRoute: ["A","C"],          // đường accent
       fade: 0.35                    // thời gian fade chung
     } */
  function render(spec) {
    const st = stage();
    const fade = spec.fade ?? 0.35;
    const shown = new Set(Object.keys(spec.nodes || {}));
    const context = new Set(spec.contextNodes || []);

    if (!spec.keepRoutes) {
      st.layersRef().routes.innerHTML = "";
      ghostEls = [];
    }

    for (const name of ALL_NODES) {
      const g = st.node(name);
      g.classList.remove("is-unknown", "is-open", "is-settled", "is-wrong", "is-correct");
      if (shown.has(name)) {
        const state = spec.nodes[name];
        if (state && state !== "plain") g.classList.add(`is-${state}`);
        st.setAlpha(g, 1, { duration: fade });
      } else if (context.has(name)) {
        g.classList.add("is-unknown");
        st.setAlpha(g, 0.45, { duration: fade });
      } else {
        st.setAlpha(g, 0, { duration: fade });
      }
    }

    const full = new Set((spec.edges || []).map(([a, b]) => edgeKey(a, b)));
    const good = new Set((spec.goodEdges || []).map(([a, b]) => edgeKey(a, b)));
    const ctx = new Set((spec.contextEdges || []).map(([a, b]) => edgeKey(a, b)));
    for (const [a, b] of DJ.data.graphProfiles.part2.edges) {
      const k = edgeKey(a, b);
      const line = st.edge(a, b);
      const label = st.label(a, b);
      line.setAttribute("class", "edge" + (good.has(k) ? " is-good" : ""));
      if (full.has(k) || good.has(k)) {
        st.setAlpha([line, label], 1, { duration: fade });
        label.classList.remove("is-dim");
      } else if (ctx.has(k)) {
        st.setAlpha([line, label], 0.4, { duration: fade });
        label.classList.add("is-dim");
      } else {
        st.setAlpha([line, label], 0, { duration: fade });
      }
    }

    if (spec.badges) {
      for (const name of ALL_NODES) {
        const info = spec.badges[name];
        if (info) {
          const [value, tone] = Array.isArray(info) ? info : [info, "open"];
          st.showBadge(name, value, tone === "settled" ? "is-settled" : tone === "best" ? "is-best" : "");
        } else {
          st.hideBadge(name);
        }
      }
    } else {
      for (const name of ALL_NODES) st.hideBadge(name);
    }

    if (spec.litRoute) {
      // đường đã biết từ scene trước thì hiện ngay — không vẽ lại từ đầu
      st.drawRoute(spec.litRoute, "is-lit", spec.litInstant ? { instant: true } : { duration: spec.litDuration ?? 0.7, delay: spec.litDelay ?? 0.15 });
    }
  }

  /* Badge map từ part2States, lọc theo đỉnh đang hiện */
  function badgesFromState(state, names, opts = {}) {
    const out = {};
    for (const n of names) {
      const row = state[n];
      if (!row || row.cost === null || row.cost === undefined) continue;
      out[n] = [row.cost, row.state === "settled" ? "settled" : "open"];
    }
    if (opts.best) for (const n of opts.best) if (out[n]) out[n][1] = "best";
    return out;
  }

  /* Cây đường-tốt từ Prev của một state (chỉ các đỉnh đã chốt) */
  function treeEdges(state) {
    const out = [];
    for (const [n, row] of Object.entries(state)) {
      if (row.state === "settled" && row.prev && row.prev !== "-") out.push([row.prev, n]);
    }
    return out;
  }

  /* ---------- Phản ví dụ: đường vòng (offset) + cạnh giả định (arc) ---------- */
  function svgPill(x, y, text, cls = "") {
    const g = document.createElementNS(SVG_NS, "g");
    g.setAttribute("class", `cost-badge ${cls}`.trim());
    g.setAttribute("transform", `translate(${x} ${y})`);
    const w = Math.max(26, String(text).length * 8.5 + 14);
    const rect = document.createElementNS(SVG_NS, "rect");
    rect.setAttribute("x", -w / 2);
    rect.setAttribute("y", -12);
    rect.setAttribute("width", w);
    rect.setAttribute("height", 24);
    rect.setAttribute("rx", 7);
    const t = document.createElementNS(SVG_NS, "text");
    t.textContent = text;
    g.appendChild(rect);
    g.appendChild(t);
    return g;
  }

  let ghostEls = [];
  function clearGhost() {
    ghostEls.forEach((e) => e.remove());
    ghostEls = [];
  }

  /* Đường vòng dọc các cạnh thật, đẩy lệch để không đè nét gốc */
  function ghostRoute(path, costLabel, opts = {}) {
    clearGhost();
    const st = stage();
    const off = opts.offset ?? 20;
    const pts = path.map((n) => st.nodePos(n));
    const d = [];
    for (let i = 0; i < pts.length; i++) {
      let p = pts[i];
      if (i > 0 && i < pts.length - 1) {
        const prev = pts[i - 1];
        const next = pts[i + 1];
        const dx = next.x - prev.x;
        const dy = next.y - prev.y;
        const len = Math.hypot(dx, dy) || 1;
        p = { x: p.x + (-dy / len) * off, y: p.y + (dx / len) * off };
      }
      d.push(`${i === 0 ? "M" : "L"} ${p.x} ${p.y}`);
    }
    const el = document.createElementNS(SVG_NS, "path");
    el.setAttribute("d", d.join(" "));
    el.setAttribute("class", "edge is-counter");
    el.setAttribute("fill", "none");
    st.layersRef().routes.appendChild(el);
    const len = el.getTotalLength();
    el.style.strokeDasharray = "7 6";
    el.style.strokeDashoffset = `${len}`;
    gsap.to(el, { strokeDashoffset: 0, duration: DJ.dur(0.7), ease: "power1.inOut" });

    const mid = el.getPointAtLength(len * (opts.labelT ?? 0.5));
    const pill = svgPill(mid.x + (opts.labelDx ?? 0), mid.y - 18 + (opts.labelDy ?? 0), costLabel, "is-best");
    st.layersRef().routes.appendChild(pill);
    gsap.from(pill, { opacity: 0, duration: DJ.dur(0.3), delay: DJ.dur(0.35) });
    ghostEls = [el, pill];
  }

  /* Cạnh giả định chưa hề thấy: "biết đâu tồn tại…" */
  function virtualArc(from, to, bend, costLabel) {
    clearGhost();
    const st = stage();
    const a = st.nodePos(from);
    const b = st.nodePos(to);
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    const cx = mx + (-dy / len) * bend;
    const cy = my + (dx / len) * bend;
    const el = document.createElementNS(SVG_NS, "path");
    el.setAttribute("d", `M ${a.x} ${a.y} Q ${cx} ${cy} ${b.x} ${b.y}`);
    el.setAttribute("class", "edge is-counter");
    el.setAttribute("fill", "none");
    st.layersRef().routes.appendChild(el);
    const total = el.getTotalLength();
    el.style.strokeDasharray = "7 6";
    el.style.strokeDashoffset = `${total}`;
    gsap.to(el, { strokeDashoffset: 0, duration: DJ.dur(0.6), ease: "power1.inOut" });
    const apex = { x: 0.25 * a.x + 0.5 * cx + 0.25 * b.x, y: 0.25 * a.y + 0.5 * cy + 0.25 * b.y };
    const pill = svgPill(apex.x, apex.y, costLabel, "is-best");
    st.layersRef().routes.appendChild(pill);
    gsap.from(pill, { opacity: 0, duration: DJ.dur(0.3), delay: DJ.dur(0.3) });
    ghostEls = [el, pill];
  }

  /* Vòng "đích tạm" quanh một đỉnh */
  function tempGoalRing(name) {
    const st = stage();
    const p = st.nodePos(name);
    const ring = document.createElementNS(SVG_NS, "circle");
    ring.setAttribute("cx", p.x);
    ring.setAttribute("cy", p.y);
    ring.setAttribute("r", 31);
    ring.setAttribute("fill", "none");
    ring.setAttribute("stroke", "var(--accent)");
    ring.setAttribute("stroke-width", "2.5");
    ring.setAttribute("stroke-dasharray", "5 5");
    stage().layersRef().routes.appendChild(ring);
    // svgOrigin (toạ độ user-space), KHÔNG dùng transformOrigin px với SVG
    gsap.from(ring, { opacity: 0, scale: 0.7, svgOrigin: `${p.x} ${p.y}`, duration: DJ.dur(0.5), ease: "back.out(1.6)" });
    return ring;
  }

  /* ---------- Card công thức ---------- */
  function formulaCard({ kicker, lines, note, style }) {
    const card = document.createElement("div");
    card.className = "formula-card";
    card.innerHTML =
      `<p class="kicker"></p>` +
      lines.map(() => `<p class="formula-line"></p>`).join("") +
      (note ? `<p class="formula-note"></p>` : "");
    card.querySelector(".kicker").textContent = kicker;
    card.querySelectorAll(".formula-line").forEach((el, i) => (el.innerHTML = lines[i]));
    if (note) card.querySelector(".formula-note").textContent = note;
    Object.assign(card.style, style);
    stage().floatRootRef().appendChild(card);
    gsap.from(card, { opacity: 0, y: 10, duration: DJ.dur(0.3), delay: DJ.dur(0.15), ease: "power2.out" });
    return card;
  }

  /* ---------- Card quiz ---------- */
  function quizCard({ title, candidates, metas = {}, status = "" }) {
    const card = document.createElement("div");
    card.className = "quiz-card";
    card.innerHTML = `<p class="quiz-title"></p><div class="quiz-choices"></div><span class="quiz-status"></span>`;
    card.querySelector(".quiz-title").textContent = title;
    const statusEl = card.querySelector(".quiz-status");
    statusEl.textContent = status;
    const choices = card.querySelector(".quiz-choices");
    const chips = {};
    for (const node of candidates) {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "candidate-chip";
      chip.dataset.node = node;
      chip.innerHTML = `<strong></strong>${metas[node] ? "<span></span>" : ""}`;
      chip.querySelector("strong").textContent = node;
      if (metas[node]) chip.querySelector("span").textContent = metas[node];
      choices.appendChild(chip);
      chips[node] = chip;
    }
    stage().floatRootRef().appendChild(card);
    gsap.from(card, { opacity: 0, y: -10, duration: DJ.dur(0.3), delay: DJ.dur(0.12), ease: "power2.out" });
    return {
      el: card,
      chips,
      setStatus(text, tone) {
        statusEl.textContent = text;
        statusEl.classList.remove("is-wrong", "is-correct");
        if (tone) statusEl.classList.add(`is-${tone}`);
      },
    };
  }

  /* Quiz: chọn đỉnh — sai vẽ phản ví dụ, đúng chốt. "Tiếp" = chọn đáp án đúng. */
  function setupQuiz({ title, status, candidates, answer, metas, onWrong, onCorrect }) {
    const st = stage();
    let completed = false;
    const card = quizCard({ title, candidates, metas, status });

    function choose(node) {
      if (completed) return;
      if (node === answer) {
        completed = true;
        st.setClickable([]);
        Object.values(card.chips).forEach((c) => (c.disabled = true));
        card.chips[node].classList.add("is-correct");
        onCorrect(node, card);
        return;
      }
      card.chips[node].classList.add("is-wrong");
      const g = st.node(node);
      g.classList.remove("is-wrong");
      void g.getBoundingClientRect();
      g.classList.add("is-wrong");
      onWrong(node, card);
    }

    Object.entries(card.chips).forEach(([node, chip]) => chip.addEventListener("click", () => choose(node)));
    st.setClickable(candidates);
    st.setNodeClickHandler(choose);

    return {
      onNext() {
        if (completed) return false;
        choose(answer);
        return true;
      },
    };
  }

  /* ============================================================
     SCENE 0 — "Ngược": Nhìn từ K
     ============================================================ */
  DJ.registerScene("part2", 0, ({ setMetric }) => {
    const st = stage();
    render({
      nodes: { F: "unknown", G: "unknown", K: "plain" },
      edges: EG.toK,
      badges: { F: ["?", "open"], G: ["?", "open"] },
      fade: 0.01,
    });
    st.cameraSnap({ center: { x: 760, y: 372 }, scale: 1.05 });
    st.camera(cams.kSide, { duration: 0.9, delay: 0.1 });

    st.drawRoute(["F", "K"], "is-walk", { duration: 0.6, delay: 0.6 });
    st.drawRoute(["G", "K"], "is-walk", { duration: 0.6, delay: 0.78 });
    st.pulse("K", "var(--accent)");

    formulaCard({
      kicker: "Nhìn ngược từ đích",
      lines: ["Tốt tới K = tốt tới F <em>+ 4</em>", "hoặc&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;= tốt tới G <em>+ 2</em>"],
      note: "K chưa được giải; nó biến thành câu hỏi về F/G.",
      style: { left: "26px", top: "16px" },
    });

    setMetric(0, "F / G");
    setMetric(1, "+4 hoặc +2", "amber");
    setMetric(2, "K — chưa biết", "accent");
  });

  /* ============================================================
     SCENE 1 — "Nhỏ hơn": câu hỏi lan ngược K → F/G → D/E
     ============================================================ */
  DJ.registerScene("part2", 1, ({ setMetric }) => {
    const st = stage();
    render({
      nodes: { F: "unknown", G: "unknown", K: "plain" },
      edges: EG.toK,
      badges: { K: ["?", "best"] },
      fade: 0.01,
    });
    st.cameraSnap(cams.kSide);
    st.camera(cams.chain, { duration: 0.85, delay: 0.45 });

    const tl = gsap.timeline({ delay: DJ.dur(0.4) });
    tl.call(() => {
      st.showBadge("F", "?");
      st.showBadge("G", "?");
      st.pulse("F", "var(--amber)");
      st.pulse("G", "var(--amber)");
    });
    tl.call(() => {
      render({
        nodes: { F: "unknown", G: "unknown", K: "plain", D: "unknown", E: "unknown" },
        edges: EG.toK,
        contextEdges: [...EG.fromE, ...EG.fromD],
        badges: { K: ["?", "best"], F: ["?", "open"], G: ["?", "open"] },
        keepRoutes: true,
      });
    }, [], "+=0.7");
    tl.call(() => {
      /* câu hỏi chạy ngược: mũi tên hổ phách lan từ F/G về D/E */
      st.drawRoute(["F", "E"], "is-walk", { duration: 0.45 });
      st.drawRoute(["F", "D"], "is-walk", { duration: 0.45, delay: 0.12 });
      st.drawRoute(["G", "E"], "is-walk", { duration: 0.45, delay: 0.24 });
      st.drawRoute(["G", "D"], "is-walk", { duration: 0.45, delay: 0.36 });
    }, [], "+=0.4");
    tl.call(() => {
      st.showBadge("D", "?");
      st.showBadge("E", "?");
      st.pulse("D", "var(--amber)");
      st.pulse("E", "var(--amber)");
      setMetric(0, "F / G");
      setMetric(1, "D / E", "amber");
      setMetric(2, "kéo về phía A", "accent");
    }, [], "+=0.55");

    setMetric(0, "K hỏi F/G");
    setMetric(1, "…", "amber");
    setMetric(2, "đang lan ngược");
  });

  /* ============================================================
     SCENE 2/3/4 — trace: F là đích → E là đích → B là đích
     ============================================================ */
  const traceSteps = [
    {
      goal: "F",
      nodes: { D: "unknown", E: "unknown", F: "plain" },
      contextNodes: ["G", "K"],
      edges: [["D", "F"], ["E", "F"]],
      contextEdges: EG.toK,
      camera: { center: { x: 548, y: 374 }, scale: 1.3 },
      card: {
        kicker: "Đích tạm: F",
        lines: ["Tốt tới F = min(D <em>+ 2</em>, E <em>+ 2</em>)"],
        note: "F/G → K vẫn ở nền; ta chỉ đào sâu nhánh F.",
        style: { left: "26px", top: "16px" },
      },
      metrics: ["F", "D hoặc E", "lặp lại câu hỏi"],
    },
    {
      goal: "E",
      nodes: { A: "settled", B: "unknown", E: "plain" },
      contextNodes: ["D", "F", "K"],
      edges: [["A", "E"], ["B", "E"]],
      contextEdges: [["D", "F"], ["E", "F"], ["F", "K"]],
      badges: { A: [0, "settled"] },
      camera: { center: { x: 426, y: 366 }, scale: 1.32 },
      card: {
        kicker: "Đích tạm: E",
        lines: ["Tốt tới E = min(A <em>+ 6</em>, B <em>+ 1</em>)"],
        note: "A là gốc — đã biết chắc 0. B vẫn là một câu hỏi.",
        style: { left: "26px", top: "16px" },
      },
      metrics: ["E", "A hoặc B", "A đã biết = 0"],
    },
    {
      goal: "B",
      nodes: { A: "settled", C: "unknown", B: "plain" },
      /* bỏ K: ở camera zoom 1.4 K bị cắt nửa ở mép phải, nhìn như lỗi render */
      contextNodes: ["E", "F"],
      edges: [["A", "B"], ["C", "B"]],
      contextEdges: [["B", "E"], ["E", "F"]],
      badges: { A: [0, "settled"] },
      camera: { center: { x: 304, y: 348 }, scale: 1.4 },
      card: {
        kicker: "Đích tạm: B",
        lines: ["Tốt tới B = min(A <em>+ 4</em>, C <em>+ 1</em>)"],
        note: "Cứ truy như vậy, câu hỏi cuối cùng quay về A.",
        style: { left: "26px", top: "16px" },
      },
      metrics: ["B", "A hoặc C", "quay về A"],
    },
  ];

  traceSteps.forEach((step, i) => {
    DJ.registerScene("part2", 2 + i, ({ setMetric }) => {
      const st = stage();
      render({
        nodes: step.nodes,
        contextNodes: step.contextNodes,
        edges: step.edges,
        contextEdges: step.contextEdges,
        badges: step.badges,
        fade: 0.45,
      });
      const prevCam = i === 0 ? cams.chain : traceSteps[i - 1].camera;
      st.cameraSnap(prevCam);
      st.camera(step.camera, { duration: 0.8, delay: 0.1 });
      tempGoalRing(step.goal);
      step.edges.forEach(([a, b], j) => st.drawRoute([a, b], "is-walk", { duration: 0.5, delay: 0.5 + j * 0.15 }));
      formulaCard(step.card);
      step.metrics.forEach((m, j) => setMetric(j, m, j === 2 ? "accent" : undefined));
    });
  });

  /* ============================================================
     SCENE 5 — "Đổi bài": tìm đường ngắn nhất từ A tới TỪNG đỉnh
     ============================================================ */
  DJ.registerScene("part2", 5, ({ setMetric }) => {
    const st = stage();
    const nodes = {};
    const badges = { A: [0, "settled"] };
    for (const n of ALL_NODES) nodes[n] = n === "A" ? "settled" : "unknown";
    render({
      nodes,
      contextEdges: DJ.data.graphProfiles.part2.edges.map(([a, b]) => [a, b]),
      badges,
      fade: 0.5,
    });
    st.cameraSnap({ center: { x: 500, y: 380 }, scale: 0.9 });
    st.camera(cams.full, { duration: 0.8 });

    const tl = gsap.timeline({ delay: DJ.dur(0.5) });
    ALL_NODES.filter((n) => n !== "A").forEach((n, i) => {
      tl.call(() => st.showBadge(n, "?"), [], i * 0.08);
    });

    formulaCard({
      kicker: "Bài toán mới",
      lines: ["Mỗi đỉnh X: tốt tới X = ?"],
      note: "Đỉnh nào cũng có thể nằm trên đường tới K, nên đỉnh nào cũng cần câu trả lời. A = 0, còn lại chưa biết.",
      style: { left: "26px", top: "16px" },
    });

    setMetric(0, "tới K");
    setMetric(1, "tới mọi đỉnh", "amber");
    setMetric(2, "cùng một câu hỏi", "accent");
  });

  /* ============================================================
     SCENE 6 — "Mở cạnh": frontier từ A
     ============================================================ */
  DJ.registerScene("part2", 6, ({ setMetric }) => {
    const st = stage();
    render({ nodes: { A: "settled" }, badges: { A: [0, "settled"] }, fade: 0.01 });
    st.cameraSnap(cams.aTight);
    st.pulse("A", "var(--moss)");

    setMetric(0, "A = 0", "moss");
    setMetric(1, "chuẩn bị mở");
    setMetric(2, "phần xa ẩn");

    const reveals = [
      { n: "C", w: 2 },
      { n: "B", w: 4 },
      { n: "E", w: 6 },
      { n: "D", w: 7 },
    ];
    const tl = gsap.timeline({ delay: DJ.dur(0.35) });
    tl.add(st.camera(cams.frontier, { duration: 0.75 }));
    reveals.forEach((r, i) => {
      tl.call(() => {
        const g = st.node(r.n);
        g.classList.add("is-open");
        st.setAlpha([g, st.edge("A", r.n), st.label("A", r.n)], 1, { duration: 0.25 });
        gsap.fromTo(g, { scale: 0.8, transformOrigin: "center center" }, { scale: 1, duration: DJ.dur(0.32), ease: "back.out(1.5)" });
        st.drawRoute(["A", r.n], "is-walk", { duration: 0.35 });
      }, [], 0.45 + i * 0.3);
    });
    tl.call(() => {
      setMetric(0, "A = 0", "moss");
      setMetric(1, "C, B, E, D", "amber");
      setMetric(2, "F, G, K còn ẩn");
    }, [], "+=0.4");
  });

  /* ============================================================
     SCENE 7 — Quiz 1: "Chốt ai trước?" — đáp án C
     ============================================================ */
  DJ.registerScene("part2", 7, ({ setMetric }) => {
    const st = stage();
    const state = states().start;
    render({
      nodes: { A: "settled", C: "open", B: "open", D: "open", E: "open" },
      edges: EG.fromA,
      badges: { A: [0, "settled"] },
      fade: 0.01,
    });
    st.cameraSnap(cams.frontier);

    setMetric(0, "chọn một đỉnh");
    setMetric(1, "đang mở", "amber");
    setMetric(2, "chưa bật mí");

    /* Phản ví dụ phải đi theo cạnh CÓ THẬT trên đồ thị:
       E bị bác bằng A→C→B→E = 4 (bản cũ vẽ A→C→E qua cạnh không tồn tại) */
    const wrongInfo = {
      B: { path: ["A", "C", "B"], cost: "3", metric: "A → C → B = 3", labelT: 0.72 },
      D: { path: ["A", "C", "D"], cost: "5", metric: "A → C → D = 5", labelT: 0.68 },
      E: { path: ["A", "C", "B", "E"], cost: "4", metric: "A → C → B → E = 4", labelT: 0.55 },
    };

    return setupQuiz({
      title: "Thử chốt một đỉnh",
      status: "Bấm thẳng vào đỉnh trên hình cũng được",
      candidates: ["C", "B", "D", "E"],
      answer: "C",
      metas: { C: "cạnh A → C", B: "cạnh A → B", D: "cạnh A → D", E: "cạnh A → E" },
      onWrong: (node, card) => {
        const info = wrongInfo[node];
        ghostRoute(info.path, info.cost, { labelT: info.labelT });
        card.setStatus(`${node} chưa chắc — biết đâu có đường rẻ hơn: ${info.metric}`, "wrong");
        setMetric(0, node, "accent");
        setMetric(1, info.metric, "accent");
        setMetric(2, "C mở ra phản ví dụ");
      },
      onCorrect: (node, card) => {
        clearGhost();
        render({
          nodes: { A: "settled", C: "settled", B: "open", D: "open", E: "open" },
          edges: [...EG.fromA, ...EG.fromC],
          goodEdges: [["A", "C"]],
          badges: { A: [0, "settled"], C: [2, "settled"] },
          litRoute: ["A", "C"],
        });
        st.pulse("C", "var(--moss)");
        card.setStatus("Đúng! AC = 2 nhỏ nhất từ A — mọi đường vòng đều ≥ 4.", "correct");
        setMetric(0, "chốt C", "moss");
        setMetric(1, "đường vòng nào cũng ≥ 4");
        setMetric(2, "C chắc chắn", "moss");
      },
    });
  });

  /* ============================================================
     SCENE 8 — "Chốt C": mở cạnh từ C, quiz tiếp — đáp án B
     ============================================================ */
  DJ.registerScene("part2", 8, ({ setMetric }) => {
    const st = stage();
    render({
      nodes: { A: "settled", C: "settled", B: "open", D: "open", E: "open" },
      edges: [...EG.fromA, ...EG.fromC],
      goodEdges: [["A", "C"]],
      badges: { A: [0, "settled"], C: [2, "settled"] },
      litRoute: ["A", "C"],
      litInstant: true,
      fade: 0.01,
    });
    st.cameraSnap(cams.frontier);
    st.drawRoute(["C", "B"], "is-walk", { duration: 0.45, delay: 0.4 });
    st.drawRoute(["C", "D"], "is-walk", { duration: 0.45, delay: 0.55 });

    setMetric(0, "C đã chốt", "moss");
    setMetric(1, "đường mới qua C", "amber");
    setMetric(2, "hãy chọn tiếp");

    const wrongInfo = {
      D: { arc: ["B", "D", 58], cost: "3?", metric: "B = 3 còn rẻ hơn", status: "đợi B trước" },
      E: { arc: ["B", "E", -34], cost: "4?", metric: "qua B chỉ 3 + 1 = 4", status: "chưa chốt E được" },
    };

    return setupQuiz({
      title: "Bây giờ chốt ai?",
      status: "Cộng các cạnh trên hình để so",
      candidates: ["B", "D", "E"],
      answer: "B",
      metas: { B: "A → C → B", D: "A → C → D", E: "A → E" },
      onWrong: (node, card) => {
        const info = wrongInfo[node];
        virtualArc(info.arc[0], info.arc[1], info.arc[2], info.cost);
        card.setStatus(`${node} chưa chắc — ${info.metric}.`, "wrong");
        setMetric(0, `${node} chưa chắc`, "accent");
        setMetric(1, info.metric, "accent");
        setMetric(2, info.status);
      },
      onCorrect: (node, card) => {
        clearGhost();
        render({
          nodes: { A: "settled", C: "settled", B: "settled", D: "open", E: "open" },
          edges: [...EG.fromA, ...EG.fromC, ...EG.fromB],
          goodEdges: [["A", "C"], ["C", "B"]],
          badges: { A: [0, "settled"], C: [2, "settled"], B: [3, "settled"] },
          litRoute: ["A", "C", "B"],
        });
        st.pulse("B", "var(--moss)");
        card.setStatus("Đúng! A → C → B = 3 là nhỏ nhất trong vùng mở.", "correct");
        setMetric(0, "chốt B", "moss");
        setMetric(1, "đường mới qua B");
        setMetric(2, "tiếp theo: E", "amber");
      },
    });
  });

  /* ============================================================
     SCENE 9 — "Min": Hiện cost rồi chọn nhỏ nhất — đáp án E
     ============================================================ */
  DJ.registerScene("part2", 9, ({ setMetric }) => {
    const st = stage();
    const base = {
      nodes: { A: "settled", C: "settled", B: "settled", D: "open", E: "open" },
      edges: [...EG.fromA, ...EG.fromC, ...EG.fromB],
      goodEdges: [["A", "C"], ["C", "B"]],
      badges: { A: [0, "settled"], C: [2, "settled"], B: [3, "settled"] },
      litRoute: ["A", "C", "B"],
      litInstant: true,
      fade: 0.01,
    };
    render(base);
    st.cameraSnap(cams.frontier);

    setMetric(0, "D và E");
    setMetric(1, "cost đang ẩn");
    setMetric(2, "nhấn Hiện cost", "amber");

    let revealed = false;
    let quizHandle = null;

    const card = document.createElement("div");
    card.className = "quiz-card";
    card.innerHTML = `<p class="quiz-title">Đừng chọn bằng cảm giác</p><button class="action-button" type="button">Hiện cost</button>`;
    st.floatRootRef().appendChild(card);
    gsap.from(card, { opacity: 0, y: -10, duration: DJ.dur(0.3), delay: DJ.dur(0.12) });

    function reveal() {
      if (revealed) return;
      revealed = true;
      card.remove();
      st.showBadge("D", 5);
      st.showBadge("E", 4);
      st.pulse("D", "var(--amber)");
      st.pulse("E", "var(--amber)");
      setMetric(0, "D = 5, E = 4", "amber");
      setMetric(1, "E nhỏ nhất", "accent");
      setMetric(2, "chọn E");

      quizHandle = setupQuiz({
        title: "Đỉnh nào chốt được ngay?",
        status: "So hai con số vừa hiện",
        candidates: ["D", "E"],
        answer: "E",
        metas: { D: "cost 5", E: "cost 4" },
        onWrong: (node, qc) => {
          virtualArc("E", "D", -44, "4 + ?");
          qc.setStatus("D chưa chắc — biết đâu từ E (4) có đường sang D rẻ hơn 5.", "wrong");
          setMetric(0, "D chưa chắc", "accent");
          setMetric(1, "E = 4 nhỏ hơn", "accent");
          setMetric(2, "chọn E");
        },
        onCorrect: (node, qc) => {
          clearGhost();
          render({
            nodes: { A: "settled", C: "settled", B: "settled", D: "open", E: "settled", F: "open", G: "open" },
            edges: [...EG.fromA, ...EG.fromC, ...EG.fromB, ...EG.fromE],
            goodEdges: [["A", "C"], ["C", "B"], ["B", "E"]],
            badges: badgesFromState(states().afterE, ALL_NODES),
            litRoute: ["A", "C", "B", "E"],
          });
          st.pulse("E", "var(--moss)");
          st.camera(cams.middle, { duration: 0.8 });
          qc.setStatus("Đúng! E = 4 nhỏ nhất — mọi cạnh mới chỉ làm cost tăng thêm.", "correct");
          setMetric(0, "chốt E", "moss");
          setMetric(1, "F = 6, G = 9", "amber");
          setMetric(2, "tiếp tục");
        },
      });
    }

    card.querySelector(".action-button").addEventListener("click", reveal);

    return {
      onNext() {
        if (!revealed) {
          reveal();
          return true;
        }
        return quizHandle ? quizHandle.onNext() : false;
      },
    };
  });

  /* ============================================================
     SCENE 10 — "Tới K": 4 bước thủ công D → F → G → K
     ============================================================ */
  DJ.registerScene("part2", 10, ({ setMetric }) => {
    const st = stage();
    const baseGood = [["A", "C"], ["C", "B"], ["B", "E"]];
    const baseEdges = [...EG.fromA, ...EG.fromC, ...EG.fromB, ...EG.fromE];

    const steps = [
      {
        node: "D",
        sub: "D = 5",
        state: states().afterD,
        route: ["A", "C", "D"],
        edges: [...baseEdges, ...EG.fromD],
        good: [...baseGood, ["C", "D"]],
        metrics: ["chốt D", "D = 5", "F vẫn 6"],
        camera: cams.middle,
      },
      {
        node: "F",
        sub: "F = 6 mở K",
        state: states().afterF,
        route: ["A", "C", "B", "E", "F"],
        edges: [...baseEdges, ...EG.fromD, [["F", "K"]][0]],
        good: [...baseGood, ["C", "D"], ["E", "F"]],
        metrics: ["chốt F", "K = 10", "qua F"],
        camera: cams.toK,
      },
      {
        node: "G",
        sub: "qua G = 11",
        state: states().afterG,
        route: ["A", "C", "B", "E", "G"],
        edges: [...baseEdges, ...EG.fromD, ...EG.toK],
        good: [...baseGood, ["C", "D"], ["E", "F"], ["E", "G"]],
        metrics: ["chốt G", "qua G = 11", "K giữ 10"],
        camera: cams.toK,
      },
      {
        node: "K",
        sub: "K = 10 — đích!",
        state: states().final,
        route: DJ.data.part2FinalPath,
        edges: [...baseEdges, ...EG.fromD, ...EG.toK],
        good: [...baseGood, ["C", "D"], ["E", "F"], ["F", "K"]],
        metrics: ["chốt K", "cost = 10", "tới K"],
        camera: cams.full,
      },
    ];

    render({
      nodes: { A: "settled", C: "settled", B: "settled", D: "open", E: "settled", F: "open", G: "open" },
      edges: baseEdges,
      goodEdges: baseGood,
      badges: badgesFromState(states().afterE, ALL_NODES),
      litRoute: ["A", "C", "B", "E"],
      litInstant: true,
      fade: 0.01,
    });
    st.cameraSnap(cams.middle);
    setMetric(0, "sau E");
    setMetric(1, "D=5, F=6, G=9", "amber");
    setMetric(2, "bấm D hoặc Tiếp");

    const card = document.createElement("div");
    card.className = "quiz-card";
    card.innerHTML = `<p class="quiz-title">Lặp nhịp: chốt min, mở hàng xóm</p><div class="quiz-choices"></div><span class="quiz-status">Bấm từng đỉnh theo thứ tự min</span>`;
    const choices = card.querySelector(".quiz-choices");
    const statusEl = card.querySelector(".quiz-status");
    const chips = steps.map((step, idx) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "candidate-chip";
      chip.innerHTML = `<strong></strong><span></span>`;
      chip.querySelector("strong").textContent = step.node;
      chip.querySelector("span").textContent = step.sub;
      chip.addEventListener("click", () => applyStep(idx));
      choices.appendChild(chip);
      return chip;
    });
    st.floatRootRef().appendChild(card);
    gsap.from(card, { opacity: 0, y: -10, duration: DJ.dur(0.3), delay: DJ.dur(0.12) });

    let current = 0;

    function refresh() {
      chips.forEach((chip, idx) => {
        chip.disabled = idx !== current;
        chip.classList.toggle("is-correct", idx < current);
        chip.classList.toggle("is-next-step", idx === current);
      });
      const next = steps[current];
      st.setClickable(next ? [next.node] : []);
      if (next) {
        statusEl.textContent = `Đỉnh đang mở có cost nhỏ nhất: ${next.node}`;
      } else {
        statusEl.textContent = "Xong — K đã chắc chắn với cost 10.";
        statusEl.classList.add("is-correct");
      }
    }

    function applyStep(idx) {
      if (idx !== current) return;
      const step = steps[idx];
      current += 1;
      clearGhost();
      render({
        nodes: Object.fromEntries(
          ALL_NODES.filter((n) => step.state[n].state !== "unknown").map((n) => [n, step.state[n].state])
        ),
        edges: step.edges,
        goodEdges: step.good,
        badges: badgesFromState(step.state, ALL_NODES, idx === steps.length - 1 ? { best: ["K"] } : {}),
        litRoute: step.route,
        /* bước giữa: đường tới đỉnh vừa chốt hiện ngay; chỉ bước K cuối mới vẽ trọn cho đã */
        litInstant: idx !== steps.length - 1,
      });
      st.pulse(step.node, idx === steps.length - 1 ? "var(--accent)" : "var(--moss)");
      st.camera(step.camera, { duration: 0.7 });
      step.metrics.forEach((m, j) => setMetric(j, m, j === 0 ? "moss" : undefined));
      refresh();
    }

    st.setNodeClickHandler((node) => {
      const next = steps[current];
      if (next && node === next.node) applyStep(current);
    });
    refresh();

    return {
      onNext() {
        if (current < steps.length) {
          applyStep(current);
          return true;
        }
        return false;
      },
    };
  });

  /* ============================================================
     SCENE 11 — "Ý tưởng": toàn cảnh + đường cuối
     ============================================================ */
  DJ.registerScene("part2", 11, ({ setMetric }) => {
    const st = stage();
    const final = states().final;
    render({
      nodes: Object.fromEntries(ALL_NODES.map((n) => [n, "settled"])),
      edges: DJ.data.graphProfiles.part2.edges.map(([a, b]) => [a, b]),
      goodEdges: treeEdges(final),
      badges: badgesFromState(final, ALL_NODES, { best: ["K"] }),
      fade: 0.4,
    });
    st.cameraSnap({ center: { x: 500, y: 380 }, scale: 0.9 });
    st.camera(cams.full, { duration: 0.8 });
    st.drawRoute(DJ.data.part2FinalPath, "is-lit", { duration: 1.1, delay: 0.5 });

    formulaCard({
      kicker: "Nhịp vừa rút ra",
      lines: ["1. Chốt đỉnh mở có cost nhỏ nhất", "2. Mở hàng xóm của nó", "3. Giữ cost rẻ hơn, lặp lại"],
      note: "Chỉ bằng suy luận, ta đã có một thuật toán hoàn chỉnh.",
      style: { left: "26px", top: "16px" },
    });

    setMetric(0, "A→C→B→E→F→K", "accent");
    setMetric(1, "10", "accent");
    setMetric(2, "thành thuật toán");
  });

  /* API cho part3/part4 dùng lại */
  DJ.p2api = { render, cams, EG, badgesFromState, treeEdges, formulaCard, ALL_NODES, ghostRoute, virtualArc, clearGhost, svgPill };
})();
