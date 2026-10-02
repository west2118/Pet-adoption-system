import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Container } from '@/components/layout/Container';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Input, Textarea, Select, Label } from '@/components/ui/Form';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { applicationService, petService } from '@/services/api';
import type { Pet } from '@/types';

export const AdoptionFormPage = () => {
  const { petId } = useParams<{ petId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [pet, setPet] = useState<Pet | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    applicantName: user?.name ?? '',
    email: user?.email ?? '',
    phone: '',
    address: '',
    housingType: 'house',
    hasOtherPets: 'no',
    experience: '',
    reason: '',
  });

  useEffect(() => {
    if (!petId) return;
    petService.getById(petId).then((p) => setPet(p ?? null));
  }, [petId]);

  const set = (key: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!petId || !user) return;
    setSubmitting(true);
    await applicationService.create({
      petId,
      applicantId: user.id,
      applicantName: form.applicantName,
      email: form.email,
      phone: form.phone,
      address: form.address,
      housingType: form.housingType as 'house' | 'apartment' | 'condo' | 'other',
      hasOtherPets: form.hasOtherPets === 'yes',
      experience: form.experience,
      reason: form.reason,
    });
    setSubmitting(false);
    navigate('/applications', { replace: true });
  };

  if (pet?.visibility === 'private') {
    return (
      <Container className="max-w-3xl py-6">
        <Link to="/pets" className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to browse
        </Link>
        <p className="mt-4 rounded-xl border bg-card p-5 text-sm">
          This pet is not available for adoption.
        </p>
      </Container>
    );
  }

  return (
    <Container className="max-w-3xl py-6">
      <Link to={petId ? `/pets/${petId}` : '/pets'} className="text-sm text-muted-foreground hover:text-foreground">
        ← Back to pet profile
      </Link>
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>
            Adoption application{pet ? ` for ${pet.name}` : ''}
          </CardTitle>
          <CardDescription>
            Status starts at <strong>Submitted</strong>. The shelter will move it
            to Under Review → Approved → Adopted.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="app-name">Full name</Label>
              <Input id="app-name" value={form.applicantName} onChange={(e) => set('applicantName', e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="app-email">Email</Label>
              <Input id="app-email" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="app-phone">Phone</Label>
              <Input id="app-phone" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+63 …" required />
            </div>
            <div>
              <Label htmlFor="app-address">Address</Label>
              <Input id="app-address" value={form.address} onChange={(e) => set('address', e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="app-housing">Housing type</Label>
              <Select
                id="app-housing"
                value={form.housingType}
                onChange={(e) => set('housingType', e.target.value)}
                options={[
                  { value: 'house', label: 'House' },
                  { value: 'apartment', label: 'Apartment' },
                  { value: 'condo', label: 'Condo' },
                  { value: 'other', label: 'Other' },
                ]}
              />
            </div>
            <div>
              <Label htmlFor="app-pets">Do you have other pets?</Label>
              <Select
                id="app-pets"
                value={form.hasOtherPets}
                onChange={(e) => set('hasOtherPets', e.target.value)}
                options={[
                  { value: 'no', label: 'No' },
                  { value: 'yes', label: 'Yes' },
                ]}
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="app-exp">Pet experience</Label>
              <Textarea
                id="app-exp"
                value={form.experience}
                onChange={(e) => set('experience', e.target.value)}
                placeholder="Tell us about past pets, lifestyle, work schedule…"
                required
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="app-reason">Why do you want to adopt?</Label>
              <Textarea
                id="app-reason"
                value={form.reason}
                onChange={(e) => set('reason', e.target.value)}
                placeholder="Why is this pet a good fit for your home?"
                required
              />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? 'Submitting…' : 'Submit application'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </Container>
  );
};
