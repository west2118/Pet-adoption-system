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
import { useEffect, useState } from 'react';
import {
  ChartCard,
  SectionHeader,
  ShelterOverviewSkeleton,
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
import { getShelterOverview } from '@/services/api';
import type { ShelterOverviewData } from '@/services/api';

export const ShelterOverviewPage = () => {
  // Every figure below is counted in SQL (GET /shelter/overview, JWT-scoped).
  // Dynamic only — failures render an explicit error, never local mock math.
  const [overview, setOverview] = useState<ShelterOverviewData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    getShelterOverview()
      .then((data) => {
        if (mounted) {
          setOverview(data);
          setError(null);
        }
      })
      .catch(() => {
        if (mounted) setError('Failed to load shelter overview.');
      });
    return () => {
      mounted = false;
    };
  }, []);

  if (!overview && !error) {
    return <ShelterOverviewSkeleton />;
  }

  if (!overview) {
    return (
      <div className="w-full px-4 py-6 sm:px-6">
        <SectionHeader
          title="Shelter overview"
          subtitle="A snapshot of your listings, applications, and adoption performance."
        />
        <div className="mt-6 rounded-lg border border-destructive/30 bg-destructive/5 p-5 text-sm">
          <p className="font-semibold text-destructive">Could not load the overview.</p>
          <p className="mt-1 text-muted-foreground">
            {error} Check that the backend is running and your staff account has a
            shelter assigned.
          </p>
          <Button
            size="sm"
            variant="outline"
            className="mt-3"
            onClick={() => {
              setError(null);
              setOverview(null);
              getShelterOverview()
                .then((data) => setOverview(data))
                .catch(() => setError('Failed to load shelter overview.'));
            }}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const { stats } = overview;

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
          <ApplicationsTrendChart data={overview.applicationsTrend} />
        </ChartCard>

        <ChartCard
          title="Pets by species"
          description="Distribution across your inventory."
          icon={PieChart}
        >
          <PetsBySpeciesChart data={overview.petsBySpecies} />
        </ChartCard>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Applications by status"
          description="Where every request currently stands."
          icon={ClipboardList}
        >
          <ApplicationsByStatusChart data={overview.applicationsByStatus} />
        </ChartCard>

        <ChartCard
          title="Listings by status"
          description="Availability of your pet inventory."
          icon={Layers}
        >
          <ListingsByStatusChart data={overview.listingsByStatus} />
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
        isEmpty={overview.recentApplications.length === 0}
        emptyTitle="No applications yet"
        emptyDescription="Incoming adoption requests will appear here."
        contentClassName="px-0"
        className="mt-4"
      >
        <RecentApplicationsTable
          applications={overview.recentApplications}
          pets={overview.recentPets}
        />
      </TableCard>

      <TableCard
        title="Inventory"
        description={`Showing ${overview.inventory.length} newest of ${stats.totalPets} pets in your shelter.`}
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
        <InventoryTable pets={overview.inventory} />
      </TableCard>
    </div>
  );
};
