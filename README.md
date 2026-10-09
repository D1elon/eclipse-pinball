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
index.html                  Main page and interactions
assets/site.css             Styles and local font data
games.json                  Machine lineup and source dates
instagram.json              Selected Instagram posts
assets/ig/                  Local post images
privacy.html                Website privacy notice
accessibility.html          Accessibility statement
tools/sync-games.mjs         Updates the saved lineup and counts
tools/validate-site.mjs      Checks data, scripts, links, and assets
tools/refresh-games.mjs      Optional Pinball Map API refresh
tools/refresh-instagram.mjs  Optional Instagram refresh utility
.github/workflows/deploy.yml Validation and Pages deployment
CNAME                       Custom domain
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
