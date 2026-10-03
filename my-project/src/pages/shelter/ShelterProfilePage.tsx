import { Check, Clock, Mail, MapPin, Phone, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { SectionHeader } from '@/components/shared';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/Feedback';
import { Input, Textarea, Label } from '@/components/ui/Form';
import { Button } from '@/components/ui/button';
import { useShelters } from '@/hooks/useData';

export const ShelterProfilePage = () => {
  const { shelters, loading } = useShelters();
  const shelter = shelters[0];

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
  const [saved, setSaved] = useState(false);

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
    }
  }, [shelter]);

  const set = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
  };

  return (
    <div className="w-full px-4 py-6 sm:px-6">
      <SectionHeader
        title="Shelter profile"
        subtitle="Keep your identity, contact details, and public description up to date."
        actions={
          shelter ? (
            <Button size="sm" onClick={handleSave}>
              <Check className="size-4" /> Save changes
            </Button>
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

            <form onSubmit={handleSave} className="space-y-4">
              {/* Organization */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Organization</CardTitle>
                  <CardDescription>Name, location, and logo shown across the platform.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="profile-name">Shelter name</Label>
                    <Input id="profile-name" value={form.name} onChange={(e) => set('name', e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="profile-location">City / location</Label>
                    <Input id="profile-location" value={form.location} onChange={(e) => set('location', e.target.value)} />
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="profile-address">Street address</Label>
                    <Input id="profile-address" value={form.address} onChange={(e) => set('address', e.target.value)} />
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="profile-logo">Logo / photo URL</Label>
                    <Input
                      id="profile-logo"
                      value={form.logoUrl}
                      onChange={(e) => set('logoUrl', e.target.value)}
                      placeholder="https://…"
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
                    <Input id="profile-email" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="profile-phone">Phone</Label>
                    <Input id="profile-phone" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="profile-hours">Operating hours</Label>
                    <Input id="profile-hours" value={form.operatingHours} onChange={(e) => set('operatingHours', e.target.value)} />
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
                    <Textarea id="profile-desc" value={form.description} onChange={(e) => set('description', e.target.value)} />
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
                  <div>
                    <Button type="submit" size="sm">
                      <Check className="size-4" /> Save shelter profile
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
