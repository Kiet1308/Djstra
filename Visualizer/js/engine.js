/* ============================================================
   engine.js — điều phối phần/scene, deep link, phím tắt, chrome.
   Scene contract: DJ.registerScene(partId, idx, enter(ctx)).
   enter() có thể trả về { onNext, onPrev } để tự nuốt phím Tiếp/Lùi
   (dùng cho các scene step-through như Phần 4).
   ============================================================ */
window.DJ = window.DJ || {};

DJ.prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
DJ.dur = (v) => (DJ.prefersReducedMotion ? 0.01 : v);

DJ.engine = (function () {
  const els = {};
  let partIndex = 0;
  let sceneIndex = 0;
  let sceneHandle = null;
  let paused = false;
  let idleTimer = null;
  /* true đúng một lần cho scene đầu tiên sau khi đổi phần — scene dùng nó để
     quyết định có chạy màn chào sân (reveal đồ thị, card bay vào) hay không.
     Next trong cùng phần thì KHÔNG diễn lại màn chào, chỉ animate phần thay đổi. */
  let pendingFresh = true;

  const parts = () => DJ.data.parts;
  const part = () => parts()[partIndex];
  const scene = () => part().scenes[sceneIndex];

  /* Tuỳ chọn đồ thị theo phần (label placements…) — partN.js đăng ký */
  DJ.partGraphOpts = DJ.partGraphOpts || {};

  function $(id) {
    return document.getElementById(id);
  }

  function init() {
    Object.assign(els, {
      partNo: $("partNo"),
      sceneKicker: $("sceneKicker"),
      sceneTitle: $("sceneTitle"),
      partSwitcher: $("partSwitcher"),
      metrics: $("metrics"),
      caption: $("caption"),
      captionBody: $("captionBody"),
      notes: $("notes"),
      notesTitle: $("notesTitle"),
      notesList: $("notesList"),
      sceneDots: $("sceneDots"),
      prevBtn: $("prevBtn"),
      nextBtn: $("nextBtn"),
      replayBtn: $("replayBtn"),
      pauseBtn: $("pauseBtn"),
    });

    DJ.stage.init();
    buildPartSwitcher();
    bindControls();
    bindIdle();

    const params = new URLSearchParams(window.location.search);
    const p = parseInt(params.get("part"), 10);
    const s = parseInt(params.get("scene"), 10);

    if (p >= 1 && p <= parts().length) {
      loadPart(p - 1, Number.isFinite(s) ? Math.max(0, s - 1) : 0);
    } else if (DJ.intro) {
      DJ.intro.show(() => loadPart(0, 0));
    } else {
      loadPart(0, 0);
    }
  }

  /* ---------- Chrome ---------- */
  function buildPartSwitcher() {
    els.partSwitcher.innerHTML = "";
    parts().forEach((p, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = p.label;
      btn.title = p.title;
      btn.addEventListener("click", () => loadPart(i, 0));
      els.partSwitcher.appendChild(btn);
    });
  }

  function refreshPartSwitcher() {
    [...els.partSwitcher.children].forEach((b, i) => b.classList.toggle("is-active", i === partIndex));
  }

  function buildDots() {
    els.sceneDots.innerHTML = "";
    part().scenes.forEach((sc, i) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.title = sc.tab;
      dot.setAttribute("aria-label", `Cảnh ${i + 1}: ${sc.tab}`);
      dot.addEventListener("click", () => loadScene(i));
      els.sceneDots.appendChild(dot);
    });
  }

  function refreshDots() {
    [...els.sceneDots.children].forEach((d, i) => {
      d.classList.toggle("is-active", i === sceneIndex);
      d.classList.toggle("is-done", i < sceneIndex);
    });
  }

  /* ---------- Metrics ---------- */
  function renderMetrics(labels) {
    els.metrics.innerHTML = "";
    els.metrics.classList.toggle("is-empty", !labels || !labels.length);
    (labels || []).forEach((label) => {
      const chip = document.createElement("div");
      chip.className = "metric-chip";
      chip.innerHTML = `<span class="m-label"></span><span class="m-value">–</span>`;
      chip.querySelector(".m-label").textContent = DJ.fillText(label);
      els.metrics.appendChild(chip);
    });
  }

  function setMetric(i, value, tone) {
    const chip = els.metrics.children[i];
    if (!chip) return;
    chip.querySelector(".m-value").textContent = value;
    chip.classList.remove("is-accent", "is-moss", "is-amber");
    if (tone) chip.classList.add(`is-${tone}`);
  }

  /* ---------- Scene ---------- */
  function teardown() {
    sceneHandle = null;
    gsap.globalTimeline.clear(true);
    if (paused) togglePause(false);
    DJ.stage.clearAll();
  }

  function loadPart(i, sceneIdx = 0) {
    partIndex = Math.max(0, Math.min(parts().length - 1, i));
    teardown();
    DJ.stage.loadGraph(part().graph, DJ.partGraphOpts[part().id] || {});
    buildDots();
    refreshPartSwitcher();
    pendingFresh = true;
    loadScene(sceneIdx);
  }

  function loadScene(i) {
    teardown();
    sceneIndex = Math.max(0, Math.min(part().scenes.length - 1, i));
    const sc = scene();

    els.partNo.textContent = `${part().label} ·`;
    els.sceneKicker.textContent = DJ.fillText(sc.kicker);
    els.sceneTitle.textContent = DJ.fillText(sc.title);
    els.captionBody.textContent = DJ.fillText(sc.body);
    els.notesTitle.textContent = DJ.fillText(sc.audienceTitle);
    els.notesList.innerHTML = "";
    for (const b of sc.audienceBullets) {
      const li = document.createElement("li");
      li.textContent = DJ.fillText(b);
      els.notesList.appendChild(li);
    }
    renderMetrics(sc.metricLabels);
    refreshDots();
    updateUrl();

    /* Nhập cảnh: crossfade nhanh — KHÔNG diễn lại màn chào dài mỗi lần Next */
    const fresh = pendingFresh;
    pendingFresh = false;
    gsap.fromTo(els.sceneTitle, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: DJ.dur(0.3), ease: "power2.out" });
    gsap.fromTo(els.sceneKicker, { opacity: 0 }, { opacity: 1, duration: DJ.dur(0.22) });
    gsap.fromTo(els.caption, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: DJ.dur(0.3), delay: DJ.dur(0.04), ease: "power2.out" });
    gsap.fromTo(els.notes, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: DJ.dur(0.3), delay: DJ.dur(0.07), ease: "power2.out" });
    gsap.fromTo(
      els.notesList.children,
      { x: 8, opacity: 0 },
      { x: 0, opacity: 1, duration: DJ.dur(0.24), delay: DJ.dur(0.16), stagger: DJ.dur(0.05), ease: "power2.out" }
    );

    const enter = DJ.enters[`${part().id}:${sceneIndex}`];
    if (enter) {
      sceneHandle = enter({ stage: DJ.stage, setMetric, partId: part().id, sceneIndex, fresh }) || null;
    }
  }

  function updateUrl() {
    const url = new URL(window.location.href);
    url.searchParams.set("part", String(partIndex + 1));
    url.searchParams.set("scene", String(sceneIndex + 1));
    window.history.replaceState(null, "", url.toString());
  }

  /* ---------- Điều hướng ---------- */
  function handleNext() {
    if (sceneHandle?.onNext?.()) return;
    if (sceneIndex < part().scenes.length - 1) loadScene(sceneIndex + 1);
    else if (partIndex < parts().length - 1) loadPart(partIndex + 1, 0);
  }

  function handlePrev() {
    if (sceneHandle?.onPrev?.()) return;
    if (sceneIndex > 0) loadScene(sceneIndex - 1);
    else if (partIndex > 0) loadPart(partIndex - 1, parts()[partIndex - 1].scenes.length - 1);
  }

  function togglePause(force) {
    paused = typeof force === "boolean" ? force : !paused;
    gsap.globalTimeline.paused(paused);
    document.body.classList.toggle("is-paused", paused);
    els.pauseBtn.setAttribute("aria-pressed", String(paused));
  }

  function bindControls() {
    els.prevBtn.addEventListener("click", handlePrev);
    els.nextBtn.addEventListener("click", handleNext);
    els.replayBtn.addEventListener("click", () => loadScene(sceneIndex));
    els.pauseBtn.addEventListener("click", () => togglePause());

    document.addEventListener("keydown", (e) => {
      if (DJ.intro && DJ.intro.isOpen()) return;
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        handleNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        handlePrev();
      } else if (e.key === "r" || e.key === "R") {
        loadScene(sceneIndex);
      } else if (e.key === "p" || e.key === "P") {
        togglePause();
      }
    });
  }

  /* ---------- Tự ẩn điều khiển khi không đụng chuột ---------- */
  function bindIdle() {
    const wake = () => {
      document.body.classList.remove("is-idle");
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => document.body.classList.add("is-idle"), 3200);
    };
    ["mousemove", "mousedown", "keydown"].forEach((ev) => document.addEventListener(ev, wake, { passive: true }));
    wake();
  }

  document.addEventListener("DOMContentLoaded", init);

  return { loadPart, loadScene, setMetric, handleNext, handlePrev };
})();
