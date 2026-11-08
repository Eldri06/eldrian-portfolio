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
})();
