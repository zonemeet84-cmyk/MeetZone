import Head from "next/head";
import Link from "next/link";

export default function Privacy() {
  return (
    <div className="container">
      <Head>
        <title>Privacy Policy | ZoneMeet</title>
      </Head>

      <div className="bg-gradient" />

      <div className="content">
        <Link href="/" className="back-btn">
          ← Back to Home
        </Link>

        <h1>Privacy Policy</h1>
        <div className="last-updated">Last Updated: May 2026</div>

        <h2>1. Information We Collect</h2>
        <p>
          At ZoneMeet, we prioritize your privacy and anonymity. We collect information you provide directly to us when you create an account, such as your email address, name, age bracket, gender, and country. For guest users, we do not require account creation, but we may collect temporary data to facilitate the peer-to-peer connection.
        </p>

        <h2>2. Peer-to-Peer Video Streaming</h2>
        <p>
          ZoneMeet utilizes WebRTC technology to establish direct peer-to-peer (P2P) connections between users. This means your video and audio data flows directly between you and your chat partner. We do not intercept, record, or store any video or audio streams on our servers. 
        </p>

        <h2>3. AI Moderation</h2>
        <p>
          To maintain a safe environment, ZoneMeet uses client-side AI moderation to detect NSFW content (e.g., nudity or explicit material). This processing happens entirely on your device. The AI only sends a mathematical flag (a safety signal) to our servers if a violation is detected. No visual data or images are ever transmitted to our servers for moderation.
        </p>

        <h2>4. Data Usage</h2>
        <p>We use the information we collect to:</p>
        <ul>
          <li>Provide, maintain, and improve the Service.</li>
          <li>Match you with other users based on your preferences (gender, country, age).</li>
          <li>Process transactions and send related information (e.g., confirmations, receipts).</li>
          <li>Monitor and enforce our Community Guidelines.</li>
        </ul>

        <h2>5. Information Sharing</h2>
        <p>
          We do not sell, rent, or trade your personal information to third parties. We may share your information only in the following circumstances:
        </p>
        <ul>
          <li>With vendors, consultants, and other service providers who need access to such information to carry out work on our behalf (e.g., payment processors like Razorpay/Stripe).</li>
          <li>In response to a request for information if we believe disclosure is in accordance with, or required by, any applicable law, regulation, or legal process.</li>
          <li>If we believe your actions are inconsistent with our user agreements or policies, or to protect the rights, property, and safety of ZoneMeet or others.</li>
        </ul>

        <h2>6. Security</h2>
        <p>
          We take reasonable measures to help protect information about you from loss, theft, misuse, unauthorized access, disclosure, alteration, and destruction. Our platform uses 256-bit encryption for all sensitive data transfers.
        </p>

        <h2 style={{ color: '#f87171' }}>7. Children's Privacy & Age Policy</h2>
        <div style={{ borderLeft: '4px solid #ef4444', paddingLeft: '15px', background: 'rgba(239, 68, 68, 0.05)', padding: '12px 15px', borderRadius: '8px', marginBottom: '1.5rem' }}>
          <p style={{ color: '#f87171', fontWeight: '800', margin: 0 }}>
            🔞 MINORS RESTRICTION (UNDER 18 YEARS): ZoneMeet is strictly intended for individuals who are 18 years of age or older. We do not knowingly collect, solicit, or process personal data from anyone under the age of 18. If we become aware that we have inadvertently collected personal data from a child under 18, we will take immediate steps to permanently delete that information from our servers and ban the associated account/IP.
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
          .container { padding: 2rem 1rem; }
          .content { padding: 2rem; }
          h1 { font-size: 2.5rem; }
        }
      `}</style>
    </div>
  );
}
