import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, KeyRound, Loader2, MailCheck, ShieldCheck } from 'lucide-react';
import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/Form';
import { PasswordInput, ValidatedInput, focusFirstError } from '@/components/shared';
import { apiErrorMessage } from '@/lib/apiClient';
import { useResendCooldown } from '@/hooks/useResendCooldown';
import { authService } from '@/services/authService';
import { forgotPasswordSchema, newPasswordSchema } from '@/lib/validators';
import type { ForgotPasswordValues, NewPasswordValues } from '@/lib/validators';

/**
 * Where the reset flow stands:
 *  - email:    ask for the account email
 *  - code:     verify the 6-digit code (only when the backend opened a reset)
 *  - password: choose the new password once the code is verified
 *  - sent:     generic notice for an email with no active account — the response
 *              never reveals whether an address is registered.
 */
type Step =
  | { kind: 'email' }
  | { kind: 'code'; resetId: string; email: string }
  | { kind: 'password'; resetId: string; email: string; code: string }
  | { kind: 'sent'; email: string };

const EMPTY_DIGITS = ['', '', '', '', '', ''];

export const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>({ kind: 'email' });
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const resendCooldown = useResendCooldown();

  // 6-digit code state — same boxed input as the signup verification step.
  const [otpDigits, setOtpDigits] = useState(EMPTY_DIGITS);
  const [otpError, setOtpError] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const emailForm = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const passwordForm = useForm<NewPasswordValues>({
    resolver: zodResolver(newPasswordSchema),
    defaultValues: { password: '', confirm: '' },
  });

  const resetDigits = () => {
    setOtpDigits(EMPTY_DIGITS);
    setOtpError(null);
  };

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
    inputRefs.current[Math.min(paste.length, 5)]?.focus();
  };

  const requestMutation = useMutation({
    mutationFn: (values: ForgotPasswordValues) => authService.requestPasswordReset(values.email),
    onSuccess: (result, values) => {
      setSubmitError(null);
      if (result.resetId) {
        resetDigits();
        resendCooldown.start();
        setStep({ kind: 'code', resetId: result.resetId, email: result.email ?? values.email });
        toast.info('Reset code sent. Check your inbox.');
        return;
      }
      setStep({ kind: 'sent', email: values.email });
    },
    onError: (error) => {
      setSubmitError(apiErrorMessage(error, 'Unable to send a reset code. Please try again.'));
    },
  });

  const verifyMutation = useMutation({
    mutationFn: async () => {
      if (step.kind !== 'code') throw new Error('No active reset session');
      const code = otpDigits.join('');
      if (code.length !== 6) {
        throw new Error('Please enter all 6 digits of the reset code.');
      }
      return authService.verifyResetCode({ resetId: step.resetId, code });
    },
    onSuccess: () => {
      if (step.kind !== 'code') return;
      setOtpError(null);
      passwordForm.reset({ password: '', confirm: '' });
      setStep({
        kind: 'password',
        resetId: step.resetId,
        email: step.email,
        code: otpDigits.join(''),
      });
      toast.success('Code verified. Choose your new password.');
    },
    onError: (error) => {
      setOtpError(apiErrorMessage(error, 'Invalid or expired reset code. Please try again.'));
    },
  });

  const passwordMutation = useMutation({
    mutationFn: (values: NewPasswordValues) => {
      if (step.kind !== 'password') throw new Error('No active reset session');
      return authService.resetPassword({
        resetId: step.resetId,
        code: step.code,
        password: values.password,
      });
    },
    onSuccess: () => {
      toast.success('Password updated. Sign in with your new password.');
      navigate('/login', { replace: true });
    },
    onError: (error) => {
      setSubmitError(apiErrorMessage(error, 'Unable to reset your password. Please try again.'));
    },
  });

  const handleResend = async () => {
    if (step.kind !== 'code' || resending || resendCooldown.isCoolingDown) return;
    setResending(true);
    setOtpError(null);
    try {
      const result = await authService.requestPasswordReset(step.email);
      if (!result.resetId) {
        setStep({ kind: 'sent', email: step.email });
        return;
      }
      resetDigits();
      resendCooldown.start();
      setStep({ kind: 'code', resetId: result.resetId, email: step.email });
      toast.success('A new reset code has been sent to your email.');
    } catch (error) {
      setOtpError(apiErrorMessage(error, 'Failed to resend the code. Please try again.'));
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
              {step.kind === 'code' ? (
                /* ----------------- Verify the emailed code ----------------- */
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setSubmitError(null);
                        resetDigits();
                        setStep({ kind: 'email' });
                      }}
                      className="inline-flex size-9 items-center justify-center rounded-xl border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      title="Use a different email"
                    >
                      <ArrowLeft className="size-4" />
                    </button>
                    <div>
                      <h1 className="text-2xl font-normal tracking-tight">Verify Your Email</h1>
                      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-primary">
                        Confirming Password Reset
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-xs text-foreground">
                    <div className="flex items-start gap-3">
                      <MailCheck className="mt-0.5 size-5 shrink-0 text-primary" />
                      <div className="space-y-1">
                        <p className="font-medium text-foreground">Reset code sent</p>
                        <p className="text-muted-foreground">
                          We sent a 6-digit code to{' '}
                          <strong className="text-foreground">{step.email}</strong>. Enter it below
                          to choose a new password.
                        </p>
                      </div>
                    </div>
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      setOtpError(null);
                      verifyMutation.mutate();
                    }}
                    className="space-y-5"
                  >
                    <div className="space-y-2">
                      <Label className="text-[13px] font-normal">6-Digit Verification Code</Label>
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
                      disabled={verifyMutation.isPending || otpDigits.join('').length !== 6}
                      className="h-[50px] w-full rounded-xl text-[15px]"
                    >
                      {verifyMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 size-4 animate-spin" /> Verifying…
                        </>
                      ) : (
                        'Verify code'
                      )}
                    </Button>

                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                      <span>Didn't receive the email?</span>
                      <button
                        type="button"
                        onClick={handleResend}
                        disabled={resending || resendCooldown.isCoolingDown}
                        className="font-medium text-primary hover:underline disabled:opacity-50"
                      >
                        {resending
                          ? 'Resending…'
                          : resendCooldown.isCoolingDown
                            ? `Resend in ${resendCooldown.remaining}s`
                            : 'Resend code'}
                      </button>
                    </div>
                  </form>
                </div>
              ) : step.kind === 'password' ? (
                /* ----------------- Set a new password ----------------- */
                <>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setSubmitError(null);
                        resetDigits();
                        setStep({ kind: 'code', resetId: step.resetId, email: step.email });
                      }}
                      className="inline-flex size-9 items-center justify-center rounded-xl border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      title="Back to the code"
                    >
                      <ArrowLeft className="size-4" />
                    </button>
                    <div>
                      <h1 className="text-2xl font-normal tracking-tight">Set a new password</h1>
                      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-primary">
                        Password Reset
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-xs">
                    <div className="flex items-start gap-3">
                      <KeyRound className="mt-0.5 size-5 shrink-0 text-primary" />
                      <p className="text-muted-foreground">
                        Code verified for{' '}
                        <strong className="text-foreground">{step.email}</strong>. Choose a new
                        password for your account.
                      </p>
                    </div>
                  </div>

                  <form
                    onSubmit={passwordForm.handleSubmit(
                      (values) => {
                        setSubmitError(null);
                        passwordMutation.mutate(values);
                      },
                      () => focusFirstError(),
                    )}
                    noValidate
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <Label className="text-[13px] font-normal" htmlFor="reset-pass">
                        New password
                      </Label>
                      <PasswordInput
                        id="reset-pass"
                        autoComplete="new-password"
                        placeholder="Min. 8 characters"
                        error={passwordForm.formState.errors.password?.message}
                        className="h-[50px] rounded-xl bg-background text-[15px]"
                        {...passwordForm.register('password')}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[13px] font-normal" htmlFor="reset-confirm">
                        Confirm new password
                      </Label>
                      <PasswordInput
                        id="reset-confirm"
                        autoComplete="new-password"
                        placeholder="Re-enter your new password"
                        error={passwordForm.formState.errors.confirm?.message}
                        className="h-[50px] rounded-xl bg-background text-[15px]"
                        {...passwordForm.register('confirm')}
                      />
                    </div>

                    {submitError && (
                      <p role="alert" className="text-[13px] text-destructive">
                        {submitError}
                      </p>
                    )}

                    <Button
                      type="submit"
                      disabled={passwordMutation.isPending}
                      className="h-[50px] w-full rounded-xl text-[15px]"
                    >
                      {passwordMutation.isPending ? 'Resetting…' : 'Reset password'}
                    </Button>
                  </form>
                </>
              ) : step.kind === 'sent' ? (
                /* ----------------- Generic "check your email" notice ----------------- */
                <>
                  <div className="text-center">
                    <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10">
                      <MailCheck className="size-6 text-primary" />
                    </div>
                    <h1 className="text-[32px] font-normal tracking-tight">Check your email</h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                      If an account exists for <strong className="text-foreground">{step.email}</strong>
                      , we&apos;ve sent a 6-digit code to reset its password. The code expires in 10
                      minutes.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <Button
                      type="button"
                      onClick={() => {
                        setSubmitError(null);
                        setStep({ kind: 'email' });
                      }}
                      className="h-[50px] w-full rounded-xl text-[15px]"
                    >
                      Try another email
                    </Button>
                    <p className="text-center text-xs text-muted-foreground">
                      Remembered it?{' '}
                      <Link
                        to="/login"
                        className="font-medium text-foreground underline underline-offset-4"
                      >
                        Back to sign in
                      </Link>
                    </p>
                  </div>
                </>
              ) : (
                /* ----------------- Email form ----------------- */
                <>
                  <div className="text-center">
                    <h1 className="text-[32px] font-normal tracking-tight">Forgot password?</h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Enter the email linked to your account and we&apos;ll send a 6-digit code to
                      reset your password.
                    </p>
                  </div>

                  <form
                    onSubmit={emailForm.handleSubmit(
                      (values) => {
                        setSubmitError(null);
                        requestMutation.mutate(values);
                      },
                      () => focusFirstError(),
                    )}
                    noValidate
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <Label className="text-[13px] font-normal" htmlFor="forgot-email">
                        Email
                      </Label>
                      <ValidatedInput
                        id="forgot-email"
                        type="email"
                        autoComplete="email"
                        placeholder="name@email.com"
                        error={emailForm.formState.errors.email?.message}
                        className="h-[50px] rounded-xl bg-background text-[15px]"
                        {...emailForm.register('email')}
                      />
                    </div>

                    {submitError && (
                      <p role="alert" className="text-[13px] text-destructive">
                        {submitError}
                      </p>
                    )}

                    <Button
                      type="submit"
                      disabled={requestMutation.isPending}
                      className="h-[50px] w-full rounded-xl text-[15px]"
                    >
                      {requestMutation.isPending ? 'Sending code…' : 'Send reset code'}
                    </Button>
                  </form>

                  <p className="text-center text-sm text-muted-foreground">
                    Remembered your password?{' '}
                    <Link
                      to="/login"
                      className="font-medium text-foreground underline underline-offset-4"
                    >
                      Back to sign in
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
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" />
                <p className="text-sm leading-relaxed text-card-foreground">
                  Your saved pets and adoption applications stay linked to your account — resetting
                  your password keeps them safe.
                </p>
              </div>
              <p className="text-center text-xs text-muted-foreground">
                We'll never ask for your password by email
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
