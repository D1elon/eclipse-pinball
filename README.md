# Eclipse Pinball — website

Single-page marketing site for Eclipse Pinball, 1310 Altamont Ave, Richmond VA.
Dark 80s-arcade theme. No build step, no dependencies, no framework.

```
index.html               content + JavaScript, with the original embedded logos
assets/site.css          site styles
assets/fonts/            locally hosted fonts and their licenses
tools/sync-games.mjs     keeps the fallback, counts, and checked date current
tools/validate-site.mjs  checks data, scripts, links, and local assets
games.json               the machine lineup the page renders
tools/refresh-games.mjs  pulls a fresh lineup from the Pinball Map API
tools/refresh-instagram.mjs  pulls recent IG posts and downloads the images
instagram.json           the posts the page renders (hand-picked today)
assets/ig/               local copies of the post images
og-image.jpg             1200x630 social-share preview
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
> renders the saved lineup — but serve it over HTTP to exercise the real path.

## The games list — read this part

The lineup is manually maintained until the requested API key is approved.
The September 10, 2026 check found 53 games on
[Eclipse's Pinball Map listing](https://pinballmap.com/map/?by_location_id=15825),
whose last location update was September 6. Additions since the previous snapshot:
Harry Potter (Wizard Edition), Night Moves, and Theatre of Magic. No removals.

### Manual updates

1. Compare the complete lineup with the linked Pinball Map location.
2. Edit `games.json`: add/remove machines and set `updated` to the date you checked.
   Keep `updateMethod` as `manual`; set `sourceUpdated` to the listing's update date
   if shown, or remove it if unknown.
3. Run `node tools/sync-games.mjs`, then `node tools/validate-site.mjs`.
4. Commit `games.json` and `index.html`. The Pages workflow runs both steps too,
   so edits made directly on GitHub get the same treatment before publishing.

The page shows a checked date rather than promising live availability. It also
embeds the saved roster so a failed JSON request cannot leave an empty games list.

### When the API key arrives

Keep the approved token server-side in GitHub Actions secrets. The existing
workflow refreshes the roster daily at 09:00 UTC, on pushes to `main`, and on
demand. Without `PINBALL_MAP_TOKEN`, it deploys the committed manual list.

```
Pinball Map API → tools/refresh-games.mjs → games.json → tools/sync-games.mjs → index.html
```

Add the approved key under **Settings → Secrets and variables → Actions** as
`PINBALL_MAP_TOKEN`. Run **Actions → Deploy site → Run workflow** and verify the
resulting roster and checked date. No hosting change is required.

The existing API refresher is retained for that activation. It includes the
documented `api_token` parameter as an authentication option. The authenticated
request has not been tested with a real key. It refuses an empty response and
keeps the prior file on fetch failure. Publishing also synchronizes the fallback
and validates local assets. Source: [Pinball Map API docs](https://pinballmap.com/api/v1/docs).

To refresh locally after approval:

```sh
export PINBALL_MAP_TOKEN="your-token-here"
node tools/refresh-games.mjs
node tools/sync-games.mjs
node tools/validate-site.mjs
```

**Never place the key in browser code or commit it to the repository.**

### Attribution

Pinball Map asks that you credit them when you use their data. The credit is in
two places in `index.html` — under the games grid and in the footer. Please
leave it in.

## Before launch — placeholders to replace

Every one is marked with `TODO(client)` in `index.html`. Search for that string.

| What | Where | Status |
|---|---|---|
| Facebook URL | footer `.social` | **Placeholder**, points at the bare domain |
| Instagram post links | `instagram.json` | **Placeholder**, all three link to the profile |

### What's already verified

Confirmed by the client or pulled from the Pinball Map listing — not invented:

- 1310 Altamont Ave, Richmond, VA 23230 (Scott's Addition)
- 804-420-2188
- **Sun & Mon 11:00 AM – 7:00 PM; Tue–Sat 11:00 AM – 8:00 PM**
- $15 entry, all games on free play
- All ages
- 53 machines checked against Pinball Map on Sep 10, 2026
- Anti-reflective glass on every game (confirmed Aug 4, 2026)
- Instagram: [@eclipsepinball](https://www.instagram.com/eclipsepinball/)
- Email: contact@eclipsepinball.com
- Formerly Wax Moon; reopened July 4 as Eclipse Pinball

## The FAQ

Seven questions in a native `<details>` accordion in the `#faq` section — no JS,
keyboard-accessible for free, and it works with scripts disabled.

**The answers came from Alex and Andrew's thread**, not from guesswork. Editing one
means editing it in **two places**: the visible `<details>` block *and* the
`FAQPage` JSON-LD in the `<head>`. Google requires the structured data to match the
visible copy — a mismatch can cost the rich result. Search `"@type": "FAQPage"`.

### One question is parked

**"Can I bring in my own food or drinks?"** is written and sitting commented out
just below the private-event question. Andrew said he'd rather not raise it on the
site; Alex noted it comes up repeatedly and Andrew thumbs-up'd both of his replies,
so it was never actually settled. To publish it, delete the `<!--` and `-->` around
the block — and add the matching entry to the JSON-LD.

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
> **7:00 PM**. That now matches the site on Sun/Mon but not Tue–Sat. Google should
> be updated to the split schedule — it's what most people check before driving over.
>
> **Worth confirming (2):** the tournament starts at 7:00 PM but the posted closing
> time is 8:00 PM. Presumably the room stays open past close on tournament
> nights — the Hours block says "Tournament nights run later — see Events" to
> cover it, but you may want a firmer line from the client.

## Design notes

- **Type** — Barlow Condensed for headings; Source Sans 3 for body text and
  controls. Fonts and SIL Open Font Licenses are in `assets/fonts/`.
- **Controls** — rectangular buttons, underlined era filters, and clear focus
  rings. Game names and editions sit in a quieter, more readable list.
- **Type scale** — the 18px default respects the visitor's browser font setting.
- **Identity** — the original wordmark, badge, glowing eclipse, moving grid and
  cyan/pink arcade colors remain. Scanlines are subtle and limited to the hero.
  Logo flicker and scroll reveals are removed; reduced-motion preferences stop
  the grid and eclipse animation.
- **Accessibility** — filters use `aria-pressed`; a compact result count uses
  `aria-live`; the mobile menu supports Escape and `aria-expanded`. Native FAQ
  disclosures and the call/text dialog are retained, with reduced-motion support.
- **Map** — the existing Google Maps embed stays in its original map colors.
  Font assets are local; the map still makes requests to Google.
- **Directions links** carry `data-directions`. The HTML href is a plain Google Maps
  directions URL so it works with JS off and on desktop; a small script swaps it for
  `maps://` on iOS and `geo:` on Android so phones hand off to whatever maps app the
  person actually uses. Desktop is left alone deliberately — a Mac would otherwise
  launch the Apple Maps app when someone just wanted a map in their browser.

## The Instagram section

Three hand-picked posts, listed in `instagram.json`, with square images in
`assets/ig/`. No API, no token, no third-party requests. The page fetches
`instagram.json` the same way it fetches `games.json`, so nothing about the
markup changes when the API is eventually connected.

**To swap a post by hand:** drop a square JPEG in `assets/ig/` (900x900 is what
the existing ones are) and edit the matching entry in `instagram.json`. Keep the
`alt` text descriptive; it's what a screen reader announces.

**A caveat worth knowing:** all three tiles currently link to the profile rather
than to the individual posts, because the post URLs weren't available when they
were added. Paste the real `instagram.com/p/XXXX` URLs into `permalink` when you
have them and the tiles will deep-link properly.

**When the API is connected**, `tools/refresh-instagram.mjs` overwrites
`instagram.json` and the images in `assets/ig/` on every deploy. The hand-picked
set is a stand-in, not a fallback, so back these three up first if you want to
keep them.

### Image prep

Tiles render at `aspect-ratio:1` with `object-fit:cover`, meaning the browser
centre-crops anything that isn't square. The flyer was cropped from the top by
hand so the logo and date survived; a centre crop had cut the logo in half. Worth
remembering for any text-heavy image.

## Phone links open a chooser

Every `tel:` link on the page opens a small dialog offering **Call** or **Text**
instead of dialling straight away, because plenty of people would rather text.
There are three of them: the Contact row in Visit, the "Still stuck?" button in
the FAQ, and the footer.

It's progressive enhancement, same shape as the directions links. The `href` in
the HTML is a real `tel:` link, so with JavaScript off, or in a browser without
`<dialog>`, tapping the number just dials as it always did. The script only
intercepts the click when it can actually show the chooser.

**To change the number**, search `18044202188` — it appears in the three page
links, twice inside the dialog (`tel:` and `sms:`), in the visible dialog text,
and in the `telephone` field of the JSON-LD. Update all of them.

> `sms:` is reliable on iOS and Android. On desktop it depends on whether the OS
> has a handler registered, so a Windows visitor may find "Text" does nothing.
> The number is shown as plain text in the dialog so it can always be copied.
