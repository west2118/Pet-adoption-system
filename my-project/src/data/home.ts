import type { LucideIcon } from 'lucide-react';
import {
  BadgeCheck,
  Building2,
  CalendarCheck,
  FileCheck2,
  HeartHandshake,
  Search,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

/**
 * Copy and iconography for the landing page sections. Kept out of the page
 * component so the JSX reads as layout instead of a wall of content.
 */

export interface HomeStep {
  id: string;
  icon: LucideIcon;
  verb: string;
  title: string;
  text: string;
}

export interface HomePillar {
  icon: LucideIcon;
  tag: string;
  title: string;
  text: string;
}

export interface HomeTestimonial {
  quote: string;
  name: string;
  role: string;
}

export const steps: HomeStep[] = [
  {
    id: 'browse',
    icon: Search,
    verb: 'Browse',
    title: 'Find your match',
    text: 'Filter by species, breed, age, size, gender, temperament, and shelter location. Every listing shows verified medical and behavioural records up front.',
  },
  {
    id: 'apply',
    icon: FileCheck2,
    verb: 'Apply',
    title: 'Submit online',
    text: 'Send an adoption application in minutes and follow it in real time: Submitted, Under Review, Approved, Adopted. No chasing, no guessing.',
  },
  {
    id: 'home',
    icon: HeartHandshake,
    verb: 'Welcome',
    title: 'Give a rescue a home',
    text: 'Message the shelter directly, schedule a visit, and bring your new companion home. Every rescue gets a profile, a medical trail, and a real adopter.',
  },
];

export const pillars: HomePillar[] = [
  {
    icon: BadgeCheck,
    tag: 'Verified',
    title: 'Verified shelters only',
    text: 'Every partner is reviewed before it can publish a listing, so you are always talking to a real organisation.',
  },
  {
    icon: ShieldCheck,
    tag: 'Transparent',
    title: 'Full medical records',
    text: 'Vaccination, deworming, spay or neuter, and microchip status sit on every profile — not buried in a phone call.',
  },
  {
    icon: FileCheck2,
    tag: 'Tracked',
    title: 'Application timeline',
    text: 'Every application carries a dated status history, so you always know exactly where your request stands.',
  },
  {
    icon: CalendarCheck,
    tag: 'Direct',
    title: 'Visit scheduling',
    text: 'Request a meet and greet for a pet and track its status — the shelter emails you their decision.',
  },
  {
    icon: Building2,
    tag: 'Managed',
    title: 'Shelter-first tools',
    text: 'Shelters manage listings, applications, and e-waivers from a single dashboard built for rescue operations.',
  },
  {
    icon: Sparkles,
    tag: 'Free',
    title: 'Free for adopters',
    text: 'Browsing, favouriting, and applying cost nothing. Adoption fees go straight to the shelter caring for the animal.',
  },
];

export const testimonials: HomeTestimonial[] = [
  {
    quote:
      'I had been looking for weeks with no idea who I was dealing with. Paws&Homes showed me the medical history up front and let me track the application myself. Luna came home in nine days.',
    name: 'Ana Reyes',
    role: 'Adopted Luna',
  },
  {
    quote:
      'Our intake list used to live in a spreadsheet and a group chat. Now every animal has a profile, every applicant has a status, and our phone finally stopped ringing.',
    name: 'Maria Santos',
    role: 'Shelter staff, Happy Tails Rescue',
  },
  {
    quote:
      'The adoption fee and the vet records were on one page. I did not have to make a single phone call before deciding, and that is exactly what I wanted.',
    name: 'Juan Dela Cruz',
    role: 'Adopted two cats',
  },
];
