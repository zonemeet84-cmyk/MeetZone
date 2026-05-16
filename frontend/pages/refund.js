import Head from "next/head";
import Link from "next/link";

export default function Refund() {
  return (
    <div className="container">
      <Head>
        <title>Refund Policy | ZoneMeet</title>
      </Head>

      <div className="bg-gradient" />

      <div className="content">
        <Link href="/" className="back-btn">
          ← Back to Home
        </Link>

        <h1>Refund Policy</h1>
        <div className="last-updated">Last Updated: May 2026</div>

        <h2>1. General Policy</h2>
        <p>
          All purchases made on the ZoneMeet platform, including but not limited to ZoneMeet Coins, ZoneMeet Premium subscriptions (Starter, Prime, Silver), and VIP Elite upgrades, are generally non-refundable. 
        </p>

        <h2>2. ZoneMeet Coins</h2>
        <p>
          ZoneMeet Coins are a digital currency used within our ecosystem. Once purchased and credited to your account, they cannot be refunded, exchanged for fiat currency, or transferred to another user under any circumstances.
        </p>

        <h2>3. Subscriptions</h2>
        <p>
          If you cancel your auto-renewing subscription, you will continue to have access to the premium features until the end of your current billing period. We do not provide prorated refunds for partially used billing periods.
        </p>

        <h2>4. Exceptions</h2>
        <p>
          We may grant exceptions to this no-refund policy at our sole discretion in the following circumstances:
        </p>
        <ul>
          <li><strong>Technical Errors:</strong> If a technical issue on our end prevents you from accessing the service or features you purchased, and we are unable to resolve the issue within a reasonable timeframe.</li>
          <li><strong>Fraudulent Charges:</strong> If you believe your payment method was used fraudulently without your authorization, please contact us immediately. We will investigate and may process a refund if the fraud is confirmed.</li>
        </ul>

        <h2>5. How to Request a Refund</h2>
        <p>
          If you believe you meet the criteria for an exception, please contact our support team at <strong>support@zonemeet.live</strong> within 7 days of the transaction date. Please include your registered email address, transaction ID, and a detailed explanation of the issue.
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
