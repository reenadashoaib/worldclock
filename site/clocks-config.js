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
  { name: "Sydney", country: "Australia", tz: "Australia/Sydney" }
];
