import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowUpRight, MapPin, Plus } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/Form';
import { PasswordInput, ValidatedInput, focusFirstError } from '@/components/shared';
import { useAuth } from '@/hooks/useAuth';
import { ApiError, apiErrorMessage, tokenStore } from '@/lib/apiClient';
import { loginSchema } from '@/lib/validators';
import type { LoginValues } from '@/lib/validators';
import type { UserRole } from '@/types';

const landingRouteFor = (role: UserRole) =>
  role === 'adopter' ? '/pets' : role === 'shelter_staff' ? '/shelter' : '/admin';

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const [submitError, setSubmitError] = useState<string | null>(null);

  const loginMutation = useMutation({
    mutationFn: (values: LoginValues) => login(values.email, values.password),
    onSuccess: (user) => {
      toast.success(`Welcome back, ${user.name}!`);
      navigate(landingRouteFor(user.role), { replace: true });
    },
    // Covers network/unexpected failures, not just API error responses.
    onError: (error) => {
      if (error instanceof ApiError && error.status === 403 && error.details) {
        const { requiresOnboarding, onboardingToken } = error.details;
        if (onboardingToken) {
          tokenStore.setOnboarding(onboardingToken);
        }
        if (requiresOnboarding) {
          toast.info('Please complete your shelter registration to continue.');
          navigate('/onboarding/shelter', { replace: true });
          return;
        }
        if (requiresOnboarding === false) {
          toast.info('Your shelter registration is awaiting approval.');
          navigate('/onboarding/shelter/pending', { replace: true });
          return;
        }
      }
      setSubmitError(apiErrorMessage(error, 'Unable to sign in. Please try again.'));
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
        <div className="grid gap-0 lg:grid-cols-2 lg:min-h-[700px]">
          <div className="flex flex-col items-center justify-center p-6 lg:p-10">
            <div className="w-full max-w-[420px] space-y-6">
              <div className="text-center">
                <h1 className="text-[32px] font-normal tracking-tight">Welcome back</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Sign in to manage your applications, saved pets, and shelter listings.
                </p>
              </div>

              <form
                onSubmit={handleSubmit(
                  (values) => {
                    setSubmitError(null);
                    loginMutation.mutate(values);
                  },
                  () => focusFirstError(),
                )}
                noValidate
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label className="text-[13px] font-normal" htmlFor="login-email">
                    Email
                  </Label>
                  <ValidatedInput
                    id="login-email"
                    type="email"
                    placeholder="name@email.com"
                    error={errors.email?.message}
                    className="h-[50px] rounded-xl bg-background text-[15px]"
                    {...register('email')}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[13px] font-normal" htmlFor="login-pass">
                    Password
                  </Label>
                  <PasswordInput
                    id="login-pass"
                    placeholder="••••••••"
                    error={errors.password?.message}
                    className="h-[50px] rounded-xl bg-background text-[15px]"
                    {...register('password')}
                  />
                </div>

                {submitError && (
                  <p role="alert" className="text-[13px] text-destructive">
                    {submitError}
                  </p>
                )}

                <Button
                  type="submit"
                  disabled={loginMutation.isPending}
                  className="h-[50px] w-full rounded-xl text-[15px]"
                >
                  {loginMutation.isPending ? 'Signing in…' : 'Sign in'}
                </Button>
              </form>

              <p className="text-center text-sm text-muted-foreground">
                New to Paws&amp;Homes?{' '}
                <Link
                  to="/signup"
                  className="font-medium text-foreground underline underline-offset-4"
                >
                  Create an account
                </Link>
              </p>
            </div>
          </div>

          <div className="relative m-0 min-h-[320px] overflow-hidden bg-gradient-to-br from-[var(--brand-tint)] via-orange-50 to-amber-50 ring-1 ring-black/5 lg:m-4 lg:min-h-0 lg:rounded-[2rem]">
            <img
              src="/hero_dog_1.jpg"
              alt="Happy dog waiting to be adopted"
              className="absolute inset-0 size-full object-cover"
            />
            <div className="absolute right-6 bottom-6 left-6 space-y-3 rounded-2xl bg-card p-4 shadow-lg">
              <p className="text-sm leading-relaxed text-card-foreground">
                Luna is a 2-year-old shepherd mix ready to meet a new family at Happy Tails
                Shelter.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  className="flex size-8 items-center justify-center rounded-lg bg-muted transition-colors hover:bg-muted/80"
                  aria-label="Save Luna"
                >
                  <Plus className="size-4" />
                </button>
                <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-1.5">
                  <span className="size-2 rounded-full bg-green-500" />
                  <span className="text-sm font-medium">Available</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-lg bg-muted px-3 py-1.5">
                  <MapPin className="size-3.5" />
                  <span className="text-sm font-medium">Quezon City</span>
                </div>
                <button
                  type="button"
                  className="ml-auto flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary/90"
                  aria-label="View Luna"
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
