/* ============================================================
   CERTIFICATES
   Edit this list to update the Certificates section.
   - type: "Award", "Academic" or "Certification"
   - title, issuer, date: shown on the card
   - description: one or two short sentences
   - tags: short labels
   - image: path to the certificate image (jpg, png, svg or webp)
   - link: verification URL, or "" if there is none
   Shows 4 per page on desktop; Prev and Next flip through pages.
   ============================================================ */
var CERTIFICATES = [
  {
    type: "Award",
    title: "Champion, WebDev Competition",
    issuer: "Department Academic Festival, UM Tagum College",
    date: "[Year]",
    description: "First place in the department's web development competition.",
    tags: ["Web development", "Competition"],
    image: "assets/certificates/webdev-champion.svg",
    link: ""
  },
  {
    type: "Award",
    title: "Best Website",
    issuer: "Department Academic Festival, UM Tagum College",
    date: "[Year]",
    description: "Recognized for the best overall website at the festival.",
    tags: ["Web design"],
    image: "assets/certificates/best-website.svg",
    link: ""
  },
  {
    type: "Award",
    title: "Best Presenter",
    issuer: "Department Academic Festival, UM Tagum College",
    date: "[Year]",
    description: "Recognized for presenting the project to the judges.",
    tags: ["Presentation"],
    image: "assets/certificates/best-presenter.svg",
    link: ""
  },
  {
    type: "Academic",
    title: "Dean's Lister",
    issuer: "UM Tagum College",
    date: "2023–2024",
    description: "Made the Dean's List during first year of BSIT.",
    tags: ["Academics"],
    image: "assets/certificates/deans-lister.svg",
    link: ""
  },
  {
    type: "Award",
    title: "Work Immersion Awardee",
    issuer: "Tagum City National High School",
    date: "2023",
    description: "Recognized for work immersion performance in senior high school.",
    tags: ["Senior high"],
    image: "assets/certificates/work-immersion.svg",
    link: ""
  },
  {
    type: "Certification",
    title: "In progress…",
    issuer: "Next certification",
    date: "Soon",
    description: "Working on this one. It shows up here once it's done.",
    tags: [],
    image: "assets/certificates/slot-06.svg",
    link: ""
  },
  {
    type: "Certification",
    title: "In progress…",
    issuer: "Next certification",
    date: "Soon",
    description: "Working on this one. It shows up here once it's done.",
    tags: [],
    image: "assets/certificates/slot-07.svg",
    link: ""
  },
  {
    type: "Certification",
    title: "In progress…",
    issuer: "Next certification",
    date: "Soon",
    description: "Working on this one. It shows up here once it's done.",
    tags: [],
    image: "assets/certificates/slot-08.svg",
    link: ""
  }
];

/* ------------------------------------------------------------
   Rendering and interaction below; no need to edit.
   ------------------------------------------------------------ */
(function () {
  "use strict";

  var PER_PAGE = 4;
  var section = document.querySelector("[data-certs]");
  if (!section) return;
  var grid = section.querySelector("[data-certs-grid]");
  var pageEl = section.querySelector("[data-certs-page]");
  var prevBtn = section.querySelector("[data-certs-prev]");
  var nextBtn = section.querySelector("[data-certs-next]");
  var dialog = document.querySelector("[data-cert-dialog]");
  var wide = window.matchMedia("(min-width: 900px)");
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  var list = CERTIFICATES || [];
  var pages = Math.max(1, Math.ceil(list.length / PER_PAGE));
  var page = 0;
  var cards = [];

  function pad(n) {
    return n < 10 ? "0" + n : String(n);
  }

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function btn(cls, text, label) {
    var b = el("button", "cert__btn " + (cls || ""), text);
    b.type = "button";
    if (label) b.setAttribute("aria-label", label);
    return b;
  }

  /* ---------- Full-size viewer ---------- */
  var lastFocus = null;
  function openDialog(c, from) {
    if (!dialog) {
      window.open(c.image, "_blank", "noopener");
      return;
    }
    lastFocus = from;
    dialog.querySelector("[data-cert-dialog-img]").src = c.image;
    dialog.querySelector("[data-cert-dialog-img]").alt = c.title + " certificate from " + c.issuer;
    dialog.querySelector("[data-cert-dialog-title]").textContent = c.title;
    dialog.querySelector("[data-cert-dialog-meta]").textContent = c.issuer + " · " + c.date;
    var open = dialog.querySelector("[data-cert-dialog-open]");
    open.href = c.link || c.image;
    open.textContent = c.link ? "Verify ↗" : "Open image ↗";
    if (dialog.showModal) dialog.showModal();
    else dialog.setAttribute("open", "");
  }
  if (dialog) {
    dialog.querySelector("[data-cert-dialog-close]").addEventListener("click", function () {
      dialog.close();
    });
    dialog.addEventListener("click", function (e) {
      if (e.target === dialog) dialog.close();
    });
    dialog.addEventListener("close", function () {
      if (lastFocus) lastFocus.focus({ preventScroll: true });
    });
  }

  /* ---------- Cards ---------- */
  function buildCard(c, i) {
    var li = el("li", "cert");
    var tilt = el("div", "cert__tilt");
    var flip = el("div", "cert__flip");

    // Front: details
    var front = el("article", "cert__face cert__front");
    var top = el("div", "cert__top");
    top.appendChild(el("span", "cert__num", pad(i + 1)));
    top.appendChild(el("span", "cert__type", c.type || "Certificate"));
    top.appendChild(el("span", "cert__date", c.date || ""));
    front.appendChild(top);

    var body = el("div", "cert__body");
    body.appendChild(el("h3", "cert__title", c.title));
    body.appendChild(el("span", "cert__issuer", c.issuer));
    body.appendChild(el("p", "cert__desc", c.description));
    if (c.tags && c.tags.length) {
      var tags = el("div", "cert__tags");
      c.tags.forEach(function (t) {
        tags.appendChild(el("span", "cert__tag", t));
      });
      body.appendChild(tags);
    }
    front.appendChild(body);

    var bar = el("div", "cert__bar");
    var flipBtn = btn("", "Flip ↻", "Flip to see the " + c.title + " certificate");
    var viewBtn = btn("cert__btn--solid", "View", "Open the " + c.title + " certificate full size");
    bar.appendChild(flipBtn);
    bar.appendChild(viewBtn);
    if (c.link) {
      var a = el("a", "cert__btn cert__btn--link", "Verify ↗");
      a.href = c.link;
      a.target = "_blank";
      a.rel = "noopener";
      bar.appendChild(a);
    }
    front.appendChild(bar);

    // Back: the certificate itself
    var back = el("div", "cert__face cert__back");
    var img = el("img", "cert__img");
    img.src = c.image;
    img.alt = c.title + " certificate from " + c.issuer;
    img.loading = "lazy";
    img.decoding = "async";
    back.appendChild(img);
    var backBar = el("div", "cert__backbar");
    var flipBack = btn("", "Flip back ↺");
    var viewBack = btn("cert__btn--solid", "Full size ↗");
    backBar.appendChild(flipBack);
    backBar.appendChild(viewBack);
    back.appendChild(backBar);
    back.setAttribute("aria-hidden", "true");
    back.inert = true;

    flip.appendChild(front);
    flip.appendChild(back);
    tilt.appendChild(flip);
    li.appendChild(tilt);

    function setFlipped(on, focus) {
      li.classList.toggle("is-flipped", on);
      back.setAttribute("aria-hidden", String(!on));
      front.setAttribute("aria-hidden", String(on));
      back.inert = !on;
      front.inert = on;
      if (focus) (on ? flipBack : flipBtn).focus({ preventScroll: true });
    }
    flipBtn.addEventListener("click", function () { setFlipped(true, true); });
    flipBack.addEventListener("click", function () { setFlipped(false, true); });
    viewBtn.addEventListener("click", function () { openDialog(c, viewBtn); });
    viewBack.addEventListener("click", function () { openDialog(c, viewBack); });

    // 3D tilt toward the mouse
    if (fine.matches && !reduce.matches) {
      var rx = 0, ry = 0, tx = 0, ty = 0, raf = null;
      var frame = function () {
        rx += (tx - rx) * 0.14;
        ry += (ty - ry) * 0.14;
        tilt.style.transform = "rotateX(" + rx.toFixed(2) + "deg) rotateY(" + ry.toFixed(2) + "deg)";
        if (Math.abs(rx - tx) > 0.02 || Math.abs(ry - ty) > 0.02) raf = requestAnimationFrame(frame);
        else raf = null;
      };
      var kick = function () {
        if (!raf) raf = requestAnimationFrame(frame);
      };
      li.addEventListener("mousemove", function (e) {
        var r = li.getBoundingClientRect();
        ty = ((e.clientX - r.left) / r.width - 0.5) * 10;
        tx = -((e.clientY - r.top) / r.height - 0.5) * 8;
        kick();
      });
      li.addEventListener("mouseleave", function () {
        tx = 0;
        ty = 0;
        kick();
      });
    }

    return { li: li, unflip: function () { setFlipped(false, false); } };
  }

  list.forEach(function (c, i) {
    var card = buildCard(c, i);
    cards.push(card);
    grid.appendChild(card.li);
  });

  // Empty slots so the last page always shows a full 2x2 grid.
  var slots = [];
  var need = pages * PER_PAGE - list.length;
  for (var s = 0; s < need; s++) {
    var slot = el("li", "cert cert--slot");
    slot.setAttribute("aria-hidden", "true");
    slot.appendChild(el("span", "cert__slot-label", "[ Slot " + pad(list.length + s + 1) + " ]"));
    grid.appendChild(slot);
    slots.push(slot);
  }

  /* ---------- Paging ---------- */
  function show(n, animate) {
    page = (n + pages) % pages;
    var paged = wide.matches;
    var start = page * PER_PAGE;
    var items = grid.children;
    for (var i = 0; i < items.length; i++) {
      var on = !paged || (i >= start && i < start + PER_PAGE);
      items[i].hidden = !on;
      items[i].classList.remove("is-dealing");
      if (on && animate && paged && !reduce.matches) {
        items[i].style.setProperty("--d", (i - start) * 70 + "ms");
        void items[i].offsetWidth; // restart the animation
        items[i].classList.add("is-dealing");
      }
    }
    cards.forEach(function (c) { c.unflip(); });
    if (pageEl) pageEl.textContent = "[ Page " + pad(page + 1) + " / " + pad(pages) + " ]";
    section.classList.toggle("is-single", pages < 2);
  }

  prevBtn.addEventListener("click", function () { show(page - 1, true); });
  nextBtn.addEventListener("click", function () { show(page + 1, true); });

  // Arrow keys page through while focus is inside the section.
  section.addEventListener("keydown", function (e) {
    if (!wide.matches || (dialog && dialog.open)) return;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      if (e.target.closest && e.target.closest(".cert__btn, .certs__nav button")) {
        e.preventDefault();
        show(page + 1, true);
      }
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      if (e.target.closest && e.target.closest(".cert__btn, .certs__nav button")) {
        e.preventDefault();
        show(page - 1, true);
      }
    }
  });

  if (wide.addEventListener) {
    wide.addEventListener("change", function () { show(page, false); });
  }

  show(0, false);
  section.classList.add("is-ready");
})();
