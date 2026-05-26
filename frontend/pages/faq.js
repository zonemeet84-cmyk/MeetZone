import Head from "next/head";
import Link from "next/link";
import { useState } from "react";

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  const faqData = [
    {
      category: "General Information",
      icon: "🌐",
      items: [
        {
          q: "What is ZoneMeet?",
          a: "ZoneMeet is a premier global video matchmaking platform designed for adult interaction, friendship, and professional networking. We use intelligent matching systems and advanced filters to connect you with real people in real-time."
        },
        {
          q: "Is ZoneMeet strictly for 18+?",
          a: "Yes. ZoneMeet is strictly restricted to users who are 18 years of age or older. We employ strict age verification and automatic AI-based content scanning. Underage accounts will be permanently banned and blocked from accessing the platform."
        },
        {
          q: "Is it free to use?",
          a: "Yes, you can start matching on ZoneMeet for free. However, premium options like selective gender and country filtering, auto-translation, custom voice changers, and AR masks require Coins or an active Premium subscription."
        }
      ]
    },
    {
      category: "Voice Changer & AR Filters",
      icon: "🎙️",
      items: [
        {
          q: "How does the Voice Changer work?",
          a: "Our Voice Changer uses the low-latency Web Audio API (AudioWorklet) to process your microphone input in real-time. By applying high-quality pitch-shifting and filter coefficients (such as Baby, Girl, Cartoon, or Sigma Deep Voice), it transforms your voice before transmitting it to your call partner."
        },
        {
          q: "My partner hears my original voice instead of the voice changer. How do I fix it?",
          a: "If the voice changer behaves incorrectly, please click or touch anywhere on the page to resume the browser's audio processing engine. Some mobile browsers (like iOS Safari) suspend audio nodes until an explicit user interaction occurs. Also, make sure you clicked 'Apply' after selecting your voice."
        },
        {
          q: "How do AR masks and blur filters work?",
          a: "We use lightweight client-side AI (MediaPipe FaceMesh and TensorFlow) to detect your facial coordinates. The mask or blur filter is rendered on HTML Canvas overlays. This processing happens entirely on your device, ensuring maximum privacy and zero latency."
        }
      ]
    },
    {
      category: "Live Subtitles & Translation",
      icon: "💬",
      items: [
        {
          q: "How do I turn on Live Subtitles (CC)?",
          a: "If you have an active Premium subscription, a 'CC' button will appear on your partner's video card. Click it to enable live subtitles. You can choose your preferred listening language from the dropdown menu that appears right next to it."
        },
        {
          q: "Why are subtitles not supported in my browser?",
          a: "Live subtitles rely on the Web Speech API (SpeechRecognition). While it is natively supported in Google Chrome, Microsoft Edge, and Safari, it is currently unsupported or disabled by default in Mozilla Firefox. For the best experience, we recommend using Chrome or Safari."
        },
        {
          q: "Why did my subtitles stop unexpectedly?",
          a: "Some mobile browsers limit continuous voice transcription to save battery or data, automatically stopping it after a brief period of silence. ZoneMeet includes a background auto-restart system that will safely restart the engine after a 1-second delay, so you can continue talking without interruptions."
        }
      ]
    },
    {
      category: "Coins & Billing",
      icon: "💎",
      items: [
        {
          q: "What are Coins and how do I get them?",
          a: "Coins are the virtual currency of ZoneMeet. They can be used to unlock premium filters, send sticker gifts to your match, or unlock mystery boxes. You can purchase coins through our secure packages on the homepage, or earn them for FREE by inviting your friends using your unique referral link."
        },
        {
          q: "Are my payment details secure?",
          a: "Absolutely. We do not store or process your credit card or banking details directly on our servers. All transactions are securely handled by certified global payment processors (like Stripe, PayPal, Razorpay, or Cashfree) using secure HTTPS encryption."
        },
        {
          q: "What is your refund policy?",
          a: "Refunds are generally not provided for consumed digital items or active subscription periods. For detailed conditions or subscription cancellations, please review our Refund Policy page or contact support."
        }
      ]
    },
    {
      category: "Safety & Privacy",
      icon: "🛡️",
      items: [
        {
          q: "Why is my camera or microphone access failing?",
          a: "This happens when permissions are blocked. If you see a warning toast, please check your browser address bar (click the lock/settings icon next to the URL) and ensure 'Camera' and 'Microphone' are set to 'Allow'. Also, make sure no other application (like Zoom or Teams) is using your camera in the background."
        },
        {
          q: "How do I report an abusive user?",
          a: "If your partner violates our guidelines or behaves inappropriately, click the 'Report' button on their card. Choose a reason and submit it. Our system automatically processes reports. Users who receive multiple reports are subjected to an automated ban review."
        },
        {
          q: "What is the AI Blur Guardian?",
          a: "ZoneMeet uses an automated real-time NSFW detection engine. If a user displays prohibited explicit imagery, the system instantly blurs the video feed and issues a warning strike. Three strikes will result in a permanent hardware-level ban."
        }
      ]
    }
  ];

  const handleToggle = (globalIndex) => {
    setOpenIndex(openIndex === globalIndex ? null : globalIndex);
  };

  // Keep a running index counter across categories for unified keyboard navigation and selection state
  let globalIndexCounter = 0;

  return (
    <div className="container">
      <Head>
        <title>FAQs - Frequently Asked Questions | ZoneMeet</title>
        <meta name="description" content="Find answers to all your questions about ZoneMeet features, safety policies, voice changer settings, pricing plans, and camera/microphone troubleshooting." />
      </Head>

      <div className="bg-gradient" />

      <div className="content">
        <Link href="/" className="back-btn">
          ← Back to Home
        </Link>

        <h1>Frequently Asked Questions</h1>
        <div className="last-updated">Last Updated: May 2026</div>

        <div className="faq-wrapper">
          {faqData.map((category, catIdx) => (
            <div key={catIdx} className="faq-category-section">
              <h2 className="category-header">
                <span className="category-icon">{category.icon}</span>
                {category.category}
              </h2>
              
              <div className="faq-items-list">
                {category.items.map((item, itemIdx) => {
                  const currentIndex = globalIndexCounter++;
                  const isOpen = openIndex === currentIndex;
                  return (
                    <div 
                      key={itemIdx} 
                      className={`faq-item ${isOpen ? 'active' : ''}`}
                    >
                      <button 
                        className="faq-question-btn" 
                        onClick={() => handleToggle(currentIndex)}
                        aria-expanded={isOpen}
                      >
                        <span className="question-text">{item.q}</span>
                        <span className="chevron-icon">{isOpen ? "−" : "+"}</span>
                      </button>
                      <div className="faq-answer-container">
                        <div className="faq-answer-text">
                          {item.a}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="faq-footer">
          <h3>Still have questions?</h3>
          <p>If you couldn't find what you are looking for, please contact our support team directly.</p>
          <Link href="/contact" className="contact-btn">
            Get Support &rarr;
          </Link>
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
          font-size: 3.2rem;
          font-weight: 900;
          margin-bottom: 0.5rem;
          background: linear-gradient(135deg, #6366f1, #ec4899);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          letter-spacing: -0.02em;
        }
        .last-updated {
          color: #64748b;
          font-size: 0.9rem;
          font-weight: 600;
          margin-bottom: 3rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .faq-wrapper {
          display: flex;
          flex-direction: column;
          gap: 2.5rem;
        }
        .faq-category-section {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .category-header {
          font-size: 1.4rem;
          color: #f8fafc;
          font-weight: 800;
          display: flex;
          align-items: center;
          gap: 10px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          padding-bottom: 0.5rem;
          margin: 0;
        }
        .category-icon {
          font-size: 1.5rem;
        }
        .faq-items-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .faq-item {
          background: rgba(255, 255, 255, 0.01);
          border: 1px solid rgba(255, 255, 255, 0.04);
          border-radius: 16px;
          overflow: hidden;
          transition: all 0.3s ease;
        }
        .faq-item:hover {
          background: rgba(255, 255, 255, 0.03);
          border-color: rgba(255, 255, 255, 0.08);
        }
        .faq-item.active {
          background: rgba(255, 255, 255, 0.03);
          border-color: rgba(99, 102, 241, 0.2);
          box-shadow: 0 4px 20px rgba(99, 102, 241, 0.05);
        }
        .faq-question-btn {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.25rem 1.5rem;
          background: none;
          border: none;
          color: #f1f5f9;
          font-size: 1.05rem;
          font-weight: 700;
          text-align: left;
          cursor: pointer;
          transition: color 0.3s;
          outline: none;
        }
        .faq-question-btn:hover {
          color: #fff;
        }
        .chevron-icon {
          font-size: 1.3rem;
          color: #818cf8;
          font-weight: 400;
          line-height: 1;
        }
        .faq-answer-container {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.35s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .faq-item.active .faq-answer-container {
          max-height: 300px;
        }
        .faq-answer-text {
          padding: 0 1.5rem 1.5rem;
          color: #94a3b8;
          line-height: 1.7;
          font-size: 0.98rem;
        }
        .faq-footer {
          margin-top: 4rem;
          padding-top: 3rem;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          text-align: center;
        }
        .faq-footer h3 {
          font-size: 1.5rem;
          color: #f8fafc;
          margin-bottom: 0.5rem;
          font-weight: 800;
        }
        .faq-footer p {
          color: #64748b;
          margin-bottom: 1.5rem;
          font-size: 1rem;
        }
        .contact-btn {
          display: inline-flex;
          align-items: center;
          background: linear-gradient(135deg, #6366f1, #4f46e5);
          color: #fff;
          padding: 0.75rem 1.75rem;
          border-radius: 50px;
          text-decoration: none;
          font-weight: 700;
          font-size: 0.95rem;
          box-shadow: 0 10px 20px rgba(99, 102, 241, 0.2);
          transition: all 0.3s ease;
        }
        .contact-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 15px 25px rgba(99, 102, 241, 0.3);
        }
        .back-btn {
          display: inline-flex;
          align-items: center;
          margin-bottom: 2.5rem;
          color: #a5b4fc;
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
          h1 { font-size: 2.1rem !important; }
          .category-header { font-size: 1.25rem !important; }
          .faq-question-btn { padding: 1rem !important; font-size: 0.95rem !important; }
          .faq-answer-text { padding: 0 1rem 1rem !important; font-size: 0.9rem !important; }
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
