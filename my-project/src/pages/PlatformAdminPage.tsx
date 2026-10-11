import {
  ArrowRight,
  Building2,
  Clock3,
  Eye,
  HeartHandshake,
  Inbox,
  Layers,
  PawPrint,
  Pencil,
  PieChart,
  Plus,
  Search,
  Trash2,
  Users,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  ChartCard,
  DetailsModal,
  RecordCard,
  RecordCardSkeleton,
  SectionHeader,
  SlideOver,
  SummaryStatCard,
  SummaryStatCardSkeleton,
  SummaryStatGrid,
  TableCard,
  TablePagination,
  TableSkeletonRows,
} from '@/components/shared';
import { ConfirmDeleteModal } from '@/components/shared/ConfirmDeleteModal';
import { RecentApplicationsTable } from '@/components/features/RecentApplicationsTable';
import { SheltersSummaryTable } from '@/components/features/SheltersSummaryTable';
import { ListingsByShelterChart } from '@/components/features/charts/ListingsByShelterChart';
import { UsersByRoleChart } from '@/components/features/charts/UsersByRoleChart';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import { Input, Label, Select, Textarea } from '@/components/ui/Form';
import { PetStatusBadge, VisibilityBadge } from '@/components/ui/StatusBadge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import { useShelters } from '@/hooks/useData';
import { getAdminShelter, getAdminStats, listAdminPetsPaginated, listAdminSheltersPaginated, listUsersPaginated, shelterService, userService } from '@/services/api';
import type { AdminShelterDetails, AdminStats, ShelterSummaryRow } from '@/services/api';
import type { Pet, Shelter, User, UserRole } from '@/types';
import { formatDate } from '@/utils/formatters';
import { ApiError } from '@/lib/apiClient';

type Section = 'overview' | 'shelters' | 'pets' | 'users';

interface PlatformAdminPageProps {
  initialSection?: Section;
}

export const PlatformAdminPage = ({ initialSection = 'overview' }: PlatformAdminPageProps) => {
  // Section is derived straight from the route — NavLink navigation updates it.
  const section = initialSection;
  // Shelter directory for filter dropdowns and name lookups (display aids —
  // never counted for KPIs; those come from GET /admin/stats below).
  const { shelters, setShelters } = useShelters();

  // Overview KPIs, summaries, and recents: strictly server-counted
  // (GET /admin/stats). Dynamic only — failures render an explicit error
  // state instead of mock-based local figures.
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);

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
  }, []);

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
  const successfulAdoptions = adminStats?.applications.adopted ?? 0;
  const adoptionRate =
    !adminStats || adminStats.applications.total === 0
      ? 0
      : Math.round(
        (adminStats.applications.adopted / adminStats.applications.total) * 100,
      );
  const usersByRoleData = [
    { name: 'Adopters', value: adopters },
    { name: 'Shelter staff', value: shelterStaff },
    { name: 'Admins', value: platformAdmins },
  ].filter((point) => point.value > 0);
  const overviewLoading = adminStats === null && statsError === null;

  const shelterName = (shelterId?: string): string =>
    shelters.find((s) => s.id === shelterId)?.name ?? '—';

  const userInitials = (name: string): string =>
    name
      .split(' ')
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');

  const roleBadgeVariant = (role: UserRole): 'info' | 'warning' | 'muted' =>
    role === 'platform_admin' ? 'info' : role === 'shelter_staff' ? 'warning' : 'muted';

  // Admin Shelters table: searched, limited, and paged in SQL
  // (GET /admin/shelters) — never sliced from a capped client list.
  const [shelterRows, setShelterRows] = useState<ShelterSummaryRow[]>([]);
  const [totalShelterRows, setTotalShelterRows] = useState(0);
  const [shelterPageSize, setShelterPageSize] = useState(10);
  const [shelterQuery, setShelterQuery] = useState('');
  const [debouncedShelterQuery, setDebouncedShelterQuery] = useState('');
  const [shelterPage, setShelterPage] = useState(1);
  const [loadingShelters, setLoadingShelters] = useState(true);
  const [sheltersError, setSheltersError] = useState<string | null>(null);
  const [shelterSlideOpen, setShelterSlideOpen] = useState(false);
  const [editingShelter, setEditingShelter] = useState<Shelter | null>(null);
  const [detailsShelter, setDetailsShelter] = useState<AdminShelterDetails | null>(null);
  const [loadingDetailsShelter, setLoadingDetailsShelter] = useState(false);
  const [pendingDeleteShelter, setPendingDeleteShelter] = useState<ShelterSummaryRow | null>(null);
  const [isDeletingShelter, setIsDeletingShelter] = useState(false);
  const [shelterForm, setShelterForm] = useState({
    name: '',
    location: '',
    address: '',
    email: '',
    phone: '',
    operatingHours: '',
    description: '',
    imageUrl: '',
  });

  const resetShelterForm = () =>
    setShelterForm({
      name: '',
      location: '',
      address: '',
      email: '',
      phone: '',
      operatingHours: '',
      description: '',
      imageUrl: '',
    });

  // Debounced search so each keystroke doesn't fire a request.
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedShelterQuery(shelterQuery.trim());
      setShelterPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [shelterQuery]);

  const fetchShelters = useCallback(async () => {
    setLoadingShelters(true);
    setSheltersError(null);
    try {
      const res = await listAdminSheltersPaginated({
        page: shelterPage,
        limit: shelterPageSize,
        search: debouncedShelterQuery,
      });
      setShelterRows(res.items);
      setTotalShelterRows(res.total);
    } catch {
      setSheltersError('Failed to load shelters.');
    } finally {
      setLoadingShelters(false);
    }
  }, [shelterPage, shelterPageSize, debouncedShelterQuery]);

  useEffect(() => {
    fetchShelters();
  }, [fetchShelters]);

  /** Refreshes the shelter dropdown directory after a mutation. */
  const refreshShelterDirectory = useCallback(async () => {
    try {
      setShelters(await shelterService.list());
    } catch {
      // Directory options keep their previous values; the table already refetched.
    }
  }, [setShelters]);

  const openDetailsShelter = (row: ShelterSummaryRow) => {
    setDetailsShelter({ ...row, staffList: [] });
    setLoadingDetailsShelter(true);
    getAdminShelter(row.shelter.id)
      .then((details) => setDetailsShelter(details))
      .catch(() => toast.error('Failed to load shelter details.'))
      .finally(() => setLoadingDetailsShelter(false));
  };

  const openAddShelter = () => {
    setEditingShelter(null);
    resetShelterForm();
    setShelterSlideOpen(true);
  };

  const openEditShelter = (shelter: Shelter) => {
    setEditingShelter(shelter);
    setDetailsShelter(null);
    setShelterForm({
      name: shelter.name,
      location: shelter.location,
      address: shelter.address,
      email: shelter.email,
      phone: shelter.phone,
      operatingHours: shelter.operatingHours,
      description: shelter.description,
      imageUrl: shelter.imageUrl,
    });
    setShelterSlideOpen(true);
  };

  const closeShelterSlide = () => {
    setShelterSlideOpen(false);
    setEditingShelter(null);
  };

  const handleShelterSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const input = {
      name: shelterForm.name,
      location: shelterForm.location,
      address: shelterForm.address,
      email: shelterForm.email,
      phone: shelterForm.phone,
      operatingHours: shelterForm.operatingHours,
      description: shelterForm.description || 'Partner rescue shelter.',
      imageUrl:
        shelterForm.imageUrl ||
        'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=800&q=80',
    };
    try {
      if (editingShelter) {
        const updated = await shelterService.update(editingShelter.id, input);
        toast.success(`${updated?.name ?? input.name} updated successfully!`);
      } else {
        const created = await shelterService.create(input);
        toast.success(`${created.name} added successfully!`);
        resetShelterForm();
      }
      closeShelterSlide();
      await fetchShelters();
      await refreshShelterDirectory();
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : 'Failed to save shelter. Please try again.',
      );
    }
  };

  const removeShelter = async (id: string) => {
    const target = shelterRows.find((r) => r.shelter.id === id);
    setIsDeletingShelter(true);
    try {
      await shelterService.remove(id);
      toast.success(target ? `${target.shelter.name} removed.` : 'Shelter removed.');
      setPendingDeleteShelter(null);
      await fetchShelters();
      await refreshShelterDirectory();
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : 'Failed to remove shelter. Please try again.',
      );
    } finally {
      setIsDeletingShelter(false);
    }
  };

  const setShelterField = (key: keyof typeof shelterForm, value: string) =>
    setShelterForm((prev) => ({ ...prev, [key]: value }));

  const shelterSearchFilter = (
    <div className="relative">
      <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        aria-label="Search shelters"
        value={shelterQuery}
        onChange={(e) => {
          setShelterQuery(e.target.value);
          setShelterPage(1);
        }}
        placeholder="Search name, location, or email"
        className="h-9 w-full pl-8 sm:w-[280px]"
      />
    </div>
  );

  const addShelterButton = (
    <Button size="lg" onClick={openAddShelter}>
      <Plus className="size-4" /> Add shelter
    </Button>
  );

  const shelterPagination =
    totalShelterRows > 0 ? (
      <TablePagination
        currentPage={shelterPage}
        totalItems={totalShelterRows}
        pageSize={shelterPageSize}
        onPageChange={setShelterPage}
        onPageSizeChange={(newSize) => {
          setShelterPageSize(newSize);
          setShelterPage(1);
        }}
        label="shelters"
      />
    ) : undefined;

  // Platform pets directory: every pet and which shelter posted it.
  const [adminPetsList, setAdminPetsList] = useState<Pet[]>([]);
  const [totalAdminPets, setTotalAdminPets] = useState(0);
  const [petPageSize, setPetPageSize] = useState(10);
  const [petQuery, setPetQuery] = useState('');
  const [petShelterFilter, setPetShelterFilter] = useState('all');
  const [petPage, setPetPage] = useState(1);
  const [detailsPet, setDetailsPet] = useState<Pet | null>(null);
  // Starts true for the first page; refetches (search / page / filter) flip it
  // back so the table body shows skeleton rows instead of a stale or empty list.
  const [loadingAdminPets, setLoadingAdminPets] = useState(true);

  const fetchAdminPets = useCallback(async () => {
    try {
      const res = await listAdminPetsPaginated({
        page: petPage,
        limit: petPageSize,
        search: petQuery.trim(),
      });
      setAdminPetsList(res.items);
      setTotalAdminPets(res.total);
    } catch {
      toast.error('Failed to load pets.');
    } finally {
      setLoadingAdminPets(false);
    }
  }, [petPage, petPageSize, petQuery]);

  useEffect(() => {
    fetchAdminPets();
  }, [fetchAdminPets]);

  const petSearchFilter = (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          aria-label="Search pets"
          value={petQuery}
          onChange={(e) => {
            setLoadingAdminPets(true);
            setPetQuery(e.target.value);
            setPetPage(1);
          }}
          placeholder="Search name, breed, or species"
          className="h-9 w-full pl-8 sm:w-[240px]"
        />
      </div>
      <Select
        aria-label="Filter by shelter"
        className="h-9 w-[180px]" value={petShelterFilter}
        onChange={(e) => {
          setLoadingAdminPets(true);
          setPetShelterFilter(e.target.value);
          setPetPage(1);
        }}
        options={[
          { value: 'all', label: 'All shelters' },
          ...shelters.map((s) => ({ value: s.id, label: s.name })),
        ]}
      />
    </div>
  );

  const petPagination =
    totalAdminPets > 0 ? (
      <TablePagination
        currentPage={petPage}
        totalItems={totalAdminPets}
        pageSize={petPageSize}
        onPageChange={(next) => {
          setLoadingAdminPets(true);
          setPetPage(next);
        }}
        onPageSizeChange={(newSize) => {
          setLoadingAdminPets(true);
          setPetPageSize(newSize);
          setPetPage(1);
        }}
        label="pets"
      />
    ) : undefined;

  // Users table state (mirrors the shelters table).
  const [usersList, setUsersList] = useState<User[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [userPageSize, setUserPageSize] = useState(10);
  const [userQuery, setUserQuery] = useState('');
  const [userPage, setUserPage] = useState(1);
  const [userSlideOpen, setUserSlideOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [detailsUser, setDetailsUser] = useState<User | null>(null);
  const [pendingDeleteUser, setPendingDeleteUser] = useState<User | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    role: 'adopter',
    shelterId: '',
    avatarUrl: '',
  });

  // Starts true for the first page; search / page changes flip it back so the
  // table body shows skeleton rows instead of a stale or empty list.
  const [loadingUsers, setLoadingUsers] = useState(true);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await listUsersPaginated({
        page: userPage,
        limit: userPageSize,
        search: userQuery.trim(),
      });
      setUsersList(res.items);
      setTotalUsers(res.total);
    } catch {
      toast.error('Failed to load users.');
    } finally {
      setLoadingUsers(false);
    }
  }, [userPage, userPageSize, userQuery]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const resetUserForm = () =>
    setUserForm({ name: '', email: '', role: 'adopter', shelterId: '', avatarUrl: '' });

  const openAddUser = () => {
    setEditingUser(null);
    resetUserForm();
    setUserSlideOpen(true);
  };

  const openEditUser = (user: User) => {
    setEditingUser(user);
    setDetailsUser(null);
    setUserForm({
      name: user.name,
      email: user.email,
      role: user.role,
      shelterId: user.shelterId ?? '',
      avatarUrl: user.avatarUrl ?? '',
    });
    setUserSlideOpen(true);
  };

  const closeUserSlide = () => {
    setUserSlideOpen(false);
    setEditingUser(null);
  };

  const handleUserSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const input = {
      name: userForm.name,
      email: userForm.email,
      role: userForm.role as UserRole,
      shelterId:
        userForm.role === 'shelter_staff' && userForm.shelterId
          ? userForm.shelterId
          : undefined,
      avatarUrl: userForm.avatarUrl || undefined,
    };
    if (editingUser) {
      await userService.update(editingUser.id, input);
      toast.success(`${input.name} updated successfully!`);
      closeUserSlide();
      await fetchUsers();
      return;
    }
    const created = await userService.create(input);
    toast.success(`${created.name} added successfully!`);
    closeUserSlide();
    resetUserForm();
    await fetchUsers();
  };

  const removeUser = async (id: string) => {
    const target = usersList.find((u) => u.id === id);
    setIsDeletingUser(true);
    try {
      await userService.remove(id);
      toast.success(target ? `${target.name} removed.` : 'User removed.');
      setPendingDeleteUser(null);
      await fetchUsers();
    } catch {
      toast.error('Failed to remove user. Please try again.');
    } finally {
      setIsDeletingUser(false);
    }
  };

  const setUserField = (key: keyof typeof userForm, value: string) =>
    setUserForm((prev) => ({ ...prev, [key]: value }));

  const userSearchFilter = (
    <div className="relative">
      <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        aria-label="Search users" value={userQuery}
        onChange={(e) => {
          setLoadingUsers(true);
          setUserQuery(e.target.value);
          setUserPage(1);
        }}
        placeholder="Search name, email, or role"
        className="h-9 w-full pl-8 sm:w-[280px]"
      />
    </div>
  );

  const addUserButton = (
    <Button size="lg" onClick={openAddUser}>
      <Plus className="size-4" /> Add user
    </Button>
  );

  const userPagination =
    totalUsers > 0 ? (
      <TablePagination
        currentPage={userPage}
        totalItems={totalUsers}
        pageSize={userPageSize}
        onPageChange={(next) => {
          setLoadingUsers(true);
          setUserPage(next);
        }}
        onPageSizeChange={(newSize) => {
          setLoadingUsers(true);
          setUserPageSize(newSize);
          setUserPage(1);
        }}
        label="users"
      />
    ) : undefined;

  return (
    <div className="w-full px-4 py-6 sm:px-6">
      <SectionHeader
        title="Platform administration"
        subtitle="Developer oversight — all shelters, all users, and global metrics."
      />

      {section === 'overview' && (
        <div className="mt-6 space-y-4">
          {statsError ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-5 text-sm">
              <p className="font-semibold text-destructive">Could not load dashboard figures.</p>
              <p className="mt-1 text-muted-foreground">
                {statsError} Check that the backend is running and you are signed in as a
                platform admin.
              </p>
              <Button
                size="sm"
                variant="outline"
                className="mt-3"
                onClick={() => {
                  setStatsError(null);
                  setAdminStats(null);
                  getAdminStats()
                    .then((s) => setAdminStats(s))
                    .catch(() => setStatsError('Failed to load dashboard figures.'));
                }}
              >
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
              {/* Summary stats — strictly server-counted */}
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
                  subtitle={`${adopters} adopters · ${shelterStaff} staff · ${platformAdmins} ${platformAdmins === 1 ? 'admin' : 'admins'
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
      )}

      {section === 'shelters' && (
        <div className="mt-6 space-y-4">
          <TableCard
            title="Shelters"
            description={
              totalShelterRows === 0
                ? 'Registered partner shelters'
                : `${shelterRows.length} of ${totalShelterRows} registered shelters`
            }
            icon={Building2}
            action={addShelterButton}
            toolbar={shelterSearchFilter}
            isEmpty={!loadingShelters && !sheltersError && shelterRows.length === 0}
            emptyTitle="No shelters found"
            emptyDescription="Try a different search, or register a new shelter."
            footer={shelterPagination}
            contentClassName="px-0"
          >
            {/* Desktop: data table */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Shelter</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Pets</TableHead>
                    <TableHead>Pending</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingShelters ? (
                    <TableSkeletonRows columns={6} rows={6} avatar />
                  ) : sheltersError ? (
                    <TableRow>
                      <TableCell colSpan={6}>
                        <p className="py-6 text-center text-sm text-destructive">{sheltersError}</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    shelterRows.map(({ shelter, petCount, publicPets, pendingApplications }) => (
                      <TableRow key={shelter.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <img
                              src={shelter.imageUrl}
                              alt={shelter.name}
                              className="size-10 shrink-0 rounded-lg object-cover"
                            />
                            <div className="min-w-0">
                              <p className="font-medium">{shelter.name}</p>
                              <p className="truncate text-xs text-muted-foreground">{shelter.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-muted-foreground">
                          {shelter.location}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-muted-foreground">
                          {shelter.phone}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-muted-foreground">
                          {petCount} total · {publicPets} public
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {pendingApplications}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="text-muted-foreground"
                              aria-label={`View ${shelter.name} details`}
                              onClick={() =>
                                openDetailsShelter({
                                  shelter,
                                  petCount,
                                  publicPets,
                                  pendingApplications,
                                  staff: 0,
                                })
                              }
                            >
                              <Eye className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="text-muted-foreground"
                              aria-label={`Edit ${shelter.name}`}
                              onClick={() => openEditShelter(shelter)}
                            >
                              <Pencil className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="text-muted-foreground"
                              aria-label={`Remove ${shelter.name}`}
                              onClick={() =>
                                setPendingDeleteShelter({
                                  shelter,
                                  petCount,
                                  publicPets,
                                  pendingApplications,
                                  staff: 0,
                                })
                              }
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Mobile: stacked cards */}
            <div className="grid gap-3 p-4 md:hidden">
              {loadingShelters ? (
                <RecordCardSkeleton count={3} />
              ) : sheltersError ? (
                <p className="py-6 text-center text-sm text-destructive">{sheltersError}</p>
              ) : (
                shelterRows.map(({ shelter, petCount, publicPets, pendingApplications }) => (
                  <RecordCard
                    key={shelter.id}
                    imageUrl={shelter.imageUrl}
                    imageAlt={shelter.name}
                    title={shelter.name}
                    subtitle={`${shelter.location} · ${shelter.email}`}
                    badges={
                      <>
                        <Badge variant="muted">{petCount} pets</Badge>
                        <Badge variant="success">{publicPets} public</Badge>
                        <Badge variant="warning">{pendingApplications} pending</Badge>
                      </>
                    }
                    actions={
                      <>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-muted-foreground"
                          aria-label={`View ${shelter.name} details`}
                          onClick={() =>
                            openDetailsShelter({
                              shelter,
                              petCount,
                              publicPets,
                              pendingApplications,
                              staff: 0,
                            })
                          }
                        >
                          <Eye className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-muted-foreground"
                          aria-label={`Edit ${shelter.name}`}
                          onClick={() => openEditShelter(shelter)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-muted-foreground"
                          aria-label={`Remove ${shelter.name}`}
                          onClick={() =>
                            setPendingDeleteShelter({
                              shelter,
                              petCount,
                              publicPets,
                              pendingApplications,
                              staff: 0,
                            })
                          }
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </>
                    }
                  >
                    <p className="text-xs text-muted-foreground">
                      {shelter.phone} · {shelter.operatingHours}
                    </p>
                  </RecordCard>
                ))
              )}
            </div>
          </TableCard>
        </div>
      )}

      <SlideOver
        open={shelterSlideOpen}
        onClose={closeShelterSlide}
        size="lg"
        title={editingShelter ? `Edit ${editingShelter.name}` : 'Register new shelter'}
        description={
          editingShelter
            ? 'Update the shelter record below.'
            : 'Add a partner shelter to the platform.'
        }
        icon={editingShelter ? Pencil : Plus}
        footer={
          <div className="grid grid-cols-2 gap-3">
            <Button type="button" variant="outline" size="lg" className="w-full" onClick={closeShelterSlide}>
              Cancel
            </Button>
            <Button type="submit" form="shelter-form" size="lg" className="w-full">
              {editingShelter ? 'Save changes' : 'Register shelter'}
            </Button>
          </div>
        }
      >
        <form id="shelter-form" onSubmit={handleShelterSubmit} className="grid gap-3">
          <div>
            <Label>Shelter name</Label>
            <Input
              value={shelterForm.name}
              onChange={(e) => setShelterField('name', e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>City / location</Label>
              <Input
                value={shelterForm.location}
                onChange={(e) => setShelterField('location', e.target.value)}
                required
              />
            </div>
            <div>
              <Label>Phone</Label>
              <Input
                value={shelterForm.phone}
                onChange={(e) => setShelterField('phone', e.target.value)}
                required
              />
            </div>
          </div>
          <div>
            <Label>Street address</Label>
            <Input
              value={shelterForm.address}
              onChange={(e) => setShelterField('address', e.target.value)}
            />
          </div>
          <div>
            <Label>Contact email</Label>
            <Input
              type="email"
              value={shelterForm.email}
              onChange={(e) => setShelterField('email', e.target.value)}
              required
            />
          </div>
          <div>
            <Label>Operating hours</Label>
            <Input
              value={shelterForm.operatingHours}
              onChange={(e) => setShelterField('operatingHours', e.target.value)}
              placeholder="Mon–Sat, 9:00 AM – 6:00 PM"
            />
          </div>
          <div>
            <Label>Photo URL</Label>
            <Input
              value={shelterForm.imageUrl}
              onChange={(e) => setShelterField('imageUrl', e.target.value)}
              placeholder="https://…"
            />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea
              value={shelterForm.description}
              onChange={(e) => setShelterField('description', e.target.value)}
            />
          </div>
        </form>
      </SlideOver>

      <DetailsModal
        open={detailsShelter !== null}
        onClose={() => setDetailsShelter(null)}
        title={detailsShelter?.shelter.name ?? 'Shelter details'}
        description={detailsShelter?.shelter.location}
        icon={Building2}
        footer={
          detailsShelter ? (
            <div className="grid grid-cols-2 gap-3">
              <Button type="button" variant="outline" size="lg" className="w-full" onClick={() => setDetailsShelter(null)}>
                Close
              </Button>
              <Button
                type="button"
                size="lg"
                className="w-full"
                onClick={() => detailsShelter && openEditShelter(detailsShelter.shelter)}
              >
                <Pencil className="size-4" /> Edit in slider
              </Button>
            </div>
          ) : undefined
        }
      >
        {detailsShelter && (
          <div className="space-y-4">
            <img
              src={detailsShelter.shelter.imageUrl}
              alt={detailsShelter.shelter.name}
              className="h-48 w-full rounded-lg border object-cover"
            />
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="muted">{detailsShelter.petCount} pets</Badge>
              <Badge variant="success">{detailsShelter.publicPets} public</Badge>
              <Badge variant="warning">{detailsShelter.pendingApplications} pending</Badge>
              <Badge variant="info">{detailsShelter.staff} staff</Badge>
            </div>
            <dl className="grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-lg border p-2.5">
                <dt className="text-xs text-muted-foreground">Email</dt>
                <dd className="break-all font-medium">{detailsShelter.shelter.email}</dd>
              </div>
              <div className="rounded-lg border p-2.5">
                <dt className="text-xs text-muted-foreground">Phone</dt>
                <dd className="font-medium">{detailsShelter.shelter.phone}</dd>
              </div>
              <div className="rounded-lg border p-2.5">
                <dt className="text-xs text-muted-foreground">Address</dt>
                <dd className="font-medium">{detailsShelter.shelter.address}</dd>
              </div>
              <div className="rounded-lg border p-2.5">
                <dt className="text-xs text-muted-foreground">Hours</dt>
                <dd className="font-medium">{detailsShelter.shelter.operatingHours}</dd>
              </div>
            </dl>
            <div>
              <h3 className="text-sm font-semibold">About</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {detailsShelter.shelter.description}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold">Assigned staff</h3>
              {loadingDetailsShelter ? (
                <p className="mt-1 text-sm text-muted-foreground">Loading staff…</p>
              ) : detailsShelter.staffList.length === 0 ? (
                <p className="mt-1 text-sm text-muted-foreground">No staff assigned.</p>
              ) : (
                <ul className="mt-1 space-y-1 text-sm text-muted-foreground">
                  {detailsShelter.staffList.map((u) => (
                    <li key={u.id}>
                      {u.name} · {u.email}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </DetailsModal>

      {section === 'pets' && (
        <div className="mt-6 space-y-4">
          <TableCard
            title="All pets"
            description={`${adminPetsList.length} of ${totalAdminPets} pets across every shelter`}
            icon={PawPrint}
            toolbar={petSearchFilter}
            isEmpty={!loadingAdminPets && adminPetsList.length === 0}
            emptyTitle="No pets found"
            emptyDescription="Try a different search or shelter filter."
            footer={petPagination}
            contentClassName="px-0"
          >
            {/* Desktop: data table */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pet</TableHead>
                    <TableHead>Shelter</TableHead>
                    <TableHead>Species</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Visibility</TableHead>
                    <TableHead>Added</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingAdminPets ? (
                    <TableSkeletonRows columns={7} rows={6} avatar />
                  ) : adminPetsList.map((pet) => (
                    <TableRow key={pet.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <img
                            src={pet.imageUrl}
                            alt={pet.name}
                            className="size-10 shrink-0 rounded-lg object-cover"
                          />
                          <div className="min-w-0">
                            <p className="font-medium">{pet.name}</p>
                            <p className="truncate text-xs text-muted-foreground">{pet.breed}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {shelterName(pet.shelterId)}
                      </TableCell>
                      <TableCell className="capitalize text-muted-foreground">
                        {pet.species}
                      </TableCell>
                      <TableCell className="capitalize text-muted-foreground">
                        {pet.status}
                      </TableCell>
                      <TableCell className="capitalize text-muted-foreground">
                        {pet.visibility}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {formatDate(pet.dateAdded)}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="text-muted-foreground"
                            aria-label={`View ${pet.name} details`}
                            onClick={() => setDetailsPet(pet)}
                          >
                            <Eye className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile: stacked cards */}
            <div className="grid gap-3 p-4 md:hidden">
              {loadingAdminPets ? (
                <RecordCardSkeleton count={3} />
              ) : adminPetsList.map((pet) => (
                <RecordCard
                  key={pet.id}
                  imageUrl={pet.imageUrl}
                  imageAlt={pet.name}
                  title={pet.name}
                  subtitle={`${pet.breed} · ${shelterName(pet.shelterId)}`}
                  badges={
                    <>
                      <PetStatusBadge status={pet.status} />
                      <VisibilityBadge visibility={pet.visibility} />
                    </>
                  }
                  actions={
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-muted-foreground"
                      aria-label={`View ${pet.name} details`}
                      onClick={() => setDetailsPet(pet)}
                    >
                      <Eye className="size-4" />
                    </Button>
                  }
                >
                  <p className="text-xs text-muted-foreground">
                    {pet.species} · Added {formatDate(pet.dateAdded)}
                  </p>
                </RecordCard>
              ))}
            </div>
          </TableCard>
        </div>
      )}

      <DetailsModal
        open={detailsPet !== null}
        onClose={() => setDetailsPet(null)}
        title={detailsPet?.name ?? 'Pet details'}
        description={
          detailsPet ? `Posted by ${shelterName(detailsPet.shelterId)}` : undefined
        }
        icon={PawPrint}
        footer={
          <Button size="lg" variant="outline" className="w-full" onClick={() => setDetailsPet(null)}>
            Close
          </Button>
        }
      >
        {detailsPet && (
          <div className="space-y-4">
            <img
              src={detailsPet.imageUrl}
              alt={detailsPet.name}
              className="h-48 w-full rounded-lg border object-cover"
            />
            <div className="flex flex-wrap gap-1.5">
              <PetStatusBadge status={detailsPet.status} />
              <VisibilityBadge visibility={detailsPet.visibility} />
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {detailsPet.description}
            </p>
            <dl className="grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-lg border p-2.5">
                <dt className="text-xs text-muted-foreground">Shelter</dt>
                <dd className="font-medium">{shelterName(detailsPet.shelterId)}</dd>
              </div>
              <div className="rounded-lg border p-2.5">
                <dt className="text-xs text-muted-foreground">Species · Breed</dt>
                <dd className="font-medium capitalize">
                  {detailsPet.species} · {detailsPet.breed}
                </dd>
              </div>
              <div className="rounded-lg border p-2.5">
                <dt className="text-xs text-muted-foreground">Age</dt>
                <dd className="font-medium">
                  {detailsPet.ageYears} y/o · {detailsPet.ageGroup}
                </dd>
              </div>
              <div className="rounded-lg border p-2.5">
                <dt className="text-xs text-muted-foreground">Added</dt>
                <dd className="font-medium">{formatDate(detailsPet.dateAdded)}</dd>
              </div>
            </dl>
          </div>
        )}
      </DetailsModal>

      {section === 'users' && (
        <div className="mt-6 space-y-4">
          <TableCard
            title="Users"
            description={`${usersList.length} of ${totalUsers} registered users`}
            icon={Users}
            action={addUserButton}
            toolbar={userSearchFilter}
            isEmpty={!loadingUsers && usersList.length === 0}
            emptyTitle="No users found"
            emptyDescription="Try a different search, or add a new user."
            footer={userPagination}
            contentClassName="px-0"
          >
            {/* Desktop: data table */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Assigned shelter</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingUsers ? (
                    <TableSkeletonRows columns={4} rows={6} avatar />
                  ) : usersList.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {user.avatarUrl ? (
                            <img
                              src={user.avatarUrl}
                              alt={user.name}
                              className="size-10 shrink-0 rounded-lg object-cover"
                            />
                          ) : (
                            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-700 dark:bg-orange-950 dark:text-orange-300">
                              {userInitials(user.name)}
                            </span>
                          )}
                          <div className="min-w-0">
                            <p className="font-medium">{user.name}</p>
                            <p className="truncate text-xs text-muted-foreground">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={roleBadgeVariant(user.role)} className="capitalize">
                          {user.role.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {user.shelterId ? shelterName(user.shelterId) : '—'}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="text-muted-foreground"
                            aria-label={`View ${user.name} details`}
                            onClick={() => setDetailsUser(user)}
                          >
                            <Eye className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="text-muted-foreground"
                            aria-label={`Edit ${user.name}`}
                            onClick={() => openEditUser(user)}
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="text-muted-foreground"
                            aria-label={`Remove ${user.name}`}
                            onClick={() => setPendingDeleteUser(user)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile: stacked cards */}
            <div className="grid gap-3 p-4 md:hidden">
              {loadingUsers ? (
                <RecordCardSkeleton count={3} />
              ) : usersList.map((user) => (
                <RecordCard
                  key={user.id}
                  imageUrl={user.avatarUrl}
                  imageAlt={user.name}
                  title={user.name}
                  subtitle={user.email}
                  badges={
                    <>
                      <Badge variant={roleBadgeVariant(user.role)} className="capitalize">
                        {user.role.replace('_', ' ')}
                      </Badge>
                      {user.shelterId ? (
                        <Badge variant="muted">{shelterName(user.shelterId)}</Badge>
                      ) : null}
                    </>
                  }
                  actions={
                    <>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-muted-foreground"
                        aria-label={`View ${user.name} details`}
                        onClick={() => setDetailsUser(user)}
                      >
                        <Eye className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-muted-foreground"
                        aria-label={`Edit ${user.name}`}
                        onClick={() => openEditUser(user)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-muted-foreground"
                        aria-label={`Remove ${user.name}`}
                        onClick={() => setPendingDeleteUser(user)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </>
                  }
                />
              ))}
            </div>
          </TableCard>
        </div>
      )}

      <SlideOver
        open={userSlideOpen}
        onClose={closeUserSlide}
        size="lg"
        title={editingUser ? `Edit ${editingUser.name}` : 'Add new user'}
        description={
          editingUser
            ? 'Update the account record below.'
            : 'Create an account and assign its role on the platform.'
        }
        icon={editingUser ? Pencil : Plus}
        footer={
          <div className="grid grid-cols-2 gap-3">
            <Button type="button" variant="outline" size="lg" className="w-full" onClick={closeUserSlide}>
              Cancel
            </Button>
            <Button type="submit" form="user-form" size="lg" className="w-full">
              {editingUser ? 'Save changes' : 'Create user'}
            </Button>
          </div>
        }
      >
        <form id="user-form" onSubmit={handleUserSubmit} className="grid gap-3">
          <div>
            <Label>Full name</Label>
            <Input
              value={userForm.name}
              onChange={(e) => setUserField('name', e.target.value)}
              required
            />
          </div>
          <div>
            <Label>Email</Label>
            <Input
              type="email"
              value={userForm.email}
              onChange={(e) => setUserField('email', e.target.value)}
              required
            />
          </div>
          <div>
            <Label>Role</Label>
            <Select
              value={userForm.role}
              onChange={(e) => setUserField('role', e.target.value)}
              options={[
                { value: 'adopter', label: 'Adopter' },
                { value: 'shelter_staff', label: 'Shelter staff' },
                { value: 'platform_admin', label: 'Platform admin' },
              ]}
            />
          </div>
          {userForm.role === 'shelter_staff' && (
            <div>
              <Label>Assigned shelter</Label>
              <Select
                value={userForm.shelterId}
                onChange={(e) => setUserField('shelterId', e.target.value)}
                options={[
                  { value: '', label: 'No shelter assigned' },
                  ...shelters.map((s) => ({ value: s.id, label: s.name })),
                ]}
              />
            </div>
          )}
          <div>
            <Label>Avatar URL</Label>
            <Input
              value={userForm.avatarUrl}
              onChange={(e) => setUserField('avatarUrl', e.target.value)}
              placeholder="https://…"
            />
          </div>
        </form>
      </SlideOver>

      <DetailsModal
        open={detailsUser !== null}
        onClose={() => setDetailsUser(null)}
        title={detailsUser?.name ?? 'User details'}
        description={detailsUser?.email}
        icon={Users}
        footer={
          detailsUser ? (
            <div className="grid grid-cols-2 gap-3">
              <Button type="button" variant="outline" size="lg" className="w-full" onClick={() => setDetailsUser(null)}>
                Close
              </Button>
              <Button
                type="button"
                size="lg"
                className="w-full"
                onClick={() => detailsUser && openEditUser(detailsUser)}
              >
                <Pencil className="size-4" /> Edit in slider
              </Button>
            </div>
          ) : undefined
        }
      >
        {detailsUser && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              {detailsUser.avatarUrl ? (
                <img
                  src={detailsUser.avatarUrl}
                  alt={detailsUser.name}
                  className="size-14 shrink-0 rounded-full object-cover"
                />
              ) : (
                <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-orange-100 text-base font-bold text-orange-700 dark:bg-orange-950 dark:text-orange-300">
                  {userInitials(detailsUser.name)}
                </span>
              )}
              <div className="flex flex-wrap gap-1.5">
                <Badge variant={roleBadgeVariant(detailsUser.role)} className="capitalize">
                  {detailsUser.role.replace('_', ' ')}
                </Badge>
                <Badge variant="muted">
                  {detailsUser.shelterId
                    ? shelterName(detailsUser.shelterId)
                    : 'No shelter assigned'}
                </Badge>
              </div>
            </div>
            <dl className="grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-lg border p-2.5">
                <dt className="text-xs text-muted-foreground">Email</dt>
                <dd className="break-all font-medium">{detailsUser.email}</dd>
              </div>
              <div className="rounded-lg border p-2.5">
                <dt className="text-xs text-muted-foreground">Role</dt>
                <dd className="font-medium capitalize">
                  {detailsUser.role.replace('_', ' ')}
                </dd>
              </div>
              <div className="rounded-lg border p-2.5">
                <dt className="text-xs text-muted-foreground">Assigned shelter</dt>
                <dd className="font-medium">
                  {detailsUser.shelterId ? shelterName(detailsUser.shelterId) : '—'}
                </dd>
              </div>
              <div className="rounded-lg border p-2.5">
                <dt className="text-xs text-muted-foreground">User ID</dt>
                <dd className="break-all font-medium">{detailsUser.id}</dd>
              </div>
            </dl>
          </div>
        )}
      </DetailsModal>

      <ConfirmDeleteModal
        open={pendingDeleteShelter !== null}
        onClose={() => (isDeletingShelter ? undefined : setPendingDeleteShelter(null))}
        onConfirm={() => {
          if (pendingDeleteShelter) void removeShelter(pendingDeleteShelter.shelter.id);
        }}
        title="Delete shelter?"
        description="This permanently removes the shelter, its listings, and its applications. Assigned staff accounts are kept but detached."
        itemName={pendingDeleteShelter?.shelter.name}
        confirmLabel="Delete shelter"
        isDeleting={isDeletingShelter}
      />

      <ConfirmDeleteModal
        open={pendingDeleteUser !== null}
        onClose={() => (isDeletingUser ? undefined : setPendingDeleteUser(null))}
        onConfirm={() => {
          if (pendingDeleteUser) void removeUser(pendingDeleteUser.id);
        }}
        title="Delete user?"
        description="This permanently removes the user account."
        itemName={pendingDeleteUser?.name}
        confirmLabel="Delete user"
        isDeleting={isDeletingUser}
      />
    </div>
  );
};
