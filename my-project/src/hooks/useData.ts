import { useCallback, useEffect, useState } from 'react';
import { applicationService, petService, shelterService, userService } from '@/services/api';
import { adoptionApplicationService } from '@/services/adoptionApplicationService';
import { tokenStore } from '@/lib/apiClient';
import type { AdoptionApplication, Pet, Shelter, User } from '@/types';

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
    const hasSession = Boolean(tokenStore.get());
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
