/* Eldrian portfolio: small, dependency-free scripts. */
(function () {
  "use strict";

  var TZ = "Asia/Manila";

  /* ---------- Live clock (Philippine time) ---------- */
  var clocks = document.querySelectorAll("[data-clock]");

  function phTime(date) {
    try {
      return date.toLocaleTimeString("en-GB", { timeZone: TZ, hour12: false });
    } catch (e) {
      return date.toTimeString().slice(0, 8);
    }
  }

  function tick() {
    var t = phTime(new Date());
    for (var i = 0; i < clocks.length; i++) clocks[i].textContent = t;
  }

  if (clocks.length) {
    tick();
    setInterval(tick, 1000);
  }

  /* ---------- Footer year ---------- */
  var year = document.querySelector("[data-year]");
  if (year) year.textContent = String(new Date().getFullYear());

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var root = document.documentElement;

  /* ---------- Preloader: 000 to 100, then wipe up ---------- */
  var preloader = document.querySelector(".preloader");
  var countEl = document.querySelector("[data-count]");

  function ready() {
    root.classList.add("is-ready");
  }

  function pad3(n) {
    return ("00" + n).slice(-3);
  }

  /* A dotted 3D globe that forms as the counter climbs. Plain 2D
     canvas with our own projection, so it shows instantly without
     waiting for Three.js. */
  var preCanvas = document.querySelector("[data-preglobe]");
  var preCtx = preCanvas && preCanvas.getContext ? preCanvas.getContext("2d") : null;
  var PRE_N = 1400;
  var prePts = [];
  (function () {
    var golden = Math.PI * (3 - Math.sqrt(5));
    for (var i = 0; i < PRE_N; i++) {
      var y = 1 - (i / (PRE_N - 1)) * 2;
      var r = Math.sqrt(1 - y * y);
      var th = golden * i;
      // each dot flies in from a random spot further out
      var k = 1.6 + Math.random() * 1.4;
      prePts.push({ x: Math.cos(th) * r, y: y, z: Math.sin(th) * r, k: k, d: Math.random() * 0.25 });
    }
  })();
  var TAGUM_LAT = 7.45 * Math.PI / 180;
  var TAGUM_LON = 125.81 * Math.PI / 180;
  var pin = {
    x: Math.cos(TAGUM_LAT) * Math.sin(TAGUM_LON),
    y: Math.sin(TAGUM_LAT),
    z: Math.cos(TAGUM_LAT) * Math.cos(TAGUM_LON)
  };

  function sizePreCanvas() {
    if (!preCanvas) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = preCanvas.clientWidth, h = preCanvas.clientHeight;
    preCanvas.width = Math.round(w * dpr);
    preCanvas.height = Math.round(h * dpr);
    preCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function drawPreGlobe(progress, time) {
    if (!preCtx) return;
    var w = preCanvas.clientWidth, h = preCanvas.clientHeight;
    var R = Math.min(w, h) * 0.42;
    var cx = w / 2, cy = h / 2;
    preCtx.clearRect(0, 0, w, h);

    // rotation ends facing the Philippines
    var rotY = -TAGUM_LON + (1 - progress) * 2.4 + Math.sin(time * 0.6) * 0.05;
    var rotX = 0.25;
    var cY = Math.cos(rotY), sY = Math.sin(rotY);
    var cX = Math.cos(rotX), sX = Math.sin(rotX);

    function project(px, py, pz, scale) {
      var x1 = px * cY + pz * sY;
      var z1 = -px * sY + pz * cY;
      var y2 = py * cX - z1 * sX;
      var z2 = py * sX + z1 * cX;
      var persp = 3.2 / (3.2 - z2 * scale);
      return { x: cx + x1 * scale * R * persp, y: cy - y2 * scale * R * persp, z: z2 };
    }

    for (var i = 0; i < PRE_N; i++) {
      var p = prePts[i];
      // dots arrive top to bottom as the count rises
      var arrive = Math.min(1, Math.max(0, (progress * 1.35 - (i / PRE_N) * 0.9 - p.d) / 0.35));
      if (arrive <= 0) continue;
      var e = 1 - Math.pow(1 - arrive, 3);
      var scale = p.k + (1 - p.k) * e;
      var q = project(p.x, p.y, p.z, scale);
      var front = q.z > 0;
      var size = (front ? 1.1 + q.z * 1.3 : 0.8) * (0.6 + e * 0.4);
      preCtx.globalAlpha = (front ? 0.55 + q.z * 0.45 : 0.16) * e;
      preCtx.fillStyle = front ? "#C8FF00" : "#F1F0EB";
      preCtx.beginPath();
      preCtx.arc(q.x, q.y, size, 0, Math.PI * 2);
      preCtx.fill();
    }

    // outline ring
    preCtx.globalAlpha = 0.25 * progress;
    preCtx.strokeStyle = "#F1F0EB";
    preCtx.lineWidth = 1;
    preCtx.beginPath();
    preCtx.arc(cx, cy, R * 1.01, 0, Math.PI * 2);
    preCtx.stroke();

    // Tagum pin lands near the end
    var pinOn = Math.min(1, Math.max(0, (progress - 0.75) / 0.25));
    if (pinOn > 0) {
      var pp = project(pin.x, pin.y, pin.z, 1.02);
      if (pp.z > 0) {
        var pulse = (time * 1.2) % 1;
        preCtx.globalAlpha = pinOn * (1 - pulse) * 0.8;
        preCtx.strokeStyle = "#C8FF00";
        preCtx.beginPath();
        preCtx.arc(pp.x, pp.y, 6 + pulse * 18, 0, Math.PI * 2);
        preCtx.stroke();
        preCtx.globalAlpha = pinOn;
        preCtx.fillStyle = "#F1F0EB";
        preCtx.beginPath();
        preCtx.arc(pp.x, pp.y, 5, 0, Math.PI * 2);
        preCtx.fill();
        preCtx.fillStyle = "#C8FF00";
        preCtx.beginPath();
        preCtx.arc(pp.x, pp.y, 3, 0, Math.PI * 2);
        preCtx.fill();
      }
    }
    preCtx.globalAlpha = 1;
  }

  if (!preloader || reduceMotion.matches) {
    if (preloader) preloader.classList.add("is-gone");
    ready();
  } else {
    sizePreCanvas();
    window.addEventListener("resize", sizePreCanvas);
    var start = null;
    var DURATION = 2000;
    var finished = false;
    var step = function (now) {
      if (start === null) start = now;
      var t = Math.min(1, (now - start) / DURATION);
      var eased = 1 - Math.pow(1 - t, 3);
      countEl.textContent = pad3(Math.round(eased * 100));
      drawPreGlobe(eased, now / 1000);
      if (t >= 1 && !finished) {
        finished = true;
        setTimeout(function () {
          preloader.classList.add("is-done");
          setTimeout(ready, 250);
          setTimeout(function () {
            preloader.classList.add("is-gone");
            window.removeEventListener("resize", sizePreCanvas);
          }, 950);
        }, 250);
      }
      if (!preloader.classList.contains("is-gone")) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  /* ---------- Light / dark theme ---------- */
  var toggle = document.querySelector("[data-theme-toggle]");
  var themeMeta = document.querySelector("[data-theme-color]");

  function applyTheme(theme, animate) {
    if (animate) {
      root.classList.add("theme-anim");
      setTimeout(function () { root.classList.remove("theme-anim"); }, 450);
    }
    root.setAttribute("data-theme", theme);
    if (toggle) {
      var dark = theme === "dark";
      toggle.setAttribute("aria-pressed", String(dark));
      toggle.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
    }
    if (themeMeta) themeMeta.setAttribute("content", theme === "dark" ? "#121211" : "#F1F0EB");
    document.dispatchEvent(new CustomEvent("themechange", { detail: { theme: theme } }));
  }

  applyTheme(root.getAttribute("data-theme") === "dark" ? "dark" : "light", false);

  if (toggle) {
    toggle.addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      try { localStorage.setItem("theme", next); } catch (e) {}
      applyTheme(next, !reduceMotion.matches);
    });
  }

  // Follow the system setting live, unless the visitor picked one.
  if (window.matchMedia) {
    var sysDark = window.matchMedia("(prefers-color-scheme: dark)");
    var onSys = function (e) {
      var saved = null;
      try { saved = localStorage.getItem("theme"); } catch (err) {}
      if (saved !== "light" && saved !== "dark") applyTheme(e.matches ? "dark" : "light", true);
    };
    if (sysDark.addEventListener) sysDark.addEventListener("change", onSys);
  }

  /* ---------- Header: blur once the page scrolls ---------- */
  var header = document.querySelector(".header");
  function onScrollHeader() {
    if (header) header.classList.toggle("is-scrolled", window.scrollY > 8);
  }
  onScrollHeader();
  window.addEventListener("scroll", onScrollHeader, { passive: true });

  /* ---------- Custom cursor (fine pointers only) ---------- */
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  var cursor = document.querySelector(".cursor");

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  if (cursor && finePointer.matches && !reduceMotion.matches) {
    root.classList.add("has-cursor");
    var dot = cursor.querySelector(".cursor__dot");
    var ring = cursor.querySelector(".cursor__ring");
    var mx = -100, my = -100;
    var dx = mx, dy = my, rx = mx, ry = my;
    var ringScale = 1, targetScale = 1;

    window.addEventListener("mousemove", function (e) {
      mx = e.clientX;
      my = e.clientY;
      cursor.classList.remove("is-hidden");
    }, { passive: true });

    document.addEventListener("mouseleave", function () {
      cursor.classList.add("is-hidden");
    });

    document.addEventListener("mouseover", function (e) {
      var el = e.target.closest ? e.target.closest("a, button, [data-hover]") : null;
      var isText = !!(el && el.getAttribute("data-hover") === "text");
      targetScale = el ? (isText ? 2.6 : 1.8) : 1;
      ring.classList.toggle("is-hover", !!el && !isText);
      ring.classList.toggle("is-text", isText);
      var light = root.getAttribute("data-theme") !== "dark";
      var overDark = e.target.closest && (e.target.closest(".footer, .preloader, .about__art") || (light && e.target.closest(".marquee:not(.marquee--reverse)")));
      ring.classList.toggle("on-ink", !!overDark);
    });

    (function loop() {
      dx = lerp(dx, mx, 0.55);
      dy = lerp(dy, my, 0.55);
      rx = lerp(rx, mx, 0.16);
      ry = lerp(ry, my, 0.16);
      ringScale = lerp(ringScale, targetScale, 0.18);
      dot.style.transform = "translate3d(" + dx + "px," + dy + "px,0)";
      ring.style.transform = "translate3d(" + rx + "px," + ry + "px,0) scale(" + ringScale + ")";
      requestAnimationFrame(loop);
    })();
  }

  /* ---------- Magnetic links ---------- */
  if (finePointer.matches && !reduceMotion.matches) {
    document.querySelectorAll("[data-magnetic]").forEach(function (el) {
      var tx = 0, ty = 0, cx = 0, cy = 0, rafId = null;
      var strength = el.classList.contains("footer__talk") || el.classList.contains("btn") ? 0.35 : 0.55;

      function animate() {
        cx = lerp(cx, tx, 0.18);
        cy = lerp(cy, ty, 0.18);
        el.style.transform = "translate3d(" + cx.toFixed(2) + "px," + cy.toFixed(2) + "px,0)";
        if (Math.abs(cx - tx) > 0.1 || Math.abs(cy - ty) > 0.1) {
          rafId = requestAnimationFrame(animate);
        } else {
          rafId = null;
        }
      }

      function kick() {
        if (!rafId) rafId = requestAnimationFrame(animate);
      }

      el.addEventListener("mousemove", function (e) {
        var r = el.getBoundingClientRect();
        var max = 24;
        tx = Math.max(-max, Math.min(max, (e.clientX - (r.left + r.width / 2)) * strength));
        ty = Math.max(-max, Math.min(max, (e.clientY - (r.top + r.height / 2)) * strength));
        kick();
      });

      el.addEventListener("mouseleave", function () {
        tx = 0;
        ty = 0;
        kick();
      });
    });
  }

  /* ---------- 3D tilt on project cards ---------- */
  if (finePointer.matches && !reduceMotion.matches) {
    document.querySelectorAll(".card__link").forEach(function (link) {
      var world = link.querySelector(".card__world");
      if (!world) return;
      var rx = 0, ry = 0, trx = 0, try_ = 0, lift = 0, tlift = 0, raf = null;

      function draw() {
        rx = lerp(rx, trx, 0.14);
        ry = lerp(ry, try_, 0.14);
        lift = lerp(lift, tlift, 0.14);
        world.style.transform =
          "perspective(900px) translateY(" + (-6 * lift).toFixed(2) + "px) rotateX(" + rx.toFixed(2) + "deg) rotateY(" + ry.toFixed(2) + "deg)";
        world.style.setProperty("--gx", (50 + ry * 4).toFixed(1) + "%");
        world.style.setProperty("--gy", (50 - rx * 4).toFixed(1) + "%");
        if (Math.abs(rx - trx) > 0.01 || Math.abs(ry - try_) > 0.01 || Math.abs(lift - tlift) > 0.01) {
          raf = requestAnimationFrame(draw);
        } else {
          raf = null;
          if (tlift === 0) world.style.transform = "";
        }
      }
      function kick() {
        if (!raf) raf = requestAnimationFrame(draw);
      }

      link.addEventListener("mousemove", function (e) {
        var r = world.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        try_ = px * 14;
        trx = -py * 10;
        tlift = 1;
        link.classList.add("is-tilting");
        kick();
      });
      link.addEventListener("mouseleave", function () {
        trx = 0;
        try_ = 0;
        tlift = 0;
        link.classList.remove("is-tilting");
        kick();
      });
    });
  }

  /* ---------- Reveal on scroll ---------- */
  var revealables = document.querySelectorAll("[data-reveal], .section-head");

  if ("IntersectionObserver" in window && !reduceMotion.matches) {
    document.documentElement.classList.add("can-reveal");
    var revealObs = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            revealObs.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -15% 0px" }
    );
    revealables.forEach(function (el) {
      revealObs.observe(el);
    });
  }

  /* ---------- Smooth scroll (Lenis) driven by the GSAP ticker ---------- */
  var hasGsap = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";
  var lenis = null;

  if (hasGsap) {
    window.gsap.registerPlugin(window.ScrollTrigger);
  }

  if (hasGsap && typeof window.Lenis !== "undefined" && !reduceMotion.matches) {
    lenis = new window.Lenis({ duration: 1.1 });
    lenis.on("scroll", window.ScrollTrigger.update);
    window.gsap.ticker.add(function (time) {
      lenis.raf(time * 1000);
    });
    window.gsap.ticker.lagSmoothing(0);
  }

  // In-page links: let Lenis glide there, offset by the fixed header.
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener("click", function (e) {
      var id = link.getAttribute("href");
      if (id.length < 2) return;
      var target = document.querySelector(id);
      if (!target) return;
      if (lenis) {
        e.preventDefault();
        lenis.scrollTo(id === "#top" ? 0 : target, { offset: -64 });
      }
    });
  });

  /* ---------- Pinned horizontal gallery (desktop, GSAP) ---------- */
  var work = document.querySelector(".work");
  var track = work && work.querySelector(".work__track");
  var wide = window.matchMedia("(min-width: 900px) and (pointer: fine)");

  if (work && track && hasGsap && wide.matches && !reduceMotion.matches) {
    var gsap = window.gsap;
    work.classList.add("is-pinned");

    var distance = function () {
      return Math.max(0, track.scrollWidth - window.innerWidth);
    };

    var slide = gsap.to(track, {
      x: function () { return -distance(); },
      ease: "none",
      scrollTrigger: {
        trigger: work,
        start: "top top",
        end: function () { return "+=" + distance(); },
        pin: true,
        scrub: 1,
        invalidateOnRefresh: true
      }
    });

    // Each card's motif drifts against the slide for a bit of depth.
    work.querySelectorAll(".card__world").forEach(function (world) {
      gsap.fromTo(
        world.children,
        { xPercent: 6 },
        {
          xPercent: -6,
          ease: "none",
          scrollTrigger: {
            trigger: world,
            containerAnimation: slide,
            start: "left right",
            end: "right left",
            scrub: true
          }
        }
      );
    });

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { window.ScrollTrigger.refresh(); });
    }
  }

  /* ---------- About lead: reveal line by line ---------- */
  function splitLines(el) {
    var original = el.innerHTML;
    var words = [];

    // Collect words, remembering which ones sit inside a highlight.
    el.childNodes.forEach(function (node) {
      var isMark = node.nodeType === 1 && node.classList.contains("mark");
      var text = node.textContent;
      text.split(/(\s+)/).forEach(function (part) {
        if (part === "") return;
        words.push({ text: part, mark: isMark, space: /^\s+$/.test(part) });
      });
    });

    el.innerHTML = "";
    var spans = words.map(function (w) {
      if (w.space) {
        var sp = document.createTextNode(" ");
        el.appendChild(sp);
        return null;
      }
      var span = document.createElement("span");
      span.textContent = w.text;
      if (w.mark) span.className = "mark";
      el.appendChild(span);
      return span;
    });

    // Group words by their rendered line.
    var lines = [];
    var lastTop = null;
    spans.forEach(function (span) {
      if (!span) return;
      var top = span.offsetTop;
      if (lastTop === null || Math.abs(top - lastTop) > 4) {
        lines.push([]);
        lastTop = top;
      }
      lines[lines.length - 1].push(span);
    });

    el.innerHTML = "";
    var inners = lines.map(function (lineSpans) {
      var outer = document.createElement("span");
      outer.className = "split-line";
      var inner = document.createElement("span");
      lineSpans.forEach(function (span, i) {
        if (i > 0) inner.appendChild(document.createTextNode(" "));
        inner.appendChild(span);
      });
      outer.appendChild(inner);
      el.appendChild(outer);
      return inner;
    });

    return { inners: inners, restore: function () { el.innerHTML = original; } };
  }

  var lead = document.querySelector("[data-lines]");
  if (lead && hasGsap && !reduceMotion.matches) {
    var startSplit = function () {
      var split = splitLines(lead);
      window.gsap.from(split.inners, {
        yPercent: 105,
        duration: 0.9,
        ease: "power4.out",
        stagger: 0.08,
        scrollTrigger: { trigger: lead, start: "top 85%", once: true },
        onComplete: split.restore
      });
    };
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(startSplit);
    } else {
      startSplit();
    }
  }

  /* ---------- Live preview on hover (cards with data-preview="URL") ---------- */
  if (finePointer.matches) {
    document.querySelectorAll(".card__link[data-preview]").forEach(function (link) {
      var url = link.getAttribute("data-preview");
      var world = link.querySelector(".card__world");
      if (!url || !world) return;
      var box = null;

      link.addEventListener("mouseenter", function () {
        if (!box) {
          box = document.createElement("div");
          box.className = "card__preview";
          var frame = document.createElement("iframe");
          frame.src = url;
          frame.loading = "lazy";
          frame.tabIndex = -1;
          frame.title = "Live preview";
          frame.setAttribute("aria-hidden", "true");
          var badge = document.createElement("span");
          badge.className = "card__badge";
          badge.textContent = "LIVE";
          box.appendChild(frame);
          box.appendChild(badge);
          world.appendChild(box);
          var fit = function () {
            frame.style.transform = "scale(" + world.clientWidth / 1440 + ")";
          };
          fit();
          window.addEventListener("resize", fit);
        }
        requestAnimationFrame(function () { box.classList.add("is-on"); });
      });

      link.addEventListener("mouseleave", function () {
        if (box) box.classList.remove("is-on");
      });
    });
  }
})();
