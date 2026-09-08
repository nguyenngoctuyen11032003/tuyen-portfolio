import '@testing-library/jest-dom/vitest';

// jsdom does not implement IntersectionObserver, which framer-motion's
// useInView relies on. Provide a minimal stub so components using it can
// mount in tests (it will simply report elements as not-in-view).
if (typeof globalThis.IntersectionObserver === 'undefined') {
  class MockIntersectionObserver implements IntersectionObserver {
    readonly root: Element | Document | null = null;
    readonly rootMargin: string = '';
    readonly thresholds: ReadonlyArray<number> = [];
    readonly scrollMargin: string = '';
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
  }

  globalThis.IntersectionObserver =
    MockIntersectionObserver as unknown as typeof IntersectionObserver;
}
