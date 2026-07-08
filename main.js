/* MundaneApps — minimal progressive enhancement. No dependencies, no tracking. */
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
      // Close the mobile menu when a real link is followed, but not when the
      // Products trigger (a button) is tapped.
      if (e.target.closest("a")) links.classList.remove("open");
    });
  }

  // Products dropdown — click/keyboard for touch and accessibility; CSS covers hover.
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

  // "Suggest an app" form — build a mailto so nothing is sent to this site.
  var form = document.getElementById("idea-form");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var title = (form.querySelector("#idea-title") || {}).value || "";
      var detail = (form.querySelector("#idea-detail") || {}).value || "";
      var subject = "App idea: " + title.trim();
      var body =
        "Here is an everyday app idea for MundaneApps.\n\n" +
        "Idea: " + title.trim() + "\n\n" +
        "More detail:\n" + (detail.trim() || "(none)") + "\n";
      var href =
        "mailto:info@mundaneapps.com" +
        "?subject=" + encodeURIComponent(subject) +
        "&body=" + encodeURIComponent(body);
      window.location.href = href;
    });
  }

  // Scroll-reveal — honor reduced-motion.
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
