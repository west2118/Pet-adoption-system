import {
  ArrowRight,
  Building2,
  Clock3,
  HeartHandshake,
  Inbox,
  Layers,
  PawPrint,
  PieChart,
  Users,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ChartCard,
  ErrorState,
  RefreshButton,
  SectionHeader,
  SummaryStatCard,
  SummaryStatCardSkeleton,
  SummaryStatGrid,
  TableCard,
} from '@/components/shared';
import { RecentApplicationsTable } from '@/components/features/RecentApplicationsTable';
import { SheltersSummaryTable } from '@/components/features/SheltersSummaryTable';
import { ListingsByShelterChart } from '@/components/features/charts/ListingsByShelterChart';
import { UsersByRoleChart } from '@/components/features/charts/UsersByRoleChart';
import { Button } from '@/components/ui/button';
import { getAdminStats } from '@/services/api';
import type { AdminStats } from '@/services/api';

export const AdminOverviewPage = () => {
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    try {
      const stats = await getAdminStats();
      setAdminStats(stats);
      setStatsError(null);
    } catch {
      setStatsError('Failed to load dashboard figures.');
    }
  }, []);

  useEffect(() => {
    // Loading state is owned by the loader.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadStats();
  }, [loadStats]);

  const handleRetry = () => {
    setStatsError(null);
    setAdminStats(null);
    void loadStats();
  };

  const totalShelters = adminStats?.shelters.total ?? 0;
  const locations = adminStats?.shelters.locations ?? 0;
  const totalUsersCount = adminStats?.users.total ?? 0;
  const adopters = adminStats?.users.adopters ?? 0;
  const shelterStaff = adminStats?.users.staff ?? 0;
  const platformAdmins = adminStats?.users.admins ?? 0;

  const totalPets = adminStats?.pets.total ?? 0;
  const publicListings = adminStats?.pets.public ?? 0;
  const privateInventory = adminStats?.pets.private ?? 0;

  const pendingApplications =
    (adminStats?.applications.submitted ?? 0) + (adminStats?.applications.under_review ?? 0);
  const successfulAdoptions = adminStats?.applications.approved ?? 0;
  const totalDecisions =
    (adminStats?.applications.total ?? 0) - pendingApplications;
  const adoptionRate =
    totalDecisions > 0 ? Math.round((successfulAdoptions / totalDecisions) * 100) : 0;

  const usersByRoleData = [
    { name: 'Adopters', value: adopters },
    { name: 'Shelter staff', value: shelterStaff },
    { name: 'Platform admins', value: platformAdmins },
  ];

  const overviewLoading = !adminStats && !statsError;

  return (
    <div className="w-full px-4 py-6 sm:px-6">
      <SectionHeader
        title="Platform administration"
        subtitle="Developer oversight — all shelters, all users, and global metrics."
        actions={<RefreshButton onRefresh={loadStats} />}
      />

      <div className="mt-6 space-y-4">
        {statsError ? (
          <ErrorState
            title="Could not load dashboard figures"
            description={`${statsError} Check that the backend is running and you are signed in as a platform admin.`}
            onRetry={handleRetry}
          />
        ) : overviewLoading ? (
          <SummaryStatGrid>
            <SummaryStatCardSkeleton />
            <SummaryStatCardSkeleton />
            <SummaryStatCardSkeleton />
            <SummaryStatCardSkeleton />
            <SummaryStatCardSkeleton />
          </SummaryStatGrid>
        ) : (
          <>
            <SummaryStatGrid>
              <SummaryStatCard
                title="Shelters"
                value={totalShelters}
                icon={Building2}
                subtitle={`${locations} ${locations === 1 ? 'location' : 'locations'}`}
              />
              <SummaryStatCard
                title="Users"
                value={totalUsersCount}
                icon={Users}
                subtitle={`${adopters} adopters · ${shelterStaff} staff · ${platformAdmins} ${
                  platformAdmins === 1 ? 'admin' : 'admins'
                }`}
              />
              <SummaryStatCard
                title="Pets"
                value={totalPets}
                icon={PawPrint}
                subtitle={`${publicListings} public · ${privateInventory} private`}
              />
              <SummaryStatCard
                title="Pending applications"
                value={pendingApplications}
                icon={Clock3}
                subtitle="Needs shelter review"
              />
              <SummaryStatCard
                title="Adoptions"
                value={successfulAdoptions}
                icon={HeartHandshake}
                subtitle={`${adoptionRate}% adoption rate`}
              />
            </SummaryStatGrid>

            {/* Platform distribution & composition */}
            <div className="grid gap-4 lg:grid-cols-2">
              <ChartCard
                title="Listings by shelter"
                description="Where the platform's inventory lives."
                icon={Layers}
              >
                <ListingsByShelterChart data={adminStats?.listingsByShelter ?? []} />
              </ChartCard>

              <ChartCard
                title="Users by role"
                description="Composition of everyone on the platform."
                icon={PieChart}
              >
                <UsersByRoleChart data={usersByRoleData} />
              </ChartCard>
            </div>

            {/* Tables */}
            <TableCard
              title="Shelters"
              description="Listings, demand, and staff per partner shelter."
              icon={Building2}
              action={
                <Link to="/admin/shelters">
                  <Button variant="outline" size="sm">
                    View all <ArrowRight className="size-3.5" />
                  </Button>
                </Link>
              }
              isEmpty={(adminStats?.shelterSummaries.length ?? 0) === 0}
              emptyTitle="No shelters"
              emptyDescription="Registered partner shelters will appear here."
              contentClassName="px-0"
            >
              <SheltersSummaryTable
                shelters={adminStats?.shelterSummaries ?? []}
                loading={false}
              />
            </TableCard>

            <TableCard
              title="Recent applications"
              description="Latest adoption requests across the platform."
              icon={Inbox}
              isEmpty={(adminStats?.recentApplications.length ?? 0) === 0}
              emptyTitle="No applications yet"
              emptyDescription="Adoption requests will appear here."
              contentClassName="px-0"
            >
              <RecentApplicationsTable
                applications={adminStats?.recentApplications ?? []}
                pets={adminStats?.recentPets ?? []}
                loading={false}
              />
            </TableCard>
          </>
        )}
      </div>
    </div>
  );
};

