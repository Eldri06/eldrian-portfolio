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

  function phHour(date) {
    try {
      return parseInt(
        date.toLocaleString("en-GB", { timeZone: TZ, hour: "2-digit", hour12: false }),
        10
      );
    } catch (e) {
      return date.getHours();
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

  /* ---------- Greeting by time of day ---------- */
  var greet = document.querySelector("[data-greeting]");
  if (greet) {
    var h = phHour(new Date());
    greet.textContent =
      h < 12 ? "Good morning, welcome" : h < 18 ? "Good afternoon, welcome" : "Good evening, welcome";
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

  if (!preloader || reduceMotion.matches) {
    if (preloader) preloader.classList.add("is-gone");
    ready();
  } else {
    var start = null;
    var DURATION = 1400;
    var step = function (now) {
      if (start === null) start = now;
      var t = Math.min(1, (now - start) / DURATION);
      var eased = 1 - Math.pow(1 - t, 3);
      countEl.textContent = pad3(Math.round(eased * 100));
      if (t < 1) {
        requestAnimationFrame(step);
      } else {
        preloader.classList.add("is-done");
        setTimeout(ready, 250);
        setTimeout(function () { preloader.classList.add("is-gone"); }, 950);
      }
    };
    requestAnimationFrame(step);
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
      ring.classList.toggle("on-ink", !!(e.target.closest && e.target.closest(".footer, .marquee, .preloader")));
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
})();
