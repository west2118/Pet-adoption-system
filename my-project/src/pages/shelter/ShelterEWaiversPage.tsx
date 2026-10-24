import { Check, Eye, FileSignature, Lock, Pencil, Plus, Search } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { toast } from 'react-toastify';
import {
  DetailsModal,
  RecordCard,
  RecordCardSkeleton,
  SectionHeader,
  TableCard,
  TablePagination,
  TableSkeletonRows,
  ValidatedInput,
  focusFirstError,
  isBlank,
} from '@/components/shared';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Input, Label, Select } from '@/components/ui/Form';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/Feedback';
import { CustomWaiverTemplateDocument } from '@/components/features/CustomWaiverTemplateDocument';
import { WaiverPrintDocument } from '@/components/features/WaiverPrintDocument';
import { WaiverTemplateEditor } from '@/components/features/WaiverTemplateEditor';
import { ApiError } from '@/lib/apiClient';
import { waiverService } from '@/services/waiverService';
import { useAuth } from '@/hooks/useAuth';
import { usePets, useShelters } from '@/hooks/useData';
import { formatWaiverBodyPreview } from '@/lib/waiverContent';
import type { Pet, Shelter, Waiver, WaiverTemplate, WaiverTemplateStatus } from '@/types';
import { formatDate } from '@/utils/formatters';

const CATEGORY_OPTIONS = [
  { value: 'Adoption', label: 'Adoption' },
  { value: 'Foster', label: 'Foster' },
  { value: 'Medical', label: 'Medical' },
  { value: 'Media', label: 'Media' },
  { value: 'Logistics', label: 'Logistics' },
  { value: 'General', label: 'General' },
];

const STATUS_OPTIONS = [
  { value: 'Active', label: 'Active' },
  { value: 'Draft', label: 'Draft' },
];

const emptyForm = {
  name: '',
  category: 'Adoption',
  body: '',
  status: 'Active' as WaiverTemplateStatus,
};

export const ShelterEWaiversPage = () => {
  const { user } = useAuth();
  const { pets } = usePets();
  const { shelters } = useShelters();
  const [templates, setTemplates] = useState<WaiverTemplate[]>([]);
  const [totalTemplates, setTotalTemplates] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [detailsId, setDetailsId] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<WaiverTemplate | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState<{ name?: string; body?: string }>({});

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await waiverService.listTemplatesPaginated({
        page,
        limit: pageSize,
        search: query.trim(),
      });
      setTemplates(res.items);
      setTotalTemplates(res.total);
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : 'Failed to load waiver templates.');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, query]);

  useEffect(() => {
    // Fetches remote data whenever the page/filter changes; the loading flag
    // is set by the fetch itself rather than derived during render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTemplates();
  }, [fetchTemplates]);

  const detailsTemplate = detailsId
    ? (templates.find((t) => t.id === detailsId) ?? null)
    : null;

  const previewShelter: Shelter | null =
    (user?.shelterId ? shelters.find((s) => s.id === user.shelterId) : undefined) ??
    shelters[0] ??
    null;

  /**
   * Sample waiver backing the PDF-look preview and the editor's live preview:
   * the shelter's own details plus sample adopter/pet data (first listing when
   * one exists). Clearly marked as a preview — nothing is issued or stored.
   */
  const buildSampleWaiver = (
    template: Pick<WaiverTemplate, 'id' | 'name' | 'category' | 'body' | 'isDefault'>,
  ): Waiver | null => {
    if (!previewShelter) return null;
    const samplePet: Pet =
      pets.find((p) => p.shelterId === previewShelter.id) ?? ({
        id: 'sample-pet',
        name: 'Sample Pet',
        species: 'dog',
        breed: 'Sample Breed',
        birthdate: '2023-06-01',
        ageYears: 3,
        ageGroup: 'adult',
        size: 'medium',
        gender: 'male',
        temperament: ['Friendly'],
        shelterId: previewShelter.id,
        visibility: 'public',
        description: 'Sample preview pet.',
        medicalHistory: ['Rabies vaccine', 'Vet health check'],
        behavioralNotes: 'Sample behavioral note.',
        status: 'Available',
        imageUrl: '',
        gallery: [],
        vaccinated: true,
        spayedNeutered: true,
        goodWithKids: true,
        goodWithPets: true,
        microchipped: true,
        dewormed: true,
        houseTrained: false,
        goodWithStrangers: false,
        leashTrained: false,
        crateTrained: false,
        litterTrained: false,
        apartmentFriendly: false,
        dateAdded: new Date().toISOString().slice(0, 10),
      } as Pet);
    const now = new Date().toISOString();
    return {
      id: 'sample-waiver',
      applicationId: 'sample-application',
      shelterId: previewShelter.id,
      snapshot: {
        application: {
          id: 'sample-application',
          applicantName: 'Sample Adopter',
          email: 'sample.adopter@example.com',
          phone: '+63 900 000 0000',
          address: '123 Sample Street, Quezon City',
          status: 'Approved',
        },
        pet: samplePet,
        shelter: previewShelter,
        templates: [
          {
            id: template.id,
            name: template.name,
            category: template.category,
            body: template.body,
            isDefault: template.isDefault,
          },
        ],
        issuedAt: now,
      },
      createdAt: now,
      updatedAt: now,
    };
  };

  const previewWaiver = detailsTemplate ? buildSampleWaiver(detailsTemplate) : null;

  const editorTemplate = {
    id: editing?.id ?? 'preview-template',
    name: form.name.trim() || 'Untitled waiver template',
    category: form.category,
    body: form.body,
    isDefault: false,
  };
  const editorPreviewWaiver = buildSampleWaiver(editorTemplate);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
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
      status: template.status,
    });
    setFormErrors({});
    setEditorOpen(true);
  };

  const toggleStatus = async (template: WaiverTemplate) => {
    const next: WaiverTemplateStatus = template.status === 'Active' ? 'Draft' : 'Active';
    try {
      const updated = await waiverService.updateTemplate(template.id, { status: next });
      setTemplates((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      toast.success(`"${template.name}" is now ${next.toLowerCase()}.`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to update template.');
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    const errors: { name?: string; body?: string } = {};
    if (isBlank(form.name)) errors.name = 'Please enter the template name.';
    if (isBlank(form.body)) errors.body = 'Please enter the waiver text.';
    else if (form.body.trim().length < 10)
      errors.body = 'Waiver text must be at least 10 characters.';
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      toast.warning('Please fix the highlighted fields.');
      focusFirstError();
      return;
    }
    setIsSaving(true);
    try {
      if (editing) {
        const updated = await waiverService.updateTemplate(editing.id, {
          name: form.name.trim(),
          category: form.category,
          body: form.body.trim(),
          status: form.status,
        });
        setTemplates((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
        toast.success(`"${updated.name}" updated successfully!`);
      } else {
        const created = await waiverService.createTemplate({
          name: form.name.trim(),
          category: form.category,
          body: form.body.trim(),
          status: form.status,
        });
        setTemplates((prev) => [...prev, created]);
        toast.success(`"${created.name}" created successfully!`);
      }
      setEditorOpen(false);
      setEditing(null);
      await fetchTemplates();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to save template.');
    } finally {
      setIsSaving(false);
    }
  };

  const toolbar = (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          aria-label="Search waiver templates"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
          placeholder="Search name or category"
          className="h-9 w-full pl-8 sm:w-[280px]"
        />
      </div>
      <Button size="sm" onClick={openAdd}>
        <Plus className="size-4" /> Add template
      </Button>
    </div>
  );

  const pagination =
    totalTemplates > 0 ? (
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
    ) : undefined;

  return (
    <div className="w-full px-4 py-6 sm:px-6">
      <SectionHeader
        title="E-Waivers"
        subtitle="Waiver templates bundled into the printable e-waiver adopters sign at handover. The 5 platform defaults are locked; templates your shelter creates are private to your shelter and can use formatted headings, lists, notices, and tables."
      />

      <div className="mt-6 space-y-4">
        <TableCard
          title="Waiver templates"
          description={
            loading
              ? 'Loading templates…'
              : `${templates.length} of ${totalTemplates} templates`
          }
          icon={FileSignature}
          toolbar={toolbar}
          footer={pagination}
          isEmpty={!loading && templates.length === 0}
          emptyTitle={loadError ?? 'No waivers found'}
          emptyDescription={
            loadError ?? 'Try a different search, or add a new template.'
          }
          contentClassName="px-0"
        >
          {loadError ? (
            <div className="p-6">
              <EmptyState
                title="Could not load templates"
                description={loadError}
                action={
                  <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                    Retry
                  </Button>
                }
              />
            </div>
          ) : (
            <>
              {/* Desktop: data table */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Template</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Last updated</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableSkeletonRows columns={5} rows={5} />
                    ) : templates.map((template) => (
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
                        <TableCell>
                          <Badge variant={template.status === 'Active' ? 'success' : 'muted'}>
                            {template.status}
                          </Badge>
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
                                  className={
                                    template.status === 'Active'
                                      ? 'text-muted-foreground'
                                      : 'text-green-600 hover:bg-green-50 hover:text-green-700 dark:text-green-400 dark:hover:bg-green-950/40'
                                  }
                                  aria-label={`${template.status === 'Active' ? 'Deactivate' : 'Activate'} ${template.name}`}
                                  onClick={() => toggleStatus(template)}
                                >
                                  <Check className="size-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile: stacked cards */}
              <div className="grid gap-3 p-4 md:hidden">
                {loading ? (
                  <RecordCardSkeleton count={4} />
                ) : templates.map((template) => (
                  <RecordCard
                    key={template.id}
                    title={template.name}
                    subtitle={`${template.category} · ${formatDate(template.updatedAt)}`}
                    badges={
                      <>
                        <Badge variant={template.status === 'Active' ? 'success' : 'muted'}>
                          {template.status}
                        </Badge>
                        {template.isDefault ? (
                          <Badge variant="info">Default</Badge>
                        ) : (
                          <Badge variant="muted">
                            <Lock className="size-3" aria-hidden="true" /> Private
                          </Badge>
                        )}
                      </>
                    }
                    actions={
                      <>
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
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="text-blue-600 hover:bg-blue-50 hover:text-blue-700 dark:text-blue-400 dark:hover:bg-blue-950/40"
                            aria-label={`Edit ${template.name}`}
                            onClick={() => openEdit(template)}
                          >
                            <Pencil className="size-4" />
                          </Button>
                        )}
                      </>
                    }
                  >
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {formatWaiverBodyPreview(template.body)}
                    </p>
                  </RecordCard>
                ))}
              </div>
            </>
          )}
        </TableCard>
      </div>

      <DetailsModal
        open={editorOpen}
        onClose={() => {
          if (isSaving) return;
          setEditorOpen(false);
          setEditing(null);
        }}
        title={editing ? `Edit ${editing.name}` : 'Add waiver template'}
        description={
          editing
            ? 'Update the template below. Already-issued waivers keep their original text.'
            : 'Compose a formatted waiver, then bundle it into e-waivers at handover.'
        }
        icon={editing ? Pencil : Plus}
        size="2xl"
        footer={
          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="w-full"
              disabled={isSaving}
              onClick={() => {
                setEditorOpen(false);
                setEditing(null);
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="waiver-template-form"
              size="lg"
              className="w-full"
              disabled={isSaving}
              aria-busy={isSaving}
            >
              {isSaving ? 'Saving…' : editing ? 'Save changes' : 'Create template'}
            </Button>
          </div>
        }
      >
        <form id="waiver-template-form" onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="flex items-start gap-2.5 rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-xs text-teal-900 dark:border-teal-900/60 dark:bg-teal-950/40 dark:text-teal-200">
            <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            <p>
              <span className="font-semibold">
                Private to {previewShelter?.name ?? 'your shelter'}.
              </span>{' '}
              Only staff signed in to this shelter can see, edit, or bundle this template. Other
              shelters never see it.
            </p>
          </div>

          <div>
            <Label htmlFor="waiver-name">Name</Label>
            <ValidatedInput
              id="waiver-name"
              value={form.name}
              onChange={(e) => {
                setForm({ ...form, name: e.target.value });
                setFormErrors((p) => ({ ...p, name: undefined }));
              }}
              placeholder="e.g. Adoption Liability Waiver"
              required
              error={formErrors.name}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Category</Label>
              <Select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                required
                options={CATEGORY_OPTIONS}
              />
            </div>
            <div>
              <Label>Status</Label>
              <Select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as WaiverTemplateStatus })}
                required
                options={STATUS_OPTIONS}
              />
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="min-w-0">
              <Label htmlFor="waiver-body">Template content</Label>
              <WaiverTemplateEditor
                id="waiver-body"
                value={form.body}
                onChange={(body) => {
                  setForm({ ...form, body });
                  setFormErrors((p) => ({ ...p, body: undefined }));
                }}
                error={formErrors.body}
              />
            </div>
            <div className="min-w-0">
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <span className="text-sm font-medium">Live document preview</span>
                <span className="text-xs text-muted-foreground">Reflects your formatting</span>
              </div>
              <div className="waiver-preview max-h-[520px] overflow-y-auto">
                <CustomWaiverTemplateDocument
                  template={editorTemplate}
                  waiver={editorPreviewWaiver}
                  preview
                />
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">
                Sample adopter, pet, and shelter details are shown. Saved templates keep this
                layout in every issued e-waiver.
              </p>
            </div>
          </div>
        </form>
      </DetailsModal>

      <DetailsModal
        open={detailsTemplate !== null}
        onClose={() => setDetailsId(null)}
        title={detailsTemplate?.name ?? 'Waiver'}
        description={
          detailsTemplate ? `${detailsTemplate.category} · sample PDF preview` : undefined
        }
        icon={FileSignature}
        size="xl"
        footer={
          detailsTemplate ? (
            detailsTemplate.isDefault ? (
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto sm:min-w-32"
                  onClick={() => setDetailsId(null)}
                >
                  Close
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="w-full"
                  onClick={() => setDetailsId(null)}
                >
                  Close
                </Button>
                <Button
                  type="button"
                  size="lg"
                  className="w-full"
                  onClick={() => openEdit(detailsTemplate)}
                >
                  <Pencil className="size-4" /> Edit template
                </Button>
              </div>
            )
          ) : undefined
        }
      >
        {detailsTemplate && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant={detailsTemplate.status === 'Active' ? 'success' : 'muted'}>
                {detailsTemplate.status}
              </Badge>
              <Badge variant="muted">Updated {formatDate(detailsTemplate.updatedAt)}</Badge>
              {detailsTemplate.isDefault ? (
                <Badge variant="info">
                  <Lock className="size-3" aria-hidden="true" /> Platform default · locked
                </Badge>
              ) : (
                <Badge variant="muted">
                  <Lock className="size-3" aria-hidden="true" /> Private to your shelter
                </Badge>
              )}
              <Badge variant="info">Sample preview — not issued</Badge>
            </div>
            {previewWaiver ? (
              <div className="waiver-preview">
                <WaiverPrintDocument waiver={previewWaiver} preview />
              </div>
            ) : detailsTemplate.isDefault ? (
              <div className="rounded-lg border p-3">
                <p className="text-sm leading-relaxed">{detailsTemplate.body}</p>
              </div>
            ) : (
              <div className="waiver-preview">
                <CustomWaiverTemplateDocument template={detailsTemplate} preview />
              </div>
            )}
          </div>
        )}
      </DetailsModal>
    </div>
  );
};
