import Head from "next/head";
import Link from "next/link";
import { useState } from "react";
import axios from "axios";

export default function Contact() {
  const [status, setStatus] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("sending");
    
    const formData = new FormData(e.target);
    const data = {
      name: formData.get("name"),
      email: formData.get("email"),
      subject: formData.get("subject"),
      message: formData.get("message")
    };

    try {
      const res = await axios.post("https://meetzone-backend.onrender.com/api/contact", data);
      if (res.data.success) {
        setStatus("success");
        e.target.reset();
        setTimeout(() => setStatus(""), 5000);
      } else {
        setStatus("");
        alert("Failed to send message.");
      }
    } catch (err) {
      setStatus("");
      alert("Error sending message.");
    }
  };

  return (
    <div className="contact-premium-v2">
      <Head>
        <title>Support Center | ZoneMeet AI</title>
      </Head>

      {/* DYNAMIC BACKGROUND */}
      <div className="gradient-sphere pos-1" />
      <div className="gradient-sphere pos-2" />
      <div className="grid-overlay" />

      <div className="contact-main">
        {/* TOP NAV */}
        <nav className="top-nav">
          <Link href="/" className="logo">Zone<span>Meet</span></Link>
          <Link href="/" className="back-link">
            <span>←</span> Back to Dashboard
          </Link>
        </nav>

        {/* HERO SECTION WITH 3D IMAGE */}
        <section className="hero-split">
          <div className="hero-text">
            <div className="status-badge"><span>●</span> WE ARE ONLINE</div>
            <h1>Human support, <span>AI speed.</span></h1>
            <p>
              Got a glitch? Or just want to talk about your experience? 
              Our global team is distributed across 3 continents to ensure you're never left waiting.
            </p>
            <div className="hero-btns">
              <a href="#message-form" className="btn-primary">Write a Message</a>
              <a href="mailto:support@zonemeet.chat" className="btn-outline">Quick Email</a>
            </div>
          </div>
          <div className="hero-visual">
            <div className="visual-wrapper">
              <img src="/support-3d.png" alt="Support Team" className="main-3d-img" />
              <div className="floating-card c1">🚀 2hr Avg Response</div>
              <div className="floating-card c2">🛡️ Secured Channel</div>
            </div>
          </div>
        </section>

        {/* STATS SECTION */}
        <section className="stats-grid">
          <div className="stat-box">
            <h3>100%</h3>
            <p>Uptime Guaranteed</p>
          </div>
          <div className="stat-box">
            <h3>50k+</h3>
            <p>Tickets Resolved</p>
          </div>
          <div className="stat-box">
            <h3>24/7</h3>
            <p>Active Monitoring</p>
          </div>
          <div className="stat-box">
            <h3>190+</h3>
            <p>Countries Supported</p>
          </div>
        </section>

        <div className="divider" />

        {/* MAIN INTERACTION ZONE */}
        <section id="message-form" className="interaction-grid">
          <div className="form-column">
            <div className="form-header">
              <h2>Send a direct message</h2>
              <p>Please provide as much detail as possible so we can help you faster.</p>
            </div>
            
            <form className="modern-form" onSubmit={handleSubmit}>
              <div className="input-row">
                <div className="input-group">
                  <label>Full Name</label>
                  <input name="name" type="text" placeholder="e.g. Rahul Singh" required />
                </div>
                <div className="input-group">
                  <label>Email Address</label>
                  <input name="email" type="email" placeholder="rahul@example.com" required />
                </div>
              </div>

              <div className="input-group">
                <label>Issue Category</label>
                <div className="select-wrapper">
                  <select name="subject" required>
                    <option value="" disabled selected>What can we help with?</option>
                    <option value="billing">Coins & Billing Issues</option>
                    <option value="tech">Technical Glitches</option>
                    <option value="safety">User Safety & Reports</option>
                    <option value="feature">Feature Suggestions</option>
                  </select>
                </div>
              </div>

              <div className="input-group">
                <label>Your Message</label>
                <textarea name="message" rows="6" placeholder="Explain your query in detail..." required></textarea>
              </div>

              <button type="submit" className={`glow-submit ${status}`} disabled={status === "sending"}>
                {status === "sending" ? (
                  <div className="spinner-mini"></div>
                ) : status === "success" ? (
                  "Ticket Created! ✓"
                ) : (
                  "Submit Ticket"
                )}
              </button>
            </form>
          </div>

          <div className="faq-column">
            <h2>Common Questions</h2>
            <div className="faq-list">
              <div className="faq-item">
                <h4>How do I get my coins?</h4>
                <p>Coins are added instantly after payment. If not, please include your transaction ID in the form.</p>
              </div>
              <div className="faq-item">
                <h4>Is my data safe?</h4>
                <p>Absolutely. We use end-to-end encryption for all video calls and never store your private data.</p>
              </div>
              <div className="faq-item">
                <h4>How to cancel VIP?</h4>
                <p>You can cancel anytime from your profile settings. No hidden fees or commitments.</p>
              </div>
            </div>

            <div className="sidebar-contact-card">
              <div className="icon-circ">✉️</div>
              <div>
                <h5>Official Support</h5>
                <p>support@zonemeet.chat</p>
              </div>
            </div>
          </div>
        </section>

        <footer className="contact-footer">
          <p>&copy; 2026 ZoneMeet AI. All rights reserved.</p>
          <div className="footer-links">
            <Link href="/terms">Terms</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/refund">Refunds</Link>
          </div>
        </footer>
      </div>

      <style jsx>{`
        .contact-premium-v2 {
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
          opacity: 0.15;
          pointer-events: none;
        }
        .pos-1 { top: -20%; right: -10%; background: #6366f1; }
        .pos-2 { bottom: -10%; left: -10%; background: #ec4899; }
        .grid-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background-image: radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 40px 40px;
          z-index: 1;
        }

        .contact-main {
          max-width: 1300px;
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
          margin-bottom: 80px;
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

        /* HERO SPLIT */
        .hero-split {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 60px;
          align-items: center;
          margin-bottom: 100px;
        }
        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;
          padding: 6px 14px;
          border-radius: 50px;
          font-size: 0.7rem;
          font-weight: 800;
          margin-bottom: 25px;
          border: 1px solid rgba(16, 185, 129, 0.2);
        }
        .status-badge span { font-size: 1rem; line-height: 0; }
        .hero-text h1 { font-size: 4.5rem; font-weight: 900; margin-bottom: 25px; line-height: 1.1; letter-spacing: -3px; }
        .hero-text h1 span { background: linear-gradient(to right, #6366f1, #ec4899); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .hero-text p { color: #94a3b8; font-size: 1.3rem; line-height: 1.6; margin-bottom: 40px; }
        .hero-btns { display: flex; gap: 20px; }
        .btn-primary { background: #6366f1; color: white; padding: 18px 35px; border-radius: 15px; font-weight: 800; text-decoration: none; transition: 0.3s; box-shadow: 0 10px 30px rgba(99, 102, 241, 0.3); }
        .btn-primary:hover { transform: translateY(-3px); box-shadow: 0 20px 40px rgba(99, 102, 241, 0.4); }
        .btn-outline { border: 1px solid rgba(255,255,255,0.1); color: white; padding: 18px 35px; border-radius: 15px; font-weight: 800; text-decoration: none; transition: 0.3s; }
        .btn-outline:hover { background: rgba(255,255,255,0.05); }

        .hero-visual { position: relative; }
        .visual-wrapper { position: relative; width: 100%; border-radius: 40px; overflow: hidden; }
        .main-3d-img { width: 100%; border-radius: 40px; transform: scale(1.05); transition: 0.5s; }
        .visual-wrapper:hover .main-3d-img { transform: scale(1.1); }
        .floating-card {
          position: absolute;
          background: rgba(15, 23, 42, 0.8);
          backdrop-filter: blur(10px);
          padding: 15px 20px;
          border-radius: 20px;
          font-weight: 700;
          font-size: 0.9rem;
          border: 1px solid rgba(255,255,255,0.1);
          animation: float 4s ease-in-out infinite;
        }
        .c1 { top: 20%; right: -20px; }
        .c2 { bottom: 20%; left: -20px; animation-delay: 2s; }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-20px); } }

        /* STATS */
        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 30px; margin-bottom: 100px; }
        .stat-box { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); padding: 40px; border-radius: 30px; text-align: center; transition: 0.3s; }
        .stat-box:hover { background: rgba(255,255,255,0.04); transform: translateY(-10px); border-color: #6366f1; }
        .stat-box h3 { font-size: 2.5rem; font-weight: 900; margin-bottom: 10px; background: linear-gradient(to bottom, #fff, #94a3b8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .stat-box p { color: #64748b; font-weight: 700; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 1px; }

        .divider { height: 1px; background: linear-gradient(to right, transparent, rgba(255,255,255,0.1), transparent); margin-bottom: 100px; }

        /* INTERACTION GRID */
        .interaction-grid { display: grid; grid-template-columns: 2fr 1.2fr; gap: 60px; margin-bottom: 100px; }
        .form-header h2 { font-size: 2.5rem; font-weight: 800; margin-bottom: 15px; }
        .form-header p { color: #64748b; font-size: 1.1rem; margin-bottom: 40px; }

        .modern-form { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); padding: 50px; border-radius: 40px; box-shadow: 0 40px 100px rgba(0,0,0,0.5); }
        .input-row { display: grid; grid-template-columns: 1fr 1fr; gap: 25px; margin-bottom: 30px; }
        .input-group label { display: block; font-size: 0.8rem; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 12px; letter-spacing: 1px; }
        .input-group input, .input-group select, .input-group textarea {
          width: 100%; background: #000; border: 1px solid rgba(255,255,255,0.1); padding: 16px 22px; border-radius: 18px; color: white; font-size: 1rem; transition: 0.3s;
        }
        .input-group input:focus, .input-group select:focus, .input-group textarea:focus { outline: none; border-color: #6366f1; box-shadow: 0 0 20px rgba(99, 102, 241, 0.1); }
        .glow-submit {
          width: 100%; background: linear-gradient(135deg, #6366f1, #ec4899); color: white; border: none; padding: 20px; border-radius: 20px; font-weight: 900; font-size: 1.1rem; cursor: pointer; transition: 0.3s; margin-top: 20px;
        }
        .glow-submit:hover { transform: scale(1.02); box-shadow: 0 15px 40px rgba(99, 102, 241, 0.3); }
        .glow-submit.success { background: #10b981; }

        /* FAQ */
        .faq-column h2 { font-size: 2rem; font-weight: 800; margin-bottom: 30px; }
        .faq-list { display: flex; flex-direction: column; gap: 25px; margin-bottom: 40px; }
        .faq-item { background: rgba(255,255,255,0.02); border-left: 4px solid #6366f1; padding: 25px; border-radius: 0 20px 20px 0; }
        .faq-item h4 { font-size: 1.1rem; margin-bottom: 10px; color: white; }
        .faq-item p { color: #64748b; font-size: 0.95rem; line-height: 1.5; }

        .sidebar-contact-card {
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(236, 72, 153, 0.1));
          border: 1px solid rgba(255,255,255,0.1);
          padding: 30px;
          border-radius: 30px;
          display: flex;
          align-items: center;
          gap: 20px;
        }
        .icon-circ { width: 50px; height: 50px; background: rgba(255,255,255,0.05); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; }
        .sidebar-contact-card h5 { margin: 0; font-size: 0.9rem; color: #94a3b8; }
        .sidebar-contact-card p { margin: 5px 0 0 0; font-weight: 800; color: #6366f1; }

        .contact-footer { text-align: center; padding: 60px 0; color: #475569; font-size: 0.9rem; border-top: 1px solid rgba(255,255,255,0.05); }
        .footer-links { display: flex; justify-content: center; gap: 30px; margin-top: 15px; }
        .footer-links a { color: #64748b; text-decoration: none; transition: 0.3s; }
        .footer-links a:hover { color: #6366f1; }

        .spinner-mini { width: 22px; height: 22px; border: 3px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto; }
        @keyframes spin { to { transform: rotate(360deg); } }

        @media (max-width: 1100px) {
          .hero-split { grid-template-columns: 1fr; text-align: center; }
          .hero-btns { justify-content: center; }
          .hero-text h1 { font-size: 3.5rem; }
          .stats-grid { grid-template-columns: 1fr 1fr; }
          .interaction-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
