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
     Slide 1 background: a faint road network with one glowing shortest route.
     Purely decorative, mirrors the visualizer's graph aesthetic.
  --------------------------------------------------------------------------- */
  function buildNetwork() {
    const edgeG = $("#netEdges");
    const routeG = $("#netRoute");
    const nodeG = $("#netNodes");
    if (!edgeG || !routeG || !nodeG) return;

    const nodes = [
      { x: 120, y: 150 }, { x: 300, y: 90 }, { x: 470, y: 200 },
      { x: 250, y: 320 }, { x: 90, y: 470 }, { x: 430, y: 430 },
      { x: 640, y: 120 }, { x: 720, y: 330 }, { x: 590, y: 560 },
      { x: 880, y: 220 }, { x: 980, y: 440 }, { x: 820, y: 620 },
      { x: 1080, y: 180 }, { x: 1130, y: 560 }, { x: 1010, y: 90 },
    ];
    const edges = [
      [0, 1], [1, 2], [0, 3], [3, 4], [3, 5], [2, 5], [1, 6],
      [2, 6], [6, 7], [5, 8], [7, 8], [6, 9], [9, 10], [7, 10],
      [8, 11], [10, 11], [9, 14], [9, 12], [12, 13], [10, 13], [14, 12],
    ];
    const route = [4, 3, 5, 8, 11, 10, 13];

    edges.forEach(([a, b]) => {
      edgeG.appendChild(
        el("path", { class: "net-edge", d: `M ${nodes[a].x} ${nodes[a].y} L ${nodes[b].x} ${nodes[b].y}` })
      );
    });

    let routeD = `M ${nodes[route[0]].x} ${nodes[route[0]].y}`;
    for (let i = 1; i < route.length; i++) {
      routeD += ` L ${nodes[route[i]].x} ${nodes[route[i]].y}`;
    }
    routeG.appendChild(el("path", { class: "net-route-seg", id: "netRoutePath", d: routeD }));

    const hot = new Set(route);
    nodes.forEach((n, i) => {
      nodeG.appendChild(
        el("circle", {
          class: "net-node" + (hot.has(i) ? " is-hot" : ""),
          cx: n.x,
          cy: n.y,
          r: hot.has(i) ? 9 : 6,
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
        gsap.to(routePath, { strokeDashoffset: 0, duration: 1.8, ease: "power2.inOut", delay: at(0.3) });
      }
      gsap.from("#introOverlay .net-node", { scale: 0, transformOrigin: "center", opacity: 0, duration: 0.5, stagger: 0.02, ease: "back.out(1.6)", delay: at(0.2) });
    } else if (index === 1) {
      gsap.from("#introOverlay .problem-index", { x: -16, opacity: 0, duration: 0.5, ease: "power3.out", delay: at() });
      gsap.from("#introOverlay .problem-head", { y: 26, opacity: 0, duration: 0.6, ease: "power3.out", delay: at(0.06) });
      gsap.from("#introOverlay .problem-lead", { y: 18, opacity: 0, duration: 0.55, ease: "power3.out", delay: at(0.16) });
      gsap.from("#introOverlay .problem-points li", { x: 22, opacity: 0, duration: 0.5, stagger: 0.08, ease: "power3.out", delay: at(0.24) });
      gsap.from("#introOverlay .problem-cta", { y: 14, opacity: 0, duration: 0.5, ease: "power3.out", delay: at(0.5) });
      gsap.from("#introOverlay .problem-figure", { y: 30, opacity: 0, duration: 0.7, ease: "power3.out", delay: at(0.1) });

      // Draw the alternates first, then the glowing best route, then drop the pins.
      const routes = [
        { sel: "#mr-altUp", dur: 0.8, delay: at(0.45) },
        { sel: "#mr-altDown", dur: 0.8, delay: at(0.55) },
        { sel: "#mr-best", dur: 1.0, delay: at(0.7) },
      ];
      routes.forEach((r) => {
        const path = $(r.sel);
        if (!path) return;
        const len = path.getTotalLength();
        const baseDash = path.classList.contains("is-alt") ? path.getAttribute("stroke-dasharray") : null;
        gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });
        gsap.to(path, {
          strokeDashoffset: 0,
          duration: r.dur,
          ease: "power2.out",
          delay: r.delay,
          onComplete: () => {
            if (baseDash) path.setAttribute("stroke-dasharray", baseDash);
          },
        });
      });
      gsap.from("#introOverlay .map-pin", { y: -18, opacity: 0, duration: 0.5, stagger: 0.12, ease: "back.out(2)", delay: at(1.1) });
      gsap.from("#introOverlay .map-chip", { y: 10, opacity: 0, duration: 0.5, ease: "power3.out", delay: at(1.5) });

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
      delay: baseDelay + 1.9,
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
