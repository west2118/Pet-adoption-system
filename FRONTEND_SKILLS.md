# React.js & Frontend Development Best Practices

A comprehensive guide to frontend standards, component architecture, state management, and code organization for building scalable, maintainable React applications.

---

## 1. Component Architecture & Reusability

### 1.1 Atomic Component Structure
Organize components into logical layers based on their responsibilities:
- **UI Primitives (`components/ui/`)**: Low-level, generic components (e.g., `Button`, `Badge`, `Card`, `Modal`). Independent of business domain.
- **Feature Components (`components/features/`)**: Domain-specific components composed of UI primitives (e.g., `PetCard`, `AdoptionForm`, `ShelterFilter`).
- **Shared Components (`components/shared/`)**: Cross-portal reusable blocks (e.g., `SummaryStatCard`, `SummaryStatGrid`, `ChartCard`, `TableCard`, `SectionHeader`, `Breadcrumbs`, `SlideOver`, `DetailsModal`). Import from `@/components/shared`, NEVER rebuild these patterns inline.
- **Layout Components (`components/layout/`)**: Structural containers (e.g., `Navbar`, `Sidebar`, `Footer`, `Container`).
- **Pages / Views (`pages/`)**: Top-level page views connected to routing.

### 1.2 Component Composition over Deep Props Drilling
Use children composition instead of passing unnecessary configuration props deep down.

```tsx
// ❌ Avoid: Rigid prop passing for children structure
<PetCard title="Buddy" buttonText="Adopt Me" onAdopt={handleAdopt} />

// ✅ Preferred: Flexible component composition
<PetCard title="Buddy" image="/pets/buddy.jpg" breed="Golden Retriever">
  <PetBadge status="Available" />
  <Button onClick={handleAdopt} variant="default">
    Adopt Me
  </Button>
</PetCard>
```

### 1.3 Single Responsibility Principle
- Each component should do **one thing well**.
- If a component grows beyond ~150 lines or manages complex business logic alongside UI presentation, split it into smaller components or extract logic into custom hooks.

### 1.4 Separate Public vs. Shelter vs. Platform-Admin Layouts
- NEVER mix the three shells. Each side gets its own layout and navigation:
- **Public layout (`components/layout/PublicLayout.tsx`)**: top `Navbar` + `Footer` + `<Outlet />`. Used for `/`, `/pets`, `/pets/:id`, `/shelters`, `/favorites`, `/login`, `/signup`, `/apply/:petId`, `/applications`. The public `Navbar` MUST NOT contain shelter or platform-admin links.
- **Shelter portal layout (`components/layout/ShelterLayout.tsx` + `ShelterSidebar.tsx`)**: sidebar navigation + content `<Outlet />`, NO top public `Navbar`, NO public `Footer`. Used only under `/shelter/*` (Overview, Listings, Applications, Inquiries, Profile) and guarded by `ProtectedRoute` with `allowedRoles={['shelter_staff']}`. Includes a "View public site" (`/`) link and logout.
- **Platform-admin layout (`components/layout/AdminLayout.tsx` + `AdminSidebar.tsx`)**: sidebar navigation + content `<Outlet />`, NO top public `Navbar`, NO public `Footer`. Used only under `/admin/*` (Overview, Shelters, Pets, Users) and guarded by `ProtectedRoute` with `allowedRoles={['platform_admin']}`. This is the developers' oversight dashboard over all shelters and users.
- Portal/admin pages reuse the same UI primitives / feature components as public pages, but routing and shells stay separate so adopter UI never leaks staff controls.
- **Fixed viewport shell:** portal layouts are always `h-screen overflow-hidden` — sidebar + topbar stay pinned, ONLY the content `<main>` scrolls (`flex-1 min-h-0 overflow-y-auto`). Portal pages must never create page-level scroll.

### 1.5 One Shared Sidebar Design, Role-Specific Pages
- Both portals share ONE sidebar design component (`components/layout/PortalSidebar.tsx`): same shape, drawer behavior, user chip, logout, and "View public site" link. `ShelterSidebar` and `AdminSidebar` are thin wrappers passing role-specific config (brand + links).
- NEVER fork the sidebar markup per role — add a new portal by passing a new `links` array.

```tsx
// ✅ Preferred: config-driven shared sidebar
interface PortalLink {
  to: string;
  end?: boolean;
  label: string;
  icon: LucideIcon;
}

interface PortalSidebarProps {
  brandTitle: string;
  brandSubtitle: string;
  links: PortalLink[];
  mobileOpen?: boolean;
  onClose?: () => void;
}

export const ShelterSidebar = (props: { mobileOpen?: boolean; onClose?: () => void }) => (
  <PortalSidebar
    brandTitle="Shelter Portal"
    brandSubtitle="PawsConnect"
    links={[
      { to: '/shelter', end: true, label: 'Overview', icon: LayoutDashboard },
      { to: '/shelter/listings', label: 'Listings', icon: PawPrint },
      { to: '/shelter/applications', label: 'Applications', icon: ClipboardList },
      { to: '/shelter/inquiries', label: 'Inquiries', icon: MessageCircleQuestion },
      { to: '/shelter/profile', label: 'Shelter Profile', icon: Building2 },
    ]}
    {...props}
  />
);
```

### 1.6 Portal Routing — Parent Layout + Child Pages
- Portal layouts are PARENT routes rendering the sidebar + `<Outlet />`; every portal screen is a DEDICATED CHILD page component under `pages/shelter/*` (or `pages/admin/*`).
- NEVER build portal tabs-inside-one-page (`initialTab`/`initialSection` props switching content) — one URL = one page component. Sibling cross-links use `NavLink` to the child route.

```tsx
// ✅ Preferred: parent + children, one page per URL
<Route element={<ShelterLayout />}>
  <Route path="shelter" element={<ShelterOverviewPage />} />
  <Route path="shelter/listings" element={<ShelterListingsPage />} />
  <Route path="shelter/applications" element={<ShelterApplicationsPage />} />
  <Route path="shelter/inquiries" element={<ShelterInquiriesPage />} />
  <Route path="shelter/profile" element={<ShelterProfilePage />} />
</Route>
```

### 1.8 Reuse Shared Components (`components/shared/`)
- ALWAYS compose portal pages from shared blocks instead of rebuilding Card/Header/grid markup:
  - `SectionHeader` for the page title + subtitle + actions row.
  - `SummaryStatGrid` + `SummaryStatCard` for KPI rows. All stat cards use ONE color (brand orange icon tile) — NEVER per-card tone colors.
  - `ChartCard` for every chart (`icon?`, `title`, `description?`, `action?`, chart as `children`). Header is icon + title/description with a bottom border, then content.
  - `TableCard` for every table/list (same header treatment: `icon?`, `title`, `description?`, `action?`, bottom border, then content; `isEmpty` + `emptyTitle`/`emptyDescription`, `footer?`).
- Table/list row components (e.g., `InventoryTable`, `RecentApplicationsTable`) stay in `components/features/` and render INSIDE `TableCard`.
- Overlays: `SlideOver` for ADD/EDIT forms (right slide-over panel), `DetailsModal` for DETAILS/read-only views (centered card). Both are controlled (`open` + `onClose`), handle Escape + scroll-lock internally, and take `title`, `description?`, `icon?`, `children`, `footer?`.
- `Breadcrumbs` auto-builds Home + path segments from the current route and renders in every portal header. NEVER hardcode per-page crumb trails.

```tsx
// ✅ Preferred: slider for forms, card modal for details
import { DetailsModal, SlideOver } from '@/components/shared';

export const ShelterListingsPage = () => {
  const [slideOpen, setSlideOpen] = useState(false);
  const [editingPet, setEditingPet] = useState<Pet | null>(null);
  const [detailsPet, setDetailsPet] = useState<Pet | null>(null);

  return (
    <>
      <Button onClick={() => { setEditingPet(null); setSlideOpen(true); }}>
        Add pet
      </Button>

      <SlideOver
        open={slideOpen}
        onClose={() => setSlideOpen(false)}
        title={editingPet ? `Edit ${editingPet.name}` : 'Add new pet profile'}
        icon={Pencil}
      >
        <PetForm pet={editingPet} />
      </SlideOver>

      <DetailsModal
        open={detailsPet !== null}
        onClose={() => setDetailsPet(null)}
        title={detailsPet?.name ?? 'Pet details'}
        icon={PawPrint}
      >
        {detailsPet && <PetDetails pet={detailsPet} />}
      </DetailsModal>
    </>
  );
};
```

```tsx
// ✅ Preferred: shared blocks, one import
import { ChartCard, SectionHeader, SummaryStatCard, SummaryStatGrid, TableCard } from '@/components/shared';

export const ShelterOverviewPage = () => (
  <Container className="py-8">
    <SectionHeader title="Shelter overview" subtitle="..." />
    <SummaryStatGrid className="mt-6">
      <SummaryStatCard title="Total pets" value={12} icon={PawPrint} />
    </SummaryStatGrid>
    <ChartCard title="Pets by species" className="mt-4">
      <PetsBySpeciesChart data={data} />
    </ChartCard>
    <TableCard title="Inventory" isEmpty={pets.length === 0} className="mt-4">
      <InventoryTable pets={pets} />
    </TableCard>
  </Container>
);
```

### 1.9 Pet Visibility — Public vs. Private / Inventory
- Every pet has `visibility: 'public' | 'private'`. `private` = internal shelter inventory, hidden from adopters everywhere.
- **Adopter UI MUST only query/render public pets**: filter with `pet.visibility === 'public'` in catalogs, featured sections, favorites, and profile pages. A direct visit to a private pet's profile URL MUST render a "not available" empty state, never the record.
- **Shelter portal shows both**, with a `VisibilityBadge` (`Public` / `Private`) and a public/private filter plus a toggle per listing.
- **Platform admin sees aggregate counts** (public vs. private per shelter) but manages no pet records directly.

```tsx
// ✅ Preferred: public-only filtering in adopter UI
export const publicPets = (pets: Pet[]): Pet[] =>
  pets.filter((pet) => pet.visibility === 'public');

// ✅ Preferred: separate shells in App.tsx
export const App = () => (
  <Routes>
    <Route element={<PublicLayout />}>
      <Route index element={<HomePage />} />
      <Route path="pets" element={<BrowsePetsPage />} />
    </Route>
    <Route element={<ProtectedRoute allowedRoles={['shelter_staff']} />}>
      <Route element={<ShelterLayout />}>
        <Route path="shelter" element={<ShelterOverviewPage />} />
        <Route path="shelter/listings" element={<ShelterListingsPage />} />
      </Route>
    </Route>
    <Route element={<ProtectedRoute allowedRoles={['platform_admin']} />}>
      <Route element={<AdminLayout />}>
        <Route path="admin" element={<PlatformOverviewPage />} />
        <Route path="admin/shelters" element={<PlatformSheltersPage />} />
        <Route path="admin/pets" element={<PlatformPetsPage />} />
        <Route path="admin/users" element={<PlatformUsersPage />} />
      </Route>
    </Route>
  </Routes>
);
```

---

## 2. Props & TypeScript Best Practices

### 2.1 Explicit Prop Types with TypeScript
Always define strict interfaces or types for component props.

```tsx
import React from 'react';

interface PetCardProps {
  id: string;
  name: string;
  species: 'dog' | 'cat' | 'other';
  ageYears: number;
  imageUrl?: string;
  isFavorite?: boolean;
  onToggleFavorite?: (id: string) => void;
  children?: React.ReactNode;
}

export const PetCard: React.FC<PetCardProps> = ({
  name,
  species,
  ageYears,
  imageUrl = '/placeholder-pet.jpg',
  isFavorite = false,
  onToggleFavorite,
  children,
}) => {
  return (
    <div className="rounded-xl border p-4 shadow-sm">
      <img src={imageUrl} alt={name} className="h-48 w-full object-cover rounded-md" />
      <h3 className="mt-2 text-lg font-semibold">{name}</h3>
      <p className="text-sm text-gray-500">{species} • {ageYears} y/o</p>
      {children}
    </div>
  );
};
```

### 2.2 Extending Native HTML Element Props
When building custom UI wrapper components (e.g., custom `Button` or `Input`), extend standard HTML attributes.

```tsx
import React from 'react';
import { cn } from '@/lib/utils'; // Tailwind merge utility

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  isLoading?: boolean;
}

export const CustomButton: React.FC<ButtonProps> = ({
  variant = 'primary',
  isLoading = false,
  className,
  children,
  disabled,
  ...props
}) => {
  return (
    <button
      disabled={disabled || isLoading}
      className={cn(
        'px-4 py-2 rounded-md font-medium transition-colors focus:outline-none',
        variant === 'primary' && 'bg-indigo-600 text-white hover:bg-indigo-700',
        variant === 'secondary' && 'bg-gray-100 text-gray-900 hover:bg-gray-200',
        variant === 'outline' && 'border border-gray-300 hover:bg-gray-50',
        className
      )}
      {...props}
    >
      {isLoading ? 'Loading...' : children}
    </button>
  );
};
```

### 2.3 Function Style — Arrow Functions Only (Async Arrow for Async)

- NEVER use `function` declarations or `function` expressions in `src/` (components, pages, hooks, services, utils).
- ALWAYS define components, hooks, helpers, and handlers as arrow function expressions assigned to `const`.
- ALWAYS use `async` arrow functions for asynchronous code — data fetching, services, event handlers, `useEffect` callbacks (via an inner async arrow IIFE).
- Service objects MUST use async arrow function properties (`list: async () => …`), never `async list() {}` shorthand.

```tsx
// ❌ Avoid: function declarations (even for components, hooks, utils)
export function PetCard({ name }: { name: string }) {
  return <h3>{name}</h3>;
}
export async function fetchPets() {
  return fetch('/api/pets');
}

// ✅ Preferred: arrow consts everywhere
export const PetCard: React.FC<{ name: string }> = ({ name }) => {
  return <h3>{name}</h3>;
};
export const fetchPets = async (): Promise<Pet[]> => {
  const res = await fetch('/api/pets');
  return res.json();
};

// ✅ Service layer: async arrow properties only
export const petService = {
  list: async (): Promise<Pet[]> => {
    const res = await fetch('/api/pets');
    return res.json();
  },
  getById: async (id: string): Promise<Pet> => {
    const res = await fetch(`/api/pets/${id}`);
    return res.json();
  },
};

// ✅ Event handlers + effects: async arrows
const handleSubmit = async (e: React.FormEvent): Promise<void> => {
  e.preventDefault();
  await applicationService.create(input);
};

useEffect(() => {
  const load = async (): Promise<void> => {
    const data = await petService.list();
    setPets(data);
  };
  load();
}, []);
```

---

## 3. State Management & Custom Hooks

### 3.1 Keep State Local & Avoid Redundant State
- Store state as low in the tree as possible.
- Avoid creating state for values that can be calculated during render.

```tsx
// ❌ Avoid: Storing derived state
const [pets, setPets] = useState<Pet[]>([]);
const [filteredPets, setFilteredPets] = useState<Pet[]>([]); // Redundant!

// ✅ Preferred: Calculate derived values on the fly
const [pets, setPets] = useState<Pet[]>([]);
const [selectedSpecies, setSelectedSpecies] = useState<string>('all');

const filteredPets = selectedSpecies === 'all'
  ? pets
  : pets.filter((pet) => pet.species === selectedSpecies);
```

### 3.2 Custom Hooks for Reusable Business Logic
Extract data fetching, form handling, or complex UI logic into reusable custom hooks.

```tsx
// hooks/usePetFilter.ts
import { useState, useMemo } from 'react';

export interface Pet {
  id: string;
  name: string;
  species: string;
  breed: string;
}

export const usePetFilter = (pets: Pet[]) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecies, setSelectedSpecies] = useState('all');

  const filteredPets = useMemo(() => {
    return pets.filter((pet) => {
      const matchesSearch = pet.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            pet.breed.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSpecies = selectedSpecies === 'all' || pet.species === selectedSpecies;
      return matchesSearch && matchesSpecies;
    });
  }, [pets, searchQuery, selectedSpecies]);

  return {
    searchQuery,
    setSearchQuery,
    selectedSpecies,
    setSelectedSpecies,
    filteredPets,
  };
};
```

---

## 4. UI, Styling & Iconography Guidelines

### 4.1 Conditional Classes with `cn()` Utility
Use `cn()` (`clsx` + `tailwind-merge`) when conditionally merging Tailwind classes to avoid class specificity collisions.

```tsx
import { cn } from '@/lib/utils';

export const StatusBadge = ({ status }: { status: 'available' | 'pending' | 'adopted' }) => {
  return (
    <span
      className={cn('px-2.5 py-1 text-xs font-semibold rounded-full', {
        'bg-green-100 text-green-800': status === 'available',
        'bg-yellow-100 text-yellow-800': status === 'pending',
        'bg-blue-100 text-blue-800': status === 'adopted',
      })}
    >
      {status.toUpperCase()}
    </span>
  );
}
```

### 4.2 Standard Iconography with Lucide React
- Always import icons from `lucide-react`.
- Specify explicit size (`className="w-4 h-4"` or `size={18}`) to ensure uniform layout alignment.

```tsx
import { Heart, Search, Filter, ShieldCheck } from 'lucide-react';

export const IconHeader = () => {
  return (
    <div className="flex items-center gap-2 text-indigo-600">
      <ShieldCheck className="w-5 h-5 text-indigo-500" />
      <span className="font-medium">Verified Animal Shelter</span>
    </div>
  );
}
```

---

## 5. Performance & Quality Control

### 5.1 Proper List Keys
- Always use a unique, immutable identifier (e.g., `pet.id`) for the `key` prop when mapping arrays.
- Never use array indices (`key={index}`) if items can be reordered, added, or removed.

```tsx
// ✅ Correct
{pets.map((pet) => (
  <PetCard key={pet.id} pet={pet} />
))}
```

### 5.2 Clean Effect Handling & Cleanup
- Keep `useEffect` minimal and focused on side-effects (e.g. data fetching, subscription).
- Always return a cleanup function for timers, event listeners, or subscriptions.

```tsx
useEffect(() => {
  const handleResize = () => setWindowWidth(window.innerWidth);
  window.addEventListener('resize', handleResize);
  
  return () => window.removeEventListener('resize', handleResize);
}, []);
```

---

## 6. Charts, Tables & Data Visualization (Recharts)

Portal dashboards summarize operational data. Use **Recharts** (already a project dependency) for all charts — never hand-rolled SVG/canvas or a second charting library.

### 6.1 Chart Components Live Under `components/features/charts/`
- Keep every chart a small, single-responsibility component: one chart type, one dataset, props typed with an explicit interface.
- Import only the Recharts primitives you use (`AreaChart`, `Bar`, `Pie`, `Tooltip`, …) so tree-shaking stays effective.
- Wrap charts in `ResponsiveContainer` so they fill their card instead of using fixed pixel widths.

```tsx
interface ApplicationsTrendChartProps {
  data: { month: string; applications: number; approved: number }[];
}

export const ApplicationsTrendChart = ({ data }: ApplicationsTrendChartProps) => (
  <ResponsiveContainer width="100%" height={280}>
    <AreaChart data={data}>
      <XAxis dataKey="month" />
      <Tooltip {...chartTooltipProps} />
      <Area dataKey="applications" stroke="var(--color-chart-1)" fill="url(#applicationsFill)" />
    </AreaChart>
  </ResponsiveContainer>
);
```

### 6.2 Theme Charts With Design Tokens — No Hardcoded Colors
- Use the `--color-chart-1…5` tokens (via a shared `chartTheme.ts` helper) so charts follow light/dark mode automatically.
- Never hardcode hex/rgb in chart `stroke`/`fill`; use `var(--color-chart-*)`, `var(--color-border)`, `var(--color-popover)`, etc.
- Keep tooltips, grids, axes, and legends themed through the shared `chartTooltipProps` helper for visual consistency.

### 6.3 Derive Chart & Table Data in Custom Hooks, Not JSX
- Compute aggregates (totals, groupings by month/status/species) in a custom hook (e.g. `hooks/useShelterOverview.ts`) with `useMemo`.
- Chart/table components receive already-shaped arrays as props — they render, they don't aggregate.
- Keep the number of table rows a component shows bounded (e.g. latest 6 applications); dedicated list pages render the full list.

### 6.4 Data Tables Use the Shared `components/ui/Table.tsx` Primitive
- Compose `Table`/`TableHeader`/`TableBody`/`TableRow`/`TableHead`/`TableCell`; never write raw `<table>` markup ad hoc.
- Reuse existing badge primitives (`StatusBadge`, `Badge`) inside cells for status/visibility columns.
- Handle the empty case with `EmptyState` and use stable item IDs (`pet.id`, `application.id`) as `key`.

### 6.5 Dashboard Page Composition
- Compose the overview as: a KPI stats-card row, then a charts grid, then full-width tables — all inside `Container`.
- Keep each section its own `Card` with `CardTitle` + `CardDescription` so the dashboard stays scannable.

---

## 7. Project Directory Conventions (`src/`)

Maintain a standardized file structure across the React app:

```text
src/
├── assets/             # Static media assets (logos, fallback images)
├── components/         # React components
│   ├── ui/             # Shadcn UI primitives (Button, Card, Input)
│   ├── shared/         # Cross-portal reusable blocks (SummaryStatCard, ChartCard, TableCard, SectionHeader)
│   ├── features/       # Feature-specific components (PetCard, FilterBar)
│   └── layout/         # Layout components (Navbar, Footer, Sidebar)
├── hooks/              # Custom reusable React hooks (usePetFilter, useAuth)
├── services/           # API requests & Supabase client integration
├── types/              # TypeScript interfaces and global type declarations
├── utils/              # Utility functions (cn, formatters, date helpers)
├── pages/              # Page routes (Home, PetDetails, AdoptionForm, Dashboard)
└── App.tsx             # Root application component & Routing setup
```

---

## 8. Summary Checklist for Code Reviews

- [ ] Is the component split into small, single-responsibility units?
- [ ] Are all props strongly typed with TypeScript interfaces?
- [ ] Are UI components reusable and independent of hardcoded backend APIs?
- [ ] Is `cn()` used for conditional Tailwind CSS styling?
- [ ] Are custom hooks used to separate business logic from UI JSX?
- [ ] Do lists use unique item IDs as `key` props?
- [ ] Are loading, error, and empty states handled gracefully in the UI?
- [ ] Are ALL functions arrow consts (no `function` keyword) and ALL async work async arrows?
- [ ] Are public (top navbar), shelter-portal (sidebar), and platform-admin (sidebar) layouts kept separate with no staff links in the public Navbar?
- [ ] Do portal routes use parent layout + dedicated child pages (no tab-state pages), sharing one sidebar design?
- [ ] Are portal stats/charts/tables/headers built from `@/components/shared` instead of inline Card markup?
- [ ] Are add/edit forms in `SlideOver` and details views in `DetailsModal` (never inline form cards)?
- [ ] Is `visibility === 'public'` enforced everywhere in adopter UI (private pets never rendered)?
- [ ] Are all charts built with Recharts and themed via `--color-chart-*` tokens (no hardcoded colors)?
- [ ] Is chart/table data derived in custom hooks (with `useMemo`) rather than aggregated inside JSX?
- [ ] Do data tables use the shared `Table` primitive and stable item IDs as `key` props?
