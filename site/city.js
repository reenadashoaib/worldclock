/*
 * Live clocks for the city pages and the Cities list. Elements with data-tz show the time
 * in that zone; the city page's main clock is the element with data-city-tz.
 */
(function () {
  "use strict";

  var visitorTz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

  function readHourPref() {
    try {
      var saved = localStorage.getItem("hourline.24h");
      if (saved !== null) return saved === "1";
    } catch (e) { /* Use the browser's default. */ }
    return /^h2/.test(new Intl.DateTimeFormat(undefined, { hour: "numeric" }).resolvedOptions().hourCycle || "h23");
  }
  var use24 = readHourPref();

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

  function offsetMinutes(tz, date) {
    var p = partsAt(tz, date);
    var asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute);
    return Math.round((asUtc - Math.floor(date.getTime() / 60000) * 60000) / 60000);
  }

  function pad(n) { return (n < 10 ? "0" : "") + n; }

  function timeText(p, withSeconds) {
    var mm = pad(p.minute) + (withSeconds ? ":" + pad(p.second) : "");
    if (use24) return pad(p.hour) + ":" + mm;
    return (p.hour % 12 || 12) + ":" + mm + (p.hour < 12 ? " am" : " pm");
  }

  function diffText(minutes, you) {
    if (minutes === 0) return you ? "Same time as you" : "same time";
    var abs = Math.abs(minutes);
    var h = Math.floor(abs / 60);
    var m = abs % 60;
    var text = (h ? h + " h" : "") + (m ? (h ? " " : "") + m + " min" : "");
    if (!you) return text + (minutes > 0 ? " ahead" : " behind");
    return text + (minutes > 0 ? " ahead of you" : " behind you");
  }

  function dayNumber(p) { return Date.UTC(p.year, p.month - 1, p.day) / 86400000; }

  // The moment a wall-clock time happens in a zone, e.g. 9:00 today in Tokyo.
  function instantAt(tz, p, hour) {
    var guess = Date.UTC(p.year, p.month - 1, p.day, hour, 0);
    var t = guess - offsetMinutes(tz, new Date(guess)) * 60000;
    return new Date(guess - offsetMinutes(tz, new Date(t)) * 60000);
  }

  var hero = document.querySelector("[data-city-tz]");
  var heroTz = hero ? hero.getAttribute("data-city-tz") : null;
  var heroName = hero ? hero.getAttribute("data-city-name") : "";
  var rows = document.querySelectorAll("[data-tz]");
  var dateFormat = heroTz ? new Intl.DateTimeFormat(undefined, {
    timeZone: heroTz, weekday: "long", day: "numeric", month: "long", year: "numeric"
  }) : null;

  function updateHours(now) {
    var el = document.querySelector(".js-hours");
    if (!el || !heroTz) return;
    if (heroTz === visitorTz) {
      el.textContent = "You are in the same time zone as " + heroName + ", so its working day matches yours.";
      return;
    }
    var p = partsAt(heroTz, now);
    var start = partsAt(visitorTz, instantAt(heroTz, p, 9));
    var end = partsAt(visitorTz, instantAt(heroTz, p, 17));
    var today = dayNumber(partsAt(visitorTz, now));
    function when(q) {
      var d = dayNumber(q) - today;
      return timeText(q, false) + (d > 0 ? " tomorrow" : d < 0 ? " yesterday" : "");
    }
    el.textContent = "A working day from 9 am to 5 pm in " + heroName + " today runs from " +
      when(start) + " to " + when(end) + " your time.";
  }

  var lastMinute = -1;
  function tick() {
    var now = new Date();
    if (hero) {
      var p = partsAt(heroTz, now);
      hero.querySelector(".js-time").textContent = timeText(p, true);
      hero.querySelector(".js-date").textContent = dateFormat.format(now);
      hero.querySelector(".js-rel").textContent =
        diffText(offsetMinutes(heroTz, now) - offsetMinutes(visitorTz, now), true);
    }
    var minute = Math.floor(now.getTime() / 60000);
    if (minute !== lastMinute) {
      lastMinute = minute;
      var base = heroTz ? offsetMinutes(heroTz, now) : 0;
      rows.forEach(function (row) {
        var tz = row.getAttribute("data-tz");
        var t = row.querySelector(".js-time");
        var d = row.querySelector(".js-diff");
        if (t) t.textContent = timeText(partsAt(tz, now), false);
        if (d && heroTz) d.textContent = diffText(offsetMinutes(tz, now) - base, false);
      });
      updateHours(now);
    }
  }

  function schedule() {
    tick();
    setTimeout(schedule, 1000 - (Date.now() % 1000) + 5);
  }
  schedule();
})();
