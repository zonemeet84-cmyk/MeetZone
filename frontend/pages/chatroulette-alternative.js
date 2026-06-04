import Head from "next/head";
import Link from "next/link";

export default function ChatrouletteAlternative() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "Is ZoneMeet really a free Chatroulette alternative?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, ZoneMeet is 100% free to use. Unlike other platforms that lock gender filters and direct messages behind premium subscriptions or coin packages, ZoneMeet lets you connect, match, and talk with strangers without hidden fees or hourly limits."
        }
      },
      {
        "@type": "Question",
        "name": "Do I need to register to start a random video chat?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "We support guest access for quick testing, but we highly recommend a quick Google or email login to access advanced features like regional matchmaking and our Friend Circle list. This verification is crucial in keeping our chat network completely bot-free."
        }
      },
      {
        "@type": "Question",
        "name": "How does ZoneMeet prevent spambots and fake feeds?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "We implement strict security checks, including secure third-party login requirements and real-time AI computer vision scanning. Our AI scanner detects and instantly terminates pre-recorded streams, commercial advertisements, and static image loops to ensure you only meet real, active people."
        }
      },
      {
        "@type": "Question",
        "name": "Is my video call private and secure?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Absolutely. ZoneMeet utilizes standard WebRTC peer-to-peer protocols. This means your video and audio feeds are encrypted and sent directly between you and your matching partner. We do not route or store your personal streams on central servers, protecting your digital privacy."
        }
      },
      {
        "@type": "Question",
        "name": "Can I use ZoneMeet on my mobile phone?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, ZoneMeet is built using a mobile-first responsive design. It works perfectly in default mobile browsers (Safari, Chrome, Firefox) on both iOS and Android. No app store downloads or installations are required, preserving your battery and storage."
        }
      }
    ]
  };

  return (
    <div className="landing-wrap">
      <Head>
        <title>Best Chatroulette Alternative: Free Stranger Video Chat | ZoneMeet</title>
        <meta
          name="description"
          content="Discover the best Chatroulette alternative for free random video chat. Connect instantly with verified strangers worldwide on a secure, bot-free, and mobile-friendly platform."
        />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
        />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://zonemeet.chat/chatroulette-alternative" />
        
        {/* Open Graph Tags */}
        <meta property="og:title" content="Best Chatroulette Alternative: Free Stranger Video Chat | ZoneMeet" />
        <meta
          property="og:description"
          content="Looking for a modern, secure, and free Chatroulette alternative? Match instantly with real people globally on ZoneMeet. 100% free random video chat."
        />
        <meta property="og:url" content="https://zonemeet.chat/chatroulette-alternative" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://zonemeet.chat/global-friends.webp" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Best Chatroulette Alternative: Free Stranger Video Chat | ZoneMeet" />
        <meta name="twitter:description" content="Connect instantly with verified strangers worldwide on a secure, bot-free platform." />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      </Head>

      {/* DYNAMIC SPHERES */}
      <div className="sphere s1" />
      <div className="sphere s2" />
      <div className="sphere s3" />
      <div className="grid-overlay" />

      <div className="landing-inner">
        {/* NAV */}
        <nav className="top-nav">
          <Link href="/" className="logo">
            Zone<span>Meet</span>
          </Link>
          <Link href="/" className="back-btn">
            ← Live Video Chat
          </Link>
        </nav>

        {/* DISCLAIMER */}
        <div className="disclaimer-box">
          <p>
            <strong>Trademark Disclaimer:</strong> ZoneMeet is an independent live video chat platform. Chatroulette™ is a registered trademark of its respective owner. 
            References to Chatroulette on this page are made strictly for informational, comparison, and search engine optimization purposes. ZoneMeet has no affiliation, 
            sponsorship, or partnership with Chatroulette, its parent company, or its brand.
          </p>
        </div>

        {/* HERO */}
        <section className="hero">
          <div className="badge">🛡️ INDEPENDENT &amp; 100% FREE</div>
          <h1>
            Best Chatroulette Alternative<br />
            <span>for Random Video Chat.</span>
          </h1>
          <p className="hero-sub">
            Say goodbye to premium paywalls, endless spambots, and boring loops. ZoneMeet is the ultimate 
            <strong> best Chatroulette alternative</strong> designed for the next generation of social discovery. 
            Connect instantly in high definition, experience lightning-fast peer-to-peer matches, and enjoy 
            <strong> free video chat</strong> with real, verified people all around the globe.
          </p>
          <div className="hero-btns">
            <Link href="/" className="btn-primary">
              Start Free Video Chat Now
            </Link>
          </div>
        </section>

        {/* FEATURES ROW */}
        <section className="features-grid">
          <div className="feat-card">
            <div className="feat-icon">⚡</div>
            <h3>Instant P2P Matches</h3>
            <p>Experience zero-latency video streams powered by advanced WebRTC protocols. No central routing means faster matches and direct encrypted paths.</p>
          </div>
          <div className="feat-card">
            <div className="feat-icon">🤖</div>
            <h3>AI Bot Prevention</h3>
            <p>Our real-time computer vision engines block fake feeds, pre-recorded loops, and advertising scripts so you only talk to real, active users.</p>
          </div>
          <div className="feat-card">
            <div className="feat-icon">🌍</div>
            <h3>Global Connections</h3>
            <p>Cross geographic boundaries and meet fascinating people from over 190 countries. Filter by region and language to find your ideal match.</p>
          </div>
        </section>

        <div className="divider" />

        {/* SECTION 1: THE HISTORY OF CHATROULETTE AND REASONS TO SWITCH */}
        <section className="content-section">
          <h2>Why Users Switch to a Modern Chatroulette Alternative</h2>
          <p>
            When Chatroulette launched in late 2009, it took the internet by storm. Developed by a Russian high school student, the simple concept of connecting random webcam users with a single click became an overnight global sensation. It was a revolutionary way to talk to strangers, introducing millions to the excitement of spontaneous face-to-face conversations.
          </p>
          <p>
            However, as the years progressed, the original magic began to fade. The lack of proactive moderation, combined with growing commercialization, allowed the network to become overrun by inappropriate content, advertising spambots, and pre-recorded video loops. Casual chatters spent more time clicking "Next" to avoid scam links and blank screens than actually having conversations.
          </p>
          <p>
            Furthermore, the introduction of restrictive credit systems and micro-transactions left users frustrated. Spontaneous social interactions should not feel transactional, nor should they require entering credit card details to keep talking. This combination of security issues and payment barriers has driven a massive wave of users to seek a secure, modern <strong>best Chatroulette alternative</strong> that restores the original joy of random matches without compromising safety or accessibility.
          </p>
          <p>
            ZoneMeet was built to address these legacy problems. We believe that meeting new people online should be free, safe, and easily accessible. By combining cutting-edge WebRTC technology with automated moderation systems, ZoneMeet delivers a premium, browser-native <strong>random video chat</strong> experience that keeps you safe while connecting you with interesting individuals worldwide.
          </p>
        </section>

        {/* SECTION 2: HOW ZONEMEET REDEFINES RANDOM VIDEO CHAT */}
        <section className="content-section">
          <h2>A Free Video Chat Experience Built Around You</h2>
          <p>
            Unlike legacy platforms that have struggled to adapt to modern web standards, ZoneMeet was engineered from the ground up to offer a seamless, high-speed experience on all devices. Here is how we deliver the ultimate <strong>stranger video chat</strong> platform:
          </p>

          <div className="sub-grid">
            <div className="sub-card">
              <h3>1. 100% Free - No Paywalls or Credits</h3>
              <p>
                Spontaneous conversations shouldn't be cut short by a credit balance reminder. ZoneMeet offers completely free matches. You can chat for as long as you want, swap partners when you choose, and text message your matches without paying a single penny.
              </p>
            </div>
            <div className="sub-card">
              <h3>2. Real-Time AI Guardian Moderation</h3>
              <p>
                Your safety is our absolute priority. We use real-time computer vision scanners to analyze active video feeds. This system instantly flags and filters inappropriate content, commercial advertising, and pre-recorded spam feeds, creating a clean, respectful digital environment.
              </p>
            </div>
            <div className="sub-card">
              <h3>3. Dynamic Interest Tags</h3>
              <p>
                Want to talk about gaming, music, coding, or travel? Enter your favorite topics into our interest matching engine. ZoneMeet will prioritize pairing you with strangers who share your passions, making it easier to break the ice and start meaningful conversations.
              </p>
            </div>
            <div className="sub-card">
              <h3>4. Friend Circle Messaging</h3>
              <p>
                Made a great connection? On traditional video chat websites, skipping a partner meant losing them forever. With ZoneMeet's Friend Circle, you can add matching partners to your secure contacts list and send them texts or initiate direct video calls whenever you are both online.
              </p>
            </div>
          </div>
        </section>

        <div className="divider" />

        {/* SECTION 3: COMPARISON TABLE */}
        <section className="compare-section">
          <div className="section-header">
            <h2>ZoneMeet vs. Chatroulette: Side-by-Side Comparison</h2>
            <p>See how our independent, next-generation platform compares to the original video matching site.</p>
          </div>
          <div className="table-wrapper">
            <table className="compare-table">
              <thead>
                <tr>
                  <th>Feature / Benefit</th>
                  <th>ZoneMeet (Independent)</th>
                  <th>Chatroulette</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Pricing Model</strong></td>
                  <td className="highlight-yes">100% Free Matching & Features</td>
                  <td className="highlight-no">Premium coins or hidden limits</td>
                </tr>
                <tr>
                  <td><strong>Moderation</strong></td>
                  <td className="highlight-yes">Real-Time AI Scanning + Live Reports</td>
                  <td>Basic user flags & delay-prone reviews</td>
                </tr>
                <tr>
                  <td><strong>Spam & Bot Protection</strong></td>
                  <td className="highlight-yes">Strict account verification & AI filters</td>
                  <td className="highlight-no">High bot traffic and fake feeds</td>
                </tr>
                <tr>
                  <td><strong>Friend Connections</strong></td>
                  <td className="highlight-yes">Add friends & text/video chat later</td>
                  <td className="highlight-no">None (Lost instantly on disconnect)</td>
                </tr>
                <tr>
                  <td><strong>Mobile Performance</strong></td>
                  <td className="highlight-yes">Fast, responsive, browser-native web app</td>
                  <td>Laggy or requires separate mobile client</td>
                </tr>
                <tr>
                  <td><strong>Interest Tags Matching</strong></td>
                  <td className="highlight-yes">Yes (Filter by shared interests & tags)</td>
                  <td>Basic tag options or random only</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <div className="divider" />

        {/* SECTION 4: SAFETY AND SECURITY AT THE CORE */}
        <section className="content-section">
          <h2>Safety, Security &amp; End-to-End Call Encryption</h2>
          <p>
            In the early days of the internet, privacy was often overlooked in favor of convenience. However, in 2026, protecting your digital identity is non-negotiable. To ensure your <strong>online video chat</strong> calls remain completely private, ZoneMeet utilizes advanced WebRTC technology.
          </p>
          <p>
            By establishing direct peer-to-peer (P2P) connections, your video and audio feeds are sent straight to your matching partner's device without being routed through or stored on our servers. This design not only guarantees crystal-clear HD video and minimal latency, but it also makes it virtually impossible for unauthorized third parties to intercept your conversations.
          </p>
          <p>
            Additionally, our secure login protocol acts as a shield against the malicious automated networks that plague legacy sites. While we respect user anonymity, requiring a secure sign-in (such as Google authentication) ensures that every user on the system has a valid account, making it simple to ban bad actors and keep the community positive.
          </p>
          <p>
            We also maintain a dedicated <Link href="/safety" className="blog-link">Safety Guidelines Portal</Link> and detailed <Link href="/guidelines" className="blog-link">Community Standards</Link>. If a matching user acts inappropriately, you can use our instant report button. Our moderation team reviews reports in real-time, enforcing permanent, IP-level bans for any terms-of-service violations.
          </p>
        </section>

        {/* SECTION 5: MOBILE-FIRST RESPONSIVE DESIGN */}
        <section className="content-section">
          <h2>Seamless Mobile Experience: Chat on the Go</h2>
          <p>
            Our statistics show that over 65% of random video chatters access platforms from their mobile phones. Despite this, many legacy random cam networks are still designed primarily for desktop screens, leading to misaligned buttons, cropped video feeds, and high battery consumption on mobile devices.
          </p>
          <p>
            ZoneMeet is built with a mobile-first philosophy. We designed the interface to scale dynamically to any device size, from small smartphone screens to large tablet layouts. The video frames, control panels, and text inputs resize automatically to ensure you always have a comfortable, intuitive layout.
          </p>
          <p>
            Moreover, because ZoneMeet is a browser-based web app, you do not have to download and update bulky files from the App Store or Google Play Store. Simply open your favorite browser, visit ZoneMeet, and start matching. This saves your phone's memory and prevents background processes from draining your battery.
          </p>
        </section>

        {/* SECTION 6: HOW TO START */}
        <section className="steps-section">
          <div className="section-header">
            <h2>Three Steps to Meet Strangers Online</h2>
            <p>Connect with real video feeds in under 30 seconds.</p>
          </div>
          <div className="steps-container">
            <div className="step">
              <span className="num">1</span>
              <h4>Secure Account Sign-In</h4>
              <p>Quickly authorize via secure Google or email sign-in. This takes one click and prevents bot accounts from flooding the matching pool.</p>
            </div>
            <div className="step-arrow">→</div>
            <div className="step">
              <span className="num">2</span>
              <h4>Enable Device Access</h4>
              <p>Allow browser permissions for your camera and microphone. We only request this when you click start, and your streams are kept private.</p>
            </div>
            <div className="step-arrow">→</div>
            <div className="step">
              <span className="num">3</span>
              <h4>Click "Start Matching"</h4>
              <p>Instantly match with verified conversationalists. Skip when you want to meet someone new, or click add friend to save your connection.</p>
            </div>
          </div>
        </section>

        <div className="divider" />

        {/* SECTION 7: FAQ SECTION */}
        <section className="faq-section">
          <div className="section-header">
            <h2>Frequently Asked Questions</h2>
            <p>Everything you need to know about using ZoneMeet as your go-to Chatroulette alternative.</p>
          </div>
          <div className="faq-list">
            <div className="faq-item">
              <h3>Is ZoneMeet really a free Chatroulette alternative?</h3>
              <p>Yes, ZoneMeet is 100% free to use. Unlike other platforms that lock gender filters and direct messages behind premium subscriptions or coin packages, ZoneMeet lets you connect, match, and talk with strangers without hidden fees or hourly limits.</p>
            </div>
            <div className="faq-item">
              <h3>Do I need to register to start a random video chat?</h3>
              <p>We support guest access for quick testing, but we highly recommend a quick Google or email login to access advanced features like regional matchmaking and our Friend Circle list. This verification is crucial in keeping our chat network completely bot-free.</p>
            </div>
            <div className="faq-item">
              <h3>How does ZoneMeet prevent spambots and fake feeds?</h3>
              <p>We implement strict security checks, including secure third-party login requirements and real-time AI computer vision scanning. Our AI scanner detects and instantly terminates pre-recorded streams, commercial advertisements, and static image loops to ensure you only meet real, active people.</p>
            </div>
            <div className="faq-item">
              <h3>Is my video call private and secure?</h3>
              <p>Absolutely. ZoneMeet utilizes standard WebRTC peer-to-peer protocols. This means your video and audio feeds are encrypted and sent directly between you and your matching partner. We do not route or store your personal streams on central servers, protecting your digital privacy.</p>
            </div>
            <div className="faq-item">
              <h3>Can I use ZoneMeet on my mobile phone?</h3>
              <p>Yes, ZoneMeet is built using a mobile-first responsive design. It works perfectly in default mobile browsers (Safari, Chrome, Firefox) on both iOS and Android. No app store downloads or installations are required, preserving your battery and storage.</p>
            </div>
          </div>
        </section>

        {/* BOTTOM CTA */}
        <section className="cta-bottom">
          <h2>Join the Best Chatroulette Alternative Today</h2>
          <p>Instantly match with thousands of active chatters. Experience secure, real-time, and free random video matching on ZoneMeet.</p>
          <Link href="/" className="btn-primary btn-lg">
            Start Live Video Chat
          </Link>
        </section>

        {/* FOOTER */}
        <footer className="footer">
          <p>© 2026 ZoneMeet AI. All rights reserved. | Developed by Davinder Singh.</p>
          <div className="footer-links">
            <Link href="/">Home</Link>
            <Link href="/contact">Contact</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/refund">Refunds</Link>
          </div>
        </footer>
      </div>

      <style jsx>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .landing-wrap {
          background: #000;
          min-height: 100vh;
          color: white;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          position: relative;
          overflow-x: hidden;
        }

        /* DYNAMIC BG */
        .sphere {
          position: fixed;
          border-radius: 50%;
          filter: blur(130px);
          z-index: 0;
          pointer-events: none;
        }
        .s1 { width: 700px; height: 700px; top: -15%; right: -10%; background: #6366f1; opacity: 0.12; }
        .s2 { width: 600px; height: 600px; bottom: -10%; left: -10%; background: #ec4899; opacity: 0.1; }
        .s3 { width: 400px; height: 400px; top: 50%; left: 40%; background: #a855f7; opacity: 0.07; }
        .grid-overlay {
          position: fixed; inset: 0;
          background-image: radial-gradient(rgba(255,255,255,0.025) 1px, transparent 1px);
          background-size: 40px 40px;
          z-index: 1;
        }

        .landing-inner {
          max-width: 1100px;
          margin: 0 auto;
          padding: 40px 24px 60px;
          position: relative;
          z-index: 2;
        }

        /* NAV */
        .top-nav { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; }
        .logo { font-size: 1.8rem; font-weight: 900; text-decoration: none; color: white; letter-spacing: -1px; }
        .logo span { color: #6366f1; }
        .back-btn {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          padding: 10px 22px;
          border-radius: 50px;
          color: #94a3b8;
          text-decoration: none;
          font-weight: 700;
          font-size: 0.88rem;
          transition: 0.3s;
        }
        .back-btn:hover { background: #6366f1; color: white; transform: translateX(-4px); }

        /* DISCLAIMER BOX */
        .disclaimer-box {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          padding: 20px;
          margin-bottom: 60px;
          color: #64748b;
          font-size: 0.85rem;
          line-height: 1.6;
        }
        .disclaimer-box strong { color: #94a3b8; }

        /* HERO */
        .hero { text-align: center; max-width: 800px; margin: 0 auto 90px; }
        .badge {
          display: inline-block;
          background: rgba(99,102,241,0.12);
          border: 1px solid rgba(99,102,241,0.25);
          color: #a5b4fc;
          padding: 7px 18px;
          border-radius: 50px;
          font-size: 0.75rem;
          font-weight: 800;
          letter-spacing: 1.5px;
          margin-bottom: 24px;
        }
        .hero h1 { font-size: 4rem; font-weight: 900; line-height: 1.1; letter-spacing: -2px; margin-bottom: 22px; }
        .hero h1 span { background: linear-gradient(135deg, #6366f1, #a855f7, #ec4899); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .hero-sub { color: #94a3b8; font-size: 1.25rem; line-height: 1.7; margin-bottom: 35px; }
        .hero-sub strong { color: white; }
        .hero-btns { display: flex; justify-content: center; }
        .btn-primary {
          background: linear-gradient(135deg, #6366f1, #ec4899);
          color: white;
          padding: 18px 36px;
          border-radius: 16px;
          font-weight: 800;
          font-size: 1.1rem;
          text-decoration: none;
          transition: 0.3s;
          box-shadow: 0 10px 30px rgba(99, 102, 241, 0.35);
          border: none;
          cursor: pointer;
        }
        .btn-primary:hover {
          transform: translateY(-3px);
          box-shadow: 0 15px 35px rgba(99, 102, 241, 0.55);
        }
        .btn-lg {
          padding: 20px 42px;
          font-size: 1.2rem;
        }

        /* FEATURES GRID */
        .features-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-bottom: 50px; }
        .feat-card {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.06);
          padding: 35px 24px;
          border-radius: 28px;
          transition: 0.3s;
        }
        .feat-card:hover { transform: translateY(-8px); border-color: #6366f1; background: rgba(99,102,241,0.04); }
        .feat-icon { font-size: 2.2rem; margin-bottom: 16px; }
        .feat-card h3 { font-size: 1.25rem; font-weight: 800; margin-bottom: 10px; }
        .feat-card p { color: #94a3b8; font-size: 0.9rem; line-height: 1.6; }

        .divider { height: 1px; background: linear-gradient(to right, transparent, rgba(255,255,255,0.08), transparent); margin: 70px 0; }

        /* CONTENT SECTIONS */
        .content-section { margin-bottom: 60px; font-size: 1.1rem; line-height: 1.8; color: #cbd5e1; }
        .content-section h2 { font-size: 2.2rem; font-weight: 900; color: white; margin-bottom: 24px; letter-spacing: -0.5px; }
        .content-section p { margin-bottom: 20px; }
        .content-section strong { color: white; }
        
        /* SUB GRID */
        .sub-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 30px; }
        .sub-card {
          background: rgba(255,255,255,0.01);
          border: 1px solid rgba(255,255,255,0.04);
          border-radius: 24px;
          padding: 30px;
          transition: 0.3s;
        }
        .sub-card:hover { border-color: rgba(99,102,241,0.25); background: rgba(255,255,255,0.03); }
        .sub-card h3 { font-size: 1.25rem; font-weight: 800; color: white; margin-bottom: 12px; }
        .sub-card p { font-size: 0.92rem; line-height: 1.6; color: #94a3b8; }

        /* COMPARE SECTION */
        .section-header { text-align: center; margin-bottom: 50px; }
        .section-header h2 { font-size: 2.5rem; font-weight: 900; margin-bottom: 12px; }
        .section-header p { color: #64748b; font-size: 1.05rem; }

        /* COMPARISON TABLE */
        .table-wrapper { overflow-x: auto; background: rgba(255,255,255,0.01); border: 1px solid rgba(255,255,255,0.05); border-radius: 24px; padding: 10px; }
        .compare-table { width: 100%; border-collapse: collapse; text-align: left; font-size: 0.95rem; }
        .compare-table th, .compare-table td { padding: 18px 24px; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .compare-table th { font-weight: 800; color: white; font-size: 1.05rem; text-transform: uppercase; letter-spacing: 0.5px; }
        .compare-table td { color: #94a3b8; }
        .compare-table tr:last-child td { border-bottom: none; }
        .highlight-yes { color: #86efac !important; font-weight: 600; }
        .highlight-no { color: #fca5a5 !important; }

        /* STEPS */
        .steps-container { display: flex; align-items: center; gap: 12px; }
        .step {
          flex: 1;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 24px;
          padding: 35px 24px;
          text-align: center;
          transition: 0.3s;
        }
        .step:hover { border-color: rgba(99,102,241,0.3); background: rgba(99,102,241,0.04); transform: translateY(-6px); }
        .num {
          display: inline-flex;
          align-items: center; justify-content: center;
          width: 50px; height: 50px;
          border-radius: 50%;
          background: linear-gradient(135deg, #6366f1, #ec4899);
          font-weight: 900; font-size: 1.3rem;
          margin-bottom: 18px;
        }
        .step h4 { font-size: 1.1rem; font-weight: 800; margin-bottom: 10px; }
        .step p { color: #64748b; font-size: 0.85rem; line-height: 1.5; }
        .step-arrow { font-size: 1.5rem; color: #334155; flex-shrink: 0; }

        /* FAQ SECTION */
        .faq-section { margin-top: 20px; }
        .faq-list { display: flex; flex-direction: column; gap: 16px; }
        .faq-item {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 20px;
          padding: 28px 32px;
          transition: 0.3s;
        }
        .faq-item:hover { border-color: rgba(99,102,241,0.2); background: rgba(99,102,241,0.03); }
        .faq-item h3 { font-size: 1.05rem; font-weight: 800; margin-bottom: 10px; color: #e2e8f0; }
        .faq-item p { color: #64748b; font-size: 0.9rem; line-height: 1.65; }

        .blog-link {
          color: #818cf8;
          text-decoration: underline;
          font-weight: 600;
          transition: color 0.2s;
        }
        .blog-link:hover {
          color: #a5b4fc;
        }

        /* CTA BOTTOM */
        .cta-bottom { text-align: center; max-width: 700px; margin: 90px auto; padding: 0 20px; }
        .cta-bottom h2 { font-size: 2.6rem; font-weight: 900; margin-bottom: 15px; }
        .cta-bottom p { color: #94a3b8; font-size: 1.15rem; margin-bottom: 30px; line-height: 1.6; }

        /* FOOTER */
        .footer {
          text-align: center;
          padding: 50px 0 20px;
          border-top: 1px solid rgba(255,255,255,0.05);
          color: #475569;
          font-size: 0.88rem;
        }
        .footer-links { display: flex; justify-content: center; flex-wrap: wrap; gap: 24px; margin-top: 18px; }
        .footer-links a { color: #64748b; text-decoration: none; transition: 0.3s; font-weight: 600; }
        .footer-links a:hover { color: #6366f1; }

        /* RESPONSIVE */
        @media (max-width: 900px) {
          .hero h1 { font-size: 2.8rem; }
          .features-grid { grid-template-columns: 1fr; }
          .sub-grid { grid-template-columns: 1fr; }
          .steps-container { flex-direction: column; }
          .step-arrow { transform: rotate(90deg); margin: 10px 0; }
        }

        @media (max-width: 768px) {
          .landing-inner { padding: 20px 14px 40px !important; }
          .top-nav { flex-direction: column !important; gap: 15px !important; text-align: center !important; margin-bottom: 40px !important; }
          .disclaimer-box { padding: 15px !important; margin-bottom: 40px !important; font-size: 0.8rem !important; }
          .hero h1 { font-size: 2.2rem !important; letter-spacing: -1px !important; }
          .hero-sub { font-size: 1.05rem !important; }
          .hero { margin-bottom: 40px !important; }
          .btn-primary { padding: 14px 28px !important; font-size: 1rem !important; border-radius: 12px !important; width: 100% !important; display: block !important; text-align: center !important; }
          .btn-lg { padding: 16px 32px !important; font-size: 1.1rem !important; }
          .divider { margin: 40px 0 !important; }
          .feat-card { padding: 25px 20px !important; border-radius: 20px !important; }
          .content-section h2 { font-size: 1.7rem !important; }
          .sub-card { padding: 20px !important; border-radius: 20px !important; }
          .section-header h2 { font-size: 1.8rem !important; }
          .compare-table th, .compare-table td { padding: 12px 14px !important; font-size: 0.85rem !important; }
          .step { padding: 25px 20px !important; border-radius: 20px !important; }
          .faq-item { padding: 20px 18px !important; border-radius: 16px !important; }
          .cta-bottom h2 { font-size: 1.8rem !important; }
          .cta-bottom p { font-size: 1rem !important; }
          .cta-bottom { margin: 60px auto !important; }
        }

        @media (max-width: 480px) {
          .hero h1 { font-size: 1.8rem !important; }
          .section-header h2 { font-size: 1.5rem !important; }
        }
      `}</style>
    </div>
  );
}
