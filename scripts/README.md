# scripts

Helper scripts that generate static assets in `public/`. They are not part of the Vite build.

| Script | Output | Run |
| --- | --- | --- |
| `make_cv.py` | `public/cv.pdf` (one-page English CV) | `python3 scripts/make_cv.py` |
| `make_og.py` | `public/og-cover.jpg` (1200×630 share image) | `python3 scripts/make_og.py` |

Requirements: Python 3, `pip install reportlab pillow`.

Update the CV text in `make_cv.py` whenever `src/data/content.ts` changes, so the site and the CV stay consistent.

## Fonts

`Barlow-*.ttf` are from the Barlow family by Jeremy Tribby, licensed under the SIL Open Font License 1.1 (https://openfontlicense.org). `make_og.py` also uses DejaVu Serif from the system for the name, because Instrument Serif does not include Vietnamese glyphs.
