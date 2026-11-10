/**
 * Central SEO metadata helpers.
 *
 * The app is a client-rendered SPA, so tags are written to <head> at runtime by
 * `<Seo />`. The defaults here are also mirrored in `index.html`, which is what
 * crawlers and social scrapers that do not execute JavaScript see.
 */

export const SITE = {
  /** Short brand used as the title suffix. */
  name: 'PawsConnect',
  tagline: 'Pet Adoption & Rescue Management System',
  /** Fallback social card for pages without their own image. */
  defaultImage: '/hero_dog_1.jpg',
  /** Home page falls back to this when a page has nothing more specific. */
  defaultDescription:
    'PawsConnect connects adopters with verified animal shelters and rescues. Browse adoptable dogs and cats, review health records, apply to adopt online and track every step of the process.',
} as const;

const FALLBACK_URL = 'https://pawsandhomes-hfkn.onrender.com';

/**
 * Absolute site origin, without a trailing slash. `VITE_SITE_URL` wins so the
 * canonical stays stable when the app is served from a proxy domain.
 */
export const siteUrl = (): string => {
  const configured = import.meta.env.VITE_SITE_URL as string | undefined;
  const raw =
    configured && configured.trim()
      ? configured.trim()
      : typeof window !== 'undefined' && window.location.origin
        ? window.location.origin
        : FALLBACK_URL;
  return raw.replace(/\/+$/, '');
};

export const absoluteUrl = (value: string): string => {
  if (!value) return siteUrl();
  if (/^https?:\/\//i.test(value)) return value;
  return `${siteUrl()}${value.startsWith('/') ? value : `/${value}`}`;
};

export interface PageMetaInput {
  /** Page specific title, without the brand suffix. */
  title: string;
  description?: string;
  /** Route path, e.g. `/pets` or `/shelters/abc`. Defaults to the home page. */
  path?: string;
  /** Absolute or root-relative image used for social cards. */
  image?: string;
  /** Auth, onboarding and error screens stay out of the index. */
  noindex?: boolean;
}

export interface PageMeta {
  title: string;
  description: string;
  canonical: string;
  robots: string;
  image: string;
  type: 'website' | 'article';
}

export const buildPageMeta = ({
  title,
  description,
  path = '/',
  image,
  noindex = false,
}: PageMetaInput): PageMeta => {
  const cleanTitle = title.trim();
  // Data URLs (shelter photo uploads) cannot be used as social cards.
  const cardImage = image && !image.startsWith('data:') ? image : SITE.defaultImage;
  return {
    title: cleanTitle.includes(SITE.name) ? cleanTitle : `${cleanTitle} | ${SITE.name}`,
    description: (description ?? SITE.defaultDescription).trim(),
    canonical: absoluteUrl(path),
    robots: noindex ? 'noindex, nofollow' : 'index, follow',
    image: absoluteUrl(cardImage),
    type: 'website',
  };
};
