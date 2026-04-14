/**
 * GET /api/health
 *
 * Health check endpoint for UptimeRobot (or any uptime monitor).
 * UptimeRobot (free) pings this URL every 5 minutes to keep the
 * Render.com / Railway free-tier server alive so WhatsApp stays connected.
 *
 * Setup: https://uptimerobot.com → Add Monitor → HTTP(S) → your-app.onrender.com/api/health
 */
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    app: 'Norla',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
}
