/* ============================================================
   part4.js — Phần 4: độ phức tạp và giới hạn (4 scene).
   Đếm việc từ chính code vừa viết → tối ưu min → cạnh âm → tên gọi.
   ============================================================ */
window.DJ = window.DJ || {};

(function () {
  const SVG_NS = "http://www.w3.org/2000/svg";
  const stage = () => DJ.stage;
  const p2 = () => DJ.p2api;
  const ORDER = ["A", "C", "B", "D", "E", "F", "G", "K"];

  /* ============================================================
     SCENE 0 — "Đếm bước": mỗi lần Tiếp = chạy một vòng FOR
     ============================================================ */
  DJ.registerScene("part4", 0, ({ setMetric }) => {
    const st = stage();
    const cam = { center: { x: 420, y: 400 }, scale: 0.92 };
    p2().render({
      nodes: { A: "open", ...Object.fromEntries(ORDER.filter((n) => n !== "A").map((n) => [n, "unknown"])) },
      contextEdges: DJ.data.graphProfiles.part2.edges.map(([a, b]) => [a, b]),
      badges: { A: [0, "open"] },
      fade: 0.01,
    });
    st.cameraSnap(cam);

    /* Thứ tự chốt + cạnh kề phải xét ở mỗi vòng */
    const adj = {};
    for (const [a, b] of DJ.data.graphProfiles.part2.edges) {
      (adj[a] = adj[a] || []).push(b);
      (adj[b] = adj[b] || []).push(a);
    }
    const settleOrder = ["A", "C", "B", "E", "D", "F", "G", "K"];
    const costOf = { A: 0, C: 2, B: 3, E: 4, D: 5, F: 6, G: 9, K: 10 };

    const card = document.createElement("div");
    card.className = "counter-card";
    card.innerHTML = `
      <div><strong class="c-round">0</strong><span>vòng lặp</span></div>
      <div class="is-for1"><strong class="c-scan">0</strong><span>đỉnh đã quét</span></div>
      <div class="is-for2"><strong class="c-edge">0</strong><span>cạnh đã xét</span></div>`;
    st.floatRootRef().appendChild(card);
    gsap.from(card, { opacity: 0, y: -10, duration: DJ.dur(0.3), delay: DJ.dur(0.12) });
    const cRound = card.querySelector(".c-round");
    const cScan = card.querySelector(".c-scan");
    const cEdge = card.querySelector(".c-edge");

    let round = 0;
    let scans = 0;
    let edgesSeen = 0;
    let running = false;
    const seen = new Set(["A"]);

    setMetric(0, "0 / 8");
    setMetric(1, "FOR 1: quét đỉnh", "amber");
    setMetric(2, "FOR 2: mở cạnh kề", "accent");

    function runRound() {
      if (round >= settleOrder.length) return false;
      if (running) return true; // vòng trước còn chạy — nuốt cú bấm, không chồng timeline
      running = true;
      const minNode = settleOrder[round];
      const isGoal = minNode === "K";
      round += 1;
      cRound.textContent = String(round);
      setMetric(0, `${round} / 8`);

      const tl = gsap.timeline();
      /* FOR 1: quét toàn bộ đỉnh để tìm min */
      ORDER.forEach((n, i) => {
        tl.call(() => {
          scans += 1;
          cScan.textContent = String(scans);
          st.pulse(n, "var(--amber)");
        }, [], i * 0.12);
      });

      if (isGoal) {
        /* min = K = đích → break, không chốt, không mở cạnh (đúng bài Phần 3) */
        tl.call(() => {
          st.showBadge("K", costOf.K, "is-best");
          st.pulse("K", "var(--accent)");
          setMetric(1, "min = K = đích", "accent");
          setMetric(2, "break — dừng vòng lặp", "accent");
        }, [], ORDER.length * 0.12 + 0.15);
      } else {
        /* chốt min */
        tl.call(() => {
          const g = st.node(minNode);
          g.classList.remove("is-unknown", "is-open");
          g.classList.add("is-settled");
          g.style.opacity = 1;
          st.showBadge(minNode, costOf[minNode], "is-settled");
          st.pulse(minNode, "var(--moss)");
          setMetric(1, `quét ${ORDER.length} đỉnh → min = ${minNode}`, "amber");
        }, [], ORDER.length * 0.12 + 0.15);
        /* FOR 2: mở các cạnh kề */
        adj[minNode].forEach((ke, i) => {
          tl.call(() => {
            edgesSeen += 1;
            cEdge.textContent = String(edgesSeen);
            const edge = st.edge(minNode, ke);
            const label = st.label(minNode, ke);
            st.setAlpha([edge, label], 1, { duration: 0.2 });
            if (!seen.has(ke)) {
              seen.add(ke);
              const g = st.node(ke);
              g.classList.remove("is-unknown");
              g.classList.add("is-open");
              st.setAlpha(g, 1, { duration: 0.2 });
            }
            gsap.fromTo(edge, { opacity: 0.4 }, { opacity: 1, duration: DJ.dur(0.25) });
            setMetric(2, `xét cạnh ${minNode}–${ke}`, "accent");
          }, [], ORDER.length * 0.12 + 0.4 + i * 0.22);
        });
      }

      if (round === settleOrder.length) {
        tl.call(() => {
          p2().formulaCard({
            kicker: "Đếm lại toàn bộ",
            lines: [
              `FOR 1: 8 vòng × 8 đỉnh = <em>${scans} lượt quét</em> ≈ V²`,
              `FOR 2: <em>${edgesSeen}</em> lượt xét cạnh ≈ 2E (mỗi cạnh nhìn từ 2 đầu)`,
              "V² + E, mà E ≤ V² → <em>O(V²)</em>",
            ],
            note: "Không học thuộc — con số tự hiện ra từ code.",
            style: { left: "26px", top: "16px" },
          });
          setMetric(0, "8 / 8", "moss");
          setMetric(1, `${scans} lượt quét`, "amber");
          setMetric(2, "O(V²)", "accent");
        }, [], "+=0.6");
      }
      tl.call(() => {
        running = false;
      }, [], "+=0.05");
      return true;
    }

    return { onNext: () => runRound() };
  });

  /* ============================================================
     SCENE 1 — "Tối ưu min": quét mảng vs hàng đợi ưu tiên
     ============================================================ */
  DJ.registerScene("part4", 1, ({ setMetric }) => {
    const st = stage();
    p2().render({ nodes: {}, fade: 0.01 });
    st.cameraSnap({ center: { x: 500, y: 320 }, scale: 1 });

    const row = document.createElement("div");
    row.className = "duel-row";
    row.innerHTML = `
      <div class="duel-card">
        <h3>Quét mảng</h3>
        <span class="duel-big">O(V²)</span>
        <div class="duel-chips"></div>
        <div class="duel-bar"><i></i></div>
        <p>Mỗi lần hỏi min phải nhìn lại <strong>toàn bộ</strong> danh sách đỉnh.</p>
      </div>
      <div class="duel-card is-better">
        <h3>Hàng đợi ưu tiên</h3>
        <span class="duel-big">O((V + E) log V)</span>
        <div class="duel-heap"></div>
        <div class="duel-bar"><i></i></div>
        <p>Min luôn <strong>nổi sẵn trên đầu</strong> — lấy ra chỉ tốn cỡ log V.</p>
      </div>`;
    st.floatRootRef().appendChild(row);
    gsap.from(row.children, { opacity: 0, y: 14, duration: DJ.dur(0.4), stagger: DJ.dur(0.14), delay: DJ.dur(0.2), ease: "power2.out" });

    const vals = [5, 9, 4, 7, 12, 6, 8, 10];
    const chipsWrap = row.querySelector(".duel-chips");
    const chips = vals.map((v) => {
      const c = document.createElement("i");
      c.className = "duel-chip";
      c.textContent = v;
      chipsWrap.appendChild(c);
      return c;
    });
    const heapWrap = row.querySelector(".duel-heap");
    [...vals].sort((a, b) => b - a).slice(3).forEach((v) => {
      const c = document.createElement("i");
      c.className = "duel-chip";
      c.textContent = v;
      heapWrap.appendChild(c);
    });
    const barArr = row.querySelector(".duel-card:not(.is-better) .duel-bar i");
    const barHeap = row.querySelector(".is-better .duel-bar i");

    /* vòng lặp minh hoạ: mảng quét 8 bước, heap nhặt 1 bước */
    const tl = gsap.timeline({ repeat: -1, repeatDelay: DJ.dur(1.1), delay: DJ.dur(1.2) });
    chips.forEach((c, i) => {
      tl.call(() => {
        chips.forEach((x) => x.classList.remove("is-scan", "is-min"));
        c.classList.add("is-scan");
        barArr.style.width = `${((i + 1) / 8) * 100}%`;
      }, [], i * 0.3);
    });
    tl.call(() => {
      chips.forEach((x) => x.classList.remove("is-scan"));
      chips[2].classList.add("is-min");
    }, [], 8 * 0.3);
    tl.call(() => {
      barHeap.style.width = "37%";
      const top = heapWrap.lastElementChild;
      if (top) gsap.fromTo(top, { scale: 1 }, { scale: 1.12, yoyo: true, repeat: 1, duration: DJ.dur(0.22) });
    }, [], 8 * 0.3 + 0.3);
    tl.call(() => {
      chips.forEach((x) => x.classList.remove("is-scan", "is-min"));
      barArr.style.width = "0%";
      barHeap.style.width = "0%";
    }, [], 8 * 0.3 + 1.0);

    setMetric(0, "V bước mỗi lần", "amber");
    setMetric(1, "log V mỗi lần", "moss");
    setMetric(2, "nghẽn ở chọn min");
  });

  /* ============================================================
     SCENE 2 — "Cạnh âm": lời hứa bị phá (A→B 2, A→C 5, C→B −4)
     ============================================================ */
  DJ.registerScene("part4", 2, ({ setMetric }) => {
    const st = stage();
    p2().render({ nodes: {}, fade: 0.01 });
    st.cameraSnap({ center: { x: 500, y: 320 }, scale: 1 });

    const layer = st.layersRef().annotations;
    const P = { A: { x: 310, y: 300 }, B: { x: 680, y: 175 }, C: { x: 680, y: 435 } };

    function negEdge(from, to, label, cls = "") {
      const a = P[from];
      const b = P[to];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const len = Math.hypot(dx, dy);
      const ux = dx / len;
      const uy = dy / len;
      const sx = a.x + ux * 36;
      const sy = a.y + uy * 36;
      const ex = b.x - ux * 42;
      const ey = b.y - uy * 42;
      const g = document.createElementNS(SVG_NS, "g");
      g.setAttribute("class", `neg-edge ${cls}`.trim());
      const path = document.createElementNS(SVG_NS, "path");
      path.setAttribute("d", `M ${sx} ${sy} L ${ex} ${ey}`);
      path.setAttribute("class", "edge");
      /* mũi tên */
      const head = document.createElementNS(SVG_NS, "path");
      const hx = ex;
      const hy = ey;
      const wing = 9;
      const px = -uy;
      const py = ux;
      head.setAttribute("d", `M ${hx} ${hy} L ${hx - ux * wing + px * 6} ${hy - uy * wing + py * 6} L ${hx - ux * wing - px * 6} ${hy - uy * wing - py * 6} Z`);
      head.setAttribute("class", "neg-arrow");
      const pill = DJ.p2api.svgPill((sx + ex) / 2 + px * 20, (sy + ey) / 2 + py * 20, label, cls.includes("is-neg") ? "is-best" : "");
      g.appendChild(path);
      g.appendChild(head);
      g.appendChild(pill);
      layer.appendChild(g);
      return g;
    }

    function negNode(name) {
      const p = P[name];
      const g = document.createElementNS(SVG_NS, "g");
      g.setAttribute("class", "node");
      g.setAttribute("transform", `translate(${p.x} ${p.y})`);
      g.innerHTML = `<circle class="node-halo" r="33"></circle><circle class="node-ring" r="27"></circle><text class="node-name"></text>`;
      g.querySelector("text").textContent = name;
      layer.appendChild(g);
      return g;
    }

    const eAB = negEdge("A", "B", "+2");
    const eAC = negEdge("A", "C", "+5");
    const eCB = negEdge("C", "B", "−4", "is-neg");
    eCB.querySelector(".edge").classList.add("is-counter");
    const nodes = { A: negNode("A"), B: negNode("B"), C: negNode("C") };
    const badges = {};
    function setBadge(n, text, cls) {
      badges[n]?.remove();
      const p = P[n];
      badges[n] = DJ.p2api.svgPill(p.x + 30, p.y - 36, text, cls);
      layer.appendChild(badges[n]);
    }

    gsap.from(layer.children, { opacity: 0, duration: DJ.dur(0.5), stagger: DJ.dur(0.07), delay: DJ.dur(0.3) });

    const verdict = document.createElement("div");
    verdict.className = "neg-verdict";
    verdict.innerHTML = `
      <h3>Lời hứa của thuật toán</h3>
      <div class="neg-pair">
        <div class="is-held"><span>Thuật toán giữ Cost[B]</span><strong class="v-held">?</strong></div>
        <div class="is-truth"><span>Đường đúng (A→C→B)</span><strong class="v-truth">?</strong></div>
      </div>
      <p class="v-note">Đỉnh đã chốt là nhỏ nhất thì không bị mở lại nữa — luật ta vừa xây.</p>`;
    st.floatRootRef().appendChild(verdict);
    gsap.from(verdict, { opacity: 0, y: -10, duration: DJ.dur(0.3), delay: DJ.dur(0.2) });
    const vHeld = verdict.querySelector(".v-held");
    const vTruth = verdict.querySelector(".v-truth");
    const vNote = verdict.querySelector(".v-note");

    const steps = [
      () => {
        nodes.A.classList.add("is-settled");
        setBadge("A", "0", "is-settled");
        setBadge("B", "2");
        setBadge("C", "5");
        setMetric(0, "mở từ A", "moss");
        setMetric(1, "B = 2, C = 5", "amber");
        setMetric(2, "?");
      },
      () => {
        nodes.B.classList.add("is-settled");
        setBadge("B", "2", "is-settled");
        vHeld.textContent = "2";
        setMetric(0, "min = B (2) → CHỐT", "moss");
        setMetric(1, "Cost[B] = 2 — đã hứa", "moss");
        vNote.textContent = "B bị chốt sớm với 2 — trước khi nhìn thấy cạnh âm.";
      },
      () => {
        nodes.C.classList.add("is-settled");
        setBadge("C", "5", "is-settled");
        const flash = eCB.querySelector(".edge");
        gsap.fromTo(flash, { opacity: 0.4 }, { opacity: 1, duration: DJ.dur(0.4), yoyo: true, repeat: 3 });
        /* giữ lời hứa "2" trên đầu B, thêm sự thật "1?" bên dưới để lộ mâu thuẫn */
        const truthPill = DJ.p2api.svgPill(P.B.x - 6, P.B.y + 48, "đúng ra: 1", "is-best");
        layer.appendChild(truthPill);
        gsap.from(truthPill, { opacity: 0, duration: DJ.dur(0.4), delay: DJ.dur(0.5) });
        vTruth.textContent = "1";
        vNote.textContent = "5 + (−4) = 1 < 2. Nhưng B đã chốt — thuật toán không quay lại nữa. Kết quả SAI.";
        setMetric(0, "chốt C (5)", "moss");
        setMetric(1, "C→B: 5 − 4 = 1", "accent");
        setMetric(2, "lời hứa bị phá!", "accent");
      },
    ];
    let idx = 0;

    setMetric(0, "Cost[A] = 0");
    setMetric(1, "bấm Tiếp từng bước", "amber");
    setMetric(2, "?");

    return {
      onNext() {
        if (idx < steps.length) {
          steps[idx]();
          idx += 1;
          return true;
        }
        return false;
      },
    };
  });

  /* ============================================================
     SCENE 3 — "Tên gọi": Đó chính là Dijkstra
     ============================================================ */
  DJ.registerScene("part4", 3, ({ setMetric }) => {
    const st = stage();
    const final = DJ.data.part2States.final;
    p2().render({
      nodes: Object.fromEntries(ORDER.map((n) => [n, "settled"])),
      edges: DJ.data.graphProfiles.part2.edges.map(([a, b]) => [a, b]),
      goodEdges: p2().treeEdges(final),
      fade: 0.01,
    });
    st.cameraSnap({ center: { x: 500, y: 380 }, scale: 0.96 });
    /* dim PHẢI chạy sau các tween fade của render() (dù fade 0.01 vẫn async) */
    st.setAlpha([...st.allNodes(), ...st.allEdges(), ...st.allLabels()], 0.1, { duration: 0.4, delay: 0.2 });
    st.drawRoute(DJ.data.part2FinalPath, "is-lit", { duration: 1.2, delay: 0.3 }).style.opacity = "0.3";

    const fin = document.createElement("div");
    fin.className = "finale";
    const name = "Dijkstra";
    fin.innerHTML = `
      <p class="finale-lead">Thuật toán ta vừa tự xây bằng suy luận, thế giới gọi nó là…</p>
      <h2 class="finale-name">${[...name].map((ch, i) => `<span${i === 0 ? ' class="is-accent"' : ""}>${ch}</span>`).join("")}</h2>
      <p class="finale-sub">Edsger W. Dijkstra nghĩ ra nó năm 1956, trong khoảng 20 phút bên một tách cà phê, không cần giấy nháp.
      Nhưng như ta vừa thấy: chỉ cần đặt đúng câu hỏi, bất kỳ ai cũng có thể tự suy luận ra nó. Bạn vừa làm điều đó.</p>
      <div class="finale-facts">
        <div><span>Bản vừa xây</span><strong>O(V²)</strong></div>
        <div><span>Bản tối ưu</span><strong>O((V + E) log V)</strong></div>
        <div><span>Điều kiện</span><strong>Không cạnh âm</strong></div>
      </div>`;
    st.floatRootRef().appendChild(fin);

    gsap.from(fin.querySelector(".finale-lead"), { opacity: 0, y: 14, duration: DJ.dur(0.6), delay: DJ.dur(0.3) });
    gsap.from(fin.querySelectorAll(".finale-name span"), {
      opacity: 0,
      y: 34,
      duration: DJ.dur(0.6),
      stagger: DJ.dur(0.09),
      delay: DJ.dur(0.9),
      ease: "back.out(1.6)",
    });
    gsap.from(fin.querySelector(".finale-sub"), { opacity: 0, duration: DJ.dur(0.7), delay: DJ.dur(1.9) });
    gsap.from(fin.querySelectorAll(".finale-facts > div"), {
      opacity: 0,
      y: 16,
      duration: DJ.dur(0.5),
      stagger: DJ.dur(0.16),
      delay: DJ.dur(2.3),
      ease: "power2.out",
    });

    setMetric(0, "Dijkstra · 1956", "accent");
    setMetric(1, "không cạnh âm");
    setMetric(2, "O((V+E) log V)", "moss");
  });
})();
