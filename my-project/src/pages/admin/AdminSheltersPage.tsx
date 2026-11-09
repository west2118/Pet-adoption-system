import { useQuery } from '@tanstack/react-query';
import { Building2, Eye, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { toast } from 'react-toastify';
import {
  AdminShelterDetailsModal,
  AdminShelterFormSlideOver,
  AdminShelterMobileCard,
} from '@/components/admin';
import {
  DebouncedSearchInput,
  RecordCardSkeleton,
  RefreshButton,
  SectionHeader,
  TableCard,
  TablePagination,
  TableSkeletonRows,
  focusFirstError,
} from '@/components/shared';
import { ConfirmDeleteModal } from '@/components/shared/ConfirmDeleteModal';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import {
  EMPTY_ADMIN_SHELTER_FORM,
  type AdminShelterFormValues,
} from '@/data/adminPresets';
import { useShelters } from '@/hooks/useData';
import { useRefresh } from '@/hooks/useRefresh';
import {
  ADMIN_SHELTERS_QUERY_KEY,
  useAdminShelterMutations,
} from '@/hooks/useAdminShelterMutations';
import { adminShelterSchema, toFieldErrors } from '@/lib/validators';
import {
  getAdminShelter,
  listAdminSheltersPaginated,
  shelterService,
} from '@/services/api';
import type { AdminShelterDetails, ShelterSummaryRow } from '@/services/api';
import type { Shelter } from '@/types';

export const AdminSheltersPage = () => {
  const { setShelters } = useShelters();

  const [shelterPageSize, setShelterPageSize] = useState(10);
  const [shelterQuery, setShelterQuery] = useState('');
  const [shelterPage, setShelterPage] = useState(1);
  const [shelterSlideOpen, setShelterSlideOpen] = useState(false);
  const [editingShelter, setEditingShelter] = useState<Shelter | null>(null);
  const [detailsShelter, setDetailsShelter] = useState<AdminShelterDetails | null>(null);
  const [loadingDetailsShelter, setLoadingDetailsShelter] = useState(false);
  const [pendingDeleteShelter, setPendingDeleteShelter] = useState<ShelterSummaryRow | null>(null);

  const [shelterForm, setShelterForm] = useState<AdminShelterFormValues>(EMPTY_ADMIN_SHELTER_FORM);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof AdminShelterFormValues, string>>>({});

  const {
    data: sheltersData,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: [
      ...ADMIN_SHELTERS_QUERY_KEY,
      {
        page: shelterPage,
        limit: shelterPageSize,
        search: shelterQuery.trim(),
      },
    ],
    queryFn: () =>
      listAdminSheltersPaginated({
        page: shelterPage,
        limit: shelterPageSize,
        search: shelterQuery.trim(),
      }),
  });

  const { isRefreshing, refresh } = useRefresh(async () => {
    await refetch();
    try {
      setShelters(await shelterService.list());
    } catch {
      // Keep previous cached shelters
    }
  });
  const showLoading = isLoading || isFetching || isRefreshing;

  const shelterRows = sheltersData?.items ?? [];
  const totalShelterRows = sheltersData?.total ?? 0;

  const handleFormSaved = async () => {
    setShelterSlideOpen(false);
    setEditingShelter(null);
    setShelterForm(EMPTY_ADMIN_SHELTER_FORM);
    setFormErrors({});
    try {
      setShelters(await shelterService.list());
    } catch {
      // Keep previous values
    }
  };

  const {
    createMutation,
    updateMutation,
    deleteMutation,
    isSaving,
    isDeleting,
  } = useAdminShelterMutations({
    onCreated: handleFormSaved,
    onUpdated: handleFormSaved,
    onDeleted: async () => {
      setPendingDeleteShelter(null);
      try {
        setShelters(await shelterService.list());
      } catch {
        // Keep previous values
      }
    },
  });

  const handleOpenAdd = () => {
    setEditingShelter(null);
    setShelterForm(EMPTY_ADMIN_SHELTER_FORM);
    setFormErrors({});
    setShelterSlideOpen(true);
  };

  const handleOpenEdit = (shelter: Shelter) => {
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
    setFormErrors({});
    setShelterSlideOpen(true);
  };

  const handleOpenDetails = (row: ShelterSummaryRow) => {
    setDetailsShelter({ ...row, staffList: [] });
    setLoadingDetailsShelter(true);
    getAdminShelter(row.shelter.id)
      .then((details) => setDetailsShelter(details))
      .catch(() => toast.error('Failed to load shelter details.'))
      .finally(() => setLoadingDetailsShelter(false));
  };

  const handleShelterSubmit = (e: FormEvent) => {
    e.preventDefault();
    const parsed = adminShelterSchema.safeParse(shelterForm);
    if (!parsed.success) {
      const fieldErrors = toFieldErrors<keyof AdminShelterFormValues>(parsed.error.issues);
      setFormErrors(fieldErrors);
      focusFirstError();
      return;
    }

    setFormErrors({});
    const input = {
      name: shelterForm.name.trim(),
      location: shelterForm.location.trim(),
      address: shelterForm.address.trim(),
      email: shelterForm.email.trim(),
      phone: shelterForm.phone.trim(),
      operatingHours: shelterForm.operatingHours.trim(),
      description: shelterForm.description.trim() || 'Partner rescue shelter.',
      imageUrl:
        shelterForm.imageUrl.trim() ||
        'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=800&q=80',
    };

    if (editingShelter) {
      updateMutation.mutate({ id: editingShelter.id, input });
    } else {
      createMutation.mutate(input);
    }
  };

  return (
    <div className="w-full px-4 py-6 sm:px-6">
      <SectionHeader
        title="Partner shelters"
        subtitle="Manage registered rescue organizations, staff assignments, and locations."
        actions={<RefreshButton onRefresh={refresh} />}
      />

      <div className="mt-6 space-y-4">
        <TableCard
          title="Shelters directory"
          description="All active rescue organizations on the platform."
          icon={Building2}
          action={
            <Button size="sm" onClick={handleOpenAdd}>
              <Plus className="size-4" /> Add shelter
            </Button>
          }
          toolbar={
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
          }
          isEmpty={!showLoading && shelterRows.length === 0}
          emptyTitle="No shelters found"
          emptyDescription={
            shelterQuery
              ? 'Try adjusting your search query.'
              : 'Add your first partner shelter to get started.'
          }
          footer={
            totalShelterRows > 0 ? (
              <TablePagination
                currentPage={shelterPage}
                totalItems={totalShelterRows}
                pageSize={shelterPageSize}
                onPageChange={(next) => setShelterPage(next)}
                onPageSizeChange={(newSize) => {
                  setShelterPageSize(newSize);
                  setShelterPage(1);
                }}
                label="shelters"
              />
            ) : undefined
          }
          contentClassName="px-0"
        >
          {/* Desktop Table */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Shelter</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-center">Pets</TableHead>
                  <TableHead className="text-center">Staff</TableHead>
                  <TableHead className="text-center">Pending Apps</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {showLoading ? (
                  <TableSkeletonRows columns={6} rows={6} avatar />
                ) : (
                  shelterRows.map((row) => (
                    <TableRow key={row.shelter.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <img
                            src={row.shelter.imageUrl}
                            alt={row.shelter.name}
                            className="size-10 shrink-0 rounded-lg object-cover"
                          />
                          <div className="min-w-0">
                            <p className="font-medium">{row.shelter.name}</p>
                            <p className="truncate text-xs text-muted-foreground">
                              {row.shelter.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{row.shelter.location}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="muted">{row.petCount}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="info">{row.staff}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={row.pendingApplications > 0 ? 'warning' : 'muted'}>
                          {row.pendingApplications}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="text-muted-foreground"
                            aria-label={`View ${row.shelter.name} details`}
                            onClick={() => handleOpenDetails(row)}
                          >
                            <Eye className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="text-muted-foreground"
                            aria-label={`Edit ${row.shelter.name}`}
                            onClick={() => handleOpenEdit(row.shelter)}
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="text-muted-foreground hover:text-destructive"
                            aria-label={`Remove ${row.shelter.name}`}
                            onClick={() => setPendingDeleteShelter(row)}
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
            {showLoading ? (
              <RecordCardSkeleton count={3} />
            ) : (
              shelterRows.map((row) => (
                <AdminShelterMobileCard
                  key={row.shelter.id}
                  row={row}
                  onView={handleOpenDetails}
                  onEdit={(r) => handleOpenEdit(r.shelter)}
                  onDelete={setPendingDeleteShelter}
                />
              ))
            )}
          </div>
        </TableCard>
      </div>

      <AdminShelterFormSlideOver
        open={shelterSlideOpen}
        editingShelter={editingShelter}
        form={shelterForm}
        formErrors={formErrors}
        isSaving={isSaving}
        onClose={() => {
          setShelterSlideOpen(false);
          setEditingShelter(null);
        }}
        onChange={(field, val) => {
          setShelterForm((prev) => ({ ...prev, [field]: val }));
          if (formErrors[field]) setFormErrors((prev) => ({ ...prev, [field]: undefined }));
        }}
        onSubmit={handleShelterSubmit}
      />

      <AdminShelterDetailsModal
        details={detailsShelter}
        loadingDetails={loadingDetailsShelter}
        onClose={() => setDetailsShelter(null)}
        onEdit={(d) => {
          const shelter = d.shelter;
          setDetailsShelter(null);
          handleOpenEdit(shelter);
        }}
      />

      <ConfirmDeleteModal
        open={pendingDeleteShelter !== null}
        onClose={() => setPendingDeleteShelter(null)}
        onConfirm={() => {
          if (!pendingDeleteShelter) return;
          deleteMutation.mutate({
            id: pendingDeleteShelter.shelter.id,
            name: pendingDeleteShelter.shelter.name,
          });
        }}
        title={`Remove ${pendingDeleteShelter?.shelter.name ?? 'shelter'}?`}
        description={
          pendingDeleteShelter
            ? `${pendingDeleteShelter.shelter.name} currently has ${pendingDeleteShelter.petCount} pets registered (${pendingDeleteShelter.publicPets} public) and ${pendingDeleteShelter.pendingApplications} pending applications. Removing it will delete all associated records.`
            : ''
        }
        confirmLabel="Remove shelter"
        isDeleting={isDeleting}
      />
    </div>
  );
};
