import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  applicationService,
  getPetFacets,
  getShelterStats,
  listPetsPaginated,
  listSheltersPaginated,
  petService,
  shelterService,
  userService,
} from '@/services/api';
import type { PetFacets, ShelterStats } from '@/services/api';
import { adoptionApplicationService } from '@/services/adoptionApplicationService';
import {
  getMyApplicationSummary,
  listMyApplicationsPaginated,
} from '@/services/adoptionApplicationService';
import type { ApplicationSummary } from '@/services/adoptionApplicationService';
import { sessionStore } from '@/lib/apiClient';
import type { NearbySearch } from '@/hooks/useNearbyPets';
import type { AdoptionApplication, Pet, PetFilters, Shelter, User } from '@/types';

export const usePets = () => {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await petService.list();
      setPets(data);
    } catch {
      setError('Failed to load pets. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await petService.list();
        if (mounted) setPets(data);
      } catch {
        if (mounted) setError('Failed to load pets.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return { pets, setPets, loading, error, refresh };
};

export const useShelters = () => {
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchShelters = async () => {
      try {
        const data = await shelterService.list();
        if (mounted) {
          setShelters(data);
          setLoading(false);
        }
      } catch {
        if (mounted) {
          setLoading(false);
        }
      }
    };
    fetchShelters();
    return () => {
      mounted = false;
    };
  }, []);

  return { shelters, setShelters, loading };
};

/** Typing a search should not hit the API on every keystroke. */
const SEARCH_DEBOUNCE_MS = 350;

/**
 * One page of the browse grid, paginated by the backend.
 *
 * `filters` come straight from `usePetFilter` and are forwarded to
 * `GET /pets`, which applies them together with its own 12-per-page limit and
 * answers with `total` / `totalPages`. When `nearby` is present the backend
 * also filters by radius and orders closest-first, returning `distanceKm`.
 * The hook only owns the page number and resets it whenever the filter set
 * changes (the page wraps `setPage` for that).
 *
 * `search` is debounced so the input stays instant while the request (and the
 * resulting loading state) only fires once the user pauses typing. Every other
 * facet is applied immediately.
 */
export const useBrowsePetsPage = (
  filters: PetFilters,
  nearby: NearbySearch | null = null,
) => {
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<{
    key: string;
    pets: Pet[];
    total: number;
    limit: number;
    totalPages: number;
    error: string | null;
  } | null>(null);

  const [debouncedSearch, setDebouncedSearch] = useState(filters.search);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(filters.search), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [filters.search]);

  // Rebuilt from primitives so a keystroke (which only changes the raw search)
  // does not change this object's identity, and therefore fires no request.
  const query = useMemo<PetFilters>(
    () => ({ ...filters, search: debouncedSearch }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      debouncedSearch,
      filters.species,
      filters.breed,
      filters.ageGroup,
      filters.size,
      filters.gender,
      filters.temperament,
      filters.location,
      filters.status,
      filters.visibility,
    ],
  );

  // Identifies the request a result belongs to — a changed filter or page
  // reads as "loading" without any setState inside the effect itself.
  const requestKey = useMemo(
    () => `${page}|${JSON.stringify(query)}|${nearby ? JSON.stringify(nearby) : 'none'}`,
    [query, nearby, page],
  );

  useEffect(() => {
    let mounted = true;
    const fetchPage = async () => {
      try {
        const res = await listPetsPaginated({
          page,
          search: query.search,
          species: query.species,
          breed: query.breed,
          ageGroup: query.ageGroup,
          size: query.size,
          gender: query.gender,
          temperament: query.temperament,
          location: query.location,
          status: query.status,
          // The grid only lists pets still looking for a home.
          excludeAdopted: true,
          latitude: nearby?.latitude,
          longitude: nearby?.longitude,
          radiusKm: nearby?.radiusKm,
          sortByDistance: Boolean(nearby),
        });
        if (!mounted) return;
        const totalPages = res.totalPages ?? Math.max(1, Math.ceil(res.total / res.limit));
        // A filter change can leave us on a page that no longer exists.
        if (totalPages > 0 && page > totalPages) {
          setPage(totalPages);
          return;
        }
        setResult({
          key: requestKey,
          pets: res.items,
          total: res.total,
          limit: res.limit,
          totalPages,
          error: null,
        });
      } catch {
        if (!mounted) return;
        setResult({
          key: requestKey,
          pets: [],
          total: 0,
          limit: 10,
          totalPages: 1,
          error: 'Failed to load pets. Please try again.',
        });
      }
    };

    fetchPage();
    return () => {
      mounted = false;
    };
  }, [query, nearby, page, requestKey]);

  const loading = result?.key !== requestKey;

  return {
    pets: result?.pets ?? [],
    total: result?.total ?? 0,
    pageSize: result?.limit ?? 12,
    totalPages: result?.totalPages ?? 1,
    page,
    setPage,
    // Keeps the previous page on screen while the next one loads.
    loading,
    error: loading ? null : (result?.error ?? null),
  };
};

/**
 * Facet options (breeds, temperaments) and hero counts for the browse page —
 * one small request instead of downloading the whole catalogue.
 */
export const usePetFacets = () => {
  const [facets, setFacets] = useState<PetFacets | null>(null);

  useEffect(() => {
    let mounted = true;
    const fetchFacets = async () => {
      try {
        const data = await getPetFacets();
        if (mounted) setFacets(data);
      } catch {
        // Ignore failure
      }
    };
    fetchFacets();
    return () => {
      mounted = false;
    };
  }, []);

  return facets;
};

/**
 * First page of the public catalogue, used by the hero orbit + ticker. They
 * only ever show a handful of pets, so one 10-row request covers them.
 */
export const useHeroPets = () => {
  const [pets, setPets] = useState<Pet[]>([]);

  useEffect(() => {
    let mounted = true;
    const fetchHeroPets = async () => {
      try {
        const res = await listPetsPaginated({ page: 1 });
        if (mounted) setPets(res.items);
      } catch {
        // Ignore failure
      }
    };
    fetchHeroPets();
    return () => {
      mounted = false;
    };
  }, []);

  return pets;
};

/**
 * The handful of adoptable pets the landing page features.
 *
 * The backend does the filtering (public, `Available`, non-adopted) and the
 * limiting, so the home page no longer downloads the whole catalogue just to
 * render six cards.
 */
export const useFeaturedPets = (limit = 6) => {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchFeatured = async () => {
      try {
        const res = await listPetsPaginated({ page: 1, limit, status: 'Available', excludeAdopted: true });
        if (mounted) setPets(res.items);
      } catch {
        if (mounted) setPets([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchFeatured();
    return () => {
      mounted = false;
    };
  }, [limit]);

  return { pets, loading };
};

/**
 * One page of the shelter directory — the backend applies its own 10-per-page
 * default and answers with `total` / `totalPages`.
 */
export const useSheltersPage = () => {
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<{
    key: string;
    shelters: Shelter[];
    total: number;
    limit: number;
    totalPages: number;
    error: string | null;
  } | null>(null);

  const requestKey = String(page);

  useEffect(() => {
    let mounted = true;
    const fetchSheltersPage = async () => {
      try {
        const res = await listSheltersPaginated({ page });
        if (!mounted) return;
        const totalPages = res.totalPages ?? Math.max(1, Math.ceil(res.total / res.limit));
        // Data changes can leave us on a page that no longer exists.
        if (totalPages > 0 && page > totalPages) {
          setPage(totalPages);
          return;
        }
        setResult({
          key: requestKey,
          shelters: res.items,
          total: res.total,
          limit: res.limit,
          totalPages,
          error: null,
        });
      } catch {
        if (!mounted) return;
        setResult({
          key: requestKey,
          shelters: [],
          total: 0,
          limit: 10,
          totalPages: 1,
          error: 'Failed to load shelters. Please try again.',
        });
      }
    };

    fetchSheltersPage();
    return () => {
      mounted = false;
    };
  }, [page, requestKey]);

  const loading = result?.key !== requestKey;

  return {
    shelters: result?.shelters ?? [],
    total: result?.total ?? 0,
    pageSize: result?.limit ?? 10,
    totalPages: result?.totalPages ?? 1,
    page,
    setPage,
    loading,
    error: loading ? null : (result?.error ?? null),
  };
};

/** Network-wide header numbers for the shelters page (fetched once). */
export const useShelterStats = () => {
  const [stats, setStats] = useState<ShelterStats | null>(null);

  useEffect(() => {
    let mounted = true;
    const fetchStats = async () => {
      try {
        const data = await getShelterStats();
        if (mounted) setStats(data);
      } catch {
        // Ignore failure
      }
    };
    fetchStats();
    return () => {
      mounted = false;
    };
  }, []);

  return stats;
};

/**
 * One page of the adopter's applications — the backend's default page size
 * for this endpoint is 5, and `refresh()` re-reads the current page (the
 * page's Refresh button).
 */
export const useMyApplicationsPage = (applicantId?: string) => {
  const [page, setPage] = useState(1);
  const [reload, setReload] = useState(0);
  const [result, setResult] = useState<{
    key: string;
    applications: AdoptionApplication[];
    total: number;
    limit: number;
    totalPages: number;
    error: string | null;
  } | null>(null);

  const requestKey = `${page}|${reload}`;

  useEffect(() => {
    let mounted = true;
    const fetchApplications = async () => {
      try {
        const res = await listMyApplicationsPaginated({ page, applicantId });
        if (!mounted) return;
        const totalPages = res.totalPages ?? Math.max(1, Math.ceil(res.total / res.limit));
        if (totalPages > 0 && page > totalPages) {
          setPage(totalPages);
          return;
        }
        setResult({
          key: requestKey,
          applications: res.items,
          total: res.total,
          limit: res.limit,
          totalPages,
          error: null,
        });
      } catch {
        if (!mounted) return;
        setResult({
          key: requestKey,
          applications: [],
          total: 0,
          limit: 5,
          totalPages: 1,
          error: 'Failed to load your applications. Please try again.',
        });
      }
    };

    fetchApplications();
    return () => {
      mounted = false;
    };
  }, [applicantId, page, reload, requestKey]);

  const loading = result?.key !== requestKey;

  return {
    applications: result?.applications ?? [],
    total: result?.total ?? 0,
    pageSize: result?.limit ?? 5,
    totalPages: result?.totalPages ?? 1,
    page,
    setPage,
    loading,
    error: loading ? null : (result?.error ?? null),
    refresh: () => setReload((value) => value + 1),
  };
};

/**
 * Status counters across ALL of an adopter's applications. `reload` lets a
 * page refetch the counters after an application is withdrawn.
 */
export const useMyApplicationSummary = (applicantId?: string, reload = 0) => {
  const [summary, setSummary] = useState<ApplicationSummary | null>(null);

  useEffect(() => {
    let mounted = true;
    const fetchSummary = async () => {
      try {
        const data = await getMyApplicationSummary(applicantId);
        if (mounted) setSummary(data);
      } catch {
        // Summary bar degrades to placeholders when the counts are unavailable.
      }
    };
    fetchSummary();
    return () => {
      mounted = false;
    };
  }, [applicantId, reload]);

  return summary;
};

/**
 * Shelter-portal inventory: the logged-in shelter's own listings
 * (public + private) via GET /shelter/listings. Falls back to the public
 * catalogue filtered by shelter in demo mode (no session).
 */
export const useShelterListings = (shelterId?: string | null) => {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setPets(await petService.listMine(shelterId ?? undefined));
    } catch {
      setError('Failed to load listings. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [shelterId]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await petService.listMine(shelterId ?? undefined);
        if (mounted) setPets(data);
      } catch {
        if (mounted) setError('Failed to load listings.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [shelterId]);

  return { pets, setPets, loading, error, refresh };
};

export const useUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchUsers = async () => {
      try {
        const data = await userService.list();
        if (mounted) {
          setUsers(data);
          setLoading(false);
        }
      } catch {
        if (mounted) {
          setLoading(false);
        }
      }
    };
    fetchUsers();
    return () => {
      mounted = false;
    };
  }, []);

  return { users, setUsers, loading };
};

export const useApplications = (applicantId?: string, mode?: 'mine' | 'shelter') => {
  const [applications, setApplications] = useState<AdoptionApplication[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (): Promise<AdoptionApplication[]> => {
    const hasSession = sessionStore.has();
    // Backend-first when a real session exists so adopter submissions and the
    // shelter table read the same Postgres rows. Fall back to the in-memory
    // mocks for demo mode (no token) or when the API is unreachable.
    if (hasSession) {
      try {
        if (mode === 'shelter' || !applicantId) {
          return await adoptionApplicationService.listForShelter();
        }
        return await adoptionApplicationService.listMine();
      } catch {
        // fall through to mocks below
      }
    }
    return applicantId
      ? applicationService.listByApplicant(applicantId)
      : applicationService.list();
  }, [applicantId, mode]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setApplications(await load());
    } finally {
      setLoading(false);
    }
  }, [load]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await load();
        if (mounted) setApplications(data);
      } catch {
        if (mounted) setApplications([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [load]);

  return { applications, loading, refresh, setApplications };
};
