"""Builds the city pages, the Cities and Guides index pages, the guides and sitemap.xml.

Run from the repository root after changing city facts, guides or the year:
    python3 tools/build-pages.py

Daylight saving dates and UTC offsets come from the system time zone database
(Python's zoneinfo), so rebuild once a year to show the next year's dates.
Guide bodies live in tools/guides/<slug>.html.
"""
import html
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parent.parent
SITE = ROOT / "site"
DOMAIN = "https://countrytime.online"
TODAY = date.today()

ADSENSE = """  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8884353000483064"
     crossorigin="anonymous"></script>"""

REGIONS = ["Americas", "Europe", "Africa", "Middle East", "Asia", "Oceania"]

# slug, name, country, IANA zone, region, (standard zone name, daylight zone name or None), note
CITIES = [
    ("los-angeles", "Los Angeles", "United States", "America/Los_Angeles", "Americas",
     ("Pacific Standard Time", "Pacific Daylight Time"),
     "Los Angeles keeps Pacific Time, along with the rest of California, Washington and Oregon. "
     "It is three hours behind New York, so a 9 am start on the West Coast is already noon on the East Coast."),
    ("chicago", "Chicago", "United States", "America/Chicago", "Americas",
     ("Central Standard Time", "Central Daylight Time"),
     "Chicago is on Central Time, one hour behind New York. The zone covers a wide band of the central "
     "United States from the Gulf of Mexico to the Canadian border, including Dallas, Houston and Minneapolis."),
    ("mexico-city", "Mexico City", "Mexico", "America/Mexico_City", "Americas",
     ("Central Standard Time", None),
     "Mexico ended daylight saving time for most of the country in 2022, so from spring to autumn the city is one hour behind Chicago and Dallas, which "
     "still change their clocks."),
    ("toronto", "Toronto", "Canada", "America/Toronto", "Americas",
     ("Eastern Standard Time", "Eastern Daylight Time"),
     "Toronto keeps Eastern Time, so its clocks always match New York's. Canada and the United States "
     "change their clocks for daylight saving time on the same dates."),
    ("new-york", "New York", "United States", "America/New_York", "Americas",
     ("Eastern Standard Time", "Eastern Daylight Time"),
     "New York runs on Eastern Time, shared with most of the US East Coast and with Toronto and Montreal. "
     "The New York Stock Exchange opens at 9:30 am Eastern Time, which makes this the zone much of the "
     "world's financial day is measured against."),
    ("sao-paulo", "São Paulo", "Brazil", "America/Sao_Paulo", "Americas",
     ("Brasília Time", None),
     "Brazil stopped using daylight saving time in 2019, so the clocks in São Paulo no longer change, but "
     "the time difference with Europe and North America still shifts when those regions change theirs."),

    ("reykjavik", "Reykjavík", "Iceland", "Atlantic/Reykjavik", "Europe",
     ("Greenwich Mean Time", None),
     "Iceland keeps Greenwich Mean Time all year and does not change its clocks. Reykjavík lies far west "
     "of Greenwich, so the sun reaches its highest point around 1:30 pm, much later than the clock suggests."),
    ("lisbon", "Lisbon", "Portugal", "Europe/Lisbon", "Europe",
     ("Western European Time", "Western European Summer Time"),
     "Lisbon shares its clock with London rather than with Madrid next door: Portugal uses Western "
     "European Time, one hour behind most of the European Union. The Azores islands run one hour behind "
     "mainland Portugal."),
    ("london", "London", "United Kingdom", "Europe/London", "Europe",
     ("Greenwich Mean Time", "British Summer Time"),
     "London gives its name to Greenwich Mean Time, measured from the Royal Observatory in Greenwich, which "
     "was chosen as the world's prime meridian in 1884. The United Kingdom, Ireland and Portugal all use "
     "it in winter."),
    ("paris", "Paris", "France", "Europe/Paris", "Europe",
     ("Central European Time", "Central European Summer Time"),
     "Paris uses Central European Time, even though France lies mostly west of the meridian the zone is "
     "based on. That is why summer evenings are so long here: around the June solstice the sun sets close "
     "to 10 pm."),
    ("madrid", "Madrid", "Spain", "Europe/Madrid", "Europe",
     ("Central European Time", "Central European Summer Time"),
     "Spain has used Central European Time since 1940, even though Madrid lies west of Greenwich and its "
     "longitude matches London's time zone more closely. It is one reason Spanish lunch and dinner times "
     "run later than in most of Europe."),
    ("berlin", "Berlin", "Germany", "Europe/Berlin", "Europe",
     ("Central European Time", "Central European Summer Time"),
     "Berlin is on Central European Time, the zone used by most of the European Union. Germany, like the "
     "rest of the EU, moves its clocks forward on the last Sunday of March and back on the last Sunday of "
     "October."),
    ("amsterdam", "Amsterdam", "Netherlands", "Europe/Amsterdam", "Europe",
     ("Central European Time", "Central European Summer Time"),
     "The Netherlands uses Central European Time. Until 1940 the country kept its own Amsterdam Time, "
     "about 20 minutes ahead of Greenwich Mean Time."),
    ("rome", "Rome", "Italy", "Europe/Rome", "Europe",
     ("Central European Time", "Central European Summer Time"),
     "Italy uses Central European Time across the whole country, including Sicily and Sardinia. The "
     "meridian the zone is based on, 15° east, runs through eastern Sicily."),
    ("stockholm", "Stockholm", "Sweden", "Europe/Stockholm", "Europe",
     ("Central European Time", "Central European Summer Time"),
     "Sweden keeps Central European Time, the same as Berlin and Paris. In Stockholm the seasons matter "
     "more than the clock: daylight lasts about 18 hours in June and about 6 hours in December."),
    ("warsaw", "Warsaw", "Poland", "Europe/Warsaw", "Europe",
     ("Central European Time", "Central European Summer Time"),
     "Poland uses Central European Time. The zone's base meridian of 15° east runs close to the country's "
     "western border, so the clock here follows the sun more closely than it does in Paris or Madrid."),
    ("athens", "Athens", "Greece", "Europe/Athens", "Europe",
     ("Eastern European Time", "Eastern European Summer Time"),
     "Greece is on Eastern European Time, one hour ahead of Rome and Berlin and two hours ahead of London. "
     "It follows the European Union's daylight saving dates."),
    ("istanbul", "Istanbul", "Türkiye", "Europe/Istanbul", "Europe",
     ("Türkiye Time", None),
     "Türkiye stopped changing its clocks in 2016 and now stays three hours ahead of GMT all year. In "
     "winter Istanbul is one hour ahead of Athens; in summer the two cities show the same time."),
    ("moscow", "Moscow", "Russia", "Europe/Moscow", "Europe",
     ("Moscow Time", None),
     "Moscow Time is three hours ahead of GMT and does not change with the seasons. Russia as a whole "
     "spans eleven time zones, from Kaliningrad on the Baltic Sea to Kamchatka on the Pacific."),

    ("accra", "Accra", "Ghana", "Africa/Accra", "Africa",
     ("Greenwich Mean Time", None),
     "Ghana uses Greenwich Mean Time all year. The Greenwich meridian itself crosses the Ghanaian coast at "
     "Tema, just east of Accra."),
    ("lagos", "Lagos", "Nigeria", "Africa/Lagos", "Africa",
     ("West Africa Time", None),
     "Lagos is on West Africa Time, one hour ahead of GMT, shared with countries including Cameroon and "
     "Angola. Nigeria does not use daylight saving time."),
    ("cairo", "Cairo", "Egypt", "Africa/Cairo", "Africa",
     ("Eastern European Time", "Eastern European Summer Time"),
     "Egypt uses Eastern European Time, two hours ahead of GMT. The country has started and stopped "
     "daylight saving time several times over the years, so check the dates below for the current rules."),
    ("nairobi", "Nairobi", "Kenya", "Africa/Nairobi", "Africa",
     ("East Africa Time", None),
     "Nairobi is on East Africa Time, three hours ahead of GMT, shared with Ethiopia, Tanzania and Uganda. "
     "Kenya lies close to the equator, so there is no daylight saving time and sunrise stays around "
     "6:30 am all year."),

    ("tel-aviv", "Tel Aviv", "Israel", "Asia/Jerusalem", "Middle East",
     ("Israel Standard Time", "Israel Daylight Time"),
     "Israel uses Israel Standard Time, two hours ahead of GMT. Its summer time starts on the Friday before "
     "the last Sunday in March, a couple of days before Europe's, and ends on the last Sunday in October. "
     "The working week usually runs from Sunday to Thursday."),
    ("riyadh", "Riyadh", "Saudi Arabia", "Asia/Riyadh", "Middle East",
     ("Arabia Standard Time", None),
     "Saudi Arabia uses Arabia Standard Time all year. Since 2013 the Saudi weekend has been Friday and "
     "Saturday, so the working week runs from Sunday to Thursday, worth remembering when scheduling calls "
     "from Europe or the Americas."),
    ("doha", "Doha", "Qatar", "Asia/Qatar", "Middle East",
     ("Arabia Standard Time", None),
     "Qatar uses Arabia Standard Time, three hours ahead of GMT, the same as Saudi Arabia, Kuwait and "
     "Bahrain. There is no daylight saving time, and the working week runs from Sunday to Thursday."),
    ("dubai", "Dubai", "United Arab Emirates", "Asia/Dubai", "Middle East",
     ("Gulf Standard Time", None),
     "Dubai is on Gulf Standard Time, four hours ahead of GMT and one hour ahead of Saudi Arabia and Qatar. "
     "The United Arab Emirates moved its official working week to Monday to Friday in 2022, closer to "
     "Europe's."),
    ("tehran", "Tehran", "Iran", "Asia/Tehran", "Middle East",
     ("Iran Standard Time", None),
     "Iran Standard Time is three and a half hours ahead of GMT, one of the few half-hour offsets in use. "
     "Iran ended daylight saving time after 2022, so the clocks here no longer change."),

    ("islamabad", "Islamabad", "Pakistan", "Asia/Karachi", "Asia",
     ("Pakistan Standard Time", None),
     "Pakistan Standard Time is five hours ahead of GMT and applies across the whole country, from Karachi "
     "to Islamabad. Pakistan last used daylight saving time in 2009."),
    ("mumbai", "Mumbai", "India", "Asia/Kolkata", "Asia",
     ("India Standard Time", None),
     "All of India keeps one time zone, India Standard Time, five and a half hours ahead of GMT, even "
     "though the country is nearly 3,000 kilometres wide from east to west. India does not use daylight "
     "saving time."),
    ("kathmandu", "Kathmandu", "Nepal", "Asia/Kathmandu", "Asia",
     ("Nepal Time", None),
     "Nepal Time is five hours and 45 minutes ahead of GMT, one of only a handful of time zones offset by "
     "45 minutes. It puts Kathmandu 15 minutes ahead of India."),
    ("dhaka", "Dhaka", "Bangladesh", "Asia/Dhaka", "Asia",
     ("Bangladesh Standard Time", None),
     "Bangladesh Standard Time is six hours ahead of GMT. Bangladesh tried daylight saving time once, in "
     "2009, and returned to standard time at the end of that year."),
    ("bangkok", "Bangkok", "Thailand", "Asia/Bangkok", "Asia",
     ("Indochina Time", None),
     "Bangkok is on Indochina Time, seven hours ahead of GMT, shared with Vietnam, Laos and Cambodia. "
     "Thailand does not use daylight saving time."),
    ("jakarta", "Jakarta", "Indonesia", "Asia/Jakarta", "Asia",
     ("Western Indonesia Time", None),
     "Indonesia spans three time zones. Jakarta, on the island of Java, uses Western Indonesia Time, seven "
     "hours ahead of GMT; Bali is one hour ahead of Jakarta, and Papua two hours ahead."),
    ("ho-chi-minh-city", "Ho Chi Minh City", "Vietnam", "Asia/Ho_Chi_Minh", "Asia",
     ("Indochina Time", None),
     "Vietnam uses Indochina Time across the whole country, seven hours ahead of GMT, the same as Bangkok. "
     "Ho Chi Minh City and Hanoi always show the same time."),
    ("kuala-lumpur", "Kuala Lumpur", "Malaysia", "Asia/Kuala_Lumpur", "Asia",
     ("Malaysia Time", None),
     "At the start of 1982 Malaysia moved the Malay Peninsula from seven and a half to eight hours ahead of "
     "GMT, so that Kuala Lumpur would share the time used in Malaysian Borneo. Singapore made the same "
     "change on the same day."),
    ("singapore", "Singapore", "Singapore", "Asia/Singapore", "Asia",
     ("Singapore Standard Time", None),
     "Singapore Standard Time is eight hours ahead of GMT, the same as Hong Kong, Beijing and Perth. "
     "Geographically Singapore sits closer to the seven-hour zone, so mornings stay dark until around "
     "7 am all year."),
    ("manila", "Manila", "Philippines", "Asia/Manila", "Asia",
     ("Philippine Standard Time", None),
     "The Philippines uses Philippine Standard Time, eight hours ahead of GMT, with no daylight saving "
     "time. It shares the hour with Singapore, Hong Kong and Beijing, which keeps business across East "
     "Asia on the same clock."),
    ("hong-kong", "Hong Kong", "China", "Asia/Hong_Kong", "Asia",
     ("Hong Kong Time", None),
     "Hong Kong Time is eight hours ahead of GMT. Hong Kong last used summer time in 1979, and today its "
     "clocks match those in mainland China, Singapore and Taiwan all year."),
    ("beijing", "Beijing", "China", "Asia/Shanghai", "Asia",
     ("China Standard Time", None),
     "China uses a single time zone, China Standard Time, eight hours ahead of GMT, even though the country "
     "spans about five geographical time zones. In far-western Xinjiang the winter sun can rise after "
     "9 am by the official clock."),
    ("seoul", "Seoul", "South Korea", "Asia/Seoul", "Asia",
     ("Korea Standard Time", None),
     "South Korea uses Korea Standard Time, nine hours ahead of GMT, the same as Japan. The country last "
     "used daylight saving time in 1988, the year Seoul hosted the Summer Olympics."),
    ("tokyo", "Tokyo", "Japan", "Asia/Tokyo", "Asia",
     ("Japan Standard Time", None),
     "The whole of Japan, from Hokkaido to Okinawa, shares one time zone. Japan tried daylight "
     "saving time from 1948 to 1951, during the post-war occupation, and has not used it since."),

    ("sydney", "Sydney", "Australia", "Australia/Sydney", "Oceania",
     ("Australian Eastern Standard Time", "Australian Eastern Daylight Time"),
     "Sydney is on Australian Eastern Time. New South Wales, Victoria and Tasmania use daylight saving time "
     "from the first Sunday in October to the first Sunday in April, but Queensland does not, so in summer "
     "Sydney is one hour ahead of Brisbane."),
    ("suva", "Suva", "Fiji", "Pacific/Fiji", "Oceania",
     ("Fiji Time", None),
     "Fiji Time is twelve hours ahead of GMT, which makes Fiji one of the first countries to start each new "
     "day. The 180° meridian passes through the Fijian islands, but the International Date Line bends "
     "around them so the whole country keeps the same date."),
    ("auckland", "Auckland", "New Zealand", "Pacific/Auckland", "Oceania",
     ("New Zealand Standard Time", "New Zealand Daylight Time"),
     "New Zealand Standard Time is twelve hours ahead of GMT. From the last Sunday in September to the "
     "first Sunday in April, New Zealand moves to Daylight Time, thirteen hours ahead, making Auckland one "
     "of the first major cities to see each new day."),
]

COMPARE = ["london", "new-york", "los-angeles", "dubai", "mumbai", "singapore", "tokyo", "sydney"]

GUIDES = [
    ("daylight-saving-time", "How daylight saving time works around the world",
     "Which countries change their clocks, when they do it, and why the time difference between cities "
     "shifts during the year."),
    ("scheduling-across-time-zones", "How to schedule a meeting across time zones",
     "Finding working hours that overlap, avoiding the usual mistakes, and planning calls between "
     "continents."),
    ("utc-gmt-and-time-zone-names", "UTC, GMT and time zone names explained",
     "What UTC and GMT mean, why some offsets are half an hour, and why abbreviations like CST can be "
     "misleading."),
]


# ---------- Time zone facts ----------

def fmt_offset(td):
    minutes = int(td.total_seconds() // 60)
    sign = "+" if minutes >= 0 else "−"
    h, m = divmod(abs(minutes), 60)
    return f"UTC{sign}{h}" + (f":{m:02d}" if m else "")


def transitions(tz, start, days=400):
    """The UTC offset changes in the `days` after `start`, as (utc_instant, old_offset, new_offset)."""
    z = ZoneInfo(tz)
    found = []
    t = datetime(start.year, start.month, start.day, tzinfo=timezone.utc)
    prev = t.astimezone(z).utcoffset()
    step = timedelta(hours=1)
    for _ in range(days * 24):
        t2 = t + step
        off = t2.astimezone(z).utcoffset()
        if off != prev:
            found.append((t2, prev, off))
            prev = off
        t = t2
    return found


def clock_text(dt):
    h = dt.hour % 12 or 12
    return f"{h}:{dt.minute:02d} {'am' if dt.hour < 12 else 'pm'}"


def day_text(dt):
    return f"{dt.strftime('%A')} {dt.day} {dt.strftime('%B %Y')}"


def dst_paragraph(name, tz, zones):
    changes = transitions(tz, TODAY)[:2]
    if not changes:
        return (f"{name} does not use daylight saving time, so its clocks stay the same all year. Its "
                f"time difference with cities that do change their clocks, such as London and New York, "
                f"shifts by an hour twice a year.")
    z = ZoneInfo(tz)
    parts = []
    for when, old, new in changes:
        before = (when - timedelta(seconds=1)).astimezone(z)
        after = when.astimezone(z)
        # Wall-clock time the change happens at, e.g. 2:00 am becomes 3:00 am.
        at = before + timedelta(seconds=1)
        if new > old:
            parts.append(f"go forward one hour on {day_text(after)}, when {clock_text(at)} becomes "
                         f"{clock_text(after)} ({fmt_offset(new)})")
        elif at.date() > after.date():
            # The change happens at midnight at the end of a day, e.g. Egypt's last Thursday of October.
            parts.append(f"go back one hour at midnight at the end of {day_text(after)}, to "
                         f"{clock_text(after)} ({fmt_offset(new)})")
        else:
            parts.append(f"go back one hour on {day_text(after)}, when {clock_text(at)} becomes "
                         f"{clock_text(after)} ({fmt_offset(new)})")
    return f"{name} uses daylight saving time. The next changes: clocks {parts[0]}, and {parts[1]}."


def zone_facts(tz, zones):
    """Rows for the facts table: time zone name, UTC offset and whether clocks change."""
    z = ZoneInfo(tz)
    year = TODAY.year + 1
    jan = datetime(year, 1, 15, 12, tzinfo=timezone.utc).astimezone(z)
    jul = datetime(year, 7, 15, 12, tzinfo=timezone.utc).astimezone(z)
    std, dst = sorted([jan.utcoffset(), jul.utcoffset()])
    standard, daylight = zones
    if std == dst:
        return [("Time zone", standard), ("UTC offset", fmt_offset(std)), ("Daylight saving time", "Not used")]
    return [("Time zone", f"{standard}, and {daylight} in summer"),
            ("UTC offset", f"{fmt_offset(std)}, and {fmt_offset(dst)} in summer"),
            ("Daylight saving time", "Used")]


def offset_now(tz):
    return datetime.now(timezone.utc).astimezone(ZoneInfo(tz)).utcoffset()


def diff_text(minutes):
    if minutes == 0:
        return "same time"
    h, m = divmod(abs(minutes), 60)
    text = (f"{h} h" if h else "") + (f" {m} min" if m else "")
    return text.strip() + (" ahead" if minutes > 0 else " behind")


# ---------- Page layout ----------

def esc(text):
    return html.escape(text, quote=True)


def page(path, title, description, body, scripts=""):
    url = DOMAIN + path
    return f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{esc(title)}</title>
  <meta name="description" content="{esc(description)}">
  <link rel="canonical" href="{url}">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@600;800&family=Instrument+Sans:wght@400;500;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/styles.css?v=2">
{ADSENSE}
{scripts}</head>
<body class="text-page">
  <header class="site-header">
    <a class="brand" href="/">Country Time</a>
    <nav aria-label="Site">
      <a href="/">World clock</a>
      <a href="/cities/">Cities</a>
      <a href="/guides/">Guides</a>
      <a href="/about.html">About</a>
    </nav>
  </header>
  <div class="page">
    <main class="prose" id="main">
{body}
    </main>
  </div>
  <footer class="site-footer">
    <p>Country Time shows local times using your browser's time zone data. City search uses data from <a href="https://www.geonames.org/">GeoNames</a> (<a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>).</p>
    <nav aria-label="Footer">
      <a href="/cities/">Cities</a>
      <a href="/guides/">Guides</a>
      <a href="/about.html">About</a>
      <a href="/privacy.html">Privacy policy</a>
    </nav>
  </footer>
</body>
</html>
"""


def write(path, text):
    target = SITE / path.strip("/") / "index.html"
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(text, encoding="utf-8")


# ---------- Pages ----------

def city_page(city, by_slug):
    slug, name, country, tz, region, zones, note = city
    now_off = offset_now(tz)
    rows = []
    for other_slug in COMPARE:
        if other_slug == slug or len(rows) == 7:
            continue
        o = by_slug[other_slug]
        minutes = int((offset_now(o[3]) - now_off).total_seconds() // 60)
        rows.append(
            f'          <tr data-tz="{o[3]}"><td><a href="/time/{o[0]}/">{esc(o[1])}</a></td>'
            f'<td class="js-time">–</td><td class="js-diff">{esc(diff_text(minutes))}</td></tr>')
    facts = "\n".join(f"          <tr><th scope=\"row\">{esc(k)}</th><td>{esc(v)}</td></tr>"
                      for k, v in zone_facts(tz, zones))
    nearby = [c for c in CITIES if c[4] == region and c[0] != slug]
    nearby_links = "\n".join(f'        <li><a href="/time/{c[0]}/">{esc(c[1])}</a>, {esc(c[2])}</li>'
                             for c in nearby)

    body = f"""      <h1>Time in {esc(name)}, {esc(country)}</h1>
      <div class="city-now" data-city-tz="{tz}" data-city-name="{esc(name)}">
        <p class="city-now-time js-time">–</p>
        <p class="city-now-date js-date"></p>
        <p class="city-now-rel js-rel"></p>
      </div>

      <h2>Time zone</h2>
      <table class="facts">
        <tbody>
{facts}
        </tbody>
      </table>
      <p>{esc(note)}</p>

      <h2>Daylight saving time</h2>
      <p>{esc(dst_paragraph(name, tz, zones))}</p>

      <h2>Time difference from other cities</h2>
      <p>The current time in other major cities, and how far ahead or behind {esc(name)} they are right now.</p>
      <table class="compare">
        <thead><tr><th>City</th><th>Time there</th><th>Compared with {esc(name)}</th></tr></thead>
        <tbody>
{chr(10).join(rows)}
        </tbody>
      </table>

      <h2>Calling {esc(name)}</h2>
      <p class="js-hours">A working day from 9 am to 5 pm in {esc(name)} is shown here in your own time.</p>
      <p>To compare several cities at once, or to find a time that suits everyone, use the
        <a href="/">world clock</a> and drag the slider to shift every clock together.</p>

      <h2>Other cities in {esc(region)}</h2>
      <ul class="city-links">
{nearby_links}
      </ul>
      <p><a href="/cities/">See all cities</a></p>"""

    title = f"Time in {name}, {country} now – Country Time"
    description = (f"Current local time in {name}, {country}. Time zone, UTC offset, daylight saving dates "
                   f"and the time difference from London, New York and other cities.")
    write(f"/time/{slug}/", page(f"/time/{slug}/", title, description, body,
                                 '  <script src="/city.js?v=2" defer></script>\n'))


def cities_page():
    sections = []
    for region in REGIONS:
        items = "\n".join(
            f'        <li data-tz="{c[3]}"><a href="/time/{c[0]}/">{esc(c[1])}</a>, {esc(c[2])} '
            f'<span class="js-time city-links-time"></span></li>'
            for c in CITIES if c[4] == region)
        sections.append(f"""      <h2>{esc(region)}</h2>
      <ul class="city-links">
{items}
      </ul>""")
    body = f"""      <h1>Cities</h1>
      <p>The current time in each city on the Country Time world clock. Choose a city to see its time zone,
        daylight saving dates, and the time difference from other major cities. To check a city that is not
        listed, use the search on the <a href="/">world clock</a>.</p>
{chr(10).join(sections)}"""
    write("/cities/", page("/cities/", "Cities – Country Time",
                           "Current local time in 45 major cities around the world, with time zone and "
                           "daylight saving details for each.", body,
                           '  <script src="/city.js?v=2" defer></script>\n'))


def guides_pages():
    items = "\n".join(f"""      <h2><a href="/guides/{slug}/">{esc(title)}</a></h2>
      <p>{esc(summary)}</p>""" for slug, title, summary in GUIDES)
    body = f"""      <h1>Guides</h1>
      <p>Short guides to time zones, daylight saving time and working across countries.</p>
{items}"""
    write("/guides/", page("/guides/", "Guides – Country Time",
                           "Guides to time zones, daylight saving time and scheduling across countries.", body))

    for slug, title, summary in GUIDES:
        content = (ROOT / "tools" / "guides" / f"{slug}.html").read_text(encoding="utf-8").rstrip()
        body = f"""      <h1>{esc(title)}</h1>
{content}
      <p><a href="/guides/">More guides</a></p>"""
        write(f"/guides/{slug}/", page(f"/guides/{slug}/", f"{title} – Country Time", summary, body))


def sitemap():
    paths = ["/", "/cities/", "/guides/", "/about.html", "/privacy.html"]
    paths += [f"/guides/{g[0]}/" for g in GUIDES]
    paths += [f"/time/{c[0]}/" for c in CITIES]
    urls = "\n".join(f"  <url><loc>{DOMAIN}{p}</loc><lastmod>{TODAY.isoformat()}</lastmod></url>"
                     for p in paths)
    (SITE / "sitemap.xml").write_text(
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        f"{urls}\n</urlset>\n", encoding="utf-8")


def main():
    slugs = [c[0] for c in CITIES]
    assert len(slugs) == len(set(slugs)) == 45, "expected 45 unique cities"
    assert all(c[4] in REGIONS for c in CITIES)
    by_slug = {c[0]: c for c in CITIES}
    for c in CITIES:
        city_page(c, by_slug)
    cities_page()
    guides_pages()
    sitemap()
    print(f"Built {len(CITIES)} city pages, {len(GUIDES)} guides, index pages and sitemap.xml")


if __name__ == "__main__":
    main()
