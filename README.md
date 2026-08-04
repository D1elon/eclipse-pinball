# Eclipse Pinball — website

Single-page marketing site for Eclipse Pinball, 1310 Altamont Ave, Richmond VA.
Dark 80s-arcade theme. No build step, no dependencies, no framework.

```
index.html               the entire site (CSS + JS inlined, logos inlined as SVG/data-URI)
games.json               the machine lineup the page renders
tools/refresh-games.mjs  pulls a fresh lineup from the Pinball Map API
.github/workflows/       refresh + deploy to GitHub Pages
CNAME                    the custom domain (www.eclipsepinball.com)
DEPLOY.md                how to put this live on eclipsepinball.com
```

## Running it

It's a static file. Any of these work:

```sh
python3 -m http.server 8000     # then open http://localhost:8000
npx serve .
```

Hosting is **GitHub Pages** — see `DEPLOY.md`. Nothing to compile; push to `main`
and the workflow publishes it.

> Open `index.html` from the filesystem (`file://`) and the browser blocks the
> `games.json` fetch. The page falls back to its built-in snapshot, so it still
> renders all 50 machines — but serve it over HTTP to exercise the real path.

## The games list — read this part

The site was asked to pull a live list from the Pinball Map API. Two things
make a direct browser call impossible:

1. **Every endpoint now requires an API token.** Unauthenticated requests return
   `401 {"error":"A valid api_token is required for this endpoint."}`
2. **The API sends no CORS headers.** Even with a token, a `fetch()` from
   `eclipsepinball.com` is blocked by the browser before it leaves the page.

So the data is fetched *server-side* and served same-origin:

```
Pinball Map API  →  tools/refresh-games.mjs  →  games.json  →  index.html
```

`index.html` also embeds a snapshot of the lineup, so if `games.json` is ever
missing or malformed the page still renders a full list rather than an empty grid.

### Refreshing the lineup

1. Request a token at <https://pinballmap.com/api_token>
2. Run it:

```sh
export PINBALL_MAP_TOKEN="your-token-here"
node tools/refresh-games.mjs
```

The script tries all four plausible auth styles (`Authorization`, `X-Api-Token`,
`Bearer`, `?api_token=`) and reports which one worked — Pinball Map doesn't
document this. If every style fails, it exits non-zero and **leaves `games.json`
untouched**, so a bad run can never blank out the lineup.

### Automating it

Already wired up. `.github/workflows/deploy.yml` refreshes the lineup and deploys the
site on every push, daily at 09:00 UTC, and on demand from the Actions tab.

To switch the refresh on, add your token as a repository secret named
`PINBALL_MAP_TOKEN` (**Settings → Secrets and variables → Actions**). Until then the
workflow logs a notice and deploys the committed `games.json`, so the site is never
blocked on it. See `DEPLOY.md` for the full setup.

**Do not put the token in `index.html`.** It would be public, and it wouldn't
work anyway because of the CORS block.

### Attribution

Pinball Map asks that you credit them when you use their data. The credit is in
two places in `index.html` — under the games grid and in the footer. Please
leave it in.

## Before launch — placeholders to replace

Every one is marked with `TODO(client)` in `index.html`. Search for that string.

| What | Where | Status |
|---|---|---|
| Email address | `#visit` contact | **Placeholder** — `hello@eclipsepinball.com` |
| Facebook URL | footer `.social` | **Placeholder** — points at the bare domain |
| `og:image` | `<head>` | **Missing** — add a 1200×630 photo at `/og-image.jpg` |

### What's already verified

Confirmed by the client or pulled from the Pinball Map listing — not invented:

- 1310 Altamont Ave, Richmond, VA 23230 (Scott's Addition)
- 804-420-2188
- **Open daily, 11:00 AM – 8:00 PM**
- $15 entry, all games on free play
- All ages
- 50 machines as of Aug 3, 2026
- Instagram: [@eclipsepinball](https://www.instagram.com/eclipsepinball/)
- Formerly Wax Moon; reopened July 4 as Eclipse Pinball

## Updating the featured event

The Events section shows one featured tournament, currently **Mistress of the
Mooncade** (Fri Aug 14, 2026 — sign-up 6pm, start 7pm, $15).

To swap in the next one, edit the `<article class="ev-featured">` block in
`index.html` and change its `data-ends` attribute to the new event's end time:

```html
<article class="ev-featured rv" data-ends="2026-09-11T23:00:00-04:00">
```

Once `data-ends` is in the past the card automatically dims and gets a
"Past event" tag, so a site nobody has touched in a month never advertises a
tournament that already happened. Removing the `data-ends` attribute disables
that behaviour.

> **Worth confirming (1):** Google Business Profile lists Eclipse as closing at
> **7:00 PM**, "updated by this business 3 weeks ago" — which conflicts with the
> 11–8 the client gave us. The site uses 11–8 as instructed, but someone should
> reconcile the two, since Google is what most people actually see.
>
> **Worth confirming (2):** the tournament starts at 7:00 PM but the posted closing
> time is 8:00 PM. Presumably the room stays open past close on tournament
> nights — the Hours block says "Tournament nights run later — see Events" to
> cover it, but you may want a firmer line from the client.

## Design notes

- **Type** — Orbitron (display), Rajdhani (body), Share Tech Mono (labels). All three
  are base64-embedded in `index.html`, so the page makes **zero third-party requests** —
  no Google Fonts call, no tracking, no flash of unstyled text, works offline.
- **Type scale** — `html` is set to `112.5%` (18px) and everything below is in `rem`,
  so the whole page scales with a visitor's browser font-size preference.
- **Logos** — the wordmark was vector-traced from the supplied PNG to a ~6KB inline
  SVG that uses `currentColor`, so it stays crisp at any size and recolors with CSS.
  The circular badge is only 150×150, so it's used at favicon/nav scale only. If a
  higher-res badge exists, swap the data-URI in `<link rel="icon">` and the nav `<img>`.
- **Motion** — the grid floor, corona, and logo flicker all stop under
  `prefers-reduced-motion: reduce`.
- **Accessibility** — the era filter uses `aria-pressed`, the grid is `aria-live`,
  the mobile menu manages `aria-expanded`, and focus rings are visible throughout.
- **The map** is an OpenStreetMap embed (no API key, no tracking) with a CSS filter
  to match the dark theme. The marker sits at **37.565503, -77.471582** — the
  geocoded position of 1310 Altamont Ave, verified against OSM's own building
  data. The `bbox` is that point ±250m framed 4:3; if you change the frame's
  aspect ratio, recompute the bbox to match or the map will letterbox.
  Swap for a Google Maps embed if you'd rather.
