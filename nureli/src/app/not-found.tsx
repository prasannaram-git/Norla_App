import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 bg-white">
      <img src="/logo.png" alt="Norla" className="h-16 w-16 object-contain mb-6" />
      <h1
        className="text-[32px] font-bold tracking-[-0.04em] text-neutral-900 mb-2"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        Page Not Found
      </h1>
      <p className="text-[14px] text-neutral-500 mb-8 text-center max-w-xs leading-relaxed">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/dashboard"
        className="flex h-12 items-center justify-center rounded-xl bg-neutral-900 px-8 text-[14px] font-semibold text-white transition-all hover:bg-neutral-800 active:scale-[0.98]"
      >
        Go to Dashboard
      </Link>
    </div>
  );
}
