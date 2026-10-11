import { mapApplication, mapPet } from '../utils/mappers.js';
import {
  APP_STATUSES,
  PET_STATUSES,
  getShelterOverview as fetchShelterOverview,
} from '../repositories/overviewRepository.js';

const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const SPECIES_LABELS = {
  dog: 'Dogs',
  cat: 'Cats',
  rabbit: 'Rabbits',
  bird: 'Birds',
  other: 'Other',
};

const monthLabel = (ym) => {
  const [year, month] = ym.split('-');
  const label = MONTH_LABELS[Number(month) - 1] ?? month;
  return `${label} ${year.slice(2)}`;
};

/**
 * Shapes the shelter overview payload with the exact field names the
 * dashboard cards and charts render — the frontend displays, never computes.
 */
export const getShelterOverview = async (shelterId) => {
  const data = await fetchShelterOverview(shelterId);

  const byStatus = new Map(data.petStatuses.map((r) => [r.status, r.count]));
  const byAppStatus = new Map(data.appStatuses.map((r) => [r.status, r.count]));

  const adoptionRate =
    data.appKpis.total === 0
      ? 0
      : Math.round((data.petKpis.adopted / data.appKpis.total) * 100);

  return {
    stats: {
      totalPets: data.petKpis.total,
      publicListings: data.petKpis.public,
      privateInventory: data.petKpis.private,
      pendingApplications: data.appKpis.pending,
      openListings: data.petKpis.open,
      successfulAdoptions: data.petKpis.adopted,
      adoptionRate,
    },
    applicationsTrend: data.trend.map((r) => ({
      month: monthLabel(r.month),
      applications: r.applications,
      approved: r.approved,
    })),
    petsBySpecies: data.species.map((r) => ({
      name: SPECIES_LABELS[r.species] ?? r.species,
      value: r.count,
    })),
    listingsByStatus: PET_STATUSES.map((status) => ({
      name: status,
      value: byStatus.get(status) ?? 0,
    })).filter((point) => point.value > 0),
    applicationsByStatus: APP_STATUSES.map((status) => ({
      status,
      count: byAppStatus.get(status) ?? 0,
    })).filter((point) => point.count > 0),
    recentApplications: data.recentApplications.map((r) => mapApplication(r)),
    recentPets: data.recentPets.map((r) => mapPet(r)),
    inventory: data.inventory.map((r) => mapPet(r)),
  };
};
