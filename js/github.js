/* Live GitHub numbers, pulled from the public API when the page loads.
   No token: GitHub allows 60 requests an hour per visitor, so results are
   cached for 30 minutes in sessionStorage. */
(function () {
  "use strict";

  var section = document.querySelector("[data-github]");
  if (!section) return;

  var USER = section.getAttribute("data-github");
  var CACHE_KEY = "gh-stats-" + USER;
  var CACHE_MS = 30 * 60 * 1000;
  var MAX_LANGS = 5;

  var $ = function (key) {
    return section.querySelector('[data-gh="' + key + '"]');
  };
  var status = section.querySelector("[data-gh-status]");

  function readCache() {
    try {
      var raw = sessionStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      var data = JSON.parse(raw);
      return Date.now() - data.at < CACHE_MS ? data : null;
    } catch (e) {
      return null;
    }
  }

  function writeCache(data) {
    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(data));
    } catch (e) {
      /* private mode or storage full: just skip caching */
    }
  }

  function getJSON(url) {
    return fetch(url, { headers: { Accept: "application/vnd.github+json" } }).then(function (res) {
      if (!res.ok) {
        var err = new Error("GitHub " + res.status);
        err.status = res.status;
        throw err;
      }
      return res.json();
    });
  }

  function timeAgo(iso) {
    var diff = Date.now() - new Date(iso).getTime();
    var day = 86400000;
    if (diff < 3600000) return "within the hour";
    if (diff < day) return Math.round(diff / 3600000) + "h ago";
    var days = Math.round(diff / day);
    if (days === 1) return "yesterday";
    if (days < 30) return days + " days ago";
    var months = Math.round(days / 30);
    if (months < 12) return months + (months === 1 ? " month ago" : " months ago");
    var years = Math.round(days / 365);
    return years + (years === 1 ? " year ago" : " years ago");
  }

  function summarize(user, repos) {
    var own = repos.filter(function (r) { return !r.fork; });
    var yearAgo = Date.now() - 365 * 86400000;

    var counts = {};
    own.forEach(function (r) {
      if (r.language) counts[r.language] = (counts[r.language] || 0) + 1;
    });
    var langs = Object.keys(counts)
      .map(function (k) { return { name: k, count: counts[k] }; })
      .sort(function (a, b) { return b.count - a.count || a.name.localeCompare(b.name); });

    // Fold the tail into "Other" instead of inventing more bars.
    if (langs.length > MAX_LANGS) {
      var rest = langs.slice(MAX_LANGS - 1).reduce(function (n, l) { return n + l.count; }, 0);
      langs = langs.slice(0, MAX_LANGS - 1).concat([{ name: "Other", count: rest }]);
    }

    var latest = own.slice().sort(function (a, b) {
      return new Date(b.pushed_at) - new Date(a.pushed_at);
    })[0];

    return {
      at: Date.now(),
      repos: user.public_repos,
      followers: user.followers,
      active: own.filter(function (r) { return new Date(r.pushed_at).getTime() > yearAgo; }).length,
      langs: langs,
      total: langs.reduce(function (n, l) { return n + l.count; }, 0),
      last: latest ? { name: latest.name, url: latest.html_url, when: latest.pushed_at } : null
    };
  }

  function pad(n) {
    return n < 10 ? "0" + n : String(n);
  }

  function render(d) {
    $("repos").textContent = pad(d.repos);
    $("followers").textContent = pad(d.followers);
    $("active").textContent = pad(d.active);

    if (d.last) {
      $("last-when").textContent = timeAgo(d.last.when);
      var link = $("last-repo");
      link.textContent = "to " + d.last.name + " ↗";
      link.href = d.last.url;
    }

    var list = $("langs");
    list.innerHTML = "";
    var max = d.langs.length ? d.langs[0].count : 1;
    d.langs.forEach(function (l) {
      var share = Math.round((l.count / d.total) * 100);
      var li = document.createElement("li");
      li.className = "gh__bar";
      li.tabIndex = 0;
      li.setAttribute("aria-label", l.name + ": " + l.count + (l.count === 1 ? " repo" : " repos") + ", " + share + " percent");
      li.innerHTML =
        '<span class="gh__name"></span>' +
        '<span class="gh__track" aria-hidden="true"><span class="gh__fill"></span></span>' +
        '<span class="gh__count" aria-hidden="true"><span class="gh__plain"></span><span class="gh__share"></span></span>';
      li.querySelector(".gh__name").textContent = l.name;
      li.querySelector(".gh__fill").style.setProperty("--w", Math.max(4, (l.count / max) * 100) + "%");
      li.querySelector(".gh__plain").textContent = l.count + (l.count === 1 ? " repo" : " repos");
      li.querySelector(".gh__share").textContent = share + "% of repos";
      list.appendChild(li);
    });

    if (!d.langs.length) {
      list.innerHTML = '<li class="label">No language data yet.</li>';
    }

    var t = new Date(d.at);
    status.textContent = "Live from github.com/" + USER + ", updated " +
      t.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    section.classList.add("is-live");
  }

  function fail(err) {
    var msg = err && err.status === 403
      ? "GitHub's hourly limit was reached. Try again later, or "
      : "Couldn't reach GitHub right now. ";
    status.innerHTML = "";
    status.appendChild(document.createTextNode(msg));
    var a = document.createElement("a");
    a.href = "https://github.com/" + USER;
    a.target = "_blank";
    a.rel = "noopener";
    a.textContent = "see the profile ↗";
    status.appendChild(a);
    status.parentNode.classList.add("gh__error");
    var list = $("langs");
    list.innerHTML = "";
  }

  function load() {
    var cached = readCache();
    if (cached) {
      render(cached);
      return;
    }
    Promise.all([
      getJSON("https://api.github.com/users/" + USER),
      getJSON("https://api.github.com/users/" + USER + "/repos?per_page=100&sort=pushed")
    ])
      .then(function (res) {
        var data = summarize(res[0], res[1]);
        writeCache(data);
        render(data);
      })
      .catch(fail);
  }

  // Wait until the section is close to view so the bars animate when seen.
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) {
        io.disconnect();
        load();
      }
    }, { rootMargin: "300px 0px" });
    io.observe(section);
  } else {
    load();
  }
})();
