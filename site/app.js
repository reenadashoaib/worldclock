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

  // ---------- Cities ----------

  // A city is { name, region, country, tz }. Its id tells apart places that share a name.
  function cityId(c) {
    return fold(c.name + "|" + (c.region || "") + "|" + (c.country || ""));
  }

  function cityPlace(c) {
    return [c.region, c.country].filter(Boolean).join(", ");
  }

  var cities = CITIES
    .filter(function (c) { return zoneIsSupported(c[2]); })
    .map(function (c) { return { name: c[0], region: "", country: c[1], tz: c[2] }; });
  var byName = {};
  cities.forEach(function (c) { byName[fold(c.name)] = c; });

  var homeTz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  var homeCity = cities.filter(function (c) { return c.tz === homeTz; })[0] || {
    name: homeTz.split("/").pop().replace(/_/g, " "),
    region: "",
    country: "",
    tz: homeTz
  };

  // Saved lists hold city names (older visits and the defaults) or full city objects
  // (cities added from search).
  function resolveSaved(entry) {
    if (typeof entry === "string") return byName[fold(entry)] || null;
    if (entry && typeof entry.name === "string" && typeof entry.tz === "string" && zoneIsSupported(entry.tz)) {
      return {
        name: entry.name,
        region: typeof entry.region === "string" ? entry.region : "",
        country: typeof entry.country === "string" ? entry.country : "",
        tz: entry.tz
      };
    }
    return null;
  }

  function defaultCities() {
    return DEFAULT_CITIES.map(resolveSaved).filter(Boolean);
  }

  function loadChosen() {
    var saved = null;
    try { saved = JSON.parse(storageGet(STORE_CITIES)); } catch (e) { saved = null; }
    if (!Array.isArray(saved)) return defaultCities();
    var seen = {};
    return saved.map(resolveSaved).filter(function (c) {
      if (!c || seen[cityId(c)]) return false;
      seen[cityId(c)] = true;
      return true;
    });
  }

  var chosen = loadChosen();
  var shiftMinutes = 0;

  var savedHours = storageGet(STORE_HOURS);
  var use24 = savedHours === null
    ? /^h2/.test(new Intl.DateTimeFormat(undefined, { hour: "numeric" }).resolvedOptions().hourCycle || "h23")
    : savedHours === "1";

  function isOnList(city) {
    var id = cityId(city);
    return id === cityId(homeCity) || chosen.some(function (c) { return cityId(c) === id; });
  }

  // ---------- Elements ----------

  var listEl = document.getElementById("city-list");
  var homeNameEl = document.getElementById("home-name");
  var homeClockEl = document.getElementById("home-clock");
  var homeDateEl = document.getElementById("home-date");
  var homeDialEl = document.getElementById("home-dial");
  var shiftEl = document.getElementById("shift");
  var shiftOutEl = document.getElementById("shift-out");
  var shiftResetEl = document.getElementById("shift-reset");
  var shiftScaleEls = document.querySelectorAll("#shift-scale span");
  var formatBtn = document.getElementById("hour-format");
  var resetBtn = document.getElementById("reset-list");
  var listMsg = document.getElementById("list-msg");
  var searchForm = document.getElementById("search-form");
  var searchInput = document.getElementById("city-search");
  var resultsEl = document.getElementById("search-results");
  var searchMsg = document.getElementById("search-msg");
  var cardEl = document.getElementById("search-card");

  homeNameEl.textContent = homeCity.name;

  // ---------- Analog clock ----------

  var SVG_NS = "http://www.w3.org/2000/svg";

  function svgEl(tag, attrs) {
    var el = document.createElementNS(SVG_NS, tag);
    Object.keys(attrs).forEach(function (k) { el.setAttribute(k, attrs[k]); });
    return el;
  }

  // The dial is filled with the sky colour of the hour it shows, like the city rows.
  function makeDial() {
    var svg = svgEl("svg", { viewBox: "0 0 100 100", "class": "dial", "aria-hidden": "true", focusable: "false" });
    svg.appendChild(svgEl("circle", { cx: 50, cy: 50, r: 48, "class": "dial-face" }));
    for (var i = 0; i < 12; i++) {
      var quarter = i % 3 === 0;
      svg.appendChild(svgEl("line", {
        x1: 50, y1: quarter ? 7 : 8, x2: 50, y2: quarter ? 17 : 13,
        "class": quarter ? "dial-tick dial-tick-major" : "dial-tick",
        transform: "rotate(" + i * 30 + " 50 50)"
      }));
    }
    var hour = svgEl("line", { x1: 50, y1: 54, x2: 50, y2: 27, "class": "dial-hand dial-hour" });
    var minute = svgEl("line", { x1: 50, y1: 56, x2: 50, y2: 15, "class": "dial-hand dial-minute" });
    var second = svgEl("line", { x1: 50, y1: 60, x2: 50, y2: 11, "class": "dial-second" });
    svg.appendChild(hour);
    svg.appendChild(minute);
    svg.appendChild(second);
    svg.appendChild(svgEl("circle", { cx: 50, cy: 50, r: 3, "class": "dial-pin" }));

    return {
      el: svg,
      set: function (p, sky) {
        hour.setAttribute("transform", "rotate(" + ((p.hour % 12) + p.minute / 60) * 30 + " 50 50)");
        minute.setAttribute("transform", "rotate(" + (p.minute + p.second / 60) * 6 + " 50 50)");
        second.setAttribute("transform", "rotate(" + p.second * 6 + " 50 50)");
        svg.style.setProperty("--dial-face", "rgb(" + sky.bg.join(",") + ")");
        svg.classList.toggle("is-dark", sky.dark);
      }
    };
  }

  var homeDial = makeDial();
  homeDialEl.appendChild(homeDial.el);

  function skyAt(p) {
    return readableSky(skyColor(p.hour + p.minute / 60));
  }

  // ---------- Clock list ----------

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
      remove.addEventListener("click", function () { removeCity(city); });
      li.appendChild(remove);
    }

    return { city: city, el: li, where: where, diff: diff, day: day, time: time };
  }

  function render() {
    rows.forEach(function (r) { r.el.remove(); });

    var now = new Date();
    var list = chosen.slice();
    var homeId = cityId(homeCity);
    if (!list.some(function (c) { return cityId(c) === homeId; })) list.push(homeCity);

    list.sort(function (a, b) {
      return offsetMinutes(a.tz, now) - offsetMinutes(b.tz, now) || a.name.localeCompare(b.name);
    });

    rows = list.map(function (c) { return buildRow(c, cityId(c) === homeId); });

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

  function addCity(city) {
    if (isOnList(city)) return false;
    chosen.push(city);
    save();
    render();
    return true;
  }

  function removeCity(city) {
    var id = cityId(city);
    chosen = chosen.filter(function (c) { return cityId(c) !== id; });
    save();
    render();
    listMsg.textContent = city.name + " removed.";
    if (card && cityId(card.city) === id) updateCardButton();
  }

  // ---------- Clock updates ----------

  function dateKey(p) { return p.year * 10000 + p.month * 100 + p.day; }

  function digits(text) {
    return text.split("").map(function (ch) { return '<span class="d">' + ch + "</span>"; }).join("");
  }

  function timeText(p) {
    var h = hourText(p.hour, use24);
    return h.hh + ":" + pad(p.minute) + (h.suffix ? " " + h.suffix : "");
  }

  function setTimeEl(el, p) {
    var h = hourText(p.hour, use24);
    el.innerHTML = "";
    el.appendChild(document.createTextNode(h.hh + ":" + pad(p.minute)));
    if (h.suffix) {
      var s = document.createElement("small");
      s.textContent = h.suffix;
      el.appendChild(s);
    }
  }

  function relativeText(city, at, homeOffset, homeDay) {
    var d = offsetMinutes(city.tz, at) - homeOffset;
    var dayDiff = Math.sign(dateKey(partsAt(city.tz, at)) - homeDay);
    return {
      diff: d === 0 ? "same time as you" : formatDiff(Math.abs(d)).slice(1) + (d > 0 ? " ahead" : " behind"),
      day: dayDiff > 0 ? "tomorrow" : dayDiff < 0 ? "yesterday" : "today"
    };
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
    homeDial.set(p, skyAt(p));
  }

  function updateRow(r, at, homeOffset, homeDay) {
    var p = partsAt(r.city.tz, at);
    var rel = relativeText(r.city, at, homeOffset, homeDay);
    setTimeEl(r.time, p);
    r.where.textContent = (cityPlace(r.city) ? cityPlace(r.city) + " " : "") + zoneAbbr(r.city.tz, at);
    r.diff.textContent = rel.diff;
    r.day.textContent = rel.day;

    var sky = skyAt(p);
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
      shiftScaleEls[i].textContent = h === 0 ? "Now" : timeText(q);
    });
  }

  function tick() {
    updateDayBand();
    var at = new Date(Date.now() + shiftMinutes * 60000);
    updateHero(at);
    var homeOffset = offsetMinutes(homeTz, at);
    var homeDay = dateKey(partsAt(homeTz, at));
    rows.forEach(function (r) { updateRow(r, at, homeOffset, homeDay); });
    if (card) updateCard(at, homeOffset, homeDay);
    if (!resultsEl.hidden) updateResultTimes(at);
  }

  function scheduleTick() {
    tick();
    setTimeout(scheduleTick, 1000 - (Date.now() % 1000) + 5);
  }

  // ---------- City search ----------

  var MAX_RESULTS = 8;
  var searchIndex = null;   // Every city from data/cities.json, largest first.
  var loading = null;
  var results = [];
  var activeIndex = -1;

  var builtInIndex = cities.map(function (c) {
    return { city: c, key: fold(c.name), place: fold(cityPlace(c)), alts: [] };
  });

  function loadIndex() {
    if (loading) return loading;
    loading = fetch("/data/cities.json")
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then(function (data) {
        var zoneOk = {};
        searchIndex = [];
        data.cities.forEach(function (row) {
          var tz = data.zones[row[3]];
          if (!(tz in zoneOk)) zoneOk[tz] = zoneIsSupported(tz);
          if (!zoneOk[tz]) return;
          var city = { name: row[0], region: row[1], country: data.countries[row[2]], tz: tz };
          searchIndex.push({
            city: city,
            key: fold(city.name),
            place: fold(cityPlace(city)),
            alts: row[4] ? row[4].split("|").map(fold) : []
          });
        });
        if (searchInput.value.trim()) runSearch();
      })
      .catch(function () {
        loading = null;
        searchMsg.textContent = "The full city list didn't load, so search covers 75 major cities for now. Check your connection and try again.";
      });
    return loading;
  }

  // Ranks exact names first, then names starting with the text, then names with a word
  // starting with it. Within a rank, bigger cities come first. "Paris, US" filters by place.
  function search(text) {
    var parts = fold(text).split(",");
    var q = parts[0].trim();
    var placeQ = parts.slice(1).join(" ").trim();
    if (!q) return [];

    var index = searchIndex || builtInIndex;
    var buckets = [[], [], []];
    for (var i = 0; i < index.length; i++) {
      var item = index[i];
      if (placeQ && item.place.indexOf(placeQ) === -1) continue;
      var rank = -1;
      if (item.key === q || item.alts.indexOf(q) !== -1) rank = 0;
      else if (item.key.indexOf(q) === 0 || item.alts.some(function (a) { return a.indexOf(q) === 0; })) rank = 1;
      else if (item.key.indexOf(" " + q) !== -1 || item.key.indexOf("-" + q) !== -1) rank = 2;
      if (rank !== -1 && buckets[rank].length < MAX_RESULTS) buckets[rank].push(item.city);
    }
    return buckets[0].concat(buckets[1], buckets[2]).slice(0, MAX_RESULTS);
  }

  function setExpanded(open) {
    resultsEl.hidden = !open;
    searchInput.setAttribute("aria-expanded", open ? "true" : "false");
    if (!open) {
      activeIndex = -1;
      searchInput.removeAttribute("aria-activedescendant");
    }
  }

  function setActive(i) {
    var options = resultsEl.children;
    if (!options.length) return;
    activeIndex = (i + options.length) % options.length;
    for (var k = 0; k < options.length; k++) {
      options[k].setAttribute("aria-selected", k === activeIndex ? "true" : "false");
    }
    searchInput.setAttribute("aria-activedescendant", options[activeIndex].id);
    options[activeIndex].scrollIntoView({ block: "nearest" });
  }

  function runSearch() {
    var text = searchInput.value.trim();
    results = search(text);
    resultsEl.innerHTML = "";

    if (!text) {
      setExpanded(false);
      searchMsg.textContent = "";
      return;
    }

    if (!results.length) {
      setExpanded(false);
      searchMsg.textContent = searchIndex || !loading
        ? "No city matches “" + text + "”. Check the spelling, or try a larger city nearby."
        : "Loading cities…";
      return;
    }

    var at = new Date(Date.now() + shiftMinutes * 60000);
    results.forEach(function (city, i) {
      var li = document.createElement("li");
      li.id = "search-option-" + i;
      li.setAttribute("role", "option");
      li.setAttribute("aria-selected", "false");
      li.className = "search-option";

      var name = document.createElement("span");
      name.className = "option-name";
      name.textContent = city.name;
      var place = document.createElement("span");
      place.className = "option-place";
      place.textContent = cityPlace(city);
      var time = document.createElement("span");
      time.className = "option-time";
      time.textContent = timeText(partsAt(city.tz, at));

      li.appendChild(name);
      li.appendChild(place);
      li.appendChild(time);
      // mousedown, not click, so choosing happens before the input loses focus.
      li.addEventListener("mousedown", function (e) {
        e.preventDefault();
        choose(city);
      });
      resultsEl.appendChild(li);
    });
    searchMsg.textContent = results.length + (results.length === 1 ? " city matches." : " cities match.") + " Use the arrow keys to pick one.";
    setExpanded(true);
  }

  function updateResultTimes(at) {
    var spans = resultsEl.querySelectorAll(".option-time");
    results.forEach(function (city, i) {
      if (spans[i]) spans[i].textContent = timeText(partsAt(city.tz, at));
    });
  }

  function choose(city) {
    setExpanded(false);
    searchInput.value = city.name + (cityPlace(city) ? ", " + cityPlace(city) : "");
    searchMsg.textContent = "";
    showCard(city);
  }

  var searchTimer = null;
  searchInput.addEventListener("input", function () {
    loadIndex();
    clearTimeout(searchTimer);
    searchTimer = setTimeout(runSearch, 80);
  });
  searchInput.addEventListener("focus", loadIndex);
  searchInput.addEventListener("blur", function () { setExpanded(false); });

  searchInput.addEventListener("keydown", function (e) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      if (resultsEl.hidden) runSearch();
      if (!resultsEl.hidden) {
        e.preventDefault();
        setActive(activeIndex === -1 ? (e.key === "ArrowDown" ? 0 : -1) : activeIndex + (e.key === "ArrowDown" ? 1 : -1));
      }
    } else if (e.key === "Escape") {
      if (!resultsEl.hidden) {
        e.preventDefault();
        setExpanded(false);
      }
    }
  });

  // Enter picks the highlighted city, or the best match.
  searchForm.addEventListener("submit", function (e) {
    e.preventDefault();
    clearTimeout(searchTimer);
    if (resultsEl.hidden || !results.length) runSearch();
    if (results.length) choose(results[activeIndex >= 0 ? activeIndex : 0]);
  });

  // ---------- Search result card ----------

  var card = null;

  function showCard(city) {
    cardEl.innerHTML = "";

    var info = document.createElement("div");
    info.className = "card-info";
    var name = document.createElement("h2");
    name.className = "card-name";
    name.textContent = city.name;
    var place = document.createElement("p");
    place.className = "card-place";
    var date = document.createElement("p");
    date.className = "card-date";
    var rel = document.createElement("p");
    rel.className = "card-rel";
    info.appendChild(name);
    info.appendChild(place);
    info.appendChild(date);
    info.appendChild(rel);

    var timeWrap = document.createElement("div");
    timeWrap.className = "card-clock";
    var time = document.createElement("p");
    time.className = "card-time";
    var dial = makeDial();
    timeWrap.appendChild(dial.el);
    timeWrap.appendChild(time);

    var actions = document.createElement("div");
    actions.className = "card-actions";
    var add = document.createElement("button");
    add.type = "button";
    add.className = "card-add";
    add.addEventListener("click", function () {
      if (addCity(city)) {
        listMsg.textContent = city.name + " added to your clocks.";
        updateCardButton();
      }
    });
    var close = document.createElement("button");
    close.type = "button";
    close.className = "card-close";
    close.textContent = "Close";
    close.addEventListener("click", function () {
      hideCard();
      searchInput.value = "";
      searchInput.focus();
    });
    actions.appendChild(add);
    actions.appendChild(close);

    cardEl.appendChild(info);
    cardEl.appendChild(timeWrap);
    cardEl.appendChild(actions);
    cardEl.hidden = false;

    card = {
      city: city, place: place, date: date, rel: rel, time: time, dial: dial, add: add,
      dateFormat: new Intl.DateTimeFormat(undefined, {
        timeZone: city.tz, weekday: "long", day: "numeric", month: "long", year: "numeric"
      })
    };
    updateCardButton();
    tick();
  }

  function hideCard() {
    card = null;
    cardEl.hidden = true;
    cardEl.innerHTML = "";
  }

  function updateCardButton() {
    if (!card) return;
    var on = isOnList(card.city);
    card.add.textContent = on ? "On your clocks" : "Add to my clocks";
    card.add.disabled = on;
  }

  function updateCard(at, homeOffset, homeDay) {
    var p = partsAt(card.city.tz, at);
    var rel = relativeText(card.city, at, homeOffset, homeDay);
    setTimeEl(card.time, p);
    card.place.textContent = [cityPlace(card.city), zoneAbbr(card.city.tz, at)].filter(Boolean).join(", ");
    card.date.textContent = card.dateFormat.format(at);
    card.rel.textContent = rel.diff.charAt(0).toUpperCase() + rel.diff.slice(1) + ", " + rel.day + " there";
    var sky = skyAt(p);
    card.dial.set(p, sky);
    cardEl.style.setProperty("--sky", "rgb(" + sky.bg.join(",") + ")");
    cardEl.classList.toggle("is-dark", sky.dark);
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
    chosen = defaultCities();
    save();
    render();
    updateCardButton();
    listMsg.textContent = "City list reset to the default cities.";
  });

  updateFormatButton();
  updateShiftText();
  render();
  scheduleTick();
})();
