/**
 * Next.js Instrumentation — Server Startup Hook
 *
 * This file runs ONCE when the Next.js server starts.
 * We use it to auto-restore WhatsApp sessions from saved auth files.
 *
 * If the server restarts (e.g., after a Render.com deploy), this will
 * automatically reconnect any WhatsApp slots that were previously
 * authenticated — so OTP delivery resumes without manual intervention.
 *
 * Docs: https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation
 */
export async function register() {
  // Only run on Node.js runtime (not Edge), and only in the actual server process
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log('[Norla] Server starting — restoring WhatsApp sessions...');

    try {
      const { autoRestoreSessions } = await import('./lib/whatsapp-web');
      await autoRestoreSessions();
    } catch (err) {
      // WhatsApp module may fail in some environments (Vercel, Edge, etc.)
      // That's OK — OTP will fall back to dev mode or show disconnected state
      console.warn('[Norla] WhatsApp auto-restore skipped:', (err as Error).message);
    }
  }
}
