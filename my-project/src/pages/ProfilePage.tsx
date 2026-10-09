import { ArrowRight, Heart, HeartHandshake, Pencil } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { BlurText, GridOverlay, Reveal, focusFirstError, isBlank, isUrl } from '@/components/shared';
import { ValidatedInput } from '@/components/shared';
import { ApplicationCard } from '@/components/features/ApplicationCard';
import { PetCard } from '@/components/features/PetCard';
import { EmptyState, LoadingGrid } from '@/components/ui/Feedback';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/Form';
import { useAuth } from '@/hooks/useAuth';
import { useFavorites } from '@/hooks/useFavorites';
import { useApplications, usePets, useShelters } from '@/hooks/useData';
import { publicPets } from '@/data/mockData';
import { ApiError } from '@/lib/apiClient';

const frame = 'mx-auto w-full max-w-[1400px] px-6 lg:px-12';

const userInitials = (name: string): string =>
  name
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');

export const ProfilePage = () => {
  const { user, updateProfile } = useAuth();
  const { applications, loading: appsLoading } = useApplications(user?.id, 'mine');
  const { pets } = usePets();
  const { shelters } = useShelters();
  const { favorites, loading: favLoading } = useFavorites();

  const [form, setForm] = useState({ name: user?.name ?? '', avatarUrl: user?.avatarUrl ?? '' });
  const [formUserId, setFormUserId] = useState<string | undefined>(user?.id);
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; avatarUrl?: string }>({});
  const [saving, setSaving] = useState(false);

  // Re-seed the form when a different account signs in (render-phase
  // adjustment — the documented alternative to syncing state in an effect).
  if (formUserId !== user?.id) {
    setFormUserId(user?.id);
    setForm({ name: user?.name ?? '', avatarUrl: user?.avatarUrl ?? '' });
    setFieldErrors({});
  }

  const petById = (id: string) => pets.find((p) => p.id === id);
  const locationByShelter = new Map(shelters.map((s) => [s.id, s.location]));

  const savedPets = publicPets(pets).filter((p) => favorites.includes(p.id));
  const adoptedCount = applications.filter((a) => a.status === 'Adopted').length;
  const approvedCount = applications.filter((a) => a.status === 'Approved').length;

  const stats = [
    { value: applications.length || '—', label: 'applications sent' },
    { value: savedPets.length || '—', label: 'pets saved' },
    { value: approvedCount || '—', label: 'approved' },
    { value: adoptedCount || '—', label: 'adopted' },
  ];

  const recentApplications = applications.slice(0, 3);
  const favoritePreview = savedPets.slice(0, 3);
  const dataLoading = appsLoading || favLoading;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: typeof fieldErrors = {};
    if (isBlank(form.name)) next.name = 'Please enter your name.';
    const avatar = form.avatarUrl.trim();
    if (avatar !== '' && !isUrl(avatar)) next.avatarUrl = 'Enter a valid photo URL or leave it blank.';
    setFieldErrors(next);
    if (Object.keys(next).length > 0) {
      toast.warning('Please fix the highlighted fields.');
      focusFirstError();
      return;
    }
    setSaving(true);
    try {
      await updateProfile({ name: form.name.trim(), avatarUrl: avatar === '' ? null : avatar });
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not save your profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="landing-theme">
      {/* ------------------------------------------------------------- HERO */}
      <section className="relative overflow-hidden bg-background py-20 md:py-28 lg:py-32">
        <div className="absolute inset-0 z-0" aria-hidden="true">
          <GridOverlay />
          <div className="absolute -right-20 top-1/4 size-[36rem] rounded-full bg-[var(--brand)]/15 blur-[120px] pointer-events-none" />
          <div className="absolute -left-20 bottom-10 size-[28rem] rounded-full bg-primary/10 blur-[100px] pointer-events-none" />
        </div>

        <div className={`relative z-10 ${frame}`}>
          <Reveal>
            <p className="text-center font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
              Your profile
            </p>
          </Reveal>

          <Reveal delay={80} className="mt-8 flex flex-col items-center gap-5">
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="size-20 rounded-full border border-border object-cover shadow-md"
              />
            ) : (
              <span className="flex size-20 items-center justify-center rounded-full bg-[var(--brand-tint)] font-display text-2xl text-primary shadow-md">
                {userInitials(user?.name ?? '?')}
              </span>
            )}
            <h1 className="text-center font-display text-[clamp(2.75rem,8vw,7rem)] leading-[0.9] tracking-tight">
              <span className="block text-primary">{user?.name?.split(' ')[0] ?? 'Your'}</span>
              <span className="block">profile</span>
            </h1>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Badge variant="muted">{user?.email}</Badge>
              <Badge variant="info" className="capitalize">
                {user?.role.replace('_', ' ')}
              </Badge>
            </div>
          </Reveal>

          <BlurText
            as="p"
            delay={200}
            className="mx-auto mt-10 max-w-3xl justify-center text-center text-2xl leading-relaxed text-muted-foreground md:text-3xl"
          >
            Who you are, what you've applied for, and the pets you're watching.
          </BlurText>
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
              <p className="mt-3 font-display text-4xl tracking-tight text-foreground md:text-5xl">
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* -------------------------------------------------- IDENTITY + EDIT */}
      <section className="bg-background py-20 md:py-28">
        <div className={frame}>
          <Reveal className="mb-14 max-w-3xl">
            <span className="mb-6 inline-flex items-center gap-4 font-mono text-sm text-muted-foreground">
              <span className="h-px w-12 bg-[var(--brand)]" />
              Identity
            </span>
            <h2 className="font-display text-5xl leading-[0.92] tracking-tight md:text-6xl">
              <span className="block text-primary">How shelters</span>
              <span className="block text-primary/45">see you.</span>
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              Your name appears on every application you send. Changes save to your
              account instantly.
            </p>
          </Reveal>

          <Reveal delay={100}>
            <form
              onSubmit={handleSave}
              noValidate
              className="grid gap-4 border border-border bg-card p-6 md:p-10 lg:grid-cols-12"
            >
              <div className="lg:col-span-5">
                <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                  Display name
                </span>
                <div className="mt-4">
                  <Label htmlFor="profile-name">Full name</Label>
                  <ValidatedInput
                    id="profile-name"
                    value={form.name}
                    onChange={(e) => {
                      setForm((prev) => ({ ...prev, name: e.target.value }));
                      setFieldErrors((p) => ({ ...p, name: undefined }));
                    }}
                    placeholder="e.g. Juan Dela Cruz"
                    required
                    error={fieldErrors.name}
                  />
                </div>
                <div className="mt-4">
                  <Label htmlFor="profile-avatar">Photo URL (optional)</Label>
                  <ValidatedInput
                    id="profile-avatar"
                    value={form.avatarUrl}
                    onChange={(e) => {
                      setForm((prev) => ({ ...prev, avatarUrl: e.target.value }));
                      setFieldErrors((p) => ({ ...p, avatarUrl: undefined }));
                    }}
                    placeholder="https://…"
                    error={fieldErrors.avatarUrl}
                  />
                </div>
                <Button
                  type="submit"
                  disabled={saving}
                  className="mt-6 h-11 rounded-full px-7 text-sm"
                >
                  <Pencil className="size-4" />
                  {saving ? 'Saving…' : 'Save profile'}
                </Button>
              </div>
              <div className="flex items-center justify-center border-t border-border pt-6 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0 lg:col-span-7">
                <div className="flex items-center gap-4">
                  {form.avatarUrl.trim() ? (
                    <img
                      src={form.avatarUrl.trim()}
                      alt="Profile preview"
                      className="size-16 rounded-full border border-border object-cover"
                    />
                  ) : (
                    <span className="flex size-16 items-center justify-center rounded-full bg-[var(--brand-tint)] font-display text-xl text-primary">
                      {userInitials(form.name || '?')}
                    </span>
                  )}
                  <div>
                    <p className="font-medium">{form.name || 'Your name'}</p>
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                    <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.18em] text-primary">
                      Live preview
                    </p>
                  </div>
                </div>
              </div>
            </form>
          </Reveal>
        </div>
      </section>

      {/* ------------------------------------------------- RECENT ACTIVITY */}
      <section className="border-t border-border bg-background py-20 md:py-28">
        <div className={frame}>
          <Reveal className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="mb-6 inline-flex items-center gap-4 font-mono text-sm text-muted-foreground">
                <span className="h-px w-12 bg-[var(--brand)]" />
                Recent activity
              </span>
              <h2 className="font-display text-5xl leading-[0.92] tracking-tight md:text-6xl">
                <span className="block text-primary">Latest</span>
                <span className="block text-primary/45">applications.</span>
              </h2>
            </div>
            <Link
              to="/applications"
              className="group inline-flex items-center gap-3 font-mono text-xs uppercase tracking-[0.2em] text-primary transition-colors hover:text-primary/75"
            >
              View all
              <span className="h-px w-8 bg-current transition-all duration-300 group-hover:w-12" />
            </Link>
          </Reveal>

          <div className="mt-14">
            {appsLoading ? (
              <LoadingGrid count={2} />
            ) : recentApplications.length === 0 ? (
              <EmptyState
                title="No applications yet"
                description="Browse pets and submit your first adoption application."
                action={
                  <Link to="/pets">
                    <Button className="h-11 rounded-full px-7 text-[15px]">
                      Browse pets
                      <ArrowRight className="size-4" />
                    </Button>
                  </Link>
                }
              />
            ) : (
              <div className="space-y-6">
                {recentApplications.map((app) => (
                  <ApplicationCard key={app.id} application={app} pet={petById(app.petId)} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- SAVED */}
      <section className="border-t border-border bg-background py-20 md:py-28">
        <div className={frame}>
          <Reveal className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="mb-6 inline-flex items-center gap-4 font-mono text-sm text-muted-foreground">
                <span className="h-px w-12 bg-[var(--brand)]" />
                Watchlist
              </span>
              <h2 className="font-display text-5xl leading-[0.92] tracking-tight md:text-6xl">
                <span className="block text-primary">Pets you're</span>
                <span className="block text-primary/45">watching.</span>
              </h2>
            </div>
            <Link
              to="/favorites"
              className="group inline-flex items-center gap-3 font-mono text-xs uppercase tracking-[0.2em] text-primary transition-colors hover:text-primary/75"
            >
              View all
              <span className="h-px w-8 bg-current transition-all duration-300 group-hover:w-12" />
            </Link>
          </Reveal>

          <div className="mt-14">
            {dataLoading ? (
              <LoadingGrid count={3} />
            ) : favoritePreview.length === 0 ? (
              <EmptyState
                title="No favorites saved"
                description="Tap the heart on any pet to add it to your watchlist."
                action={
                  <Link to="/pets">
                    <Button className="h-11 rounded-full px-7 text-[15px]">
                      Browse pets
                      <ArrowRight className="size-4" />
                    </Button>
                  </Link>
                }
              />
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {favoritePreview.map((pet, index) => (
                  <Reveal key={pet.id} delay={Math.min(index, 8) * 70}>
                    <PetCard
                      pet={pet}
                      className="h-full"
                      shelterLocation={locationByShelter.get(pet.shelterId)}
                    />
                  </Reveal>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------- CTA */}
      <section className="relative overflow-hidden bg-[var(--brand-tint)] py-16 md:py-24">
        <div className={frame}>
          <Reveal className="text-center">
            <HeartHandshake className="mx-auto size-8 text-primary" />
            <h2 className="mx-auto mt-6 max-w-3xl font-display text-3xl leading-tight tracking-tight md:text-5xl">
              Your next companion is waiting.
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-muted-foreground">
              Keep meeting rescues across our partner shelters — your applications and
              watchlist are always in sync.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link to="/pets">
                <Button size="lg" className="h-11 rounded-full px-7 text-[15px]">
                  Browse pets
                  <ArrowRight className="size-4" />
                </Button>
              </Link>
              <Link to="/applications">
                <Button size="lg" variant="outline" className="h-11 rounded-full px-7 text-[15px]">
                  Track applications
                </Button>
              </Link>
            </div>
          </Reveal>
          <p className="mt-10 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
            <Heart className="size-3.5" /> {savedPets.length} saved · {applications.length} applications
          </p>
        </div>
      </section>
    </div>
  );
};
