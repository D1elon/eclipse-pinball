# Maintaining the Eclipse Pinball site

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

Type sizes come from the `--fs-*` scale in `assets/site.css`; use those rather than adding new sizes.

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

## Credentials

API credentials belong in GitHub Actions secrets or a local environment. Never add them to browser code or commit them. The optional Instagram utility can create a local `.ig-token-new` file; treat it as a credential and keep it outside version control.

Review privacy and accessibility notices whenever the site's features or third-party services change. The accessibility statement describes the work completed so far and does not claim a comprehensive audit.

## Search and performance notes

- **Fonts** are separate woff2 files, not base64 inside the CSS, so the stylesheet is small and cached across pages. The four faces the first screen uses are preloaded in `index.html`. The `… Fallback` faces in `site.css` are system fonts resized to match, so nothing jumps when the real fonts arrive. If the fonts ever change, recompute those numbers.
- **Structured data** in `index.html` describes the arcade (address, hours, coordinates, Instagram and Pinball Map profiles) and the website. If hours, phone, or address change, update the JSON-LD as well as the visible page.
- **FAQ structured data** must match the visible questions and answers word for word. Google no longer shows FAQ rich results for most sites, but it still reads the markup, so keep the two in step.
- **sitemap.xml**: the home page date updates itself when the lineup is synced. Change the policy pages' dates by hand when you edit them.
- **When you add a new top-level file**, add it to the `cp` line in `.github/workflows/deploy.yml` or it won't be published. The validator checks the crawl files and the 404 page are on that line.
