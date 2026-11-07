import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowUpRight, Building2, Heart, MapPin, Plus, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/Form';
import { PasswordInput, ValidatedInput, focusFirstError } from '@/components/shared';
import { useAuth } from '@/hooks/useAuth';
import { apiErrorMessage } from '@/lib/apiClient';
import { cn } from '@/lib/utils';
import { signupSchema } from '@/lib/validators';
import type { SignupValues } from '@/lib/validators';
import type { UserRole } from '@/types';

/** Only roles an adopter or shelter can actually register as. */
const ACCOUNT_TYPES: { value: UserRole; label: string; icon: typeof Heart }[] = [
  { value: 'adopter', label: 'Adopter', icon: Heart },
  { value: 'shelter_staff', label: 'Shelter', icon: Building2 },
];

export const SignupPage = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState<UserRole>('adopter');
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: '', email: '', password: '', confirm: '' },
  });

  const signupMutation = useMutation({
    mutationFn: (values: SignupValues) =>
      signup({
        name: values.name,
        email: values.email,
        password: values.password,
        role,
      }),
    onSuccess: (result) => {
      // Shelter accounts must complete onboarding, then wait for admin approval.
      if (result.requiresOnboarding || role === 'shelter_staff') {
        toast.success('Account created! Please complete your shelter details.');
        navigate('/onboarding/shelter', { replace: true });
        return;
      }

      // Adopters are signed in immediately by signup(), so drop them straight
      // into browsing instead of asking them to sign in again.
      toast.success('Account created successfully! Start browsing adoptable pets.');
      navigate('/pets', { replace: true });
    },
    // Covers network/unexpected failures, not just API error responses.
    onError: (error) => {
      setSubmitError(apiErrorMessage(error, 'Something went wrong. Please try again.'));
    },
  });

  return (
    <div className="relative flex min-h-[calc(100vh-5rem)] w-full items-center justify-center overflow-hidden bg-background px-4 py-10 md:px-6 md:py-14">
      {/* Warm glow layer — mirrors the landing hero orbs. */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -right-20 top-1/4 size-[36rem] rounded-full bg-[var(--brand)]/15 blur-[120px]" />
        <div className="absolute -left-20 bottom-10 size-[28rem] rounded-full bg-primary/10 blur-[100px]" />
      </div>

      <div className="relative w-full max-w-[1000px] overflow-hidden rounded-2xl bg-card shadow-2xl md:rounded-[2.5rem]">
        <div className="grid gap-0 lg:grid-cols-2 lg:min-h-[760px]">
          <div className="flex flex-col items-center justify-center p-6 lg:p-10">
            <div className="w-full max-w-[420px] space-y-6">
              <div className="text-center">
                <h1 className="text-[32px] font-normal tracking-tight">Create your account</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Join Paws&amp;Homes to save favourites, send adoption applications, and
                  track every step.
                </p>
              </div>

              <form
                onSubmit={handleSubmit(
                  (values) => {
                    setSubmitError(null);
                    signupMutation.mutate(values);
                  },
                  () => focusFirstError(),
                )}
                noValidate
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label className="text-[13px] font-normal" htmlFor="su-name">
                    Full name
                  </Label>
                  <ValidatedInput
                    id="su-name"
                    placeholder="Juan Dela Cruz"
                    error={errors.name?.message}
                    className="h-[50px] rounded-xl bg-background text-[15px]"
                    {...register('name')}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[13px] font-normal" htmlFor="su-email">
                    Email
                  </Label>
                  <ValidatedInput
                    id="su-email"
                    type="email"
                    placeholder="name@email.com"
                    error={errors.email?.message}
                    className="h-[50px] rounded-xl bg-background text-[15px]"
                    {...register('email')}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[13px] font-normal" htmlFor="su-pass">
                    Password
                  </Label>
                  <PasswordInput
                    id="su-pass"
                    placeholder="Min. 8 characters"
                    error={errors.password?.message}
                    className="h-[50px] rounded-xl bg-background text-[15px]"
                    {...register('password')}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[13px] font-normal" htmlFor="su-confirm">
                    Confirm password
                  </Label>
                  <PasswordInput
                    id="su-confirm"
                    placeholder="Re-enter your password"
                    error={errors.confirm?.message}
                    className="h-[50px] rounded-xl bg-background text-[15px]"
                    {...register('confirm')}
                  />
                </div>

                <fieldset className="space-y-2">
                  <legend className="mb-2 text-[13px] font-normal">I am signing up as</legend>
                  <div className="grid grid-cols-2 gap-2">
                    {ACCOUNT_TYPES.map((type) => {
                      const active = role === type.value;
                      return (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => setRole(type.value)}
                          aria-pressed={active}
                          className={cn(
                            'flex h-[50px] items-center justify-center gap-2 rounded-xl border text-[15px] transition-colors',
                            active
                              ? 'border-primary bg-primary/10 text-foreground'
                              : 'border-input bg-background text-muted-foreground hover:border-foreground/25 hover:text-foreground',
                          )}
                        >
                          <type.icon className="size-4" />
                          {type.label}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>

                {submitError && (
                  <p role="alert" className="text-[13px] text-destructive">
                    {submitError}
                  </p>
                )}

                <Button
                  type="submit"
                  disabled={signupMutation.isPending}
                  className="h-[50px] w-full rounded-xl text-[15px]"
                >
                  {signupMutation.isPending ? 'Creating account…' : 'Create account'}
                </Button>

                {role === 'shelter_staff' && (
                  <p className="text-center text-[13px] text-muted-foreground">
                    Shelter accounts continue to a short onboarding step, then wait for
                    admin approval before signing in.
                  </p>
                )}
              </form>

              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="font-medium text-foreground underline underline-offset-4"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>

          <div className="relative m-0 min-h-[320px] overflow-hidden bg-gradient-to-br from-[var(--brand-tint)] via-orange-50 to-amber-50 ring-1 ring-black/5 lg:m-4 lg:min-h-0 lg:rounded-[2rem]">
            <img
              src="/hero_dog_2.jpg"
              alt="Rescue dog waiting to be adopted"
              className="absolute inset-0 size-full object-cover"
            />
            <div className="absolute right-6 bottom-6 left-6 space-y-3 rounded-2xl bg-card p-4 shadow-lg">
              <p className="text-sm leading-relaxed text-card-foreground">
                Creating an account is free. Adoption fees go straight to the shelter caring
                for the animal.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  className="flex size-8 items-center justify-center rounded-lg bg-muted transition-colors hover:bg-muted/80"
                  aria-label="Save a pet"
                >
                  <Plus className="size-4" />
                </button>
                <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-1.5">
                  <ShieldCheck className="size-3.5" />
                  <span className="text-sm font-medium">Verified</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-lg bg-muted px-3 py-1.5">
                  <MapPin className="size-3.5" />
                  <span className="text-sm font-medium">3 cities</span>
                </div>
                <button
                  type="button"
                  className="ml-auto flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary/90"
                  aria-label="Browse adoptable pets"
                >
                  <ArrowUpRight className="size-4" />
                </button>
              </div>
              <p className="text-center text-xs text-muted-foreground">
                Browse adoptable pets near you
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
