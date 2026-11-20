import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, ArrowUpRight, Building2, Heart, MailCheck, MapPin, Plus, ShieldCheck } from 'lucide-react';
import React, { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/Form';
import { PasswordInput, ValidatedInput, focusFirstError } from '@/components/shared';
import { useAuth } from '@/hooks/useAuth';
import { apiErrorMessage } from '@/lib/apiClient';
import { authService } from '@/services/authService';
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
  const { signup, verifySignupOtp } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState<UserRole>('adopter');
  const [submitError, setSubmitError] = useState<string | null>(null);

  // OTP Verification State
  const [verificationSession, setVerificationSession] = useState<{
    verificationId: string;
    email: string;
    role: UserRole;
  } | null>(null);
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleDigitChange = (index: number, value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(-1);
    const updated = [...otpDigits];
    updated[index] = cleaned;
    setOtpDigits(updated);
    setOtpError(null);

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
      if (result.otpRequired) {
        setVerificationSession({
          verificationId: result.verificationId,
          email: result.email,
          role,
        });
        setOtpDigits(['', '', '', '', '', '']);
        setOtpError(null);
        toast.info(`Verification code sent to ${result.email}. Please verify to activate your account.`);
      }
    },
    onError: (error) => {
      setSubmitError(apiErrorMessage(error, 'Something went wrong. Please try again.'));
    },
  });

  const verifyOtpMutation = useMutation({
    mutationFn: async () => {
      if (!verificationSession) throw new Error('No active verification session');
      const code = otpDigits.join('');
      if (code.length !== 6) {
        throw new Error('Please enter all 6 digits of the verification code.');
      }
      return verifySignupOtp(verificationSession.verificationId, code);
    },
    onSuccess: (result) => {
      if (result.requiresOnboarding || verificationSession?.role === 'shelter_staff') {
        toast.success('Email verified! Please complete your shelter details.');
        navigate('/onboarding/shelter', { replace: true });
        return;
      }

      toast.success('Email verified! Account created successfully.');
      navigate('/pets', { replace: true });
    },
    onError: (err) => {
      setOtpError(apiErrorMessage(err, 'Invalid or expired verification code. Please try again.'));
    },
  });

  const handleResendOtp = async () => {
    if (!verificationSession || resending) return;
    setResending(true);
    setOtpError(null);
    try {
      const res = await authService.resendSignupOtp(verificationSession.verificationId);
      setVerificationSession((prev) => (prev ? { ...prev, verificationId: res.verificationId } : null));
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
        <div className="grid gap-0 lg:grid-cols-2 lg:min-h-[760px]">
          <div className="flex flex-col items-center justify-center p-6 lg:p-10">
            <div className="w-full max-w-[420px] space-y-6">
              {verificationSession ? (
                /* ----------------- Signup Email OTP Verification Form ----------------- */
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setVerificationSession(null);
                        setOtpDigits(['', '', '', '', '', '']);
                        setOtpError(null);
                      }}
                      className="inline-flex size-9 items-center justify-center rounded-xl border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      title="Back to signup"
                    >
                      <ArrowLeft className="size-4" />
                    </button>
                    <div>
                      <h1 className="text-2xl font-normal tracking-tight">Verify Your Email</h1>
                      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-primary">
                        Confirming Account Creation
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-xs text-foreground">
                    <div className="flex items-start gap-3">
                      <MailCheck className="mt-0.5 size-5 shrink-0 text-primary" />
                      <div className="space-y-1">
                        <p className="font-medium text-foreground">
                          Verification code sent
                        </p>
                        <p className="text-muted-foreground">
                          We sent a 6-digit confirmation code to{' '}
                          <strong className="text-foreground">{verificationSession.email}</strong>.
                          Please enter it below to activate your account.
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
                        Code expires in 10 minutes. Check your spam folder if you don't see it.
                      </p>
                    </div>

                    {otpError && (
                      <p role="alert" className="text-center text-[13px] text-destructive">
                        {otpError}
                      </p>
                    )}

                    <Button
                      type="submit"
                      disabled={verifyOtpMutation.isPending || otpDigits.join('').length !== 6}
                      className="h-[50px] w-full rounded-xl text-[15px]"
                    >
                      {verifyOtpMutation.isPending ? 'Verifying…' : 'Verify & Create Account'}
                    </Button>

                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                      <span>Didn't receive the email?</span>
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={resending}
                        className="font-medium text-primary hover:underline disabled:opacity-50"
                      >
                        {resending ? 'Resending…' : 'Resend code'}
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                /* ----------------- Standard Signup Form ----------------- */
                <>
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
                      {signupMutation.isPending ? 'Sending verification code…' : 'Continue'}
                    </Button>

                    {role === 'shelter_staff' && (
                      <p className="text-center text-[13px] text-muted-foreground">
                        Shelter accounts verify their email first, complete a short onboarding step, then wait for admin approval.
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
                </>
              )}
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
