import { createClient } from './supabase-server';

/**
 * Send OTP via WhatsApp Cloud API
 * Uses settings from admin_settings table
 */
export async function sendWhatsAppOTP(phone: string, code: string): Promise<boolean> {
  const supabase = createClient();
  if (!supabase) {
    console.error('[WhatsApp] Supabase not configured');
    return false;
  }

  // Get WhatsApp config from admin settings
  const { data: settings } = await supabase
    .from('admin_settings')
    .select('key, value')
    .in('key', ['whatsapp_phone_number_id', 'whatsapp_access_token']);

  if (!settings || settings.length < 2) {
    console.error('[WhatsApp] Settings not configured');
    return false;
  }

  const config: Record<string, string> = {};
  settings.forEach((s: { key: string; value: string }) => {
    config[s.key] = s.value;
  });

  const phoneNumberId = config.whatsapp_phone_number_id;
  const accessToken = config.whatsapp_access_token;

  if (!phoneNumberId || !accessToken) {
    console.error('[WhatsApp] Phone number ID or access token missing');
    return false;
  }

  // Format phone: ensure it starts with country code, no +
  const formattedPhone = phone.replace(/^\+/, '').replace(/\s/g, '');

  try {
    // Send via WhatsApp Cloud API (Meta)
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: formattedPhone,
          type: 'text',
          text: {
            body: `Your Norla verification code is: ${code}\n\nThis code expires in 5 minutes. Do not share this code with anyone.`,
          },
        }),
      }
    );

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      console.error('[WhatsApp] API error:', errBody);
      return false;
    }

    // Log activity
    await supabase.from('activity_log').insert({
      action: 'otp_sent',
      user_phone: phone,
      details: { method: 'whatsapp', status: 'sent' },
    });

    return true;
  } catch (err) {
    console.error('[WhatsApp] Send failed:', err);
    return false;
  }
}
