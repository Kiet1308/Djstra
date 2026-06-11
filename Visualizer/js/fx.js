/* ============================================================
   fx.js — hiệu ứng dùng chung giữa các phần.
   ============================================================ */
window.DJ = window.DJ || {};

DJ.fx = (function () {
  /* Hiện đồ thị ngay lập tức — dùng khi Next trong cùng phần (đồ thị đã quen mắt) */
  function showGraph(stage) {
    gsap.set([...stage.allEdges(), ...stage.allLabels(), ...stage.allNodes()], { opacity: 1 });
  }

  /* Chỉ chạy màn chào sân khi vừa vào phần mới; còn lại hiện ngay */
  function ensureGraph(stage, fresh, opts) {
    if (fresh) return revealGraph(stage, opts);
    showGraph(stage);
    return null;
  }

  /* Màn vào của đồ thị: cạnh hiện trước, đỉnh nảy lên theo nhịp */
  function revealGraph(stage, opts = {}) {
    const tl = gsap.timeline({ delay: DJ.dur(opts.delay ?? 0) });
    tl.fromTo(
      stage.allEdges(),
      { opacity: 0 },
      { opacity: 1, duration: DJ.dur(0.5), stagger: DJ.dur(0.02), ease: "power1.out" },
      0
    );
    tl.fromTo(
      stage.allLabels(),
      { opacity: 0 },
      { opacity: 1, duration: DJ.dur(0.4), stagger: DJ.dur(0.015) },
      DJ.dur(0.25)
    );
    tl.fromTo(
      stage.allNodes(),
      { opacity: 0, scale: 0.6, transformOrigin: "center center" },
      { opacity: 1, scale: 1, duration: DJ.dur(0.5), stagger: DJ.dur(0.04), ease: "back.out(1.7)" },
      DJ.dur(0.15)
    );
    return tl;
  }

  /* Ghi chú nhỏ trong SVG (toạ độ đồ thị) */
  function svgNote(stage, x, y, lines, opts = {}) {
    const SVG_NS = "http://www.w3.org/2000/svg";
    const g = document.createElementNS(SVG_NS, "g");
    g.setAttribute("class", "stage-note");
    g.setAttribute("transform", `translate(${x} ${y})`);
    lines.forEach((line, i) => {
      const t = document.createElementNS(SVG_NS, "text");
      t.setAttribute("y", i * 20);
      if (opts.anchor) t.setAttribute("text-anchor", opts.anchor);
      t.textContent = line;
      if (opts.strong && opts.strong.includes(i)) t.setAttribute("class", "note-strong");
      g.appendChild(t);
    });
    stage.layersRef().annotations.appendChild(g);
    gsap.from(g, { opacity: 0, y: "+=8", duration: DJ.dur(0.4), delay: DJ.dur(opts.delay ?? 0) });
    return g;
  }

  return { revealGraph, showGraph, ensureGraph, svgNote };
})();
