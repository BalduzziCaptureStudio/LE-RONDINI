# Le Rondini — website

A single-page static site (no framework, no build step) for the holiday apartment
Le Rondini in Gromo (BG). Italian by default, English via the IT/EN toggle.

```
le-rondini-site/
├── index.html        page structure + Italian text (shown before JS runs, to Google and to Facebook)
├── content.json      all copy, "it" and "en"
├── styles.css        design (colours/fonts at the top as CSS variables)
├── main.js           language toggle, lightbox, fade-in, form without reload
├── images/           photos (WebP + JPG, several sizes)
├── fonts/            Cormorant Garamond + Jost, self-hosted (no Google requests)
├── netlify.toml      Netlify config: cache + security headers
├── robots.txt, sitemap.xml, favicon.svg
└── tools/prepare_images.py   resizes a photo into all the files the page needs
```

---

## 1. Before going live: fill in the placeholders

Search the folder for `PLACEHOLDER` and replace each one:

| Placeholder | Where | Replace with |
|---|---|---|
| `DOMAIN_PLACEHOLDER` | `index.html` (canonical, Open Graph, Twitter, JSON-LD), `robots.txt`, `sitemap.xml` | Your domain without `https://`, e.g. `lerondini-gromo.netlify.app` or `www.lerondinigromo.it` |
| `[PLACEHOLDER: …]` | Privacy note, in `content.json` (it + en) **and** `index.html` | Data controller name and email, retention period |

Find & replace in any text editor (VS Code, BBEdit, TextEdit in plain-text mode) works fine.
The privacy text is a sensible starting point for a contact form, not legal advice.

**Already set:**

- WhatsApp: `https://wa.me/61431798927` in `index.html`. To change the number, edit the digits
  after `wa.me/`, in international format with digits only (no `+`, no spaces).
- Airbnb: `https://www.airbnb.it/h/le-rondini-gromo` in `index.html`.

The WhatsApp message is pre-filled in the visitor's language. Change the wording in
`content.json` → `contact.whatsappMessage`.

---

## 2. Editing text

All copy lives in **`content.json`**, under `"it"` and `"en"`. Keep the structure (keys,
quotes, commas) intact; only change the text between quotes.

**Important:** the Italian text is also written directly in `index.html`, so that the page
works without JavaScript and so Google/Facebook see it instantly. When you change Italian
text in `content.json`, make the same change in `index.html` (look for the matching
`data-i18n="…"` attribute). English lives only in `content.json`.

Page title, description and the Facebook/WhatsApp link preview text are in the `<head>` of
`index.html` (`og:title`, `og:description`, `twitter:*`). The title and description in both
languages are also in `content.json` → `meta`.

The "Gromo" section (title, the line "Uno dei borghi più belli d'Italia", photo alt text and the three
distances) is in `content.json` → `gromo`; the numbers (15 min, ~15 min, ~1h30) are in `index.html`.

The "Nei dintorni" places ("I nostri consigli"): names, villages and links are in `index.html`
(section 6); the short descriptions are in `content.json` → `nearby` (it + en). Map links are Google Maps searches.

To preview locally, run a tiny server from the folder (double-clicking `index.html` won't
load `content.json`, so the toggle won't appear):

```bash
cd le-rondini-site && python3 -m http.server 8000
```

Then open http://localhost:8000.

---

## 3. Replacing photos

The page currently uses `veranda.jpg` (hero) and, for the gallery (in page order), 01 = 0114 terrace,
19 = `_DSF0454` (the house's wisteria, right next to the terrace), 02 = 0116 living detail, 11 = 0115 bathroom, 03 = 0102,
04 = 0007, 05 = 0106 (living room), 07 = 0108 (kitchen with the long table), 09 = 0110 (double
bedroom). "Lo spazio" shows 10 = 0103 (twin bedroom) under the text and 06 = 0117 (bed detail) beside
it; they are not in the gallery, so nothing appears twice. The aerial shot of the medieval village
(12, from the video still) is the photo of the "Gromo" section. Photo 08 (kitchen corner) was removed;
its number is not reused.

The "Nei dintorni" section uses 13–18, 20 and 21: the "Inverno" card shows 20 (`_DSF5062`), the
"Estate" card 14 (`_DSF0430`, no snow), and the grid below 13, 16, 15, 18, 17, 21 (`_DSF0424`,
`_DSF0441`, `_DSF0433`, `_DSF0436`, `_DSF0420`, and 21 = `BALDUZZI-CAPTURE0026`, the fisherman). The
first grid tile is shown large. The originals of 13–20 were moved to `foto-aggiunte/`, next to the site folder, so they
aren't published.
The floor plan ("La pianta") is its own section: the title, the "where you sleep" legend and the plan
labels are in `content.json` → `planband` and `space.plan`.

Don't put original photos inside the site folder: everything in it gets published, including the
GPS position stored in camera files. Use the script, which writes clean copies into `images/`.

Each photo exists in several files (WebP + JPG, large + small), so phones download only
what they need. The easiest way to replace one is the helper script, which also converts to
sRGB and strips EXIF/GPS data:

```bash
cd le-rondini-site
python3 tools/prepare_images.py 05 ~/Desktop/new-photo.jpg     # gallery slot 05
python3 tools/prepare_images.py hero ~/Desktop/terrace.jpg
python3 tools/prepare_images.py og ~/Desktop/terrace.jpg --focus-y 0.4
```

- The hero is always shown **uncropped**: edge to edge on phones; on computers it sits in the same
  column as the text, aligned with its edges. If a new hero has a different shape, update `width`/`height` on the hero `<img>`
  in `index.html` (the script prints them).
- `--focus-y` (og only): vertical centre of the 1200×630 Facebook/WhatsApp preview crop.
- Needs Python 3 + Pillow (`pip3 install Pillow` if it's missing).

**Recommended source sizes:** hero at least **2400 px wide**; gallery at least **1600 px on
the long side**. Smaller sources are kept at their own size (never upscaled).

If you'd rather export by hand (e.g. from Lightroom), these are the files the page expects:

| Slot | Files in `images/` |
|---|---|
| Hero | `hero-terrazza.jpg/.webp` 2400 px wide · `hero-terrazza-1200.jpg/.webp` 1200 px wide · `hero-terrazza-800.jpg/.webp` 800 px wide |
| Link preview | `og-terrazza.jpg` 1200×630 |
| Gallery NN | `NN.jpg/.webp` 1600 px long side (lightbox) · `NN-800.jpg/.webp` 800 px long side (grid) |
| Swallows | `rondini.jpg/.webp` 1000 px wide: the painted swallows, with the wall flattened to pure white. The page shows them with "multiply", so the white disappears into the page colour. Made from a screenshot (1892 px); a full-resolution photo of the painting would make them a little crisper. |

Notes:
- The gallery is laid out in rows (see `gallery__row` in `index.html`): each photo has a shape class
  (`r-land` 3:2, `r-43` 4:3, `r-sq` square, `r-port` 2:3 portrait) so rows keep equal heights without
  cropping. If you swap a photo for one with another shape, change that class.
- If a new gallery photo has a different **orientation** than the one it replaces, update its
  `width`/`height`/`data-w`/`data-h` and the `srcset` widths in `index.html` (the script prints
  them), and the item's shape class (see the gallery note above).
- Update the photo's description (alt text) in `content.json` → `gallery.alts` (it + en) and in
  `index.html`. I wrote the current alt texts from looking at the photos; please check them.
- Photos are cached by browsers for 7 days (see `netlify.toml`). After replacing a photo, some
  returning visitors may see the old one for a few days.

---

## 4. Deploying on Netlify

### First deploy (recommended: Netlify CLI, reads `netlify.toml`)

You already have Node.js on this Mac.

```bash
cd "/Users/balduzzicapture/Desktop/FOTO E DOC CASA 21 PER REALESTATE/le-rondini-site"
npx netlify-cli deploy --prod --dir .
```

The first time, it opens the browser to log in and asks whether to create a new site; give it
a name (e.g. `lerondini-gromo` → `https://lerondini-gromo.netlify.app`). Re-run the same command
to publish every later change.

Alternatives: connect a GitHub repository (Netlify → Add new site → Import from Git; publish
directory `.`, no build command), or drag the folder onto Netlify's "Deploy manually" area. If you
use drag-and-drop, check afterwards that the security/caching headers are present
(`curl -I https://your-domain/`); if not, use the CLI or Git instead.

### Enable the form and email notifications

1. In Netlify: **Project configuration → Forms → Enable form detection**, then deploy once more
   (the form named `richiesta` should now appear under **Forms**).
2. **Project configuration → Notifications → Emails and webhooks → Form submission notifications →
   Add notification → Email notification**: enter your email, choose form `richiesta`, save.
3. Send yourself a test enquiry from the live site. Submissions are also listed in the **Forms**
   tab; anything caught by the spam filter is under "Spam submissions".

(Menu names occasionally change in Netlify's UI; "Forms" and "Notifications" are the sections
to look for. The free plan includes 100 form submissions per month.)

### Domain

- Using the free `*.netlify.app` address: just put it in place of `DOMAIN_PLACEHOLDER`.
- Custom domain: **Domain management → Add a domain**, follow the DNS instructions; HTTPS is
  automatic. Then replace `DOMAIN_PLACEHOLDER` with it and deploy again.

### After going live

- Check the Facebook/WhatsApp preview with the **Facebook Sharing Debugger**
  (developers.facebook.com/tools/debug): paste the URL, click "Scrape Again" after any change to
  the image or text.
- Optional: add the site to Google Search Console and submit `sitemap.xml`.

---

## 5. Technical notes

- Fonts are self-hosted (no requests to Google: faster, and no visitor IPs sent to third parties).
- Content-Security-Policy only allows files from the site itself. If you later add analytics,
  maps or embeds, their domains must be added to the CSP in `netlify.toml`.
- Without JavaScript the page is fully readable in Italian, gallery links open the full photo,
  and the form still submits (Netlify then shows its standard thank-you page).
- Lighthouse (mobile, local test, 4 Nov 2026): Performance 95, Accessibility 100,
  Best Practices 100, SEO 100.
- The Facebook/WhatsApp preview image (`og-terrazza.jpg`) is the one deliberate crop: those
  previews are always 1.91:1, so a crop is unavoidable there.
