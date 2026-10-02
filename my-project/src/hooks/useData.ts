import { useCallback, useEffect, useState } from 'react';
import { applicationService, petService, shelterService, userService } from '@/services/api';
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

export const useApplications = (applicantId?: string) => {
  const [applications, setApplications] = useState<AdoptionApplication[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const data = applicantId
      ? await applicationService.listByApplicant(applicantId)
      : await applicationService.list();
    setApplications(data);
    setLoading(false);
  }, [applicantId]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const data = applicantId
        ? await applicationService.listByApplicant(applicantId)
        : await applicationService.list();
      if (mounted) {
        setApplications(data);
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [applicantId, refresh]);

  return { applications, loading, refresh, setApplications };
};
