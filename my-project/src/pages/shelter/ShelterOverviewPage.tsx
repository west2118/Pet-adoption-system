import { useQuery } from '@tanstack/react-query';
import {
  Archive,
  ArrowRight,
  CalendarClock,
  ClipboardList,
  Clock3,
  HeartHandshake,
  Inbox,
  Layers,
  MessageCircleQuestion,
  Package,
  PawPrint,
  PieChart,
  TrendingUp,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  ChartCard,
  ErrorState,
  RefreshButton,
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
import { UpcomingVisitsChart } from '@/components/features/charts/UpcomingVisitsChart';
import { Button } from '@/components/ui/button';
import { useRefresh } from '@/hooks/useRefresh';
import { getShelterOverview } from '@/services/api';
import { describeApiError } from '@/utils/errors';

export const ShelterOverviewPage = () => {
  // Every figure below is counted in SQL (GET /shelter/overview, JWT-scoped).
  // React Query owns the request, so the header refresh and the error retry
  // refetch the same query instead of keeping a second copy of the loader state.
  const {
    data: overview,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: ['shelterOverview'],
    queryFn: getShelterOverview,
  });

  const { isRefreshing, refresh } = useRefresh(refetch);
  const showLoading = isLoading || isFetching || isRefreshing;

  // Keep the page header visible while the dashboard content loads.
  const pageHeader = (
    <SectionHeader
      title="Dashboard"
      subtitle="A snapshot of your listings, applications, and adoption performance."
      actions={overview ? <RefreshButton onRefresh={refresh} /> : undefined}
    />
  );

  // Skeleton on first load and during a refetch, matching the shelter tables.
  if (showLoading) {
    return (
      <div className="w-full px-4 py-6 sm:px-6">
        {pageHeader}
        <ShelterOverviewSkeleton />
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="w-full px-4 py-6 sm:px-6">
        {pageHeader}
        <div className="mt-6">
          <ErrorState
            title="Could not load the overview"
            description={`${describeApiError(
              error,
              'Failed to load the shelter overview.',
            )} Check that the backend is running and your staff account has a shelter assigned.`}
            onRetry={() => void refetch()}
          />
        </div>
      </div>
    );
  }

  const { stats } = overview;

  return (
    <div className="w-full px-4 py-6 sm:px-6">
      {pageHeader}

      {/* Summary stats */}
      <SummaryStatGrid columns={3} className="mt-6">
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
        <SummaryStatCard
          title="Inquiries"
          value={stats.openInquiries}
          icon={MessageCircleQuestion}
          subtitle="Not resolved"
        />
        <SummaryStatCard
          title="Visit requests"
          value={stats.openVisits}
          icon={CalendarClock}
          subtitle="Not resolved"
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

      <ChartCard
        title="Upcoming visits"
        description="Confirmed meet-and-greets scheduled over the next 14 days."
        icon={CalendarClock}
        className="mt-4"
      >
        <UpcomingVisitsChart data={overview.upcomingVisitTrend} />
      </ChartCard>

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
