import {
  Building2,
  Loader2,
  LocateFixed,
  MapPin,
  Phone,
  Mail,
  Clock,
  ImageIcon,
  ShieldCheck,
  FileCheck2,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { GridOverlay, LocationMapPreview, Reveal } from '@/components/shared';
import { Button } from '@/components/ui/button';
import {
  ValidatedInput,
  ValidatedTextarea,
  focusFirstError,
  isBlank,
  isEmail,
  isUrl,
} from '@/components/shared';
import { ApiError, tokenStore } from '@/lib/apiClient';
import { locateAddress, toGeolocationFailure } from '@/lib/geocode';
import { authService } from '@/services/authService';

const frame = 'mx-auto w-full max-w-[1400px] px-6 lg:px-12';

const labelClass = 'font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground';
const controlClass = 'h-11 rounded-lg bg-background text-[15px]';

/** Mirrors the review stages the platform applies to a shelter application. */
const REVIEW_STEPS = [
  { title: 'Submitted', copy: 'We email you a confirmation as soon as your form lands.' },
  { title: 'Under review', copy: 'Our team verifies your details and rescue credentials.' },
  { title: 'Approved', copy: 'Your shelter account is activated and listings open up.' },
];

const EMPTY_FORM = {
  name: '',
  location: '',
  address: '',
  phone: '',
  email: '',
  operatingHours: '',
  description: '',
  imageUrl: '',
};

export const ShelterOnboardingPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof typeof EMPTY_FORM, string>>>({});

  // Only reachable with a valid onboarding token (issued at shelter signup).
  useEffect(() => {
    if (!tokenStore.getOnboarding()) {
      navigate('/signup', { replace: true });
    }
  }, [navigate]);

  const set = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
    // A hand-typed address no longer matches the pinned coordinates.
    if (key === 'address') setCoords(null);
  };

  // Fills the address (and city/region) from the shelter's current GPS location.
  const handleUseLocation = async () => {
    if (locating) return;
    setLocating(true);
    try {
      const { address, location, latitude, longitude } = await locateAddress();
      if (!address) {
        toast.error('Could not determine your address from that location.');
        return;
      }
      setForm((prev) => ({
        ...prev,
        address,
        location: location || prev.location,
      }));
      setCoords({ latitude, longitude });
      setFieldErrors((prev) => ({ ...prev, address: undefined, location: undefined }));
      toast.success('Address filled from your current location.');
    } catch (err) {
      const failure = toGeolocationFailure(err);
      const messages: Record<typeof failure, string> = {
        unsupported: 'Location is not supported on this device.',
        denied: 'Location access was denied. Enable it in your browser to continue.',
        unavailable: 'Your location could not be determined. Please enter it manually.',
        timeout: 'Getting your location timed out. Please try again.',
        geocode_failed: 'Could not look up that address. Please enter it manually.',
      };
      toast.error(messages[failure]);
    } finally {
      setLocating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: typeof fieldErrors = {};
    if (isBlank(form.name)) next.name = 'Please enter the shelter name.';
    if (isBlank(form.location)) next.location = 'Please enter the city / region.';
    if (isBlank(form.address)) next.address = 'Please enter the full address.';
    if (isBlank(form.phone)) next.phone = 'Please enter a contact phone.';
    if (!isEmail(form.email)) next.email = 'Enter a valid shelter email.';
    if (isBlank(form.operatingHours)) next.operatingHours = 'Please enter operating hours.';
    if (isBlank(form.description)) next.description = 'Please describe the shelter.';
    else if (form.description.trim().length < 20)
      next.description = 'Description must be at least 20 characters.';
    if (!isUrl(form.imageUrl)) next.imageUrl = 'Enter a valid image URL (https://…).';
    setFieldErrors(next);
    if (Object.keys(next).length > 0) {
      focusFirstError();
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await authService.submitShelterApplication({
        ...form,
        imageUrl: form.imageUrl.trim() || undefined,
      });
      toast.success('Shelter application submitted! We will email you once reviewed.');
      navigate('/onboarding/shelter/pending', { replace: true });
    } catch (err) {
      // Already submitted → go straight to the pending screen.
      if (err instanceof ApiError && err.status === 409) {
        toast.info('You already submitted an application. Checking its status…');
        navigate('/onboarding/shelter/pending', { replace: true });
        return;
      }
      const message = err instanceof ApiError ? err.message : 'Unable to submit. Please try again.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="landing-theme">
      {/* ------------------------------------------------------------- HERO */}
      <section className="relative overflow-hidden bg-background pt-20 pb-16 md:pt-28 md:pb-20">
        <div className="absolute inset-0 z-0" aria-hidden="true">
          <GridOverlay />
          <div className="absolute -right-20 top-1/4 size-[36rem] rounded-full bg-[var(--brand)]/15 blur-[120px] pointer-events-none" />
          <div className="absolute -left-20 bottom-0 size-[28rem] rounded-full bg-primary/10 blur-[100px] pointer-events-none" />
        </div>

        <div className={`relative z-10 ${frame}`}>
          <Reveal>
            <p className="text-center font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
              Partner onboarding
            </p>
          </Reveal>

          <Reveal delay={80}>
            <h1 className="mt-6 text-center font-display text-[clamp(2.5rem,7vw,5.5rem)] leading-[0.9] tracking-tight">
              <span className="block text-primary">Shelter</span>
              <span className="block">details</span>
            </h1>
          </Reveal>

          <p className="mx-auto mt-8 max-w-2xl text-center text-muted-foreground">
            Tell us about your rescue. Once submitted, our team reviews your application and
            emails you the moment your account is approved.
          </p>
        </div>
      </section>

      {/* ------------------------------------------------------------- FORM */}
      <section className="bg-background pb-20 md:pb-28">
        <div className={frame}>
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
            {/* Left — context rail */}
            <aside className="lg:col-span-4">
              <div className="lg:sticky lg:top-28">
                <div className="rounded-lg border border-border bg-card p-6">
                  <span className="flex size-11 items-center justify-center rounded-xl bg-[var(--brand)] text-white">
                    <Building2 className="size-5" />
                  </span>

                  <span className="mt-6 inline-flex items-center gap-3 font-mono text-sm text-muted-foreground">
                    <span className="h-px w-12 bg-[var(--brand)]" />
                    Review process
                  </span>

                  <ol className="mt-7 space-y-6">
                    {REVIEW_STEPS.map((step, i) => (
                      <li key={step.title} className="flex gap-4">
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--brand-tint)] font-mono text-[11px] text-primary">
                          {i + 1}
                        </span>
                        <span className="min-w-0">
                          <span className="block font-medium">{step.title}</span>
                          <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">
                            {step.copy}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ol>

                  <p className="mt-7 flex items-start gap-2 border-t border-border pt-5 text-sm text-muted-foreground">
                    <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
                    Every partner is verified before their listings go public.
                  </p>
                </div>
              </div>
            </aside>

            {/* Right — the form */}
            <div className="lg:col-span-8">
              <div className="rounded-lg border border-border bg-card p-6 md:p-10">
                <div className="flex items-center gap-3">
                  <FileCheck2 className="size-5 text-primary" />
                  <h2 className="text-xl font-medium tracking-tight">Organization profile</h2>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  All fields below are required for verification.
                </p>

                <form
                  onSubmit={handleSubmit}
                  noValidate
                  className="mt-9 grid gap-6 sm:grid-cols-2"
                >
                  <div className="space-y-2 sm:col-span-2">
                    <label className={labelClass} htmlFor="ob-name">
                      Shelter name
                    </label>
                    <ValidatedInput
                      id="ob-name"
                      value={form.name}
                      onChange={(e) => set('name', e.target.value)}
                      placeholder="Happy Tails Rescue"
                      error={fieldErrors.name}
                      className={controlClass}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className={labelClass} htmlFor="ob-location">
                      City / region
                    </label>
                    <div className="relative">
                      <MapPin className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <ValidatedInput
                        id="ob-location"
                        value={form.location}
                        onChange={(e) => set('location', e.target.value)}
                        placeholder="Quezon City"
                        error={fieldErrors.location}
                        className={`${controlClass} pl-9`}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className={labelClass} htmlFor="ob-phone">
                      Contact phone
                    </label>
                    <div className="relative">
                      <Phone className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <ValidatedInput
                        id="ob-phone"
                        value={form.phone}
                        onChange={(e) => set('phone', e.target.value)}
                        placeholder="+63 2 8555 0101"
                        error={fieldErrors.phone}
                        className={`${controlClass} pl-9`}
                      />
                    </div>
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <label className={labelClass} htmlFor="ob-address">
                        Full address
                      </label>
                      <button
                        type="button"
                        onClick={handleUseLocation}
                        disabled={locating}
                        className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary disabled:opacity-60"
                      >
                        {locating ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <LocateFixed className="size-3.5" />
                        )}
                        {locating ? 'Locating…' : 'Use my location'}
                      </button>
                    </div>
                    <ValidatedInput
                      id="ob-address"
                      value={form.address}
                      onChange={(e) => set('address', e.target.value)}
                      placeholder="123 Bayani St, Quezon City"
                      error={fieldErrors.address}
                      className={controlClass}
                    />
                    {coords && (
                      <LocationMapPreview
                        latitude={coords.latitude}
                        longitude={coords.longitude}
                        label={form.address}
                        className="pt-1"
                      />
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className={labelClass} htmlFor="ob-email">
                      Shelter email
                    </label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <ValidatedInput
                        id="ob-email"
                        type="email"
                        value={form.email}
                        onChange={(e) => set('email', e.target.value)}
                        placeholder="hello@happytails.ph"
                        error={fieldErrors.email}
                        className={`${controlClass} pl-9`}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className={labelClass} htmlFor="ob-hours">
                      Operating hours
                    </label>
                    <div className="relative">
                      <Clock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <ValidatedInput
                        id="ob-hours"
                        value={form.operatingHours}
                        onChange={(e) => set('operatingHours', e.target.value)}
                        placeholder="Mon–Sat, 9:00 AM – 6:00 PM"
                        error={fieldErrors.operatingHours}
                        className={`${controlClass} pl-9`}
                      />
                    </div>
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <label className={labelClass} htmlFor="ob-desc">
                      About the shelter
                    </label>
                    <ValidatedTextarea
                      id="ob-desc"
                      value={form.description}
                      onChange={(e) => set('description', e.target.value)}
                      placeholder="Describe your mission, the animals you rescue, and your adoption process…"
                      error={fieldErrors.description}
                      className="min-h-32 rounded-lg bg-background text-[15px]"
                    />
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <label className={labelClass} htmlFor="ob-image">
                      Logo / photo URL (optional)
                    </label>
                    <div className="relative">
                      <ImageIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <ValidatedInput
                        id="ob-image"
                        type="url"
                        value={form.imageUrl}
                        onChange={(e) => set('imageUrl', e.target.value)}
                        placeholder="https://…"
                        error={fieldErrors.imageUrl}
                        className={`${controlClass} pl-9`}
                      />
                    </div>
                  </div>

                  {error && (
                    <p
                      role="alert"
                      className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive sm:col-span-2"
                    >
                      {error}
                    </p>
                  )}

                  <div className="border-t border-border pt-6 sm:col-span-2">
                    <Button
                      type="submit"
                      disabled={submitting}
                      className="h-12 w-full rounded-full text-[15px] sm:w-auto sm:px-10"
                    >
                      {submitting ? 'Submitting…' : 'Submit for approval'}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};