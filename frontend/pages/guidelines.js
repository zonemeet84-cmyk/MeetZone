import Head from "next/head";
import Link from "next/link";

export default function Guidelines() {
  return (
    <div className="container">
      <Head>
        <title>Community Guidelines | ZoneMeet</title>
      </Head>

      <div className="bg-gradient" />

      <div className="content">
        <Link href="/" className="back-btn">
          ← Back to Home
        </Link>

        <h1>Community Guidelines</h1>
        <div className="last-updated">Last Updated: May 2026</div>

        <div className="intro-box">
          <p>
            Welcome to ZoneMeet! Our goal is to create a safe, respectful, and engaging environment for people from all over the world to connect. To ensure a positive experience for everyone, all users must adhere to the following guidelines.
          </p>
        </div>

        <h2>🚫 Zero Tolerance Policy</h2>
        <p>We have a strict zero-tolerance policy for the following behaviors. Violating these rules will result in an immediate, permanent ban:</p>
        <ul>
          <li><strong>Nudity & Sexual Content:</strong> Any form of nudity, sexual acts, or sexually explicit content is strictly prohibited on camera. Our AI Guardian actively monitors for this.</li>
          <li><strong>Underage Usage:</strong> ZoneMeet is strictly for users aged 18 and older.</li>
          <li><strong>Hate Speech & Discrimination:</strong> Using slurs, derogatory language, or promoting violence/hatred against any race, religion, gender, or sexual orientation.</li>
          <li><strong>Illegal Acts:</strong> Promoting or broadcasting illegal acts, drug use, or violence.</li>
        </ul>

        <h2>🤝 Respectful Interaction</h2>
        <p>Even if behavior doesn't fall under the "Zero Tolerance" category, we expect you to treat your partners with basic human decency:</p>
        <ul>
          <li><strong>No Harassment:</strong> Do not bully, threaten, or repeatedly harass your chat partners.</li>
          <li><strong>Consent:</strong> Respect boundaries. If someone asks you to stop doing something, stop.</li>
          <li><strong>No Spamming:</strong> Do not use the chat to advertise products, services, or other websites.</li>
        </ul>

        <h2>📸 Privacy Protection</h2>
        <ul>
          <li><strong>No Screenshots/Recording:</strong> Taking screenshots or recording video streams without the explicit consent of the other person is a violation of their privacy and our terms. Our system employs screenshot-blocking technology, but bypassing this is a banable offense.</li>
          <li><strong>Do Not Share Personal Info:</strong> For your own safety, avoid sharing sensitive personal information (address, phone number, financial details) with other users.</li>
        </ul>

        <h2>🚨 Reporting Violations</h2>
        <p>
          If you encounter a user violating these guidelines, please use the in-app <strong>Report Flag (🚩)</strong> immediately. Our moderation team reviews reports 24/7. Your reports are crucial in keeping the ZoneMeet community safe.
        </p>
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
        .intro-box {
          background: rgba(99, 102, 241, 0.1);
          border-left: 4px solid #6366f1;
          padding: 1.5rem;
          border-radius: 0 16px 16px 0;
          margin-bottom: 3rem;
        }
        .intro-box p { margin: 0; color: #e2e8f0; }
        h2 {
          font-size: 1.5rem;
          color: #f8fafc;
          margin-top: 3rem;
          margin-bottom: 1.25rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 10px;
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
        strong {
          color: #f8fafc;
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
