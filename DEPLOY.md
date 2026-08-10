# Deploying to GitHub Pages + eclipsepinball.com

Everything in this folder is already a working repo. Push it, flip two settings,
change four DNS records, done.

---

## What the domain looks like right now (checked Aug 3, 2026)

| | Current value |
|---|---|
| Nameservers | `nsb1` – `nsb4.squarespacedns.com` |
| A records (apex + www) | `198.185.159.144`, `198.185.159.145`, `198.49.23.144`, `198.49.23.145` |
| What that is | **Squarespace's website hosting**, serving the "under construction" page |

The domain isn't merely *registered* at Squarespace — it's pointed at a Squarespace
site. Squarespace's docs are explicit:

> Your domain can't point to another site when these defaults are in place.

So the defaults have to go before anything else resolves. Squarespace stays your
**registrar** — nothing transfers, no downtime, no new bill.

---

## Step 1 — Push the repo

The repo is already initialised with one commit. Create an **empty, public** repo on
GitHub (no README, no .gitignore — this folder has them), then:

```sh
cd path/to/this/folder
git remote add origin https://github.com/<you>/eclipse-pinball.git
git push -u origin main
```

> **It must be public.** GitHub Pages on private repos requires a paid plan. Nothing
> here is secret — the Pinball Map token lives in Actions secrets, never in the code.

## Step 2 — Turn on Pages

**Settings → Pages → Build and deployment → Source: `GitHub Actions`.**

Not "Deploy from a branch" — the included workflow uses the Actions source. Picking
the branch option will fight with it.

That's it; the first deploy starts on your next push. Watch it under the **Actions**
tab. When it finishes you'll have a live `https://<you>.github.io/eclipse-pinball/`
to check before any DNS changes.

## Step 3 — Set the custom domain

**Settings → Pages → Custom domain** → enter `www.eclipsepinball.com` → Save.

There's already a `CNAME` file in the repo with that value, so this should match up
immediately. **Leave "Enforce HTTPS" alone for now** — it stays greyed out until DNS
resolves. You'll come back for it.

> **Why `www` and not the bare domain?** The site's `canonical` and `og:url` tags both
> say `https://www.eclipsepinball.com/`. Setting `www` as the Pages domain makes the
> apex redirect to it automatically, and keeps those tags honest. If you'd rather the
> bare domain be primary, change both tags in `index.html` and put
> `eclipsepinball.com` in the `CNAME` file instead.

## Step 4 — Change DNS in Squarespace

**Squarespace → Domains → eclipsepinball.com → DNS.**

> ### 📸 Screenshot the entire DNS panel before you touch anything.
> It is your only undo.

Delete the **Squarespace Defaults** records (the four A records and the Squarespace
`www` CNAME). Then add these under Custom Records:

| Type | Host | Value |
|---|---|---|
| A | `@` | `185.199.108.153` |
| A | `@` | `185.199.109.153` |
| A | `@` | `185.199.110.153` |
| A | `@` | `185.199.111.153` |
| CNAME | `www` | `<you>.github.io` |

Optional but nice — IPv6, so the site loads for mobile networks that prefer it:

| Type | Host | Value |
|---|---|---|
| AAAA | `@` | `2606:50c0:8000::153` |
| AAAA | `@` | `2606:50c0:8001::153` |
| AAAA | `@` | `2606:50c0:8002::153` |
| AAAA | `@` | `2606:50c0:8003::153` |

All eight values were resolved live from `pages.github.com` on Aug 3, 2026 rather than
copied from memory. The CNAME target is your GitHub **username**, not the repo name,
and it ends in `.github.io` with no path.

## Step 5 — Wait, then force HTTPS

Squarespace says 24–48 hours; usually it's far less. Check progress with:

```sh
nslookup eclipsepinball.com
nslookup www.eclipsepinball.com
```

When the apex returns the `185.199.x.153` addresses, go back to **Settings → Pages**
and tick **Enforce HTTPS**. GitHub issues a free certificate automatically. If the
checkbox is still greyed out, DNS hasn't finished — wait, don't fight it.

---

## ⚠️ Two things that can bite you

**1. Email.** MX records and any SPF/DKIM `TXT` records live in that same Squarespace
DNS panel. Deleting the *Squarespace Defaults* shouldn't touch them — but compare the
list before and after and confirm every `MX` and email-related `TXT` record survived.
This fails silently: mail just stops arriving, with no error anywhere.

**2. Billing.** Repointing DNS does **not** cancel a Squarespace *website* subscription.
If there's a paid plan behind that placeholder page, cancel it separately or you'll keep
paying for a site nobody can reach. The domain registration is a separate, cheaper line
item — keep that one.

---

## The automatic lineup refresh

`.github/workflows/deploy.yml` does two things on every run: refreshes `games.json`
from Pinball Map, then deploys the site.

**To switch it on:** request a token at <https://pinballmap.com/api_token>, then add it
under **Settings → Secrets and variables → Actions → New repository secret**, named
exactly `PINBALL_MAP_TOKEN`.

Until you do, the workflow logs a notice and deploys the committed `games.json` — so
the site works fine today with all 50 machines. Nothing is blocked on the token.

It runs on every push, daily at 09:00 UTC (5am ET), and on demand from the Actions tab.

**Design notes, in case you wonder why it's shaped this way:**

- *Refresh and deploy are one workflow, deliberately.* If a separate workflow committed
  `games.json`, that commit would be made with `GITHUB_TOKEN` — and commits made with
  `GITHUB_TOKEN` don't trigger other workflows. The site would quietly stop rebuilding.
- *The refresh step is `continue-on-error`.* A Pinball Map outage can never block a
  deploy of the rest of the site.
- *`refresh-games.mjs` refuses to write an empty list*, so a bad API response can't blank
  out the lineup — it exits non-zero and leaves the last good file in place.

> **One quirk to know:** GitHub disables scheduled workflows in repos with no activity
> for 60 days, and emails you when it does. If the lineup ever goes stale, check the
> Actions tab first — one manual run re-arms the schedule.

---

## The Instagram feed

The section between Events and Visit currently shows **three hand-picked posts**
listed in `instagram.json`, with the images stored locally in `assets/ig/`. No
API, no token, nothing to set up. It works today.

Connecting the API is optional and only buys you one thing: the section updates
itself instead of being edited by hand. Everything below is for that.

**How it works:** a workflow step pulls your posts server-side, **downloads the
images into `assets/ig/`**, and commits them. The site serves its own copies.
Instagram's CDN URLs are signed and expire within days, so storing the URL would
give you a grid of broken images by next week. Local copies also keep the page free
of Meta scripts and tracking pixels.

### Before you start

**The Instagram account must be a Business or Creator account.** Personal accounts
are no longer supported by any public Meta API. Convert it in the Instagram app
under Settings → Account type and tools if it isn't already.

### Setup

1. <https://developers.facebook.com/apps> → **Create app** → app type **Business**
2. Add the **Instagram** product, then open **API setup with Instagram Login**
3. Under *Generate access tokens*, click **Add an Instagram account** and log in as
   @eclipsepinball
4. Click **Generate token** next to the connected account
5. **Copy the token immediately** — Meta will not show it again
6. Repo → **Settings → Secrets and variables → Actions → New repository secret**,
   named exactly `INSTAGRAM_TOKEN`

The next deploy picks it up. Trigger one from the Actions tab rather than waiting
for the 09:00 UTC schedule.

### Keeping the token alive

Long-lived tokens expire after **60 days**. The script requests a fresh one on every
run, but storing it back needs a token that can write secrets, which `GITHUB_TOKEN`
cannot do.

To make it self-sustaining: create a **fine-grained personal access token**
(<https://github.com/settings/tokens?type=beta>) scoped to this repo with
**Secrets: Read and write**, and add it as a secret named `GH_PAT`.

**Without it everything still works** — you just regenerate `INSTAGRAM_TOKEN`
manually every couple of months. The run log prints the days remaining.

### Running it by hand

```sh
export INSTAGRAM_TOKEN="your-long-lived-token"
node tools/refresh-instagram.mjs
```

It writes `instagram.json`, downloads the images, prunes ones no longer used, and
saves the refreshed token to `.ig-token-new`. Any failure leaves the existing posts
and images untouched.

---

## After launch

- Open the real domain on a phone, not just desktop.
- Replace the remaining placeholders (see README): Facebook URL, Instagram post links.
- Paste a link into Facebook or iMessage and confirm the preview card shows the
  Sonic playfield photo (`og-image.jpg`).
- To update anything, edit the file, `git commit`, `git push` — live in about a minute.
