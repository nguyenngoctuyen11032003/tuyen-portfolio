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

## 3D avatar (`public/models/tuyen-avatar.glb`)

The raw scan is `public/3D_avatar.glb` (20 MB, generated from the cup illustration). The web model is
built from it in four steps, all run from `scripts/face-retouch/` with `node` (Node 24, `sharp`; no
Python or Blender needed). Under Git Bash set `MSYS_NO_PATHCONV=1` so `/proj/...` URLs are not
rewritten to Windows paths, and pass `C:/...` style output paths.

| Step | Script | What it does |
| --- | --- | --- |
| 1 | `node edit.mjs <out> preview` / `bake` | Image-space face retouch on unlit renders (yaw 45 / 25 / -25 / 0), baked into `basecolor-edited.jpg` + `face-mask.png`: clean, even skin (frown lines, nose-wing crease, specks and seams removed), dark-brown brows, and both eyes redrawn on 0.05 m close-ups (crisp black lash line with an outer flick, heavy lid and crease, dark-brown iris with pupil, limbal ring and catch-light; each eye is only ~40×15 texels in the scan). No painted shadows: they read as dirty marks under the hero lights; let the geometry do the shading. Coordinates come from `node closeup.mjs <out> <yaw>` (gridded render). |
| 2 | `node geometry.mjs ../../public/3D_avatar.glb geo.glb` | Sculpts the mesh in a head-local frame: higher nose bridge, eye sockets + brow ridge, leaner lower cheeks, chin forward. Recomputes normals of moved vertices. |
| 3 | `node ../enhance-avatar.mjs geo.glb enh.glb --base <out>/basecolor-edited.jpg --smooth-normals <out>/face-mask.png` | Warms and deepens the skin, mild unsharp on skin, stronger on jacket / strap / hair; blurs the normal map under the face mask (the scan has the frown lines in its normals too) and skips sharpening there (it rings white around the lash lines). |
| 4 | `gltf-transform optimize enh.glb ../../public/models/tuyen-avatar.glb --compress meshopt --texture-compress webp --texture-size 2048 --simplify false` | Web build (3.5 MB). Never simplify: it blurs the face. |

Checking the result: `node server.mjs <this folder>` serves `index.html` (three.js head renderer) on
port 5310; `node render.mjs <out> "new=/new.glb;cur=/proj/public/models/tuyen-avatar.glb" 0,35,-35`
renders head closeups through headless Chrome (`{"clay":true}` for geometry only, `{"unlit":true}`
for albedo only, `{"site":true}` for the hero's lights and material settings) and `node sheet.mjs <sheet.png> 450 2 <png...>` tiles them for comparison.
