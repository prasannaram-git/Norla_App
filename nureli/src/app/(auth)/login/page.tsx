'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/auth-context';
import { saveUserProfile, getUserProfile } from '@/lib/db';
import { ArrowRight, ArrowLeft, Shield, User, Calendar, Users } from 'lucide-react';

type Step = 'phone' | 'otp' | 'name' | 'dob' | 'sex';

export default function LoginPage() {
  const router = useRouter();
  const { isDemo, user } = useAuth();
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [devCode, setDevCode] = useState('');
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [sex, setSex] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Prevent hydration mismatch
  useEffect(() => { setMounted(true); }, []);

  // Redirect if already logged in
  useEffect(() => {
    if (mounted && user) {
      router.replace('/dashboard');
    }
  }, [mounted, user, router]);

  const handleDemo = () => { router.push('/dashboard'); };

  const getFormattedPhone = () => phone.startsWith('+') ? phone : `+91${phone}`;

  // Start resend countdown (60 seconds)
  const startResendCooldown = useCallback(() => {
    setResendCountdown(60);
    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      setResendCountdown((prev) => {
        if (prev <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
  }, []);

  // Send OTP via our custom API
  const handleSendOTP = async () => {
    setError('');
    if (phone.length < 10) { setError('Please enter a valid phone number'); return; }
    if (isDemo) { setStep('otp'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (res.status === 429) {
        setError(data.error || 'Too many requests. Please wait before requesting another code.');
        return;
      }
      if (res.status === 503) {
        setError('OTP service is temporarily unavailable. Please try again in a few minutes.');
        return;
      }
      if (!res.ok) { setError(data.error || 'Failed to send OTP'); return; }
      if (data.dev_code) setDevCode(data.dev_code);
      startResendCooldown();
      setStep('otp');
    } catch {
      setError('Connection failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendCountdown > 0) return;
    setOtp(['', '', '', '', '', '']);
    setDevCode('');
    await handleSendOTP();
  };

  // Verify OTP via our custom API
  const handleVerifyOTP = async () => {
    // Prevent double-calls (React Strict Mode, fast double-clicks)
    if (loading) return;
    setError('');
    const code = otp.join('');
    if (code.length !== 6) { setError('Please enter the 6-digit code'); return; }
    if (isDemo) { setStep('name'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Invalid code'); setLoading(false); return; }

      const formatted = getFormattedPhone();

      // CHECK 1: Server returned existing profile (source of truth — works even if localStorage cleared)
      // CHECK 2: Fall back to localStorage profile database
      const serverProfile = data.profile;
      const localProfile = getUserProfile(formatted);
      const existingProfile = serverProfile || localProfile;

      if (existingProfile && existingProfile.name) {
        // Returning user — skip onboarding
        const profileData = {
          phone: existingProfile.phone || formatted,
          name: existingProfile.name,
          dob: existingProfile.dob || '',
          sex: existingProfile.sex || '',
        };
        // Save to localStorage for future offline access
        localStorage.setItem('norla_user', JSON.stringify(profileData));
        // Also save to local profile DB so future logins work offline
        saveUserProfile(formatted, { name: profileData.name, dob: profileData.dob, sex: profileData.sex });
        // Sync to server for admin panel (fire-and-forget)
        fetch('/api/sync', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'user', data: profileData }) }).catch(() => {});
        // CRITICAL: Use window.location.href (full page navigation) instead of router.push
        // router.push does client-side navigation where middleware prefetch may not
        // carry the newly-set session cookie → causes redirect loop back to /login
        window.location.href = '/dashboard';
        return;
      }

      // New user — start onboarding
      setStep('name');
    } catch {
      setError('Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Complete profile and go to dashboard
  const handleCompleteProfile = async () => {
    if (!name.trim()) { setError('Please enter your name'); return; }
    if (!dob) { setError('Please select your date of birth'); return; }
    if (!sex) { setError('Please select your sex'); return; }
    setError('');

    const formatted = getFormattedPhone();
    const profile = {
      phone: formatted,
      name: name.trim(),
      dob,
      sex,
    };

    // Save profile for session
    localStorage.setItem('norla_user', JSON.stringify(profile));

    // Save to user database for future logins
    saveUserProfile(formatted, { name: name.trim(), dob, sex });

    // Sync to server for admin panel
    fetch('/api/sync', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'user', data: profile }) }).catch(() => {});

    // Full page navigation to ensure session cookie is carried properly
    window.location.href = '/dashboard';
  };

  // OTP input handler
  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    if (value && !/^\d$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) otpRefs.current[index - 1]?.focus();
  };

  const steps: Step[] = ['phone', 'otp', 'name', 'dob', 'sex'];
  const currentIndex = steps.indexOf(step);
  const progress = ((currentIndex + 1) / steps.length) * 100;

  // Greeting based on time — only on client to avoid hydration mismatch
  const greeting = mounted
    ? (new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening')
    : '';

  return (
    <div className="flex min-h-screen flex-col bg-white" suppressHydrationWarning>
      {/* Progress bar */}
      <div className="h-1 bg-neutral-100">
        <div
          className="h-full bg-neutral-900 transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex flex-1 flex-col justify-center px-6 py-12 max-w-sm mx-auto w-full">
        {/* Back button */}
        {currentIndex > 0 && (
          <button
            onClick={() => {
              setError('');
              const prev = steps[currentIndex - 1];
              setStep(prev);
            }}
            className="flex items-center gap-1.5 text-[13px] font-semibold text-neutral-400 hover:text-neutral-600 transition-colors mb-10 self-start"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        )}

        {/* ── Step: Phone ── */}
        {step === 'phone' && (
          <div>
            <div className="flex items-center gap-3 mb-8">
              <img src="/logo.png" alt="Norla" className="h-12 w-12 object-contain" />
              <div>
                <h2 className="text-[20px] font-bold tracking-[-0.02em] text-neutral-900" style={{ fontFamily: 'var(--font-display)' }}>Norla</h2>
                <p className="text-[11px] text-neutral-400 font-medium tracking-wide">Smarter Nutrition Insight</p>
              </div>
            </div>
            <h1 className="text-[28px] font-bold tracking-[-0.035em] text-neutral-900 mb-2" style={{ fontFamily: 'var(--font-display)' }}>
              Enter your number
            </h1>
            <p className="text-[14px] text-neutral-500 leading-relaxed mb-8">
              {greeting ? `${greeting}! ` : ''}We&apos;ll send a verification code to your WhatsApp.
            </p>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex h-12 items-center justify-center rounded-xl bg-neutral-50 px-4 text-[14px] font-semibold text-neutral-700" style={{ border: '1px solid rgba(0,0,0,0.08)' }}>
                  +91
                </div>
                <Input type="tel" placeholder="Phone number" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} className="flex-1" autoFocus />
              </div>
              {error && <p className="text-[12px] text-red-600 bg-red-50 rounded-xl p-3 font-medium" style={{ border: '1px solid rgba(220,38,38,0.1)' }}>{error}</p>}
              <Button variant="primary" size="lg" className="w-full gap-2" onClick={handleSendOTP} disabled={loading || phone.length < 10}>
                {loading ? 'Sending...' : 'Continue'}
                <ArrowRight className="h-4 w-4" />
              </Button>
              {isDemo && (
                <button onClick={handleDemo} className="w-full text-center text-[12px] text-neutral-400 font-medium py-2 hover:text-neutral-600 transition-colors">
                  Skip — use demo mode
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── Step: OTP ── */}
        {step === 'otp' && (
          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-100 mb-6">
              <Shield className="h-5 w-5 text-neutral-600" strokeWidth={1.8} />
            </div>
            <h1 className="text-[28px] font-bold tracking-[-0.035em] text-neutral-900 mb-2" style={{ fontFamily: 'var(--font-display)' }}>
              Verify code
            </h1>
            <p className="text-[14px] text-neutral-500 leading-relaxed mb-2">
              Enter the 6-digit code sent to <span className="font-semibold text-neutral-700">+91 {phone}</span>
            </p>
            {devCode && (
              <p className="text-[12px] text-amber-600 bg-amber-50 rounded-lg px-3 py-1.5 mb-6 font-mono" style={{ border: '1px solid rgba(217,119,6,0.15)' }}>
                Dev code: {devCode}
              </p>
            )}
            <div className="space-y-4 mt-6">
              <div className="flex justify-between gap-2.5">
                {otp.map((digit, i) => (
                  <input key={i} ref={(el) => { otpRefs.current[i] = el; }} type="text" inputMode="numeric" maxLength={1} value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)} onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    className="h-14 w-full rounded-xl bg-neutral-50 text-center text-[20px] font-bold text-neutral-900 transition-all duration-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900/15"
                    style={{ border: '1px solid rgba(0,0,0,0.08)' }} autoFocus={i === 0} />
                ))}
              </div>
              {error && <p className="text-[12px] text-red-600 bg-red-50 rounded-xl p-3 font-medium" style={{ border: '1px solid rgba(220,38,38,0.1)' }}>{error}</p>}
              <Button variant="primary" size="lg" className="w-full gap-2" onClick={handleVerifyOTP} disabled={loading || otp.join('').length !== 6}>
                {loading ? 'Verifying...' : 'Verify'}
                <ArrowRight className="h-4 w-4" />
              </Button>
              <button
                onClick={handleResendOTP}
                disabled={resendCountdown > 0}
                className={`w-full text-center text-[12px] font-medium py-2 transition-colors ${
                  resendCountdown > 0
                    ? 'text-neutral-300 cursor-not-allowed'
                    : 'text-neutral-400 hover:text-neutral-600'
                }`}
              >
                {resendCountdown > 0 ? `Resend code in ${resendCountdown}s` : 'Resend code'}
              </button>
            </div>
          </div>
        )}

        {/* ── Step: Name ── */}
        {step === 'name' && (
          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-100 mb-6">
              <User className="h-5 w-5 text-neutral-600" strokeWidth={1.8} />
            </div>
            <h1 className="text-[28px] font-bold tracking-[-0.035em] text-neutral-900 mb-2" style={{ fontFamily: 'var(--font-display)' }}>
              What&apos;s your name?
            </h1>
            <p className="text-[14px] text-neutral-500 leading-relaxed mb-8">This helps us personalize your experience.</p>
            <div className="space-y-4">
              <Input type="text" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
              {error && <p className="text-[12px] text-red-600 bg-red-50 rounded-xl p-3 font-medium" style={{ border: '1px solid rgba(220,38,38,0.1)' }}>{error}</p>}
              <Button variant="primary" size="lg" className="w-full gap-2" onClick={() => { if (!name.trim()) { setError('Please enter your name'); return; } setError(''); setStep('dob'); }} disabled={!name.trim()}>
                Continue <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ── Step: DOB ── */}
        {step === 'dob' && (
          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-100 mb-6">
              <Calendar className="h-5 w-5 text-neutral-600" strokeWidth={1.8} />
            </div>
            <h1 className="text-[28px] font-bold tracking-[-0.035em] text-neutral-900 mb-2" style={{ fontFamily: 'var(--font-display)' }}>
              Date of birth
            </h1>
            <p className="text-[14px] text-neutral-500 leading-relaxed mb-8">Used for age-adjusted nutrition insight.</p>
            <div className="space-y-4">
              <Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} className="text-neutral-900" autoFocus />
              {error && <p className="text-[12px] text-red-600 bg-red-50 rounded-xl p-3 font-medium" style={{ border: '1px solid rgba(220,38,38,0.1)' }}>{error}</p>}
              <Button variant="primary" size="lg" className="w-full gap-2" onClick={() => { if (!dob) { setError('Please select your date of birth'); return; } setError(''); setStep('sex'); }} disabled={!dob}>
                Continue <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ── Step: Sex ── */}
        {step === 'sex' && (
          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-100 mb-6">
              <Users className="h-5 w-5 text-neutral-600" strokeWidth={1.8} />
            </div>
            <h1 className="text-[28px] font-bold tracking-[-0.035em] text-neutral-900 mb-2" style={{ fontFamily: 'var(--font-display)' }}>
              Biological sex
            </h1>
            <p className="text-[14px] text-neutral-500 leading-relaxed mb-8">Nutritional needs vary by sex. This improves accuracy.</p>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }].map((option) => (
                  <button key={option.value} onClick={() => setSex(option.value)}
                    className={`h-14 rounded-xl text-[15px] font-semibold transition-all duration-200 active:scale-[0.97] ${
                      sex === option.value ? 'bg-neutral-900 text-white' : 'bg-neutral-50 text-neutral-600 hover:bg-neutral-100'
                    }`} style={sex !== option.value ? { border: '1px solid rgba(0,0,0,0.06)' } : {}}>
                    {option.label}
                  </button>
                ))}
              </div>
              {error && <p className="text-[12px] text-red-600 bg-red-50 rounded-xl p-3 font-medium" style={{ border: '1px solid rgba(220,38,38,0.1)' }}>{error}</p>}
              <Button variant="primary" size="lg" className="w-full gap-2" onClick={handleCompleteProfile} disabled={loading || !sex}>
                {loading ? 'Setting up...' : 'Get Started'}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="px-6 py-5 text-center">
        <p className="text-[11px] text-neutral-400 leading-relaxed">
          By continuing, you agree to our{' '}
          <a href="/terms" className="underline hover:text-neutral-600">Terms of Service</a>
          {' '}and{' '}
          <a href="/privacy" className="underline hover:text-neutral-600">Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
}
