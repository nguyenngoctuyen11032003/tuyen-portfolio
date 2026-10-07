# Tuyen Portfolio

Personal portfolio website of Nguyễn Ngọc Tuyền, a single-page static site built with React, TypeScript and Vite.

## Overview

A front-end-only, single-page CV/portfolio. It has no backend, CMS or form submission. All text lives in one typed content file and is available in Vietnamese (the default) and English, switchable from the navbar. The visual style uses a black background, cream accent color, "liquid glass" pill buttons and cards, and Instrument Serif / Barlow typography.

## Sections and features

- **Navbar**: anchor links to each section, a contact button, a language toggle (VI / EN) and a mobile menu.
- **Intro**: a full-screen opening that types a terminal boot log, shows "ACCESS GRANTED" with a light sweep, then fades into the page (about 5 s, `SKIP →` or Escape to skip). It plays once per tab session (`sessionStorage.intro_shown`) and is skipped with reduced motion or a deep link such as `#projects`. To replay it, run `sessionStorage.removeItem('intro_shown')` and reload. Timings and lines live in `src/components/intro/CinematicIntro.tsx`; the accent colour is `--intro-accent` in `src/index.css`. The effect is decorative: nothing is checked or verified.
- **Hero**: headline with a word-by-word pull-up animation, a canvas particle/aurora background with GSAP mouse parallax, a cursor spotlight that reveals the portrait photo, and CTAs to Projects and Contact.
- **About**: short bio, portrait with an animated glow border, and education details.
- **Experience**: timeline of work history, animated on scroll.
- **Skills**: skill groups with Lucide icons, shown on tilt cards.
- **Project archive**: every project screenshot on a 3D Fibonacci sphere with the section title on its centre. Drag to rotate (with momentum), scroll to dolly in; clicking a shot opens that project's details. Pinned while it scrolls; static with reduced motion.
- **Projects**: project cards with screenshot covers, a gallery modal, highlights and live/source/case-study links. On desktop the cards scale in and out with scroll.
- **Contact**: a pinned outro: the page washes to white, blended text inverts, and a large "email me" pill grows from the corner before the footer fades in.
- **Cursor**: a small difference-blended dot that widens over links, buttons and archive shots (mouse only, off with reduced motion).

Animations use framer-motion (scroll-in reveals, tilt cards, buttons) and GSAP (hero parallax).

## Tech stack

- React 19, TypeScript
- Vite
- Tailwind CSS 3 (with PostCSS and Autoprefixer)
- framer-motion, GSAP
- lucide-react (icons)
- Vitest, Testing Library, jsdom (tests)
- Oxlint (linting)

## Project structure

```
src/
  App.tsx              Page layout: Navbar plus the six sections
  components/          Section components (Hero, About, Experience, Skills, Projects, Contact, Navbar)
  components/ui/       Shared UI: PillButton, TiltCard, WordsPullUp, LiquidGlassCard, LangToggle
  context/LangContext  Language state (vi / en) and useLang() hook
  data/content.ts      All site text in Vietnamese and English
  assets/avatar.jpg    Portrait photo
  index.css            Tailwind layers, liquid-glass and glow styles
public/favicon.svg
docs/superpowers/      Design spec and implementation plan
```

Most components have a matching `*.test.tsx` file next to them.

Project screenshots live in `public/projects/`. After adding or replacing one, run `node scripts/make_thumbs.mjs` to rebuild the WebP thumbnails in `public/projects/thumbs/` and `src/data/projectThumbs.json` (used by the archive sphere, card covers and gallery strip).

## Getting started

Requires Node.js and npm.

```bash
npm install       # install dependencies
npm run dev       # start the Vite dev server
npm run build     # type-check (tsc -b) and build to dist/
npm run preview   # serve the production build locally
npm test          # run the Vitest suite once
npm run lint      # run Oxlint
```

## Notes

- To change any text, edit `src/data/content.ts`. Both languages share the same `Content` type, so a missing key in either language is a type error.
- To replace the portrait, swap `src/assets/avatar.jpg`. It is used in both the Hero and About sections.
- Fonts are loaded from Google Fonts.
- No deployment configuration is included. The build output in `dist/` is static and can be served by any static host.

## Author

Nguyễn Ngọc Tuyền ([@nguyenngoctuyen11032003](https://github.com/nguyenngoctuyen11032003))
