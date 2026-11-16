/*
 * The cities on Country Time's main clock list. Only this file decides the list: visitors can
 * search any city to see its time, but they cannot add or remove clocks.
 *
 * Each city needs:
 *   name     – the city as visitors should see it
 *   country  – shown under the name
 *   tz       – its IANA time zone, e.g. "Asia/Karachi"
 *              (the full list: https://en.wikipedia.org/wiki/List_of_tz_database_time_zones)
 *   region   – optional, e.g. a US state, to tell apart cities with the same name
 *   page     – optional, the city's page on this site (city names on the clock list link to it)
 *
 * The order here does not matter: the page always sorts the clocks from west to east.
 * Each visitor's own city is also added automatically, marked "(you)".
 */
window.HOURLINE_CLOCKS = [
  { name: "Los Angeles", country: "United States", tz: "America/Los_Angeles", page: "/time/los-angeles/" },
  { name: "New York", country: "United States", tz: "America/New_York", page: "/time/new-york/" },
  { name: "São Paulo", country: "Brazil", tz: "America/Sao_Paulo", page: "/time/sao-paulo/" },
  { name: "London", country: "United Kingdom", tz: "Europe/London", page: "/time/london/" },
  { name: "Paris", country: "France", tz: "Europe/Paris", page: "/time/paris/" },
  { name: "Lagos", country: "Nigeria", tz: "Africa/Lagos", page: "/time/lagos/" },
  { name: "Dubai", country: "United Arab Emirates", tz: "Asia/Dubai", page: "/time/dubai/" },
  { name: "Mumbai", country: "India", tz: "Asia/Kolkata", page: "/time/mumbai/" },
  { name: "Singapore", country: "Singapore", tz: "Asia/Singapore", page: "/time/singapore/" },
  { name: "Hong Kong", country: "China", tz: "Asia/Hong_Kong", page: "/time/hong-kong/" },
  { name: "Tokyo", country: "Japan", tz: "Asia/Tokyo", page: "/time/tokyo/" },
  { name: "Sydney", country: "Australia", tz: "Australia/Sydney", page: "/time/sydney/" },
  { name: "Nairobi", country: "Kenya", tz: "Africa/Nairobi", page: "/time/nairobi/" },
  { name: "Doha", country: "Qatar", tz: "Asia/Qatar", page: "/time/doha/" },
  { name: "Toronto", country: "Canada", tz: "America/Toronto", page: "/time/toronto/" },
  { name: "Mexico City", country: "Mexico", tz: "America/Mexico_City", page: "/time/mexico-city/" },
  { name: "Chicago", country: "United States", tz: "America/Chicago", page: "/time/chicago/" },
  { name: "Reykjavík", country: "Iceland", tz: "Atlantic/Reykjavik", page: "/time/reykjavik/" },
  { name: "Accra", country: "Ghana", tz: "Africa/Accra", page: "/time/accra/" },
  { name: "Lisbon", country: "Portugal", tz: "Europe/Lisbon", page: "/time/lisbon/" },
  { name: "Madrid", country: "Spain", tz: "Europe/Madrid", page: "/time/madrid/" },
  { name: "Berlin", country: "Germany", tz: "Europe/Berlin", page: "/time/berlin/" },
  { name: "Amsterdam", country: "Netherlands", tz: "Europe/Amsterdam", page: "/time/amsterdam/" },
  { name: "Rome", country: "Italy", tz: "Europe/Rome", page: "/time/rome/" },
  { name: "Stockholm", country: "Sweden", tz: "Europe/Stockholm", page: "/time/stockholm/" },
  { name: "Warsaw", country: "Poland", tz: "Europe/Warsaw", page: "/time/warsaw/" },
  { name: "Cairo", country: "Egypt", tz: "Africa/Cairo", page: "/time/cairo/" },
  { name: "Athens", country: "Greece", tz: "Europe/Athens", page: "/time/athens/" },
  { name: "Tel Aviv", country: "Israel", tz: "Asia/Jerusalem", page: "/time/tel-aviv/" },
  { name: "Istanbul", country: "Türkiye", tz: "Europe/Istanbul", page: "/time/istanbul/" },
  { name: "Moscow", country: "Russia", tz: "Europe/Moscow", page: "/time/moscow/" },
  { name: "Riyadh", country: "Saudi Arabia", tz: "Asia/Riyadh", page: "/time/riyadh/" },
  { name: "Tehran", country: "Iran", tz: "Asia/Tehran", page: "/time/tehran/" },
  { name: "Islamabad", country: "Pakistan", tz: "Asia/Karachi", page: "/time/islamabad/" },
  { name: "Kathmandu", country: "Nepal", tz: "Asia/Kathmandu", page: "/time/kathmandu/" },
  { name: "Dhaka", country: "Bangladesh", tz: "Asia/Dhaka", page: "/time/dhaka/" },
  { name: "Bangkok", country: "Thailand", tz: "Asia/Bangkok", page: "/time/bangkok/" },
  { name: "Jakarta", country: "Indonesia", tz: "Asia/Jakarta", page: "/time/jakarta/" },
  { name: "Ho Chi Minh City", country: "Vietnam", tz: "Asia/Ho_Chi_Minh", page: "/time/ho-chi-minh-city/" },
  { name: "Kuala Lumpur", country: "Malaysia", tz: "Asia/Kuala_Lumpur", page: "/time/kuala-lumpur/" },
  { name: "Manila", country: "Philippines", tz: "Asia/Manila", page: "/time/manila/" },
  { name: "Beijing", country: "China", tz: "Asia/Shanghai", page: "/time/beijing/" },
  { name: "Seoul", country: "South Korea", tz: "Asia/Seoul", page: "/time/seoul/" },
  { name: "Suva", country: "Fiji", tz: "Pacific/Fiji", page: "/time/suva/" },
  { name: "Auckland", country: "New Zealand", tz: "Pacific/Auckland", page: "/time/auckland/" }
];
