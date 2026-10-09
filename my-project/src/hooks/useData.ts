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
import { ALL_FILTERS } from '@/hooks/usePetFilter';
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
    shelterService.list().then((data) => {
      if (mounted) {
        setShelters(data);
        setLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  return { shelters, setShelters, loading };
};

/**
 * One page of the browse grid, paginated by the backend.
 *
 * `filters` come straight from `usePetFilter` and are forwarded to
 * `GET /pets`, which applies them together with its own 10-per-page limit and
 * answers with `total` / `totalPages`. The hook only owns the page number and
 * resets it whenever the filter set changes (the page wraps `setPage` for that).
 */
export const useBrowsePetsPage = (filters: PetFilters) => {
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<{
    key: string;
    pets: Pet[];
    total: number;
    limit: number;
    totalPages: number;
    error: string | null;
  } | null>(null);

  // Identifies the request a result belongs to — a changed filter or page
  // reads as "loading" without any setState inside the effect itself.
  const requestKey = useMemo(() => `${page}|${JSON.stringify(filters)}`, [page, filters]);

  useEffect(() => {
    let mounted = true;
    listPetsPaginated({
      page,
      search: filters.search,
      species: filters.species === ALL_FILTERS ? undefined : filters.species,
      breed: filters.breed === ALL_FILTERS ? undefined : filters.breed,
      ageGroup: filters.ageGroup === ALL_FILTERS ? undefined : filters.ageGroup,
      size: filters.size === ALL_FILTERS ? undefined : filters.size,
      gender: filters.gender === ALL_FILTERS ? undefined : filters.gender,
      temperament: filters.temperament === ALL_FILTERS ? undefined : filters.temperament,
      location: filters.location === ALL_FILTERS ? undefined : filters.location,
      status: filters.status === ALL_FILTERS ? undefined : filters.status,
      // The grid only lists pets still looking for a home.
      excludeAdopted: true,
    })
      .then((res) => {
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
      })
      .catch(() => {
        if (!mounted) return;
        setResult({
          key: requestKey,
          pets: [],
          total: 0,
          limit: 10,
          totalPages: 1,
          error: 'Failed to load pets. Please try again.',
        });
      });
    return () => {
      mounted = false;
    };
  }, [filters, page, requestKey]);

  const loading = result?.key !== requestKey;

  return {
    pets: result?.pets ?? [],
    total: result?.total ?? 0,
    pageSize: result?.limit ?? 10,
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
    getPetFacets().then((data) => {
      if (mounted) setFacets(data);
    });
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
    listPetsPaginated({ page: 1 }).then((res) => {
      if (mounted) setPets(res.items);
    });
    return () => {
      mounted = false;
    };
  }, []);

  return pets;
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
    listSheltersPaginated({ page })
      .then((res) => {
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
      })
      .catch(() => {
        if (!mounted) return;
        setResult({
          key: requestKey,
          shelters: [],
          total: 0,
          limit: 10,
          totalPages: 1,
          error: 'Failed to load shelters. Please try again.',
        });
      });
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
    getShelterStats().then((data) => {
      if (mounted) setStats(data);
    });
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
    listMyApplicationsPaginated({ page, applicantId })
      .then((res) => {
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
      })
      .catch(() => {
        if (!mounted) return;
        setResult({
          key: requestKey,
          applications: [],
          total: 0,
          limit: 5,
          totalPages: 1,
          error: 'Failed to load your applications. Please try again.',
        });
      });
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

/** Status counters across ALL of an adopter's applications (fetched once). */
export const useMyApplicationSummary = (applicantId?: string) => {
  const [summary, setSummary] = useState<ApplicationSummary | null>(null);

  useEffect(() => {
    let mounted = true;
    getMyApplicationSummary(applicantId)
      .then((data) => {
        if (mounted) setSummary(data);
      })
      .catch(() => {
        // Summary bar degrades to placeholders when the counts are unavailable.
      });
    return () => {
      mounted = false;
    };
  }, [applicantId]);

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
    userService.list().then((data) => {
      if (mounted) {
        setUsers(data);
        setLoading(false);
      }
    });
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
