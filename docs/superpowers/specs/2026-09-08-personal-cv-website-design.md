# Personal CV/Portfolio Website — Design Spec

Date: 2026-09-08
Owner: Nguyễn Ngọc Tuyền (tt98tuyen@gmail.com)

## 1. Purpose

A single-page, front-end-only personal introduction/CV website for Nguyễn Ngọc Tuyền, a
Full-Stack Developer currently working in software development at an international
cybersecurity company (ICS). The site should feel visually striking and unconventional
("phá cách"), synthesizing the best elements of three reference designs the user provided
(internally referred to as "Asme", "MicroVisuals", "Prisma") rather than cloning any one of
them, and populated with the user's real CV content instead of placeholder marketing copy.

No backend, no CMS, no forms that submit anywhere — purely a static front-end deliverable.

## 2. Source material constraints

The three reference prompts describe hero/section background videos hosted on a third
party's CloudFront distribution (`d8j0ntlcm91z4.cloudfront.net/...`). These are **not**
the user's assets and must not be reused. Each section's background is instead built from
one of four techniques, allocated per section (not layered together):

- CSS/Canvas aurora gradient + light particle drift (Hero)
- The user's own portrait photo (About) — placeholder until the user supplies the real photo
- Abstract noise/gradient card backgrounds (Projects, in place of the per-project stock video)
- (Free-license stock video was offered as an option but the user opted to allocate techniques
  per-section rather than use stock video; no stock video is used in the current design.)

## 3. Visual language

- **Background:** pure black (`#000000`) throughout, matching all three references.
- **Accent/text color:** warm cream (`#DEDBC8` primary Tailwind token, `#E1E0CC` for
  inline-styled body text), taken from the Prisma reference — used for headings, links, and
  primary CTA fills.
- **Secondary surface colors:** `#101010` (About card), `#212121` (Skills/Projects cards) to
  create depth layers without leaving black.
- **Liquid glass:** every pill nav, button, and floating card uses the `.liquid-glass` /
  `.liquid-glass-strong` treatment (defined below), reused verbatim from the Asme/MicroVisuals
  references.
- **Typography:**
  - `Instrument Serif` (italic + regular) — large headings and emotionally-accented words/phrases
    within headings (e.g. italic clauses inside a sentence).
  - `Barlow` (300/400/500/600) — body copy, nav links, buttons.
- **Shape:** `rounded-full` for all nav pills and buttons; `rounded-3xl` for large cards.
- **Texture:** subtle SVG `feTurbulence` noise overlay applied at low opacity to non-hero
  section backgrounds to avoid a flat/AI-generated look.

### `.liquid-glass` CSS (in `index.css` `@layer components`)

```css
@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Barlow:wght@300;400;500;600&display=swap');

.liquid-glass {
  background: rgba(255, 255, 255, 0.01);
  background-blend-mode: luminosity;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  border: none;
  box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.1);
  position: relative;
  overflow: hidden;
}
.liquid-glass::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1.4px;
  background: linear-gradient(180deg,
    rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.15) 20%,
    rgba(255,255,255,0) 40%, rgba(255,255,255,0) 60%,
    rgba(255,255,255,0.15) 80%, rgba(255,255,255,0.45) 100%);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}

.liquid-glass-strong {
  background: rgba(255, 255, 255, 0.01);
  background-blend-mode: luminosity;
  backdrop-filter: blur(50px);
  -webkit-backdrop-filter: blur(50px);
  border: none;
  box-shadow: 4px 4px 4px rgba(0,0,0,0.05), inset 0 1px 1px rgba(255,255,255,0.15);
  position: relative;
  overflow: hidden;
}
.liquid-glass-strong::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1.4px;
  background: linear-gradient(180deg,
    rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.2) 20%,
    rgba(255,255,255,0) 40%, rgba(255,255,255,0) 60%,
    rgba(255,255,255,0.2) 80%, rgba(255,255,255,0.5) 100%);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}
```

## 4. Page structure (6 sections, single page, VI/EN toggle)

### Navbar (sticky, liquid-glass pill)
- Left: monogram/logo "NNT".
- Center/right (desktop): links to each section anchor — About, Experience, Skills, Projects,
  Contact.
- Right: VI/EN language toggle + "Liên hệ / Contact" pill CTA (white/cream fill).
- Mobile: collapse links behind a hamburger icon; pill nav keeps logo + toggle + CTA visible.

### 1. Hero (full-viewport)
- Background: CSS/Canvas aurora gradient, slow drifting motion, plus a light particle layer
  (mouse-reactive parallax via GSAP, scoped to this component only).
- Headline (Instrument Serif, large, mixed italic accents): personalized "I am ..." style
  statement introducing the user by name and role. Approved copy:
  - VI: "Tôi là Nguyễn Ngọc Tuyền — kỹ sư viết code, giữ hệ thống an toàn."
  - EN: "I'm Nguyễn Ngọc Tuyền — an engineer who writes code and keeps systems safe."
- Subheading: current title + company — "Nhân viên kỹ thuật, Công ty Cổ phần An ninh mạng
  Quốc tế ICS" / "Software Engineer at ICS International Cybersecurity JSC" — plus location
  (Hà Nội).
- Two pill CTAs: "Xem dự án / View projects" (scrolls to Projects), "Liên hệ / Contact"
  (scrolls to Contact).
- Small liquid-glass social/contact icon row bottom of viewport (Email, Phone; GitHub/LinkedIn
  only if the user later supplies handles — omit otherwise, do not fabricate).

### 2. About (merged with Education)
- Layout: `#101010` card, portrait photo (real photo supplied by the user — casual portrait,
  navy jacket, Canon camera around neck, holding a coffee cup; to be saved at
  `src/assets/avatar.jpg` once the file path is provided) beside a pull-up-animated paragraph.
- Content: personal intro synthesized from the CV — born 11/03/2003 in Bảo Lộc, Bảo Đài,
  Bắc Ninh; currently based in Hà Nội; graduated with an IT Engineering degree from Đông Á
  University of Technology (Trường Đại học Công Nghệ Đông Á), 09/2021–06/2025. One clause of
  the paragraph rendered in Instrument Serif italic for emphasis (e.g. the cybersecurity
  pivot).
- Education is presented as a compact inline sub-block within this section (school, degree,
  dates) rather than a separate section.

### 3. Experience (timeline)
Vertical timeline, liquid-glass circular markers, staggered fade/slide-in on scroll into view:

| Period | Role | Organization | Focus |
|---|---|---|---|
| 03/2023–06/2024 | Nhân viên | Công ty TNHH SX&XNK Khang Minh | CNTT & xúc tiến thương mại |
| 09/2024–02/2025 | Nhân viên kỹ thuật | Học Mãi JSC | Phát triển phần mềm |
| 09/2025–nay | Nhân viên kỹ thuật | Công ty CP An ninh mạng Quốc tế ICS | Phát triển phần mềm |

### 4. Skills
Grid of `#212121` liquid-glass cards grouped by category, each with a `lucide-react` icon:
- Full-Stack Development
- Project Management (Quản lý dự án)
- Cybersecurity awareness (An ninh mạng)
- English — working proficiency ("khá")

### 5. Projects
Two-column card grid (hover-scale, mirrors the Asme `ServicesSection` card pattern), noise/
gradient background per card in place of stock video, tag = role, from CV section 8.1:

1. Hệ thống quản trị khách sạn ERP — 2024–2025 — Full-Stack Developer — Trường học
2. Hệ thống quản lý Lớp học và giáo viên — 2025 — Full-Stack Developer — Doanh nghiệp
3. Hệ thống HRM quản lý nhân sự cho doanh nghiệp — 2025–2026 — Quản lý dự án — Doanh nghiệp
4. Nền tảng đào tạo và giáo dục e-learning — 2025–2026 — Quản lý dự án — Doanh nghiệp
5. Hệ thống CRM cho doanh nghiệp — 2025–2026 — Phát triển phần mềm — Doanh nghiệp
6. Số hoá di tích cho xã phường — 2025–2026 — Full-Stack Developer — Nhà nước

### 6. Contact (footer)
- Large Instrument Serif italic closing statement (e.g. "Let's build something / Cùng nhau
  xây dựng điều gì đó").
- Public contact: **tt98tuyen@gmail.com** only (per user decision — the ICS work email is not
  published).
- No phone number or street address published (privacy — only city-level location, "Hà Nội",
  is shown, matching the About section).
- Contact action is a `mailto:` link styled as a liquid-glass pill button — no form submission,
  no backend.

## 5. Tech architecture

- **Stack:** Vite + React 18 + TypeScript + Tailwind CSS 3 + `framer-motion` + `lucide-react`.
  GSAP is used only inside the Hero component for mouse-parallax on the particle/aurora layer.
- **No backend / no i18n library:** language switching is handled by a small React Context
  (`LangProvider`) toggling between two content objects; no `i18next` or routing needed since
  this is a single static page.
- **File structure:**
  ```
  src/
    components/
      Navbar.tsx
      HeroSection.tsx
      AboutSection.tsx
      ExperienceSection.tsx
      SkillsSection.tsx
      ProjectsSection.tsx
      ContactSection.tsx
      ui/
        LiquidGlassCard.tsx
        PillButton.tsx
        LangToggle.tsx
        WordsPullUp.tsx
    context/
      LangContext.tsx
    data/
      content.ts        // VI + EN copy for every section, kept out of components
    index.css            // font imports, .liquid-glass(-strong), noise utilities
    App.tsx
  ```
- **Shared animation components:**
  - `WordsPullUp` — splits a heading into words, each a `motion.span` sliding up
    (`y:20 → 0`), staggered ~0.08s, triggered once via `useInView`. Reused for every large
    heading (Hero, About, Contact).
  - Card lists (Experience/Skills/Projects) use fade + slide-in staggered ~0.15s on
    `useInView`, matching the Prisma Features/Asme Services stagger pattern.
- **Responsive:** mobile-first Tailwind breakpoints; nav collapses to a hamburger on mobile;
  hero heading uses `clamp()`/`vw` sizing to scale from mobile to desktop without overflow.

## 6. Out of scope

- No backend, database, CMS, or working contact-form submission (mailto only).
- No blog, no multi-page routing.
- No real portrait photo, GitHub/LinkedIn links, or ICS work email in the public build until
  the user explicitly supplies them — placeholders must be visually clear and easy to swap
  (single point of edit in `data/content.ts` / a designated image path).
- No reuse of the reference designs' actual CloudFront video assets.
