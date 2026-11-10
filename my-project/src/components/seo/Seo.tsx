import { useEffect } from 'react';
import { buildPageMeta, type PageMetaInput } from '@/lib/seo';

/**
 * Writes document metadata into <head>.
 *
 * Tags are updated in place rather than appended, so the baseline tags in
 * `index.html` (used by crawlers and scrapers that never run JavaScript) are
 * replaced instead of duplicated when a page renders.
 */

const setMeta = (attr: 'name' | 'property', key: string, content: string) => {
  let tag = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attr, key);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
};

const setCanonical = (href: string) => {
  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'canonical';
    document.head.appendChild(link);
  }
  link.href = href;
};

export const Seo = ({ title, description, path, image, noindex }: PageMetaInput) => {
  useEffect(() => {
    const meta = buildPageMeta({ title, description, path, image, noindex });

    document.title = meta.title;
    setMeta('name', 'description', meta.description);
    setMeta('name', 'robots', meta.robots);
    setMeta('property', 'og:title', meta.title);
    setMeta('property', 'og:description', meta.description);
    setMeta('property', 'og:url', meta.canonical);
    setMeta('property', 'og:type', meta.type);
    setMeta('name', 'twitter:title', meta.title);
    setMeta('name', 'twitter:description', meta.description);
    setMeta('property', 'og:image', meta.image);
    setMeta('name', 'twitter:image', meta.image);
    setCanonical(meta.canonical);
  }, [title, description, path, image, noindex]);

  return null;
};
