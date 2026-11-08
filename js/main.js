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

  /* ---------- Pinned horizontal gallery (desktop only) ---------- */
  var work = document.querySelector(".work");
  var sticky = work && work.querySelector(".work__sticky");
  var track = work && work.querySelector(".work__track");
  var wide = window.matchMedia("(min-width: 900px) and (pointer: fine)");

  var distance = 0;
  var running = false;
  var inView = false;

  function measure() {
    if (!work.classList.contains("is-pinned")) return;
    distance = Math.max(0, track.scrollWidth - window.innerWidth);
    work.style.height = sticky.offsetHeight + distance + "px";
  }

  function frame() {
    if (!inView) {
      running = false;
      return;
    }
    var rect = work.getBoundingClientRect();
    var total = work.offsetHeight - sticky.offsetHeight;
    var progress = total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 0;
    track.style.transform = "translate3d(" + -progress * distance + "px, 0, 0)";
    requestAnimationFrame(frame);
  }

  function startLoop() {
    if (!running) {
      running = true;
      requestAnimationFrame(frame);
    }
  }

  function setPinned() {
    var shouldPin = wide.matches && !reduceMotion.matches;
    work.classList.toggle("is-pinned", shouldPin);
    if (shouldPin) {
      measure();
    } else {
      work.style.height = "";
      track.style.transform = "";
    }
  }

  if (work && sticky && track && "IntersectionObserver" in window) {
    var pinObs = new IntersectionObserver(function (entries) {
      inView = entries[0].isIntersecting;
      if (inView && work.classList.contains("is-pinned")) startLoop();
    });
    pinObs.observe(work);

    setPinned();
    window.addEventListener("resize", measure);
    if (wide.addEventListener) {
      wide.addEventListener("change", setPinned);
      reduceMotion.addEventListener("change", setPinned);
    }
    // Fonts change card widths, so measure again once they load.
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
  }
})();
