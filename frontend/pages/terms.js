import Head from "next/head";
import Link from "next/link";

export default function Terms() {
  return (
    <div className="container">
      <Head>
        <title>Terms & Conditions | ZoneMeet</title>
      </Head>

      <div className="bg-gradient" />

      <div className="content">
        <Link href="/" className="back-btn">
          ← Back to Home
        </Link>

        <h1>Terms & Conditions</h1>
        <div className="last-updated">Last Updated: May 2026</div>

        <h2>1. Acceptance of Terms & Age Eligibility</h2>
        <p style={{ color: '#f87171', fontWeight: '800', borderLeft: '4px solid #ef4444', paddingLeft: '15px', background: 'rgba(239, 68, 68, 0.05)', padding: '12px 15px', borderRadius: '8px' }}>
          🔞 MANDATORY AGE REQUIREMENT: You must be at least 18 years of age or older to access or use the ZoneMeet platform ("Service"). By using the Service, you warrant and represent that you are at least 18 years of age and possess the legal capacity to enter into this agreement. If you are under 18, you are strictly prohibited from accessing or using the Service.
        </p>
        <p>
          By accessing or using the Service, you agree to be fully bound by these Terms and Conditions. If you do not agree to these terms, you may not use the Service.
        </p>

        <h2>2. User Conduct</h2>
        <p>
          You agree to use the Service respectfully and legally. You are solely responsible for your conduct and any data, text, files, information, usernames, images, graphics, photos, profiles, audio and video clips, sounds, musical works, works of authorship, applications, links and other content or materials that you submit, post or display on or via the Service.
        </p>
        <ul>
          <li>You must not defame, stalk, bully, abuse, harass, threaten, impersonate or intimidate people or entities.</li>
          <li>You must not post violent, nude, partially nude, discriminatory, unlawful, infringing, hateful, pornographic or sexually suggestive content.</li>
          <li>You must not create accounts with the Service through unauthorized means, including but not limited to, by using an automated device, script, bot, spider, crawler or scraper.</li>
        </ul>

        <h2>3. Virtual Currency (ZoneMeet Coins)</h2>
        <p>
          ZoneMeet Coins are a virtual currency used within the platform to access premium features. They have no real-world monetary value, are non-transferable, and cannot be redeemed for cash. All sales of ZoneMeet Coins are final and non-refundable, except as required by law or as explicitly stated in our Refund Policy.
        </p>

        <h2>4. Subscriptions (ZoneMeet Pro & VIP Elite)</h2>
        <p>
          ZoneMeet offers auto-renewing premium subscriptions. Payment will be charged to your chosen payment method at confirmation of purchase. Subscriptions automatically renew unless cancelled at least 24 hours before the end of the current period.
        </p>

        <h2>5. Automated Moderation & Strike System</h2>
        <p>
          To maintain a safe and respectful environment, ZoneMeet employs real-time AI moderation for both Video and Chat. By using the service, you acknowledge and agree to our <strong>"2-Strike Enforcement Policy"</strong>:
        </p>
        <ul>
          <li><strong>Strike 1 (Warning):</strong> Upon the first detection of abusive language (Hinglish/English) or inappropriate 18+ video content, you will receive an automated formal warning.</li>
          <li><strong>Strike 2 (Permanent Ban):</strong> If a second violation is detected, your account and IP address will be permanently banned from the platform without exception.</li>
        </ul>
        <p>
          Serious violations (e.g., severe illegal activity) may result in an immediate permanent ban without a warning strike at our sole discretion.
        </p>

        <h2>6. Termination</h2>
        <p>
          We reserve the right to modify or terminate the Service or your access to the Service for any reason, without notice, at any time, and without liability to you. If we terminate your access, your account and all associated data, including ZoneMeet Coins, will be permanently deleted.
        </p>

        <h2>6. Disclaimer of Warranties</h2>
        <p>
          The Service is provided on an "as is" and "as available" basis. ZoneMeet makes no representations or warranties of any kind, express or implied, regarding the use or the results of this web site in terms of its correctness, accuracy, reliability, or otherwise.
        </p>

        <div style={{
          marginTop: '3rem',
          padding: '24px 28px',
          background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(168,85,247,0.08))',
          border: '1px solid rgba(99,102,241,0.25)',
          borderRadius: '18px',
          textAlign: 'center'
        }}>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem', lineHeight: '1.8', margin: 0 }}>
            <span style={{ color: '#c4b5fd', fontWeight: 700 }}>ZoneMeet</span> is independently developed and managed by{' '}
            <span style={{ color: '#a5b4fc', fontWeight: 700 }}>Davinder Singh</span>.<br />
            For support, partnerships, business inquiries, or any important concerns, please contact:{' '}
            <a href="mailto:support@zonemeet.chat" style={{ color: '#818cf8', fontWeight: 700, textDecoration: 'none' }}>
              support@zonemeet.chat
            </a>
          </p>
        </div>
      </div>

      <style jsx>{`
        .container {
          min-height: 100vh;
          padding: 4rem 2rem;
          color: white;
          position: relative;
          background: #030712;
          font-family: 'Inter', sans-serif;
        }
        .bg-gradient {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: radial-gradient(circle at 50% 0%, #1e1b4b 0%, #030712 60%);
          z-index: 1;
        }
        .content {
          max-width: 800px;
          margin: 0 auto;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          padding: 4rem;
          border-radius: 32px;
          backdrop-filter: blur(20px);
          position: relative;
          z-index: 2;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }
        h1 {
          font-size: 3.5rem;
          font-weight: 900;
          margin-bottom: 0.5rem;
          background: linear-gradient(135deg, #6366f1, #a855f7);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          letter-spacing: -0.02em;
        }
        .last-updated {
          color: #64748b;
          font-size: 0.95rem;
          font-weight: 500;
          margin-bottom: 3rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        h2 {
          font-size: 1.5rem;
          color: #f8fafc;
          margin-top: 3rem;
          margin-bottom: 1.25rem;
          font-weight: 700;
        }
        p, li {
          color: #94a3b8;
          line-height: 1.8;
          margin-bottom: 1.25rem;
          font-size: 1.05rem;
        }
        ul {
          padding-left: 1.5rem;
          margin-bottom: 2rem;
        }
        li::marker {
          color: #6366f1;
        }
        .back-btn {
          display: inline-flex;
          align-items: center;
          margin-bottom: 2.5rem;
          color: #818cf8;
          text-decoration: none;
          font-weight: 700;
          font-size: 0.95rem;
          transition: all 0.3s ease;
          background: rgba(99, 102, 241, 0.1);
          padding: 0.5rem 1rem;
          border-radius: 50px;
        }
        .back-btn:hover {
          color: #fff;
          background: #6366f1;
          transform: translateX(-5px);
        }
        @media (max-width: 768px) {
          .container { padding: 1.5rem 0.75rem !important; }
          .content { padding: 1.5rem 1rem !important; border-radius: 20px !important; }
          h1 { font-size: 2.2rem !important; }
          h2 { font-size: 1.35rem !important; margin-top: 2rem !important; }
          p, li { font-size: 0.95rem !important; line-height: 1.7 !important; }
          .back-btn { margin-bottom: 1.5rem !important; font-size: 0.85rem !important; padding: 0.4rem 0.8rem !important; }
        }

        @media (max-width: 480px) {
          .container { padding: 1rem 0.5rem !important; }
          .content { padding: 1.25rem 0.75rem !important; }
          h1 { font-size: 1.8rem !important; }
        }
      `}</style>
    </div>
  );
}
