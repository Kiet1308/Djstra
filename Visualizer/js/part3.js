/* ============================================================
   part3.js — Phần 3: từ ý tưởng thành mã giả (12 scene).
   Hình chạy trước, code xuất hiện sau: code card bên trái,
   bộ nhớ Cost/Visited/Prev bên phải, đồ thị sync ở giữa.
   ============================================================ */
window.DJ = window.DJ || {};

(function () {
  const SVG_NS = "http://www.w3.org/2000/svg";
  const stage = () => DJ.stage;
  const p2 = () => DJ.p2api;
  const ORDER = ["A", "C", "B", "D", "E", "F", "G", "K"];

  /* Camera nhường chỗ cho code card bên trái */
  const codeCam = { center: { x: 296, y: 398 }, scale: 0.84 };

  /* ---------- Toàn bộ trạng thái mã giả (port nguyên văn) ---------- */
  const CODE = {
    frame: {
      lines: ["function NganNhat(map, start, end) {", "}"],
      inserted: [1, 2],
      active: [1, 2],
    },
    cost: {
      lines: ["function NganNhat(map, start, end) {", "  Cost = []", "  Cost[start] = 0", "}"],
      inserted: [2, 3],
      active: [2, 3],
    },
    loop: {
      lines: [
        "function NganNhat(map, start, end) {",
        "  Cost = []",
        "  Cost[start] = 0",
        "  while (true) {",
        "    if (chốt hết?) break",
        "    if (tìm được đích?) break",
        "  }",
        "}",
      ],
      inserted: [4, 5, 6, 7],
      active: [4, 5, 6],
    },
    min: {
      lines: [
        "function NganNhat(map, start, end) {",
        "  Cost = []",
        "  Cost[start] = 0",
        "  while (true) {",
        "    min = null",
        "    for (dinh in map) {",
        "      if (Cost[dinh] != null) {",
        "        if (min == null || Cost[dinh] < Cost[min]) {",
        "          min = dinh",
        "        }",
        "      }",
        "    }",
        "    if (chốt hết?) break",
        "    if (tìm được đích?) break",
        "  }",
        "}",
      ],
      inserted: [5, 6, 7, 8, 9, 10, 11, 12],
      active: [5, 6, 7, 8, 9],
    },
    visited: {
      lines: [
        "function NganNhat(map, start, end) {",
        "  Cost = []",
        "  Visited = []",
        "  Cost[start] = 0",
        "  while (true) {",
        "    min = null",
        "    for (dinh in map) {",
        "      if (Cost[dinh] != null && !Visited[dinh]) {",
        "        if (min == null || Cost[dinh] < Cost[min]) {",
        "          min = dinh",
        "        }",
        "      }",
        "    }",
        "    if (chốt hết?) break",
        "    if (tìm được đích?) break",
        "  }",
        "}",
      ],
      inserted: [3],
      changed: [8],
      active: [3, 8],
    },
    empty: null, // dựng từ visited bên dưới
    end: null,
    settle: null,
    relaxNaive: null,
    relaxGuard: null,
    prev: null,
  };

  /* Các bước sau chỉ sửa/chèn vài dòng trên cùng một khung */
  CODE.empty = {
    lines: CODE.visited.lines.map((l) => (l.includes("chốt hết?") ? "    if (min == null) break" : l)),
    changed: [14],
    active: [14],
  };
  CODE.end = {
    lines: CODE.empty.lines.map((l) => (l.includes("tìm được đích?") ? "    if (min == end) break" : l)),
    changed: [15],
    active: [15],
  };
  CODE.settle = {
    lines: [...CODE.end.lines.slice(0, 15), "    Visited[min] = true", ...CODE.end.lines.slice(15)],
    inserted: [16],
    active: [16],
  };
  CODE.relaxNaive = {
    lines: [
      ...CODE.settle.lines.slice(0, 16),
      "    for (canh of map[min]) {",
      "      ke = canh.to",
      "      newCost = Cost[min] + canh.cost",
      "      Cost[ke] = newCost",
      "    }",
      ...CODE.settle.lines.slice(16),
    ],
    inserted: [17, 18, 19, 20, 21],
    active: [17, 19, 20],
  };
  CODE.relaxGuard = {
    lines: [
      ...CODE.relaxNaive.lines.slice(0, 19),
      "      if (Cost[ke] == null || newCost < Cost[ke]) {",
      "        Cost[ke] = newCost",
      "      }",
      ...CODE.relaxNaive.lines.slice(20),
    ],
    inserted: [20, 22],
    changed: [21],
    active: [20, 21, 22],
  };
  CODE.prev = {
    lines: (() => {
      const base = CODE.relaxGuard.lines;
      const out = [...base.slice(0, 3), "  Prev = []", ...base.slice(3)];
      const i = out.findIndex((l) => l.includes("Cost[ke] = newCost"));
      out.splice(i + 1, 0, "        Prev[ke] = min");
      const j = out.lastIndexOf("}");
      out.splice(j, 0, "  return { cost: Cost[end], prev: Prev }");
      return out;
    })(),
    inserted: [4, 23, 27],
    active: [4, 23, 27],
  };
  CODE.replay = { lines: CODE.prev.lines, active: [] };

  /* ---------- Card mã giả ----------
     fresh=false (Next trong cùng phần): card đứng yên tại chỗ như thể
     vẫn là một tấm bảng — chỉ những dòng mới chèn/sửa được nhá sáng. */
  function codeCard(stateKey, { status = "nháp", note = "", fresh = true } = {}) {
    const state = CODE[stateKey];
    const card = document.createElement("div");
    card.className = "code-card";
    card.innerHTML = `
      <div class="code-head"><h3>Mã giả — xây từng dòng</h3><span></span></div>
      <div class="code-body"></div>
      ${note ? `<p class="code-note"></p>` : ""}`;
    card.querySelector(".code-head span").textContent = status;
    if (note) card.querySelector(".code-note").innerHTML = note;
    const body = card.querySelector(".code-body");
    const inserted = new Set(state.inserted || []);
    const changed = new Set(state.changed || []);
    const active = new Set(state.active || []);
    const lineEls = [];
    state.lines.forEach((text, i) => {
      const ln = i + 1;
      const div = document.createElement("div");
      div.className = "code-line";
      if (inserted.has(ln)) div.classList.add("is-inserted");
      if (changed.has(ln)) div.classList.add("is-changed");
      if (active.has(ln)) div.classList.add("is-active");
      if (text.includes("?)")) div.classList.add("is-todo");
      div.innerHTML = `<span class="ln"></span><span class="tx"></span>`;
      div.querySelector(".ln").textContent = ln;
      div.querySelector(".tx").textContent = text;
      body.appendChild(div);
      lineEls.push(div);
    });
    stage().floatRootRef().appendChild(card);
    if (fresh) {
      gsap.from(card, { opacity: 0, x: -16, duration: DJ.dur(0.4), delay: DJ.dur(0.1), ease: "power2.out" });
    }
    const freshLines = lineEls.filter((el, i) => inserted.has(i + 1) || changed.has(i + 1));
    if (freshLines.length) {
      gsap.from(freshLines, { opacity: 0, duration: DJ.dur(0.35), stagger: DJ.dur(0.08), delay: DJ.dur(fresh ? 0.5 : 0.15) });
    }
    return { el: card, lines: lineEls, setActive(lns) {
      lineEls.forEach((el, i) => el.classList.toggle("is-active", lns.includes(i + 1)));
    } };
  }

  /* ---------- Card bộ nhớ ---------- */
  function memCard(rails, fresh = true) {
    const card = document.createElement("div");
    card.className = "mem-card";
    const header = document.createElement("div");
    header.className = "mem-rail is-header";
    header.innerHTML = `<span></span>` + ORDER.map((n) => `<i>${n}</i>`).join("");
    card.appendChild(header);
    const chipMap = {};
    for (const rail of rails) {
      const row = document.createElement("div");
      row.className = "mem-rail";
      row.dataset.rail = rail;
      const label = document.createElement("span");
      label.textContent = rail === "cost" ? "Cost" : rail === "visited" ? "Visited" : "Prev";
      row.appendChild(label);
      chipMap[rail] = {};
      for (const n of ORDER) {
        const chip = document.createElement("i");
        chip.className = "mem-chip";
        chip.textContent = "·";
        row.appendChild(chip);
        chipMap[rail][n] = chip;
      }
      card.appendChild(row);
    }
    stage().floatRootRef().appendChild(card);
    if (fresh) gsap.from(card, { opacity: 0, y: -10, duration: DJ.dur(0.35), delay: DJ.dur(0.15) });

    function set(rail, node, value, opts = {}) {
      const chip = chipMap[rail]?.[node];
      if (!chip) return;
      chip.textContent = value === null || value === undefined ? "·" : String(value);
      chip.classList.toggle("has-value", value !== null && value !== undefined && !opts.settled);
      chip.classList.toggle("is-settled", !!opts.settled);
      if (opts.flash) {
        chip.classList.remove("is-flash");
        void chip.offsetWidth;
        chip.classList.add("is-flash");
      }
    }
    function scan(rail, node) {
      for (const r of Object.values(chipMap)) for (const c of Object.values(r)) c.classList.remove("is-scan");
      if (node && chipMap[rail]?.[node]) chipMap[rail][node].classList.add("is-scan");
    }
    function fill(rail, values, settledSet = new Set()) {
      for (const n of ORDER) set(rail, n, values[n], { settled: settledSet.has(n) });
    }
    return { el: card, set, scan, fill };
  }

  /* Gói chi phí chạy dọc một cạnh */
  function packet(from, to, text, opts = {}) {
    const st = stage();
    const a = st.nodePos(from);
    const b = st.nodePos(to);
    const g = document.createElementNS(SVG_NS, "g");
    g.setAttribute("class", "cost-packet");
    const w = Math.max(30, String(text).length * 8 + 12);
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
    st.layersRef().routes.appendChild(g);
    const state = { p: 0 };
    g.setAttribute("transform", `translate(${a.x} ${a.y - 22})`);
    return gsap.to(state, {
      p: 1,
      duration: DJ.dur(opts.duration ?? 0.9),
      delay: DJ.dur(opts.delay ?? 0),
      ease: "power1.inOut",
      onUpdate() {
        const x = a.x + (b.x - a.x) * state.p;
        const y = a.y + (b.y - a.y) * state.p - 22;
        g.setAttribute("transform", `translate(${x} ${y})`);
      },
      onComplete() {
        if (opts.bounce) {
          gsap.to(g, { opacity: 0, duration: DJ.dur(0.45), delay: DJ.dur(0.25) });
          gsap.to(state, {
            p: 0.82,
            duration: DJ.dur(0.3),
            ease: "power1.out",
            onUpdate() {
              const x = a.x + (b.x - a.x) * state.p;
              const y = a.y + (b.y - a.y) * state.p - 22;
              g.setAttribute("transform", `translate(${x} ${y})`);
            },
          });
        } else {
          gsap.to(g, { opacity: 0, duration: DJ.dur(0.3), delay: DJ.dur(0.1) });
        }
        opts.onArrive?.();
      },
    });
  }

  /* Trạng thái đồ thị hay dùng */
  const START = { A: "settled", C: "open", B: "open", D: "open", E: "open" };
  const START_BADGES = { A: [0, "settled"], C: [2, "open"], B: [4, "open"], D: [7, "open"], E: [6, "open"] };
  const FROM_A = () => p2().EG.fromA;

  function graphStart(extra = {}) {
    p2().render({
      nodes: START,
      edges: FROM_A(),
      badges: START_BADGES,
      fade: 0.01,
      ...extra,
    });
  }

  /* ============================================================ */
  /* SCENE 0 — "Khung": đặt tên bài toán                           */
  DJ.registerScene("part3", 0, ({ setMetric, fresh }) => {
    const st = stage();
    p2().render({
      nodes: Object.fromEntries(ORDER.map((n) => [n, "unknown"])),
      contextEdges: DJ.data.graphProfiles.part2.edges.map(([a, b]) => [a, b]),
      fade: 0.01,
    });
    st.cameraSnap(codeCam);
    codeCard("frame", {
      status: "khung",
      note: "Nhận vào bản đồ, điểm đầu, điểm đích — trả lời: đi <strong>NganNhat</strong> hết bao nhiêu?",
    });
    setMetric(0, "khung hàm");
    setMetric(1, "chưa có", "amber");
    setMetric(2, "đặt tên bài toán");
  });

  /* SCENE 1 — "Cost": mảng đầu tiên                               */
  DJ.registerScene("part3", 1, ({ setMetric, fresh }) => {
    const st = stage();
    p2().render({
      nodes: { A: "settled", ...Object.fromEntries(ORDER.filter((n) => n !== "A").map((n) => [n, "unknown"])) },
      contextEdges: DJ.data.graphProfiles.part2.edges.map(([a, b]) => [a, b]),
      badges: { A: [0, "settled"] },
      fade: 0.01,
    });
    st.cameraSnap(codeCam);
    st.pulse("A", "var(--moss)");
    codeCard("cost", { fresh, status: "Cost", note: "Mỗi đỉnh một ô nhớ. Xuất phát ở A nên <strong>Cost[A] = 0</strong>, các ô khác còn trống." });
    const mem = memCard(["cost"], fresh);
    gsap.delayedCall(DJ.dur(1.0), () => mem.set("cost", "A", 0, { settled: true, flash: true }));
    setMetric(0, "Cost = []");
    setMetric(1, "Cost[A] = 0", "moss");
    setMetric(2, "7 ô còn trống");
  });

  /* SCENE 2 — "Lặp": while (true) + hai dòng dừng tạm             */
  DJ.registerScene("part3", 2, ({ setMetric, fresh }) => {
    const st = stage();
    p2().render({
      nodes: { A: "settled", ...Object.fromEntries(ORDER.filter((n) => n !== "A").map((n) => [n, "unknown"])) },
      contextEdges: DJ.data.graphProfiles.part2.edges.map(([a, b]) => [a, b]),
      badges: { A: [0, "settled"] },
      fade: 0.01,
    });
    st.cameraSnap(codeCam);
    codeCard("loop", {
      status: "while",
      note: "Hai điều kiện dừng <em>chưa biết viết</em> — ghi tạm bằng lời, lát nữa sửa dần thành code thật.",
    });
    const mem = memCard(["cost"], fresh);
    mem.set("cost", "A", 0, { settled: true });
    /* nhịp lặp: A thở theo vòng */
    gsap.to(st.node("A"), { scale: 1.06, transformOrigin: "center center", yoyo: true, repeat: 5, duration: DJ.dur(0.5), delay: DJ.dur(0.8), ease: "power1.inOut" });
    setMetric(0, "chọn → mở → lặp");
    setMetric(1, "while (true)", "amber");
    setMetric(2, "2 dòng tạm", "accent");
  });

  /* SCENE 3 — "Min": quét tìm nhỏ nhất, lộ vấn đề A thắng lại     */
  DJ.registerScene("part3", 3, ({ setMetric, fresh }) => {
    const st = stage();
    graphStart();
    st.cameraSnap(codeCam);
    codeCard("min", { fresh, status: "chọn min", note: "Quét từng ô Cost, giữ số nhỏ nhất. Nhưng nhìn kỹ: <strong>A = 0 luôn thắng</strong> — vòng sau lại chọn A!" });
    const mem = memCard(["cost"], fresh);
    mem.fill("cost", { A: 0, C: 2, B: 4, D: 7, E: 6 }, new Set(["A"]));

    const scanSeq = ["A", "C", "B", "D", "E"];
    const tl = gsap.timeline({ delay: DJ.dur(fresh ? 1.0 : 0.5) });
    scanSeq.forEach((n, i) => {
      tl.call(() => {
        mem.scan("cost", n);
        setMetric(0, `đỉnh ${n}`);
        setMetric(1, n === "A" ? "min = A (0)" : "min vẫn = A", "amber");
      }, [], i * 0.45);
    });
    tl.call(() => {
      mem.scan("cost", "A");
      st.pulse("A", "var(--accent)");
      setMetric(0, "quét xong");
      setMetric(1, "min = A", "accent");
      setMetric(2, "A bị chọn lại!", "accent");
    }, [], "+=0.4");

    setMetric(0, "bắt đầu quét");
    setMetric(1, "min = null");
    setMetric(2, "…");
  });

  /* SCENE 4 — "Visited": cổng chặn đỉnh đã chốt                   */
  DJ.registerScene("part3", 4, ({ setMetric, fresh }) => {
    const st = stage();
    graphStart();
    st.cameraSnap(codeCam);
    codeCard("visited", { fresh, status: "Visited", note: "Thêm cổng chặn: đã chốt thì <strong>không vào vòng chọn min</strong> nữa." });
    const mem = memCard(["cost", "visited"], fresh);
    mem.fill("cost", { A: 0, C: 2, B: 4, D: 7, E: 6 }, new Set(["A"]));
    mem.set("visited", "A", "T", { settled: true });

    const tl = gsap.timeline({ delay: DJ.dur(fresh ? 1.0 : 0.5) });
    tl.call(() => {
      mem.scan("visited", "A");
      setMetric(0, "A: Visited", "moss");
      setMetric(1, "bỏ qua A", "amber");
    });
    const scanSeq = ["C", "B", "D", "E"];
    scanSeq.forEach((n, i) => {
      tl.call(() => {
        mem.scan("cost", n);
        setMetric(1, `xét ${n} = ${{ C: 2, B: 4, D: 7, E: 6 }[n]}`, "amber");
      }, [], 0.7 + i * 0.45);
    });
    tl.call(() => {
      mem.scan("cost", "C");
      st.pulse("C", "var(--moss)");
      setMetric(0, "quét xong");
      setMetric(1, "min = C (2)", "moss");
      setMetric(2, "đúng đỉnh cần chốt", "moss");
    }, [], "+=0.4");

    setMetric(0, "A đã chốt");
    setMetric(1, "…");
    setMetric(2, "quét lại");
  });

  /* SCENE 5 — "Hết": min == null nghĩa là chốt hết                */
  DJ.registerScene("part3", 5, ({ setMetric, fresh }) => {
    const st = stage();
    const stateMap = {};
    const badges = {};
    for (const n of ORDER) {
      if (n === "K") continue;
      stateMap[n] = "settled";
    }
    const costVals = { A: 0, C: 2, B: 3, D: 5, E: 4, F: 6, G: 9 };
    for (const [n, v] of Object.entries(costVals)) badges[n] = [v, "settled"];
    p2().render({
      nodes: { ...stateMap, K: "unknown" },
      edges: DJ.data.graphProfiles.part2.edges.filter(([a, b]) => a !== "K" && b !== "K").map(([a, b]) => [a, b]),
      contextEdges: p2().EG.toK,
      badges,
      fade: 0.01,
    });
    st.cameraSnap(codeCam);
    codeCard("empty", { fresh, status: "sửa dòng tạm 1", note: "Cả lượt quét không ai lọt qua cổng → <strong>min vẫn null</strong> → đã chốt hết. Đây cũng là trường hợp đích không tới được." });
    const mem = memCard(["cost", "visited"], fresh);
    mem.fill("cost", costVals, new Set(Object.keys(costVals)));
    for (const n of Object.keys(costVals)) mem.set("visited", n, "T", { settled: true });

    const tl = gsap.timeline({ delay: DJ.dur(fresh ? 1.0 : 0.5) });
    ORDER.filter((n) => n !== "K").forEach((n, i) => {
      tl.call(() => {
        mem.scan("visited", n);
        setMetric(0, `${n}: đã chốt`, "moss");
      }, [], i * 0.4);
    });
    tl.call(() => {
      mem.scan("cost", null);
      setMetric(0, "quét xong");
      setMetric(1, "min = null", "accent");
      setMetric(2, "break", "accent");
    }, [], "+=0.3");

    setMetric(0, "giả sử chốt hết");
    setMetric(1, "…");
    setMetric(2, "khi nào dừng?");
  });

  /* SCENE 6 — "Đích": min == end                                  */
  DJ.registerScene("part3", 6, ({ setMetric, fresh }) => {
    const st = stage();
    const state = DJ.data.part2States.afterG;
    p2().render({
      nodes: Object.fromEntries(ORDER.map((n) => [n, state[n].state])),
      edges: DJ.data.graphProfiles.part2.edges.map(([a, b]) => [a, b]),
      goodEdges: p2().treeEdges(state),
      badges: p2().badgesFromState(state, ORDER),
      fade: 0.01,
    });
    st.cameraSnap(codeCam);
    codeCard("end", { fresh, status: "sửa dòng tạm 2", note: "min là đỉnh <em>sắp được chốt</em>. Nếu min chính là K — câu trả lời đã nằm trong <strong>Cost[K]</strong>." });
    const mem = memCard(["cost", "visited"], fresh);
    const costVals = { A: 0, C: 2, B: 3, D: 5, E: 4, F: 6, G: 9, K: 10 };
    mem.fill("cost", costVals, new Set(["A", "C", "B", "D", "E", "F", "G"]));
    for (const n of ["A", "C", "B", "D", "E", "F", "G"]) mem.set("visited", n, "T", { settled: true });

    const tl = gsap.timeline({ delay: DJ.dur(fresh ? 1.0 : 0.5) });
    tl.call(() => {
      mem.scan("cost", "K");
      setMetric(0, "min = K", "accent");
    });
    tl.call(() => {
      st.showBadge("K", 10, "is-best");
      st.pulse("K", "var(--accent)");
      st.drawRoute(DJ.data.part2FinalPath, "is-lit", { duration: 1.1 });
      setMetric(1, "K = end", "accent");
      setMetric(2, "break — xong!", "accent");
    }, [], "+=0.7");

    setMetric(0, "K đang mở: 10");
    setMetric(1, "…");
    setMetric(2, "?");
  });

  /* SCENE 7 — "Chốt": Visited[min] = true                         */
  DJ.registerScene("part3", 7, ({ setMetric, fresh }) => {
    const st = stage();
    graphStart();
    st.cameraSnap(codeCam);
    codeCard("settle", { fresh, status: "chốt min", note: "C rẻ nhất vùng mở → <strong>Cost[C] đã chắc</strong>, đưa C vào Visited rồi mới mở hàng xóm." });
    const mem = memCard(["cost", "visited"], fresh);
    mem.fill("cost", { A: 0, C: 2, B: 4, D: 7, E: 6 }, new Set(["A"]));
    mem.set("visited", "A", "T", { settled: true });

    const tl = gsap.timeline({ delay: DJ.dur(fresh ? 1.0 : 0.5) });
    tl.call(() => {
      mem.scan("cost", "C");
      setMetric(0, "min = C", "amber");
    });
    tl.call(() => {
      st.setNodeState("C", "settled");
      st.showBadge("C", 2, "is-settled");
      st.pulse("C", "var(--moss)");
      mem.set("visited", "C", "T", { settled: true, flash: true });
      mem.set("cost", "C", 2, { settled: true });
      setMetric(1, "Visited[C] = true", "moss");
      setMetric(2, "C không bị xét lại", "moss");
    }, [], "+=0.8");

    setMetric(0, "chọn min");
    setMetric(1, "…");
    setMetric(2, "…");
  });

  /* SCENE 8 — "Mở kề": gói chi phí từ C                           */
  DJ.registerScene("part3", 8, ({ setMetric, fresh }) => {
    const st = stage();
    p2().render({
      nodes: { A: "settled", C: "settled", B: "open", D: "open", E: "open" },
      edges: [...p2().EG.fromA, ...p2().EG.fromC],
      goodEdges: [["A", "C"]],
      badges: { A: [0, "settled"], C: [2, "settled"], B: [4, "open"], D: [7, "open"], E: [6, "open"] },
      fade: 0.01,
    });
    st.cameraSnap(codeCam);
    codeCard("relaxNaive", { fresh, status: "mở hàng xóm", note: "Mỗi cạnh từ C tạo một gói: <strong>newCost = Cost[C] + cạnh</strong>. Bản đầu tiên cứ gán thẳng." });
    const mem = memCard(["cost", "visited"], fresh);
    mem.fill("cost", { A: 0, C: 2, B: 4, D: 7, E: 6 }, new Set(["A", "C"]));
    mem.set("visited", "A", "T", { settled: true });
    mem.set("visited", "C", "T", { settled: true });

    const tl = gsap.timeline({ delay: DJ.dur(fresh ? 1.0 : 0.5) });
    tl.call(() => {
      setMetric(0, "min = C", "moss");
      packet("C", "B", "2+1=3", {
        onArrive: () => {
          mem.set("cost", "B", 3, { flash: true });
          st.showBadge("B", 3);
          setMetric(1, "Cost[B] = 3", "amber");
        },
      });
    });
    tl.call(() => {
      packet("C", "D", "2+3=5", {
        onArrive: () => {
          mem.set("cost", "D", 5, { flash: true });
          st.showBadge("D", 5);
          setMetric(2, "Cost[D] = 5", "amber");
        },
      });
    }, [], "+=1.2");

    setMetric(0, "…");
    setMetric(1, "…");
    setMetric(2, "…");
  });

  /* SCENE 9 — "Rẻ hơn": chỉ ghi khi nhỏ hơn                       */
  DJ.registerScene("part3", 9, ({ setMetric, fresh }) => {
    const st = stage();
    const state = DJ.data.part2States.afterD;
    p2().render({
      nodes: Object.fromEntries(ORDER.filter((n) => state[n].state !== "unknown").map((n) => [n, state[n].state])),
      edges: [...p2().EG.fromA, ...p2().EG.fromC, ...p2().EG.fromB, ...p2().EG.fromE, ...p2().EG.fromD],
      goodEdges: p2().treeEdges(state),
      badges: p2().badgesFromState(state, ORDER),
      fade: 0.01,
    });
    st.cameraSnap(codeCam);
    codeCard("relaxGuard", { fresh, status: "sửa lỗi ghi đè", note: "Ô trống → nhận số đầu tiên. Ô đã có số → chỉ ghi đè khi <strong>rẻ hơn</strong>." });
    const mem = memCard(["cost", "visited"], fresh);
    const costVals = { A: 0, C: 2, B: 3, D: 5, E: 4, F: 6, G: 9 };
    mem.fill("cost", costVals, new Set(["A", "C", "B", "D", "E"]));
    for (const n of ["A", "C", "B", "D", "E"]) mem.set("visited", n, "T", { settled: true });

    const tl = gsap.timeline({ delay: DJ.dur(fresh ? 1.0 : 0.5) });
    tl.call(() => {
      setMetric(0, "min = D (5)", "moss");
      packet("D", "F", "5+2=7", {
        bounce: true,
        onArrive: () => {
          mem.scan("cost", "F");
          setMetric(1, "ứng viên 7", "accent");
          setMetric(2, "giữ 6 — không ghi đè", "moss");
        },
      });
    });
    tl.call(() => {
      p2().formulaCard({
        kicker: "Cổng kiểm tra",
        lines: ["7 &lt; Cost[F] = 6 ? <em>sai</em> → bỏ gói"],
        note: "Cost[F] = 6 (qua E) vẫn là số tốt nhất đang giữ.",
        style: { left: "402px", top: "14px" },
      });
    }, [], "+=1.4");

    setMetric(0, "…");
    setMetric(1, "…");
    setMetric(2, "Cost[F] = 6", "moss");
  });

  /* SCENE 10 — "Prev": nhớ cửa vào tốt nhất                       */
  DJ.registerScene("part3", 10, ({ setMetric, fresh }) => {
    const st = stage();
    const state = DJ.data.part2States.final;
    p2().render({
      nodes: Object.fromEntries(ORDER.map((n) => [n, "settled"])),
      edges: DJ.data.graphProfiles.part2.edges.map(([a, b]) => [a, b]),
      goodEdges: p2().treeEdges(state),
      badges: p2().badgesFromState(state, ORDER),
      fade: 0.01,
    });
    st.cameraSnap(codeCam);
    codeCard("prev", { fresh, status: "lưu đường đi", note: "<strong>Prev[F] = E</strong>: muốn tới F theo đường tốt nhất thì bước cuối đi từ E sang. Mỗi lần Cost được nhận, Prev nhận cùng lúc." });
    const mem = memCard(["cost", "prev"], fresh);
    mem.fill("cost", { A: 0, C: 2, B: 3, D: 5, E: 4, F: 6, G: 9, K: 10 }, new Set(ORDER));
    const prevVals = { C: "A", B: "C", D: "C", E: "B", F: "E", G: "E", K: "F" };

    const tl = gsap.timeline({ delay: DJ.dur(fresh ? 1.0 : 0.5) });
    Object.entries(prevVals).forEach(([n, v], i) => {
      tl.call(() => mem.set("prev", n, v, { flash: true }), [], i * 0.3);
    });
    /* lần ngược từ K về A bằng Prev */
    tl.call(() => {
      st.drawRoute(["K", "F", "E", "B", "C", "A"], "is-lit", { duration: 1.6 });
      setMetric(0, "K ← F ← E ← B ← C ← A", "accent");
      setMetric(1, "Prev đầy đủ", "moss");
      setMetric(2, "dựng lại được đường", "accent");
    }, [], "+=0.5");

    setMetric(0, "…");
    setMetric(1, "đang điền Prev", "amber");
    setMetric(2, "…");
  });

  /* SCENE 11 — "Chạy lại": cả thuật toán tự chạy từ trống          */
  DJ.registerScene("part3", 11, ({ setMetric, fresh }) => {
    const st = stage();
    p2().render({
      nodes: { A: "open", ...Object.fromEntries(ORDER.filter((n) => n !== "A").map((n) => [n, "unknown"])) },
      contextEdges: DJ.data.graphProfiles.part2.edges.map(([a, b]) => [a, b]),
      badges: { A: [0, "open"] },
      fade: 0.01,
    });
    st.cameraSnap(codeCam);
    const code = codeCard("replay", { fresh, status: "chạy thật", note: "Tìm min → dừng hoặc chốt → mở kề và lưu Prev. Lặp." });
    const mem = memCard(["cost", "visited", "prev"], fresh);
    mem.set("cost", "A", 0);

    /* Kịch bản chạy: [đỉnh chốt, các cập nhật [kề, cost, prev, nhận?]] */
    const runs = [
      { settle: "A", relax: [["C", 2, "A", true], ["B", 4, "A", true], ["D", 7, "A", true], ["E", 6, "A", true]] },
      { settle: "C", relax: [["B", 3, "C", true], ["D", 5, "C", true]] },
      { settle: "B", relax: [["E", 4, "B", true]] },
      { settle: "E", relax: [["F", 6, "E", true], ["G", 9, "E", true]] },
      { settle: "D", relax: [["F", 7, "D", false], ["G", 12, "D", false]] },
      { settle: "F", relax: [["K", 10, "F", true]] },
      { settle: "G", relax: [["K", 11, "G", false]] },
    ];
    const seen = new Set(["A"]);
    const tl = gsap.timeline({ delay: DJ.dur(fresh ? 1.0 : 0.5) });
    let t = 0;
    runs.forEach((step) => {
      tl.call(() => {
        code.setActive([8, 9, 10]);
        mem.scan("cost", step.settle);
        setMetric(0, `min = ${step.settle}`, "amber");
      }, [], t);
      t += 0.46;
      tl.call(() => {
        code.setActive([17]);
        st.setNodeState(step.settle, "settled");
        const cost = { A: 0, C: 2, B: 3, E: 4, D: 5, F: 6, G: 9 }[step.settle];
        st.showBadge(step.settle, cost, "is-settled");
        mem.set("cost", step.settle, cost, { settled: true });
        mem.set("visited", step.settle, "T", { settled: true, flash: true });
        st.pulse(step.settle, "var(--moss)");
        setMetric(0, `chốt ${step.settle} = ${cost}`, "moss");
      }, [], t);
      t += 0.42;
      step.relax.forEach(([ke, cost, prev, accepted]) => {
        tl.call(() => {
          code.setActive(accepted ? [21, 22, 23] : [21]);
          if (!seen.has(ke)) {
            seen.add(ke);
            const g = st.node(ke);
            g.classList.remove("is-unknown");
            g.classList.add("is-open");
            st.setAlpha([g, st.edge(step.settle, ke), st.label(step.settle, ke)], 1, { duration: 0.25 });
          }
          if (accepted) {
            st.showBadge(ke, cost);
            mem.set("cost", ke, cost, { flash: true });
            mem.set("prev", ke, prev, { flash: true });
            setMetric(1, `Cost[${ke}] = ${cost}`, "amber");
            setMetric(2, `Prev[${ke}] = ${prev}`, "amber");
          } else {
            code.setActive([21]);
            setMetric(1, `${ke}: ${cost} bị từ chối`, "accent");
          }
        }, [], t);
        t += 0.36;
      });
      t += 0.2;
    });
    tl.call(() => {
      code.setActive([16]);
      mem.scan("cost", "K");
      st.showBadge("K", 10, "is-best");
      mem.set("cost", "K", 10, { flash: true });
      setMetric(0, "min = K = end", "accent");
    }, [], t + 0.3);
    tl.call(() => {
      code.setActive([27]);
      st.setNodeState("K", "settled");
      st.drawRoute(DJ.data.part2FinalPath, "is-lit", { duration: 1.3 });
      st.pulse("K", "var(--accent)");
      setMetric(1, "Cost[K] = 10", "accent");
      setMetric(2, "Prev dựng lại đường", "accent");
    }, [], t + 1.0);

    setMetric(0, "Cost[A] = 0");
    setMetric(1, "…");
    setMetric(2, "…");
  });
})();
