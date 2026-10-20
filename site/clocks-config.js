/*
 * The cities on Hourline's main clock list. Only this file decides the list: visitors can
 * search any city to see its time, but they cannot add or remove clocks.
 *
 * Each city needs:
 *   name     – the city as visitors should see it
 *   country  – shown under the name
 *   tz       – its IANA time zone, e.g. "Asia/Karachi"
 *              (the full list: https://en.wikipedia.org/wiki/List_of_tz_database_time_zones)
 *   region   – optional, e.g. a US state, to tell apart cities with the same name
 *
 * The order here does not matter: the page always sorts the clocks from west to east.
 * Each visitor's own city is also added automatically, marked "(you)".
 */
window.HOURLINE_CLOCKS = [
  { name: "Los Angeles", country: "United States", tz: "America/Los_Angeles" },
  { name: "New York", country: "United States", tz: "America/New_York" },
  { name: "São Paulo", country: "Brazil", tz: "America/Sao_Paulo" },
  { name: "London", country: "United Kingdom", tz: "Europe/London" },
  { name: "Paris", country: "France", tz: "Europe/Paris" },
  { name: "Lagos", country: "Nigeria", tz: "Africa/Lagos" },
  { name: "Dubai", country: "United Arab Emirates", tz: "Asia/Dubai" },
  { name: "Mumbai", country: "India", tz: "Asia/Kolkata" },
  { name: "Singapore", country: "Singapore", tz: "Asia/Singapore" },
  { name: "Hong Kong", country: "China", tz: "Asia/Hong_Kong" },
  { name: "Tokyo", country: "Japan", tz: "Asia/Tokyo" },
  { name: "Sydney", country: "Australia", tz: "Australia/Sydney" },
  { name: "Nairobi", country: "Kenya", tz: "Africa/Nairobi" },
  { name: "Doha", country: "Qatar", tz: "Asia/Qatar" },
  { name: "Toronto", country: "Canada", tz: "America/Toronto" },
  { name: "Mexico City", country: "Mexico", tz: "America/Mexico_City" },
  { name: "Chicago", country: "United States", tz: "America/Chicago" },
  { name: "Reykjavík", country: "Iceland", tz: "Atlantic/Reykjavik" },
  { name: "Accra", country: "Ghana", tz: "Africa/Accra" },
  { name: "Lisbon", country: "Portugal", tz: "Europe/Lisbon" },
  { name: "Madrid", country: "Spain", tz: "Europe/Madrid" },
  { name: "Berlin", country: "Germany", tz: "Europe/Berlin" },
  { name: "Amsterdam", country: "Netherlands", tz: "Europe/Amsterdam" },
  { name: "Rome", country: "Italy", tz: "Europe/Rome" },
  { name: "Stockholm", country: "Sweden", tz: "Europe/Stockholm" },
  { name: "Warsaw", country: "Poland", tz: "Europe/Warsaw" },
  { name: "Cairo", country: "Egypt", tz: "Africa/Cairo" },
  { name: "Athens", country: "Greece", tz: "Europe/Athens" },
  { name: "Tel Aviv", country: "Israel", tz: "Asia/Jerusalem" },
  { name: "Istanbul", country: "Türkiye", tz: "Europe/Istanbul" },
  { name: "Moscow", country: "Russia", tz: "Europe/Moscow" },
  { name: "Riyadh", country: "Saudi Arabia", tz: "Asia/Riyadh" },
  { name: "Tehran", country: "Iran", tz: "Asia/Tehran" },
  { name: "Islamabad", country: "Pakistan", tz: "Asia/Karachi" },
  { name: "Kathmandu", country: "Nepal", tz: "Asia/Kathmandu" },
  { name: "Dhaka", country: "Bangladesh", tz: "Asia/Dhaka" },
  { name: "Bangkok", country: "Thailand", tz: "Asia/Bangkok" },
  { name: "Jakarta", country: "Indonesia", tz: "Asia/Jakarta" },
  { name: "Ho Chi Minh City", country: "Vietnam", tz: "Asia/Ho_Chi_Minh" },
  { name: "Kuala Lumpur", country: "Malaysia", tz: "Asia/Kuala_Lumpur" },
  { name: "Manila", country: "Philippines", tz: "Asia/Manila" },
  { name: "Beijing", country: "China", tz: "Asia/Shanghai" },
  { name: "Seoul", country: "South Korea", tz: "Asia/Seoul" },
  { name: "Suva", country: "Fiji", tz: "Pacific/Fiji" },
  { name: "Auckland", country: "New Zealand", tz: "Pacific/Auckland" }
];
