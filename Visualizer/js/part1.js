/* ============================================================
   part1.js — Phần 1: thử tất cả → cắt nhánh (6 scene).
   Đồ thị lớn 11 đỉnh A→B; cho khán giả CẢM được khối lượng việc.
   ============================================================ */
window.DJ = window.DJ || {};

(function () {
  const data = DJ.data;
  const stage = () => DJ.stage;

  /* ---------- Liệt kê toàn bộ tuyến đơn A→B (theo thứ tự DFS cố định) ---------- */
  function enumerateRoutes() {
    const adj = {};
    for (const [a, b, w] of data.graphProfiles.part1.edges) {
      (adj[a] = adj[a] || []).push([b, w]);
      (adj[b] = adj[b] || []).push([a, w]);
    }
    for (const k of Object.keys(adj)) adj[k].sort((x, y) => (x[0] < y[0] ? -1 : 1));
    const routes = [];
    const seen = new Set(["A"]);
    (function dfs(nodeName, path, cost) {
      if (nodeName === "B") {
        routes.push({ path: [...path], cost });
        return;
      }
      for (const [next, w] of adj[nodeName]) {
        if (seen.has(next)) continue;
        seen.add(next);
        path.push(next);
        dfs(next, path, cost + w);
        path.pop();
        seen.delete(next);
      }
    })("A", ["A"], 0);
    return routes;
  }

  const routes = enumerateRoutes();
  const ROUTES = routes.length;
  const BENCH = 36; // A-D-K-B = 9 + 20 + 7
  DJ.runtime.routesTotal = ROUTES;
  DJ.runtime.benchmarkCost = BENCH;
  DJ.part1Routes = routes;

  const bruteSegments = routes.reduce((s, r) => s + r.path.length - 1, 0);

  /* Mô phỏng cắt nhánh: bắt đầu với mốc 36, dừng tuyến khi chi phí vượt mốc */
  function simulatePrune() {
    let best = BENCH;
    let segments = 0;
    const cellStates = []; // "pruned" | "done" | "best"
    for (const r of routes) {
      let acc = 0;
      let walked = 0;
      let pruned = false;
      for (let i = 0; i < r.path.length - 1; i++) {
        acc += stage().edgeWeight(r.path[i], r.path[i + 1]);
        walked++;
        if (acc >= best && i < r.path.length - 2) {
          pruned = true;
          break;
        }
      }
      segments += walked;
      if (!pruned && acc < best) {
        best = acc;
        cellStates.push("best");
      } else {
        cellStates.push(pruned ? "pruned" : "done");
      }
    }
    return { segments, best, cellStates };
  }

  /* ---------- Card lưới khối lượng ---------- */
  function workCard({ title, total, compare }) {
    const card = document.createElement("div");
    card.className = "work-card";
    card.innerHTML =
      `<div class="work-head"><h3></h3><strong class="work-status">0/${total}</strong></div>` +
      `<div class="work-grid"></div>` +
      (compare
        ? `<div class="compare-rows">
             <div class="compare-row"><span>Thử tất cả</span><div class="bar"><i class="bar-brute"></i></div><strong class="num-brute">0</strong></div>
             <div class="compare-row is-better"><span>Cắt nhánh</span><div class="bar"><i class="bar-pruned"></i></div><strong class="num-pruned">0</strong></div>
           </div>`
        : "");
    card.querySelector("h3").textContent = title;
    const grid = card.querySelector(".work-grid");
    const cells = [];
    for (let i = 0; i < total; i++) {
      const cell = document.createElement("i");
      cell.className = "work-cell";
      grid.appendChild(cell);
      cells.push(cell);
    }
    stage().floatRootRef().appendChild(card);
    gsap.from(card, { opacity: 0, y: -10, duration: DJ.dur(0.3), delay: DJ.dur(0.12) });
    return { card, cells, status: card.querySelector(".work-status") };
  }

  /* Pill tổng chi phí ở cuối tuyến */
  function costPill(nodeName, text, cls, dx = 30, dy = -34) {
    const p = stage().nodePos(nodeName);
    const pill = DJ.p2api.svgPill(p.x + dx, p.y + dy, text, cls);
    stage().layersRef().routes.appendChild(pill);
    gsap.from(pill, { opacity: 0, duration: DJ.dur(0.3) });
    return pill;
  }

  /* ============================================================
     SCENE 0 — "Bài toán": A→B, vài tuyến ví dụ, mỗi tuyến một giá
     ============================================================ */
  DJ.registerScene("part1", 0, ({ setMetric, fresh }) => {
    const st = stage();
    DJ.fx.ensureGraph(st, fresh);
    st.cameraSnap({ center: { x: 500, y: 330 }, scale: 0.94 });

    const demos = [
      { path: ["A", "D", "K", "B"], cls: "is-walk", pill: ["36", ""] },
      { path: ["A", "C", "F", "I", "B"], cls: "is-walk", pill: ["29", ""] },
      { path: data.finalBestPath, cls: "is-good", pill: ["16", "is-settled"] },
    ];
    const tl = gsap.timeline({ delay: DJ.dur(fresh ? 0.9 : 0.25) });
    demos.forEach((d, i) => {
      tl.call(() => {
        st.drawRoute(d.path, d.cls, { duration: 0.75 });
        gsap.delayedCall(DJ.dur(0.8), () => costPill("B", d.pill[0], d.pill[1], 36, -30 + i * 30));
      }, [], i * 0.95);
    });
    tl.call(() => {
      setMetric(0, "3 tuyến");
      setMetric(1, "36 · 29 · 16", "amber");
      setMetric(2, "tuyến rẻ nhất", "accent");
    }, [], "+=1.0");

    setMetric(0, "đang vẽ…");
    setMetric(1, "–");
    setMetric(2, "?", "accent");
  });

  /* ============================================================
     SCENE 1 — "Thử tất cả": máy nghiền từng tuyến một
     ============================================================ */
  DJ.registerScene("part1", 1, ({ setMetric, fresh }) => {
    const st = stage();
    DJ.fx.ensureGraph(st, fresh);
    st.cameraSnap({ center: { x: 500, y: 330 }, scale: 0.94 });

    const { cells, status } = workCard({ title: "Các tuyến phải xét", total: ROUTES });
    /* Pha chậm đi đúng 8 tuyến ĐẦU của phép liệt kê — bộ đếm phải khớp
       với con số bruteSegments mà scene 2/6 nhắc lại */
    const slowRoutes = routes.slice(0, 8);
    let segs = 0;
    let best = Infinity;
    let bestIdx = -1;
    let walkEl = null;

    const tl = gsap.timeline({ delay: DJ.dur(fresh ? 0.9 : 0.25) });

    /* Pha 1: đi từng tuyến, vẽ thật trên bản đồ */
    slowRoutes.forEach((r, i) => {
      tl.call(() => {
        if (walkEl) walkEl.remove();
        cells[i].classList.add("is-current");
        walkEl = st.drawRoute(r.path, "is-walk", { duration: 0.5 });
        segs += r.path.length - 1;
        setMetric(0, `${i + 1}/${ROUTES}`);
        setMetric(1, String(segs), "amber");
        status.textContent = `${i + 1}/${ROUTES}`;
      }, [], i * 0.62);
      tl.call(() => {
        cells[i].classList.remove("is-current");
        if (r.cost < best) {
          best = r.cost;
          if (bestIdx >= 0) {
            cells[bestIdx].classList.remove("is-best");
            cells[bestIdx].classList.add("is-done");
          }
          bestIdx = i;
          cells[i].classList.add("is-best");
          setMetric(2, String(best), "moss");
        } else {
          cells[i].classList.add("is-done");
        }
      }, [], i * 0.62 + 0.52);
    });

    /* Pha 2: tăng tốc — mỗi nhịp một mẻ, bản đồ nhấp nháy tuyến đang xét
       để thấy "máy đang nghiền" chứ không chỉ cái lưới chạy số */
    const startFast = slowRoutes.length * 0.62 + 0.35;
    const BATCH = 8;
    let tick = 0;
    for (let i = slowRoutes.length; i < ROUTES; i += BATCH, tick++) {
      const from = i;
      tl.call(() => {
        const to = Math.min(from + BATCH, ROUTES);
        for (let k = from; k < to; k++) {
          const r = routes[k];
          segs += r.path.length - 1;
          if (r.cost < best) {
            best = r.cost;
            if (bestIdx >= 0) {
              cells[bestIdx].classList.remove("is-best");
              cells[bestIdx].classList.add("is-done");
            }
            bestIdx = k;
            cells[k].classList.add("is-best");
            setMetric(2, String(best), "moss");
          } else {
            cells[k].classList.add("is-done");
          }
        }
        if (walkEl) walkEl.remove();
        walkEl = st.drawRoute(routes[to - 1].path, "is-walk", { instant: true });
        walkEl.style.opacity = "0.4";
        setMetric(0, `${to}/${ROUTES}`);
        setMetric(1, String(segs), "amber");
        status.textContent = `${to}/${ROUTES}`;
      }, [], startFast + tick * 0.06);
    }
    tl.call(() => {
      if (walkEl) {
        walkEl.remove();
        walkEl = null;
      }
      st.drawRoute(data.finalBestPath, "is-good", { duration: 0.8 });
      costPill("B", "16", "is-settled");
      setMetric(0, `${ROUTES}/${ROUTES}`);
      setMetric(2, "16", "moss");
    }, [], "+=0.35");

    setMetric(0, `0/${ROUTES}`);
    setMetric(1, "0");
    setMetric(2, "–");
  });

  /* ============================================================
     SCENE 2 — "Vì sao chậm": đám mây 56 tuyến
     ============================================================ */
  DJ.registerScene("part1", 2, ({ setMetric, fresh }) => {
    const st = stage();
    DJ.fx.ensureGraph(st, fresh);
    st.cameraSnap({ center: { x: 500, y: 330 }, scale: 0.94 });
    st.setAlpha(st.allLabels(), 0.3, { duration: 0.5, delay: fresh ? 1.0 : 0.3 });

    const tl = gsap.timeline({ delay: DJ.dur(fresh ? 1.0 : 0.3) });
    /* Vẽ 1/3 số tuyến là đủ thành "mạng nhện" — đỡ nặng DOM */
    const cloud = routes.filter((r, i) => i % 3 === 0);
    cloud.forEach((r, i) => {
      tl.call(() => {
        const p = st.drawRoute(r.path, "is-soft", { duration: 0.4 });
        p.style.opacity = "0.35";
      }, [], i * 0.02);
    });

    /* Hai tuyến chỉ khác nhau vài đoạn cuối — bị thử lại từ đầu */
    tl.call(() => {
      st.drawRoute(["A", "E", "F", "I", "B"], "is-walk", { duration: 0.7 });
      st.drawRoute(["A", "E", "F", "J", "B"], "is-walk", { duration: 0.7, delay: 0.4 });
    }, [], "+=0.35");
    tl.call(() => {
      setMetric(0, String(ROUTES), "accent");
      setMetric(1, `${bruteSegments} đoạn`, "accent");
      setMetric(2, "16", "moss");
    }, [], "+=0.25");

    setMetric(0, "đang đếm…");
    setMetric(1, "–");
    setMetric(2, "16", "moss");
  });

  /* ============================================================
     SCENE 3 — "Cắt nhánh": tệ hơn mốc thì dừng ngay
     ============================================================ */
  DJ.registerScene("part1", 3, ({ setMetric, fresh }) => {
    const st = stage();
    DJ.fx.ensureGraph(st, fresh);
    st.cameraSnap({ center: { x: 470, y: 380 }, scale: 1.04 });

    const card = document.createElement("div");
    card.className = "lens-card";
    card.innerHTML = `
      <div class="lens-head"><h3>Một tuyến đang thử</h3><span class="lens-decision">Tiếp tục</span></div>
      <div class="lens-equation">
        <div class="is-walk-cost"><span>Chi phí đang đi</span><strong class="lens-walk">0</strong></div>
        <em class="lens-op">&le;</em>
        <div class="is-bench"><span>Mốc hiện tại</span><strong>36</strong></div>
      </div>
      <p class="lens-note">Chưa vượt mốc — tuyến này vẫn đáng đi tiếp.</p>`;
    st.floatRootRef().appendChild(card);
    gsap.from(card, { opacity: 0, y: -10, duration: DJ.dur(0.3), delay: DJ.dur(0.15) });
    const walkNum = card.querySelector(".lens-walk");
    const decision = card.querySelector(".lens-decision");
    const note = card.querySelector(".lens-note");
    const op = card.querySelector(".lens-op");

    const tl = gsap.timeline({ delay: DJ.dur(fresh ? 0.9 : 0.25) });
    tl.call(() => {
      st.drawRoute(data.benchmarkPath, "is-good", { duration: 0.75 });
      costPill("B", "36", "is-settled");
      setMetric(0, "mốc A-D-K-B", "moss");
    });

    /* Đi thử A-C-D-K, đến lúc cộng K→B thì vượt mốc */
    const walk = ["A", "C", "D", "K"];
    let acc = 0;
    walk.slice(1).forEach((n, i) => {
      tl.call(() => {
        const a = walk[i];
        acc += st.edgeWeight(a, n);
        st.drawRoute([a, n], "is-walk", { duration: 0.5 });
        walkNum.textContent = String(acc);
        setMetric(1, `${acc} so với 36`, "amber");
      }, [], 1.0 + i * 0.7);
    });
    tl.call(() => {
      const cut = st.drawRoute(["K", "B"], "is-cut", { duration: 0.45 });
      cut.classList.add("is-counter");
      costPill("K", "33 + 7 = 40", "is-best", 8, -44);
      walkNum.textContent = "40";
      op.innerHTML = "&gt;";
      decision.textContent = "Dừng ngay";
      decision.classList.add("is-stop");
      note.textContent = "40 > 36 — không cần đi nốt. Cả nhánh sau K bị cắt.";
      setMetric(1, "40 > 36", "accent");
      setMetric(2, "36", "moss");
    }, [], "+=0.55");

    setMetric(0, "đang dựng mốc…");
    setMetric(1, "–");
    setMetric(2, "36", "moss");
  });

  /* ============================================================
     SCENE 4 — "Áp dụng": quét toàn bộ tuyến với quy tắc cắt
     ============================================================ */
  DJ.registerScene("part1", 4, ({ setMetric, fresh }) => {
    const st = stage();
    DJ.fx.ensureGraph(st, fresh);
    st.cameraSnap({ center: { x: 500, y: 330 }, scale: 0.94 });

    const { cells, status, card } = workCard({ title: "Cắt nhánh trên cả khối", total: ROUTES, compare: true });
    const barBrute = card.querySelector(".bar-brute");
    const barPruned = card.querySelector(".bar-pruned");
    const numBrute = card.querySelector(".num-brute");
    const numPruned = card.querySelector(".num-pruned");

    let best = BENCH;
    let segs = 0;
    let bruteAcc = 0;
    let bestIdx = -1;
    let bestRouteEl = null;
    let bestPillEl = null;

    const tl = gsap.timeline({ delay: DJ.dur(fresh ? 0.8 : 0.25) });
    tl.call(() => {
      bestRouteEl = st.drawRoute(data.benchmarkPath, "is-good", { duration: 0.7 });
      bestPillEl = costPill("B", "36", "is-settled");
      setMetric(2, "36", "moss");
    });

    function processRoute(i) {
      const r = routes[i];
      let acc = 0;
      let walked = 0;
      let pruned = false;
      for (let j = 0; j < r.path.length - 1; j++) {
        acc += st.edgeWeight(r.path[j], r.path[j + 1]);
        walked++;
        if (acc >= best && j < r.path.length - 2) {
          pruned = true;
          break;
        }
      }
      segs += walked;
      bruteAcc += r.path.length - 1;
      if (!pruned && acc < best) {
        best = acc;
        if (bestIdx >= 0) {
          cells[bestIdx].classList.remove("is-best");
          cells[bestIdx].classList.add("is-done");
        }
        bestIdx = i;
        cells[i].classList.add("is-best");
        if (bestRouteEl) bestRouteEl.remove();
        if (bestPillEl) bestPillEl.remove();
        bestRouteEl = st.drawRoute(r.path, "is-good", { duration: 0.5 });
        bestPillEl = costPill("B", String(best), "is-settled");
        setMetric(2, String(best), "moss");
      } else {
        cells[i].classList.add(pruned ? "is-pruned" : "is-done");
      }
    }

    function refreshCounters(done) {
      status.textContent = `${done}/${ROUTES}`;
      setMetric(0, `${done}/${ROUTES}`);
      setMetric(1, String(segs), "amber");
      barBrute.style.width = `${(bruteAcc / bruteSegments) * 100}%`;
      barPruned.style.width = `${(segs / bruteSegments) * 100}%`;
      numBrute.textContent = `${bruteAcc}`;
      numPruned.textContent = `${segs}`;
    }

    /* 12 tuyến đầu đi chậm để thấy từng quyết định cắt, sau đó chạy mẻ */
    const SLOW = 12;
    for (let i = 0; i < SLOW; i++) {
      tl.call(() => {
        processRoute(i);
        refreshCounters(i + 1);
      }, [], 0.9 + i * 0.22);
    }
    const startFast = 0.9 + SLOW * 0.22 + 0.25;
    const BATCH = 7;
    let tick = 0;
    for (let i = SLOW; i < ROUTES; i += BATCH, tick++) {
      const from = i;
      tl.call(() => {
        const to = Math.min(from + BATCH, ROUTES);
        for (let k = from; k < to; k++) processRoute(k);
        refreshCounters(to);
      }, [], startFast + tick * 0.06);
    }

    setMetric(0, `0/${ROUTES}`);
    setMetric(1, "0");
    setMetric(2, "36", "moss");
  });

  /* ============================================================
     SCENE 5 — "Kết luận": nhanh hơn, vẫn chậm
     ============================================================ */
  DJ.registerScene("part1", 5, ({ setMetric, fresh }) => {
    const st = stage();
    const sim = simulatePrune();
    DJ.fx.ensureGraph(st, fresh);
    st.cameraSnap({ center: { x: 500, y: 360 }, scale: 0.9 });
    st.setAlpha(st.allLabels(), 0.25, { duration: 0.4, delay: 0.3 });

    const tl = gsap.timeline({ delay: DJ.dur(fresh ? 0.7 : 0.2) });
    const cloud = routes.filter((r, i) => i % 3 === 0);
    cloud.forEach((r, i) => {
      tl.call(() => {
        const p = st.drawRoute(r.path, "is-soft", { instant: true });
        p.style.opacity = "0.15";
      }, [], i * 0.01);
    });
    tl.call(() => {
      st.drawRoute(data.finalBestPath, "is-lit", { duration: 0.9 });
      costPill("B", "16", "is-best");
    }, [], "+=0.25");

    const row = document.createElement("div");
    row.className = "verdict-row";
    row.innerHTML = `
      <div class="verdict-col"><span>Thử tất cả</span><strong>${bruteSegments} đoạn</strong><p>Đi đến cuối mọi tuyến rồi mới so sánh.</p></div>
      <div class="verdict-col is-better"><span>Cắt nhánh</span><strong>${sim.segments} đoạn</strong><p>Dừng sớm khi vượt mốc tốt nhất.</p></div>
      <div class="verdict-col is-next"><span>Điểm còn thiếu</span><strong>?</strong><p>Vẫn là thử đường. Cần một cách nghĩ khác.</p></div>`;
    st.floatRootRef().appendChild(row);
    gsap.from(row.children, { opacity: 0, y: -14, duration: DJ.dur(0.4), stagger: DJ.dur(0.14), delay: DJ.dur(0.8), ease: "power2.out" });

    setMetric(0, `${bruteSegments} → ${sim.segments}`, "moss");
    setMetric(1, `vẫn ${ROUTES} tuyến`, "accent");
    setMetric(2, "16", "moss");
  });
})();
