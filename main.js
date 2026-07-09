/* MundaneApps: minimal progressive enhancement. No dependencies, no tracking. */
(function () {
  "use strict";

  // Header border/background on scroll.
  var header = document.querySelector(".site-header");
  if (header) {
    var onScroll = function () {
      header.classList.toggle("scrolled", window.scrollY > 8);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  // Mobile nav toggle.
  var toggle = document.querySelector(".nav-toggle");
  var links = document.querySelector(".nav-links");
  if (toggle && links) {
    toggle.addEventListener("click", function () {
      var open = links.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    links.addEventListener("click", function (e) {
      // Follow real links closes the mobile menu; the Products button does not.
      if (e.target.closest("a")) links.classList.remove("open");
    });
  }

  // Products dropdown: click to open, stays open until dismissed.
  var item = document.querySelector(".nav-item");
  var trigger = item ? item.querySelector(".nav-trigger") : null;
  if (item && trigger) {
    var setOpen = function (open) {
      item.classList.toggle("open", open);
      trigger.setAttribute("aria-expanded", open ? "true" : "false");
    };
    trigger.addEventListener("click", function (e) {
      e.stopPropagation();
      setOpen(!item.classList.contains("open"));
    });
    document.addEventListener("click", function (e) {
      if (!item.contains(e.target)) setOpen(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") setOpen(false);
    });
  }

  // Horizontal accordion: the clicked panel expands, the rest fold.
  // One panel stays open at all times.
  var accordion = document.getElementById("about-accordion");
  if (accordion) {
    var folds = Array.prototype.slice.call(accordion.querySelectorAll(".hfold"));
    folds.forEach(function (fold) {
      fold.addEventListener("click", function () {
        folds.forEach(function (f) {
          f.classList.remove("expanded");
          f.setAttribute("aria-expanded", "false");
        });
        fold.classList.add("expanded");
        fold.setAttribute("aria-expanded", "true");
      });
    });
  }

  // Inner-circle signup, posts to the Worker; calm inline states.
  // WORKER_URL is a placeholder until the Cloudflare Worker (Phase 1) is deployed.
  var WORKER_URL = "";
  var joinForms = document.querySelectorAll("form.join-form");
  Array.prototype.forEach.call(joinForms, function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var status = form.querySelector(".join-status");
      var btn = form.querySelector("button[type=submit]");
      var email = (form.querySelector("input[type=email]") || {}).value || "";
      var idea = (form.querySelector("textarea[name=idea]") || {}).value || "";
      var honey = (form.querySelector("input[name=company]") || {}).value || "";

      if (!WORKER_URL) {
        if (status) {
          status.textContent = "Signups open shortly. Email info@mundaneapps.com and we'll add you to the inner circle by hand.";
          status.className = "join-status err";
        }
        return;
      }

      if (status) { status.textContent = ""; status.className = "join-status"; }
      if (btn) { btn.disabled = true; btn.dataset.label = btn.textContent; btn.textContent = "Joining…"; }
      fetch(WORKER_URL, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email, idea: idea, company: honey, source: form.dataset.source || "site" }),
      }).then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
        .then(function (res) {
          if (res.ok && res.d.ok) {
            form.classList.add("joined");
            if (status) { status.textContent = "You're in. Welcome to the circle. Check your inbox."; status.classList.add("ok"); }
          } else {
            var msg = res.d.error === "invalid_email" ? "That email doesn't look right."
                    : res.d.error === "rate_limited" ? "Give it a moment and try again."
                    : "Something hiccuped. Email info@mundaneapps.com and we'll add you.";
            if (status) { status.textContent = msg; status.classList.add("err"); }
          }
        })
        .catch(function () {
          if (status) { status.textContent = "Network hiccup. Email info@mundaneapps.com and we'll add you."; status.classList.add("err"); }
        })
        .finally(function () { if (btn) { btn.disabled = false; btn.textContent = btn.dataset.label || "Join"; } });
    });
  });

  // Scroll-reveal: honor reduced-motion.
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var revealEls = document.querySelectorAll(".reveal");
  if (reduce || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
  }
})();
