import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, ArrowUpRight, Loader2, MapPin, Plus, RefreshCw, ShieldAlert } from 'lucide-react';
import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/Form';
import { PasswordInput, ValidatedInput, focusFirstError } from '@/components/shared';
import { useAuth } from '@/hooks/useAuth';
import { ApiError, apiErrorMessage } from '@/lib/apiClient';
import { loginSchema } from '@/lib/validators';
import { authService } from '@/services/authService';
import type { LoginValues } from '@/lib/validators';
import type { UserRole } from '@/types';

const landingRouteFor = (role: UserRole) =>
  role === 'adopter' ? '/pets' : role === 'shelter_staff' ? '/shelter' : '/admin';

export const LoginPage = () => {
  const { login, verifyOtp } = useAuth();
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

  // MFA State
  const [mfaChallenge, setMfaChallenge] = useState<{
    challengeId: string;
    email: string;
    location?: string;
  } | null>(null);
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleDigitChange = (index: number, value: string) => {
    // Only accept numeric digit
    const cleaned = value.replace(/\D/g, '').slice(-1);
    const updated = [...otpDigits];
    updated[index] = cleaned;
    setOtpDigits(updated);
    setOtpError(null);

    // Auto focus next input
    if (cleaned && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!paste) return;
    const updated = [...otpDigits];
    for (let i = 0; i < paste.length; i++) {
      updated[i] = paste[i];
    }
    setOtpDigits(updated);
    setOtpError(null);
    const nextIdx = Math.min(paste.length, 5);
    inputRefs.current[nextIdx]?.focus();
  };

  const loginMutation = useMutation({
    mutationFn: (values: LoginValues) => {
      // Send browser timezone as client location hint
      const clientLocation = Intl.DateTimeFormat().resolvedOptions().timeZone;
      return login(values.email, values.password, clientLocation);
    },
    onSuccess: (result) => {
      if (result.mfaRequired) {
        setMfaChallenge({
          challengeId: result.challengeId,
          email: result.email,
          location: result.location,
        });
        setOtpDigits(['', '', '', '', '', '']);
        setOtpError(null);
        toast.warn('Suspicious sign-in detected. Please enter the 6-digit code sent to your email.');
        return;
      }

      if ('user' in result) {
        toast.success(`Welcome back, ${result.user.name}!`);
        navigate(landingRouteFor(result.user.role), { replace: true });
      }
    },
    // Covers network/unexpected failures, not just API error responses.
    onError: (error) => {
      if (error instanceof ApiError && error.status === 403 && error.details) {
        // The onboarding cookie was set by the backend; only the routing hint
        // comes back in the error payload.
        const { requiresOnboarding } = error.details;
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

  const verifyOtpMutation = useMutation({
    mutationFn: async () => {
      if (!mfaChallenge) throw new Error('No active verification session');
      const code = otpDigits.join('');
      if (code.length !== 6) {
        throw new Error('Please enter all 6 digits of the verification code.');
      }
      return verifyOtp(mfaChallenge.challengeId, code);
    },
    onSuccess: (user) => {
      toast.success(`Identity verified! Welcome back, ${user.name}!`);
      navigate(landingRouteFor(user.role), { replace: true });
    },
    onError: (err) => {
      setOtpError(apiErrorMessage(err, 'Invalid verification code. Please try again.'));
    },
  });

  const handleResendOtp = async () => {
    if (!mfaChallenge || resending) return;
    setResending(true);
    setOtpError(null);
    try {
      const res = await authService.resendOtp(mfaChallenge.challengeId);
      setMfaChallenge((prev) => (prev ? { ...prev, challengeId: res.challengeId } : null));
      setOtpDigits(['', '', '', '', '', '']);
      toast.success('A new verification code has been sent to your email.');
    } catch (err) {
      setOtpError(apiErrorMessage(err, 'Failed to resend code. Please try again.'));
    } finally {
      setResending(false);
    }
  };

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
              {mfaChallenge ? (
                /* ----------------- MFA / OTP Verification Form ----------------- */
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setMfaChallenge(null);
                        setOtpDigits(['', '', '', '', '', '']);
                        setOtpError(null);
                      }}
                      className="inline-flex size-9 items-center justify-center rounded-xl border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      title="Back to login"
                    >
                      <ArrowLeft className="size-4" />
                    </button>
                    <div>
                      <h1 className="text-2xl font-normal tracking-tight">Security Check</h1>
                      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-primary">
                        Suspicious Location Detected
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-900 dark:text-amber-200">
                    <div className="flex items-start gap-3">
                      <ShieldAlert className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400" />
                      <div className="space-y-1">
                        <p className="font-medium text-amber-800 dark:text-amber-300">
                          Sign-in from a new location
                        </p>
                        <p className="text-muted-foreground">
                          We detected an access attempt from{' '}
                          <strong className="text-foreground">{mfaChallenge.location || 'a new location'}</strong>.
                          A 6-digit one-time code was sent to <strong className="text-foreground">{mfaChallenge.email}</strong>.
                        </p>
                      </div>
                    </div>
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      setOtpError(null);
                      verifyOtpMutation.mutate();
                    }}
                    className="space-y-5"
                  >
                    <div className="space-y-2">
                      <Label className="text-[13px] font-normal">
                        6-Digit Verification Code
                      </Label>
                      <div className="flex justify-between gap-2" onPaste={handlePaste}>
                        {otpDigits.map((digit, idx) => (
                          <input
                            key={idx}
                            ref={(el) => {
                              inputRefs.current[idx] = el;
                            }}
                            type="text"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleDigitChange(idx, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(idx, e)}
                            className="size-12 rounded-xl border border-input bg-background text-center font-mono text-xl font-bold shadow-xs transition-colors focus-visible:border-ring focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring sm:size-14 sm:text-2xl"
                          />
                        ))}
                      </div>
                      <p className="text-center text-xs text-muted-foreground">
                        Code expires in 10 minutes.
                      </p>
                    </div>

                    {otpError && (
                      <p role="alert" className="text-center text-[13px] text-destructive">
                        {otpError}
                      </p>
                    )}

                    <Button
                      type="submit"
                      disabled={verifyOtpMutation.isPending || otpDigits.join('').length < 6}
                      className="h-[50px] w-full rounded-xl text-[15px]"
                    >
                      {verifyOtpMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 size-4 animate-spin" /> Verifying…
                        </>
                      ) : (
                        'Verify & Access Account'
                      )}
                    </Button>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Didn't receive the email?</span>
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={resending}
                        className="inline-flex items-center gap-1.5 font-medium text-foreground underline underline-offset-4 hover:text-primary disabled:opacity-50"
                      >
                        {resending ? (
                          <>
                            <Loader2 className="size-3 animate-spin" /> Sending…
                          </>
                        ) : (
                          <>
                            <RefreshCw className="size-3" /> Resend code
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                /* ----------------- Standard Login Form ----------------- */
                <>
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
                </>
              )}
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
