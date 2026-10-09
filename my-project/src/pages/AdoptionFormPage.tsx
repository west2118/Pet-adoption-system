import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  FileCheck2,
  HeartHandshake,
  MapPin,
  PawPrint,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { BlurText, GridOverlay, Reveal } from '@/components/shared';
import { Input, Textarea, Select, Label } from '@/components/ui/Form';
import { Button } from '@/components/ui/button';
import { ApplicationStatusBadge } from '@/components/ui/StatusBadge';
import { useAuth } from '@/hooks/useAuth';
import { usePets, useShelters } from '@/hooks/useData';
import { applicationService } from '@/services/api';
import { adoptionApplicationService } from '@/services/adoptionApplicationService';
import { ApiError, tokenStore } from '@/lib/apiClient';
import type { Pet } from '@/types';

const frame = 'mx-auto w-full max-w-[1400px] px-6 lg:px-12';

/** Red asterisk marking a required field, used inside every form label. */
const RequiredMark = () => (
  <span aria-hidden="true" className="text-destructive">
    {' *'}
  </span>
);

const STEPS = [
  {
    n: '01',
    title: 'Submit',
    text: 'Tell the shelter about your home, routine, and experience.',
  },
  {
    n: '02',
    title: 'Under review',
    text: 'Staff verify your details and may schedule a home visit.',
  },
  {
    n: '03',
    title: 'Approved → Adopted',
    text: 'Pick up your new companion and finalize the adoption.',
  },
];

export const AdoptionFormPage = () => {
  const { petId } = useParams<{ petId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { pets } = usePets();
  const { shelters } = useShelters();

  const [pet, setPet] = useState<Pet | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
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

  // Keep the form in sync when the session user resolves after mount.
  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      applicantName: prev.applicantName || user?.name || '',
      email: prev.email || user?.email || '',
    }));
  }, [user?.name, user?.email]);

  useEffect(() => {
    if (!petId) return;
    const found = pets.find((p) => p.id === petId) ?? null;
    setPet(found);
  }, [petId, pets]);

  const shelter = useMemo(
    () => shelters.find((s) => s.id === pet?.shelterId),
    [shelters, pet],
  );

  const set = (key: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!petId || !user) return;
    if (
      !form.applicantName.trim() ||
      !form.email.trim() ||
      !form.phone.trim() ||
      !form.address.trim() ||
      !form.experience.trim() ||
      !form.reason.trim()
    ) {
      setSubmitError('All fields are required. Please complete every field before submitting.');
      return;
    }
    if (form.reason.trim().length < 10) {
      setSubmitError('Please tell the shelter a little more — at least 10 characters.');
      return;
    }
    setSubmitting(true);
    setSubmitError(null);

    const payload = {
      petId,
      applicantName: form.applicantName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
      housingType: form.housingType as 'house' | 'apartment' | 'condo' | 'other',
      hasOtherPets: form.hasOtherPets === 'yes',
      experience: form.experience.trim(),
      reason: form.reason.trim(),
    };

    try {
      // Dynamic path: write to the backend when a real session exists so the
      // shelter applications table and the adopter's own list read the same row.
      if (tokenStore.get()) {
        try {
          await adoptionApplicationService.create(payload);
          toast.success(`Application sent for ${pet?.name ?? 'your pet'}!`);
          navigate('/applications', { replace: true });
          return;
        } catch (err) {
          // Demo listings use non-UUID ids (p1, p2…) that the API rejects, and
          // the backend may be unreachable — fall through to the local store
          // so adopters can still complete the flow in preview mode.
          if (err instanceof ApiError && err.status !== 0 && err.code !== 'VALIDATION_ERROR') {
            throw err;
          }
        }
      }
      await applicationService.create({ ...payload, applicantId: user.id });
      toast.success(`Application sent for ${pet?.name ?? 'your pet'}!`);
      navigate('/applications', { replace: true });
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.details?.map((d) => d.message).join(' ') ?? err.message
          : 'Could not submit your application. Please try again.';
      setSubmitError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (pet?.visibility === 'private') {
    return (
      <div className="landing-theme">
        <section className="relative overflow-hidden bg-background py-20 md:py-28">
          <div className="absolute inset-0 z-0" aria-hidden="true">
            <GridOverlay />
          </div>
          <div className={`relative z-10 ${frame} max-w-3xl text-center`}>
            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
              Adoption application
            </p>
            <h1 className="mt-6 font-display text-4xl tracking-tight md:text-5xl">
              This pet is not available for adoption.
            </h1>
            <Link to="/pets" className="mt-8 inline-block">
              <Button className="h-11 rounded-full px-7">Back to browse</Button>
            </Link>
          </div>
        </section>
      </div>
    );
  }

  const stats = [
    { value: pet?.name ?? '—', label: 'applying for' },
    { value: shelter?.location ?? '—', label: 'shelter city' },
    { value: 'Submitted', label: 'starting status' },
    { value: '2–5 days', label: 'typical review' },
  ];

  return (
    <div className="landing-theme">
      {/* ------------------------------------------------------------- HERO */}
      <section className="relative overflow-hidden bg-background py-20 md:py-28">
        <div className="absolute inset-0 z-0" aria-hidden="true">
          <GridOverlay />
          <div className="absolute -right-20 top-1/4 size-[36rem] rounded-full bg-[var(--brand)]/15 blur-[120px] pointer-events-none" />
          <div className="absolute -left-20 bottom-10 size-[28rem] rounded-full bg-primary/10 blur-[100px] pointer-events-none" />
        </div>

        <div className={`relative z-10 ${frame}`}>
          <Reveal>
            <p className="text-center font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
              Adoption application
            </p>
          </Reveal>
          <Reveal delay={80}>
            <h1 className="mt-6 text-center font-display text-[clamp(2.75rem,8vw,7rem)] leading-[0.9] tracking-tight">
              <span className="block text-primary">Bring {pet?.name ?? 'them'}</span>
              <span className="block">home.</span>
            </h1>
          </Reveal>
          <BlurText
            as="p"
            delay={200}
            className="mx-auto mt-10 max-w-3xl justify-center text-center text-2xl leading-relaxed text-muted-foreground md:text-3xl"
          >
            {pet
              ? `${pet.breed} · ${pet.ageYears} yr old · ${shelter?.name ?? 'partner shelter'}. Tell the shelter about your home — it takes about two minutes.`
              : 'Tell the shelter about your home — it takes about two minutes.'}
          </BlurText>
          <Reveal delay={300} className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              to={petId ? `/pets/${petId}` : '/pets'}
              className="font-mono text-xs uppercase tracking-[0.2em] text-primary hover:text-primary/75"
            >
              ← Back to pet profile
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ------------------------------------------------------------ STATS */}
      <section className="border-y border-border bg-background">
        <div className={`grid grid-cols-2 md:grid-cols-4 ${frame}`}>
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              className={[
                'px-2 py-10 text-center md:px-4 md:py-14',
                i % 2 === 1 ? 'border-l border-border' : '',
                i >= 2 ? 'border-t border-border md:border-t-0' : '',
                'md:border-l md:first:border-l-0',
              ].join(' ')}
            >
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                {stat.label}
              </p>
              <p className="mt-3 font-display text-2xl tracking-tight text-foreground md:text-4xl">
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* -------------------------------------------------------- FORM + PET */}
      <section className="bg-background py-20 md:py-28">
        <div className={frame}>
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
            {/* Left: pet summary + process */}
            <div className="lg:col-span-5">
              <Reveal>
                <span className="inline-flex items-center gap-3 font-mono text-sm text-muted-foreground">
                  <span className="h-px w-12 bg-[var(--brand)]" />
                  Who you are applying for
                </span>
                {pet ? (
                  <article className="group mt-6 overflow-hidden border border-border bg-card">
                    <div className="relative overflow-hidden">
                      <img
                        src={pet.imageUrl}
                        alt={pet.name}
                        className="aspect-[16/10] w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute left-4 top-4">
                        <ApplicationStatusBadge status="Submitted" />
                      </div>
                    </div>
                    <div className="p-6 md:p-8">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <h2 className="font-display text-3xl tracking-tight">{pet.name}</h2>
                        <span className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-primary">
                          <BadgeCheck className="size-3.5" />
                          {pet.status}
                        </span>
                      </div>
                      <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                        {pet.breed} · {pet.species} · {pet.gender}
                      </p>
                      <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                        {pet.description}
                      </p>
                      <div className='flex flex-col'>
                        {shelter && (
                          <p className="mt-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                            <MapPin className="size-4" />
                            {shelter.name} · {shelter.location}
                          </p>
                        )}
                        <Link
                          to={`/pets/${pet.id}`}
                          className="group/link mt-6 inline-flex items-center gap-3 font-mono text-xs uppercase tracking-[0.2em] text-primary transition-colors hover:text-primary/75"
                        >
                          View full profile
                          <span className="h-px w-8 bg-current transition-all duration-300 group-hover/link:w-12" />
                        </Link>
                      </div>
                    </div>
                  </article>
                ) : (
                  <div className="mt-6 rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                    <PawPrint className="mx-auto size-6" />
                    <p className="mt-3">Loading pet details…</p>
                  </div>
                )}
              </Reveal>

              <Reveal delay={150}>
                <div className="mt-8 border border-border bg-card p-6 md:p-8">
                  <span className="inline-flex items-center gap-3 font-mono text-sm text-muted-foreground">
                    <FileCheck2 className="size-4 text-primary" />
                    What happens next
                  </span>
                  <ol className="mt-6 space-y-6">
                    {STEPS.map((s) => (
                      <li key={s.n} className="flex gap-4">
                        <span className="font-display text-2xl text-primary/50">{s.n}</span>
                        <div>
                          <p className="font-medium">{s.title}</p>
                          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                            {s.text}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ol>
                  <p className="mt-6 border-t border-border pt-5 text-xs leading-relaxed text-muted-foreground">
                    Track every stage from your Applications page. The shelter sees your
                    submission in its applications table the moment you send it.
                  </p>
                </div>
              </Reveal>
            </div>

            {/* Right: the form */}
            <Reveal delay={100} className="lg:col-span-7">
              <form
                onSubmit={handleSubmit}
                className="border border-border bg-card p-6 md:p-10"
              >
                <span className="inline-flex items-center gap-3 font-mono text-sm text-muted-foreground">
                  <span className="h-px w-12 bg-[var(--brand)]" />
                  Your application
                </span>
                <h2 className="mt-4 font-display text-3xl tracking-tight md:text-4xl">
                  About you<span className="text-primary/45">.</span>
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  Status starts at <strong className="text-foreground">Submitted</strong>.
                  The shelter moves it to Under Review → Approved → Adopted.
                </p>

                {submitError && (
                  <p role="alert" className="mt-6 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                    {submitError}
                  </p>
                )}

                <div className="mt-8 space-y-8">
                  <fieldset>
                    <legend className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                      Contact details
                    </legend>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label htmlFor="app-name">
                          Full name
                          <RequiredMark />
                        </Label>
                        <Input
                          id="app-name"
                          value={form.applicantName}
                          onChange={(e) => set('applicantName', e.target.value)}
                          required
                          autoComplete="name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="app-email">
                          Email
                          <RequiredMark />
                        </Label>
                        <Input
                          id="app-email"
                          type="email"
                          value={form.email}
                          onChange={(e) => set('email', e.target.value)}
                          required
                          autoComplete="email"
                        />
                      </div>
                      <div>
                        <Label htmlFor="app-phone">
                          Phone
                          <RequiredMark />
                        </Label>
                        <Input
                          id="app-phone"
                          value={form.phone}
                          onChange={(e) => set('phone', e.target.value)}
                          placeholder="+63 …"
                          required
                          autoComplete="tel"
                        />
                      </div>
                      <div>
                        <Label htmlFor="app-address">
                          Address
                          <RequiredMark />
                        </Label>
                        <Input
                          id="app-address"
                          value={form.address}
                          onChange={(e) => set('address', e.target.value)}
                          placeholder="City, Province"
                          required
                          autoComplete="street-address"
                        />
                      </div>
                    </div>
                  </fieldset>

                  <fieldset className="border-t border-border pt-8">
                    <legend className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                      Your home
                    </legend>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label htmlFor="app-housing">
                          Housing type
                          <RequiredMark />
                        </Label>
                        <Select
                          id="app-housing"
                          value={form.housingType}
                          onChange={(e) => set('housingType', e.target.value)}
                          required
                          options={[
                            { value: 'house', label: 'House' },
                            { value: 'apartment', label: 'Apartment' },
                            { value: 'condo', label: 'Condo' },
                            { value: 'other', label: 'Other' },
                          ]}
                        />
                      </div>
                      <div>
                        <Label htmlFor="app-pets">
                          Do you have other pets?
                          <RequiredMark />
                        </Label>
                        <Select
                          id="app-pets"
                          value={form.hasOtherPets}
                          onChange={(e) => set('hasOtherPets', e.target.value)}
                          required
                          options={[
                            { value: 'no', label: 'No' },
                            { value: 'yes', label: 'Yes' },
                          ]}
                        />
                      </div>
                    </div>
                  </fieldset>

                  <fieldset className="border-t border-border pt-8">
                    <legend className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                      Fit for {pet?.name ?? 'this pet'}
                    </legend>
                    <div className="mt-4 grid gap-4">
                      <div>
                        <Label htmlFor="app-exp">
                          Pet experience
                          <RequiredMark />
                        </Label>
                        <Textarea
                          id="app-exp"
                          value={form.experience}
                          onChange={(e) => set('experience', e.target.value)}
                          placeholder="Tell us about past pets, lifestyle, work schedule…"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="app-reason">
                          Why do you want to adopt? (min. 10 characters)
                          <RequiredMark />
                        </Label>
                        <Textarea
                          id="app-reason"
                          value={form.reason}
                          onChange={(e) => set('reason', e.target.value)}
                          placeholder={`Why is ${pet?.name ?? 'this pet'} a good fit for your home?`}
                          required
                          minLength={10}
                        />
                      </div>
                    </div>
                  </fieldset>

                  <Button
                    type="submit"
                    disabled={submitting}
                    className="h-12 w-full rounded-full text-sm font-medium shadow-md transition-all hover:shadow-lg"
                  >
                    {submitting ? 'Submitting…' : `Submit application${pet ? ` for ${pet.name}` : ''}`}
                    {!submitting && <ArrowRight className="size-4" />}
                  </Button>
                  <p className="text-center text-xs text-muted-foreground">
                    Visible to the shelter instantly · tracked on your Applications page.
                  </p>
                </div>
              </form>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- CTA */}
      <section className="relative overflow-hidden bg-[var(--brand-tint)] py-16 md:py-24">
        <div className={frame}>
          <Reveal className="text-center">
            <HeartHandshake className="mx-auto size-8 text-primary" />
            <h2 className="mx-auto mt-6 max-w-3xl font-display text-3xl leading-tight tracking-tight md:text-5xl">
              Not quite sure yet?
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-muted-foreground">
              Save {pet?.name ?? 'this pet'} to your favourites and come back anytime —
              or keep meeting rescues across our partner shelters.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link to="/pets">
                <Button size="lg" className="h-11 rounded-full px-7 text-[15px]">
                  Browse pets
                  <ArrowRight className="size-4" />
                </Button>
              </Link>
              <Link to="/shelters">
                <Button size="lg" variant="outline" className="h-11 rounded-full px-7 text-[15px]">
                  Meet the rescues
                </Button>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
};
