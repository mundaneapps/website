// Island buy page: server-side Paddle transaction, Paddle overlay checkout, licence recovery.
(function () {
  var cfg = window.ISLAND_CONFIG || {};
  var button = document.getElementById("buy-button");
  var status = document.getElementById("buy-status");
  var done = document.getElementById("buy-done");
  var paddleReady = false;

  function say(msg, isError) {
    status.textContent = msg || "";
    status.classList.toggle("error", !!isError);
  }

  function theme() {
    var t = document.documentElement.getAttribute("data-theme");
    if (t) return t === "dark" ? "dark" : "light";
    return window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  // Paddle.js. Also opens a checkout by itself when the page has ?_ptxn=… (Paddle payment links).
  if (window.Paddle && cfg.paddle && cfg.paddle.token) {
    try {
      if (cfg.paddle.environment === "sandbox") Paddle.Environment.set("sandbox");
      Paddle.Initialize({
        token: cfg.paddle.token,
        checkout: { settings: { displayMode: "overlay", theme: theme(), locale: "en", allowLogout: false } },
        eventCallback: function (e) {
          if (e && e.name === "checkout.completed") {
            done.classList.add("on");
            button.hidden = true;
            say("");
          }
        },
      });
      paddleReady = true;
    } catch (err) { paddleReady = false; }
  }

  function problem(code) {
    if (code === "rate_limited") return "Too many tries from this network. Please wait a few minutes and try again.";
    if (code === "checkout_unavailable") return "Checkout is unavailable right now. Please try again in a minute.";
    return "Something went wrong opening checkout. Please try again, or write to info@mundaneapps.com.";
  }

  button.addEventListener("click", function () {
    if (!paddleReady) { say("Checkout isn’t open yet. Island Pro goes on sale soon.", true); return; }
    button.disabled = true;
    say("Opening secure checkout…");
    fetch(cfg.api + "/island-checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" })
      .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
      .then(function (res) {
        if (!res.ok || !res.d.transaction_id) throw new Error(res.d && res.d.error);
        Paddle.Checkout.open({ transactionId: res.d.transaction_id });
        say(res.d.offer ? "Your launch price is held for 45 minutes." : "");
      })
      .catch(function (e) { say(problem(e && e.message), true); })
      .then(function () { button.disabled = false; });
  });

  // Lost licence: always the same answer, whether or not the email bought Island.
  var form = document.getElementById("recover-form");
  var rStatus = document.getElementById("recover-status");
  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    var email = document.getElementById("recover-email").value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { rStatus.textContent = "Enter the email you bought with."; return; }
    rStatus.textContent = "Sending…";
    fetch(cfg.api + "/island-recover", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: email }) })
      .then(function (r) { return r.json().then(function (d) { return { status: r.status, d: d }; }); })
      .then(function (res) {
        rStatus.textContent = res.status === 429 ? "Too many requests. Please try again in an hour."
          : res.d && res.d.message ? res.d.message : "If that email bought Island Pro, the licence is on its way.";
      })
      .catch(function () { rStatus.textContent = "Couldn’t reach MundaneApps. Please try again, or write to info@mundaneapps.com."; });
  });
})();
