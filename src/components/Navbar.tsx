import { useEffect, useRef, useState } from 'react';
import { useLang } from '../context/LangContext';
import { useIntroDone } from '../context/IntroContext';
import { links } from '../data/content';
import { thumbOf } from '../data/thumbs';
import { TechIcon } from './ui/techIcons';
import { sfx, SoundToggle } from '../sound';
import { NavSphere, NavStackArch } from './nav/NavPreviews';
import avatarUrl from '../assets/avatar.jpg';
import './nav/navbar.css';

const MENUS = ['profile', 'work', 'connect'] as const;
type MenuId = (typeof MENUS)[number];

/** Panel padding (8px) + row padding (12px): lines each panel's text up with its trigger's text. */
const PAD = 20;

/** Preview per profile row: About, Experience, Skills, Certifications. */
const PROFILE_MEDIA = [
  { kind: 'image', src: avatarUrl, contain: false },
  { kind: 'sphere' },
  { kind: 'arch' },
  { kind: 'image', src: '/certs/oci-architect-2025.webp', contain: true },
] as const;

/** Projects shown as photo cards in the Work menu, matched by their first screenshot. */
const WORK_FEATURED = ['/projects/fofreexit-1.png', '/projects/hotel-1.png'];

const WORK_SECTIONS = ['#projects', '#archive', '#artifacts'];

function Chevron() {
  return (
    <svg className="hdr-chev" width="8" height="5" viewBox="0 0 8 5" aria-hidden="true">
      <path d="M1 1l3 3 3-3" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Arrow() {
  return (
    <svg className="hdr-arrow" width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
      <path d="M2 8l6-6M3.5 2H8v4.5" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Navbar() {
  const { t, lang, toggleLang } = useLang();
  const introDone = useIntroDone();
  const menu = t.nav.menu;

  const headerRef = useRef<HTMLElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const ddRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLSpanElement>(null);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [activeHref, setActiveHref] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const [tucked, setTucked] = useState(false);
  const [profileRow, setProfileRow] = useState(0);
  const [mediaArmed, setMediaArmed] = useState(false);
  const sheetOpenRef = useRef(sheetOpen);

  useEffect(() => {
    sheetOpenRef.current = sheetOpen;
  }, [sheetOpen]);

  const featured = WORK_FEATURED.map((src) => t.projects.items.find((p) => p.images?.[0]?.src === src)).filter(
    (p) => p !== undefined
  );
  const sectionHrefs = [...menu.profileItems.map((i) => i.href), ...WORK_SECTIONS, '#contact'];
  const sectionKey = sectionHrefs.join('|');

  // Scroll-spy: which section sits in the middle of the viewport.
  useEffect(() => {
    const sections = sectionKey
      .split('|')
      .map((href) => document.querySelector(href))
      .filter((el): el is Element => el !== null);
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveHref(`#${entry.target.id}`);
        });
      },
      { rootMargin: '-45% 0px -50% 0px', threshold: 0 }
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [sectionKey]);

  // Glass bar once scrolled, tuck away while scrolling down, reading-progress hairline.
  useEffect(() => {
    let lastY = window.scrollY;
    let raf = 0;
    function update() {
      raf = 0;
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setScrolled(y > 24);
      const menuOpen = ddRef.current?.classList.contains('open');
      if (Math.abs(y - lastY) > 6) {
        setTucked(!menuOpen && y > lastY && y > 320);
        lastY = y;
      }
      if (progressRef.current) {
        progressRef.current.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`;
      }
    }
    function onScroll() {
      if (!raf) raf = requestAnimationFrame(update);
    }
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  // Morphing dropdown: one container that slides and resizes between panels.
  useEffect(() => {
    const header = headerRef.current;
    const nav = navRef.current;
    const dd = ddRef.current;
    if (!header || !nav || !dd) return;

    const triggers = Array.from(nav.querySelectorAll<HTMLButtonElement>('.hdr-trigger'));
    const panels = Array.from(dd.querySelectorAll<HTMLElement>('.dd-panel'));
    const panelOf = (id: MenuId) => dd.querySelector<HTMLElement>(`[data-panel="${id}"]`)!;
    const triggerOf = (id: MenuId) => nav.querySelector<HTMLButtonElement>(`[data-menu="${id}"]`)!;

    let current: MenuId | null = null;
    let closeTimer = 0;

    function place(id: MenuId) {
      const panel = panelOf(id);
      const w = panel.offsetWidth;
      const h = panel.offsetHeight;
      const tr = triggerOf(id).getBoundingClientRect();
      const hr = header!.getBoundingClientRect();
      let x = tr.left - PAD;
      x = Math.max(hr.left + 12, Math.min(x, hr.right - w - 12));
      x -= ((dd!.offsetParent as HTMLElement | null) ?? header!).getBoundingClientRect().left;
      dd!.style.setProperty('--x', `${x}px`);
      dd!.style.setProperty('--w', `${w}px`);
      dd!.style.setProperty('--h', `${h}px`);
    }

    function open(id: MenuId) {
      window.clearTimeout(closeTimer);
      if (current === id) return;
      const next = panelOf(id);

      if (!current) {
        dd!.classList.add('instant', 'snap');
        panels.forEach((p) => {
          p.classList.add('snap');
          p.removeAttribute('data-state');
        });
        place(id);
        void dd!.offsetWidth;
        dd!.classList.remove('snap');
        panels.forEach((p) => p.classList.remove('snap'));
        dd!.classList.add('open');
        requestAnimationFrame(() => dd!.classList.remove('instant'));
        const r = triggerOf(id).getBoundingClientRect();
        sfx.play('menuOpen', { pan: sfx.panAt(r.left + r.width / 2) });
      } else {
        const dir = MENUS.indexOf(id) > MENUS.indexOf(current) ? 1 : -1;
        sfx.play('slide', { intensity: 0.3, rate: dir > 0 ? 1.06 : 0.94, pan: dir * 0.25 });
        panelOf(current).dataset.state = dir > 0 ? 'exit-left' : 'exit-right';
        next.classList.add('snap');
        next.dataset.state = dir > 0 ? 'exit-right' : 'exit-left';
        void next.offsetWidth;
        next.classList.remove('snap');
        place(id);
      }

      next.dataset.state = 'active';
      triggers.forEach((tr) => tr.setAttribute('aria-expanded', String(tr.dataset.menu === id)));
      current = id;
      setTucked(false);
    }

    /** `silent`: closed by a panel link (its navigation sound is enough), a language switch or unmount. */
    function close(silent = false) {
      const wasOpen = current !== null;
      dd!.classList.remove('open');
      if (current) panelOf(current).removeAttribute('data-state');
      triggers.forEach((tr) => tr.setAttribute('aria-expanded', 'false'));
      current = null;
      if (wasOpen && !silent) sfx.play('menuClose');
    }

    function scheduleClose(ms = 140) {
      window.clearTimeout(closeTimer);
      closeTimer = window.setTimeout(() => close(), ms);
    }

    const cleanups: (() => void)[] = [];
    function on<K extends keyof HTMLElementEventMap>(
      el: HTMLElement | Document | Window,
      type: K,
      fn: (e: HTMLElementEventMap[K]) => void
    ) {
      el.addEventListener(type, fn as EventListener);
      cleanups.push(() => el.removeEventListener(type, fn as EventListener));
    }

    triggers.forEach((tr) => {
      const id = tr.dataset.menu as MenuId;
      on(tr, 'pointerenter', (e) => {
        if (e.pointerType === 'mouse') open(id);
      });
      on(tr, 'click', () => (current === id ? close() : open(id)));
    });
    on(nav, 'pointerenter', () => window.clearTimeout(closeTimer));
    on(nav, 'pointerleave', (e) => {
      if (e.pointerType === 'mouse') scheduleClose();
    });
    on(nav, 'focusout', (e) => {
      if (!nav.contains(e.relatedTarget as Node | null)) scheduleClose(0);
    });
    on(dd, 'click', (e) => {
      if ((e.target as HTMLElement).closest('a')) close(true);
    });
    on(document, 'keydown', (e) => {
      if (e.key !== 'Escape') return;
      if (current) {
        const tr = triggerOf(current);
        close();
        tr.focus();
      }
      if (sheetOpenRef.current) {
        sfx.play('menuClose');
        setSheetOpen(false);
      }
    });
    on(document, 'pointerdown', (e) => {
      if (current && !nav.contains(e.target as Node)) close();
    });
    on(window, 'resize', () => {
      if (current) place(current);
    });

    return () => {
      window.clearTimeout(closeTimer);
      cleanups.forEach((fn) => fn());
      close(true);
    };
  }, [lang]);

  const profileActive = menu.profileItems.some((i) => i.href === activeHref);
  const workActive = WORK_SECTIONS.includes(activeHref);
  const current = (href: string) => (activeHref === href ? 'true' : undefined);
  const pick = (i: number) => {
    if (i !== profileRow) sfx.play('tick', { step: i, intensity: 0.5 });
    setProfileRow(i);
  };

  const connectItems = [
    { label: 'GitHub', desc: menu.connectDesc[0], href: links.github, external: true },
    { label: 'LinkedIn', desc: menu.connectDesc[1], href: links.linkedin, external: true },
    { label: menu.cvLabel, desc: menu.connectDesc[2], href: links.cv, download: true },
    { label: t.a11y.email, desc: menu.connectDesc[3], href: `mailto:${t.contact.email}` },
  ];

  const headerClass = [
    'hdr',
    introDone && 'is-ready',
    scrolled && 'is-scrolled',
    tucked && !sheetOpen && 'is-tucked',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <header ref={headerRef} className={headerClass}>
      <div className="hdr-bar">
        <a href="#hero" className="hdr-logo" aria-label="Nguyễn Ngọc Tuyền">
          <span className="hdr-logo-mark" aria-hidden="true">
            N
          </span>
          <span className="hdr-logo-name">
            Ngọc Tuyền<span className="hdr-logo-dot">.</span>
          </span>
        </a>

        <nav ref={navRef} className="hdr-nav" aria-label="Main">
          <ul className="hdr-links">
            <li>
              <button type="button" className={`hdr-trigger${profileActive ? ' is-current' : ''}`} data-menu="profile"
                aria-expanded="false"
                data-sfx="off"
                data-sfx-hover="off"
                onPointerEnter={() => setMediaArmed(true)}
                onFocus={() => setMediaArmed(true)}
              >
                {menu.profile}
                <Chevron />
              </button>
            </li>
            <li>
              <button type="button" className={`hdr-trigger${workActive ? ' is-current' : ''}`} data-menu="work" aria-expanded="false" data-sfx="off" data-sfx-hover="off">
                {menu.work}
                <Chevron />
              </button>
            </li>
            <li>
              <button type="button" className="hdr-trigger" data-menu="connect" aria-expanded="false" data-sfx="off" data-sfx-hover="off">
                {menu.connect}
                <Chevron />
              </button>
            </li>
          </ul>

          <div ref={ddRef} className="dd">
            {/* Profile: section list with a crossfading preview */}
            <div className="dd-panel dd-profile" data-panel="profile">
              <div className="dd-list">
                {menu.profileItems.map((item, i) => (
                  <a
                    key={item.href}
                    href={item.href}
                    aria-current={current(item.href)}
                    className={`dd-row${profileRow === i ? ' is-active' : ''}`}
                    data-sfx-hover="off"
                    onPointerEnter={() => pick(i)}
                    onFocus={() => pick(i)}
                  >
                    <strong>{item.label}</strong>
                    <span>{item.desc}</span>
                  </a>
                ))}
              </div>
              <div className="dd-media" aria-hidden="true">
                {PROFILE_MEDIA.map((m, i) => {
                  const active = profileRow === i ? ' is-active' : '';
                  if (m.kind === 'image') {
                    return (
                      <img
                        key={m.src}
                        src={m.src}
                        alt=""
                        decoding="async"
                        className={`dd-layer${m.contain ? ' is-contain' : ''}${active}`}
                      />
                    );
                  }
                  return (
                    <div key={m.kind} className={`dd-layer dd-scene dd-scene-${m.kind}${active}`}>
                      {m.kind === 'sphere' ? <NavSphere armed={mediaArmed} /> : <NavStackArch />}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Work: FoFreeXit and the hotel ERP as photo cards */}
            <div className="dd-panel dd-work" data-panel="work">
              <div className="dd-cards">
                {featured.map((project) => (
                  <a key={project.title} href="#projects" className="dd-card">
                    <img src={thumbOf(project.images![0].src)} alt="" decoding="async" />
                    <em>{project.years} · {project.scope}</em>
                    <strong>{project.title}</strong>
                    <span>{project.tags?.slice(0, 3).join(' · ')}</span>
                  </a>
                ))}
              </div>
              <div className="dd-foot">
                <a href="#projects" aria-current={current('#projects')}>
                  {menu.workAll}
                  <span className="dd-count">{t.projects.items.length}</span>
                </a>
                <a href="#archive" aria-current={current('#archive')}>
                  {menu.workArchive}
                  <Arrow />
                </a>
                <a href="#artifacts" aria-current={current('#artifacts')}>
                  {menu.workArtifacts}
                  <Arrow />
                </a>
              </div>
            </div>

            {/* Connect: outbound links */}
            <div className="dd-panel dd-connect" data-panel="connect">
              {connectItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="dd-link"
                  target={item.external ? '_blank' : undefined}
                  rel={item.external ? 'noopener noreferrer' : undefined}
                  download={item.download || undefined}
                >
                  <span>
                    <strong>{item.label}</strong>
                    <small>{item.desc}</small>
                  </span>
                  <Arrow />
                </a>
              ))}
            </div>
          </div>
        </nav>

        <div className="hdr-actions">
          <SoundToggle />
          <button
            type="button"
            className="hdr-lang"
            data-sfx="off"
            onClick={() => {
              sfx.play('lang', { rate: lang === 'vi' ? 1.06 : 0.94 });
              toggleLang();
            }}
            aria-label={t.a11y.toggleLanguage}
          >
            <span className={lang === 'vi' ? 'is-on' : ''}>VI</span>
            <span className={lang === 'en' ? 'is-on' : ''}>EN</span>
          </button>
          <a href="#contact" className="hdr-cta" data-sfx="press">
            {t.nav.contactCta}
            <Arrow />
          </a>
          <button
            type="button"
            className="hdr-menu-btn"
            aria-label={t.a11y.toggleMenu}
            aria-expanded={sheetOpen}
            data-sfx="off"
            onClick={() => {
              sfx.play(sheetOpen ? 'menuClose' : 'menuOpen', { intensity: 1 });
              setSheetOpen((v) => !v);
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
              <path
                className={sheetOpen ? 'is-x' : ''}
                d={sheetOpen ? 'M3.5 3.5l9 9M12.5 3.5l-9 9' : 'M2 5.5h12M2 10.5h12'}
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
          </button>
        </div>
      </div>

      <div className="hdr-progress" aria-hidden="true">
        <span ref={progressRef} />
      </div>

      <div className={`hdr-sheet${sheetOpen ? ' open' : ''}`} inert={!sheetOpen}>
        <h3>{menu.profile}</h3>
        {menu.profileItems.map((item) => (
          <a key={item.href} href={item.href} aria-current={current(item.href)} onClick={() => setSheetOpen(false)}>
            {item.label}
          </a>
        ))}
        <h3>{menu.work}</h3>
        <a href="#projects" aria-current={current('#projects')} onClick={() => setSheetOpen(false)}>
          {menu.workAll}
        </a>
        <a href="#archive" aria-current={current('#archive')} onClick={() => setSheetOpen(false)}>
          {menu.workArchive}
        </a>
        <a href="#artifacts" aria-current={current('#artifacts')} onClick={() => setSheetOpen(false)}>
          {menu.workArtifacts}
        </a>
        <h3>{menu.connect}</h3>
        <div className="hdr-sheet-social">
          <a href={links.github} target="_blank" rel="noopener noreferrer" onClick={() => setSheetOpen(false)}>
            <TechIcon name="GitHub" size={15} /> GitHub
          </a>
          <a href={links.linkedin} target="_blank" rel="noopener noreferrer" onClick={() => setSheetOpen(false)}>
            LinkedIn
          </a>
          <a href={links.cv} download onClick={() => setSheetOpen(false)}>
            {menu.cvLabel}
          </a>
        </div>
        <SoundToggle variant="sheet" />
        <a href="#contact" className="hdr-sheet-cta" data-sfx="press" onClick={() => setSheetOpen(false)}>
          {t.nav.contactCta}
          <Arrow />
        </a>
      </div>
    </header>
  );
}
