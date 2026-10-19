/*
 * Fills every element with a data-ad attribute using the settings in ad-config.js,
 * and runs the bottom-right video dock and the full-screen ad.
 * You should not need to edit this file; change ad-config.js instead.
 */
(function () {
  "use strict";

  var config = window.AD_CONFIG || {};
  var slots = config.slots || {};
  var house = config.house || {};
  var client = (config.adsenseClient || "").trim();
  var SMALL_SCREEN = 768;

  function loadAdSense() {
    if (!client || document.querySelector("script[data-adsense]")) return;
    var s = document.createElement("script");
    s.async = true;
    s.crossOrigin = "anonymous";
    s.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=" + encodeURIComponent(client);
    s.setAttribute("data-adsense", "");
    document.head.appendChild(s);
  }

  function parseSize(value) {
    var m = /^(\d+)x(\d+)$/.exec(value || "");
    return m ? { w: +m[1], h: +m[2] } : null;
  }

  // Use the phone size when the screen is small or the space is too narrow for the full size.
  function pickSize(el) {
    var size = parseSize(el.dataset.size);
    var small = parseSize(el.dataset.sizeSm);
    var room = el.dataset.fit === "screen" || !el.parentElement ? window.innerWidth : el.parentElement.clientWidth;
    if (small && size && (window.innerWidth < SMALL_SCREEN || room < size.w)) return small;
    return size;
  }

  function isVisible(el) {
    return el.getClientRects().length > 0;
  }

  function label() {
    var span = document.createElement("span");
    span.className = "ad-label";
    span.textContent = "Advertisement";
    return span;
  }

  function sizedBox(size, extraClass) {
    var box = document.createElement("div");
    box.className = "ad-slot" + (extraClass ? " " + extraClass : "");
    if (size) {
      box.style.width = size.w + "px";
      box.style.height = size.h + "px";
    }
    return box;
  }

  function houseCreative(name, size) {
    var c = house[name];
    var box = sizedBox(size, "ad-house");
    var link = document.createElement("a");
    link.href = c.href || "#";
    link.target = "_blank";
    link.rel = "sponsored noopener";
    if (c.video) {
      var v = document.createElement("video");
      v.src = c.video;
      if (c.poster) v.poster = c.poster;
      v.muted = true;
      v.autoplay = true;
      v.loop = true;
      v.playsInline = true;
      v.setAttribute("aria-label", c.alt || "Video advertisement");
      link.appendChild(v);
    } else {
      var img = document.createElement("img");
      img.src = c.image;
      img.alt = c.alt || "Advertisement";
      img.loading = "lazy";
      link.appendChild(img);
    }
    box.appendChild(link);
    return box;
  }

  function adsenseUnit(slotId, size) {
    var box = sizedBox(size);
    var ins = document.createElement("ins");
    ins.className = "adsbygoogle";
    ins.style.display = "inline-block";
    if (size) {
      ins.style.width = size.w + "px";
      ins.style.height = size.h + "px";
    } else {
      ins.style.width = "100%";
      ins.style.height = "100%";
    }
    ins.setAttribute("data-ad-client", client);
    ins.setAttribute("data-ad-slot", slotId);
    box.appendChild(ins);
    return box;
  }

  function placeholder(size, text) {
    var box = sizedBox(size, "ad-placeholder");
    var title = document.createElement("strong");
    title.textContent = text || "This ad space is available";
    var dims = document.createElement("span");
    dims.textContent = size ? size.w + " × " + size.h : "Full screen";
    var link = document.createElement("a");
    link.href = config.advertiseUrl || "/about.html#advertise";
    link.textContent = "Advertise here";
    box.appendChild(title);
    box.appendChild(dims);
    box.appendChild(link);
    return box;
  }

  function fill(el) {
    if (el.dataset.filled || !isVisible(el)) return;
    var name = el.dataset.ad;
    var size = el.dataset.size === "fill" ? null : pickSize(el);
    var slotId = slots[name];

    if (name === "interstitial" && slotId) {
      console.warn("Hourline ads: AdSense is not allowed in pop-ups, so the full-screen space ignores slots.interstitial. Use a direct-sold creative instead.");
      slotId = "";
    }

    el.dataset.filled = "true";
    el.appendChild(label());

    if (house[name] && (house[name].image || house[name].video)) {
      el.appendChild(houseCreative(name, size));
    } else if (client && slotId) {
      el.appendChild(adsenseUnit(slotId, size));
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (e) {
        console.warn("Hourline ads: AdSense could not fill " + name, e);
      }
    } else {
      el.appendChild(placeholder(size));
    }
  }

  function fillAll() {
    document.querySelectorAll(".ad[data-ad]").forEach(fill);
  }

  function closeButton(className, text, ariaLabel) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = className;
    b.textContent = text;
    if (ariaLabel) b.setAttribute("aria-label", ariaLabel);
    return b;
  }

  // ---------- Bottom-right video dock ----------

  function setupVideoDock() {
    var opts = config.videoDock || {};
    if (opts.enabled === false) return;

    var dock = document.createElement("aside");
    dock.className = "video-dock";
    dock.setAttribute("aria-label", "Video advertisement");
    dock.hidden = true;

    var bar = document.createElement("div");
    bar.className = "video-dock-bar";
    var tag = label();
    var close = closeButton("icon-close", "×", "Close video ad");
    bar.appendChild(tag);
    bar.appendChild(close);

    var ad = document.createElement("div");
    ad.className = "ad";
    ad.dataset.ad = "video";
    ad.dataset.size = "320x180";
    ad.dataset.sizeSm = "224x126";
    ad.dataset.fit = "screen";

    dock.appendChild(bar);
    dock.appendChild(ad);
    document.body.appendChild(dock);

    close.addEventListener("click", function () {
      dock.remove();
    });

    setTimeout(function () {
      dock.hidden = false;
      fill(ad);
      // The dock already shows its own label in the bar.
      var inner = ad.querySelector(".ad-label");
      if (inner) inner.remove();
    }, (opts.delaySeconds || 0) * 1000);
  }

  // ---------- Full-screen ad ----------

  function alreadySeenInterstitial() {
    try {
      return sessionStorage.getItem("hourline.interstitialSeen") === "1";
    } catch (e) {
      return false;
    }
  }

  function markInterstitialSeen() {
    try {
      sessionStorage.setItem("hourline.interstitialSeen", "1");
    } catch (e) {
      /* Storage blocked: the ad may show again on the next page. */
    }
  }

  function setupInterstitial() {
    var opts = config.interstitial || {};
    if (opts.enabled === false || alreadySeenInterstitial()) return;

    var overlay = document.createElement("div");
    overlay.className = "interstitial";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "Advertisement");
    overlay.hidden = true;

    var bar = document.createElement("div");
    bar.className = "interstitial-bar";
    var close = closeButton("interstitial-close", "Close ad");
    bar.appendChild(label());
    bar.appendChild(close);

    var body = document.createElement("div");
    body.className = "interstitial-body";
    var ad = document.createElement("div");
    ad.className = "ad";
    ad.dataset.ad = "interstitial";
    ad.dataset.size = "fill";
    body.appendChild(ad);

    overlay.appendChild(bar);
    overlay.appendChild(body);
    document.body.appendChild(overlay);

    var returnFocus = null;

    function sizeCreative() {
      var box = ad.querySelector(".ad-slot");
      if (!box) return;
      var w = Math.min(960, body.clientWidth);
      var h = Math.min(640, body.clientHeight);
      box.style.width = w + "px";
      box.style.height = h + "px";
    }

    function hide() {
      overlay.hidden = true;
      document.body.classList.remove("no-scroll");
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", sizeCreative);
      if (returnFocus && returnFocus.focus) returnFocus.focus();
    }

    function onKey(e) {
      if (e.key === "Escape") {
        hide();
      } else if (e.key === "Tab") {
        var focusable = overlay.querySelectorAll("a[href], button, video[controls], iframe");
        if (!focusable.length) return;
        var first = focusable[0];
        var last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    function show() {
      returnFocus = document.activeElement;
      overlay.hidden = false;
      document.body.classList.add("no-scroll");
      fill(ad);
      var inner = ad.querySelector(".ad-label");
      if (inner) inner.remove();
      sizeCreative();
      markInterstitialSeen();
      close.focus();
      document.addEventListener("keydown", onKey);
      window.addEventListener("resize", sizeCreative);
    }

    close.addEventListener("click", hide);

    setTimeout(show, (opts.delaySeconds || 0) * 1000);
  }

  function init() {
    loadAdSense();
    fillAll();
    setupVideoDock();
    setupInterstitial();

    // Spaces hidden on small screens (like the side banners) fill when they become visible.
    var timer;
    window.addEventListener("resize", function () {
      clearTimeout(timer);
      timer = setTimeout(fillAll, 250);
    });
  }

  window.HourlineAds = { fill: fill };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
