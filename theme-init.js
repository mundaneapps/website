(function () {
  "use strict";

  var storageKey = "mundaneapps-theme";
  var stored = null;
  try { stored = window.localStorage.getItem(storageKey); } catch (_) {}
  if (stored !== "light" && stored !== "dark") {
    try {
      var cookieMatch = document.cookie.match(/(?:^|;\s*)mundaneapps-theme=(light|dark)(?:;|$)/);
      stored = cookieMatch ? cookieMatch[1] : null;
    } catch (_) {}
  }

  var theme = stored === "light" || stored === "dark"
    ? stored
    : (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");

  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}());
