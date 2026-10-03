import { useEffect } from 'react';
import type { RefObject } from 'react';

const SCROLLABLE_OVERFLOW = /auto|scroll|overlay/;

let activeLocks = 0;
const releases: Array<() => void> = [];

const isScrollable = (element: Element): boolean => {
  const style = window.getComputedStyle(element);
  return SCROLLABLE_OVERFLOW.test(style.overflowY) || SCROLLABLE_OVERFLOW.test(style.overflowX);
};

/**
 * Every scrollable element outside the overlay itself.
 *
 * Portal layouts scroll inside `<main class="overflow-y-auto">` while public pages scroll
 * on `document.body`, and an overlay may render either inside `<main>` or as a sibling of
 * it — so ancestor walking alone is not enough. Locking the whole document minus the
 * overlay subtree covers both shapes.
 */
const collectBackgroundScrollers = (overlay: HTMLElement | null): HTMLElement[] => {
  const found: HTMLElement[] = [];
  const candidates = document.querySelectorAll<HTMLElement>('*');
  for (const element of candidates) {
    if (overlay?.contains(element)) continue;
    if (!isScrollable(element)) continue;
    found.push(element);
  }
  for (const root of [document.body, document.documentElement]) {
    if (root && !found.includes(root)) found.push(root);
  }
  return found;
};

const scrollbarWidth = (element: HTMLElement): number =>
  element.offsetWidth - element.clientWidth;

const lockElement = (element: HTMLElement): (() => void) => {
  const previousOverflow = element.style.overflow;
  const previousPaddingRight = element.style.paddingRight;
  const gutter = scrollbarWidth(element);

  element.style.overflow = 'hidden';
  if (gutter > 0 && window.getComputedStyle(element).paddingRight === '0px') {
    element.style.paddingRight = `${gutter}px`;
  }

  return () => {
    element.style.overflow = previousOverflow;
    element.style.paddingRight = previousPaddingRight;
  };
};

/**
 * Freezes the page behind an overlay while it is open, restoring the previous scroll
 * state on close. Locks are reference counted so opening one overlay on top of another
 * never unlocks the container that is still in use.
 */
export const useScrollLock = (
  active: boolean,
  overlay?: RefObject<HTMLElement | null>,
): void => {
  useEffect(() => {
    if (!active) return;

    const elements = collectBackgroundScrollers(overlay?.current ?? null);
    const undo = elements.map(lockElement);

    activeLocks += 1;
    const release = () => {
      for (const restore of undo) restore();
    };
    releases.push(release);

    return () => {
      activeLocks = Math.max(0, activeLocks - 1);
      if (activeLocks > 0) {
        const index = releases.indexOf(release);
        if (index !== -1) releases.splice(index, 1);
        return;
      }
      for (let i = releases.length - 1; i >= 0; i -= 1) releases[i]();
      releases.length = 0;
    };
  }, [active, overlay]);
};