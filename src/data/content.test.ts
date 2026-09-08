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
