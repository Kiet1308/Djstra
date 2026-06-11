/* ============================================================
   intro.js — deck mở đầu 2 slide.
   Slide 1: tựa đề trên nền mạng lưới mực.
   Slide 2: Google Maps tìm đường như thế nào? (bản đồ + tuyến).
   ============================================================ */
window.DJ = window.DJ || {};

DJ.intro = (function () {
  const SVG_NS = "http://www.w3.org/2000/svg";
  let root = null;
  let open = false;
  let slideIndex = 0;
  let slides = [];
  let dots = [];
  let done = null;

  function svgEl(tag, attrs = {}) {
    const n = document.createElementNS(SVG_NS, tag);
    for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
    return n;
  }

  /* Mạng lưới nền slide 1 — chòm sao mực, một tuyến son chạy qua */
  function buildNet(svg) {
    const N = {
      A: { x: 120, y: 540 }, B: { x: 300, y: 420 }, C: { x: 260, y: 640 }, D: { x: 470, y: 530 },
      E: { x: 430, y: 300 }, F: { x: 640, y: 410 }, G: { x: 620, y: 620 }, H: { x: 800, y: 300 },
      I: { x: 840, y: 520 }, J: { x: 1000, y: 410 }, K: { x: 1010, y: 620 }, L: { x: 1160, y: 520 },
      M: { x: 1130, y: 300 }, O: { x: 600, y: 160 }, P: { x: 920, y: 150 },
    };
    const E = [
      ["A", "B"], ["A", "C"], ["B", "C"], ["B", "E"], ["B", "D"], ["C", "D"], ["D", "F"], ["E", "F"],
      ["E", "O"], ["F", "G"], ["F", "H"], ["G", "I"], ["D", "G"], ["H", "I"], ["H", "P"], ["I", "J"],
      ["I", "K"], ["J", "K"], ["J", "M"], ["K", "L"], ["J", "L"], ["O", "H"], ["P", "M"], ["E", "H"],
    ];
    for (const [a, b] of E) {
      svg.appendChild(svgEl("path", { class: "net-edge", d: `M ${N[a].x} ${N[a].y} L ${N[b].x} ${N[b].y}` }));
    }
    const route = ["A", "B", "E", "F", "H", "I", "J", "L"];
    const routeD = route.map((n, i) => `${i === 0 ? "M" : "L"} ${N[n].x} ${N[n].y}`).join(" ");
    const seg = svgEl("path", { class: "net-route-seg", d: routeD });
    svg.appendChild(seg);
    for (const p of Object.values(N)) {
      svg.appendChild(svgEl("circle", { class: "net-node", cx: p.x, cy: p.y, r: 5 }));
    }
    const len = seg.getTotalLength();
    seg.style.strokeDasharray = `${len}`;
    seg.style.strokeDashoffset = `${len}`;
    gsap.timeline({ repeat: -1, repeatDelay: DJ.dur(1.6), delay: DJ.dur(0.8) })
      .to(seg, { strokeDashoffset: 0, duration: DJ.dur(2.4), ease: "power1.inOut" })
      .to(seg, { opacity: 0, duration: DJ.dur(0.6), delay: DJ.dur(0.6) })
      .set(seg, { strokeDashoffset: len, opacity: 0.85 });
  }

  /* Bản đồ slide 2 — 3 tuyến, tuyến 9 phút thắng */
  function buildMap(fig) {
    const overlay = fig.querySelector(".map-overlay");
    const A = { x: 132, y: 372 };
    const B = { x: 486, y: 132 };
    const routes = [
      { d: "M 132 372 L 150 286 L 196 232 L 232 158 L 320 132 L 402 104 L 486 132", cls: "is-alt" },
      { d: "M 132 372 L 214 396 L 308 372 L 360 312 L 430 248 L 470 190 L 486 132", cls: "is-alt" },
      { d: "M 132 372 L 196 360 L 214 300 L 286 268 L 318 214 L 402 188 L 486 132", cls: "is-best" },
    ];
    const els = routes.map((r) => {
      const p = svgEl("path", { class: `map-route ${r.cls}`, d: r.d });
      overlay.appendChild(p);
      return p;
    });
    for (const [name, pt, cls] of [["A", A, ""], ["B", B, "is-b"]]) {
      const g = svgEl("g", { class: `map-pin ${cls}`.trim() });
      g.appendChild(svgEl("circle", { cx: pt.x, cy: pt.y, r: 13 }));
      const t = svgEl("text", { x: pt.x, y: pt.y });
      t.textContent = name;
      g.appendChild(t);
      overlay.appendChild(g);
    }
    els.forEach((p, i) => {
      const len = p.getTotalLength();
      p.style.strokeDasharray = `${len}`;
      p.style.strokeDashoffset = `${len}`;
      gsap.to(p, { strokeDashoffset: 0, duration: DJ.dur(1.1), delay: DJ.dur(0.7 + i * 0.5), ease: "power2.out" });
    });
    /* nhãn thời gian theo toạ độ % của khung ảnh (viewBox 620×500) */
    const times = [
      { text: "14 phút", x: 36, y: 22, best: false },
      { text: "12 phút", x: 55, y: 72, best: false },
      { text: "9 phút", x: 44, y: 50, best: true },
    ];
    times.forEach((t, i) => {
      const tag = document.createElement("span");
      tag.className = `map-time${t.best ? " is-best" : ""}`;
      tag.textContent = t.text;
      tag.style.left = `${t.x}%`;
      tag.style.top = `${t.y}%`;
      fig.querySelector(".map-frame").appendChild(tag);
      gsap.from(tag, { opacity: 0, scale: 0.8, duration: DJ.dur(0.4), delay: DJ.dur(1.3 + i * 0.5), ease: "back.out(1.6)" });
    });
  }

  let mapBuilt = false;

  function goTo(i) {
    slideIndex = Math.max(0, Math.min(slides.length - 1, i));
    slides.forEach((s, idx) => s.classList.toggle("is-active", idx === slideIndex));
    dots.forEach((d, idx) => d.classList.toggle("is-active", idx === slideIndex));
    /* vẽ tuyến trên bản đồ đúng lúc slide 2 hiện — không chạy chay khi còn ẩn */
    if (slideIndex === 1 && !mapBuilt) {
      mapBuilt = true;
      buildMap(root.querySelector(".problem-figure"));
    }
    const slide = slides[slideIndex];
    const targets = slide.querySelectorAll("[data-reveal]");
    gsap.fromTo(targets, { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: DJ.dur(0.65), stagger: DJ.dur(0.12), ease: "power3.out" });
  }

  function close() {
    if (!open) return;
    open = false;
    document.removeEventListener("keydown", onKey);
    const app = document.getElementById("app");
    if (app) app.inert = false;
    gsap.to(root, {
      opacity: 0,
      scale: 1.012,
      duration: DJ.dur(0.6),
      ease: "power2.inOut",
      onComplete() {
        root.remove();
        root = null;
        done?.();
      },
    });
  }

  function onKey(e) {
    if (!open) return;
    if (e.key === "ArrowRight" || e.key === " " || e.key === "Enter") {
      e.preventDefault();
      slideIndex === slides.length - 1 ? close() : goTo(slideIndex + 1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      goTo(slideIndex - 1);
    } else if (e.key === "Escape") {
      close();
    }
  }

  function show(onDone) {
    done = onDone;
    open = true;
    mapBuilt = false;
    root = document.createElement("div");
    root.className = "intro";
    root.innerHTML = `
      <header class="intro-topline">
        <span class="intro-mark">Nhóm 2</span>
        <span>Thuyết trình tương tác</span>
      </header>

      <section class="intro-slide is-active" aria-label="Trang tiêu đề">
        <svg class="intro-net" viewBox="0 0 1280 760" preserveAspectRatio="xMidYMid slice" aria-hidden="true"></svg>
        <div class="title-stack">
          <p class="title-eyebrow" data-reveal>Một câu hỏi quen thuộc</p>
          <h1 class="title-head" data-reveal>
            <span class="line">Đường nào</span>
            <span class="line accent">ngắn nhất?</span>
          </h1>
          <p class="title-sub" data-reveal>
            Google Maps trả lời nó trong một cái chớp mắt.
            Hôm nay, chúng ta sẽ cùng tự tìm ra câu trả lời ấy.
          </p>
          <div class="title-cta" data-reveal>
            <button class="intro-btn" data-next type="button">Bắt đầu <span aria-hidden="true">&rarr;</span></button>
            <span class="title-keys" aria-hidden="true"><kbd>&larr;</kbd><kbd>&rarr;</kbd> để điều khiển</span>
          </div>
        </div>
      </section>

      <section class="intro-slide" aria-label="Nêu vấn đề">
        <div class="problem-grid">
          <div class="problem-copy">
            <p class="kicker" data-reveal>Vấn đề</p>
            <h2 class="problem-head" data-reveal>Google Maps<br/>tìm đường như thế nào?</h2>
            <p class="problem-lead" data-reveal>
              Bạn cần đi từ A đến B. Giữa hai điểm luôn có rất nhiều tuyến,
              và mỗi tuyến tốn một mức khác nhau.
            </p>
            <ul class="problem-points">
              <li data-reveal><span class="point-num">01</span><div><span class="point-key">Rất nhiều tuyến</span><span class="point-val">Giữa A và B có vô số cách đi</span></div></li>
              <li data-reveal><span class="point-num">02</span><div><span class="point-key">Mỗi tuyến một chi phí</span><span class="point-val">Thời gian, quãng đường, tiền xăng&hellip;</span></div></li>
              <li data-reveal><span class="point-num">03</span><div><span class="point-key">Mục tiêu</span><span class="point-val">Chọn tuyến có tổng chi phí nhỏ nhất</span></div></li>
            </ul>
            <div class="problem-cta" data-reveal>
              <button class="intro-btn" data-enter type="button">Bắt đầu tìm lời giải <span aria-hidden="true">&rarr;</span></button>
              <button class="intro-btn is-ghost" data-back type="button">Quay lại</button>
            </div>
          </div>
          <figure class="problem-figure" data-reveal style="margin:0">
            <div class="map-frame">
              <img src="./assets/map-base.png" alt="Bản đồ thành phố với nhiều tuyến đường nối A và B" width="620" height="500" draggable="false" />
              <svg class="map-overlay" viewBox="0 0 620 500" aria-hidden="true"></svg>
              <span class="map-chip"><i></i>+ hàng nghìn tuyến khác chưa vẽ</span>
            </div>
            <figcaption class="map-caption">
              Google chỉ ra tuyến <strong>9 phút</strong> gần như tức thì, giữa hàng nghìn tuyến có thể đi.
              Làm thế nào nó biết, nếu không phải thử từng tuyến một?
            </figcaption>
          </figure>
        </div>
      </section>

      <footer class="intro-footer">
        <div class="intro-dots"><i class="is-active"></i><i></i></div>
      </footer>`;
    document.getElementById("introRoot").appendChild(root);

    slides = [...root.querySelectorAll(".intro-slide")];
    dots = [...root.querySelectorAll(".intro-dots i")];
    buildNet(root.querySelector(".intro-net"));
    /* khoá app phía sau: Tab không lọt xuống nút Tiếp/Lùi khi intro đang mở */
    const app = document.getElementById("app");
    if (app) app.inert = true;

    root.querySelector("[data-next]").addEventListener("click", () => goTo(1));
    root.querySelector("[data-back]").addEventListener("click", () => goTo(0));
    root.querySelector("[data-enter]").addEventListener("click", close);
    document.addEventListener("keydown", onKey);

    goTo(0);
  }

  return { show, isOpen: () => open };
})();
