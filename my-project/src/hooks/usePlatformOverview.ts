import { useMemo } from 'react';
import type { AdoptionApplication, Pet, Shelter, User } from '@/types';
import { useShelterOverview } from './useShelterOverview';
import type { ChartPoint, ShelterOverview } from './useShelterOverview';

export interface PlatformStats {
  totalShelters: number;
  locations: number;
  totalUsers: number;
  adopters: number;
  shelterStaff: number;
  platformAdmins: number;
}

export interface ShelterSummary {
  shelter: Shelter;
  petCount: number;
  publicPets: number;
  pendingApplications: number;
  staff: number;
}

export interface PlatformOverview extends ShelterOverview {
  platform: PlatformStats;
  shelterSummaries: ShelterSummary[];
  listingsByShelter: ChartPoint[];
  usersByRole: ChartPoint[];
}

/**
 * Platform-admin overview aggregation.
 * Reuses the shelter-level chart/stat derivation (same global pets + applications)
 * and layers on top the entities only the platform admin sees: shelters and users.
 */
export const usePlatformOverview = (
  pets: Pet[],
  applications: AdoptionApplication[],
  shelters: Shelter[],
  users: User[],
): PlatformOverview => {
  const shelterOverview = useShelterOverview(pets, applications);

  return useMemo(() => {
    const adopters = users.filter((u) => u.role === 'adopter').length;
    const shelterStaff = users.filter((u) => u.role === 'shelter_staff').length;
    const platformAdmins = users.filter((u) => u.role === 'platform_admin').length;

    const shelterSummaries = shelters
      .map((shelter) => {
        const shelterPets = pets.filter((p) => p.shelterId === shelter.id);
        const petIds = new Set(shelterPets.map((p) => p.id));
        return {
          shelter,
          petCount: shelterPets.length,
          publicPets: shelterPets.filter((p) => p.visibility === 'public').length,
          pendingApplications: applications.filter(
            (a) =>
              (a.status === 'Submitted' || a.status === 'Under Review') &&
              petIds.has(a.petId),
          ).length,
          staff: users.filter((u) => u.shelterId === shelter.id).length,
        };
      })
      .sort(
        (a, b) =>
          b.petCount - a.petCount || a.shelter.name.localeCompare(b.shelter.name),
      );

    const listingsByShelter = shelterSummaries.map(({ shelter, petCount }) => ({
      name: shelter.name,
      value: petCount,
    }));

    const usersByRole = [
      { name: 'Adopters', value: adopters },
      { name: 'Shelter staff', value: shelterStaff },
      { name: 'Admins', value: platformAdmins },
    ].filter((point) => point.value > 0);

    return {
      ...shelterOverview,
      platform: {
        totalShelters: shelters.length,
        locations: new Set(shelters.map((s) => s.location)).size,
        totalUsers: users.length,
        adopters,
        shelterStaff,
        platformAdmins,
      },
      shelterSummaries,
      listingsByShelter,
      usersByRole,
    };
  }, [shelterOverview, shelters, pets, applications, users]);
};
