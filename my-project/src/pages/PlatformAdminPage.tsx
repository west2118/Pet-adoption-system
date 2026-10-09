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
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  ChartCard,
  DetailsModal,
  RecordCard,
  SectionHeader,
  SlideOver,
  SummaryStatCard,
  SummaryStatGrid,
  TableCard,
  TablePagination,
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
import { useApplications, usePets, useShelters, useUsers } from '@/hooks/useData';
import { usePlatformOverview } from '@/hooks/usePlatformOverview';
import { listAdminPetsPaginated, listUsersPaginated, shelterService, userService } from '@/services/api';
import type { Pet, Shelter, User, UserRole } from '@/types';
import { formatDate } from '@/utils/formatters';

type Section = 'overview' | 'shelters' | 'pets' | 'users';

interface PlatformAdminPageProps {
  initialSection?: Section;
}

export const PlatformAdminPage = ({ initialSection = 'overview' }: PlatformAdminPageProps) => {
  // Section is derived straight from the route — NavLink navigation updates it.
  const section = initialSection;
  const { pets } = usePets();
  const { shelters, setShelters } = useShelters();
  const { applications } = useApplications();
  const { users } = useUsers();

  const {
    stats,
    platform,
    listingsByShelter,
    usersByRole,
    recentApplications,
    shelterSummaries,
  } = usePlatformOverview(pets, applications, shelters, users);

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

  // Shelters table state (mirrors the shelter portal listings page).
  const [shelterPageSize, setShelterPageSize] = useState(10);
  const [shelterQuery, setShelterQuery] = useState('');
  const [shelterPage, setShelterPage] = useState(1);
  const [shelterSlideOpen, setShelterSlideOpen] = useState(false);
  const [editingShelter, setEditingShelter] = useState<Shelter | null>(null);
  const [detailsShelter, setDetailsShelter] = useState<Shelter | null>(null);
  const [pendingDeleteShelter, setPendingDeleteShelter] = useState<Shelter | null>(null);
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

  const shelterPetCounts = useMemo(() => {
    const map = new Map<string, { total: number; public: number; private: number; pending: number }>();
    shelters.forEach((s) => {
      const own = pets.filter((p) => p.shelterId === s.id);
      const ownIds = new Set(own.map((p) => p.id));
      map.set(s.id, {
        total: own.length,
        public: own.filter((p) => p.visibility === 'public').length,
        private: own.filter((p) => p.visibility === 'private').length,
        pending: applications.filter(
          (a) =>
            ownIds.has(a.petId) && (a.status === 'Submitted' || a.status === 'Under Review'),
        ).length,
      });
    });
    return map;
  }, [shelters, pets, applications]);

  const filteredShelters = useMemo(() => {
    const q = shelterQuery.trim().toLowerCase();
    if (!q) return shelters;
    return shelters.filter((s) =>
      `${s.name} ${s.location} ${s.email}`.toLowerCase().includes(q),
    );
  }, [shelters, shelterQuery]);

  const shelterTotalPages = Math.max(1, Math.ceil(filteredShelters.length / shelterPageSize));
  const shelterCurrentPage = Math.min(shelterPage, shelterTotalPages);
  const shelterStartIndex = (shelterCurrentPage - 1) * shelterPageSize;
  const pagedShelters = filteredShelters.slice(shelterStartIndex, shelterStartIndex + shelterPageSize);

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
    if (editingShelter) {
      const updated = await shelterService.update(editingShelter.id, input);
      if (updated)
        setShelters((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      toast.success(`${input.name} updated successfully!`);
      closeShelterSlide();
      return;
    }
    const created = await shelterService.create(input);
    setShelters((prev) => [created, ...prev]);
    toast.success(`${created.name} added successfully!`);
    closeShelterSlide();
    resetShelterForm();
  };

  const removeShelter = async (id: string) => {
    const target = shelters.find((s) => s.id === id);
    setIsDeletingShelter(true);
    try {
      await shelterService.remove(id);
      setShelters((prev) => prev.filter((s) => s.id !== id));
      toast.success(target ? `${target.name} removed.` : 'Shelter removed.');
      setPendingDeleteShelter(null);
    } catch {
      toast.error('Failed to remove shelter. Please try again.');
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
    filteredShelters.length > 0 ? (
      <TablePagination
        currentPage={shelterCurrentPage}
        totalItems={filteredShelters.length}
        pageSize={shelterPageSize}
        onPageChange={setShelterPage}
        onPageSizeChange={setShelterPageSize}
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
            setPetQuery(e.target.value);
            setPetPage(1);
          }}
          placeholder="Search name, breed, or species"
          className="h-9 w-full pl-8 sm:w-[240px]"
        />
      </div>
      <Select
        aria-label="Filter by shelter"
        className="h-9 w-[180px]"
        value={petShelterFilter}
        onChange={(e) => {
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
        onPageChange={setPetPage}
        onPageSizeChange={(newSize) => {
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
        aria-label="Search users"
        value={userQuery}
        onChange={(e) => {
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
        onPageChange={setUserPage}
        onPageSizeChange={(newSize) => {
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
          {/* Summary stats */}
          <SummaryStatGrid>
            <SummaryStatCard
              title="Shelters"
              value={platform.totalShelters}
              icon={Building2}
              subtitle={`${platform.locations} ${
                platform.locations === 1 ? 'location' : 'locations'
              }`}
            />
            <SummaryStatCard
              title="Users"
              value={platform.totalUsers}
              icon={Users}
              subtitle={`${platform.adopters} adopters · ${platform.shelterStaff} staff · ${platform.platformAdmins} ${
                platform.platformAdmins === 1 ? 'admin' : 'admins'
              }`}
            />
            <SummaryStatCard
              title="Pets"
              value={stats.totalPets}
              icon={PawPrint}
              subtitle={`${stats.publicListings} public · ${stats.privateInventory} private`}
            />
            <SummaryStatCard
              title="Pending applications"
              value={stats.pendingApplications}
              icon={Clock3}
              subtitle="Needs shelter review"
            />
            <SummaryStatCard
              title="Adoptions"
              value={stats.successfulAdoptions}
              icon={HeartHandshake}
              subtitle={`${stats.adoptionRate}% adoption rate`}
            />
          </SummaryStatGrid>

          {/* Platform distribution & composition */}
          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard
              title="Listings by shelter"
              description="Where the platform's inventory lives."
              icon={Layers}
            >
              <ListingsByShelterChart data={listingsByShelter} />
            </ChartCard>

            <ChartCard
              title="Users by role"
              description="Composition of everyone on the platform."
              icon={PieChart}
            >
              <UsersByRoleChart data={usersByRole} />
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
            isEmpty={shelterSummaries.length === 0}
            emptyTitle="No shelters"
            emptyDescription="Registered partner shelters will appear here."
            contentClassName="px-0"
          >
            <SheltersSummaryTable shelters={shelterSummaries} />
          </TableCard>

          <TableCard
            title="Recent applications"
            description="Latest adoption requests across the platform."
            icon={Inbox}
            isEmpty={recentApplications.length === 0}
            emptyTitle="No applications yet"
            emptyDescription="Adoption requests will appear here."
            contentClassName="px-0"
          >
            <RecentApplicationsTable applications={recentApplications} pets={pets} />
          </TableCard>
        </div>
      )}

      {section === 'shelters' && (
        <div className="mt-6 space-y-4">
          <TableCard
            title="Shelters"
            description={
              `${filteredShelters.length} of ${shelters.length} registered shelters`
            }
            icon={Building2}
            action={addShelterButton}
            toolbar={shelterSearchFilter}
            isEmpty={filteredShelters.length === 0}
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
                  {pagedShelters.map((shelter) => {
                    const counts = shelterPetCounts.get(shelter.id) ?? {
                      total: 0,
                      public: 0,
                      private: 0,
                      pending: 0,
                    };
                    return (
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
                          {counts.total} total · {counts.public} public
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {counts.pending}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="text-muted-foreground"
                              aria-label={`View ${shelter.name} details`}
                              onClick={() => setDetailsShelter(shelter)}
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
                              onClick={() => setPendingDeleteShelter(shelter)}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Mobile: stacked cards */}
            <div className="grid gap-3 p-4 md:hidden">
              {pagedShelters.map((shelter) => {
                const counts = shelterPetCounts.get(shelter.id) ?? {
                  total: 0,
                  public: 0,
                  private: 0,
                  pending: 0,
                };
                return (
                  <RecordCard
                    key={shelter.id}
                    imageUrl={shelter.imageUrl}
                    imageAlt={shelter.name}
                    title={shelter.name}
                    subtitle={`${shelter.location} · ${shelter.email}`}
                    badges={
                      <>
                        <Badge variant="muted">{counts.total} pets</Badge>
                        <Badge variant="success">{counts.public} public</Badge>
                        <Badge variant="warning">{counts.pending} pending</Badge>
                      </>
                    }
                    actions={
                      <>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-muted-foreground"
                          aria-label={`View ${shelter.name} details`}
                          onClick={() => setDetailsShelter(shelter)}
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
                          onClick={() => setPendingDeleteShelter(shelter)}
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
                );
              })}
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
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <Button type="submit" form="shelter-form" size="sm" className="sm:flex-1">
              {editingShelter ? 'Save changes' : 'Register shelter'}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={closeShelterSlide}>
              Cancel
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
        title={detailsShelter?.name ?? 'Shelter details'}
        description={detailsShelter?.location}
        icon={Building2}
        footer={
          detailsShelter ? (
            <div className="flex gap-2">
              <Button
                size="sm"
                className="flex-1"
                onClick={() => detailsShelter && openEditShelter(detailsShelter)}
              >
                <Pencil className="size-3.5" /> Edit in slider
              </Button>
              <Button size="sm" variant="outline" onClick={() => setDetailsShelter(null)}>
                Close
              </Button>
            </div>
          ) : undefined
        }
      >
        {detailsShelter && (
          <div className="space-y-4">
            <img
              src={detailsShelter.imageUrl}
              alt={detailsShelter.name}
              className="h-48 w-full rounded-lg border object-cover"
            />
            {(() => {
              const counts = shelterPetCounts.get(detailsShelter.id) ?? {
                total: 0,
                public: 0,
                private: 0,
                pending: 0,
              };
              const staff = users.filter((u) => u.shelterId === detailsShelter.id);
              return (
                <>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="muted">{counts.total} pets</Badge>
                    <Badge variant="success">{counts.public} public</Badge>
                    <Badge variant="muted">{counts.private} private</Badge>
                    <Badge variant="warning">{counts.pending} pending</Badge>
                    <Badge variant="info">{staff.length} staff</Badge>
                  </div>
                  <dl className="grid grid-cols-2 gap-2 text-sm">
                    <div className="rounded-lg border p-2.5">
                      <dt className="text-xs text-muted-foreground">Email</dt>
                      <dd className="break-all font-medium">{detailsShelter.email}</dd>
                    </div>
                    <div className="rounded-lg border p-2.5">
                      <dt className="text-xs text-muted-foreground">Phone</dt>
                      <dd className="font-medium">{detailsShelter.phone}</dd>
                    </div>
                    <div className="rounded-lg border p-2.5">
                      <dt className="text-xs text-muted-foreground">Address</dt>
                      <dd className="font-medium">{detailsShelter.address}</dd>
                    </div>
                    <div className="rounded-lg border p-2.5">
                      <dt className="text-xs text-muted-foreground">Hours</dt>
                      <dd className="font-medium">{detailsShelter.operatingHours}</dd>
                    </div>
                  </dl>
                  <div>
                    <h3 className="text-sm font-semibold">About</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {detailsShelter.description}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">Assigned staff</h3>
                    {staff.length === 0 ? (
                      <p className="mt-1 text-sm text-muted-foreground">No staff assigned.</p>
                    ) : (
                      <ul className="mt-1 space-y-1 text-sm text-muted-foreground">
                        {staff.map((u) => (
                          <li key={u.id}>
                            {u.name} · {u.email}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </>
              );
            })()}
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
            isEmpty={adminPetsList.length === 0}
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
                  {adminPetsList.map((pet) => (
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
              {adminPetsList.map((pet) => (
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
          <Button size="sm" variant="outline" className="w-full" onClick={() => setDetailsPet(null)}>
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
            isEmpty={usersList.length === 0}
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
                  {usersList.map((user) => (
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
              {usersList.map((user) => (
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
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <Button type="submit" form="user-form" size="sm" className="sm:flex-1">
              {editingUser ? 'Save changes' : 'Create user'}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={closeUserSlide}>
              Cancel
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
            <div className="flex gap-2">
              <Button
                size="sm"
                className="flex-1"
                onClick={() => detailsUser && openEditUser(detailsUser)}
              >
                <Pencil className="size-3.5" /> Edit in slider
              </Button>
              <Button size="sm" variant="outline" onClick={() => setDetailsUser(null)}>
                Close
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
          if (pendingDeleteShelter) void removeShelter(pendingDeleteShelter.id);
        }}
        title="Delete shelter?"
        description="This permanently removes the shelter and its assignment."
        itemName={pendingDeleteShelter?.name}
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
