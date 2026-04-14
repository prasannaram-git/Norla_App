'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from '@/lib/motion';
import { Card, CardContent } from '@/components/ui/card';
import { SectionHeader } from '@/components/section-header';
import { useAuth } from '@/contexts/auth-context';
import { LogOut, Phone, ShieldCheck, ChevronRight, Info, Calendar, User, Trash2, AlertTriangle } from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isDemo, signOut } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await signOut();
    } catch (e) {
      console.error('Logout failed', e);
    } finally {
      setLoggingOut(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      const res = await fetch('/api/user/delete', { method: 'DELETE' });
      if (res.ok) {
        // Clear all local data
        localStorage.clear();
        sessionStorage.clear();
        // Redirect to login
        router.push('/login');
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete account. Please try again.');
      }
    } catch {
      alert('Connection error. Please try again.');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const displayName = user?.user_metadata?.full_name || 'User';
  const displayPhone = user?.phone || '+91 0000000000';
  const displaySex = user?.user_metadata?.sex || '--';
  const displayDob = user?.user_metadata?.date_of_birth || '--';
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="px-5 py-6 space-y-4 max-w-lg mx-auto">
      {/* Brand Header */}
      <div className="flex items-center gap-2.5 mb-2">
        <img src="/logo.png" alt="Norla" className="h-8 w-8 object-contain" />
        <span className="text-[16px] font-bold tracking-[-0.02em] text-neutral-900" style={{ fontFamily: 'var(--font-display)' }}>Norla</span>
      </div>
      <SectionHeader title="Profile" />

      {/* User card */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-900 text-white">
                <span
                  className="text-[14px] font-bold"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {initials}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <h3
                  className="text-[16px] font-bold text-neutral-900 truncate"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {displayName}
                </h3>
                <div className="flex items-center gap-1.5 text-[12px] text-neutral-400 mt-0.5">
                  <Phone className="h-3 w-3" />
                  <span className="truncate">{displayPhone}</span>
                </div>
              </div>
              {isDemo && (
                <span className="shrink-0 rounded-full bg-neutral-100 px-2.5 py-1 text-[10px] font-bold text-neutral-500 tracking-wide">
                  Demo
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Personal Info */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}>
        <Card>
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-neutral-100">
                <User className="h-4 w-4 text-neutral-500" />
              </div>
              <div className="flex-1">
                <p className="text-[11px] text-neutral-400 font-semibold uppercase tracking-wider">Sex</p>
                <p className="text-[14px] text-neutral-900 font-medium capitalize">{displaySex}</p>
              </div>
            </div>
            <div className="h-px bg-neutral-100" />
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-neutral-100">
                <Calendar className="h-4 w-4 text-neutral-500" />
              </div>
              <div className="flex-1">
                <p className="text-[11px] text-neutral-400 font-semibold uppercase tracking-wider">Date of Birth</p>
                <p className="text-[14px] text-neutral-900 font-medium">{displayDob}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Disclaimer */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start gap-3.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-neutral-100">
                <ShieldCheck className="h-4 w-4 text-neutral-500" />
              </div>
              <div>
                <h4 className="text-[13px] font-semibold text-neutral-900 mb-1">Disclaimer</h4>
                <p className="text-[12px] text-neutral-500 leading-[1.6]">
                  Norla provides AI-powered predicted nutrition support scores based on visual
                  analysis and lifestyle data. These are not medical advice or clinical diagnoses.
                  Always consult a qualified healthcare professional.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* About */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start gap-3.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-neutral-100">
                <Info className="h-4 w-4 text-neutral-500" />
              </div>
              <div className="flex-1">
                <h4 className="text-[13px] font-semibold text-neutral-900 mb-1">About</h4>
                <div className="space-y-0.5 text-[12px] text-neutral-500 mb-3">
                  <p>Version 1.0.0</p>
                  <p>AI-powered nutrition insight</p>
                </div>
                <div className="flex gap-3 text-[12px]">
                  <a href="/privacy" className="text-teal-600 underline hover:text-teal-700">Privacy Policy</a>
                  <a href="/terms" className="text-teal-600 underline hover:text-teal-700">Terms of Service</a>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Sign out */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }}>
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex w-full items-center justify-between rounded-2xl bg-red-50 px-5 py-4 text-[14px] font-semibold text-red-700 transition-all active:bg-red-100/60 disabled:opacity-50 hover-lift"
          style={{ border: '1px solid rgba(220, 38, 38, 0.12)' }}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100/80">
              <LogOut className="h-4 w-4" />
            </div>
            {loggingOut ? 'Signing out...' : 'Sign Out'}
          </div>
          <ChevronRight className="h-4 w-4 text-red-300" />
        </button>
      </motion.div>

      {/* Delete Account — Required by Play Store / App Store */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.30 }}>
        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex w-full items-center gap-3 px-5 py-3 text-[13px] text-neutral-400 hover:text-red-500 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete Account
          </button>
        ) : (
          <div className="rounded-2xl bg-white p-5" style={{ border: '1px solid rgba(220,38,38,0.15)' }}>
            <div className="flex items-start gap-3 mb-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </div>
              <div>
                <p className="text-[14px] font-bold text-neutral-900">Delete your account?</p>
                <p className="text-[12px] text-neutral-500 mt-1 leading-relaxed">
                  This permanently deletes your account, all scan results, and personal data. This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="flex-1 h-10 rounded-xl bg-red-600 text-[13px] font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition-all"
              >
                {deleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="flex-1 h-10 rounded-xl bg-neutral-100 text-[13px] font-semibold text-neutral-600 hover:bg-neutral-200 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Bottom spacing for mobile nav */}
      <div className="h-4" />
    </div>
  );
}
