// Island pages: download buttons and the live launch-price count.
(function () {
  var cfg = window.ISLAND_CONFIG || {};

  // Download buttons point at the release once it exists; until then they say so.
  document.querySelectorAll("[data-download]").forEach(function (a) {
    if (cfg.downloadURL) {
      a.href = cfg.downloadURL;
      a.setAttribute("download", "");
    } else if (a.getAttribute("href") !== "#install" || a.closest("#install")) {
      a.textContent = "Download coming soon";
      a.setAttribute("aria-disabled", "true");
      a.removeAttribute("href");
    }
  });
  document.querySelectorAll("[data-download-name]").forEach(function (s) {
    s.textContent = "Island .dmg file";
  });

  // Launch price: ask the server how many launch licences are left.
  var price = cfg.price || { regular: "$9.99", launch: "$4.99", launchSlots: 100 };
  function showOffer(left) {
    var on = left > 0;
    document.querySelectorAll("[data-price]").forEach(function (el) { el.textContent = on ? price.launch : price.regular; });
    document.querySelectorAll("[data-regular]").forEach(function (el) { el.textContent = price.regular; el.hidden = !on; });
    document.querySelectorAll("[data-offer-note]").forEach(function (el) {
      if (on) el.textContent = "Launch price for the first " + price.launchSlots + " buyers · " + left + " left";
    });
    document.querySelectorAll("[data-offer-block]").forEach(function (el) { el.hidden = !on; });
    document.querySelectorAll("[data-offer-left]").forEach(function (el) { el.textContent = left; });
    document.querySelectorAll("[data-offer-total]").forEach(function (el) { el.textContent = price.launchSlots; });
    document.querySelectorAll("[data-offer-bar]").forEach(function (el) {
      el.style.width = Math.max(2, Math.round((left / price.launchSlots) * 100)) + "%";
    });
  }
  window.IslandOffer = { show: showOffer };
  if (!cfg.api || !window.fetch) return;
  fetch(cfg.api + "/island-checkout", { method: "GET", cache: "no-store" })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (d) {
      if (!d) return;
      // After the launch places are gone the server reports the new regular price.
      if (d.regular_price) {
        price.regular = d.regular_price;
        document.querySelectorAll("[data-price]").forEach(function (el) { el.textContent = d.regular_price; });
      }
      if (d.offer_available) showOffer(d.offer_remaining);
      if (d.on_sale === false) {
        document.querySelectorAll("[data-offer-note]").forEach(function (el) {
          el.textContent = d.offer_available ? "Launch price for the first " + price.launchSlots + " buyers · on sale soon" : "On sale soon";
        });
        document.dispatchEvent(new CustomEvent("island:not-on-sale"));
      }
    })
    .catch(function () { /* regular price stays shown */ });
})();
