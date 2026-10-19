# Hourline – world clock

A static world clock website with built-in ad spaces. Plain HTML, CSS and JavaScript, with no build step. Everything the site serves is in `site/`.

## Run it locally

```sh
python3 -m http.server 8787 -d site
# open http://localhost:8787
```

## City search

The search bar covers every city and town with 15,000 or more people (about 34,000 places). The list lives in `site/data/cities.json` (about 290 KB compressed), and the page only downloads it when someone starts using the search. Until it arrives, search falls back to the 75 cities built into `app.js`.

The data comes from [GeoNames](https://www.geonames.org/) under CC BY 4.0. That licence requires the credit line in every page footer, so keep it.

To rebuild the list, for example to add another nickname to `OTHER_NAMES` in the script:

```sh
pip download --no-deps geonamescache -d /tmp/gnc && unzip -o /tmp/gnc/*.whl -d /tmp/gnc/x
python3 tools/build-cities.py /tmp/gnc/x/geonamescache/data
```

## Ad spaces

| Space | Key in `ad-config.js` | Size |
|---|---|---|
| Top banner | `top` | 728×90, 320×100 on phones |
| Left vertical banner | `railLeft` | 160×600, screens 1440px and wider |
| Right vertical banner | `railRight` | 300×600, screens 1100px and wider |
| Banner inside the clock list | `infeed` | 728×90, 320×100 on phones |
| Tiles | `tile1`, `tile2`, `tile3` | 300×250 |
| Guide banner | `article` | 336×280, 300×250 on phones |
| Bottom banner | `bottom` | 728×90, 320×100 on phones |
| Bottom-right video | `video` | 320×180, 224×126 on phones |
| Full screen | `interstitial` | Up to 960×640, once per visit |

Until you configure a space, it shows a "This ad space is available" placeholder linking to the Advertise section of `about.html`.

### Turning on AdSense

1. Deploy the site and apply for AdSense with your domain.
2. In `site/ad-config.js`, set `adsenseClient` to your publisher ID (`ca-pub-…`).
3. Create a display ad unit in AdSense for each space and paste its slot ID into `slots`.
4. In `site/ads.txt`, put in your publisher ID and remove the `#` from the last line.

**Policy limits to know before going live:**

- **Full-screen ad:** AdSense does not allow its ads inside pop-ups, so `ads.js` ignores an AdSense slot for the full-screen space. Sell that space directly, and for Google's own full-screen ads turn on *Vignette ads* under Auto ads in AdSense.
- **Video:** AdSense has no floating video unit. The video space plays a video you sell directly, or shows a normal display ad if you give it a slot ID.
- **Visitors in the EU, UK and Switzerland:** you need a Google-certified consent banner. AdSense offers one under *Privacy & messaging*.

### Selling spaces directly

Add an entry under `house` in `ad-config.js`. It overrides AdSense for that space:

```js
house: {
  top: { image: "/ads/acme-728x90.png", href: "https://acme.example", alt: "Acme travel insurance" },
  video: { video: "/ads/acme.mp4", poster: "/ads/acme.jpg", href: "https://acme.example", alt: "Acme" },
  interstitial: { image: "/ads/acme-960x640.jpg", href: "https://acme.example", alt: "Acme" }
}
```

Put the creative files in `site/ads/`. Update the email addresses in `about.html` and `privacy.html`.

## Deploy to Cloudflare

`wrangler.jsonc` serves the `site/` folder with Cloudflare Workers static assets.

From your computer:

```sh
npx wrangler login
npx wrangler deploy
```

Or from the dashboard: **Workers & Pages → Create → Import a repository**. Pick this repo, leave the build command empty, and use `npx wrangler deploy` as the deploy command. Each push to the branch you choose then redeploys.

Then add your domain under the Worker's **Settings → Domains & Routes**.
