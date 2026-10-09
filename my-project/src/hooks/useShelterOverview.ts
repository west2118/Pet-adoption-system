import { useMemo } from 'react';
import type { AdoptionApplication, ApplicationStatus, Pet } from '@/types';

const MONTH_LABELS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

const APPLICATION_STATUS_ORDER: ApplicationStatus[] = [
  'Submitted',
  'Under Review',
  'Approved',
  'Rejected',
  'Adopted',
];

const SPECIES_LABELS: Record<Pet['species'], string> = {
  dog: 'Dogs',
  cat: 'Cats',
  rabbit: 'Rabbits',
  bird: 'Birds',
  other: 'Other',
};

export interface ShelterOverviewStats {
  totalPets: number;
  publicListings: number;
  privateInventory: number;
  pendingApplications: number;
  openListings: number;
  successfulAdoptions: number;
  adoptionRate: number;
}

export interface TrendPoint {
  month: string;
  applications: number;
  approved: number;
}

export interface ChartPoint {
  name: string;
  value: number;
}

export interface StatusPoint {
  status: ApplicationStatus;
  count: number;
}

export interface ShelterOverview {
  stats: ShelterOverviewStats;
  applicationsTrend: TrendPoint[];
  petsBySpecies: ChartPoint[];
  listingsByStatus: ChartPoint[];
  applicationsByStatus: StatusPoint[];
  recentApplications: AdoptionApplication[];
  inventory: Pet[];
}

const monthLabel = (isoMonth: string): string => {
  const [year, month] = isoMonth.split('-');
  const index = Number(month) - 1;
  const label = MONTH_LABELS[index] ?? month;
  return `${label} ${year.slice(2)}`;
};

export const useShelterOverview = (
  pets: Pet[],
  applications: AdoptionApplication[],
): ShelterOverview => {
  return useMemo(() => {
    const publicListings = pets.filter((p) => p.visibility === 'public').length;
    const privateInventory = pets.filter((p) => p.visibility === 'private').length;
    const pendingApplications = applications.filter(
      (a) => a.status === 'Submitted' || a.status === 'Under Review',
    ).length;
    const openListings = pets.filter((p) => p.status === 'Available').length;
    const successfulAdoptions = pets.filter((p) => p.status === 'Adopted').length;
    const adoptionRate =
      applications.length === 0
        ? 0
        : Math.round((successfulAdoptions / applications.length) * 100);

    // Applications over time — bucket by calendar month, then sort chronologically.
    const trendMap = new Map<string, TrendPoint>();
    applications.forEach((a) => {
      const key = a.submittedAt.slice(0, 7);
      const point = trendMap.get(key) ?? { month: monthLabel(key), applications: 0, approved: 0 };
      point.applications += 1;
      if (a.status === 'Approved' || a.status === 'Adopted') point.approved += 1;
      trendMap.set(key, point);
    });
    const applicationsTrend = [...trendMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, point]) => point);

    const speciesMap = new Map<string, number>();
    pets.forEach((p) => {
      const label = SPECIES_LABELS[p.species];
      speciesMap.set(label, (speciesMap.get(label) ?? 0) + 1);
    });
    const petsBySpecies = [...speciesMap.entries()].map(([name, value]) => ({ name, value }));

    const petStatusOrder: Pet['status'][] = ['Available', 'In Process', 'Adopted', 'Fostered'];
    const listingsByStatus = petStatusOrder
      .map((status) => ({ name: status, value: pets.filter((p) => p.status === status).length }))
      .filter((point) => point.value > 0);

    const applicationsByStatus = APPLICATION_STATUS_ORDER.map((status) => ({
      status,
      count: applications.filter((a) => a.status === status).length,
    })).filter((point) => point.count > 0);

    const recentApplications = [...applications]
      .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
      .slice(0, 5);

    const inventory = [...pets]
      .sort((a, b) => b.dateAdded.localeCompare(a.dateAdded))
      .slice(0, 5);

    return {
      stats: {
        totalPets: pets.length,
        publicListings,
        privateInventory,
        pendingApplications,
        openListings,
        successfulAdoptions,
        adoptionRate,
      },
      applicationsTrend,
      petsBySpecies,
      listingsByStatus,
      applicationsByStatus,
      recentApplications,
      inventory,
    };
  }, [pets, applications]);
};
