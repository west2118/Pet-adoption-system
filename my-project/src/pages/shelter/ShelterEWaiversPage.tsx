import { Check, Eye, FileSignature, Pencil, Plus, Search } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { toast } from 'react-toastify';
import {
  DetailsModal,
  RecordCard,
  SectionHeader,
  SlideOver,
  TableCard,
  TablePagination,
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
import { Input, Label, Select, Textarea } from '@/components/ui/Form';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/Feedback';
import { WaiverPrintDocument } from '@/components/features/WaiverPrintDocument';
import { ApiError } from '@/lib/apiClient';
import { waiverService } from '@/services/waiverService';
import { useAuth } from '@/hooks/useAuth';
import { usePets, useShelters } from '@/hooks/useData';
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
  const [slideOpen, setSlideOpen] = useState(false);
  const [editing, setEditing] = useState<WaiverTemplate | null>(null);
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
   * Sample waiver backing the PDF-look preview: the real legal form for this
   * template's category, filled with the shelter's own details plus sample
   * adopter/pet data (first listing when one exists). Clearly marked as a
   * preview — nothing here is issued or stored.
   */
  const previewWaiver: Waiver | null = (() => {
    if (!detailsTemplate || !previewShelter) return null;
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
            id: detailsTemplate.id,
            name: detailsTemplate.name,
            category: detailsTemplate.category,
            body: detailsTemplate.body,
          },
        ],
        issuedAt: now,
      },
      createdAt: now,
      updatedAt: now,
    };
  })();

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormErrors({});
    setSlideOpen(true);
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
    setSlideOpen(true);
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
      setSlideOpen(false);
      setEditing(null);
      await fetchTemplates();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to save template.');
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
        subtitle="Waiver templates bundled into the printable e-waiver adopters sign at handover."
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
          {loading ? (
            <p className="p-6 text-sm text-muted-foreground">Loading templates…</p>
          ) : loadError ? (
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
                    {templates.map((template) => (
                      <TableRow key={template.id}>
                        <TableCell>
                          <p className="font-medium">{template.name}</p>
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
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile: stacked cards */}
              <div className="grid gap-3 p-4 md:hidden">
                {templates.map((template) => (
                  <RecordCard
                    key={template.id}
                    title={template.name}
                    subtitle={`${template.category} · ${formatDate(template.updatedAt)}`}
                    badges={
                      <Badge variant={template.status === 'Active' ? 'success' : 'muted'}>
                        {template.status}
                      </Badge>
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
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-blue-600 hover:bg-blue-50 hover:text-blue-700 dark:text-blue-400 dark:hover:bg-blue-950/40"
                          aria-label={`Edit ${template.name}`}
                          onClick={() => openEdit(template)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                      </>
                    }
                  >
                    <p className="line-clamp-2 text-sm text-muted-foreground">{template.body}</p>
                  </RecordCard>
                ))}
              </div>
            </>
          )}
        </TableCard>
      </div>

      <SlideOver
        open={slideOpen}
        onClose={() => {
          setSlideOpen(false);
          setEditing(null);
        }}
        title={editing ? `Edit ${editing.name}` : 'Add waiver template'}
        description={
          editing
            ? 'Update the template below. Already-issued waivers keep their original text.'
            : 'New templates can be bundled into e-waivers at handover.'
        }
        icon={editing ? Pencil : Plus}
        footer={
          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="w-full"
              onClick={() => {
                setSlideOpen(false);
                setEditing(null);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" form="waiver-template-form" size="lg" className="w-full">
              {editing ? 'Save changes' : 'Create template'}
            </Button>
          </div>
        }
      >
        <form id="waiver-template-form" onSubmit={handleSubmit} noValidate className="grid gap-3">
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
          <div>
            <Label htmlFor="waiver-body">Waiver text</Label>
            <Textarea
              id="waiver-body"
              value={form.body}
              onChange={(e) => {
                setForm({ ...form, body: e.target.value });
                setFormErrors((p) => ({ ...p, body: undefined }));
              }}
              placeholder="The full waiver wording adopters agree to… (min. 10 characters)"
              required
              minLength={10}
              rows={8}
              aria-invalid={Boolean(formErrors.body)}
              className={
                formErrors.body
                  ? 'border-destructive focus-visible:border-destructive focus-visible:ring-destructive/40'
                  : undefined
              }
            />
            {formErrors.body && (
              <p role="alert" className="mt-1 text-[13px] text-destructive">
                {formErrors.body}
              </p>
            )}
          </div>
        </form>
      </SlideOver>

      <DetailsModal
        open={detailsTemplate !== null}
        onClose={() => setDetailsId(null)}
        title={detailsTemplate?.name ?? 'Waiver'}
        description={
          detailsTemplate ? `${detailsTemplate.category} · sample PDF preview` : undefined
        }
        icon={FileSignature}
        size="lg"
        footer={
          detailsTemplate ? (
            <div className="grid grid-cols-2 gap-3">
              <Button type="button" variant="outline" size="lg" className="w-full" onClick={() => setDetailsId(null)}>
                Close
              </Button>
              <Button type="button" size="lg" className="w-full" onClick={() => openEdit(detailsTemplate)}>
                <Pencil className="size-4" /> Edit template
              </Button>
            </div>
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
              <Badge variant="info">Sample preview — not issued</Badge>
            </div>
            {previewWaiver ? (
              <div className="rounded-lg border bg-white p-4 sm:p-6">
                <WaiverPrintDocument waiver={previewWaiver} />
              </div>
            ) : (
              <div className="rounded-lg border p-3">
                <p className="text-sm leading-relaxed">{detailsTemplate.body}</p>
              </div>
            )}
          </div>
        )}
      </DetailsModal>
    </div>
  );
};
