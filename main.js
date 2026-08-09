/* MundaneApps: dependency-free progressive enhancement. No tracking. */
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

  // Explicit theme control. theme-init.js applies the saved choice before CSS
  // loads; this control owns later changes without flashing the wrong theme.
  var themeStorageKey = "mundaneapps-theme";
  var themeHost = document.querySelector(".nav-cluster") || document.querySelector(".site-header nav");
  var themeToggle = null;

  var updateThemeColor = function (theme) {
    var isProductPage = document.body.classList.contains("theme-headsup");
    var color = theme === "dark" ? "#000000" : (isProductPage ? "#008080" : "#ABCDEF");
    var metas = document.querySelectorAll('meta[name="theme-color"]');
    Array.prototype.forEach.call(metas, function (meta, index) {
      if (index === 0) {
        meta.removeAttribute("media");
        meta.setAttribute("content", color);
      } else {
        meta.remove();
      }
    });
  };

  var syncThemeAssets = function (theme) {
    var attribute = theme === "dark" ? "data-dark-src" : "data-light-src";
    Array.prototype.forEach.call(document.querySelectorAll("img[data-light-src][data-dark-src]"), function (image) {
      var nextSource = image.getAttribute(attribute);
      if (nextSource && image.getAttribute("src") !== nextSource) image.setAttribute("src", nextSource);
    });
  };

  var applyTheme = function (theme, persist) {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    if (persist) {
      try { window.localStorage.setItem(themeStorageKey, theme); } catch (_) {}
    }
    if (themeToggle) {
      var next = theme === "dark" ? "light" : "dark";
      themeToggle.setAttribute("aria-label", "Switch to " + next + " mode");
      themeToggle.setAttribute("title", "Switch to " + next + " mode");
      themeToggle.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
    }
    updateThemeColor(theme);
    syncThemeAssets(theme);
    document.dispatchEvent(new CustomEvent("mundaneapps:themechange", { detail: { theme: theme } }));
  };

  if (themeHost) {
    themeToggle = document.createElement("button");
    themeToggle.className = "theme-toggle";
    themeToggle.type = "button";
    themeToggle.setAttribute("data-theme-toggle", "");
    themeToggle.innerHTML = '<svg class="theme-icon theme-icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="3.5"/><path d="M12 2.5v2M12 19.5v2M4.5 12h-2M21.5 12h-2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M18.7 5.3l-1.4 1.4M6.7 17.3l-1.4 1.4"/></svg><svg class="theme-icon theme-icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.2 15.2A8.4 8.4 0 0 1 8.8 3.8 8.5 8.5 0 1 0 20.2 15.2Z"/></svg>';
    var mobileToggle = themeHost.querySelector(".nav-toggle");
    themeHost.insertBefore(themeToggle, mobileToggle || null);
    themeToggle.addEventListener("click", function () {
      applyTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark", true);
    });
  }
  applyTheme(document.documentElement.dataset.theme === "dark" ? "dark" : "light", false);

  // Mobile nav toggle.
  var toggle = document.querySelector(".nav-toggle");
  var links = document.querySelector(".nav-links");
  if (toggle && links) {
    var closeMobileNav = function () {
      links.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
      var openProduct = links.querySelector(".nav-item.open");
      var openProductTrigger = openProduct ? openProduct.querySelector(".nav-trigger") : null;
      if (openProduct) openProduct.classList.remove("open");
      if (openProductTrigger) openProductTrigger.setAttribute("aria-expanded", "false");
    };
    toggle.addEventListener("click", function () {
      var open = links.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      if (!open) closeMobileNav();
    });
    links.addEventListener("click", function (e) {
      // Follow real links closes the mobile menu; the Products button does not.
      if (e.target.closest("a")) closeMobileNav();
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

  // Community and product-beta signups share one hardened Supabase Edge
  // Function while remaining separate audiences and email preferences.
  var SIGNUP_ENDPOINT = (window.MUNDANEAPPS_CONFIG || {}).signupEndpoint || "";
  var joinForms = document.querySelectorAll("form.join-form");
  Array.prototype.forEach.call(joinForms, function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var status = form.querySelector(".join-status");
      var btn = form.querySelector("button[type=submit]");
      var email = (form.querySelector("input[type=email]") || {}).value || "";
      var idea = (form.querySelector("textarea[name=idea]") || {}).value || "";
      var platform = (form.querySelector("select[name=platform]") || {}).value || "";
      var honey = (form.querySelector("input[name=company]") || {}).value || "";
      var signup = form.dataset.signup || "community";

      if (!SIGNUP_ENDPOINT) {
        if (status) {
          status.textContent = signup === "beta"
            ? "HeadsUp beta registration opens shortly. Email info@mundaneapps.com and tell us your platform for manual registration."
            : "Community invitations open shortly. Email info@mundaneapps.com and we'll add you by hand.";
          status.className = "join-status err";
        }
        return;
      }

      if (status) { status.textContent = ""; status.className = "join-status"; }
      if (btn) { btn.disabled = true; btn.dataset.label = btn.textContent; btn.textContent = signup === "beta" ? "Registering…" : "Joining…"; }
      fetch(SIGNUP_ENDPOINT, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email, idea: idea, platform: platform, signup: signup, company: honey, source: form.dataset.source || "site" }),
      }).then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
        .then(function (res) {
          if (res.ok && res.d.ok) {
            form.classList.add("joined");
            if (status) {
              status.textContent = res.d.emailPending
                ? (signup === "beta" ? "You're registered for HeadsUp beta access. Your confirmation email may take a moment." : "You're on the Mundane Circle invitation list. Your confirmation email may take a moment.")
                : (signup === "beta" ? "You're registered for HeadsUp beta access. Check your inbox." : "You're in. Welcome to the Mundane Circle. Check your inbox.");
              status.classList.add("ok");
            }
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

  // Gallery focus mode: native modal semantics, blurred page backdrop,
  // adjacent navigation, keyboard arrows, and a small swipe gesture.
  var galleryItems = Array.prototype.slice.call(document.querySelectorAll(".gallery-slide"));
  if (galleryItems.length) {
    var activeGalleryIndex = 0;
    var previewPointerStart = null;
    var galleryDialog = document.createElement("dialog");
    galleryDialog.className = "gallery-preview";
    galleryDialog.setAttribute("aria-label", "HeadsUp screenshot preview");
    galleryDialog.innerHTML = '<div class="gallery-preview-shell"><div class="gallery-preview-bar"><span class="gallery-preview-count" aria-live="polite"></span><button class="gallery-preview-close" type="button" aria-label="Close screenshot preview"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div><button class="gallery-preview-nav gallery-preview-prev" type="button" aria-label="Previous screenshot"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg></button><figure class="gallery-preview-figure"><div class="phone gallery-preview-device"><img src="/assets/shots/light-dark.webp" alt="" width="620" height="1348" decoding="async"></div><figcaption><h3></h3><p></p></figcaption></figure><button class="gallery-preview-nav gallery-preview-next" type="button" aria-label="Next screenshot"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg></button></div>';
    document.body.appendChild(galleryDialog);

    var previewImage = galleryDialog.querySelector(".gallery-preview-device img");
    var previewTitle = galleryDialog.querySelector("figcaption h3");
    var previewCaption = galleryDialog.querySelector("figcaption p");
    var previewCount = galleryDialog.querySelector(".gallery-preview-count");
    var previewClose = galleryDialog.querySelector(".gallery-preview-close");
    var previewPrevious = galleryDialog.querySelector(".gallery-preview-prev");
    var previewNext = galleryDialog.querySelector(".gallery-preview-next");
    var previewFigure = galleryDialog.querySelector(".gallery-preview-figure");

    var gallerySourceForTheme = function (image) {
      return image.getAttribute(document.documentElement.dataset.theme === "dark" ? "data-dark-src" : "data-light-src") || image.currentSrc || image.src;
    };

    var preloadGalleryNeighbor = function (index) {
      var item = galleryItems[(index + galleryItems.length) % galleryItems.length];
      var sourceImage = item.querySelector("img");
      if (!sourceImage) return;
      var preload = new Image();
      preload.src = gallerySourceForTheme(sourceImage);
    };

    var renderGalleryPreview = function (index) {
      activeGalleryIndex = (index + galleryItems.length) % galleryItems.length;
      var item = galleryItems[activeGalleryIndex];
      var sourceImage = item.querySelector("img");
      var title = (item.querySelector("h3") || {}).textContent || "HeadsUp screenshot";
      var caption = (item.querySelector("figcaption") || {}).textContent || "";
      previewImage.src = gallerySourceForTheme(sourceImage);
      previewImage.alt = sourceImage.alt || title;
      previewTitle.textContent = title;
      previewCaption.textContent = caption;
      previewCount.textContent = (activeGalleryIndex + 1) + " of " + galleryItems.length;
      preloadGalleryNeighbor(activeGalleryIndex - 1);
      preloadGalleryNeighbor(activeGalleryIndex + 1);
    };

    var closeGalleryPreview = function () {
      if (typeof galleryDialog.close === "function" && galleryDialog.open) galleryDialog.close();
      else galleryDialog.removeAttribute("open");
      document.body.classList.remove("gallery-preview-open");
    };

    var openGalleryPreview = function (index) {
      renderGalleryPreview(index);
      document.body.classList.add("gallery-preview-open");
      if (typeof galleryDialog.showModal === "function") galleryDialog.showModal();
      else galleryDialog.setAttribute("open", "");
      previewClose.focus();
    };

    galleryItems.forEach(function (item, index) {
      var art = item.querySelector(".gallery-art");
      var title = (item.querySelector("h3") || {}).textContent || "screenshot";
      if (!art) return;
      art.setAttribute("role", "button");
      art.setAttribute("tabindex", "0");
      art.setAttribute("aria-haspopup", "dialog");
      art.setAttribute("aria-label", "Open full-screen preview: " + title);
      art.addEventListener("click", function () { openGalleryPreview(index); });
      art.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openGalleryPreview(index);
        }
      });
    });

    previewClose.addEventListener("click", closeGalleryPreview);
    previewPrevious.addEventListener("click", function () { renderGalleryPreview(activeGalleryIndex - 1); });
    previewNext.addEventListener("click", function () { renderGalleryPreview(activeGalleryIndex + 1); });
    galleryDialog.addEventListener("click", function (event) {
      if (event.target === galleryDialog) closeGalleryPreview();
    });
    galleryDialog.addEventListener("close", function () { document.body.classList.remove("gallery-preview-open"); });
    galleryDialog.addEventListener("cancel", function () { document.body.classList.remove("gallery-preview-open"); });
    document.addEventListener("keydown", function (event) {
      if (!galleryDialog.open) return;
      if (event.key === "ArrowLeft") renderGalleryPreview(activeGalleryIndex - 1);
      if (event.key === "ArrowRight") renderGalleryPreview(activeGalleryIndex + 1);
    });
    previewFigure.addEventListener("pointerdown", function (event) { previewPointerStart = event.clientX; });
    previewFigure.addEventListener("pointerup", function (event) {
      if (previewPointerStart === null) return;
      var distance = event.clientX - previewPointerStart;
      previewPointerStart = null;
      if (Math.abs(distance) < 48) return;
      renderGalleryPreview(activeGalleryIndex + (distance < 0 ? 1 : -1));
    });
    document.addEventListener("mundaneapps:themechange", function () {
      if (galleryDialog.open) renderGalleryPreview(activeGalleryIndex);
    });
  }

  // Cadence playground: a local, dependency-free illustration of the three
  // scheduling models used by HeadsUp. It stores and submits nothing.
  var cadencePlayground = document.querySelector("[data-cadence-playground]");
  if (cadencePlayground) {
    var cadenceTypeInputs = Array.prototype.slice.call(cadencePlayground.querySelectorAll('input[name="playground-type"]'));
    var fixedRuleInputs = Array.prototype.slice.call(cadencePlayground.querySelectorAll('input[name="playground-fixed-rule"]'));
    var frequencyInputs = Array.prototype.slice.call(cadencePlayground.querySelectorAll('input[name="playground-frequency"]'));
    var dueInput = cadencePlayground.querySelector("[data-playground-due]");
    var completedInput = cadencePlayground.querySelector("[data-playground-completed]");
    var fixedRuleFields = cadencePlayground.querySelector("[data-playground-fixed-rule]");
    var repeatFields = cadencePlayground.querySelector("[data-playground-repeat]");
    var advancedFields = cadencePlayground.querySelector("[data-playground-advanced]");
    var patternFields = Array.prototype.slice.call(cadencePlayground.querySelectorAll("[data-playground-pattern]"));
    var weekdayInputs = Array.prototype.slice.call(cadencePlayground.querySelectorAll("[data-playground-weekday]"));
    var monthlyOrdinalInput = cadencePlayground.querySelector("[data-playground-monthly-ordinal]");
    var monthlyWeekdayInput = cadencePlayground.querySelector("[data-playground-monthly-weekday]");
    var yearlyMonthInput = cadencePlayground.querySelector("[data-playground-yearly-month]");
    var yearlyOrdinalInput = cadencePlayground.querySelector("[data-playground-yearly-ordinal]");
    var yearlyWeekdayInput = cadencePlayground.querySelector("[data-playground-yearly-weekday]");
    var amountInput = cadencePlayground.querySelector("[data-playground-amount]");
    var unitInput = cadencePlayground.querySelector("[data-playground-unit]");
    var titleOutput = cadencePlayground.querySelector("[data-playground-title]");
    var explanationOutput = cadencePlayground.querySelector("[data-playground-explanation]");
    var timelineOutput = cadencePlayground.querySelector("[data-playground-timeline]");
    var intervalLabel = cadencePlayground.querySelector("[data-playground-interval-label]");
    var dueLabel = cadencePlayground.querySelector("[data-playground-due-label]");
    var completedLabel = cadencePlayground.querySelector("[data-playground-completed-label]");
    var nextCaption = cadencePlayground.querySelector("[data-playground-next-caption]");
    var nextLabel = cadencePlayground.querySelector("[data-playground-next-label]");
    var resultOutput = cadencePlayground.querySelector("[data-playground-result]");

    var startOfLocalDay = function (date) {
      return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12);
    };
    var parseLocalDate = function (value) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return null;
      var parts = value.split("-").map(Number);
      var date = new Date(parts[0], parts[1] - 1, parts[2], 12);
      return isNaN(date.getTime()) ? null : date;
    };
    var toDateInputValue = function (date) {
      var year = String(date.getFullYear());
      var month = String(date.getMonth() + 1).padStart(2, "0");
      var day = String(date.getDate()).padStart(2, "0");
      return year + "-" + month + "-" + day;
    };
    var daysInMonth = function (year, month) {
      return new Date(year, month + 1, 0).getDate();
    };
    var addCalendarInterval = function (date, amount, unit, preferredDay) {
      var from = startOfLocalDay(date);
      if (unit === "days") return new Date(from.getFullYear(), from.getMonth(), from.getDate() + amount, 12);
      if (unit === "weeks") return new Date(from.getFullYear(), from.getMonth(), from.getDate() + amount * 7, 12);
      if (unit === "years") {
        var targetYear = from.getFullYear() + amount;
        var yearDay = Math.min(preferredDay || from.getDate(), daysInMonth(targetYear, from.getMonth()));
        return new Date(targetYear, from.getMonth(), yearDay, 12);
      }
      var target = new Date(from.getFullYear(), from.getMonth() + amount, 1, 12);
      var monthDay = Math.min(preferredDay || from.getDate(), daysInMonth(target.getFullYear(), target.getMonth()));
      return new Date(target.getFullYear(), target.getMonth(), monthDay, 12);
    };
    var formatDate = function (date, long) {
      return date.toLocaleDateString(undefined, long
        ? { day: "numeric", month: "long", year: "numeric" }
        : { day: "numeric", month: "short", year: "numeric" });
    };
    var selectedCadenceType = function () {
      var selected = cadenceTypeInputs.find(function (input) { return input.checked; });
      return selected ? selected.value : "oneTime";
    };
    var selectedRadioValue = function (inputs, fallback) {
      var selected = inputs.find(function (input) { return input.checked; });
      return selected ? selected.value : fallback;
    };
    var formatInterval = function (amount, unit) {
      var singular = unit.replace(/s$/, "");
      return amount + " " + (amount === 1 ? singular : unit);
    };
    var weekdayShortLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    var weekdayLongLabels = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    var monthLongLabels = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    var ordinalLabels = { "1": "1st", "2": "2nd", "3": "3rd", "4": "4th", "-1": "Last" };
    var nextSelectedWeekday = function (from, weekdays) {
      for (var offset = 1; offset <= 7; offset += 1) {
        var candidate = addCalendarInterval(from, offset, "days");
        if (weekdays.indexOf(candidate.getDay()) !== -1) return candidate;
      }
      return null;
    };
    var ordinalWeekdayInMonth = function (year, month, weekday, ordinal) {
      if (ordinal === -1) {
        var last = new Date(year, month + 1, 0, 12);
        while (last.getDay() !== weekday) last = addCalendarInterval(last, -1, "days");
        return last;
      }
      var first = new Date(year, month, 1, 12);
      var shift = (weekday - first.getDay() + 7) % 7;
      return new Date(year, month, 1 + shift + (ordinal - 1) * 7, 12);
    };
    var nextMonthlyPattern = function (from, weekday, ordinal) {
      for (var offset = 0; offset <= 12; offset += 1) {
        var monthBase = new Date(from.getFullYear(), from.getMonth() + offset, 1, 12);
        var candidate = ordinalWeekdayInMonth(monthBase.getFullYear(), monthBase.getMonth(), weekday, ordinal);
        if (candidate.getTime() > from.getTime()) return candidate;
      }
      return null;
    };
    var nextYearlyPattern = function (from, month, weekday, ordinal) {
      for (var offset = 0; offset <= 5; offset += 1) {
        var candidate = ordinalWeekdayInMonth(from.getFullYear() + offset, month, weekday, ordinal);
        if (candidate.getTime() > from.getTime()) return candidate;
      }
      return null;
    };
    var renderCadencePlayground = function () {
      var due = parseLocalDate(dueInput.value);
      var completed = parseLocalDate(completedInput.value);
      var type = selectedCadenceType();
      var fixedRule = selectedRadioValue(fixedRuleInputs, "simple");
      var frequency = selectedRadioValue(frequencyInputs, "weekly");
      var amount = Math.min(Math.max(parseInt(amountInput.value, 10) || 1, 1), 99);
      var unit = unitInput.value || "months";
      var readableInterval = formatInterval(amount, unit);
      var advancedActive = type === "fixedSchedule" && fixedRule === "advanced";
      fixedRuleFields.hidden = type !== "fixedSchedule";
      repeatFields.hidden = type === "oneTime" || advancedActive;
      advancedFields.hidden = !advancedActive;
      patternFields.forEach(function (field) {
        field.hidden = !advancedActive || field.getAttribute("data-playground-pattern") !== frequency;
      });
      timelineOutput.classList.remove("is-one-time", "is-fixed", "is-completion");
      timelineOutput.classList.add(type === "fixedSchedule" ? "is-fixed" : type === "activityBased" ? "is-completion" : "is-one-time");

      if (!due || !completed) {
        resultOutput.textContent = "Choose both dates to see what happens next.";
        return;
      }

      dueLabel.textContent = formatDate(due, false);
      completedLabel.textContent = formatDate(completed, false);

      if (type === "oneTime") {
        titleOutput.textContent = "This cadence ends when you complete it.";
        explanationOutput.textContent = "If you need it again, you choose a new date.";
        intervalLabel.textContent = "";
        nextCaption.textContent = "Next due date will be scheduled on";
        nextLabel.textContent = "Not scheduled";
        resultOutput.textContent = "You complete this one on " + formatDate(completed, true) + ". No follow-up is created automatically.";
        return;
      }

      if (type === "fixedSchedule") {
        var fixedNext;
        var ruleLabel;
        var ruleExplanation;
        if (advancedActive && frequency === "weekly") {
          var selectedWeekdays = weekdayInputs.filter(function (input) { return input.checked; }).map(function (input) { return parseInt(input.value, 10); }).sort();
          fixedNext = nextSelectedWeekday(due, selectedWeekdays);
          if (!fixedNext) {
            titleOutput.textContent = "Choose at least one weekday.";
            explanationOutput.textContent = "The advanced weekly rule needs a day before HeadsUp can schedule the next due date.";
            intervalLabel.textContent = "Choose a weekday";
            nextCaption.textContent = "Next due date will be scheduled on";
            nextLabel.textContent = "Choose a weekday";
            resultOutput.textContent = "Choose at least one weekday to see the next due date.";
            return;
          }
          var selectedWeekdayLabels = selectedWeekdays.map(function (weekday) { return weekdayShortLabels[weekday]; });
          ruleLabel = "Every " + selectedWeekdayLabels.join(", ") + " from current due date";
          ruleExplanation = "The next due date is the first selected weekday after the current due date. Completion does not change it.";
        } else if (advancedActive && frequency === "monthly") {
          var monthlyOrdinal = parseInt(monthlyOrdinalInput.value, 10);
          var monthlyWeekday = parseInt(monthlyWeekdayInput.value, 10);
          fixedNext = nextMonthlyPattern(due, monthlyWeekday, monthlyOrdinal);
          ruleLabel = ordinalLabels[String(monthlyOrdinal)] + " " + weekdayShortLabels[monthlyWeekday] + " each month";
          ruleExplanation = "The next due date follows the " + ordinalLabels[String(monthlyOrdinal)].toLowerCase() + " " + weekdayLongLabels[monthlyWeekday] + " of the month. Completion does not change it.";
        } else if (advancedActive) {
          var yearlyMonth = parseInt(yearlyMonthInput.value, 10);
          var yearlyOrdinal = parseInt(yearlyOrdinalInput.value, 10);
          var yearlyWeekday = parseInt(yearlyWeekdayInput.value, 10);
          fixedNext = nextYearlyPattern(due, yearlyMonth, yearlyWeekday, yearlyOrdinal);
          ruleLabel = ordinalLabels[String(yearlyOrdinal)] + " " + weekdayShortLabels[yearlyWeekday] + " of " + monthLongLabels[yearlyMonth];
          ruleExplanation = "The next due date follows the " + ordinalLabels[String(yearlyOrdinal)].toLowerCase() + " " + weekdayLongLabels[yearlyWeekday] + " of " + monthLongLabels[yearlyMonth] + ". Completion does not change it.";
        } else {
          fixedNext = addCalendarInterval(due, amount, unit, due.getDate());
          ruleLabel = readableInterval + " from current due date";
          ruleExplanation = "Its due date is " + readableInterval + " after the current due date, even if you complete this one early or late.";
        }
        titleOutput.textContent = "The follow-up stays on schedule.";
        explanationOutput.textContent = ruleExplanation;
        intervalLabel.textContent = ruleLabel;
        nextCaption.textContent = "Next due date will be scheduled on";
        nextLabel.textContent = formatDate(fixedNext, false);
        resultOutput.textContent = "Next due date: " + formatDate(fixedNext, true) + ". It follows the fixed schedule, so completing this one on " + formatDate(completed, true) + " does not change it.";
        return;
      }

      var activityNext = addCalendarInterval(completed, amount, unit, completed.getDate());
      titleOutput.textContent = "The follow-up moves with completion.";
      explanationOutput.textContent = "Its due date is " + readableInterval + " after the day you complete this one.";
      intervalLabel.textContent = readableInterval + " from completion";
      nextCaption.textContent = "Next due date will be scheduled on";
      nextLabel.textContent = formatDate(activityNext, false);
      resultOutput.textContent = "Follow-up due " + formatDate(activityNext, true) + ": " + readableInterval + " after you complete this one.";
    };

    var playgroundToday = startOfLocalDay(new Date());
    dueInput.value = toDateInputValue(addCalendarInterval(playgroundToday, 21, "days"));
    completedInput.value = toDateInputValue(addCalendarInterval(playgroundToday, 24, "days"));
    cadenceTypeInputs.concat(fixedRuleInputs, frequencyInputs, weekdayInputs).forEach(function (input) { input.addEventListener("change", renderCadencePlayground); });
    [dueInput, completedInput, amountInput, unitInput, monthlyOrdinalInput, monthlyWeekdayInput, yearlyMonthInput, yearlyOrdinalInput, yearlyWeekdayInput].forEach(function (input) {
      input.addEventListener("input", renderCadencePlayground);
      input.addEventListener("change", renderCadencePlayground);
    });
    renderCadencePlayground();
  }

  // Founder portraits behave as an accessible tab set: click, touch and arrow
  // keys all reveal the matching story without moving the reader elsewhere.
  var founderStories = document.querySelector("[data-founder-stories]");
  if (founderStories) {
    var founderTabs = Array.prototype.slice.call(founderStories.querySelectorAll("[data-founder-tab]"));
    var founderPanels = Array.prototype.slice.call(founderStories.querySelectorAll("[data-founder-panel]"));
    var selectFounder = function (tab, moveFocus) {
      var founder = tab.getAttribute("data-founder-tab");
      founderTabs.forEach(function (candidate) {
        var active = candidate === tab;
        candidate.setAttribute("aria-selected", active ? "true" : "false");
        candidate.tabIndex = active ? 0 : -1;
      });
      founderPanels.forEach(function (panel) {
        panel.hidden = panel.getAttribute("data-founder-panel") !== founder;
      });
      if (moveFocus) tab.focus();
    };

    founderTabs.forEach(function (tab, index) {
      tab.addEventListener("click", function () { selectFounder(tab, false); });
      tab.addEventListener("keydown", function (event) {
        var nextIndex = null;
        if (event.key === "ArrowRight" || event.key === "ArrowDown") nextIndex = (index + 1) % founderTabs.length;
        if (event.key === "ArrowLeft" || event.key === "ArrowUp") nextIndex = (index - 1 + founderTabs.length) % founderTabs.length;
        if (event.key === "Home") nextIndex = 0;
        if (event.key === "End") nextIndex = founderTabs.length - 1;
        if (nextIndex === null) return;
        event.preventDefault();
        selectFounder(founderTabs[nextIndex], true);
      });
    });
  }

  // Each route gets a distinct set of page-length ribbons. Catmull-Rom points
  // are converted to cubic curves so every bend stays smooth while scrolling.
  var shapeMotionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (!shapeMotionPreference.matches) {
    var cleanPath = window.location.pathname.replace(/\.html$/, "").replace(/\/$/, "") || "/";
    var shapeKey = cleanPath === "/" ? "home"
      : cleanPath === "/headsup" ? "headsup"
      : cleanPath === "/about" ? "about"
      : cleanPath === "/support" ? "support"
      : cleanPath === "/privacy" ? "privacy"
      : cleanPath === "/terms" ? "terms"
      : cleanPath === "/delete-account" ? "deleteAccount"
      : "notfound";
    var shapeKeys = ["home", "headsup", "about", "support", "privacy", "terms", "deleteAccount", "notfound"];
    var routeSeed = shapeKeys.indexOf(shapeKey) + 1;
    var canvasHeight = 4000;
    var pointCount = 13;
    var strokeWidths = [26, 19, 14, 10, 7];
    var buildFlow = function (index) {
      var start = [];
      var end = [];
      var center = 720 + (index - 2) * 112;
      var amplitude = 390 - index * 24;
      var step = canvasHeight / (pointCount - 1);
      for (var pointIndex = 0; pointIndex < pointCount; pointIndex += 1) {
        var y = pointIndex * step;
        var phase = pointIndex * (0.84 + index * 0.035) + routeSeed * 0.73 + index * 1.19;
        var startX = center
          + Math.sin(phase) * amplitude
          + Math.sin(phase * 0.43 + routeSeed) * 128;
        var endX = center
          + Math.sin(phase + 0.78 + routeSeed * 0.07) * amplitude
          + Math.cos(phase * 0.49 + index) * 142;
        start.push(Math.round(startX * 10) / 10, Math.round(y * 10) / 10);
        end.push(Math.round(endX * 10) / 10, Math.round(y * 10) / 10);
      }
      return { width: strokeWidths[index], start: start, end: end };
    };
    var shapeVariants = strokeWidths.map(function (_, index) { return buildFlow(index); });
    var organicShapes = [];
    var shapeFrame = 0;
    var organicMorphIntensity = 10;
    var svgNamespace = "http://www.w3.org/2000/svg";
    var makeOrganicPath = function (points) {
      var pairs = [];
      for (var index = 0; index < points.length; index += 2) {
        pairs.push({ x: points[index], y: points[index + 1] });
      }
      var pathData = "M" + pairs[0].x + " " + pairs[0].y;
      for (var pairIndex = 0; pairIndex < pairs.length - 1; pairIndex += 1) {
        var previous = pairIndex > 0 ? pairs[pairIndex - 1] : pairs[pairIndex];
        var current = pairs[pairIndex];
        var next = pairs[pairIndex + 1];
        var afterNext = pairIndex + 2 < pairs.length ? pairs[pairIndex + 2] : next;
        var cp1x = current.x + (next.x - previous.x) / 6;
        var cp1y = current.y + (next.y - previous.y) / 6;
        var cp2x = next.x - (afterNext.x - current.x) / 6;
        var cp2y = next.y - (afterNext.y - current.y) / 6;
        pathData += "C" + cp1x.toFixed(1) + " " + cp1y.toFixed(1)
          + " " + cp2x.toFixed(1) + " " + cp2y.toFixed(1)
          + " " + next.x.toFixed(1) + " " + next.y.toFixed(1);
      }
      return pathData;
    };

    shapeVariants.forEach(function (definition, index) {
      var layer = document.createElement("div");
      var svg = document.createElementNS(svgNamespace, "svg");
      var path = document.createElementNS(svgNamespace, "path");
      layer.className = "scroll-organic scroll-organic-" + shapeKey + " scroll-organic-" + (index + 1);
      layer.setAttribute("aria-hidden", "true");
      svg.setAttribute("viewBox", "0 0 1440 " + canvasHeight);
      svg.setAttribute("preserveAspectRatio", "none");
      path.setAttribute("stroke-width", String(definition.width));
      svg.appendChild(path);
      layer.appendChild(svg);
      document.body.insertBefore(layer, document.body.firstChild);
      organicShapes.push({ definition: definition, layer: layer, svg: svg, path: path, index: index });
    });

    var updateOrganicShape = function () {
      shapeFrame = 0;
      // Measure the normal document flow, not scrollHeight: these absolutely
      // positioned layers contribute to scroll overflow and would otherwise
      // feed their previous height back into the next measurement.
      var pageHeight = Math.max(document.body.getBoundingClientRect().height, window.innerHeight);
      var maxScroll = Math.max(pageHeight - window.innerHeight, 1);
      var progress = Math.min(Math.max(window.scrollY / maxScroll, 0), 1);
      var eased = progress * progress * (3 - 2 * progress);
      var viewportPhase = window.scrollY / Math.max(window.innerHeight, 1);
      organicShapes.forEach(function (shape) {
        shape.layer.style.height = pageHeight + "px";
        var relativeDrift = Math.sin(viewportPhase * 1.35 + shape.index * 0.55)
          * (shape.index - 2) * 0.075 * organicMorphIntensity;
        var shapeProgress = Math.min(Math.max(eased + relativeDrift, 0), 1);
        var points = shape.definition.start.map(function (value, pointIndex) {
          var ripple = pointIndex % 2 === 0
            ? Math.sin(viewportPhase * 2.25 + (pointIndex / 2) * 0.88 + shape.index * 1.1)
              * (30 + shape.index * 6) * organicMorphIntensity
            : 0;
          return Math.round((value + (shape.definition.end[pointIndex] - value) * shapeProgress + ripple) * 10) / 10;
        });
        shape.path.setAttribute("d", makeOrganicPath(points));
        var direction = shape.index % 2 === 0 ? 1 : -1;
        var lateralTravel = (((eased - 0.5) * 118) * direction
          + Math.sin(viewportPhase * 1.7 + shape.index * 0.7) * 38) * organicMorphIntensity;
        var verticalDrift = Math.cos(viewportPhase * 1.9 + shape.index * 0.85)
          * 34 * organicMorphIntensity;
        var horizontalBreath = 1 + Math.sin(viewportPhase * 1.3 + shape.index * 0.6)
          * (shape.index % 2 ? 0.025 : 0.035) * organicMorphIntensity;
        shape.svg.style.transform = "translate3d(" + lateralTravel.toFixed(1) + "px," + verticalDrift.toFixed(1) + "px,0) scaleX(" + horizontalBreath.toFixed(3) + ")";
      });
    };
    var requestOrganicUpdate = function () {
      if (!shapeFrame) shapeFrame = window.requestAnimationFrame(updateOrganicShape);
    };
    updateOrganicShape();
    window.addEventListener("scroll", requestOrganicUpdate, { passive: true });
    window.addEventListener("resize", requestOrganicUpdate, { passive: true });
    window.addEventListener("load", requestOrganicUpdate, { once: true });
    document.addEventListener("mundaneapps:themechange", requestOrganicUpdate);
  }

  // Scroll reveal on the quieter pages stays deliberately simple.
  var motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
  var revealEls = Array.prototype.slice.call(document.querySelectorAll(".reveal"));
  var motionPage = document.body.classList.contains("motion-page");

  if (!motionPage) {
    if (motionPreference.matches || !("IntersectionObserver" in window)) {
      revealEls.forEach(function (el) { el.classList.add("in"); });
    } else {
      var basicLastScrollY = window.scrollY || window.pageYOffset || 0;
      var basicScrollDirection = "down";
      window.addEventListener("scroll", function () {
        var currentY = window.scrollY || window.pageYOffset || 0;
        if (Math.abs(currentY - basicLastScrollY) > 1) {
          basicScrollDirection = currentY > basicLastScrollY ? "down" : "up";
          basicLastScrollY = currentY;
        }
      }, { passive: true });
      var basicRevealObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.12) {
            entry.target.classList.remove("from-above", "from-below");
            entry.target.classList.add(basicScrollDirection === "up" ? "from-above" : "from-below");
            entry.target.classList.add("in");
          } else if (!entry.isIntersecting) {
            entry.target.classList.remove("in");
          }
        });
      }, { threshold: [0, 0.12], rootMargin: "64px 0px 64px 0px" });
      revealEls.forEach(function (el) { basicRevealObserver.observe(el); });
    }
    return;
  }

  // Motion-page controller. Every frame below is requested by an input event or
  // a finite count-up; there is no permanently running animation loop.
  var requestFrame = window.requestAnimationFrame
    ? window.requestAnimationFrame.bind(window)
    : function (callback) {
        return window.setTimeout(function () { callback(Date.now()); }, 16);
      };
  var cancelFrame = window.cancelAnimationFrame
    ? window.cancelAnimationFrame.bind(window)
    : window.clearTimeout.bind(window);
  var hero = document.querySelector(".hero");
  var storyScenes = Array.prototype.slice.call(document.querySelectorAll(".story-scroll"));
  var countEls = Array.prototype.slice.call(document.querySelectorAll("[data-count]"));
  var counted = typeof WeakSet === "function" ? new WeakSet() : [];
  var revealObserver = null;
  var countObserver = null;
  var motionFrame = 0;
  var countAnimations = [];
  var motionRunning = false;
  var lastScrollY = window.scrollY || window.pageYOffset || 0;
  var scrollDirection = "down";

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function ramp(value, start, end) {
    return clamp((value - start) / Math.max(end - start, 0.0001), 0, 1);
  }

  function hasCounted(el) {
    return counted instanceof Array ? counted.indexOf(el) !== -1 : counted.has(el);
  }

  function markCounted(el) {
    if (counted instanceof Array) {
      if (counted.indexOf(el) === -1) counted.push(el);
    } else {
      counted.add(el);
    }
  }

  function countInfo(el) {
    var raw = el.getAttribute("data-count") || "0";
    var clean = raw.replace(/,/g, "");
    var value = Number(clean);
    var decimalPoint = clean.indexOf(".");
    return {
      raw: raw,
      value: isFinite(value) ? value : 0,
      decimals: decimalPoint === -1 ? 0 : clean.length - decimalPoint - 1,
    };
  }

  function formatCount(value, decimals) {
    return decimals ? value.toFixed(decimals) : String(Math.round(value));
  }

  function finishCount(el) {
    var info = countInfo(el);
    el.textContent = info.raw;
    markCounted(el);
  }

  function removeCountAnimation(el) {
    countAnimations = countAnimations.filter(function (animation) {
      return animation.el !== el;
    });
  }

  function animateCount(el) {
    if (hasCounted(el)) return;

    var info = countInfo(el);
    markCounted(el);
    if (info.value <= 0) {
      el.textContent = info.raw;
      return;
    }

    var duration = 760;
    var start = null;
    var animation = { el: el, id: 0 };

    function tick(now) {
      if (motionPreference.matches) {
        el.textContent = info.raw;
        removeCountAnimation(el);
        return;
      }

      if (start === null) start = now;
      var progress = clamp((now - start) / duration, 0, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = formatCount(info.value * eased, info.decimals);

      if (progress < 1) {
        animation.id = requestFrame(tick);
      } else {
        el.textContent = info.raw;
        removeCountAnimation(el);
      }
    }

    countAnimations.push(animation);
    animation.id = requestFrame(tick);
  }

  function cancelCounts() {
    countAnimations.forEach(function (animation) {
      cancelFrame(animation.id);
    });
    countAnimations = [];
    countEls.forEach(finishCount);
  }

  function revealStage(el) {
    var explicitStage = el.classList.contains("d3") ? 3
      : el.classList.contains("d2") ? 2
      : el.classList.contains("d1") ? 1 : -1;
    var stage = explicitStage;

    if (stage === -1 && el.parentElement) {
      var siblings = Array.prototype.filter.call(el.parentElement.children, function (child) {
        return child.classList && child.classList.contains("reveal");
      });
      stage = siblings.length > 1 ? siblings.indexOf(el) % 3 : 0;
    }

    return Math.max(stage, 0);
  }

  function prepareReveals() {
    revealEls.forEach(function (el) {
      var stage = revealStage(el);
      var delay = stage * 90;
      el.style.setProperty("--reveal-order", String(stage));
      el.style.setProperty("--reveal-delay", delay + "ms");
      el.style.transitionDelay = delay + "ms";
    });
  }

  function setNeutralMotionValues() {
    if (hero) {
      hero.style.setProperty("--hero-progress", "0");
      hero.style.setProperty("--hero-copy-y", "0px");
      hero.style.setProperty("--hero-copy-opacity", "1");
      hero.style.setProperty("--hero-visual-y", "0px");
      hero.style.setProperty("--hero-visual-scale", "1");
    }
    storyScenes.forEach(function (story) {
      story.style.setProperty("--story-progress", "1");
      story.style.setProperty("--story-copy-y", "0px");
      story.style.setProperty("--story-copy-opacity", "1");
      [1, 2, 3].forEach(function (index) {
        story.style.setProperty("--story-note-" + index + "-opacity", "1");
        story.style.setProperty("--story-phone-" + index + "-opacity", "1");
        story.style.setProperty("--story-phone-" + index + "-x", "0%");
        story.style.setProperty("--story-phone-" + index + "-scale", "1");
      });
      Array.prototype.forEach.call(story.querySelectorAll(".story-note"), function (note) {
        note.removeAttribute("aria-hidden");
        note.removeAttribute("aria-current");
      });
      Array.prototype.forEach.call(story.querySelectorAll(".story-cluster .phone"), function (phone) {
        phone.removeAttribute("aria-hidden");
      });
    });
  }

  function setStoryPhase(story, index, opacity, x) {
    story.style.setProperty("--story-note-" + index + "-opacity", opacity.toFixed(4));
    story.style.setProperty("--story-note-" + index + "-y", (10 * (1 - opacity)).toFixed(2) + "px");
    story.style.setProperty("--story-phone-" + index + "-opacity", opacity.toFixed(4));
    story.style.setProperty("--story-phone-" + index + "-x", x.toFixed(2) + "%");
    story.style.setProperty("--story-phone-" + index + "-scale", (0.985 + 0.015 * opacity).toFixed(4));
  }

  function updateStoryValues(story, progress) {
    var late = ramp(progress, 0.72, 1);
    var oneExit = ramp(progress, 0.24, 0.31);
    var twoEnter = ramp(progress, 0.31, 0.38);
    var twoExit = ramp(progress, 0.57, 0.64);
    var threeEnter = ramp(progress, 0.64, 0.71);
    var phaseOne = 1 - oneExit;
    var phaseTwo = twoEnter * (1 - twoExit);
    var phaseThree = threeEnter;
    var activeIndex = progress < 0.31 ? 1 : progress < 0.64 ? 2 : 3;

    story.style.setProperty("--story-progress", progress.toFixed(4));
    story.style.setProperty("--story-copy-y", (-30 * ramp(progress, 0.08, 0.9)).toFixed(2) + "px");
    story.style.setProperty("--story-copy-opacity", (1 - 0.32 * late).toFixed(4));
    story.style.setProperty("--story-glow-x", (-24 + 48 * progress).toFixed(2) + "px");
    story.style.setProperty("--story-glow-y", (18 - 36 * progress).toFixed(2) + "px");
    story.style.setProperty("--story-glow-scale", (0.9 + 0.08 * ramp(progress, 0, 0.18)).toFixed(4));
    setStoryPhase(story, 1, phaseOne, -25 * oneExit);
    setStoryPhase(story, 2, phaseTwo, 25 * (1 - twoEnter) - 25 * twoExit);
    setStoryPhase(story, 3, phaseThree, 25 * (1 - threeEnter));
    Array.prototype.forEach.call(story.querySelectorAll(".story-note"), function (note, noteIndex) {
      var active = noteIndex + 1 === activeIndex;
      note.setAttribute("aria-hidden", active ? "false" : "true");
      if (active) note.setAttribute("aria-current", "step");
      else note.removeAttribute("aria-current");
    });
    Array.prototype.forEach.call(story.querySelectorAll(".story-cluster .phone"), function (phone, phoneIndex) {
      phone.setAttribute("aria-hidden", phoneIndex + 1 === activeIndex ? "false" : "true");
    });
  }

  function updateMotionValues() {
    motionFrame = 0;
    if (!motionRunning || motionPreference.matches) return;

    var viewportHeight = window.innerHeight || document.documentElement.clientHeight || 1;
    if (hero) {
      var heroRect = hero.getBoundingClientRect();
      var heroTravel = Math.max(heroRect.height * 0.82, 1);
      var heroProgress = clamp(-heroRect.top / heroTravel, 0, 1);
      hero.style.setProperty("--hero-progress", heroProgress.toFixed(4));
      hero.style.setProperty("--hero-copy-y", (-112 * heroProgress).toFixed(2) + "px");
      hero.style.setProperty("--hero-copy-opacity", (1 - 0.38 * heroProgress).toFixed(4));
      hero.style.setProperty("--hero-visual-y", (-74 * heroProgress).toFixed(2) + "px");
      hero.style.setProperty("--hero-visual-scale", (1 - 0.035 * heroProgress).toFixed(4));
    }

    storyScenes.forEach(function (story) {
      var storyRect = story.getBoundingClientRect();
      var storyTravel = Math.max(storyRect.height - viewportHeight, 1);
      var storyProgress = clamp(-storyRect.top / storyTravel, 0, 1);
      updateStoryValues(story, storyProgress);
    });

  }

  function scheduleMotionUpdate() {
    var currentScrollY = window.scrollY || window.pageYOffset || 0;
    if (Math.abs(currentScrollY - lastScrollY) > 1) {
      scrollDirection = currentScrollY > lastScrollY ? "down" : "up";
      lastScrollY = currentScrollY;
    }
    if (!motionFrame && motionRunning && !motionPreference.matches) {
      motionFrame = requestFrame(updateMotionValues);
    }
  }

  function setupObservers() {
    if (!("IntersectionObserver" in window)) {
      revealEls.forEach(function (el) { el.classList.add("in"); });
      countEls.forEach(finishCount);
      return;
    }

    revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.14) {
          entry.target.classList.remove("from-above", "from-below");
          entry.target.classList.add(scrollDirection === "up" ? "from-above" : "from-below");
          entry.target.classList.add("in");
        } else if (!entry.isIntersecting) {
          entry.target.classList.remove("in");
        }
      });
    }, { threshold: [0, 0.14], rootMargin: "72px 0px 72px 0px" });
    revealEls.forEach(function (el) { revealObserver.observe(el); });

    countObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          countObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.65 });
    countEls.forEach(function (el) {
      var info = countInfo(el);
      if (!hasCounted(el) && info.value > 0) {
        el.textContent = formatCount(0, info.decimals);
        countObserver.observe(el);
      } else {
        finishCount(el);
      }
    });
  }

  function disconnectObservers() {
    if (revealObserver) revealObserver.disconnect();
    if (countObserver) countObserver.disconnect();
    revealObserver = null;
    countObserver = null;
  }

  function startMotion() {
    if (motionRunning || motionPreference.matches) return;
    motionRunning = true;
    document.body.classList.remove("motion-reduced");
    document.body.classList.add("motion-ready");
    prepareReveals();
    setupObservers();
    window.addEventListener("scroll", scheduleMotionUpdate, { passive: true });
    window.addEventListener("resize", scheduleMotionUpdate, { passive: true });
    updateMotionValues();
  }

  function stopMotion() {
    motionRunning = false;
    disconnectObservers();
    window.removeEventListener("scroll", scheduleMotionUpdate);
    window.removeEventListener("resize", scheduleMotionUpdate);
    if (motionFrame) cancelFrame(motionFrame);
    motionFrame = 0;
    cancelCounts();
  }

  function applyReducedMotion() {
    stopMotion();
    document.body.classList.remove("motion-ready");
    document.body.classList.add("motion-reduced");
    revealEls.forEach(function (el) {
      el.style.transitionDelay = "0ms";
      el.classList.add("in");
    });
    setNeutralMotionValues();
  }

  function syncMotionPreference() {
    if (motionPreference.matches) applyReducedMotion();
    else startMotion();
  }

  if (motionPreference.addEventListener) {
    motionPreference.addEventListener("change", syncMotionPreference);
  } else {
    motionPreference.addListener(syncMotionPreference);
  }

  syncMotionPreference();
})();
