/* ============================================================
   CERTIFICATES
   Seminars, webinars and certification exams.
   Edit this list to update the Certificates section.
   - type: "Seminar", "Webinar" or "Certification exam"
   - title, issuer (organizer), date: shown on the card
   - description: one or two short sentences
   - tags: short topic labels
   - images: one or more certificate images (jpg, png, svg or webp)
   - link: verification URL, or "" if there is none
   Shows 4 per page on desktop; Prev and Next flip through pages.
   ============================================================ */
var CERTIFICATES = [
  {
    type: "Seminar",
    title: "Seminar title",
    issuer: "Organizer",
    date: "Date",
    description: "What the seminar covered, in a line or two.",
    tags: ["Topic"],
    images: ["assets/certificates/placeholder-01.svg"],
    link: ""
  },
  {
    type: "Webinar",
    title: "Webinar title",
    issuer: "Organizer",
    date: "Date",
    description: "What the webinar covered, in a line or two.",
    tags: ["Topic"],
    images: ["assets/certificates/placeholder-02.svg"],
    link: ""
  },
  {
    type: "Certification exam",
    title: "Certification exam title",
    issuer: "Organizer",
    date: "Date",
    description: "What the exam tested, in a line or two.",
    tags: ["Topic"],
    images: ["assets/certificates/placeholder-03.svg"],
    link: ""
  },
  {
    type: "Seminar",
    title: "Seminar title",
    issuer: "Organizer",
    date: "Date",
    description: "What the seminar covered, in a line or two.",
    tags: ["Topic"],
    images: ["assets/certificates/placeholder-04.svg"],
    link: ""
  },
  {
    type: "Webinar",
    title: "Webinar title",
    issuer: "Organizer",
    date: "Date",
    description: "What the webinar covered, in a line or two.",
    tags: ["Topic"],
    images: ["assets/certificates/placeholder-05.svg"],
    link: ""
  },
  {
    type: "Certification exam",
    title: "Certification exam title",
    issuer: "Organizer",
    date: "Date",
    description: "What the exam tested, in a line or two.",
    tags: ["Topic"],
    images: ["assets/certificates/placeholder-06.svg"],
    link: ""
  },
  {
    type: "Seminar",
    title: "Seminar title",
    issuer: "Organizer",
    date: "Date",
    description: "What the seminar covered, in a line or two.",
    tags: ["Topic"],
    images: ["assets/certificates/placeholder-07.svg"],
    link: ""
  },
  {
    type: "Webinar",
    title: "Webinar title",
    issuer: "Organizer",
    date: "Date",
    description: "What the webinar covered, in a line or two.",
    tags: ["Topic"],
    images: ["assets/certificates/placeholder-08.svg"],
    link: ""
  }
];

/* ------------------------------------------------------------
   Rendering and interaction below; no need to edit.

   Layout, hover image fly-in, paging, decrypt title, tick sound
   and the mobile accordion are ported from the Projects section
   of samybit/portfolio, used under its license:

   MIT License

   Copyright (c) 2026 Samy Barsoum

   Permission is hereby granted, free of charge, to any person obtaining a copy
   of this software and associated documentation files (the "Software"), to deal
   in the Software without restriction, including without limitation the rights
   to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
   copies of the Software, and to permit persons to whom the Software is
   furnished to do so, subject to the following conditions:

   The above copyright notice and this permission notice shall be included in all
   copies or substantial portions of the Software.

   THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
   IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
   FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
   AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
   LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
   OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
   SOFTWARE.
   ------------------------------------------------------------ */
(function () {
  "use strict";

  var ITEMS_PER_PAGE = 4;
  var section = document.querySelector("[data-certs]");
  if (!section) return;

  var grid = section.querySelector("[data-certs-grid]");
  var pageEl = section.querySelector("[data-certs-page]");
  var prevBtn = section.querySelector("[data-certs-prev]");
  var nextBtn = section.querySelector("[data-certs-next]");
  var mobileList = section.querySelector("[data-certs-mobile]");
  var mobileCount = section.querySelector("[data-certs-count]");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  var desktop = window.matchMedia("(min-width: 1024px)");

  var certs = CERTIFICATES || [];
  var totalPages = Math.ceil(certs.length / ITEMS_PER_PAGE) || 1;
  var page = 0;

  var hovered = null; // { images, title, index }
  var slots = []; // the 4 visible grid cells

  /* ---------- helpers ---------- */
  function pad(n) {
    return n < 10 ? "0" + n : String(n);
  }

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function svgIcon(paths, size, cls) {
    var ns = "http://www.w3.org/2000/svg";
    var s = document.createElementNS(ns, "svg");
    s.setAttribute("viewBox", "0 0 24 24");
    s.setAttribute("width", size);
    s.setAttribute("height", size);
    s.setAttribute("fill", "none");
    s.setAttribute("stroke", "currentColor");
    s.setAttribute("stroke-width", "2");
    s.setAttribute("stroke-linecap", "round");
    s.setAttribute("stroke-linejoin", "round");
    s.setAttribute("aria-hidden", "true");
    if (cls) s.setAttribute("class", cls);
    paths.forEach(function (d) {
      var p = document.createElementNS(ns, "path");
      p.setAttribute("d", d);
      s.appendChild(p);
    });
    return s;
  }

  var ICON_EXTERNAL = ["M15 3h6v6", "M10 14 21 3", "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"];
  var ICON_BADGE = ["M12 15a7 7 0 1 0 0-14 7 7 0 0 0 0 14Z", "M8.2 13.9 7 23l5-3 5 3-1.2-9.1"];

  function subtitleOf(c) {
    return [c.type, c.issuer, c.date].filter(Boolean).join(" · ");
  }

  /* ---------- tick sound (C6 to E6 chime) ---------- */
  var audioCtx = null;
  function playTick() {
    try {
      if (!audioCtx) {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        audioCtx = new AC();
      }
      if (audioCtx.state === "suspended") audioCtx.resume();
      var now = audioCtx.currentTime;
      var tone = function (frequency, start, duration, volume) {
        var osc = audioCtx.createOscillator();
        var harmonic = audioCtx.createOscillator();
        var gain = audioCtx.createGain();
        osc.type = "triangle";
        harmonic.type = "sine";
        osc.frequency.value = frequency;
        harmonic.frequency.value = frequency * 2;
        osc.connect(gain);
        harmonic.connect(gain);
        gain.connect(audioCtx.destination);
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(volume, start + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
        osc.start(start);
        harmonic.start(start);
        osc.stop(start + duration);
        harmonic.stop(start + duration);
      };
      tone(1046.5, now, 0.12, 0.03);
      tone(1318.51, now + 0.05, 0.14, 0.025);
    } catch (e) {
      /* silently fail */
    }
  }

  /* ---------- decrypt title ---------- */
  var CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?";
  function decrypt(node) {
    var text = node.textContent;
    if (reduce.matches) return;
    var iteration = 0;
    var timer = setInterval(function () {
      node.textContent = text
        .split("")
        .map(function (letter, i) {
          if (letter === " ") return " ";
          if (i < iteration) return text[i];
          return CHARS[Math.floor(Math.random() * CHARS.length)];
        })
        .join("");
      if (iteration >= text.length) {
        clearInterval(timer);
        node.textContent = text;
      }
      iteration += 1 / 3;
    }, 30);
  }

  var decryptNodes = section.querySelectorAll("[data-decrypt]");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            decrypt(e.target);
            io.unobserve(e.target);
          }
        });
      },
      { rootMargin: "-10% 0px" }
    );
    decryptNodes.forEach(function (n) { io.observe(n); });
  }

  /* ---------- hover image fly-in on the other cards ---------- */
  var EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

  function overlayStart(cardIndex, hoveredIndex) {
    var deltaCol = (hoveredIndex % 2) - (cardIndex % 2);
    var deltaRow = Math.floor(hoveredIndex / 2) - Math.floor(cardIndex / 2);
    var x = deltaCol === 0 ? "0%" : deltaCol > 0 ? "105%" : "-105%";
    var y = deltaRow === 0 ? "0%" : deltaRow > 0 ? "105%" : "-105%";
    return "translate(" + x + ", " + y + ") scale(0.35)";
  }

  function imageFor(slotIndex) {
    if (!hovered || !hovered.images.length) return "";
    var i = slotIndex < hovered.index ? slotIndex : slotIndex - 1;
    // With fewer images than cards, repeat them instead of leaving gaps.
    return hovered.images[i % hovered.images.length] || "";
  }

  function fillOverlay(ov, src, title) {
    ov.innerHTML = "";
    if (src) {
      var img = el("img", "pc-hover__img");
      img.src = src;
      img.alt = "";
      img.decoding = "async";
      ov.appendChild(img);
    } else {
      var empty = el("div", "pc-hover__empty");
      empty.appendChild(el("span", null, "Image missing"));
      ov.appendChild(empty);
    }
    ov.setAttribute("data-title", title || "");
  }

  function syncOverlays() {
    slots.forEach(function (slot, i) {
      var want = hovered && hovered.index !== i;
      var ov = slot.overlay;
      if (want) {
        var src = imageFor(i);
        if (!ov) {
          ov = el("div", "pc-hover");
          ov.setAttribute("aria-hidden", "true");
          fillOverlay(ov, src, hovered.title);
          slot.box.appendChild(ov);
          slot.overlay = ov;
          slot.overlayFrom = overlayStart(i, hovered.index);
          if (!reduce.matches && ov.animate) {
            ov.animate(
              [{ transform: slot.overlayFrom, opacity: 0 }, { transform: "translate(0, 0) scale(1)", opacity: 1 }],
              { duration: 280, easing: EASE, fill: "both" }
            );
          }
        } else if (ov.getAttribute("data-title") !== hovered.title) {
          fillOverlay(ov, src, hovered.title);
        }
      } else if (ov) {
        slot.overlay = null;
        var from = overlayStart(i, hovered ? hovered.index : (slot.lastHovered || 0));
        if (!reduce.matches && ov.animate) {
          var a = ov.animate(
            [{ transform: "translate(0, 0) scale(1)", opacity: 1 }, { transform: slot.overlayFrom || from, opacity: 0 }],
            { duration: 280, easing: EASE, fill: "both" }
          );
          a.onfinish = function () { ov.remove(); };
        } else {
          ov.remove();
        }
      }
    });
  }

  function setHovered(next) {
    hovered = next;
    if (next) slots.forEach(function (s) { s.lastHovered = next.index; });
    syncOverlays();
  }

  /* ---------- desktop card ---------- */
  function linkButton(href, label, cls) {
    var a = el("a", "pc-btn " + (cls || ""));
    a.href = href;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    return a;
  }

  function buildLinks(c, mobile) {
    var row = el("div", mobile ? "mpc-actions" : "pc-links");
    if (c.link) {
      var verify = linkButton(c.link, "Verify", mobile ? "mpc-btn" : "");
      verify.appendChild(svgIcon(ICON_BADGE, mobile ? 16 : 20));
      verify.appendChild(document.createTextNode(" Verify"));
      verify.appendChild(el("span", "sr-only", " (opens in a new tab)"));
      row.appendChild(verify);
    }
    if (c.images && c.images[0]) {
      var view = linkButton(c.images[0], "View", mobile ? "mpc-btn" : "");
      var ns = "http://www.w3.org/2000/svg";
      var live = document.createElementNS(ns, "svg");
      live.setAttribute("viewBox", "0 0 16 16");
      live.setAttribute("class", "pc-live");
      live.setAttribute("aria-hidden", "true");
      var ping = document.createElementNS(ns, "circle");
      ping.setAttribute("cx", "8");
      ping.setAttribute("cy", "8");
      ping.setAttribute("r", "7");
      ping.setAttribute("class", "pc-live__ping");
      var dot = document.createElementNS(ns, "circle");
      dot.setAttribute("cx", "8");
      dot.setAttribute("cy", "8");
      dot.setAttribute("r", "3.5");
      live.appendChild(ping);
      live.appendChild(dot);
      view.appendChild(live);
      view.appendChild(document.createTextNode("View certificate "));
      view.appendChild(svgIcon(ICON_EXTERNAL, mobile ? 14 : 16, "pc-ext"));
      view.appendChild(el("span", "sr-only", " (opens in a new tab)"));
      row.appendChild(view);
    }
    if (!c.link && !(c.images && c.images[0])) {
      row.appendChild(el("span", "pc-offline", "[ Certificate pending ]"));
    }
    return row;
  }

  function buildCard(c, slotIndex) {
    var wrap = el("div", "pc-anim");
    var box = el("div", "pc");

    var body = el("div", "pc-body");
    var main = el("div", "pc-main");
    var top = el("div", "pc-top");
    top.appendChild(el("h3", "pc-title", c.title));
    var sub = el("div", "pc-sub");
    sub.appendChild(el("span", "pc-chip", subtitleOf(c)));
    top.appendChild(sub);
    top.appendChild(el("div", "pc-desc", c.description));
    main.appendChild(top);

    var tags = el("div", "pc-tags");
    (c.tags || []).forEach(function (t) { tags.appendChild(el("span", "pc-tag", t)); });
    main.appendChild(tags);
    body.appendChild(main);
    box.appendChild(body);
    box.appendChild(buildLinks(c, false));

    box.addEventListener("mouseenter", function () {
      if (desktop.matches) setHovered({ images: c.images || [], title: c.title + slotIndex, index: slotIndex });
    });
    box.addEventListener("mouseleave", function () {
      if (desktop.matches) setHovered(null);
    });

    wrap.appendChild(box);
    return { wrap: wrap, box: box };
  }

  function buildPlaceholder(slotIndex) {
    var wrap = el("div", "pc-anim");
    var box = el("div", "pc pc--slot");
    box.setAttribute("aria-hidden", "true");
    box.appendChild(el("div", "pc-slot__label", "[ Blueprint slot " + pad(slotIndex + 1) + " ]"));
    wrap.appendChild(box);
    return { wrap: wrap, box: box };
  }

  function renderPage() {
    hovered = null;
    grid.innerHTML = "";
    slots = [];
    var current = certs.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);
    for (var i = 0; i < ITEMS_PER_PAGE; i++) {
      var built = i < current.length ? buildCard(current[i], i) : buildPlaceholder(i);
      slots.push({ box: built.box, overlay: null });
      grid.appendChild(built.wrap);
    }
    if (pageEl) pageEl.textContent = "[ Page " + pad(page + 1) + " / " + pad(totalPages) + " ]";
  }

  function nextSlide() {
    playTick();
    page = (page + 1) % totalPages;
    renderPage();
  }

  function prevSlide() {
    playTick();
    page = (page - 1 + totalPages) % totalPages;
    renderPage();
  }

  prevBtn.addEventListener("click", prevSlide);
  nextBtn.addEventListener("click", nextSlide);

  /* ---------- mobile accordion ---------- */
  var expandedIndex = null;
  var mobileCards = [];

  function buildMobileCard(c, index) {
    var images = (c.images || []).filter(Boolean);
    var active = 0;

    var card = el("div", "mpc");
    var head = el("button", "mpc-head");
    head.type = "button";
    head.setAttribute("aria-expanded", "false");

    var thumb = el("div", "mpc-thumb");
    if (images[0]) {
      var t = el("img", "mpc-thumb__img");
      t.src = images[0];
      t.alt = c.title;
      t.loading = "lazy";
      thumb.appendChild(t);
    } else {
      var none = el("div", "mpc-thumb__none");
      none.appendChild(el("span", null, "No Img"));
      thumb.appendChild(none);
    }
    thumb.appendChild(el("span", "mpc-index", pad(index + 1)));
    head.appendChild(thumb);

    var info = el("div", "mpc-info");
    info.appendChild(el("span", "mpc-title", c.title));
    info.appendChild(el("span", "mpc-sub", subtitleOf(c)));
    var qt = el("div", "mpc-qtags");
    (c.tags || []).forEach(function (tg) { qt.appendChild(el("span", "mpc-qtag", tg)); });
    info.appendChild(qt);
    head.appendChild(info);

    var chev = el("div", "mpc-chev");
    var ns = "http://www.w3.org/2000/svg";
    var cs = document.createElementNS(ns, "svg");
    cs.setAttribute("viewBox", "0 0 16 16");
    cs.setAttribute("width", "16");
    cs.setAttribute("height", "16");
    cs.setAttribute("aria-hidden", "true");
    var cp = document.createElementNS(ns, "path");
    cp.setAttribute("d", "M3 6l5 5 5-5");
    cs.appendChild(cp);
    chev.appendChild(cs);
    head.appendChild(chev);
    card.appendChild(head);

    // Expanded panel
    var panel = el("div", "mpc-panel");
    panel.hidden = true;
    var inner = el("div", "mpc-panel__inner");

    if (images.length) {
      var gallery = el("div", "mpc-gallery");
      var gimg = el("img", "mpc-gallery__img");
      gimg.alt = c.title + " certificate 1";
      gimg.src = images[0];
      gallery.appendChild(gimg);

      var setImage = function (n) {
        active = (n + images.length) % images.length;
        gimg.src = images[active];
        gimg.alt = c.title + " certificate " + (active + 1);
        if (counter) counter.textContent = active + 1 + " / " + images.length;
        dots.forEach(function (d, di) { d.classList.toggle("is-active", di === active); });
        if (gimg.animate && !reduce.matches) {
          gimg.animate([{ opacity: 0, transform: "scale(0.97)" }, { opacity: 1, transform: "scale(1)" }], { duration: 200 });
        }
      };

      var counter = null;
      var dots = [];
      if (images.length > 1) {
        var prev = el("button", "mpc-arrow mpc-arrow--prev");
        prev.type = "button";
        prev.setAttribute("aria-label", "Previous image");
        prev.appendChild(svgIcon(["m15 18-6-6 6-6"], 18));
        var next = el("button", "mpc-arrow mpc-arrow--next");
        next.type = "button";
        next.setAttribute("aria-label", "Next image");
        next.appendChild(svgIcon(["m9 18 6-6-6-6"], 18));
        prev.addEventListener("click", function (e) { e.stopPropagation(); playTick(); setImage(active - 1); });
        next.addEventListener("click", function (e) { e.stopPropagation(); playTick(); setImage(active + 1); });
        gallery.appendChild(prev);
        gallery.appendChild(next);
        counter = el("div", "mpc-counter", "1 / " + images.length);
        gallery.appendChild(counter);
        var dotRow = el("div", "mpc-dots");
        images.forEach(function (_, di) {
          var d = el("button", "mpc-dot" + (di === 0 ? " is-active" : ""));
          d.type = "button";
          d.setAttribute("aria-label", "Jump to image " + (di + 1));
          d.addEventListener("click", function (e) { e.stopPropagation(); playTick(); setImage(di); });
          dots.push(d);
          dotRow.appendChild(d);
        });
        gallery.appendChild(dotRow);

        // swipe
        var sx = null;
        gallery.addEventListener("pointerdown", function (e) { sx = e.clientX; });
        gallery.addEventListener("pointerup", function (e) {
          if (sx === null) return;
          var dx = e.clientX - sx;
          sx = null;
          if (dx < -30) setImage(active + 1);
          else if (dx > 30) setImage(active - 1);
        });
      }
      inner.appendChild(gallery);
    }

    var details = el("div", "mpc-details");
    var ov = el("div");
    ov.appendChild(el("h4", "mpc-label", "Overview"));
    ov.appendChild(el("p", "mpc-desc", c.description));
    details.appendChild(ov);

    if (c.tags && c.tags.length) {
      var tagWrap = el("div", "mpc-tagwrap");
      tagWrap.appendChild(el("h4", "mpc-label", "Topics"));
      var tagRow = el("div", "mpc-tags");
      c.tags.forEach(function (tg) { tagRow.appendChild(el("span", "mpc-tag", tg)); });
      tagWrap.appendChild(tagRow);
      details.appendChild(tagWrap);
    }
    details.appendChild(buildLinks(c, true));
    inner.appendChild(details);
    panel.appendChild(inner);
    card.appendChild(panel);

    function setOpen(open, animate) {
      card.classList.toggle("is-expanded", open);
      head.setAttribute("aria-expanded", String(open));
      if (open) {
        panel.hidden = false;
        if (animate && panel.animate && !reduce.matches) {
          var h = panel.scrollHeight;
          panel.animate([{ height: "0px", opacity: 0 }, { height: h + "px", opacity: 1 }], { duration: 280, easing: EASE });
        }
      } else if (!panel.hidden) {
        if (animate && panel.animate && !reduce.matches) {
          var h2 = panel.scrollHeight;
          var a = panel.animate([{ height: h2 + "px", opacity: 1 }, { height: "0px", opacity: 0 }], { duration: 280, easing: EASE });
          a.onfinish = function () { panel.hidden = true; };
        } else {
          panel.hidden = true;
        }
      }
    }

    head.addEventListener("click", function () {
      var willOpen = expandedIndex !== index;
      mobileCards.forEach(function (m, mi) { if (mi !== index) m.setOpen(false, true); });
      expandedIndex = willOpen ? index : null;
      setOpen(willOpen, true);
    });

    return { node: card, setOpen: setOpen };
  }

  if (mobileList) {
    certs.forEach(function (c, i) {
      var m = buildMobileCard(c, i);
      mobileCards.push(m);
      mobileList.appendChild(m.node);
    });
  }
  if (mobileCount) mobileCount.textContent = certs.length + " Certificates";

  renderPage();
})();
