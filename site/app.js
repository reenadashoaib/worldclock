(function () {
  "use strict";

  // [city, country, IANA time zone]
  var CITIES = [
    ["Honolulu", "United States", "Pacific/Honolulu"],
    ["Anchorage", "United States", "America/Anchorage"],
    ["Los Angeles", "United States", "America/Los_Angeles"],
    ["San Francisco", "United States", "America/Los_Angeles"],
    ["Seattle", "United States", "America/Los_Angeles"],
    ["Vancouver", "Canada", "America/Vancouver"],
    ["Phoenix", "United States", "America/Phoenix"],
    ["Denver", "United States", "America/Denver"],
    ["Mexico City", "Mexico", "America/Mexico_City"],
    ["Chicago", "United States", "America/Chicago"],
    ["Houston", "United States", "America/Chicago"],
    ["New York", "United States", "America/New_York"],
    ["Toronto", "Canada", "America/Toronto"],
    ["Miami", "United States", "America/New_York"],
    ["Bogotá", "Colombia", "America/Bogota"],
    ["Lima", "Peru", "America/Lima"],
    ["Caracas", "Venezuela", "America/Caracas"],
    ["Halifax", "Canada", "America/Halifax"],
    ["Santiago", "Chile", "America/Santiago"],
    ["St. John's", "Canada", "America/St_Johns"],
    ["Buenos Aires", "Argentina", "America/Argentina/Buenos_Aires"],
    ["São Paulo", "Brazil", "America/Sao_Paulo"],
    ["Rio de Janeiro", "Brazil", "America/Sao_Paulo"],
    ["Reykjavík", "Iceland", "Atlantic/Reykjavik"],
    ["Accra", "Ghana", "Africa/Accra"],
    ["Lisbon", "Portugal", "Europe/Lisbon"],
    ["London", "United Kingdom", "Europe/London"],
    ["Dublin", "Ireland", "Europe/Dublin"],
    ["Casablanca", "Morocco", "Africa/Casablanca"],
    ["Lagos", "Nigeria", "Africa/Lagos"],
    ["Paris", "France", "Europe/Paris"],
    ["Madrid", "Spain", "Europe/Madrid"],
    ["Berlin", "Germany", "Europe/Berlin"],
    ["Amsterdam", "Netherlands", "Europe/Amsterdam"],
    ["Rome", "Italy", "Europe/Rome"],
    ["Stockholm", "Sweden", "Europe/Stockholm"],
    ["Warsaw", "Poland", "Europe/Warsaw"],
    ["Johannesburg", "South Africa", "Africa/Johannesburg"],
    ["Cairo", "Egypt", "Africa/Cairo"],
    ["Athens", "Greece", "Europe/Athens"],
    ["Kyiv", "Ukraine", "Europe/Kyiv"],
    ["Tel Aviv", "Israel", "Asia/Jerusalem"],
    ["Istanbul", "Türkiye", "Europe/Istanbul"],
    ["Moscow", "Russia", "Europe/Moscow"],
    ["Nairobi", "Kenya", "Africa/Nairobi"],
    ["Riyadh", "Saudi Arabia", "Asia/Riyadh"],
    ["Doha", "Qatar", "Asia/Qatar"],
    ["Tehran", "Iran", "Asia/Tehran"],
    ["Dubai", "United Arab Emirates", "Asia/Dubai"],
    ["Karachi", "Pakistan", "Asia/Karachi"],
    ["Lahore", "Pakistan", "Asia/Karachi"],
    ["Islamabad", "Pakistan", "Asia/Karachi"],
    ["Mumbai", "India", "Asia/Kolkata"],
    ["Delhi", "India", "Asia/Kolkata"],
    ["Bengaluru", "India", "Asia/Kolkata"],
    ["Kathmandu", "Nepal", "Asia/Kathmandu"],
    ["Dhaka", "Bangladesh", "Asia/Dhaka"],
    ["Bangkok", "Thailand", "Asia/Bangkok"],
    ["Jakarta", "Indonesia", "Asia/Jakarta"],
    ["Ho Chi Minh City", "Vietnam", "Asia/Ho_Chi_Minh"],
    ["Singapore", "Singapore", "Asia/Singapore"],
    ["Kuala Lumpur", "Malaysia", "Asia/Kuala_Lumpur"],
    ["Manila", "Philippines", "Asia/Manila"],
    ["Hong Kong", "China", "Asia/Hong_Kong"],
    ["Shanghai", "China", "Asia/Shanghai"],
    ["Beijing", "China", "Asia/Shanghai"],
    ["Taipei", "Taiwan", "Asia/Taipei"],
    ["Perth", "Australia", "Australia/Perth"],
    ["Seoul", "South Korea", "Asia/Seoul"],
    ["Tokyo", "Japan", "Asia/Tokyo"],
    ["Adelaide", "Australia", "Australia/Adelaide"],
    ["Brisbane", "Australia", "Australia/Brisbane"],
    ["Sydney", "Australia", "Australia/Sydney"],
    ["Melbourne", "Australia", "Australia/Melbourne"],
    ["Suva", "Fiji", "Pacific/Fiji"],
    ["Auckland", "New Zealand", "Pacific/Auckland"]
  ];

  var DEFAULT_CITIES = [
    "Los Angeles", "New York", "São Paulo", "London", "Paris", "Lagos",
    "Dubai", "Mumbai", "Singapore", "Hong Kong", "Tokyo", "Sydney"
  ];

  var STORE_CITIES = "hourline.cities";
  var STORE_HOURS = "hourline.24h";
  var IN_LIST_AD_AFTER = 5;

  // Sky colour at each local hour: [hour, r, g, b]
  var SKY = [
    [0, 31, 39, 71],
    [4.5, 38, 48, 88],
    [6, 233, 168, 128],
    [7.5, 207, 228, 245],
    [12, 186, 219, 247],
    [16.5, 207, 228, 245],
    [18.5, 240, 168, 117],
    [20, 59, 63, 110],
    [24, 31, 39, 71]
  ];

  // ---------- Small helpers ----------

  function storageGet(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  }
  function storageSet(key, value) {
    try { localStorage.setItem(key, value); } catch (e) { /* Not saved; the page still works. */ }
  }

  function zoneIsSupported(tz) {
    try {
      new Intl.DateTimeFormat("en-US", { timeZone: tz });
      return true;
    } catch (e) {
      return false;
    }
  }

  function fold(text) {
    return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
  }

  var partsFormatters = {};
  function partsAt(tz, date) {
    var f = partsFormatters[tz];
    if (!f) {
      f = partsFormatters[tz] = new Intl.DateTimeFormat("en-US", {
        timeZone: tz, hourCycle: "h23",
        year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit", second: "2-digit"
      });
    }
    var out = {};
    f.formatToParts(date).forEach(function (p) { out[p.type] = p.value; });
    return {
      year: +out.year, month: +out.month, day: +out.day,
      hour: +out.hour % 24, minute: +out.minute, second: +out.second
    };
  }

  // Minutes ahead of UTC for a zone at a given moment.
  function offsetMinutes(tz, date) {
    var p = partsAt(tz, date);
    var asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute);
    return Math.round((asUtc - Math.floor(date.getTime() / 60000) * 60000) / 60000);
  }

  var abbrFormatters = {};
  function zoneAbbr(tz, date) {
    var f = abbrFormatters[tz];
    if (!f) f = abbrFormatters[tz] = new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: "short" });
    var part = f.formatToParts(date).filter(function (p) { return p.type === "timeZoneName"; })[0];
    return part ? part.value : "";
  }

  function formatDiff(minutes) {
    var sign = minutes < 0 ? "−" : "+";
    var abs = Math.abs(minutes);
    var h = Math.floor(abs / 60);
    var m = abs % 60;
    var text = h ? h + " h" : "";
    if (m) text += (text ? " " : "") + m + " min";
    return sign + text;
  }

  function pad(n) { return (n < 10 ? "0" : "") + n; }

  function hourText(hour, use24) {
    if (use24) return { hh: pad(hour), suffix: "" };
    var h12 = hour % 12 || 12;
    return { hh: String(h12), suffix: hour < 12 ? "AM" : "PM" };
  }

  function skyColor(hour) {
    for (var i = 1; i < SKY.length; i++) {
      if (hour <= SKY[i][0]) {
        var a = SKY[i - 1];
        var b = SKY[i];
        var t = (hour - a[0]) / (b[0] - a[0]);
        return [1, 2, 3].map(function (k) { return Math.round(a[k] + (b[k] - a[k]) * t); });
      }
    }
    return SKY[0].slice(1);
  }

  var LIGHT_TEXT = [255, 255, 255];
  var DARK_TEXT = [16, 24, 44];

  function luminance(rgb) {
    var c = rgb.map(function (v) {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  }

  function contrast(a, b) {
    var x = luminance(a);
    var y = luminance(b);
    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
  }

  // Picks the text colour that reads best on a sky colour. Twilight mid-tones are nudged
  // darker or lighter until the text passes 4.5:1.
  function readableSky(rgb) {
    var light = contrast(LIGHT_TEXT, rgb) >= contrast(DARK_TEXT, rgb);
    var bg = rgb.slice();
    for (var i = 0; i < 24 && contrast(light ? LIGHT_TEXT : DARK_TEXT, bg) < 4.6; i++) {
      bg = bg.map(function (v) { return Math.round(light ? v * 0.94 : v + (255 - v) * 0.08); });
    }
    return { bg: bg, dark: light };
  }

  // ---------- State ----------

  var cities = CITIES
    .filter(function (c) { return zoneIsSupported(c[2]); })
    .map(function (c) { return { name: c[0], country: c[1], tz: c[2] }; });
  var byName = {};
  cities.forEach(function (c) { byName[fold(c.name)] = c; });

  var homeTz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  var homeCity = cities.filter(function (c) { return c.tz === homeTz; })[0] || {
    name: homeTz.split("/").pop().replace(/_/g, " "),
    country: "",
    tz: homeTz
  };

  function loadChosen() {
    var saved = null;
    try { saved = JSON.parse(storageGet(STORE_CITIES)); } catch (e) { saved = null; }
    var names = Array.isArray(saved) ? saved : DEFAULT_CITIES;
    return names.filter(function (n) { return byName[fold(n)]; });
  }

  var chosen = loadChosen();
  var shiftMinutes = 0;

  var savedHours = storageGet(STORE_HOURS);
  var use24 = savedHours === null
    ? /^h2/.test(new Intl.DateTimeFormat(undefined, { hour: "numeric" }).resolvedOptions().hourCycle || "h23")
    : savedHours === "1";

  // ---------- Elements ----------

  var listEl = document.getElementById("city-list");
  var homeNameEl = document.getElementById("home-name");
  var homeClockEl = document.getElementById("home-clock");
  var homeDateEl = document.getElementById("home-date");
  var shiftEl = document.getElementById("shift");
  var shiftOutEl = document.getElementById("shift-out");
  var shiftResetEl = document.getElementById("shift-reset");
  var shiftScaleEls = document.querySelectorAll("#shift-scale span");
  var formatBtn = document.getElementById("hour-format");
  var resetBtn = document.getElementById("reset-list");
  var form = document.getElementById("add-form");
  var input = document.getElementById("add-input");
  var msg = document.getElementById("add-msg");
  var options = document.getElementById("city-options");

  homeNameEl.textContent = homeCity.name;

  cities.forEach(function (c) {
    var opt = document.createElement("option");
    opt.value = c.name + ", " + c.country;
    options.appendChild(opt);
  });

  // The in-list ad stays in place while rows are added around it, so the ad never reloads.
  var listAd = document.createElement("li");
  listAd.className = "list-ad";
  var listAdSlot = document.createElement("div");
  listAdSlot.className = "ad";
  listAdSlot.dataset.ad = "infeed";
  listAdSlot.dataset.size = "728x90";
  listAdSlot.dataset.sizeSm = "320x100";
  listAd.appendChild(listAdSlot);
  listEl.appendChild(listAd);

  var rows = [];

  function buildRow(city, isHome) {
    var li = document.createElement("li");
    li.className = "city" + (isHome ? " is-home" : "");

    var info = document.createElement("div");
    var name = document.createElement("p");
    name.className = "city-name";
    name.textContent = city.name;
    var meta = document.createElement("p");
    meta.className = "city-meta";
    var where = document.createElement("span");
    var diff = document.createElement("span");
    var day = document.createElement("span");
    meta.appendChild(where);
    meta.appendChild(diff);
    meta.appendChild(day);
    info.appendChild(name);
    info.appendChild(meta);

    var time = document.createElement("p");
    time.className = "city-time";

    li.appendChild(info);
    li.appendChild(time);

    if (!isHome) {
      var remove = document.createElement("button");
      remove.type = "button";
      remove.className = "city-remove";
      remove.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
      remove.setAttribute("aria-label", "Remove " + city.name);
      remove.addEventListener("click", function () { removeCity(city.name); });
      li.appendChild(remove);
    }

    return { city: city, el: li, where: where, diff: diff, day: day, time: time };
  }

  function render() {
    rows.forEach(function (r) { r.el.remove(); });

    var now = new Date();
    var list = chosen.map(function (n) { return byName[fold(n)]; });
    var hasHome = list.some(function (c) { return c.tz === homeTz && c.name === homeCity.name; });
    if (!hasHome) list.push(homeCity);

    list.sort(function (a, b) {
      return offsetMinutes(a.tz, now) - offsetMinutes(b.tz, now) || a.name.localeCompare(b.name);
    });

    rows = list.map(function (c) { return buildRow(c, c === homeCity); });

    var adAt = Math.min(IN_LIST_AD_AFTER, rows.length);
    rows.forEach(function (r, i) {
      if (i < adAt) listEl.insertBefore(r.el, listAd);
      else listEl.appendChild(r.el);
    });
    if (window.HourlineAds) window.HourlineAds.fill(listAdSlot);

    tick();
  }

  function save() {
    storageSet(STORE_CITIES, JSON.stringify(chosen));
  }

  function removeCity(name) {
    chosen = chosen.filter(function (n) { return fold(n) !== fold(name); });
    save();
    render();
    msg.textContent = name + " removed.";
  }

  // ---------- Clock updates ----------

  function dateKey(p) { return p.year * 10000 + p.month * 100 + p.day; }

  function digits(text) {
    return text.split("").map(function (ch) { return '<span class="d">' + ch + "</span>"; }).join("");
  }

  var homeDateFormat = null;
  function updateHero(at) {
    var p = partsAt(homeTz, at);
    var h = hourText(p.hour, use24);
    homeClockEl.innerHTML =
      digits(h.hh) + '<span class="sep">:</span>' + digits(pad(p.minute)) +
      '<span class="sec">' + digits(pad(p.second)) + "</span>" +
      (h.suffix ? '<span class="ampm">' + h.suffix + "</span>" : "");
    if (!homeDateFormat) {
      homeDateFormat = new Intl.DateTimeFormat(undefined, {
        timeZone: homeTz, weekday: "long", day: "numeric", month: "long", year: "numeric"
      });
    }
    homeDateEl.textContent = homeDateFormat.format(at) + ", " + zoneAbbr(homeTz, at);
  }

  function updateRow(r, at, homeOffset, homeDay) {
    var p = partsAt(r.city.tz, at);
    var h = hourText(p.hour, use24);
    var off = offsetMinutes(r.city.tz, at);
    var dayDiff = Math.sign(dateKey(p) - homeDay);

    r.time.innerHTML = "";
    r.time.appendChild(document.createTextNode(h.hh + ":" + pad(p.minute)));
    if (h.suffix) {
      var s = document.createElement("small");
      s.textContent = h.suffix;
      r.time.appendChild(s);
    }

    r.where.textContent = (r.city.country ? r.city.country + " " : "") + zoneAbbr(r.city.tz, at);
    var d = off - homeOffset;
    r.diff.textContent = d === 0 ? "same time as you" : formatDiff(Math.abs(d)).slice(1) + (d > 0 ? " ahead" : " behind");
    r.day.textContent = dayDiff > 0 ? "tomorrow" : dayDiff < 0 ? "yesterday" : "today";

    var sky = readableSky(skyColor(p.hour + p.minute / 60));
    r.el.style.setProperty("--sky", "rgb(" + sky.bg.join(",") + ")");
    r.el.classList.toggle("is-dark", sky.dark);
  }

  // Paints the slider track with your next and previous 12 hours of sky, and labels it.
  var bandKey = "";
  function updateDayBand() {
    var now = new Date();
    var p = partsAt(homeTz, now);
    var key = p.hour + ":" + p.minute + ":" + use24;
    if (key === bandKey) return;
    bandKey = key;

    var nowHour = p.hour + p.minute / 60;
    var stops = [];
    for (var k = 0; k <= 48; k++) {
      var hour = (((nowHour - 12 + k / 2) % 24) + 24) % 24;
      stops.push("rgb(" + skyColor(hour).join(",") + ") " + (k / 48 * 100).toFixed(2) + "%");
    }
    shiftEl.style.setProperty("--day-band", "linear-gradient(90deg, " + stops.join(", ") + ")");

    [-12, -6, 0, 6, 12].forEach(function (h, i) {
      var q = partsAt(homeTz, new Date(now.getTime() + h * 3600000));
      var t = hourText(q.hour, use24);
      shiftScaleEls[i].textContent = h === 0 ? "Now" : t.hh + ":" + pad(q.minute) + (t.suffix ? " " + t.suffix : "");
    });
  }

  function tick() {
    updateDayBand();
    var at = new Date(Date.now() + shiftMinutes * 60000);
    updateHero(at);
    var homeOffset = offsetMinutes(homeTz, at);
    var homeDay = dateKey(partsAt(homeTz, at));
    rows.forEach(function (r) { updateRow(r, at, homeOffset, homeDay); });
  }

  function scheduleTick() {
    tick();
    setTimeout(scheduleTick, 1000 - (Date.now() % 1000) + 5);
  }

  // ---------- Controls ----------

  function updateShiftText() {
    if (shiftMinutes === 0) {
      shiftOutEl.textContent = "Showing the time now";
      shiftResetEl.hidden = true;
    } else {
      var text = formatDiff(Math.abs(shiftMinutes)).slice(1);
      shiftOutEl.textContent = "Showing " + text + (shiftMinutes > 0 ? " from now" : " ago");
      shiftResetEl.hidden = false;
    }
  }

  shiftEl.addEventListener("input", function () {
    shiftMinutes = +shiftEl.value;
    updateShiftText();
    tick();
  });

  shiftResetEl.addEventListener("click", function () {
    shiftMinutes = 0;
    shiftEl.value = "0";
    updateShiftText();
    tick();
    shiftEl.focus();
  });

  function updateFormatButton() {
    formatBtn.setAttribute("aria-pressed", use24 ? "true" : "false");
  }

  formatBtn.addEventListener("click", function () {
    use24 = !use24;
    storageSet(STORE_HOURS, use24 ? "1" : "0");
    updateFormatButton();
    tick();
  });

  resetBtn.addEventListener("click", function () {
    chosen = DEFAULT_CITIES.slice();
    save();
    render();
    msg.textContent = "City list reset to the default cities.";
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var typed = input.value.trim();
    if (!typed) return;
    var city = byName[fold(typed.split(",")[0])];

    if (!city) {
      msg.textContent = "No city called “" + typed + "” in the list. Try a capital or a large city nearby.";
      return;
    }
    if (chosen.some(function (n) { return fold(n) === fold(city.name); }) || city === homeCity) {
      msg.textContent = city.name + " is already on your list.";
      return;
    }

    chosen.push(city.name);
    save();
    render();
    input.value = "";
    msg.textContent = city.name + " added.";
  });

  updateFormatButton();
  updateShiftText();
  render();
  scheduleTick();
})();
