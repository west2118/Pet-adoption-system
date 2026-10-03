import {
  Archive,
  ArrowRight,
  ClipboardList,
  Clock3,
  HeartHandshake,
  Inbox,
  Layers,
  Package,
  PawPrint,
  PieChart,
  TrendingUp,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import {
  ChartCard,
  SectionHeader,
  SummaryStatCard,
  SummaryStatGrid,
  TableCard,
} from '@/components/shared';
import { RecentApplicationsTable } from '@/components/features/RecentApplicationsTable';
import { InventoryTable } from '@/components/features/InventoryTable';
import { ApplicationsTrendChart } from '@/components/features/charts/ApplicationsTrendChart';
import { PetsBySpeciesChart } from '@/components/features/charts/PetsBySpeciesChart';
import { ApplicationsByStatusChart } from '@/components/features/charts/ApplicationsByStatusChart';
import { ListingsByStatusChart } from '@/components/features/charts/ListingsByStatusChart';
import { Button } from '@/components/ui/button';
import { useApplications, usePets, useShelters } from '@/hooks/useData';
import { useAuth } from '@/hooks/useAuth';
import { useShelterOverview } from '@/hooks/useShelterOverview';

export const ShelterOverviewPage = () => {
  const { user } = useAuth();
  const { pets, loading } = usePets();
  const { shelters } = useShelters();
  const { applications } = useApplications();

  // Stats, charts, and recent lists cover this shelter's own pets only —
  // other shelters' records never leak into the overview.
  const myShelterId = user?.shelterId ?? shelters[0]?.id ?? null;
  const myPets = useMemo(
    () => (myShelterId ? pets.filter((p) => p.shelterId === myShelterId) : pets),
    [pets, myShelterId],
  );
  const myPetIds = useMemo(() => new Set(myPets.map((p) => p.id)), [myPets]);
  const myApplications = useMemo(
    () =>
      myShelterId
        ? applications.filter((a) => myPetIds.has(a.petId))
        : applications,
    [applications, myPetIds, myShelterId],
  );
  const {
    stats,
    applicationsTrend,
    petsBySpecies,
    applicationsByStatus,
    listingsByStatus,
    recentApplications,
    inventory,
  } = useShelterOverview(myPets, myApplications);

  return (
    <div className="w-full px-4 py-6 sm:px-6">
      <SectionHeader
        title="Shelter overview"
        subtitle="A snapshot of your listings, applications, and adoption performance."
      />

      {/* Summary stats */}
      <SummaryStatGrid columns={4} className="mt-6">
        <SummaryStatCard
          title="Total pets"
          value={stats.totalPets}
          icon={PawPrint}
          subtitle={`${stats.openListings} open for adoption`}
        />
        <SummaryStatCard
          title="Private inventory"
          value={stats.privateInventory}
          icon={Archive}
          subtitle="Internal records"
        />
        <SummaryStatCard
          title="Pending applications"
          value={stats.pendingApplications}
          icon={Clock3}
          subtitle="Needs review"
        />
        <SummaryStatCard
          title="Successful adoptions"
          value={stats.successfulAdoptions}
          icon={HeartHandshake}
          subtitle={`${stats.adoptionRate}% of applications`}
        />
      </SummaryStatGrid>

      {/* Charts */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <ChartCard
          title="Applications over time"
          description="Monthly applications received versus approved or adopted."
          icon={TrendingUp}
          className="lg:col-span-2"
        >
          <ApplicationsTrendChart data={applicationsTrend} />
        </ChartCard>

        <ChartCard
          title="Pets by species"
          description="Distribution across your inventory."
          icon={PieChart}
        >
          <PetsBySpeciesChart data={petsBySpecies} />
        </ChartCard>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Applications by status"
          description="Where every request currently stands."
          icon={ClipboardList}
        >
          <ApplicationsByStatusChart data={applicationsByStatus} />
        </ChartCard>

        <ChartCard
          title="Listings by status"
          description="Availability of your pet inventory."
          icon={Layers}
        >
          <ListingsByStatusChart data={listingsByStatus} />
        </ChartCard>
      </div>

      {/* Tables */}
      <TableCard
        title="Recent applications"
        description="Latest incoming adoption requests."
        icon={Inbox}
        action={
          <Link to="/shelter/applications">
            <Button variant="outline" size="sm">
              View all <ArrowRight className="size-3.5" />
            </Button>
          </Link>
        }
        isEmpty={recentApplications.length === 0}
        emptyTitle="No applications yet"
        emptyDescription="Incoming adoption requests will appear here."
        contentClassName="px-0"
        className="mt-4"
      >
        <RecentApplicationsTable applications={recentApplications} pets={pets} />
      </TableCard>

      <TableCard
        title="Inventory"
        description={
          loading
            ? 'Loading listings…'
            : `Showing ${inventory.length} of ${stats.totalPets} pets in your shelter.`
        }
        icon={Package}
        action={
          <Link to="/shelter/listings">
            <Button variant="outline" size="sm">
              View all <ArrowRight className="size-3.5" />
            </Button>
          </Link>
        }
        contentClassName="px-0"
        className="mt-4"
      >
        <InventoryTable pets={inventory} />
      </TableCard>
    </div>
  );
};
