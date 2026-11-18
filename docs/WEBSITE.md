# Modern Campus portfolio

A static, dependency-free site for GitHub Pages. The visual design follows MicroHub's Modern Campus palette: off-white `#F6F8F8`, navy `#10132E`, teal `#087F7A`, mint surfaces, and rounded cards. The bundled workspace SVG and record artwork are original decorative illustrations. The existing avatar is preserved.

## Preview

From the repository directory:

```sh
python -m http.server 3000 --bind 0.0.0.0
```

Open http://localhost:3000. There is no build or installation step. To publish, deploy the repository root using the repository's GitHub Pages configuration.

## Features

- Desktop sidebar and mobile bottom navigation, including a saved-project collection.
- Search names, descriptions, languages, and topics; combine multiple words and language filters. Sort by update date, star count, or name.
- Grid/list switch and optional dark theme. Preferences and bookmarks are stored in this browser, without an account or server sync.
- GitHub repositories load automatically, including additional pages. Refresh retries failures. A ten-second timeout releases loading controls.
- Successfully fetched repositories are cached locally. If GitHub fails, cached data remains available; on a first visit, a clearly labeled curated collection appears. Unknown star counts and update dates are not fabricated.
- Keyboard shortcut `/` focuses search; Escape clears it. Skip link, visible keyboard focus, accessible control names, live result counts, and reduced-motion support.
- External data is escaped before rendering, and external links accept HTTP/HTTPS URLs only.

## Content maintenance

Edit `index.html` for hero, spotlight, about, and profile content. Edit the `featured` array in `app.js` for first-visit fallback projects. Live repository content comes from GitHub. Visual tokens are at the top of `style.css`.

## Verification

Run JavaScript syntax and whitespace checks:

```sh
node --check app.js
git diff --check
```

With the local preview running, Python Playwright installed, and Chromium available at `/usr/bin/chromium`:

```sh
python scripts/check_site.py
```

The browser check uses intercepted GitHub responses to verify successful loading, failure fallback, cache recovery, search, filtering, sort, bookmark persistence, grid/list switching, theme, safe rendering, and responsive widths of 320, 390, 768, 1024, and 1440 pixels. It saves screenshots in `docs/screenshots`. These screenshots show the labeled fallback collection, rather than live GitHub statistics. Live GitHub access was unavailable from the execution environment. Physical devices and Safari were not tested.

No hosted deployment has been performed.

## Project pages, journal, and localization

The four project pages in `projects/` and two journal entries in `journal/` are generated static HTML. They work as direct links on GitHub Pages and show readable content without JavaScript. Edit bilingual content in `data/projects.json` and `data/journal.json`, then run `python scripts/build_content.py`. This also regenerates `content.js`. Do not hand-edit generated pages.

Source references: MicroHub's `codex/ui-redesign` branch (`d93ccf1`); Nanatsukaze main (`1f70c13`); Soriva main (`cbba44f`). Screenshots use local public-source previews; MicroHub's screenshot uses its documented synthetic test identity. No private account records are included. The journal describes this portfolio implementation; engineering notes derive from source documentation. Status labels are curated, with GitHub's `archived` flag taking precedence. Unknown repositories show “Status unlisted.” A public release label is not a maintenance guarantee.

Nanatsukaze and the portfolio have opt-in embedded interactive previews. Soriva and MicroHub have screenshots and source links because no public interactive app is being exposed here. Nanatsukaze's live host and YouTube playback could not be verified from the cloud environment; its original public-source screenshot was inspected. The portfolio's embedded search was exercised locally. All previews retain an external-open fallback.

English/Chinese preference is stored under `zt.locale` and can be set with `?ui=zh`. Existing public repository text remains in its source language unless a curated translation is supplied. Search supports translated descriptions. Main search state uses `q`, `tech`, `status`, `sort`, and `view` query parameters. “Copy filtered link” shares the public filtered collection; bookmarks remain local to each browser.

Contact uses the user-approved email and GitHub profile only. No phone contact is published.

Avatar variants are 80, 160, and 320 pixels: 2,816, 9,388, and 30,812 bytes, compared with the approximately 592 KB original. Images use `srcset`; detail screenshots are WebP and lazy-loaded.

## Animation controls

Section reveals, staggered cards, floating illustration, rotating vinyl, spark motion, bookmark feedback, navigation/CTA hover effects, and loading/toast transitions use CSS transform/opacity. “Animations on/off” persists separately in `zt.motion`. Device reduced-motion settings take priority. Content remains readable without JavaScript; paused motion reveals all sections immediately.

## Automated publishing gate

Development tooling only (the public site still has no runtime dependencies):

```sh
npm ci
pip install -r scripts/requirements.txt
python -m playwright install chromium
npm run check:syntax
npm run check:links
# With the preview running on port 3000:
npm run check:browser
```

Use `CHROMIUM_PATH` when Chromium is not `/usr/bin/chromium`. `scripts/check_extensions.py` checks translations, direct project routes, URL restoration, clipboard actions, iframe interaction, responsive layouts, reduced motion, and axe WCAG A/AA findings. Automated accessibility checks supplement manual review; they are not a complete accessibility certification.

`.github/workflows/site.yml` runs on pushes and PRs. It verifies generated pages, local links/assets, browser flows, accessibility, responsive widths, and public outbound links with Lychee. External link checks are configured for GitHub Actions; they have not run on GitHub yet. Hosted network failures may fail the outbound check and require investigation.

To use the optional deployment gate, set GitHub Pages' source to **GitHub Actions**, then run **Website checks and optional deployment** on `main` with **deploy** enabled. Publishing depends on all checks passing. Normal pushes and PRs only run checks. Existing branch-based Pages publication, if enabled, must be switched to Actions for this gate to govern deployment. No workflow has been dispatched and no site deployment occurred during this task.
