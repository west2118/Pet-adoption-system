import {
  Building2,
  Eye,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { toast } from 'react-toastify';
import {
  DebouncedSearchInput,
  DetailsModal,
  RecordCard,
  RecordCardSkeleton,
  SectionHeader,
  SlideOver,
  TableCard,
  TablePagination,
  TableSkeletonRows,
} from '@/components/shared';
import { ConfirmDeleteModal } from '@/components/shared/ConfirmDeleteModal';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import { Input, Label, Textarea } from '@/components/ui/Form';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import { useShelters } from '@/hooks/useData';
import {
  getAdminShelter,
  listAdminSheltersPaginated,
  shelterService,
} from '@/services/api';
import type { AdminShelterDetails, ShelterSummaryRow } from '@/services/api';
import type { Shelter } from '@/types';
import { ApiError } from '@/lib/apiClient';

export const AdminSheltersPage = () => {
  const { setShelters } = useShelters();

  const [shelterRows, setShelterRows] = useState<ShelterSummaryRow[]>([]);
  const [totalShelterRows, setTotalShelterRows] = useState(0);
  const [shelterPageSize, setShelterPageSize] = useState(10);
  const [shelterQuery, setShelterQuery] = useState('');
  const [shelterPage, setShelterPage] = useState(1);
  const [shelterSlideOpen, setShelterSlideOpen] = useState(false);
  const [editingShelter, setEditingShelter] = useState<Shelter | null>(null);
  const [detailsShelter, setDetailsShelter] = useState<AdminShelterDetails | null>(null);
  const [loadingDetailsShelter, setLoadingDetailsShelter] = useState(false);
  const [pendingDeleteShelter, setPendingDeleteShelter] = useState<ShelterSummaryRow | null>(null);
  const [isDeletingShelter, setIsDeletingShelter] = useState(false);

  const [loadingShelters, setLoadingShelters] = useState(true);
  const [sheltersError, setSheltersError] = useState<string | null>(null);

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

  const fetchShelters = useCallback(async () => {
    setLoadingShelters(true);
    setSheltersError(null);
    try {
      const res = await listAdminSheltersPaginated({
        page: shelterPage,
        limit: shelterPageSize,
        search: shelterQuery.trim(),
      });
      setShelterRows(res.items);
      setTotalShelterRows(res.total);
    } catch {
      setSheltersError('Failed to load shelters.');
    } finally {
      setLoadingShelters(false);
    }
  }, [shelterPage, shelterPageSize, shelterQuery]);

  useEffect(() => {
    // Initial fetch and dependency-driven updates
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchShelters();
  }, [fetchShelters]);

  const refreshShelterDirectory = useCallback(async () => {
    try {
      setShelters(await shelterService.list());
    } catch {
      // Keep previous values on error
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

  const addShelterButton = (
    <Button size="sm" onClick={openAddShelter}>
      <Plus className="size-4" /> Add shelter
    </Button>
  );

  const shelterSearchFilter = (
    <DebouncedSearchInput
      value={shelterQuery}
      onDebouncedChange={(val) => {
        setShelterQuery(val);
        setShelterPage(1);
      }}
      placeholder="Search shelters by name, location..."
      className="w-full sm:w-[260px]"
      wrapperClassName="sm:w-[260px]"
    />
  );

  const shelterPagination =
    totalShelterRows > 0 ? (
      <TablePagination
        currentPage={shelterPage}
        totalItems={totalShelterRows}
        pageSize={shelterPageSize}
        onPageChange={(next) => {
          setLoadingShelters(true);
          setShelterPage(next);
        }}
        onPageSizeChange={(newSize) => {
          setLoadingShelters(true);
          setShelterPageSize(newSize);
          setShelterPage(1);
        }}
        label="shelters"
      />
    ) : undefined;

  return (
    <div className="w-full px-4 py-6 sm:px-6">
      <SectionHeader
        title="Partner shelters"
        subtitle="Manage verified shelter facilities and rescue organizations."
      />

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
          {/* Desktop Table */}
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

          {/* Mobile Cards */}
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

      <ConfirmDeleteModal
        open={pendingDeleteShelter !== null}
        onClose={() => setPendingDeleteShelter(null)}
        onConfirm={() => pendingDeleteShelter && removeShelter(pendingDeleteShelter.shelter.id)}
        title={`Remove ${pendingDeleteShelter?.shelter.name ?? 'shelter'}?`}
        description={
          pendingDeleteShelter
            ? `${pendingDeleteShelter.shelter.name} currently has ${pendingDeleteShelter.petCount} pets registered (${pendingDeleteShelter.publicPets} public) and ${pendingDeleteShelter.pendingApplications} pending applications. Removing it will delete all associated records.`
            : ''
        }
        confirmLabel="Remove shelter"
        isDeleting={isDeletingShelter}
      />
    </div>
  );
};

