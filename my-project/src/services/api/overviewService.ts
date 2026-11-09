import { apiRequest } from '@/lib/apiClient';
import type { AdoptionApplication, ApplicationStatus, Pet } from '@/types';

/** Shelter-portal overview aggregates (GET /shelter/overview, JWT-scoped). */
export interface ShelterOverviewData {
  stats: {
    totalPets: number;
    publicListings: number;
    privateInventory: number;
    pendingApplications: number;
    openListings: number;
    successfulAdoptions: number;
    adoptionRate: number;
    totalInquiries: number;
    openInquiries: number;
    totalVisits: number;
    openVisits: number;
    pendingVisits: number;
    upcomingVisits: number;
  };
  applicationsTrend: { month: string; applications: number; approved: number }[];
  petsBySpecies: { name: string; value: number }[];
  listingsByStatus: { name: string; value: number }[];
  applicationsByStatus: { status: ApplicationStatus; count: number }[];
  upcomingVisitTrend: { date: string; label: string; count: number }[];
  recentApplications: AdoptionApplication[];
  recentPets: Pet[];
  inventory: Pet[];
}

export const getShelterOverview = async (): Promise<ShelterOverviewData> => {
  const data = await apiRequest<{ overview: ShelterOverviewData }>('/shelter/overview', {
    auth: 'full',
  });
  return data.overview;
};
