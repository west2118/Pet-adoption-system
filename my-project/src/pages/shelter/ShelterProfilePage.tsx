import { Check, Clock, Mail, MapPin, Pencil, Phone, ShieldCheck, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { SectionHeader } from '@/components/shared';
import { ValidatedInput, ValidatedTextarea, focusFirstError, isBlank, isEmail } from '@/components/shared';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/Feedback';
import { Textarea, Label } from '@/components/ui/Form';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useShelters } from '@/hooks/useData';
import { cn } from '@/lib/utils';

/** Read-only label + value used whenever the profile is NOT in edit mode. */
const DisplayField = ({
  label,
  value,
  multiline = false,
  className,
}: {
  label: string;
  value: string;
  multiline?: boolean;
  className?: string;
}) => (
  <div className={className}>
    <p className="mb-1.5 text-sm font-medium">{label}</p>
    <p
      className={cn(
        'text-sm break-words text-muted-foreground',
        multiline && 'whitespace-pre-wrap',
      )}
    >
      {value.trim() ? value : '—'}
    </p>
  </div>
);

export const ShelterProfilePage = () => {
  const { user } = useAuth();
  const { shelters, loading } = useShelters();
  // Staff always edit their own shelter's profile — never another shelter's.
  const shelter =
    (user?.shelterId ? shelters.find((s) => s.id === user.shelterId) : undefined) ??
    shelters[0];

  const [form, setForm] = useState({
    name: '',
    location: '',
    address: '',
    email: '',
    phone: '',
    operatingHours: '',
    description: '',
    adoptionPolicy: '',
    logoUrl: '',
  });
  // View mode by default: fields are display-only until "Edit info" is clicked.
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof typeof form, string>>>({});

  useEffect(() => {
    if (shelter) {
      setForm({
        name: shelter.name,
        location: shelter.location,
        address: shelter.address,
        email: shelter.email,
        phone: shelter.phone,
        operatingHours: shelter.operatingHours,
        description: shelter.description,
        adoptionPolicy: '',
        logoUrl: shelter.imageUrl,
      });
      setSaved(false);
      setFieldErrors({});
      setEditing(false);
    }
  }, [shelter]);

  const set = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
    setSaved(false);
  };

  const handleEdit = () => {
    setSaved(false);
    setFieldErrors({});
    setEditing(true);
  };

  const handleCancel = () => {
    if (shelter) {
      setForm({
        name: shelter.name,
        location: shelter.location,
        address: shelter.address,
        email: shelter.email,
        phone: shelter.phone,
        operatingHours: shelter.operatingHours,
        description: shelter.description,
        adoptionPolicy: '',
        logoUrl: shelter.imageUrl,
      });
    }
    setFieldErrors({});
    setSaved(false);
    setEditing(false);
  };

  const handleSave = (e?: React.FormEvent) => {
    e?.preventDefault();
    const next: typeof fieldErrors = {};
    if (isBlank(form.name)) next.name = 'Please enter the shelter name.';
    if (isBlank(form.location)) next.location = 'Please enter the city / location.';
    if (isBlank(form.address)) next.address = 'Please enter the street address.';
    if (!isEmail(form.email)) next.email = 'Enter a valid contact email.';
    if (isBlank(form.phone)) next.phone = 'Please enter a phone number.';
    if (isBlank(form.operatingHours)) next.operatingHours = 'Please enter operating hours.';
    if (isBlank(form.description)) next.description = 'Please describe the shelter.';
    setFieldErrors(next);
    if (Object.keys(next).length > 0) {
      toast.warning('Please fix the highlighted fields.');
      focusFirstError();
      return;
    }
    setSaved(true);
    setEditing(false);
    toast.success('Shelter profile saved successfully!');
  };

  return (
    <div className="w-full px-4 py-6 sm:px-6">
      <SectionHeader
        title="Shelter profile"
        subtitle={
          editing
            ? 'Update your identity, contact details, and public description.'
            : 'Keep your identity, contact details, and public description up to date.'
        }
        actions={
          shelter ? (
            editing ? (
              <div className="flex items-center gap-2">
                <Button type="button" size="sm" variant="outline" onClick={handleCancel}>
                  <X className="size-4" /> Cancel
                </Button>
                <Button type="button" size="sm" onClick={handleSave}>
                  <Check className="size-4" /> Save changes
                </Button>
              </div>
            ) : (
              <Button type="button" size="sm" variant="outline" onClick={handleEdit}>
                <Pencil className="size-4" /> Edit info
              </Button>
            )
          ) : undefined
        }
      />

      <div className="mt-6">
        {loading && <p className="text-sm text-muted-foreground">Loading…</p>}

        {!loading && !shelter && (
          <EmptyState title="No shelter found" description="Your shelter profile will appear here." />
        )}

        {shelter && (
          <div className="space-y-4">
            {saved && (
              <p className="flex items-center gap-1.5 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm font-medium text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-300">
                <Check className="size-4" /> Profile saved successfully.
              </p>
            )}

            {/* Identity */}
            <Card className="overflow-hidden">
              <CardContent className="flex flex-col gap-4 pt-5 sm:flex-row sm:items-center">
                <img
                  src={form.logoUrl || shelter.imageUrl}
                  alt={`${form.name || shelter.name} logo`}
                  className="size-20 shrink-0 rounded-xl border object-cover"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-bold tracking-tight">
                      {form.name || shelter.name}
                    </h2>
                    <Badge variant="success">
                      <ShieldCheck className="size-3" /> Verified shelter
                    </Badge>
                  </div>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="size-3.5 shrink-0" />
                    {form.address || shelter.address}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Mail className="size-3.5" /> {form.email || shelter.email}
                    </span>
                    <span className="flex items-center gap-1">
                      <Phone className="size-3.5" /> {form.phone || shelter.phone}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="size-3.5" /> {form.operatingHours || shelter.operatingHours}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {editing ? (
              /* ------------------------------ Edit mode ------------------------------ */
              <form onSubmit={handleSave} noValidate className="space-y-4">
                {/* Organization */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Organization</CardTitle>
                    <CardDescription>Name, location, and logo shown across the platform.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="profile-name">Shelter name</Label>
                      <ValidatedInput id="profile-name" value={form.name} onChange={(e) => set('name', e.target.value)} error={fieldErrors.name} />
                    </div>
                    <div>
                      <Label htmlFor="profile-location">City / location</Label>
                      <ValidatedInput id="profile-location" value={form.location} onChange={(e) => set('location', e.target.value)} error={fieldErrors.location} />
                    </div>
                    <div className="sm:col-span-2">
                      <Label htmlFor="profile-address">Street address</Label>
                      <ValidatedInput id="profile-address" value={form.address} onChange={(e) => set('address', e.target.value)} error={fieldErrors.address} />
                    </div>
                    <div className="sm:col-span-2">
                      <Label htmlFor="profile-logo">Logo / photo URL</Label>
                      <ValidatedInput
                        id="profile-logo"
                        value={form.logoUrl}
                        onChange={(e) => set('logoUrl', e.target.value)}
                        placeholder="https://…"
                        error={fieldErrors.logoUrl}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Contact & hours */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Contact & hours</CardTitle>
                    <CardDescription>How adopters reach you and when to visit.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="profile-email">Contact email</Label>
                      <ValidatedInput id="profile-email" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} error={fieldErrors.email} />
                    </div>
                    <div>
                      <Label htmlFor="profile-phone">Phone</Label>
                      <ValidatedInput id="profile-phone" value={form.phone} onChange={(e) => set('phone', e.target.value)} error={fieldErrors.phone} />
                    </div>
                    <div className="sm:col-span-2">
                      <Label htmlFor="profile-hours">Operating hours</Label>
                      <ValidatedInput id="profile-hours" value={form.operatingHours} onChange={(e) => set('operatingHours', e.target.value)} error={fieldErrors.operatingHours} />
                    </div>
                  </CardContent>
                </Card>

                {/* Public profile */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Public profile</CardTitle>
                    <CardDescription>Story and rules adopters see on your shelter page.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-3">
                    <div>
                      <Label htmlFor="profile-desc">About your shelter</Label>
                      <ValidatedTextarea id="profile-desc" value={form.description} onChange={(e) => set('description', e.target.value)} error={fieldErrors.description} />
                    </div>
                    <div>
                      <Label htmlFor="profile-policy">Adoption policy</Label>
                      <Textarea
                        id="profile-policy"
                        value={form.adoptionPolicy}
                        onChange={(e) => set('adoptionPolicy', e.target.value)}
                        placeholder="e.g. Home visit required, adoption fee covers vaccination…"
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button type="submit" size="sm">
                        <Check className="size-4" /> Save shelter profile
                      </Button>
                      <Button type="button" size="sm" variant="outline" onClick={handleCancel}>
                        <X className="size-4" /> Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </form>
            ) : (
              /* ----------------------------- View mode ----------------------------- */
              <div className="space-y-4">
                {/* Organization */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Organization</CardTitle>
                    <CardDescription>Name, location, and logo shown across the platform.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-3 sm:grid-cols-2">
                    <DisplayField label="Shelter name" value={form.name} />
                    <DisplayField label="City / location" value={form.location} />
                    <DisplayField label="Street address" value={form.address} className="sm:col-span-2" />
                    <DisplayField label="Logo / photo URL" value={form.logoUrl} className="sm:col-span-2" />
                  </CardContent>
                </Card>

                {/* Contact & hours */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Contact & hours</CardTitle>
                    <CardDescription>How adopters reach you and when to visit.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-3 sm:grid-cols-2">
                    <DisplayField label="Contact email" value={form.email} />
                    <DisplayField label="Phone" value={form.phone} />
                    <DisplayField label="Operating hours" value={form.operatingHours} className="sm:col-span-2" />
                  </CardContent>
                </Card>

                {/* Public profile */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Public profile</CardTitle>
                    <CardDescription>Story and rules adopters see on your shelter page.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-3">
                    <DisplayField label="About your shelter" value={form.description} multiline />
                    <DisplayField label="Adoption policy" value={form.adoptionPolicy} multiline />
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
