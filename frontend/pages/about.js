import Head from "next/head";
import Link from "next/link";

export default function About() {
  return (
    <div className="about-premium">
      <Head>
        <title>About ZoneMeet | Premium Experience</title>
        <meta name="description" content="Learn about ZoneMeet, the indie‑built platform by Davinder Singh, with a focus on privacy, community, and responsible 18+ usage." />
      </Head>

      {/* BACKGROUND */}
      <div className="gradient-sphere pos-1" />
      <div className="gradient-sphere pos-2" />
      <div className="grid-overlay" />

      <main className="about-main">
        {/* HERO */}
        <section className="hero-section">
          <h1 className="hero-title">About ZoneMeet</h1>
          <p className="hero-sub">
            Independently developed and managed by <strong>Davinder Singh</strong>. We bring you a secure, immersive video‑chat experience powered by AI.
          </p>
        </section>

        {/* AGE RESTRICTION NOTICE */}
        <section className="age-restriction">
          <div className="age-banner">
            <span role="img" aria-label="18+">🔞</span> This service is <strong>restricted to users 18 years of age or older</strong>.
            <br />
            By continuing you confirm you meet this age requirement. Content may include mature themes.
          </div>
        </section>

        {/* MISSION & VALUES */}
        <section className="mission">
          <h2 className="section-heading">Our Mission</h2>
          <p>
            To connect people worldwide through seamless, high‑quality video chats while respecting privacy. All data is end‑to‑end encrypted and never stored without consent.
          </p>
          <ul className="values-list">
            <li>🌊 <strong>Water‑Clear Transparency</strong> – clear policies, open source where possible.</li>
            <li>🔒 <strong>Security First</strong> – AI‑guardian moderation, 18+ compliance.</li>
            <li>🚀 <strong>Performance</strong> – low‑latency streaming, global servers.</li>
          </ul>
        </section>

        {/* CONTACT */}
        <section className="contact-section">
          <h2 className="section-heading">Get In Touch</h2>
          <p>
            For support, partnerships, business inquiries, or any important concerns, please contact:
            <br />
            <a href="mailto:support@zonemeet.chat" className="contact-link">support@zonemeet.chat</a>
          </p>
        </section>
      </main>

      {/* STYLES */}
      <style jsx>{`
        .about-premium {
          background: #000;
          min-height: 100vh;
          color: #fff;
          font-family: 'Inter', sans-serif;
          position: relative;
          overflow-x: hidden;
        }
        .gradient-sphere {
          position: fixed;
          width: 800px;
          height: 800px;
          border-radius: 50%;
          filter: blur(150px);
          z-index: 0;
          opacity: 0.15;
        }
        .pos-1 { top: -20%; right: -10%; background: #6366f1; }
        .pos-2 { bottom: -10%; left: -10%; background: #ec4899; }
        .grid-overlay {
          position: fixed;
          top:0; left:0; right:0; bottom:0;
          background-image: radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 40px 40px;
          z-index:1;
        }
        .about-main {
          max-width: 1200px;
          margin: 0 auto;
          padding: 80px 20px;
          position: relative;
          z-index:2;
        }
        .hero-section { text-align:center; margin-bottom:60px; }
        .hero-title { font-size:3.5rem; background: linear-gradient(135deg,#6366f1,#ec4899); -webkit-background-clip:text; -webkit-text-fill-color:transparent; font-weight:900; }
        .hero-sub { font-size:1.2rem; color:#94a3b8; margin-top:20px; }
        .age-restriction { background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.3); border-radius:12px; padding:20px; text-align:center; margin:40px auto; max-width:800px; }
        .age-banner { color:#f87171; font-weight:800; font-size:1rem; }
        .mission, .contact-section { margin-top:50px; }
        .section-heading { font-size:2rem; margin-bottom:15px; color:#fff; }
        .values-list { list-style:none; padding:0; }
        .values-list li { margin:8px 0; color:#94a3b8; }
        .contact-link { color:#a5b4fc; font-weight:700; text-decoration:none; }
        .contact-link:hover { text-decoration:underline; }
      `}</style>
    </div>
  );
}
