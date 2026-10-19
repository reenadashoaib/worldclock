"""Builds site/data/cities.json, the city list behind the search bar.

Source: GeoNames cities with 15,000+ people (CC BY 4.0, https://www.geonames.org/),
as packaged in the geonamescache Python package's data folder.

Usage:
    pip download --no-deps geonamescache -d /tmp/gnc && unzip /tmp/gnc/*.whl -d /tmp/gnc/x
    python3 tools/build-cities.py /tmp/gnc/x/geonamescache/data

Output format (compact, sorted by population, largest first):
    {
      "countries": ["Afghanistan", ...],
      "zones": ["Africa/Abidjan", ...],
      "cities": [[name, region, countryIndex, zoneIndex, "other|names"], ...]
    }
"""
import json
import sys
from pathlib import Path

# Shorter, familiar country names for display.
COUNTRY_NAMES = {
    "US": "United States",
    "GB": "United Kingdom",
    "KR": "South Korea",
    "KP": "North Korea",
    "RU": "Russia",
    "IR": "Iran",
    "SY": "Syria",
    "VN": "Vietnam",
    "LA": "Laos",
    "BO": "Bolivia",
    "VE": "Venezuela",
    "TZ": "Tanzania",
    "MD": "Moldova",
    "CD": "DR Congo",
    "CG": "Congo",
    "TW": "Taiwan",
    "PS": "Palestine",
    "TR": "Türkiye",
    "CZ": "Czechia",
    "MK": "North Macedonia",
    "BN": "Brunei",
    "FM": "Micronesia",
}

# Places whose official GeoNames name is less familiar than the everyday one.
RENAMES = {
    ("Kiev", "UA"): "Kyiv",
}

# Other names people search for, keyed by (GeoNames name, country code).
OTHER_NAMES = {
    ("Mumbai", "IN"): ["Bombay"],
    ("Kolkata", "IN"): ["Calcutta"],
    ("Chennai", "IN"): ["Madras"],
    ("Bengaluru", "IN"): ["Bangalore"],
    ("Beijing", "CN"): ["Peking"],
    ("Guangzhou", "CN"): ["Canton"],
    ("Ho Chi Minh City", "VN"): ["Saigon"],
    ("Yangon", "MM"): ["Rangoon"],
    ("New York City", "US"): ["New York", "NYC"],
    ("Los Angeles", "US"): ["LA"],
    ("San Francisco", "US"): ["SF"],
    ("Washington", "US"): ["Washington DC", "DC"],
    ("Kyiv", "UA"): ["Kiev"],
    ("Mexico City", "MX"): ["CDMX"],
}


def main(data_dir):
    data = Path(data_dir)
    cities = json.loads((data / "cities15000.json").read_text(encoding="utf-8"))
    countries = json.loads((data / "countries.json").read_text(encoding="utf-8"))
    us_states = json.loads((data / "us_states.json").read_text(encoding="utf-8"))

    country_name = {code: COUNTRY_NAMES.get(code, c["name"].strip()) for code, c in countries.items()}
    state_name = {code: s["name"] for code, s in us_states.items()}

    rows = []
    for c in cities.values():
        code = c["countrycode"]
        if not c.get("timezone") or code not in country_name:
            continue
        name = RENAMES.get((c["name"], code), c["name"])
        region = state_name.get(c["admin1code"], "") if code == "US" else ""
        alts = OTHER_NAMES.get((name, code), [])
        # Only the capital gets the DC nicknames, not every US town called Washington.
        if name == "Washington" and region != "District of Columbia":
            alts = []
        rows.append((name, region, country_name[code], c["timezone"], c["population"], alts))

    rows.sort(key=lambda r: (-r[4], r[0]))

    country_list = sorted({r[2] for r in rows})
    zone_list = sorted({r[3] for r in rows})
    country_index = {n: i for i, n in enumerate(country_list)}
    zone_index = {z: i for i, z in enumerate(zone_list)}

    out = {
        "source": "GeoNames (CC BY 4.0), https://www.geonames.org/",
        "countries": country_list,
        "zones": zone_list,
        "cities": [
            [name, region, country_index[country], zone_index[tz]] + (["|".join(alts)] if alts else [])
            for name, region, country, tz, _pop, alts in rows
        ],
    }

    target = Path(__file__).resolve().parent.parent / "site" / "data" / "cities.json"
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"Wrote {len(rows)} cities, {len(zone_list)} time zones to {target}")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
