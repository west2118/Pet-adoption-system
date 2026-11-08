import { useQuery } from '@tanstack/react-query';
import { Eye, FileSignature, Lock, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'react-toastify';

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
  WaiverTemplateFormModal,
  WaiverTemplateMobileCard,
  WaiverTemplatePreviewModal,
} from '@/components/waivers';
import {
  EMPTY_WAIVER_TEMPLATE_FORM,
  type WaiverTemplateFormErrors,
  type WaiverTemplateFormValues,
} from '@/data/waiverTemplates';
import { useAuth } from '@/hooks/useAuth';
import { usePets, useShelters } from '@/hooks/useData';
import { useRefresh } from '@/hooks/useRefresh';
import { toFieldErrors, waiverTemplateFormSchema } from '@/lib/validators';
import {
  SHELTER_WAIVER_TEMPLATES_QUERY_KEY,
  useShelterWaiverMutations,
} from '@/hooks/useShelterWaiverMutations';
import { waiverService } from '@/services/waiverService';
import type { WaiverTemplate } from '@/types';
import { describeApiError } from '@/utils/errors';
import { formatDate } from '@/utils/formatters';

export const ShelterEWaiversPage = () => {
  const { user } = useAuth();
  const { pets } = usePets();
  const { shelters } = useShelters();

  // Filters and pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [query, setQuery] = useState('');

  // Dialog state
  const [detailsId, setDetailsId] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<WaiverTemplate | null>(null);
  const [form, setForm] = useState<WaiverTemplateFormValues>(EMPTY_WAIVER_TEMPLATE_FORM);
  const [formErrors, setFormErrors] = useState<WaiverTemplateFormErrors>({});
  const [pendingDelete, setPendingDelete] = useState<WaiverTemplate | null>(null);

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: [
      ...SHELTER_WAIVER_TEMPLATES_QUERY_KEY,
      { page, pageSize, search: query.trim() },
    ],
    queryFn: () =>
      waiverService.listTemplatesPaginated({
        page,
        limit: pageSize,
        search: query.trim(),
      }),
  });

  const { isRefreshing, refresh } = useRefresh(refetch);
  const showLoading = isLoading || isFetching || isRefreshing;

  const templates = data?.items ?? [];
  const totalTemplates = data?.total ?? 0;
  const loadError = error
    ? describeApiError(error, 'Failed to load waiver templates.')
    : null;

  const handleSaved = () => {
    setEditorOpen(false);
    setEditing(null);
  };

  const { createMutation, updateMutation, deleteMutation, isSaving, isDeleting } =
    useShelterWaiverMutations({
      onCreated: handleSaved,
      onUpdated: handleSaved,
      onDeleted: () => {
        setPendingDelete(null);
        setDetailsId(null);
      },
    });

  const detailsTemplate =
    templates.find((template) => template.id === detailsId) ?? null;

  const previewShelter =
    (user?.shelterId ? shelters.find((s) => s.id === user.shelterId) : undefined) ??
    shelters[0] ??
    null;

  const closeEditor = () => {
    if (isSaving) return;
    setEditorOpen(false);
    setEditing(null);
  };

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_WAIVER_TEMPLATE_FORM);
    setFormErrors({});
    setEditorOpen(true);
  };

  const openEdit = (template: WaiverTemplate) => {
    setEditing(template);
    setDetailsId(null);
    setForm({
      name: template.name,
      category: template.category,
      body: template.body,
    });
    setFormErrors({});
    setEditorOpen(true);
  };

  const handleChange = (patch: Partial<WaiverTemplateFormValues>) => {
    setForm((previous) => ({ ...previous, ...patch }));
    setFormErrors((previous) => ({
      ...previous,
      ...('name' in patch ? { name: undefined } : {}),
      ...('body' in patch ? { body: undefined } : {}),
    }));
  };

  const handleSubmit = () => {
    if (isSaving) return;

    const parsed = waiverTemplateFormSchema.safeParse(form);
    if (!parsed.success) {
      setFormErrors(toFieldErrors<keyof WaiverTemplateFormValues>(parsed.error.issues));
      toast.warning('Please fix the highlighted fields.');
      focusFirstError();
      return;
    }
    setFormErrors({});

    if (editing) {
      updateMutation.mutate({ id: editing.id, updates: parsed.data });
    } else {
      createMutation.mutate(parsed.data);
    }
  };

  return (
    <div className="w-full px-4 py-6 sm:px-6">
      <SectionHeader
        title="E-Waivers"
        subtitle="Manage the waiver templates bundled into the printable e-waiver adopters sign at handover."
        actions={<RefreshButton onRefresh={refresh} />}
      />

      <div className="mt-6 space-y-4">
        <TableCard
          title="Waiver templates"
          description="Platform defaults plus your shelter's private templates."
          icon={FileSignature}
          toolbar={
            <div className="flex flex-wrap items-center justify-between gap-2">
              <DebouncedSearchInput
                aria-label="Search waiver templates"
                value={query}
                onDebouncedChange={(value) => {
                  setQuery(value);
                  setPage(1);
                }}
                placeholder="Search name or category"
                className="sm:w-[280px]"
              />
              <Button size="sm" onClick={openAdd}>
                <Plus className="size-4" /> Add template
              </Button>
            </div>
          }
          error={loadError}
          errorTitle="Could not load templates"
          onRetry={() => void refetch()}
          footer={
            totalTemplates > 10 ? (
              <TablePagination
                currentPage={page}
                totalItems={totalTemplates}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={(newSize) => {
                  setPageSize(newSize);
                  setPage(1);
                }}
                label="templates"
              />
            ) : undefined
          }
          isEmpty={!showLoading && !error && templates.length === 0}
          emptyTitle="No waivers found"
          emptyDescription="Try a different search, or add a new template."
          contentClassName="px-0"
        >
          {/* Desktop: data table */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Template</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Last updated</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {showLoading ? (
                  <TableSkeletonRows columns={4} rows={5} />
                ) : (
                  templates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell>
                        <p className="font-medium">{template.name}</p>
                        {template.isDefault ? (
                          <Badge variant="info" className="mt-1">
                            Default · locked
                          </Badge>
                        ) : (
                          <Badge variant="muted" className="mt-1 gap-1">
                            <Lock className="size-3" aria-hidden="true" /> Private to your
                            shelter
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {template.category}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {formatDate(template.updatedAt)}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="text-muted-foreground"
                            aria-label={`Preview ${template.name}`}
                            onClick={() => setDetailsId(template.id)}
                          >
                            <Eye className="size-4" />
                          </Button>
                          {!template.isDefault && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                className="text-blue-600 hover:bg-blue-50 hover:text-blue-700 dark:text-blue-400 dark:hover:bg-blue-950/40"
                                aria-label={`Edit ${template.name}`}
                                onClick={() => openEdit(template)}
                              >
                                <Pencil className="size-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/40"
                                aria-label={`Delete ${template.name}`}
                                onClick={() => setPendingDelete(template)}
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </>
                          )}
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
            {showLoading ? (
              <RecordCardSkeleton count={4} />
            ) : (
              templates.map((template) => (
                <WaiverTemplateMobileCard
                  key={template.id}
                  template={template}
                  onView={(item) => setDetailsId(item.id)}
                  onEdit={openEdit}
                  onDelete={setPendingDelete}
                />
              ))
            )}
          </div>
        </TableCard>
      </div>

      <WaiverTemplateFormModal
        open={editorOpen}
        template={editing}
        form={form}
        errors={formErrors}
        shelter={previewShelter}
        pets={pets}
        isSaving={isSaving}
        onChange={handleChange}
        onClose={closeEditor}
        onSubmit={handleSubmit}
      />

      <WaiverTemplatePreviewModal
        template={detailsTemplate}
        shelter={previewShelter}
        pets={pets}
        onClose={() => setDetailsId(null)}
        onEdit={openEdit}
      />

      <ConfirmDeleteModal
        open={pendingDelete !== null}
        onClose={() => (isDeleting ? undefined : setPendingDelete(null))}
        onConfirm={() => {
          if (pendingDelete) {
            deleteMutation.mutate({ id: pendingDelete.id, name: pendingDelete.name });
          }
        }}
        title="Delete waiver template?"
        description="This removes the template from your shelter's catalogue. Already-issued e-waivers keep their own copy and are not affected."
        itemName={pendingDelete?.name}
        confirmLabel="Delete template"
        isDeleting={isDeleting}
      />
    </div>
  );
};
