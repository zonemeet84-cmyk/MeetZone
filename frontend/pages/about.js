import Head from "next/head";
import Link from "next/link";

export default function About() {
  return (
    <div className="about-premium-v2">
      <Head>
        <title>About Us | ZoneMeet AI</title>
      </Head>

      {/* DYNAMIC BACKGROUND */}
      <div className="gradient-sphere pos-1" />
      <div className="gradient-sphere pos-2" />
      <div className="gradient-sphere pos-3" />
      <div className="grid-overlay" />

      <div className="about-main">
        {/* TOP NAV */}
        <nav className="top-nav">
          <Link href="/" className="logo">Zone<span>Meet</span></Link>
          <Link href="/" className="back-link">
            <span>←</span> Back to Dashboard
          </Link>
        </nav>

        {/* HERO SECTION */}
        <section className="hero-section">
          <div className="status-badge"><span>●</span> THE VISION</div>
          <h1>Connecting the World, <span>Instantly.</span></h1>
          <p className="hero-subtitle">
            ZoneMeet is an AI-powered global communication platform designed for instant networking, 
            socializing, and making friends worldwide without borders.
          </p>
        </section>

        {/* MISSION & VALUES */}
        <section className="values-grid">
          <div className="value-box">
            <div className="value-icon">🌍</div>
            <h3>Global Reach</h3>
            <p>We break down barriers of distance and language to bring people from 190+ countries together in real-time.</p>
          </div>
          <div className="value-box">
            <div className="value-icon">🛡️</div>
            <h3>Privacy First</h3>
            <p>Your data is yours. With end-to-end encryption and advanced AI moderation, we ensure a safe and secure environment.</p>
          </div>
          <div className="value-box">
            <div className="value-icon">⚡</div>
            <h3>AI-Powered</h3>
            <p>Experience lightning-fast matchmaking, live translation, and intelligent network routing for seamless video calls.</p>
          </div>
        </section>

        <div className="divider" />

        {/* FOUNDER STATEMENT */}
        <section className="founder-section">
          <div className="founder-card">
            <div className="founder-header">
              <h2>Independent & User-Centric</h2>
              <div className="badge-indie">Indie Built</div>
            </div>
            
            <div className="founder-content">
              <p className="highlight-text">
                ZoneMeet is independently developed and managed by <span className="highlight-name">Davinder Singh</span>.
              </p>
              <p className="sub-text">
                What started as a vision to create a secure and blazing-fast random chat application 
                has evolved into a global platform. By remaining independent, we ensure that our primary 
                focus always remains on <strong>user experience, community safety, and continuous innovation</strong>, 
                rather than corporate interests.
              </p>
              
              <div className="contact-box">
                <div className="contact-icon">✉️</div>
                <div className="contact-info">
                  <p className="contact-label">For support, partnerships, business inquiries, or any important concerns, please contact:</p>
                  <a href="mailto:support@zonemeet.chat" className="contact-email">support@zonemeet.chat</a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="about-footer">
          <p>&copy; 2026 ZoneMeet AI. All rights reserved.</p>
          <div className="footer-links">
            <Link href="/contact">Contact</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/privacy">Privacy</Link>
          </div>
        </footer>
      </div>

      <style jsx>{`
        .about-premium-v2 {
          background: #000;
          min-height: 100vh;
          color: white;
          font-family: 'Inter', sans-serif;
          position: relative;
          overflow-x: hidden;
        }

        /* BACKGROUND ELEMENTS */
        .gradient-sphere {
          position: fixed;
          width: 800px;
          height: 800px;
          border-radius: 50%;
          filter: blur(150px);
          z-index: 0;
          opacity: 0.12;
          pointer-events: none;
        }
        .pos-1 { top: -20%; right: -10%; background: #6366f1; }
        .pos-2 { bottom: -10%; left: -10%; background: #ec4899; }
        .pos-3 { top: 40%; left: 30%; background: #a855f7; opacity: 0.08; }
        
        .grid-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background-image: radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 40px 40px;
          z-index: 1;
        }

        .about-main {
          max-width: 1100px;
          margin: 0 auto;
          padding: 40px 20px;
          position: relative;
          z-index: 2;
        }

        /* NAV */
        .top-nav {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 100px;
        }
        .logo { font-size: 1.8rem; font-weight: 900; text-decoration: none; color: white; letter-spacing: -1px; }
        .logo span { color: #6366f1; }
        .back-link {
          background: rgba(255,255,255,0.05);
          padding: 10px 20px;
          border-radius: 50px;
          color: #94a3b8;
          text-decoration: none;
          font-weight: 700;
          font-size: 0.9rem;
          transition: 0.3s;
          border: 1px solid rgba(255,255,255,0.05);
        }
        .back-link:hover { background: #6366f1; color: white; transform: translateX(-5px); }

        /* HERO SECTION */
        .hero-section {
          text-align: center;
          max-width: 800px;
          margin: 0 auto 100px;
        }
        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(99, 102, 241, 0.1);
          color: #818cf8;
          padding: 6px 16px;
          border-radius: 50px;
          font-size: 0.75rem;
          font-weight: 800;
          margin-bottom: 25px;
          border: 1px solid rgba(99, 102, 241, 0.2);
          letter-spacing: 1px;
        }
        .status-badge span { font-size: 1rem; line-height: 0; color: #a5b4fc; }
        .hero-section h1 { 
          font-size: 4.5rem; 
          font-weight: 900; 
          margin-bottom: 25px; 
          line-height: 1.1; 
          letter-spacing: -2px; 
        }
        .hero-section h1 span { 
          background: linear-gradient(to right, #6366f1, #a855f7, #ec4899); 
          -webkit-background-clip: text; 
          -webkit-text-fill-color: transparent; 
        }
        .hero-subtitle { 
          color: #94a3b8; 
          font-size: 1.3rem; 
          line-height: 1.7; 
        }

        /* VALUES GRID */
        .values-grid { 
          display: grid; 
          grid-template-columns: repeat(3, 1fr); 
          gap: 30px; 
          margin-bottom: 100px; 
        }
        .value-box { 
          background: rgba(255,255,255,0.02); 
          border: 1px solid rgba(255,255,255,0.05); 
          padding: 40px 30px; 
          border-radius: 30px; 
          text-align: left; 
          transition: 0.4s; 
          position: relative;
          overflow: hidden;
        }
        .value-box:hover { 
          background: rgba(255,255,255,0.04); 
          transform: translateY(-10px); 
          border-color: rgba(99, 102, 241, 0.4); 
          box-shadow: 0 20px 40px rgba(0,0,0,0.4);
        }
        .value-icon {
          font-size: 2.5rem;
          margin-bottom: 20px;
          background: rgba(255,255,255,0.05);
          width: 70px;
          height: 70px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 20px;
          border: 1px solid rgba(255,255,255,0.1);
        }
        .value-box h3 { 
          font-size: 1.5rem; 
          font-weight: 800; 
          margin-bottom: 15px; 
          color: white; 
        }
        .value-box p { 
          color: #94a3b8; 
          font-size: 1rem; 
          line-height: 1.6; 
        }

        .divider { 
          height: 1px; 
          background: linear-gradient(to right, transparent, rgba(255,255,255,0.1), transparent); 
          margin-bottom: 100px; 
        }

        /* FOUNDER SECTION */
        .founder-section {
          margin-bottom: 100px;
        }
        .founder-card {
          background: linear-gradient(145deg, rgba(30, 41, 59, 0.4), rgba(15, 23, 42, 0.6));
          border: 1px solid rgba(99, 102, 241, 0.2);
          border-radius: 40px;
          padding: 60px;
          position: relative;
          overflow: hidden;
          box-shadow: 0 30px 60px rgba(0,0,0,0.5);
        }
        .founder-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; height: 4px;
          background: linear-gradient(to right, #6366f1, #ec4899);
        }
        .founder-header {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-bottom: 30px;
        }
        .founder-header h2 {
          font-size: 2rem;
          font-weight: 900;
          color: white;
          margin: 0;
        }
        .badge-indie {
          background: rgba(236, 72, 153, 0.15);
          color: #f472b6;
          padding: 6px 14px;
          border-radius: 50px;
          font-size: 0.8rem;
          font-weight: 800;
          border: 1px solid rgba(236, 72, 153, 0.3);
        }
        
        .founder-content {
          max-width: 800px;
        }
        .highlight-text {
          font-size: 1.4rem;
          font-weight: 500;
          color: #e2e8f0;
          line-height: 1.6;
          margin-bottom: 25px;
        }
        .highlight-name {
          font-weight: 800;
          color: #a5b4fc;
          background: rgba(99, 102, 241, 0.15);
          padding: 2px 10px;
          border-radius: 8px;
        }
        .sub-text {
          color: #94a3b8;
          font-size: 1.1rem;
          line-height: 1.8;
          margin-bottom: 40px;
        }
        .sub-text strong {
          color: #cbd5e1;
        }

        .contact-box {
          background: rgba(0,0,0,0.3);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 24px;
          padding: 30px;
          display: flex;
          align-items: center;
          gap: 25px;
          transition: 0.3s;
        }
        .contact-box:hover {
          border-color: rgba(99, 102, 241, 0.3);
          background: rgba(15, 23, 42, 0.8);
        }
        .contact-icon {
          font-size: 2.5rem;
          background: rgba(255,255,255,0.05);
          width: 70px; height: 70px;
          display: flex; align-items: center; justify-content: center;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .contact-label {
          color: #94a3b8;
          font-size: 0.95rem;
          margin: 0 0 10px 0;
          line-height: 1.5;
        }
        .contact-email {
          color: #818cf8;
          font-size: 1.3rem;
          font-weight: 800;
          text-decoration: none;
          transition: 0.3s;
          display: inline-block;
        }
        .contact-email:hover {
          color: #a5b4fc;
          transform: translateX(5px);
        }

        /* FOOTER */
        .about-footer { 
          text-align: center; 
          padding: 60px 0; 
          color: #475569; 
          font-size: 0.9rem; 
          border-top: 1px solid rgba(255,255,255,0.05); 
        }
        .footer-links { 
          display: flex; 
          justify-content: center; 
          gap: 30px; 
          margin-top: 15px; 
        }
        .footer-links a { 
          color: #64748b; 
          text-decoration: none; 
          transition: 0.3s; 
        }
        .footer-links a:hover { color: #6366f1; }

        @media (max-width: 900px) {
          .hero-section h1 { font-size: 3.5rem; }
          .values-grid { grid-template-columns: 1fr; }
          .founder-card { padding: 40px 20px; }
          .founder-header { flex-direction: column; align-items: flex-start; gap: 10px; }
          .contact-box { flex-direction: column; text-align: center; }
          .contact-email:hover { transform: translateY(-3px); }
        }
      `}</style>
    </div>
  );
}
