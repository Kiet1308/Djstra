/* Intro overlay controller. Runs the two intro slides (title + problem) on top
   of the visualizer, then dismisses itself to reveal the visualizer underneath.
   All DOM queries are scoped to #introOverlay so nothing here touches the
   visualizer's own elements or its keydown handling. */

(function () {
  "use strict";

  const overlay = document.getElementById("introOverlay");
  if (!overlay) return;

  // Mở bằng deep link (?part=...&scene=...) nghĩa là đang nhảy thẳng vào một
  // phần cụ thể giữa buổi trình bày — bỏ qua màn dẫn nhập.
  const params = new URLSearchParams(window.location.search);
  if (params.has("part") || params.has("scene")) {
    overlay.remove();
    return;
  }

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasGsap = typeof window.gsap !== "undefined";
  const SVGNS = "http://www.w3.org/2000/svg";

  // Refs for the slide-2 route figure, populated by buildRouteMap() during init.
  let routeRefs = null;
  let dismissed = false;

  const $ = (sel) => overlay.querySelector(sel);

  function el(name, attrs) {
    const node = document.createElementNS(SVGNS, name);
    if (attrs) {
      for (const key in attrs) node.setAttribute(key, attrs[key]);
    }
    return node;
  }

  /* ---------------------------------------------------------------------------
     Slide 1 background: a constellation-style network filling the whole
     canvas. Three depth layers keep it rich but quiet: a faint curved web
     (flight-map arcs, not straight wires), a scatter of twinkling dust dots,
     and one glowing gradient route that sweeps from A to B under the title.
     A radial mask sinks whatever sits directly behind the text.
  --------------------------------------------------------------------------- */
  function buildNetwork() {
    const svg = $("#netBg");
    const edgeG = $("#netEdges");
    const routeG = $("#netRoute");
    const nodeG = $("#netNodes");
    if (!svg || !edgeG || !routeG || !nodeG) return;

    const defs = el("defs");
    const grad = el("linearGradient", { id: "netRouteGrad", x1: "0", y1: "0", x2: "1", y2: "0" });
    [["0%", "#2fcf86"], ["55%", "#42f2a1"], ["100%", "#9ef9d4"]].forEach(([offset, color]) => {
      grad.appendChild(el("stop", { offset, "stop-color": color }));
    });
    defs.appendChild(grad);
    svg.insertBefore(defs, svg.firstChild);

    // Structural constellation. The route band sits low, cradling the title;
    // top and side nodes keep the upper canvas inhabited.
    const N = {
      t1: { x: 120, y: 150 }, t2: { x: 300, y: 90 }, t3: { x: 470, y: 200 },
      t4: { x: 640, y: 120 }, t5: { x: 880, y: 220 }, t6: { x: 1010, y: 90 },
      t7: { x: 1090, y: 185 },
      s1: { x: 155, y: 305 }, s2: { x: 1132, y: 330 },
      m1: { x: 255, y: 478 }, m2: { x: 975, y: 445 },
      A:  { x: 100, y: 545 },
      r1: { x: 320, y: 612 }, r2: { x: 560, y: 642 }, r3: { x: 820, y: 592 },
      B:  { x: 1105, y: 470 },
      b1: { x: 205, y: 688 }, b2: { x: 455, y: 702 }, b3: { x: 705, y: 692 },
      b4: { x: 935, y: 672 },
    };
    const faintNodes = new Set(["t1", "t2", "t3", "t4", "t5", "t6", "t7", "s1", "s2"]);
    const hot = new Set(["A", "r1", "r2", "r3", "B"]);
    const edges = [
      ["t1", "t2"], ["t2", "t3"], ["t3", "t4"], ["t4", "t5"], ["t5", "t6"],
      ["t5", "t7"], ["t6", "t7"], ["t1", "s1"], ["s1", "m1"], ["m1", "A"],
      ["t7", "s2"], ["s2", "m2"], ["m2", "B"], ["A", "b1"], ["b1", "r1"],
      ["r1", "b2"], ["b2", "r2"], ["r2", "b3"], ["b3", "r3"], ["r3", "b4"],
      ["b4", "B"], ["m1", "r1"], ["m2", "r3"],
      // Two long ghost arcs crossing behind the title (the mask all but
      // erases their middles, so only their ends surface at the edges).
      ["s1", "m2"], ["t4", "m1"],
    ];

    const curveD = (a, b, bow) => {
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const len = Math.hypot(dx, dy) || 1;
      const k = len * bow;
      const mx = (a.x + b.x) / 2 - (dy / len) * k;
      const my = (a.y + b.y) / 2 + (dx / len) * k;
      return `M ${a.x} ${a.y} Q ${mx.toFixed(1)} ${my.toFixed(1)} ${b.x} ${b.y}`;
    };

    edges.forEach(([a, b], i) => {
      edgeG.appendChild(el("path", { class: "net-edge", d: curveD(N[a], N[b], i % 2 ? 0.09 : -0.09) }));
    });

    // The hero route: one smooth catmull-rom arc through the low band.
    const pts = ["A", "r1", "r2", "r3", "B"].map((k) => N[k]);
    let routeD = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[Math.min(pts.length - 1, i + 2)];
      routeD +=
        ` C ${(p1.x + (p2.x - p0.x) / 6).toFixed(1)} ${(p1.y + (p2.y - p0.y) / 6).toFixed(1)}` +
        ` ${(p2.x - (p3.x - p1.x) / 6).toFixed(1)} ${(p2.y - (p3.y - p1.y) / 6).toFixed(1)}` +
        ` ${p2.x} ${p2.y}`;
    }
    routeG.appendChild(el("path", { class: "net-route-seg", id: "netRoutePath", d: routeD }));
    const netFlow = el("circle", { class: "net-flow-dot", id: "netFlowDot", r: 4, cx: N.A.x, cy: N.A.y });
    netFlow.style.opacity = "0";
    routeG.appendChild(netFlow);

    // Dust layer: tiny scattered points (deterministic spread) that keep the
    // space behind and around the title alive without competing with it.
    for (let i = 0; i < 26; i++) {
      const x = ((i * 211 + 83) % 1180) + 10;
      const y = ((i * 157 + 61) % 640) + 56;
      nodeG.appendChild(el("circle", { class: "net-node is-dust", cx: x, cy: y, r: 1.6 + (i % 3) * 0.5 }));
    }

    Object.keys(N).forEach((key) => {
      const n = N[key];
      const isEnd = key === "A" || key === "B";
      if (isEnd) {
        nodeG.appendChild(el("circle", { class: "net-pulse" + (key === "B" ? " is-b" : ""), cx: n.x, cy: n.y, r: 11 }));
      }
      nodeG.appendChild(
        el("circle", {
          class:
            "net-node" +
            (isEnd ? " is-end" + (key === "B" ? " is-b" : "") : "") +
            (!isEnd && hot.has(key) ? " is-hot" : "") +
            (faintNodes.has(key) ? " is-faint" : ""),
          cx: n.x,
          cy: n.y,
          r: isEnd ? 11 : hot.has(key) ? 8 : faintNodes.has(key) ? 5 : 6,
        })
      );
      if (isEnd) {
        const label = el("text", { class: "net-label" + (key === "B" ? " is-b" : ""), x: n.x, y: n.y - 26 });
        label.textContent = key;
        nodeG.appendChild(label);
      }
    });
  }

  /* Ambient life on slide 1: a light dot travelling the route, dust dots
     twinkling. Killed when the slide is left, rebuilt when re-entered. */
  let netFx = [];

  function killNetFx() {
    netFx.forEach((t) => t.kill());
    netFx = [];
    const dot = $("#netFlowDot");
    if (dot) dot.style.opacity = "0";
  }

  function startNetFx(baseDelay) {
    if (reduceMotion || !hasGsap) return;
    const gsap = window.gsap;
    killNetFx();

    const arc = $("#netRoutePath");
    const dot = $("#netFlowDot");
    if (arc && dot) {
      const len = arc.getTotalLength();
      const proxy = { t: 0 };
      netFx.push(
        gsap.to(proxy, {
          t: 1,
          duration: 3.4,
          ease: "power1.inOut",
          repeat: -1,
          repeatDelay: 1.4,
          delay: baseDelay + 2.4,
          onUpdate: () => {
            const pt = arc.getPointAtLength(len * proxy.t);
            dot.setAttribute("cx", pt.x);
            dot.setAttribute("cy", pt.y);
            dot.style.opacity = proxy.t > 0.02 && proxy.t < 0.98 ? "1" : "0";
          },
        })
      );
    }

    overlay.querySelectorAll(".net-node.is-dust").forEach((d, i) => {
      netFx.push(
        gsap.to(d, {
          opacity: 0.14 + ((i * 29) % 30) / 100,
          duration: 1.8 + ((i * 53) % 22) / 10,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          delay: (i * 0.41) % 2.2,
        })
      );
    });
  }

  /* ---------------------------------------------------------------------------
     Slide 2 figure: a real map image (assets/map-base.png) with a Google-Maps
     style route overlay. One glowing "fastest" route plus two faded alternates,
     A and B pins, and a moving dot. The whole problem in one familiar picture:
     many ways from A to B, which one is fastest?
     Overlay coords are in the SVG viewBox 620x500, aligned to the image.
  --------------------------------------------------------------------------- */
  function buildRouteMap() {
    const routeG = $("#mapRoutes");
    const flowG = $("#mapFlow");
    const badgeG = $("#mapBadges");
    const pinG = $("#mapPins");
    if (!routeG) return null;

    const A = { x: 132, y: 372 };
    const B = { x: 486, y: 132 };

    const best =
      "M 132 372 L 196 360 L 214 300 L 286 268 L 318 214 L 402 188 L 486 132";
    const altUp =
      "M 132 372 L 150 286 L 196 232 L 232 158 L 320 132 L 402 104 L 486 132";
    const altDown =
      "M 132 372 L 214 396 L 308 372 L 360 312 L 430 248 L 470 190 L 486 132";

    [
      { d: altUp, cls: "is-alt", id: "mr-altUp" },
      { d: altDown, cls: "is-alt", id: "mr-altDown" },
      { d: best, cls: "is-best", id: "mr-best" },
    ].forEach((r) => {
      routeG.appendChild(el("path", { class: "map-route " + r.cls, id: r.id, d: r.d }));
    });

    // Google-Maps-style time badges, one per route. This is what makes the
    // core sentence of the slide visible: every route has a different cost.
    function badge(id, x, y, label, isBest) {
      const g = el("g", { class: "route-badge" + (isBest ? " is-best" : ""), id, transform: `translate(${x} ${y})` });
      const w = Math.round(label.length * 7.8) + 26;
      g.appendChild(el("rect", { x: -w / 2, y: -14, width: w, height: 28, rx: 14 }));
      const t = el("text", { class: "route-badge-text", y: 1 });
      t.textContent = label;
      g.appendChild(t);
      badgeG.appendChild(g);
      return g;
    }
    badge("badge-altUp", 240, 128, "12 phút", false);
    badge("badge-altDown", 360, 352, "15 phút", false);
    badge("badge-best", 268, 226, "9 phút", true);

    // Hovering a route (or its badge) spotlights that pair and dims the rest,
    // so the presenter can point at one option while talking about it.
    const overlaySvg = $("#mapOverlay");
    [
      ["mr-altUp", "badge-altUp"],
      ["mr-altDown", "badge-altDown"],
      ["mr-best", "badge-best"],
    ].forEach(([routeId, badgeId]) => {
      const route = $("#" + routeId);
      const bdg = $("#" + badgeId);
      const hit = el("path", { class: "map-route-hit", d: route.getAttribute("d") });
      routeG.appendChild(hit);
      const on = () => {
        overlaySvg.classList.add("has-focus");
        route.classList.add("is-focus");
        bdg.classList.add("is-focus");
      };
      const off = () => {
        overlaySvg.classList.remove("has-focus");
        route.classList.remove("is-focus");
        bdg.classList.remove("is-focus");
      };
      [hit, bdg].forEach((target) => {
        target.addEventListener("mouseenter", on);
        target.addEventListener("mouseleave", off);
      });
    });

    const flow = el("circle", { class: "map-flow-dot", id: "mapFlowDot", r: 5, cx: A.x, cy: A.y });
    flow.style.opacity = "0";
    flowG.appendChild(flow);

    function pin(pt, label, kind) {
      const g = el("g", { class: "map-pin", id: "pin-" + kind });
      g.appendChild(el("ellipse", { class: "pin-shadow", cx: pt.x, cy: pt.y + 1, rx: 17, ry: 6 }));
      g.appendChild(el("circle", { class: "pin-body is-" + kind, cx: pt.x, cy: pt.y - 16, r: 16 }));
      g.appendChild(
        el("path", {
          class: "pin-body is-" + kind,
          d: `M ${pt.x - 7} ${pt.y - 7} L ${pt.x} ${pt.y + 3} L ${pt.x + 7} ${pt.y - 7} Z`,
        })
      );
      const txt = el("text", { class: "pin-label is-" + kind, x: pt.x, y: pt.y - 15 });
      txt.textContent = label;
      g.appendChild(txt);
      pinG.appendChild(g);
    }
    pin(A, "A", "a");
    pin(B, "B", "b");

    return { flowEl: flow, A, B };
  }

  /* ---------------------------------------------------------------------------
     Slide navigation
  --------------------------------------------------------------------------- */
  const slides = Array.from(overlay.querySelectorAll(".slide"));
  const dotsWrap = $("#deckDots");
  const prevBtn = $("#prevSlide");
  const nextBtn = $("#nextSlide");
  let current = 0;
  let animating = false;

  slides.forEach((_, i) => {
    const dot = document.createElement("span");
    dot.className = "deck-dot" + (i === 0 ? " is-active" : "");
    dotsWrap.appendChild(dot);
  });
  const dots = Array.from(dotsWrap.children);

  function enterAnimation(index, baseDelay = 0) {
    if (reduceMotion || !hasGsap) return;
    const gsap = window.gsap;
    const at = (delay = 0) => baseDelay + delay;

    if (index === 0) {
      gsap.from("#introOverlay .slide-title .title-eyebrow", { y: 18, opacity: 0, duration: 0.5, ease: "power3.out", delay: at(0.05) });
      gsap.from("#introOverlay .slide-title .title-head .line", { y: 40, opacity: 0, duration: 0.7, stagger: 0.1, ease: "power3.out", delay: at(0.12) });
      gsap.from("#introOverlay .slide-title .title-sub", { y: 20, opacity: 0, duration: 0.6, ease: "power3.out", delay: at(0.38) });
      gsap.from("#introOverlay .slide-title .title-cta", { y: 16, opacity: 0, duration: 0.55, ease: "power3.out", delay: at(0.5) });

      const routePath = $("#netRoutePath");
      if (routePath) {
        const len = routePath.getTotalLength();
        gsap.set(routePath, { strokeDasharray: len, strokeDashoffset: len });
        gsap.to(routePath, { strokeDashoffset: 0, duration: 1.8, ease: "power2.inOut", delay: at(0.5) });
      }
      gsap.from("#introOverlay .net-node", { scale: 0, transformOrigin: "center", opacity: 0, duration: 0.5, stagger: 0.012, ease: "back.out(1.6)", delay: at(0.15) });
      gsap.from("#introOverlay .net-edge", { opacity: 0, duration: 0.9, stagger: 0.02, delay: at(0.25) });
      gsap.from("#introOverlay .net-label", { opacity: 0, y: 8, duration: 0.5, ease: "power3.out", delay: at(0.6) });
      startNetFx(baseDelay);
    } else if (index === 1) {
      gsap.from("#introOverlay .problem-index", { x: -16, opacity: 0, duration: 0.5, ease: "power3.out", delay: at() });
      gsap.from("#introOverlay .problem-head", { y: 26, opacity: 0, duration: 0.6, ease: "power3.out", delay: at(0.06) });
      gsap.from("#introOverlay .problem-lead", { y: 18, opacity: 0, duration: 0.55, ease: "power3.out", delay: at(0.16) });
      gsap.from("#introOverlay .problem-points li", { x: 22, opacity: 0, duration: 0.5, stagger: 0.08, ease: "power3.out", delay: at(0.24) });
      gsap.from("#introOverlay .problem-cta", { y: 14, opacity: 0, duration: 0.5, ease: "power3.out", delay: at(0.5) });
      gsap.from("#introOverlay .problem-figure", { y: 30, opacity: 0, duration: 0.7, ease: "power3.out", delay: at(0.1) });

      // Story order: drop the endpoints first (you know where you are and
      // where you are going), then draw each route with its time badge, the
      // glowing best one last, then admit there are thousands more.
      gsap.from("#introOverlay .map-pin", { y: -18, opacity: 0, duration: 0.5, stagger: 0.12, ease: "back.out(2)", delay: at(0.4) });

      const routes = [
        { sel: "#mr-altUp", dur: 0.7, delay: at(0.8), badge: "#badge-altUp", badgeAt: at(1.4) },
        { sel: "#mr-altDown", dur: 0.7, delay: at(1.0), badge: "#badge-altDown", badgeAt: at(1.6) },
        { sel: "#mr-best", dur: 1.0, delay: at(1.85), badge: "#badge-best", badgeAt: at(2.65) },
      ];
      routes.forEach((r) => {
        const path = $(r.sel);
        if (!path) return;
        const len = path.getTotalLength();
        gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });
        gsap.to(path, { strokeDashoffset: 0, duration: r.dur, ease: "power2.out", delay: r.delay });
        const bdg = $(r.badge);
        if (bdg) {
          gsap.from(bdg, { scale: 0, transformOrigin: "50% 50%", duration: 0.45, ease: "back.out(2.2)", delay: r.badgeAt });
        }
      });
      gsap.from("#introOverlay .map-chip", { y: 10, opacity: 0, duration: 0.5, ease: "power3.out", delay: at(3.0) });

      runFlow(baseDelay);
    }
  }

  let flowTween = null;
  function stopFlow() {
    if (flowTween) flowTween.kill();
    flowTween = null;
    if (routeRefs && routeRefs.flowEl) routeRefs.flowEl.style.opacity = "0";
  }

  function runFlow(baseDelay = 0) {
    if (reduceMotion || !hasGsap || !routeRefs || !routeRefs.flowEl) return;
    const gsap = window.gsap;
    const arc = $("#mr-best");
    if (!arc) return;
    const len = arc.getTotalLength();
    const flow = routeRefs.flowEl;
    stopFlow();
    const proxy = { t: 0 };
    flowTween = gsap.to(proxy, {
      t: 1,
      duration: 2.0,
      ease: "power1.inOut",
      repeat: -1,
      repeatDelay: 0.7,
      delay: baseDelay + 3.4,
      onUpdate: function () {
        const pt = arc.getPointAtLength(len * proxy.t);
        flow.setAttribute("cx", pt.x);
        flow.setAttribute("cy", pt.y);
        flow.style.opacity = proxy.t > 0.02 && proxy.t < 0.98 ? "1" : "0";
      },
    });
  }

  function goTo(index) {
    if (index < 0 || index >= slides.length || index === current || animating) return;
    const prev = current;
    current = index;

    if (!reduceMotion && hasGsap) {
      animating = true;
      const gsap = window.gsap;
      const dir = index > prev ? 1 : -1;
      const outgoing = slides[prev];
      const incoming = slides[index];
      const incomingDelay = 0.18;
      if (prev === 1) stopFlow();
      if (prev === 0) killNetFx();
      gsap.killTweensOf(outgoing.querySelectorAll("*"));
      gsap.killTweensOf(incoming.querySelectorAll("*"));
      incoming.classList.add("is-active");
      incoming.setAttribute("aria-hidden", "false");
      gsap.set(incoming, { opacity: 0, x: 40 * dir });
      enterAnimation(index, incomingDelay);
      gsap.to(outgoing, {
        opacity: 0,
        x: -40 * dir,
        duration: 0.35,
        ease: "power2.in",
        onComplete: () => {
          outgoing.classList.remove("is-active");
          outgoing.setAttribute("aria-hidden", "true");
          gsap.set(outgoing, { x: 0 });
        },
      });
      gsap.to(incoming, {
        opacity: 1,
        x: 0,
        duration: 0.45,
        ease: "power3.out",
        delay: incomingDelay,
        onComplete: () => {
          animating = false;
        },
      });
    } else {
      slides[prev].classList.remove("is-active");
      slides[prev].setAttribute("aria-hidden", "true");
      slides[index].classList.add("is-active");
      slides[index].setAttribute("aria-hidden", "false");
    }

    dots.forEach((d, i) => d.classList.toggle("is-active", i === index));
    prevBtn.disabled = index === 0;
    nextBtn.innerHTML =
      index === slides.length - 1
        ? 'Vào Visualizer <span aria-hidden="true">&rarr;</span>'
        : 'Tiếp <span aria-hidden="true">&rarr;</span>';
  }

  function next() {
    if (current === slides.length - 1) {
      dismiss();
    } else {
      goTo(current + 1);
    }
  }

  // Fade the overlay away to reveal the visualizer that is already rendered
  // underneath. Removes the node so it no longer captures pointer/keyboard.
  function dismiss() {
    if (dismissed) return;
    dismissed = true;
    if (flowTween) flowTween.kill();
    killNetFx();

    const finish = () => {
      overlay.remove();
    };

    if (reduceMotion || !hasGsap) {
      finish();
      return;
    }
    window.gsap.to(overlay, {
      opacity: 0,
      duration: 0.5,
      ease: "power2.inOut",
      onComplete: finish,
    });
  }

  prevBtn.addEventListener("click", () => goTo(current - 1));
  nextBtn.addEventListener("click", next);
  $("#startBtn").addEventListener("click", () => goTo(1));
  $("#enterBtn").addEventListener("click", dismiss);
  $("#backBtn").addEventListener("click", () => goTo(0));

  // Keys only act while the overlay is up. Capture phase + stopPropagation so
  // the visualizer's own arrow/space handler never sees these events.
  function onKey(e) {
    if (dismissed) return;
    if (e.key === "ArrowRight" || e.key === "PageDown") {
      e.preventDefault();
      e.stopPropagation();
      next();
    } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
      e.preventDefault();
      e.stopPropagation();
      goTo(current - 1);
    } else if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      dismiss();
    }
  }
  document.addEventListener("keydown", onKey, true);

  // Build figures, then play the first slide in.
  buildNetwork();
  routeRefs = buildRouteMap();
  prevBtn.disabled = true;
  enterAnimation(0);
})();
