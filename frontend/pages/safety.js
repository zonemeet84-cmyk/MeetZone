import Head from "next/head";
import Link from "next/link";

export default function Safety() {
  return (
    <div className="container">
      <Head>
        <title>Safety & 18+ Policy | ZoneMeet</title>
      </Head>

      <div className="bg-gradient" />

      <div className="content">
        <Link href="/" className="back-btn">
          ← Back to Home
        </Link>

        <h1>Safety & 18+ Policy</h1>
        <div className="last-updated">Last Updated: May 2026</div>

        <div className="warning-box">
          <h2 style={{ marginTop: 0, color: '#f87171' }}>🔞 Strictly 18+ Only</h2>
          <p style={{ color: '#fca5a5', fontWeight: 'bold' }}>
            ZoneMeet is an adult-only platform. You must be at least 18 years of age to access or use this website. By continuing to use ZoneMeet, you legally confirm that you meet this age requirement.
          </p>
        </div>

        <h2>1. Zero Tolerance for Minors</h2>
        <p>
          We do not permit individuals under the age of 18 on our platform. If our system detects or if we receive reports of underage users, those accounts and associated IP addresses will be permanently banned without notice. We reserve the right to report underage presence to relevant authorities to ensure child safety.
        </p>

        <h2>2. Community Safety Guidelines</h2>
        <p>
          While we prioritize free expression, we draw a hard line against:
        </p>
        <ul>
          <li>Non-consensual explicit content.</li>
          <li>Harassment, bullying, or threats of violence.</li>
          <li>Illegal activities or promotion of self-harm.</li>
          <li>Spam, phishing, or financial scams.</li>
        </ul>

        <h2>3. AI Moderation System</h2>
        <p>
          ZoneMeet employs real-time, on-device AI moderation. If the system detects prohibited content (such as nudity where not permitted or illegal imagery), it will automatically blur your camera feed. Repeated violations will result in automated strikes, which will lead to a permanent account ban.
        </p>

        <h2>4. User Empowerment & Reporting</h2>
        <p>
          Your safety is in your hands. We provide you with tools to manage your experience:
        </p>
        <ul>
          <li><strong>Report Feature:</strong> If a user violates our terms, click the "Report" button. This helps us investigate and ban malicious users.</li>
          <li><strong>Skip Feature:</strong> If you feel uncomfortable at any point, use the "Next" button to immediately disconnect and find a new partner.</li>
        </ul>

        <h2>5. Law Enforcement Cooperation</h2>
        <p>
          ZoneMeet complies with legal obligations and will cooperate with law enforcement agencies in cases involving illegal activities, exploitation, or threats to life. We will provide available metadata (such as IP logs) to authorities when legally compelled to do so.
        </p>

        <div style={{ marginTop: '3rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem' }}>
          By using ZoneMeet, you agree to adhere to these safety policies. Stay safe and respect the community!
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
          background: radial-gradient(circle at 50% 0%, #3f1a26 0%, #030712 60%);
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
        .warning-box {
          border-left: 4px solid #ef4444;
          background: rgba(239, 68, 68, 0.05);
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 2rem;
        }
        h1 {
          font-size: 3.5rem;
          font-weight: 900;
          margin-bottom: 0.5rem;
          background: linear-gradient(135deg, #ef4444, #f97316);
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
          margin-top: 2.5rem;
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
          color: #ef4444;
        }
        .back-btn {
          display: inline-flex;
          align-items: center;
          margin-bottom: 2.5rem;
          color: #fca5a5;
          text-decoration: none;
          font-weight: 700;
          font-size: 0.95rem;
          transition: all 0.3s ease;
          background: rgba(239, 68, 68, 0.1);
          padding: 0.5rem 1rem;
          border-radius: 50px;
        }
        .back-btn:hover {
          color: #fff;
          background: #ef4444;
          transform: translateX(-5px);
        }
        @media (max-width: 768px) {
          .container { padding: 2rem 1rem; }
          .content { padding: 2rem; }
          h1 { font-size: 2.5rem; }
        }
      `}</style>
    </div>
  );
}
