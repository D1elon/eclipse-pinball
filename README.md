# Eclipse Pinball

A website for Eclipse Pinball in Richmond, Virginia. Built with plain HTML, CSS, and JavaScript, with an arcade-inspired design and practical details for planning a visit.

[Visit the site](https://www.eclipsepinball.com/)

## What it does

- Shows the machine lineup with era filters and a visible checked date.
- Keeps a saved lineup in the page so the list still works if the JSON request fails.
- Presents hours, admission, events, FAQs, directions, and contact options.
- Offers call and text choices on supported devices, with regular phone links as a fallback.
- Uses keyboard-friendly navigation, visible focus styles, and reduced-motion support.
- Publishes through GitHub Pages after checking the data, links, scripts, and local assets.

The visual design uses neon color, arcade typography, an animated eclipse, and a subtle CRT treatment. Fonts and Instagram images are served locally.

### Design rules worth keeping

- **Three fonts, three jobs.** Orbitron names things (headings, machine titles, buttons, nav). Rajdhani is for anything you read, at weight 500 for body text. Share Tech Mono is for data (dates, counts, labels, the readout). Sizes come from the `--fs-*` scale in `site.css`; don't add new ones.

- **One motion moment.** On load the moon crosses the sun and the corona lights at totality, then the hero holds still. The only things that keep moving are the slow grid floor and the corona's glow. Don't add scroll fade-ins or hover lifts; they make the page feel generic.
- **Colours have jobs.** Cyan is for things you can press and lamps that are lit. Magenta is for tournaments and events. Amber is the dot-matrix readout and pre-1990 machines. Violet is atmosphere only.
- **Headings carry data, not decoration.** A section heading is followed by a real fact (a count, a date, a neighbourhood), not a label above it.
- **Copy should stay true as the lineup changes.** Avoid naming specific machines or years in the hero or meta description, since the lineup is updated by hand.

## Stack

HTML, CSS, JavaScript, Node.js maintenance scripts, and GitHub Actions. The website has no build step. The maintenance scripts use Node.js built-ins, so there are no packages to install. The deployment workflow uses Node.js 20.

## Run locally

From the repository root:

```sh
python3 -m http.server 8000
```

Open [localhost:8000](http://localhost:8000).

Use a local HTTP server when checking the data-driven sections. Opening `index.html` directly uses the saved game lineup because browsers restrict local file requests.

## Project structure

```text
index.html                   Main page and interactions
assets/site.css              All styles (tokens, type scale, components)
assets/fonts/                Orbitron, Rajdhani, Share Tech Mono (woff2, latin)
assets/eclipse-wordmark.svg  Wordmark for the policy pages and 404
assets/ig/                   Instagram images (JPEG plus WebP sizes)
games.json                   Machine lineup and source dates
instagram.json               Selected Instagram posts
privacy.html                 Website privacy notice
accessibility.html           Accessibility statement
404.html                     "Page not found" (GitHub Pages serves it for any bad URL)
robots.txt, sitemap.xml      For search engines
favicon.ico                  Browser tab icon
tools/sync-games.mjs         Updates the saved lineup, counts, and sitemap date
tools/validate-site.mjs      Checks data, scripts, links, assets, and crawl files
tools/refresh-games.mjs      Optional Pinball Map API refresh
tools/refresh-instagram.mjs  Optional Instagram refresh utility
.github/workflows/deploy.yml Validation and Pages deployment
CNAME                        Custom domain
```

## Updating content

### Machine lineup

The repository includes a manually maintained snapshot from [Pinball Map](https://pinballmap.com/map/?by_location_id=15825). The checked date describes when the list was reviewed; it does not promise that every machine is available at that moment.

1. Compare the full lineup with the source listing.
2. Update `games.json`, including its checked date and source metadata.
3. Run:

   ```sh
   node tools/sync-games.mjs
   node tools/validate-site.mjs
   ```

4. Review and commit both `games.json` and `index.html`.

Keep the Pinball Map credit in the page and footer.

### Instagram

The current site uses selected posts from `instagram.json` and local images in `assets/ig/`. Edit the matching image, alt text, caption, and permalink when replacing a post. Square images work best; check crops carefully when an image contains text.

The repository also includes an API refresh utility. It is not part of the active deployment workflow.

### Events and FAQs

Featured events live in `index.html`. The event card's `data-ends` value controls when it receives a past-event label. Keep displayed dates and the cutoff consistent.

FAQ answers appear both in the visible page and in its `FAQPage` structured data. Update both when changing an answer. Publish only confirmed venue information.

## Deployment

The `Deploy site` workflow runs on pushes to `main`, daily at 09:00 UTC, and on demand. It optionally refreshes the game list, synchronizes the saved fallback, validates the site, and deploys an explicit set of public files to GitHub Pages.

If `PINBALL_MAP_TOKEN` is unavailable, the workflow keeps the committed lineup. An API failure also leaves the saved list in place.

Keep the existing custom domain and Pages configuration when making content changes. `DEPLOY.md` contains the original setup notes; its DNS instructions describe the initial migration.

## Credentials and maintenance

API credentials belong in GitHub Actions secrets or a local environment. Never add them to browser code or commit them. The optional Instagram utility can create a local `.ig-token-new` file; treat it as a credential and keep it outside version control.

Review privacy and accessibility notices whenever the site's features or third-party services change. The accessibility statement describes the work completed so far and does not claim a comprehensive audit.

## Known limitations

- The Facebook link still needs a verified venue URL.
- The selected Instagram tiles currently link to the profile rather than individual posts.
- The authenticated Pinball Map refresh is included but is not documented as tested with a live token.

These are maintenance items; the committed content can be previewed without API credentials.

## Search and performance notes

- **Fonts** are separate woff2 files, not base64 inside the CSS, so the stylesheet is small and cached across pages. The four faces the first screen uses are preloaded in `index.html`. The `… Fallback` faces in `site.css` are system fonts resized to match, so nothing jumps when the real fonts arrive. If the fonts ever change, recompute those numbers.
- **Structured data** in `index.html` describes the arcade (address, hours, coordinates, Instagram and Pinball Map profiles) and the website. If hours, phone, or address change, update the JSON-LD as well as the visible page.
- **FAQ structured data** must match the visible questions and answers word for word. Google no longer shows FAQ rich results for most sites, but it still reads the markup, so keep the two in step.
- **sitemap.xml**: the home page date updates itself when the lineup is synced. Change the policy pages' dates by hand when you edit them.
- **When you add a new top-level file**, add it to the `cp` line in `.github/workflows/deploy.yml` or it won't be published. The validator checks the crawl files and the 404 page are on that line.
- **The Facebook icon** was removed from the footer because it linked to facebook.com's homepage. Add it back (see the TODO in the footer) once there's a real page.
