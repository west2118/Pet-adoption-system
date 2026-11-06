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
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ChartCard,
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
  const [reloadIndex, setReloadIndex] = useState(0);

  useEffect(() => {
    let mounted = true;
    getAdminStats()
      .then((s) => {
        if (mounted) {
          setAdminStats(s);
          setStatsError(null);
        }
      })
      .catch(() => {
        if (mounted) setStatsError('Failed to load dashboard figures.');
      });
    return () => {
      mounted = false;
    };
  }, [reloadIndex]);

  const handleRetry = () => {
    setStatsError(null);
    setAdminStats(null);
    setReloadIndex((i) => i + 1);
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
      />

      <div className="mt-6 space-y-4">
        {statsError ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-5 text-sm">
            <p className="font-semibold text-destructive">Could not load dashboard figures.</p>
            <p className="mt-1 text-muted-foreground">
              {statsError} Check that the backend is running and you are signed in as a platform
              admin.
            </p>
            <Button size="sm" variant="outline" className="mt-3" onClick={handleRetry}>
              Retry
            </Button>
          </div>
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

