import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy — Norla',
  description: 'How Norla collects, uses, and protects your personal data.',
};

export default function PrivacyPolicyPage() {
  const lastUpdated = 'April 14, 2025';
  const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'support@norla.app';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://norla.app';

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: 'Inter, -apple-system, sans-serif' }}>
      {/* Header */}
      <div className="border-b border-neutral-100 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="Norla" className="h-8 w-8 object-contain" />
            <span className="text-[16px] font-bold text-neutral-900">Norla</span>
          </Link>
          <Link href="/terms" className="text-[13px] text-neutral-500 hover:text-neutral-700">
            Terms of Service →
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="text-[32px] font-bold text-neutral-900 tracking-tight mb-2">Privacy Policy</h1>
        <p className="text-[13px] text-neutral-400 mb-10">Last updated: {lastUpdated}</p>

        <div className="space-y-8 text-[14px] text-neutral-700 leading-[1.8]">

          <section>
            <h2 className="text-[18px] font-bold text-neutral-900 mb-3">1. About Norla</h2>
            <p>
              Norla (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;) is an AI-powered nutrition insight platform
              accessible at <a href={appUrl} className="text-teal-600 underline">{appUrl}</a> and as a mobile
              application (&ldquo;the App&rdquo;). This Privacy Policy explains how we collect, use, disclose, and protect
              your personal information when you use our services.
            </p>
            <p className="mt-3 p-4 bg-amber-50 rounded-xl text-[13px] text-amber-800 border border-amber-100">
              <strong>Medical Disclaimer:</strong> Norla is NOT a medical device and does NOT provide clinical diagnoses.
              All nutrition scores are AI-generated predictions for wellness awareness only. Always consult a qualified
              healthcare professional for medical advice.
            </p>
          </section>

          <section>
            <h2 className="text-[18px] font-bold text-neutral-900 mb-3">2. Information We Collect</h2>
            <h3 className="text-[15px] font-semibold text-neutral-800 mb-2">2.1 Information You Provide</h3>
            <ul className="list-disc list-inside space-y-1 text-neutral-600">
              <li><strong>Phone number</strong> — for authentication via WhatsApp OTP verification</li>
              <li><strong>Full name</strong> — for personalizing your experience</li>
              <li><strong>Date of birth</strong> — for age-adjusted nutrition insights</li>
              <li><strong>Biological sex</strong> — for sex-specific nutrition analysis</li>
              <li><strong>Photos</strong> (face, eye, hand) — submitted during scans for analysis</li>
              <li><strong>Health questionnaire responses</strong> — lifestyle and dietary habits</li>
            </ul>

            <h3 className="text-[15px] font-semibold text-neutral-800 mt-4 mb-2">2.2 Automatically Collected</h3>
            <ul className="list-disc list-inside space-y-1 text-neutral-600">
              <li>Usage logs — scan history, login timestamps</li>
              <li>Device type and browser (for compatibility)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[18px] font-bold text-neutral-900 mb-3">3. How We Use Your Information</h2>
            <ul className="list-disc list-inside space-y-1 text-neutral-600">
              <li>To authenticate you via WhatsApp OTP</li>
              <li>To perform AI-powered nutrition analysis on your photos</li>
              <li>To display and store your scan history</li>
              <li>To improve the accuracy of our AI models (in aggregate, anonymised)</li>
              <li>To communicate service-critical information</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[18px] font-bold text-neutral-900 mb-3">4. Photo & Biometric Data</h2>
            <p>
              Your photos (face, eye, hand) are transmitted securely to Google Gemini AI for visual analysis.
              <strong> We do not permanently store your raw photos on our servers.</strong> The images are
              processed in memory and discarded after analysis. Only the numerical scores and text insights
              generated from the analysis are stored in our database.
            </p>
          </section>

          <section>
            <h2 className="text-[18px] font-bold text-neutral-900 mb-3">5. Third-Party Services</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-[13px] border-collapse">
                <thead>
                  <tr className="border-b border-neutral-200">
                    <th className="text-left py-2 pr-4 font-semibold text-neutral-600">Service</th>
                    <th className="text-left py-2 pr-4 font-semibold text-neutral-600">Purpose</th>
                    <th className="text-left py-2 font-semibold text-neutral-600">Data Shared</th>
                  </tr>
                </thead>
                <tbody className="text-neutral-600">
                  {[
                    ['Google Gemini AI', 'Image analysis for nutrition scoring', 'Photos (processed, not stored by Google per their API terms)'],
                    ['Supabase', 'Secure database for user data', 'Phone, name, DOB, sex, scan results'],
                    ['WhatsApp (Meta)', 'OTP delivery for authentication', 'Phone number only'],
                  ].map(([service, purpose, data]) => (
                    <tr key={service} className="border-b border-neutral-100">
                      <td className="py-2 pr-4 font-medium">{service}</td>
                      <td className="py-2 pr-4">{purpose}</td>
                      <td className="py-2 text-neutral-500">{data}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-[18px] font-bold text-neutral-900 mb-3">6. Data Security</h2>
            <p>
              We implement industry-standard security measures including HTTPS encryption, HTTP-only session
              cookies, and Row-Level Security (RLS) on our database. Your data is stored on Supabase&apos;s
              secure cloud infrastructure.
            </p>
          </section>

          <section>
            <h2 className="text-[18px] font-bold text-neutral-900 mb-3">7. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc list-inside space-y-1 text-neutral-600 mt-2">
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your account and associated data</li>
              <li>Withdraw consent at any time by deleting your account</li>
            </ul>
            <p className="mt-3">
              To exercise these rights, email us at{' '}
              <a href={`mailto:${contactEmail}`} className="text-teal-600 underline">{contactEmail}</a>
            </p>
          </section>

          <section>
            <h2 className="text-[18px] font-bold text-neutral-900 mb-3">8. Children&apos;s Privacy</h2>
            <p>
              Norla is not directed to children under 13 years of age. We do not knowingly collect personal
              information from children under 13. If you believe a child has provided us with personal information,
              please contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="text-[18px] font-bold text-neutral-900 mb-3">9. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy periodically. We will notify you of any significant changes by
              posting the new policy on this page with an updated &ldquo;Last updated&rdquo; date.
            </p>
          </section>

          <section>
            <h2 className="text-[18px] font-bold text-neutral-900 mb-3">10. Contact Us</h2>
            <p>If you have any questions about this Privacy Policy, please contact us:</p>
            <div className="mt-3 p-4 bg-neutral-50 rounded-xl text-[13px]" style={{ border: '1px solid rgba(0,0,0,0.06)' }}>
              <p><strong>Norla Support</strong></p>
              <p>Email: <a href={`mailto:${contactEmail}`} className="text-teal-600 underline">{contactEmail}</a></p>
            </div>
          </section>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-neutral-100 py-6 text-center">
        <div className="flex items-center justify-center gap-4 text-[12px] text-neutral-400">
          <Link href="/" className="hover:text-neutral-600">Home</Link>
          <Link href="/terms" className="hover:text-neutral-600">Terms of Service</Link>
          <span>© {new Date().getFullYear()} Norla. All rights reserved.</span>
        </div>
      </div>
    </div>
  );
}
