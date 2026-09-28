# Tuyen Portfolio

Personal portfolio website of Nguyễn Ngọc Tuyền, a single-page static site built with React, TypeScript and Vite.

## Overview

A front-end-only, single-page CV/portfolio. It has no backend, CMS or form submission. All text lives in one typed content file and is available in Vietnamese (the default) and English, switchable from the navbar. The visual style uses a black background, cream accent color, "liquid glass" pill buttons and cards, and Instrument Serif / Barlow typography.

## Sections and features

- **Navbar**: anchor links to each section, a contact button, a language toggle (VI / EN) and a mobile menu.
- **Hero**: headline with a word-by-word pull-up animation, a canvas particle/aurora background with GSAP mouse parallax, a cursor spotlight that reveals the portrait photo, and CTAs to Projects and Contact.
- **About**: short bio, portrait with an animated glow border, and education details.
- **Experience**: timeline of work history, animated on scroll.
- **Skills**: skill groups with Lucide icons, shown on tilt cards.
- **Projects**: selected projects with year, role and scope, shown on tilt cards.
- **Contact**: email (`mailto:` link) and location.

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
