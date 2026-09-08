# Personal CV/Portfolio Website Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a single-page, front-end-only personal CV/portfolio site for Nguyễn Ngọc Tuyền with a liquid-glass, cinematic dark aesthetic, bilingual (VI/EN) content, and animated sections, per `docs/superpowers/specs/2026-09-08-personal-cv-website-design.md`.

**Architecture:** Vite + React 18 + TypeScript SPA, Tailwind CSS for styling, `framer-motion` for scroll/stagger animations, GSAP scoped only to the Hero's mouse-parallax layer, `lucide-react` for icons. Content lives in a single typed `data/content.ts` object keyed by language; a React Context (`LangContext`) switches between VI/EN without any routing or i18n library. No backend — the contact "form" is a `mailto:` link.

**Tech Stack:** Vite, React 18, TypeScript, Tailwind CSS 3, framer-motion, GSAP, lucide-react, Vitest + @testing-library/react (for the testable logic units: content-data shape, language toggle, word-splitting, and component smoke renders).

---

## File Structure

```
my-websites/
  index.html
  package.json
  tsconfig.json
  vite.config.ts
  tailwind.config.js
  postcss.config.js
  src/
    main.tsx
    App.tsx
    index.css
    setupTests.ts
    assets/
      avatar-placeholder.svg      # swapped for the user's real photo later
    context/
      LangContext.tsx
      LangContext.test.tsx
    data/
      content.ts
      content.test.ts
    components/
      Navbar.tsx
      Navbar.test.tsx
      HeroSection.tsx
      HeroSection.test.tsx
      AboutSection.tsx
      AboutSection.test.tsx
      ExperienceSection.tsx
      ExperienceSection.test.tsx
      SkillsSection.tsx
      SkillsSection.test.tsx
      ProjectsSection.tsx
      ProjectsSection.test.tsx
      ContactSection.tsx
      ContactSection.test.tsx
      ui/
        PillButton.tsx
        LiquidGlassCard.tsx
        LangToggle.tsx
        WordsPullUp.tsx
        WordsPullUp.test.tsx
```

Canvas/GSAP-driven visuals (the Hero's particle/aurora animation, mouse parallax) are not unit-testable in jsdom — those are verified manually in the browser in Task 15. Everything else that has real logic (content shape, language switching, word splitting, section rendering with the right data) gets an automated test.

---

### Task 1: Scaffold the Vite project and initialize git

**Files:**
- Create: `package.json`, `index.html`, `tsconfig.json`, `tsconfig.node.json`, `vite.config.ts`, `src/main.tsx`, `src/App.tsx`, `src/index.css`, `.gitignore`

- [ ] **Step 1: Scaffold with Vite's React+TS template**

Run:
```bash
cd "D:/Code/nntuyen/my-websites"
npm create vite@latest . -- --template react-ts
```
Expected: Vite prompts about the directory not being empty (it now contains `docs/`) — confirm to continue. Files `package.json`, `index.html`, `src/main.tsx`, `src/App.tsx`, `tsconfig.json`, `vite.config.ts` are created.

- [ ] **Step 2: Install dependencies**

Run:
```bash
npm install
npm install framer-motion gsap lucide-react
npm install -D tailwindcss postcss autoprefixer vitest jsdom @testing-library/react @testing-library/jest-dom @vitejs/plugin-react
```
Expected: `node_modules/` populated, no errors.

- [ ] **Step 3: Verify the scaffold runs**

Run:
```bash
npm run dev -- --port 5173 &
sleep 2
curl -s http://localhost:5173 | grep -o "<title>.*</title>"
kill %1
```
Expected: output contains `<title>Vite + React + TS</title>` (the default template title, confirming the dev server boots).

- [ ] **Step 4: Initialize git and commit the scaffold**

Run:
```bash
git init
git add -A
git commit -m "chore: scaffold Vite + React + TS project"
```
Expected: a new commit with the scaffold files and the earlier `docs/superpowers/specs/...` file.

---

### Task 2: Configure Tailwind, global fonts, and the liquid-glass CSS

**Files:**
- Create: `tailwind.config.js`, `postcss.config.js`
- Modify: `src/index.css`

- [ ] **Step 1: Init Tailwind config files**

Run:
```bash
npx tailwindcss init -p
```
Expected: `tailwind.config.js` and `postcss.config.js` created.

- [ ] **Step 2: Write `tailwind.config.js`**

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#DEDBC8',
      },
      fontFamily: {
        serif: ['"Instrument Serif"', 'serif'],
        body: ['Barlow', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
```

- [ ] **Step 3: Write `src/index.css`**

```css
@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Barlow:wght@300;400;500;600&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  background: #000000;
  font-family: 'Barlow', sans-serif;
}

@layer components {
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
    background: linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.45) 0%,
      rgba(255, 255, 255, 0.15) 20%,
      rgba(255, 255, 255, 0) 40%,
      rgba(255, 255, 255, 0) 60%,
      rgba(255, 255, 255, 0.15) 80%,
      rgba(255, 255, 255, 0.45) 100%
    );
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
    box-shadow: 4px 4px 4px rgba(0, 0, 0, 0.05), inset 0 1px 1px rgba(255, 255, 255, 0.15);
    position: relative;
    overflow: hidden;
  }
  .liquid-glass-strong::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    padding: 1.4px;
    background: linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.5) 0%,
      rgba(255, 255, 255, 0.2) 20%,
      rgba(255, 255, 255, 0) 40%,
      rgba(255, 255, 255, 0) 60%,
      rgba(255, 255, 255, 0.2) 80%,
      rgba(255, 255, 255, 0.5) 100%
    );
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
  }
}
```

- [ ] **Step 4: Smoke-check the CSS built correctly**

Run:
```bash
grep -c "liquid-glass" src/index.css
```
Expected: `4` (two class definitions + two `::before` rules).

- [ ] **Step 5: Commit**

```bash
git add tailwind.config.js postcss.config.js src/index.css
git commit -m "feat: add Tailwind config and liquid-glass global styles"
```

---

### Task 3: Set up Vitest + Testing Library

**Files:**
- Modify: `vite.config.ts`, `package.json`
- Create: `src/setupTests.ts`

- [ ] **Step 1: Write `src/setupTests.ts`**

```ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 2: Update `vite.config.ts`**

```ts
/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    globals: true,
  },
});
```

- [ ] **Step 3: Add a `test` script to `package.json`**

In the `"scripts"` block of `package.json`, add:
```json
"test": "vitest run"
```

- [ ] **Step 4: Verify the test runner boots with no test files**

Run:
```bash
npm run test
```
Expected: Vitest reports `No test files found` (exit code may be non-zero — that's expected since there are no tests yet; this step just confirms the runner itself starts without config errors).

- [ ] **Step 5: Commit**

```bash
git add vite.config.ts package.json src/setupTests.ts
git commit -m "chore: configure Vitest and Testing Library"
```

---

### Task 4: Content data model (`data/content.ts`)

**Files:**
- Create: `src/data/content.ts`
- Test: `src/data/content.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/data/content.test.ts
import { describe, expect, it } from 'vitest';
import { content } from './content';

describe('content', () => {
  it('has matching structural shape for vi and en', () => {
    expect(content.vi.experience.items.length).toBe(content.en.experience.items.length);
    expect(content.vi.skills.groups.length).toBe(content.en.skills.groups.length);
    expect(content.vi.projects.items.length).toBe(content.en.projects.items.length);
    expect(content.vi.nav.links.length).toBe(content.en.nav.links.length);
  });

  it('has exactly 6 projects matching the CV', () => {
    expect(content.vi.projects.items).toHaveLength(6);
  });

  it('has exactly 3 experience entries matching the CV', () => {
    expect(content.vi.experience.items).toHaveLength(3);
  });

  it('has the hero accent word contained inside the hero headline for both languages', () => {
    expect(content.vi.hero.headline).toContain(content.vi.hero.accent);
    expect(content.en.hero.headline).toContain(content.en.hero.accent);
  });

  it('publishes only the personal gmail address, not the ICS work email', () => {
    expect(content.vi.contact.email).toBe('tt98tuyen@gmail.com');
    expect(content.en.contact.email).toBe('tt98tuyen@gmail.com');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/data/content.test.ts`
Expected: FAIL — `Cannot find module './content'`.

- [ ] **Step 3: Write `src/data/content.ts`**

```ts
export type Lang = 'vi' | 'en';

export interface ExperienceItem {
  period: string;
  role: string;
  org: string;
  focus: string;
}

export interface ProjectItem {
  title: string;
  years: string;
  role: string;
  scope: string;
}

export interface SkillGroup {
  icon: 'code' | 'clipboard-list' | 'shield' | 'languages';
  title: string;
  description: string;
}

export interface Content {
  nav: {
    links: { label: string; href: string }[];
    contactCta: string;
  };
  hero: {
    headline: string;
    accent: string;
    subheading: string;
    ctaProjects: string;
    ctaContact: string;
  };
  about: {
    label: string;
    heading: string;
    paragraphPlain: string;
    paragraphItalic: string;
    paragraphPlainEnd: string;
    educationLabel: string;
    educationSchool: string;
    educationDegree: string;
    educationDates: string;
  };
  experience: {
    heading: string;
    items: ExperienceItem[];
  };
  skills: {
    heading: string;
    groups: SkillGroup[];
  };
  projects: {
    heading: string;
    items: ProjectItem[];
  };
  contact: {
    heading: string;
    email: string;
    location: string;
    ctaLabel: string;
  };
}

export const content: Record<Lang, Content> = {
  vi: {
    nav: {
      links: [
        { label: 'Về tôi', href: '#about' },
        { label: 'Kinh nghiệm', href: '#experience' },
        { label: 'Kỹ năng', href: '#skills' },
        { label: 'Dự án', href: '#projects' },
        { label: 'Liên hệ', href: '#contact' },
      ],
      contactCta: 'Liên hệ',
    },
    hero: {
      headline: 'Tôi là Nguyễn Ngọc Tuyền — kỹ sư viết code, giữ hệ thống an toàn.',
      accent: 'an toàn',
      subheading:
        'Nhân viên kỹ thuật tại Công ty Cổ phần An ninh mạng Quốc tế ICS · Hà Nội',
      ctaProjects: 'Xem dự án',
      ctaContact: 'Liên hệ',
    },
    about: {
      label: 'Về tôi',
      heading: 'Từ dòng code đầu tiên đến an ninh hệ thống.',
      paragraphPlain:
        'Tôi tốt nghiệp Kỹ sư Công nghệ thông tin tại Trường Đại học Công Nghệ Đông Á (2021–2025) và đã đi qua ba môi trường làm việc khác nhau — từ doanh nghiệp xuất nhập khẩu, nền tảng giáo dục, đến',
      paragraphItalic: 'một công ty an ninh mạng quốc tế',
      paragraphPlainEnd: ', nơi tôi vừa phát triển phần mềm vừa học cách bảo vệ nó.',
      educationLabel: 'Học vấn',
      educationSchool: 'Trường Đại học Công Nghệ Đông Á',
      educationDegree: 'Kỹ sư Công nghệ thông tin (hệ chính quy)',
      educationDates: '09/2021 – 06/2025',
    },
    experience: {
      heading: 'Hành trình làm việc',
      items: [
        {
          period: '03/2023 – 06/2024',
          role: 'Nhân viên',
          org: 'Công ty TNHH SX&XNK Khang Minh',
          focus: 'Công nghệ thông tin & xúc tiến thương mại',
        },
        {
          period: '09/2024 – 02/2025',
          role: 'Nhân viên kỹ thuật',
          org: 'Học Mãi JSC',
          focus: 'Phát triển phần mềm',
        },
        {
          period: '09/2025 – nay',
          role: 'Nhân viên kỹ thuật',
          org: 'Công ty CP An ninh mạng Quốc tế ICS',
          focus: 'Phát triển phần mềm',
        },
      ],
    },
    skills: {
      heading: 'Kỹ năng & Công nghệ',
      groups: [
        {
          icon: 'code',
          title: 'Phát triển Full-Stack',
          description: 'Xây dựng và triển khai các hệ thống web hoàn chỉnh, từ giao diện đến back-end.',
        },
        {
          icon: 'clipboard-list',
          title: 'Quản lý dự án',
          description: 'Điều phối tiến độ và đội nhóm cho các dự án doanh nghiệp quy mô vừa.',
        },
        {
          icon: 'shield',
          title: 'An ninh mạng',
          description: 'Tư duy bảo mật được rèn luyện trong môi trường an ninh mạng quốc tế.',
        },
        {
          icon: 'languages',
          title: 'Tiếng Anh',
          description: 'Trình độ khá, đủ để đọc tài liệu kỹ thuật và trao đổi công việc.',
        },
      ],
    },
    projects: {
      heading: 'Dự án tiêu biểu',
      items: [
        { title: 'Hệ thống quản trị khách sạn ERP', years: '2024–2025', role: 'Full-Stack Developer', scope: 'Trường học' },
        { title: 'Hệ thống quản lý Lớp học và giáo viên', years: '2025', role: 'Full-Stack Developer', scope: 'Doanh nghiệp' },
        { title: 'Hệ thống HRM quản lý nhân sự cho doanh nghiệp', years: '2025–2026', role: 'Quản lý dự án', scope: 'Doanh nghiệp' },
        { title: 'Nền tảng đào tạo và giáo dục e-learning', years: '2025–2026', role: 'Quản lý dự án', scope: 'Doanh nghiệp' },
        { title: 'Hệ thống CRM cho doanh nghiệp', years: '2025–2026', role: 'Phát triển phần mềm', scope: 'Doanh nghiệp' },
        { title: 'Số hoá di tích cho xã phường', years: '2025–2026', role: 'Full-Stack Developer', scope: 'Nhà nước' },
      ],
    },
    contact: {
      heading: 'Cùng nhau xây dựng điều gì đó.',
      email: 'tt98tuyen@gmail.com',
      location: 'Hà Nội, Việt Nam',
      ctaLabel: 'Gửi email cho tôi',
    },
  },
  en: {
    nav: {
      links: [
        { label: 'About', href: '#about' },
        { label: 'Experience', href: '#experience' },
        { label: 'Skills', href: '#skills' },
        { label: 'Projects', href: '#projects' },
        { label: 'Contact', href: '#contact' },
      ],
      contactCta: 'Contact',
    },
    hero: {
      headline: "I'm Nguyễn Ngọc Tuyền — an engineer who writes code and keeps systems safe.",
      accent: 'safe',
      subheading: 'Software Engineer at ICS International Cybersecurity JSC · Hanoi',
      ctaProjects: 'View projects',
      ctaContact: 'Contact',
    },
    about: {
      label: 'About',
      heading: 'From the first line of code to system security.',
      paragraphPlain:
        'I graduated as an IT Engineer from Đông Á University of Technology (2021–2025) and have worked across three very different environments — from an import-export business, to an e-learning platform, to',
      paragraphItalic: 'an international cybersecurity company',
      paragraphPlainEnd: ', where I build software and learn to defend it at the same time.',
      educationLabel: 'Education',
      educationSchool: 'Đông Á University of Technology',
      educationDegree: 'B.Eng. in Information Technology (full-time)',
      educationDates: '09/2021 – 06/2025',
    },
    experience: {
      heading: 'Work experience',
      items: [
        {
          period: '03/2023 – 06/2024',
          role: 'Staff',
          org: 'Khang Minh Import-Export Manufacturing Co., Ltd',
          focus: 'IT & trade promotion',
        },
        {
          period: '09/2024 – 02/2025',
          role: 'Technical Staff',
          org: 'Học Mãi Education JSC',
          focus: 'Software development',
        },
        {
          period: '09/2025 – present',
          role: 'Technical Staff',
          org: 'ICS International Cybersecurity JSC',
          focus: 'Software development',
        },
      ],
    },
    skills: {
      heading: 'Skills & Technology',
      groups: [
        {
          icon: 'code',
          title: 'Full-Stack Development',
          description: 'Building and shipping complete web systems, from UI to back-end.',
        },
        {
          icon: 'clipboard-list',
          title: 'Project Management',
          description: 'Coordinating timelines and teams for mid-sized enterprise projects.',
        },
        {
          icon: 'shield',
          title: 'Cybersecurity',
          description: 'A security mindset shaped by working at an international cybersecurity company.',
        },
        {
          icon: 'languages',
          title: 'English',
          description: 'Working proficiency — enough to read technical docs and communicate on the job.',
        },
      ],
    },
    projects: {
      heading: 'Featured projects',
      items: [
        { title: 'Hotel Management ERP System', years: '2024–2025', role: 'Full-Stack Developer', scope: 'School' },
        { title: 'Classroom & Teacher Management System', years: '2025', role: 'Full-Stack Developer', scope: 'Enterprise' },
        { title: 'HRM System for Enterprise', years: '2025–2026', role: 'Project Manager', scope: 'Enterprise' },
        { title: 'E-learning Education Platform', years: '2025–2026', role: 'Project Manager', scope: 'Enterprise' },
        { title: 'Enterprise CRM System', years: '2025–2026', role: 'Software Developer', scope: 'Enterprise' },
        { title: 'Heritage Site Digitization System', years: '2025–2026', role: 'Full-Stack Developer', scope: 'Government' },
      ],
    },
    contact: {
      heading: "Let's build something together.",
      email: 'tt98tuyen@gmail.com',
      location: 'Hanoi, Vietnam',
      ctaLabel: 'Email me',
    },
  },
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/data/content.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/data/content.ts src/data/content.test.ts
git commit -m "feat: add bilingual content data model"
```

---

### Task 5: Language context (`LangContext`)

**Files:**
- Create: `src/context/LangContext.tsx`
- Test: `src/context/LangContext.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// src/context/LangContext.test.tsx
import { describe, expect, it } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LangProvider, useLang } from './LangContext';

function Probe() {
  const { lang, toggleLang, t } = useLang();
  return (
    <div>
      <span data-testid="lang">{lang}</span>
      <span data-testid="headline">{t.hero.headline}</span>
      <button onClick={toggleLang}>toggle</button>
    </div>
  );
}

describe('LangContext', () => {
  it('defaults to vi and toggles to en on demand', () => {
    render(
      <LangProvider>
        <Probe />
      </LangProvider>
    );

    expect(screen.getByTestId('lang').textContent).toBe('vi');
    expect(screen.getByTestId('headline').textContent).toContain('Nguyễn Ngọc Tuyền');

    fireEvent.click(screen.getByText('toggle'));

    expect(screen.getByTestId('lang').textContent).toBe('en');
    expect(screen.getByTestId('headline').textContent).toContain('Nguyễn Ngọc Tuyền');
  });

  it('throws when useLang is called outside a LangProvider', () => {
    function Bare() {
      useLang();
      return null;
    }
    expect(() => render(<Bare />)).toThrow('useLang must be used within a LangProvider');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/context/LangContext.test.tsx`
Expected: FAIL — `Cannot find module './LangContext'`.

- [ ] **Step 3: Write `src/context/LangContext.tsx`**

```tsx
import { createContext, useContext, useState, type ReactNode } from 'react';
import { content, type Content, type Lang } from '../data/content';

interface LangContextValue {
  lang: Lang;
  toggleLang: () => void;
  t: Content;
}

const LangContext = createContext<LangContextValue | undefined>(undefined);

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('vi');
  const toggleLang = () => setLang((prev) => (prev === 'vi' ? 'en' : 'vi'));

  return (
    <LangContext.Provider value={{ lang, toggleLang, t: content[lang] }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang(): LangContextValue {
  const ctx = useContext(LangContext);
  if (!ctx) {
    throw new Error('useLang must be used within a LangProvider');
  }
  return ctx;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/context/LangContext.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/context/LangContext.tsx src/context/LangContext.test.tsx
git commit -m "feat: add LangContext for VI/EN toggling"
```

---

### Task 6: `WordsPullUp` animated heading component

**Files:**
- Create: `src/components/ui/WordsPullUp.tsx`
- Test: `src/components/ui/WordsPullUp.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// src/components/ui/WordsPullUp.test.tsx
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { splitWords, WordsPullUp } from './WordsPullUp';

describe('splitWords', () => {
  it('splits on single spaces and drops empty tokens from repeated spaces', () => {
    expect(splitWords('Cùng nhau  xây dựng')).toEqual(['Cùng', 'nhau', 'xây', 'dựng']);
  });

  it('returns an empty array for an empty string', () => {
    expect(splitWords('')).toEqual([]);
  });
});

describe('WordsPullUp', () => {
  it('renders every word of the text', () => {
    render(<WordsPullUp text="Từ dòng code đầu tiên" />);
    expect(screen.getByText('Từ')).toBeInTheDocument();
    expect(screen.getByText('dòng')).toBeInTheDocument();
    expect(screen.getByText('tiên')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/ui/WordsPullUp.test.tsx`
Expected: FAIL — `Cannot find module './WordsPullUp'`.

- [ ] **Step 3: Write `src/components/ui/WordsPullUp.tsx`**

```tsx
import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

interface WordsPullUpProps {
  text: string;
  className?: string;
  wordClassName?: string;
  staggerDelay?: number;
}

export function splitWords(text: string): string[] {
  return text.split(' ').filter((word) => word.length > 0);
}

export function WordsPullUp({
  text,
  className = '',
  wordClassName = '',
  staggerDelay = 0.08,
}: WordsPullUpProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const words = splitWords(text);

  return (
    <span ref={ref} className={`inline-flex flex-wrap ${className}`}>
      {words.map((word, i) => (
        <span key={`${word}-${i}`} className="overflow-hidden inline-block mr-[0.25em] pb-1">
          <motion.span
            className={`inline-block ${wordClassName}`}
            initial={{ y: '100%', opacity: 0 }}
            animate={isInView ? { y: 0, opacity: 1 } : {}}
            transition={{ duration: 0.5, delay: i * staggerDelay, ease: [0.16, 1, 0.3, 1] }}
          >
            {word}
          </motion.span>
        </span>
      ))}
    </span>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/ui/WordsPullUp.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/WordsPullUp.tsx src/components/ui/WordsPullUp.test.tsx
git commit -m "feat: add WordsPullUp staggered heading animation"
```

---

### Task 7: `PillButton`, `LiquidGlassCard`, `LangToggle` primitives

**Files:**
- Create: `src/components/ui/PillButton.tsx`, `src/components/ui/LiquidGlassCard.tsx`, `src/components/ui/LangToggle.tsx`
- Test: `src/components/ui/PillButton.test.tsx`

- [ ] **Step 1: Write the failing test (for `PillButton`, the one primitive with branching logic)**

```tsx
// src/components/ui/PillButton.test.tsx
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PillButton } from './PillButton';

describe('PillButton', () => {
  it('renders as an anchor when href is provided', () => {
    render(<PillButton href="#contact">Liên hệ</PillButton>);
    const el = screen.getByText('Liên hệ');
    expect(el.tagName).toBe('A');
    expect(el).toHaveAttribute('href', '#contact');
  });

  it('renders as a button and fires onClick when no href is provided', () => {
    const onClick = vi.fn();
    render(<PillButton onClick={onClick}>Toggle</PillButton>);
    const el = screen.getByText('Toggle');
    expect(el.tagName).toBe('BUTTON');
    fireEvent.click(el);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('applies the solid variant background class', () => {
    render(
      <PillButton href="#contact" variant="solid">
        Liên hệ
      </PillButton>
    );
    expect(screen.getByText('Liên hệ').className).toContain('bg-[#DEDBC8]');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/ui/PillButton.test.tsx`
Expected: FAIL — `Cannot find module './PillButton'`.

- [ ] **Step 3: Write `src/components/ui/PillButton.tsx`**

```tsx
import type { ReactNode } from 'react';

interface PillButtonProps {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: 'solid' | 'glass';
  className?: string;
}

export function PillButton({
  children,
  href,
  onClick,
  variant = 'glass',
  className = '',
}: PillButtonProps) {
  const base =
    'rounded-full px-6 py-3 text-sm font-medium transition-all duration-200 hover:scale-[1.03] active:scale-[0.97]';
  const variantClass = variant === 'solid' ? 'bg-[#DEDBC8] text-black' : 'liquid-glass text-white';
  const classes = `${base} ${variantClass} ${className}`;

  if (href) {
    return (
      <a href={href} onClick={onClick} className={classes}>
        {children}
      </a>
    );
  }

  return (
    <button type="button" onClick={onClick} className={classes}>
      {children}
    </button>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/ui/PillButton.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Write `src/components/ui/LiquidGlassCard.tsx` (no branching logic — no dedicated test, covered indirectly by section tests in later tasks)**

```tsx
import type { ReactNode } from 'react';

interface LiquidGlassCardProps {
  children: ReactNode;
  className?: string;
  strong?: boolean;
}

export function LiquidGlassCard({ children, className = '', strong = false }: LiquidGlassCardProps) {
  const base = strong ? 'liquid-glass-strong' : 'liquid-glass';
  return <div className={`${base} rounded-3xl ${className}`}>{children}</div>;
}
```

- [ ] **Step 6: Write `src/components/ui/LangToggle.tsx`**

```tsx
import { useLang } from '../../context/LangContext';

export function LangToggle() {
  const { lang, toggleLang } = useLang();
  return (
    <button
      type="button"
      onClick={toggleLang}
      className="liquid-glass rounded-full px-3 py-1.5 text-xs font-medium text-white/80 hover:text-white transition-colors"
      aria-label="Toggle language"
    >
      {lang === 'vi' ? 'VI / EN' : 'EN / VI'}
    </button>
  );
}
```

- [ ] **Step 7: Commit**

```bash
git add src/components/ui/PillButton.tsx src/components/ui/PillButton.test.tsx src/components/ui/LiquidGlassCard.tsx src/components/ui/LangToggle.tsx
git commit -m "feat: add PillButton, LiquidGlassCard, LangToggle primitives"
```

---

### Task 8: Placeholder avatar asset

**Files:**
- Create: `src/assets/avatar-placeholder.svg`

- [ ] **Step 1: Create the placeholder SVG**

This stands in for the user's real photo until they provide a file path; the About section (Task 11) points at this same import so swapping to the real photo later is a one-line change.

```svg
<svg width="400" height="400" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#101010" />
      <stop offset="100%" stop-color="#2a2a2a" />
    </linearGradient>
  </defs>
  <rect width="400" height="400" fill="url(#bg)" />
  <text x="200" y="220" font-family="Barlow, sans-serif" font-size="96" font-weight="600"
        fill="#DEDBC8" text-anchor="middle">NNT</text>
</svg>
```

Save this content to `src/assets/avatar-placeholder.svg`.

- [ ] **Step 2: Verify the file exists and is well-formed**

Run:
```bash
node -e "require('fs').readFileSync('src/assets/avatar-placeholder.svg','utf8').includes('</svg>') || process.exit(1)"
```
Expected: exits with code 0 (no output).

- [ ] **Step 3: Commit**

```bash
git add src/assets/avatar-placeholder.svg
git commit -m "feat: add placeholder avatar asset"
```

---

### Task 9: `Navbar`

**Files:**
- Create: `src/components/Navbar.tsx`
- Test: `src/components/Navbar.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// src/components/Navbar.test.tsx
import { describe, expect, it } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LangProvider } from '../context/LangContext';
import { Navbar } from './Navbar';

describe('Navbar', () => {
  it('renders all VI nav links and the contact CTA by default', () => {
    render(
      <LangProvider>
        <Navbar />
      </LangProvider>
    );
    expect(screen.getAllByText('Về tôi').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Dự án').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Liên hệ').length).toBeGreaterThan(0);
  });

  it('opens the mobile menu on hamburger click', () => {
    render(
      <LangProvider>
        <Navbar />
      </LangProvider>
    );
    fireEvent.click(screen.getByLabelText('Toggle menu'));
    expect(screen.getAllByText('Kinh nghiệm').length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/Navbar.test.tsx`
Expected: FAIL — `Cannot find module './Navbar'`.

- [ ] **Step 3: Write `src/components/Navbar.tsx`**

```tsx
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { useLang } from '../context/LangContext';
import { LangToggle } from './ui/LangToggle';
import { PillButton } from './ui/PillButton';

export function Navbar() {
  const { t } = useLang();
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-5 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-3xl">
      <div className="liquid-glass rounded-full px-4 py-2.5 md:px-6 flex items-center justify-between">
        <span className="font-serif italic text-xl text-[#DEDBC8]">NNT</span>

        <div className="hidden md:flex items-center gap-6">
          {t.nav.links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-white/70 hover:text-white transition-colors"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <LangToggle />
          <PillButton href="#contact" variant="solid">
            {t.nav.contactCta}
          </PillButton>
        </div>

        <button
          type="button"
          className="md:hidden text-white"
          onClick={() => setOpen((prev) => !prev)}
          aria-label="Toggle menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="liquid-glass mt-2 rounded-2xl px-4 py-4 flex flex-col gap-3 md:hidden">
          {t.nav.links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-white/80"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <div className="flex items-center justify-between pt-2">
            <LangToggle />
            <PillButton href="#contact" variant="solid">
              {t.nav.contactCta}
            </PillButton>
          </div>
        </div>
      )}
    </nav>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/Navbar.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/Navbar.tsx src/components/Navbar.test.tsx
git commit -m "feat: add liquid-glass Navbar with VI/EN toggle"
```

---

### Task 10: `HeroSection`

**Files:**
- Create: `src/components/HeroSection.tsx`
- Test: `src/components/HeroSection.test.tsx`

The canvas particle animation and GSAP parallax are not exercised by jsdom tests — they're verified manually in Task 15. The test here covers `splitAccent`, the one piece of real logic, plus a content smoke-render.

- [ ] **Step 1: Write the failing test**

```tsx
// src/components/HeroSection.test.tsx
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LangProvider } from '../context/LangContext';
import { HeroSection, splitAccent } from './HeroSection';

describe('splitAccent', () => {
  it('splits the headline around the accent phrase', () => {
    expect(splitAccent('Build, then defend safely.', 'defend')).toEqual([
      'Build, then',
      'defend',
      'safely.',
    ]);
  });

  it('falls back to [headline, "", ""] when the accent is not found', () => {
    expect(splitAccent('Build, then defend.', 'missing')).toEqual(['Build, then defend.', '', '']);
  });
});

describe('HeroSection', () => {
  it('renders the VI subheading and CTA labels by default', () => {
    render(
      <LangProvider>
        <HeroSection />
      </LangProvider>
    );
    expect(screen.getByText(/Nhân viên kỹ thuật tại/)).toBeInTheDocument();
    expect(screen.getByText('Xem dự án')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/HeroSection.test.tsx`
Expected: FAIL — `Cannot find module './HeroSection'`.

- [ ] **Step 3: Write `src/components/HeroSection.tsx`**

```tsx
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { Mail, ArrowRight } from 'lucide-react';
import { useLang } from '../context/LangContext';
import { WordsPullUp } from './ui/WordsPullUp';
import { PillButton } from './ui/PillButton';

export function splitAccent(headline: string, accent: string): [string, string, string] {
  const idx = headline.indexOf(accent);
  if (idx === -1) return [headline, '', ''];
  return [headline.slice(0, idx).trim(), accent, headline.slice(idx + accent.length).trim()];
}

function useParticleAurora(canvasRef: React.RefObject<HTMLCanvasElement>) {
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.5 + 0.5,
      vx: (Math.random() - 0.5) * 0.15,
      vy: (Math.random() - 0.5) * 0.15,
    }));

    let raf = 0;
    function render() {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);

      const gradient = ctx.createRadialGradient(
        width * 0.3,
        height * 0.3,
        0,
        width * 0.5,
        height * 0.5,
        width * 0.8
      );
      gradient.addColorStop(0, 'rgba(222, 219, 200, 0.08)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(222, 219, 200, 0.5)';
        ctx.fill();
      });

      raf = requestAnimationFrame(render);
    }
    render();

    function handleResize() {
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    }
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', handleResize);
    };
  }, [canvasRef]);
}

export function HeroSection() {
  const { t } = useLang();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);

  useParticleAurora(canvasRef);

  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;

    function handleMouseMove(e: MouseEvent) {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const x = ((e.clientX - cx) / cx) * 16;
      const y = ((e.clientY - cy) / cy) * 16;
      gsap.to(layer, { x, y, duration: 0.6, ease: 'power2.out' });
    }

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const [before, accent, after] = splitAccent(t.hero.headline, t.hero.accent);

  return (
    <section id="hero" className="relative min-h-screen flex flex-col overflow-hidden bg-black">
      <div ref={layerRef} className="absolute inset-0 scale-110">
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-20 text-center gap-8">
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif leading-tight max-w-4xl text-[#E1E0CC]">
          <WordsPullUp text={before} />
          {accent && <WordsPullUp text={accent} wordClassName="italic" />}
          {after && <WordsPullUp text={after} />}
        </h1>

        <p className="text-white/60 text-sm md:text-base max-w-lg">{t.hero.subheading}</p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <PillButton href="#projects" variant="solid">
            {t.hero.ctaProjects}
          </PillButton>
          <PillButton href="#contact" variant="glass" className="inline-flex items-center gap-2">
            {t.hero.ctaContact}
            <ArrowRight size={16} />
          </PillButton>
        </div>
      </div>

      <div className="relative z-10 flex justify-center pb-10">
        <a
          href={`mailto:${t.contact.email}`}
          className="liquid-glass rounded-full p-4 text-white/80 hover:text-white transition-colors"
          aria-label="Email"
        >
          <Mail size={20} />
        </a>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/HeroSection.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/HeroSection.tsx src/components/HeroSection.test.tsx
git commit -m "feat: add Hero section with aurora particles and GSAP parallax"
```

---

### Task 11: `AboutSection`

**Files:**
- Create: `src/components/AboutSection.tsx`
- Test: `src/components/AboutSection.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// src/components/AboutSection.test.tsx
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LangProvider } from '../context/LangContext';
import { AboutSection } from './AboutSection';

describe('AboutSection', () => {
  it('renders the avatar image and education details', () => {
    render(
      <LangProvider>
        <AboutSection />
      </LangProvider>
    );
    expect(screen.getByAltText('Nguyễn Ngọc Tuyền')).toBeInTheDocument();
    expect(screen.getByText('Trường Đại học Công Nghệ Đông Á')).toBeInTheDocument();
    expect(screen.getByText(/09\/2021 – 06\/2025/)).toBeInTheDocument();
  });

  it('renders the italic clause inside the intro paragraph', () => {
    render(
      <LangProvider>
        <AboutSection />
      </LangProvider>
    );
    expect(screen.getByText('một công ty an ninh mạng quốc tế')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/AboutSection.test.tsx`
Expected: FAIL — `Cannot find module './AboutSection'`.

- [ ] **Step 3: Write `src/components/AboutSection.tsx`**

```tsx
import { useLang } from '../context/LangContext';
import { WordsPullUp } from './ui/WordsPullUp';
import avatarUrl from '../assets/avatar-placeholder.svg';

export function AboutSection() {
  const { t } = useLang();

  return (
    <section id="about" className="bg-black py-24 md:py-32 px-6">
      <div className="max-w-5xl mx-auto bg-[#101010] rounded-3xl p-8 md:p-14 flex flex-col md:flex-row gap-10 md:gap-16 items-center">
        <div className="liquid-glass rounded-3xl overflow-hidden w-40 h-40 md:w-56 md:h-56 flex-shrink-0">
          <img src={avatarUrl} alt="Nguyễn Ngọc Tuyền" className="w-full h-full object-cover" />
        </div>

        <div className="flex-1 text-left">
          <p className="text-white/40 text-xs tracking-widest uppercase mb-4">{t.about.label}</p>
          <h2 className="text-3xl md:text-5xl font-serif text-[#E1E0CC] mb-6 leading-tight">
            <WordsPullUp text={t.about.heading} />
          </h2>
          <p className="text-white/70 text-sm md:text-base leading-relaxed mb-8">
            {t.about.paragraphPlain}{' '}
            <em className="font-serif italic text-[#DEDBC8]">{t.about.paragraphItalic}</em>
            {t.about.paragraphPlainEnd}
          </p>

          <div className="border-t border-white/10 pt-6">
            <p className="text-white/40 text-xs tracking-widest uppercase mb-2">
              {t.about.educationLabel}
            </p>
            <p className="text-[#E1E0CC] text-sm md:text-base font-medium">
              {t.about.educationSchool}
            </p>
            <p className="text-white/60 text-sm">
              {t.about.educationDegree} · {t.about.educationDates}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/AboutSection.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/AboutSection.tsx src/components/AboutSection.test.tsx
git commit -m "feat: add About section with merged education block"
```

---

### Task 12: `ExperienceSection`

**Files:**
- Create: `src/components/ExperienceSection.tsx`
- Test: `src/components/ExperienceSection.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// src/components/ExperienceSection.test.tsx
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LangProvider } from '../context/LangContext';
import { ExperienceSection } from './ExperienceSection';

describe('ExperienceSection', () => {
  it('renders all three experience entries in order', () => {
    render(
      <LangProvider>
        <ExperienceSection />
      </LangProvider>
    );
    const orgs = screen.getAllByText(/Khang Minh|Học Mãi|An ninh mạng Quốc tế ICS/);
    expect(orgs).toHaveLength(3);
    expect(screen.getByText(/Khang Minh/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/ExperienceSection.test.tsx`
Expected: FAIL — `Cannot find module './ExperienceSection'`.

- [ ] **Step 3: Write `src/components/ExperienceSection.tsx`**

```tsx
import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { useLang } from '../context/LangContext';
import { WordsPullUp } from './ui/WordsPullUp';

export function ExperienceSection() {
  const { t } = useLang();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section id="experience" className="bg-black py-24 md:py-32 px-6">
      <div className="max-w-3xl mx-auto" ref={ref}>
        <h2 className="text-3xl md:text-5xl font-serif text-[#E1E0CC] mb-16 text-center">
          <WordsPullUp text={t.experience.heading} />
        </h2>

        <div className="relative pl-8 md:pl-10">
          <div className="absolute left-[7px] md:left-[9px] top-2 bottom-2 w-px bg-white/10" />

          {t.experience.items.map((item, i) => (
            <motion.div
              key={item.org}
              className="relative pb-12 last:pb-0"
              initial={{ opacity: 0, x: -20 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6, delay: i * 0.15, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="absolute -left-8 md:-left-10 top-1 liquid-glass rounded-full w-4 h-4 md:w-[18px] md:h-[18px]" />
              <p className="text-white/40 text-xs tracking-widest uppercase mb-2">{item.period}</p>
              <h3 className="text-[#E1E0CC] text-lg md:text-xl font-medium">
                {item.role} · {item.org}
              </h3>
              <p className="text-white/60 text-sm mt-1">{item.focus}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/ExperienceSection.test.tsx`
Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
git add src/components/ExperienceSection.tsx src/components/ExperienceSection.test.tsx
git commit -m "feat: add Experience timeline section"
```

---

### Task 13: `SkillsSection`

**Files:**
- Create: `src/components/SkillsSection.tsx`
- Test: `src/components/SkillsSection.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// src/components/SkillsSection.test.tsx
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LangProvider } from '../context/LangContext';
import { SkillsSection } from './SkillsSection';

describe('SkillsSection', () => {
  it('renders all four skill groups', () => {
    render(
      <LangProvider>
        <SkillsSection />
      </LangProvider>
    );
    expect(screen.getByText('Phát triển Full-Stack')).toBeInTheDocument();
    expect(screen.getByText('Quản lý dự án')).toBeInTheDocument();
    expect(screen.getByText('An ninh mạng')).toBeInTheDocument();
    expect(screen.getByText('Tiếng Anh')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/SkillsSection.test.tsx`
Expected: FAIL — `Cannot find module './SkillsSection'`.

- [ ] **Step 3: Write `src/components/SkillsSection.tsx`**

```tsx
import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Code2, ClipboardList, ShieldCheck, Languages } from 'lucide-react';
import { useLang } from '../context/LangContext';
import { WordsPullUp } from './ui/WordsPullUp';
import type { SkillGroup } from '../data/content';

const ICONS: Record<SkillGroup['icon'], typeof Code2> = {
  code: Code2,
  'clipboard-list': ClipboardList,
  shield: ShieldCheck,
  languages: Languages,
};

export function SkillsSection() {
  const { t } = useLang();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section id="skills" className="bg-black py-24 md:py-32 px-6">
      <div className="max-w-5xl mx-auto" ref={ref}>
        <h2 className="text-3xl md:text-5xl font-serif text-[#E1E0CC] mb-16 text-center">
          <WordsPullUp text={t.skills.heading} />
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
          {t.skills.groups.map((group, i) => {
            const Icon = ICONS[group.icon];
            return (
              <motion.div
                key={group.title}
                className="liquid-glass rounded-3xl p-6 md:p-8 bg-[#212121]"
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="liquid-glass rounded-full w-11 h-11 flex items-center justify-center mb-4">
                  <Icon size={20} className="text-[#DEDBC8]" />
                </div>
                <h3 className="text-[#E1E0CC] text-lg font-medium mb-2">{group.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{group.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/SkillsSection.test.tsx`
Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
git add src/components/SkillsSection.tsx src/components/SkillsSection.test.tsx
git commit -m "feat: add Skills section"
```

---

### Task 14: `ProjectsSection` and `ContactSection`

**Files:**
- Create: `src/components/ProjectsSection.tsx`, `src/components/ContactSection.tsx`
- Test: `src/components/ProjectsSection.test.tsx`, `src/components/ContactSection.test.tsx`

- [ ] **Step 1: Write the failing test for `ProjectsSection`**

```tsx
// src/components/ProjectsSection.test.tsx
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LangProvider } from '../context/LangContext';
import { ProjectsSection } from './ProjectsSection';

describe('ProjectsSection', () => {
  it('renders all 6 project cards', () => {
    render(
      <LangProvider>
        <ProjectsSection />
      </LangProvider>
    );
    expect(screen.getByText('Hệ thống quản trị khách sạn ERP')).toBeInTheDocument();
    expect(screen.getByText('Số hoá di tích cho xã phường')).toBeInTheDocument();
    expect(screen.getAllByText(/2025|2024/).length).toBeGreaterThanOrEqual(6);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/ProjectsSection.test.tsx`
Expected: FAIL — `Cannot find module './ProjectsSection'`.

- [ ] **Step 3: Write `src/components/ProjectsSection.tsx`**

```tsx
import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { useLang } from '../context/LangContext';
import { WordsPullUp } from './ui/WordsPullUp';

export function ProjectsSection() {
  const { t } = useLang();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section id="projects" className="bg-black py-24 md:py-32 px-6">
      <div className="max-w-5xl mx-auto" ref={ref}>
        <h2 className="text-3xl md:text-5xl font-serif text-[#E1E0CC] mb-16 text-center">
          <WordsPullUp text={t.projects.heading} />
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {t.projects.items.map((project, i) => (
            <motion.div
              key={project.title}
              className="group liquid-glass rounded-3xl overflow-hidden p-6 md:p-8 relative"
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
            >
              <div
                className="absolute inset-0 opacity-40 transition-transform duration-700 group-hover:scale-105"
                style={{
                  background: 'radial-gradient(circle at 30% 20%, rgba(222,219,200,0.15), transparent 60%)',
                }}
              />
              <div className="relative">
                <p className="text-white/40 text-xs tracking-widest uppercase mb-3">
                  {project.role} · {project.scope}
                </p>
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-[#E1E0CC] text-xl md:text-2xl font-medium tracking-tight">
                    {project.title}
                  </h3>
                  <span className="liquid-glass rounded-full p-2 flex-shrink-0">
                    <ArrowUpRight size={16} className="text-white/80" />
                  </span>
                </div>
                <p className="text-white/50 text-sm mt-3">{project.years}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Run test to verify `ProjectsSection` passes**

Run: `npx vitest run src/components/ProjectsSection.test.tsx`
Expected: PASS (1 test).

- [ ] **Step 5: Write the failing test for `ContactSection`**

```tsx
// src/components/ContactSection.test.tsx
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LangProvider } from '../context/LangContext';
import { ContactSection } from './ContactSection';

describe('ContactSection', () => {
  it('renders a mailto link to the personal gmail address, not the ICS email', () => {
    render(
      <LangProvider>
        <ContactSection />
      </LangProvider>
    );
    const mailLinks = screen.getAllByRole('link', { name: /Gửi email cho tôi|tt98tuyen@gmail.com/ });
    expect(mailLinks.length).toBeGreaterThan(0);
    mailLinks.forEach((link) => {
      expect(link.getAttribute('href')).toBe('mailto:tt98tuyen@gmail.com');
    });
  });
});
```

- [ ] **Step 6: Run test to verify it fails**

Run: `npx vitest run src/components/ContactSection.test.tsx`
Expected: FAIL — `Cannot find module './ContactSection'`.

- [ ] **Step 7: Write `src/components/ContactSection.tsx`**

```tsx
import { Mail, MapPin } from 'lucide-react';
import { useLang } from '../context/LangContext';
import { WordsPullUp } from './ui/WordsPullUp';
import { PillButton } from './ui/PillButton';

export function ContactSection() {
  const { t } = useLang();

  return (
    <section id="contact" className="bg-black pt-24 pb-16 px-6">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-4xl md:text-6xl font-serif italic text-[#E1E0CC] mb-10 leading-tight">
          <WordsPullUp text={t.contact.heading} />
        </h2>

        <PillButton
          href={`mailto:${t.contact.email}`}
          variant="solid"
          className="inline-flex items-center gap-2 mb-10"
        >
          <Mail size={16} />
          {t.contact.ctaLabel}
        </PillButton>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-white/50 text-sm">
          <a href={`mailto:${t.contact.email}`} className="flex items-center gap-2 hover:text-white/80">
            <Mail size={14} /> {t.contact.email}
          </a>
          <span className="flex items-center gap-2">
            <MapPin size={14} /> {t.contact.location}
          </span>
        </div>

        <p className="text-white/20 text-xs mt-16">© {new Date().getFullYear()} Nguyễn Ngọc Tuyền</p>
      </div>
    </section>
  );
}
```

- [ ] **Step 8: Run test to verify `ContactSection` passes**

Run: `npx vitest run src/components/ContactSection.test.tsx`
Expected: PASS (1 test).

- [ ] **Step 9: Commit**

```bash
git add src/components/ProjectsSection.tsx src/components/ProjectsSection.test.tsx src/components/ContactSection.tsx src/components/ContactSection.test.tsx
git commit -m "feat: add Projects and Contact sections"
```

---

### Task 15: Assemble `App.tsx`, run the full suite, and verify in the browser

**Files:**
- Modify: `src/App.tsx`, `src/main.tsx`

- [ ] **Step 1: Write `src/App.tsx`**

```tsx
import { LangProvider } from './context/LangContext';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { AboutSection } from './components/AboutSection';
import { ExperienceSection } from './components/ExperienceSection';
import { SkillsSection } from './components/SkillsSection';
import { ProjectsSection } from './components/ProjectsSection';
import { ContactSection } from './components/ContactSection';

function App() {
  return (
    <LangProvider>
      <Navbar />
      <main className="bg-black">
        <HeroSection />
        <AboutSection />
        <ExperienceSection />
        <SkillsSection />
        <ProjectsSection />
        <ContactSection />
      </main>
    </LangProvider>
  );
}

export default App;
```

- [ ] **Step 2: Simplify `src/main.tsx` to the standard Vite entry point**

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

- [ ] **Step 3: Run the full test suite**

Run: `npm run test`
Expected: all test files pass (content, LangContext, WordsPullUp, PillButton, Navbar, HeroSection, AboutSection, ExperienceSection, SkillsSection, ProjectsSection, ContactSection).

- [ ] **Step 4: Run the production build**

Run: `npm run build`
Expected: build succeeds with no TypeScript errors, `dist/` is created.

- [ ] **Step 5: Manually verify in the browser**

Run: `npm run dev`, open the printed local URL (typically `http://localhost:5173`) in a browser, and check:
- Hero renders with the aurora/particle background moving and the headline animating in.
- Moving the mouse shifts the hero background slightly (GSAP parallax).
- Clicking the VI/EN toggle in the navbar switches every section's text.
- Scrolling reveals the About, Experience, Skills, Projects, and Contact sections with their stagger-in animations.
- The "Liên hệ" / "Gửi email cho tôi" buttons open a `mailto:tt98tuyen@gmail.com` compose window.
- Resize to a mobile width and confirm the navbar collapses to the hamburger menu and all sections reflow without horizontal scrolling.

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx src/main.tsx
git commit -m "feat: assemble full single-page CV site"
```

---

## Follow-up (not part of this plan)

Once the user provides the real photo file path, replace `src/assets/avatar-placeholder.svg` with the actual image (e.g. `src/assets/avatar.jpg`) and update the single `import avatarUrl from '...'` line in `src/components/AboutSection.tsx` accordingly — no other file changes needed.
