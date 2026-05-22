import Swal from "sweetalert2";
import { useEffect, useState } from "react";
import Head from "next/head";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import axios from "axios";

// Enable withCredentials globally for cookie security
axios.defaults.withCredentials = true;

export default function AdminDashboard() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [stats, setStats] = useState({ totalUsers: 0, liveCalls: 0, premiumUsers: 0, totalReports: 0, onlineCount: 0 });
  const [analytics, setAnalytics] = useState({ 
    countryCounts: {}, 
    revenue: { today: 0, monthly: 0, premiumSales: 0, coinPurchases: 0, history: [] },
    coins: { totalSold: 0, spentToday: 0, revenue: 0, topSpender: { name: "N/A", email: "N/A", count: 0 }, recentActivity: [] }
  });
  const [reports, setReports] = useState([]);
  const [liveUsers, setLiveUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [bannedUsers, setBannedUsers] = useState([]);
  const [contactMessages, setContactMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState("Year");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Manual Edit State
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ premium: false, planName: "Free", isVIP: false });

  // Admin Secure Credentials and Verification States
  const [isVerified, setIsVerified] = useState(false);
  const [authForm, setAuthForm] = useState({ email: "ds9376314@gmail.com", password: "", otp: "", secretRouteKey: "" });
  const [authLoading, setAuthLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    if (sessionStatus === "loading") return;

    // Check if already verified in this browser session
    if (localStorage.getItem("adminVerified") === "true") {
      setIsVerified(true);
      fetchData();
      const interval = setInterval(fetchData, 15000); 
      return () => clearInterval(interval);
    }

    // Google Session check to auto-populate email
    let emailVal = "ds9376314@gmail.com";
    const isGoogleAdmin = session && session.user.email === "ds9376314@gmail.com";
    if (isGoogleAdmin) {
      emailVal = session.user.email;
    } else {
      const localUser = localStorage.getItem("user");
      if (localUser) {
        try {
          const parsed = JSON.parse(localUser);
          if (parsed.email) emailVal = parsed.email;
        } catch (e) {}
      }
    }
    setAuthForm(prev => ({ ...prev, email: emailVal }));
    setLoading(false); // Stop general loading so they can see the Verification screen
  }, [session, sessionStatus]);

  const handleSend2FA = async () => {
    setOtpLoading(true);
    setAuthError("");
    try {
      await axios.post("https://api.zonemeet.chat/api/admin/send-2fa", { email: authForm.email });
      setOtpSent(true);
      Swal.fire({ text: "2FA Verification Code sent to your email!", icon: "success", background: "#0f172a", color: "#fff", confirmButtonColor: "#6366f1" });
    } catch (err) {
      setAuthError(err.response?.data?.message || "Failed to send 2FA Code");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyLogin = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError("");
    try {
      const res = await axios.post("https://api.zonemeet.chat/api/admin/verify-login", authForm);
      if (res.data.success) {
        localStorage.setItem("token", res.data.token); // Store token
        localStorage.setItem("adminVerified", "true");
        setIsVerified(true);
        setLoading(true);
        fetchData();
      }
    } catch (err) {
      setAuthError(err.response?.data?.message || "Verification failed");
    } finally {
      setAuthLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      let token = localStorage.getItem("token");
      
      // If token is missing, attempt to sync from session
      if (!token || token === "undefined") {
        if (sessionStatus === "authenticated" && session?.user?.email === "ds9376314@gmail.com") {
          const syncRes = await axios.post("https://api.zonemeet.chat/api/auth/session-login", {
            email: session.user.email,
            name: session.user.name
          });
          token = syncRes.data.token;
          localStorage.setItem("token", token);
        } else {
          // No session and no token - can't fetch
          return;
        }
      }

      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      try {
        const [statsRes, reportsRes, liveRes, usersRes, bannedRes, analyticsRes, msgsRes] = await Promise.all([
          axios.get("https://api.zonemeet.chat/api/admin/stats", config),
          axios.get("https://api.zonemeet.chat/api/admin/reports", config),
          axios.get("https://api.zonemeet.chat/api/admin/live-users", config),
          axios.get("https://api.zonemeet.chat/api/admin/all-users", config),
          axios.get("https://api.zonemeet.chat/api/admin/banned-users", config),
          axios.get("https://api.zonemeet.chat/api/admin/analytics", config),
          axios.get("https://api.zonemeet.chat/api/admin/messages", config)
        ]);

        setStats(statsRes.data);
        setReports(reportsRes.data.reverse());
        setLiveUsers(liveRes.data);
        setAllUsers(usersRes.data);
        setBannedUsers(bannedRes.data);
        setAnalytics(analyticsRes.data);
        setContactMessages(msgsRes.data.reverse());
        setLoading(false);
      } catch (innerErr) {
        if (innerErr.response?.status === 401) {
          console.warn("Token expired, clearing and retrying...");
          localStorage.removeItem("token");
          // Re-sync immediately once if we have a session
          if (sessionStatus === "authenticated" && session?.user?.email === "ds9376314@gmail.com") {
             const syncRes = await axios.post("https://api.zonemeet.chat/api/auth/session-login", {
               email: session.user.email,
               name: session.user.name
             });
             localStorage.setItem("token", syncRes.data.token);
          }
        } else {
          throw innerErr;
        }
      }
    } catch (err) {
      console.error("Admin Fetch Error:", err);
    }
  };

  const handleAction = async (endpoint, payload, msg) => {
    const result = await Swal.fire({ text: `Are you sure you want to ${msg}?`, icon: "question", showCancelButton: true, confirmButtonColor: "#6366f1", cancelButtonColor: "#ef4444", background: "#0f172a", color: "#fff" }); if (!result.isConfirmed) return;
    try {
      const token = localStorage.getItem("token");
      await axios.post(`https://api.zonemeet.chat/api/admin/${endpoint}`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      Swal.fire({ text: `Success: ${msg}`, icon: "info", confirmButtonColor: "#6366f1", background: "#0f172a", color: "#fff" });
      setEditingUser(null);
      fetchData();
    } catch (err) {
      Swal.fire({ text: "Action failed", icon: "info", confirmButtonColor: "#6366f1", background: "#0f172a", color: "#fff" });
    }
  };

  if (!isVerified) {
    return (
      <div className="login-container-sec">
        <Head>
          <title>ZoneMeet Admin | Secure Verification</title>
          <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;900&display=swap" rel="stylesheet" />
        </Head>
        <div className="bg-gradient" />
        
        <div className="login-card">
          <div className="login-header">
            <div className="zonemeet-logo">🛡️</div>
            <h1>Neural Admin Core</h1>
            <p>Verification Required to Sync Command Link</p>
          </div>

          <form onSubmit={handleVerifyLogin} className="modern-form">
            <div className="input-item">
              <label>Admin Email</label>
              <input type="email" value={authForm.email} disabled />
            </div>

            <div className="input-item">
              <label>Secret Access Key</label>
              <input 
                type="password" 
                placeholder="Enter Secret Key" 
                value={authForm.secretRouteKey} 
                onChange={(e) => setAuthForm({...authForm, secretRouteKey: e.target.value})} 
                required 
              />
            </div>

            <div className="input-item">
              <label>Access Password</label>
              <input 
                type="password" 
                placeholder="Enter Password" 
                value={authForm.password} 
                onChange={(e) => setAuthForm({...authForm, password: e.target.value})} 
                required 
              />
            </div>

            <div className="input-item">
              <label>2FA Code (Google Auth or Email Fallback)</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input 
                  type="text" 
                  placeholder="6-Digit Code" 
                  value={authForm.otp} 
                  onChange={(e) => setAuthForm({...authForm, otp: e.target.value})} 
                  required 
                  maxLength={6}
                />
                <button type="button" className="otp-btn" onClick={handleSend2FA} disabled={otpLoading} style={{ background: otpSent ? '#10b981' : '#6366f1' }}>
                  {otpLoading ? "..." : otpSent ? "Email Sent" : "Email Fallback"}
                </button>
              </div>
            </div>

            {authError && <div className="error-box">{authError}</div>}

            <button type="submit" className="submit-btn" disabled={authLoading}>
              {authLoading ? "Decrypting Protocol..." : "Establish Secure Link"}
            </button>
          </form>
        </div>

        <style jsx>{`
          .login-container-sec { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #030712; padding: 20px; position: relative; overflow: hidden; font-family: 'Outfit', sans-serif; }
          .bg-gradient { position: absolute; width: 200%; height: 200%; background: radial-gradient(circle at center, rgba(99, 102, 241, 0.15) 0%, transparent 50%); animation: rotate 30s linear infinite; }
          @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          .login-card { width: 100%; max-width: 420px; background: rgba(17, 24, 39, 0.7); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 32px; padding: 3rem; z-index: 1; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); text-align: center; }
          .zonemeet-logo { font-size: 3rem; margin-bottom: 1rem; filter: drop-shadow(0 0 10px rgba(99, 102, 241, 0.5)); }
          h1 { font-size: 2rem; color: white; margin-bottom: 0.5rem; font-weight: 900; letter-spacing: -1px; }
          p { color: #94a3b8; margin-bottom: 2rem; font-size: 0.95rem; }
          .modern-form { text-align: left; }
          .input-item { margin-bottom: 1.25rem; }
          .input-item label { display: block; font-size: 0.85rem; color: #cbd5e1; margin-bottom: 0.5rem; font-weight: 600; }
          .input-item input { width: 100%; background: rgba(0, 0, 0, 0.4); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 0.75rem 1rem; color: white; font-size: 1rem; outline: none; transition: 0.3s; }
          .input-item input:focus { border-color: #6366f1; box-shadow: 0 0 10px rgba(99, 102, 241, 0.2); }
          .otp-btn { background: #6366f1; color: white; border: none; border-radius: 12px; padding: 0 1.5rem; font-size: 0.85rem; font-weight: 600; cursor: pointer; white-space: nowrap; transition: 0.3s; }
          .otp-btn:hover { background: #4f46e5; }
          .submit-btn { width: 100%; background: linear-gradient(135deg, #6366f1, #ec4899); color: white; border: none; padding: 1rem; border-radius: 16px; font-size: 1rem; font-weight: 700; cursor: pointer; margin-top: 1rem; transition: all 0.3s; box-shadow: 0 10px 25px rgba(99, 102, 241, 0.3); }
          .submit-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 15px 30px rgba(99, 102, 241, 0.4); }
          .error-box { background: rgba(239, 68, 68, 0.1); color: #f87171; padding: 0.75rem; border-radius: 12px; margin-bottom: 1rem; font-size: 0.85rem; border: 1px solid rgba(239, 68, 68, 0.2); text-align: center; }
        `}</style>
      </div>
    );
  }

  if (loading) return (
    <div className="loading-container">
      <div className="loader-glow"></div>
      <h1>AURA COMMAND</h1>
      <p>Synchronizing Neural Link...</p>
    </div>
  );

  return (
    <div className="admin-wrapper">
      <Head>
        <title>ZoneMeet Admin | Neural Command Center</title>
        <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;900&display=swap" rel="stylesheet" />
      </Head>

      {/* GLASS SIDEBAR */}
      <div className="sidebar-glass">
        <div className="brand">
           <div className="brand-icon" style={{ background: 'transparent', padding: 0, overflow: 'hidden' }}>
             <svg viewBox="0 0 32 32" width="40" height="40" fill="none" xmlns="http://www.w3.org/2000/svg">
               <rect x="2" y="5" width="20" height="22" rx="6" fill="url(#admin-brand-grad)" />
               <path d="M22 11L28 7V25L22 21V11Z" fill="url(#admin-brand-grad)" />
               <path d="M9 11H15L9 19H15" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
               <defs>
                 <linearGradient id="admin-brand-grad" x1="2" y1="5" x2="28" y2="27" gradientUnits="userSpaceOnUse">
                   <stop stopColor="#2563eb" />
                   <stop offset="0.5" stopColor="#a855f7" />
                   <stop offset="1" stopColor="#ec4899" />
                 </linearGradient>
               </defs>
             </svg>
           </div>
           <h2 style={{ margin: 0 }}><span style={{ color: '#fff' }}>Zone</span><span style={{ background: 'linear-gradient(135deg,#a855f7,#ec4899)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Meet</span> <span style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 400, fontSize: '0.7em' }}>Admin</span></h2>
        </div>
        
        <nav className="nav-menu">
          {[
            { id: 'dashboard', icon: 'fa-grid-2', label: 'Dashboard' },
            { id: 'analytics', icon: 'fa-chart-mixed', label: 'Analytics' },
            { id: 'revenue', icon: 'fa-wallet', label: 'Revenue' },
            { id: 'coins', icon: 'fa-coins', label: 'Coins Market' },
            { id: 'users', icon: 'fa-users', label: 'All Users' },
            { id: 'active-premium', icon: 'fa-crown', label: 'Premium' },
            { id: 'messages', icon: 'fa-envelope', label: 'Messages' },
            { id: 'reports', icon: 'fa-flag', label: 'Reports' },
            { id: 'banned', icon: 'fa-user-slash', label: 'Banned' }
          ].map(item => (
            <div 
              key={item.id}
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <i className={`fa-solid ${item.icon}`}></i>
              <span>{item.label}</span>
              {activeTab === item.id && <div className="active-glow"></div>}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
           <div className="sys-status">
              <div className="dot online"></div>
              <span>System Operational</span>
           </div>
        </div>
      </div>

      <main className="content-area">
        {/* NEUMORPHIC TOPBAR */}
        <header className="glass-header">
           <div className="header-left">
              <span className="breadcrumb">Pages / {activeTab.replace("-", " ")}</span>
              <h1>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1).replace("-", " ")}</h1>
           </div>
           
           <div className="header-right">
              <div className="search-pill">
                 <i className="fa fa-search"></i>
                 <input 
                   type="text" 
                   placeholder="Search user or email..." 
                   value={searchTerm}
                   onChange={(e) => {
                     setSearchTerm(e.target.value);
                     if (activeTab !== "users") setActiveTab("users");
                   }}
                 />
              </div>
              <div className="admin-badge" onClick={() => router.push("/")}>
                 <img src={session?.user?.image || "https://ui-avatars.com/api/?name=Admin&background=6366f1&color=fff"} alt="Admin" />
                 <div className="admin-meta">
                    <strong>{session?.user?.name}</strong>
                    <small>Super Admin</small>
                 </div>
                 <i className="fa fa-chevron-right"></i>
              </div>
           </div>
        </header>

        {/* DYNAMIC VIEWS */}
        <div className="view-container">
           {activeTab === "dashboard" && (
             <div className="fade-in">
                <div className="dashboard-header-flex">
                   <div className="guardian-status">
                      <div className="pulse-icon"><i className="fa fa-shield-cat"></i></div>
                      <div>
                         <strong>ZoneMeet Guardian Active</strong>
                         <small>AI Fraud Detection: Scanning every 2s</small>
                      </div>
                   </div>
                </div>

                {/* COIN DASHBOARD CARDS */}
                <div className="stats-row coin-stats">
                   <div className="neo-card coin-gradient">
                      <div className="card-inner">
                         <div className="icon-box gold"><i className="fa fa-coins"></i></div>
                         <div className="data">
                            <p>Total Coins Sold</p>
                            <h2>{analytics.coins?.totalSold?.toLocaleString() || 0}</h2>
                            <span className="trend gold">Economy</span>
                         </div>
                      </div>
                   </div>
                   <div className="neo-card coin-gradient">
                      <div className="card-inner">
                         <div className="icon-box blue"><i className="fa fa-paper-plane"></i></div>
                         <div className="data">
                            <p>Coins Spent Today</p>
                            <h2>{analytics.coins?.spentToday?.toLocaleString() || 0}</h2>
                            <span className="trend">Activity</span>
                         </div>
                      </div>
                   </div>
                   <div className="neo-card coin-gradient">
                      <div className="card-inner">
                         <div className="icon-box purple"><i className="fa fa-crown"></i></div>
                         <div className="data">
                            <p>Top Spender</p>
                            <h2 style={{ fontSize: analytics.coins?.topSpender?.name?.length > 10 ? '18px' : '24px' }}>{analytics.coins?.topSpender?.name || "N/A"}</h2>
                            <span className="trend purple">{analytics.coins?.topSpender?.count || 0} Txns</span>
                         </div>
                      </div>
                   </div>
                   <div className="neo-card coin-gradient">
                      <div className="card-inner">
                         <div className="icon-box green"><i className="fa fa-indian-rupee-sign"></i></div>
                         <div className="data">
                            <p>Revenue From Coins</p>
                            <h2>₹{analytics.coins?.revenue?.toLocaleString() || 0}</h2>
                            <span className="trend green">Direct Profit</span>
                         </div>
                      </div>
                   </div>
                </div>

                <div className="stats-row">
                   <div className="neo-card gradient-1">
                      <div className="card-inner">
                         <div className="icon-box"><i className="fa fa-users-viewfinder"></i></div>
                         <div className="data">
                            <p>Total Reach</p>
                            <h2>{stats.totalUsers.toLocaleString()}</h2>
                            <span className="trend">+12.5%</span>
                         </div>
                      </div>
                   </div>
                   <div className="neo-card gradient-2">
                      <div className="card-inner">
                         <div className="icon-box"><i className="fa fa-video"></i></div>
                         <div className="data">
                            <p>Live Nodes</p>
                            <h2>{stats.onlineCount}</h2>
                            <span className="trend">Online</span>
                         </div>
                      </div>
                   </div>
                   <div className="neo-card gradient-3">
                      <div className="card-inner">
                         <div className="icon-box"><i className="fa fa-gem"></i></div>
                         <div className="data">
                            <p>Premium Core</p>
                            <h2>{stats.premiumUsers}</h2>
                            <span className="trend">VIP</span>
                         </div>
                      </div>
                   </div>
                   <div className="neo-card gradient-4">
                      <div className="card-inner">
                         <div className="icon-box"><i className="fa fa-shield-halved"></i></div>
                         <div className="data">
                            <p>Resolved Reports</p>
                            <h2>{stats.totalReports}</h2>
                            <span className="trend red">Safety First</span>
                         </div>
                      </div>
                   </div>
                </div>

                <div className="main-grid">
                   <div className="glass-card main-chart">
                      <div className="card-header">
                         <h3>Financial Trajectory</h3>
                         <div className="pill-selector">
                            {['Week', 'Month', 'Year'].map(t => (
                              <button key={t} className={timeframe === t ? 'active' : ''} onClick={() => setTimeframe(t)}>{t}</button>
                            ))}
                         </div>
                      </div>
                      <div className="chart-wrapper">
                         <svg viewBox="0 0 500 150" className="chart-svg">
                            <defs>
                               <linearGradient id="chart-grad" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.5" />
                                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                               </linearGradient>
                            </defs>
                            <path d={timeframe === "Year" ? "M0,120 C50,110 100,130 150,80 S250,20 350,60 S450,10 500,40 L500,150 L0,150 Z" : "M0,120 Q125,40 250,80 T500,30 L500,150 L0,150 Z"} fill="url(#chart-grad)" />
                            <path d={timeframe === "Year" ? "M0,120 C50,110 100,130 150,80 S250,20 350,60 S450,10 500,40" : "M0,120 Q125,40 250,80 T500,30"} fill="none" stroke="#6366f1" strokeWidth="4" />
                         </svg>
                      </div>
                   </div>

                   <div className="glass-card side-info">
                      <h3>Live Connectivity</h3>
                      <div className="live-user-list">
                         {liveUsers.slice(0, 6).map(u => (
                           <div className="live-item" key={u.id}>
                              <div className="avatar-mini">{u.name.charAt(0)}</div>
                              <div className="item-meta">
                                 <strong>{u.name}</strong>
                                 <small>{u.country}</small>
                              </div>
                              <div className="status-pulse"></div>
                           </div>
                         ))}
                      </div>
                   </div>
                </div>
             </div>
           )}

           {activeTab === "revenue" && (
             <div className="fade-in">
                <div className="revenue-summary">
                   <div className="rev-box">
                      <p>Today</p>
                      <h1>₹{analytics.revenue.today?.toLocaleString() || 0}</h1>
                   </div>
                   <div className="rev-box">
                      <p>Monthly</p>
                      <h1>₹{analytics.revenue.monthly?.toLocaleString() || 0}</h1>
                   </div>
                   <div className="rev-box featured">
                      <p>Lifetime</p>
                      <h1>₹{analytics.revenue.lifetime?.toLocaleString() || 0}</h1>
                   </div>
                </div>

                <div className="glass-card table-box">
                   <h3>Audit Trail (Recent Transactions)</h3>
                   <table className="modern-table">
                      <thead>
                         <tr><th>Reference</th><th>Target User</th><th>Valuation</th><th>Timestamp</th></tr>
                      </thead>
                      <tbody>
                         {analytics.revenue.history?.map(t => (
                           <tr key={t.id}>
                              <td><span className="pill blue">{t.planName}</span></td>
                              <td>{t.userEmail}</td>
                              <td><strong>₹{t.amount}</strong></td>
                              <td>{new Date(t.timestamp).toLocaleDateString()}</td>
                           </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             </div>
           )}

           {activeTab === "coins" && (
              <div className="fade-in">
                 <div className="stats-row">
                    <div className="neo-card gradient-3">
                       <div className="card-inner">
                          <div className="icon-box"><i className="fa fa-coins"></i></div>
                          <div className="data">
                             <p>Total Coins Circulating</p>
                             <h2>{allUsers.reduce((sum, u) => sum + (u.coins || 0), 0).toLocaleString()}</h2>
                             <span className="trend">ZoneMeet Economy</span>
                          </div>
                       </div>
                    </div>
                    <div className="neo-card gradient-1">
                       <div className="card-inner">
                          <div className="icon-box"><i className="fa fa-indian-rupee-sign"></i></div>
                          <div className="data">
                             <p>Coins Market Revenue</p>
                             <h2>₹{analytics.revenue.history?.filter(t => t.type === "coins").reduce((sum, t) => sum + t.amount, 0).toLocaleString()}</h2>
                             <span className="trend">Growth</span>
                          </div>
                       </div>
                    </div>
                 </div>

                 <div className="glass-card" style={{ marginBottom: '30px', background: 'linear-gradient(135deg, rgba(3, 7, 18, 0.8), rgba(17, 24, 39, 0.8))' }}>
                    <h3 style={{ marginBottom: '20px' }}>Service Rate Card (Pricing)</h3>
                    <div className="stats-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
                       <div className="neo-card" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }}>
                          <div className="card-inner" style={{ background: 'transparent', padding: '15px' }}>
                             <div className="data">
                                <p style={{ fontSize: '10px' }}>BOOST PROFILE</p>
                                <h2 style={{ fontSize: '20px', margin: '5px 0' }}>100 Coins</h2>
                                <span className="trend" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>10 Mins Priority</span>
                             </div>
                          </div>
                       </div>
                       <div className="neo-card" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }}>
                          <div className="card-inner" style={{ background: 'transparent', padding: '15px' }}>
                             <div className="data">
                                <p style={{ fontSize: '10px' }}>RECONNECT (REQUEST)</p>
                                <h2 style={{ fontSize: '20px', margin: '5px 0' }}>10 Coins</h2>
                                <span className="trend blue">Discovery</span>
                             </div>
                          </div>
                       </div>
                       <div className="neo-card" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }}>
                          <div className="card-inner" style={{ background: 'transparent', padding: '15px' }}>
                             <div className="data">
                                <p style={{ fontSize: '10px' }}>RECONNECT (ACCEPT)</p>
                                <h2 style={{ fontSize: '20px', margin: '5px 0' }}>40 Coins</h2>
                                <span className="trend purple">Full Unlock</span>
                             </div>
                          </div>
                       </div>
                    </div>
                 </div>


              </div>
           )}

           {activeTab === "users" && (
              <div className="glass-card table-box fade-in">
                 <div className="table-header-flex">
                    <h3>User Database</h3>
                    <div className="count-badge">{allUsers.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase())).length} Results</div>
                 </div>
                 <table className="modern-table">
                    <thead>
                       <tr><th>Identity</th><th>Origin</th><th>Privilege</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                       {allUsers
                        .filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase()))
                        .map(u => (
                         <tr key={u.id}>
                            <td className="user-id">
                               <img src={`https://ui-avatars.com/api/?name=${u.name}&background=random`} alt="" />
                               <div>
                                  <strong>{u.name}</strong>
                                  <small>{u.email}</small>
                               </div>
                            </td>
                            <td>{u.country}</td>
                            <td><span className={`pill ${u.premium ? 'gold' : 'slate'}`}>{u.planName || 'Standard'}</span></td>
                            <td>
                               <button className="manage-btn" onClick={() => { setEditingUser(u); setEditForm({ premium: !!u.premium, planName: u.planName || "Free", isVIP: !!u.isVIP }); }}>
                                  Manage <i className="fa fa-cog"></i>
                               </button>
                            </td>
                         </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           )}

           {activeTab === "active-premium" && (
              <div className="glass-card table-box fade-in">
                 <div className="table-header-flex">
                    <h3>Active Premium Members</h3>
                    <div className="count-badge">{allUsers.filter(u => u.premium).length} Elite Profiles</div>
                 </div>
                 <table className="modern-table">
                    <thead>
                       <tr><th>Identity</th><th>Active Plan</th><th>Neural Expiry</th><th>Management</th></tr>
                    </thead>
                    <tbody>
                       {allUsers.filter(u => u.premium).map(u => (
                         <tr key={u.id}>
                            <td className="user-id">
                               <img src={`https://ui-avatars.com/api/?name=${u.name}&background=gold&color=fff`} alt="" />
                               <div>
                                  <strong>{u.name}</strong>
                                  <small>{u.email}</small>
                               </div>
                            </td>
                            <td><span className="pill gold">{u.planName}</span></td>
                            <td>{u.planExpiry ? new Date(u.planExpiry).toLocaleDateString() : 'Permanent'}</td>
                            <td>
                               <button className="manage-btn" onClick={() => { setEditingUser(u); setEditForm({ premium: true, planName: u.planName, isVIP: !!u.isVIP }); }}>
                                  Configure <i className="fa fa-sliders"></i>
                               </button>
                            </td>
                         </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           )}

           {activeTab === "banned" && (
              <div className="glass-card table-box fade-in">
                 <div className="table-header-flex">
                    <h3>Banned Users</h3>
                    <div className="count-badge">{bannedUsers.length} Banned</div>
                 </div>
                 {bannedUsers.length === 0 ? (
                   <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-dim)' }}>
                     <div style={{ fontSize: '3rem', marginBottom: '15px' }}>🎉</div>
                     <p>No banned users. Platform is clean!</p>
                   </div>
                 ) : (
                   <table className="modern-table">
                     <thead>
                        <tr><th>#</th><th>Email</th><th>Status</th><th>Action</th></tr>
                     </thead>
                     <tbody>
                        {bannedUsers.map((email, idx) => (
                          <tr key={email}>
                             <td style={{ color: 'var(--text-dim)', fontWeight: 700 }}>#{idx + 1}</td>
                             <td>
                               <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                 <div style={{ width: 32, height: 32, background: 'rgba(239,68,68,0.15)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>🚫</div>
                                 <span style={{ fontWeight: 700, color: '#ef4444' }}>{email}</span>
                               </div>
                             </td>
                             <td><span className="pill danger">BANNED</span></td>
                             <td>
                               <button
                                 className="manage-btn"
                                 style={{ background: 'rgba(16,185,129,0.1)', borderColor: 'rgba(16,185,129,0.3)', color: '#10b981' }}
                                 onClick={() => handleAction("unban", { email }, `unban ${email}`)}
                               >
                                 Unban <i className="fa fa-unlock"></i>
                               </button>
                             </td>
                          </tr>
                        ))}
                     </tbody>
                   </table>
                 )}
              </div>
           )}

           {activeTab === "reports" && (
             <div className="glass-card fade-in">
                <h3>Incident Reports</h3>
                <div className="reports-masonry">
                   {reports.map(r => (
                     <div className="report-card" key={r.id}>
                        <div className="r-top">
                           <span className="r-target">{r.targetName}</span>
                           <span className="pill danger">{r.reason}</span>
                        </div>
                        <p>{r.details}</p>
                        {r.evidence && <img src={r.evidence} className="evidence-img" onClick={() => window.open(r.evidence)} />}
                        <div className="r-actions">
                           <button className="ban-cta" onClick={() => handleAction("ban", { email: r.targetEmail }, `terminate ${r.targetEmail}`)}>Terminate Profile</button>
                        </div>
                     </div>
                   ))}
                </div>
             </div>
           )}

           {activeTab === "messages" && (
             <div className="glass-card fade-in">
                <h3>Support Messages</h3>
                <div className="reports-masonry">
                   {contactMessages.map(m => (
                     <div className="report-card" key={m.id}>
                        <div className="r-top">
                           <span className="r-target">{m.name}</span>
                           <span className="pill gold">{m.subject}</span>
                        </div>
                        <p style={{ color: '#6366f1', fontSize: '12px', marginBottom: '10px' }}>{m.email}</p>
                        <p>{m.message}</p>
                        <div className="r-actions" style={{ marginTop: '15px' }}>
                            <button 
                               onClick={() => {
                                  window.open(`https://mail.google.com/mail/u/0/?authuser=zonemeet84@gmail.com&view=cm&fs=1&to=${m.email}&su=RE: ${encodeURIComponent(m.subject)}&body=Hi ${encodeURIComponent(m.name)},%0A%0AThank you for contacting ZoneMeet Support.%0A%0A`, "_blank");
                                 const token = localStorage.getItem("token");
                                 axios.post("https://api.zonemeet.chat/api/admin/messages/delete", { id: m.id }, {
                                   headers: { Authorization: `Bearer ${token}` }
                                 }).then(() => {
                                   setContactMessages(contactMessages.filter(msg => msg.id !== m.id));
                                 }).catch(err => console.error("Error deleting message:", err));
                               }}
                               className="ban-cta" 
                               style={{ background: '#6366f1', color: 'white', border: 'none', padding: '10px', borderRadius: '8px', cursor: 'pointer', display: 'block', width: '100%' }}
                            >
                               Reply via Gmail
                            </button>
                        </div>
                     </div>
                   ))}
                   {contactMessages.length === 0 && <p style={{ color: 'var(--text-dim)' }}>No messages yet.</p>}
                </div>
             </div>
           )}
        </div>
      </main>

      {/* COMMAND MODAL */}
      {editingUser && (
        <div className="command-overlay">
           <div className="command-modal">
              <div className="modal-header">
                 <h2>Profile Authority: {editingUser.name}</h2>
                 <button className="close-x" onClick={() => setEditingUser(null)}>&times;</button>
              </div>
              
              <div className="modal-body">
                 <div className="input-group">
                    <label>Access Level</label>
                    <select 
                       value={editForm.premium} 
                       onChange={(e) => {
                          const isPrem = e.target.value === "true";
                          setEditForm({...editForm, premium: isPrem, planName: isPrem ? "Prime" : "Free"});
                       }}
                    >
                       <option value="false">Standard Access</option>
                       <option value="true">Premium Privilege</option>
                    </select>
                 </div>

                 {editForm.premium && (
                   <div className="input-group slide-down">
                      <label>Assigned Plan</label>
                      <select value={editForm.planName} onChange={(e) => setEditForm({...editForm, planName: e.target.value})}>
                         <option value="Starter">Starter (₹149)</option>
                         <option value="Prime">Prime (₹599)</option>
                         <option value="Silver">Silver (₹1599)</option>
                         <option value="VIP Elite">VIP Elite (₹999)</option>
                      </select>
                   </div>
                 )}

                 <div className="input-group check-group">
                    <input type="checkbox" id="vip" checked={editForm.isVIP} onChange={(e) => setEditForm({...editForm, isVIP: e.target.checked})} />
                    <label htmlFor="vip">Assign VIP Authenticity Badge</label>
                 </div>

                 <button className="execute-btn" onClick={() => handleAction("update-user-premium", { email: editingUser.email, ...editForm }, `apply changes to ${editingUser.name}`)}>
                    Execute Command
                 </button>
              </div>
           </div>
        </div>
      )}

      <style jsx global>{`
        :root {
           --primary: #6366f1;
           --secondary: #ec4899;
           --bg: #030712;
           --card: rgba(17, 24, 39, 0.7);
           --border: rgba(255, 255, 255, 0.08);
           --text: #f3f4f6;
           --text-dim: #9ca3af;
        }

        * { box-sizing: border-box; }
        body { margin: 0; background: var(--bg); color: var(--text); font-family: 'Outfit', sans-serif; overflow-x: hidden; }

        .admin-wrapper { display: flex; min-height: 100vh; background: radial-gradient(circle at 0% 0%, rgba(99, 102, 241, 0.15) 0%, transparent 50%), radial-gradient(circle at 100% 100%, rgba(236, 72, 153, 0.1) 0%, transparent 50%); }

        /* GLASS SIDEBAR */
        .sidebar-glass { width: 280px; height: 100vh; background: rgba(3, 7, 18, 0.6); backdrop-filter: blur(20px); border-right: 1px solid var(--border); padding: 40px 20px; position: fixed; display: flex; flex-direction: column; }
        .brand { display: flex; align-items: center; gap: 15px; margin-bottom: 50px; padding: 0 10px; }
        .brand-icon { width: 40px; height: 40px; background: linear-gradient(135deg, var(--primary), var(--secondary)); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 20px; box-shadow: 0 10px 20px rgba(99, 102, 241, 0.3); }
        .brand h2 { font-size: 22px; font-weight: 900; margin: 0; letter-spacing: -1px; }
        .brand h2 span { color: var(--text-dim); font-weight: 400; font-size: 16px; }

        .nav-menu { flex: 1; }
        .nav-item { padding: 14px 20px; border-radius: 16px; display: flex; align-items: center; gap: 15px; color: var(--text-dim); cursor: pointer; transition: 0.3s; margin-bottom: 8px; position: relative; font-weight: 600; }
        .nav-item i { font-size: 18px; width: 24px; text-align: center; }
        .nav-item:hover { background: rgba(255,255,255,0.03); color: var(--text); }
        .nav-item.active { background: rgba(99, 102, 241, 0.1); color: var(--primary); }
        .active-glow { position: absolute; left: -20px; height: 24px; width: 4px; background: var(--primary); border-radius: 0 10px 10px 0; box-shadow: 10px 0 20px var(--primary); }

        .sidebar-footer { padding-top: 20px; border-top: 1px solid var(--border); }
        .sys-status { display: flex; align-items: center; gap: 10px; font-size: 12px; color: var(--text-dim); }
        .dot.online { width: 8px; height: 8px; background: #10b981; border-radius: 50%; box-shadow: 0 0 10px #10b981; }

        /* CONTENT */
        .content-area { margin-left: 280px; flex: 1; padding: 40px 60px; }
        .glass-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 50px; background: rgba(255,255,255,0.02); padding: 20px 30px; border-radius: 24px; border: 1px solid var(--border); backdrop-filter: blur(10px); }
        .header-left .breadcrumb { font-size: 12px; color: var(--text-dim); margin-bottom: 5px; display: block; }
        .header-left h1 { margin: 0; font-size: 28px; font-weight: 900; letter-spacing: -1px; }

        .header-right { display: flex; align-items: center; gap: 30px; }
        .search-pill { background: rgba(0,0,0,0.2); padding: 10px 20px; border-radius: 50px; border: 1px solid var(--border); display: flex; align-items: center; gap: 10px; }
        .search-pill input { background: none; border: none; color: white; outline: none; font-family: inherit; width: 150px; font-size: 14px; }
        
        .admin-badge { display: flex; align-items: center; gap: 12px; background: rgba(255,255,255,0.03); padding: 6px 15px 6px 6px; border-radius: 50px; cursor: pointer; transition: 0.2s; border: 1px solid var(--border); }
        .admin-badge img { width: 34px; height: 34px; border-radius: 50%; object-fit: cover; }
        .admin-meta { display: flex; flex-direction: column; }
        .admin-meta strong { font-size: 13px; }
        .admin-meta small { font-size: 10px; color: var(--primary); font-weight: 800; text-transform: uppercase; }
        .admin-badge i { font-size: 10px; color: var(--text-dim); }
        .admin-badge:hover { background: rgba(255,255,255,0.08); transform: translateY(-2px); }

        /* STAT CARDS */
        .stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 25px; margin-bottom: 40px; }
        .neo-card { padding: 2px; border-radius: 30px; transition: 0.3s; cursor: pointer; }
        .neo-card:hover { transform: translateY(-10px) scale(1.02); }
        .gradient-1 { background: linear-gradient(135deg, #6366f1, #818cf8); }
        .gradient-2 { background: linear-gradient(135deg, #10b981, #34d399); }
        .gradient-3 { background: linear-gradient(135deg, #f59e0b, #fbbf24); }
        .gradient-4 { background: linear-gradient(135deg, #ef4444, #f87171); }
        
        .card-inner { background: var(--bg); border-radius: 28px; padding: 25px; display: flex; align-items: center; gap: 20px; height: 100%; }
        .icon-box { width: 50px; height: 50px; background: rgba(255,255,255,0.03); border-radius: 15px; display: flex; align-items: center; justify-content: center; font-size: 22px; color: var(--primary); border: 1px solid var(--border); }
        .data p { margin: 0; font-size: 12px; color: var(--text-dim); font-weight: 600; }
        .data h2 { margin: 5px 0; font-size: 26px; font-weight: 900; }
        .trend { font-size: 10px; font-weight: 800; background: rgba(16, 185, 129, 0.1); color: #10b981; padding: 3px 8px; border-radius: 20px; }
        .trend.red { background: rgba(239, 68, 68, 0.1); color: #ef4444; }

        /* GRID */
        .main-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 25px; }
        .glass-card { background: var(--card); border-radius: 35px; border: 1px solid var(--border); padding: 30px; backdrop-filter: blur(10px); }
        .chart-wrapper { height: 200px; margin-top: 20px; position: relative; }
        .chart-svg { width: 100%; height: 100%; }
        .pill-selector { display: flex; gap: 10px; background: rgba(0,0,0,0.3); padding: 5px; border-radius: 15px; }
        .pill-selector button { background: none; border: none; color: var(--text-dim); padding: 6px 15px; border-radius: 10px; font-size: 11px; font-weight: 700; cursor: pointer; transition: 0.2s; }
        .pill-selector button.active { background: var(--primary); color: white; box-shadow: 0 5px 15px rgba(99, 102, 241, 0.3); }

        .live-item { display: flex; align-items: center; gap: 15px; margin-bottom: 15px; padding: 12px; background: rgba(255,255,255,0.02); border-radius: 18px; border: 1px solid transparent; transition: 0.2s; }
        .live-item:hover { background: rgba(255,255,255,0.05); border-color: var(--border); }
        .avatar-mini { width: 36px; height: 36px; background: var(--primary); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 14px; }
        .item-meta { flex: 1; }
        .item-meta strong { font-size: 14px; display: block; }
        .item-meta small { font-size: 11px; color: var(--text-dim); }
        .status-pulse { width: 8px; height: 8px; background: #10b981; border-radius: 50%; position: relative; }
        .status-pulse::after { content: ''; position: absolute; width: 100%; height: 100%; background: inherit; border-radius: inherit; animation: pulse 1.5s infinite; }

        /* REVENUE */
        .revenue-summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 25px; margin-bottom: 40px; }
        .rev-box { background: var(--card); padding: 35px; border-radius: 35px; border: 1px solid var(--border); }
        .rev-box p { color: var(--text-dim); font-size: 14px; font-weight: 600; margin: 0; }
        .rev-box h1 { font-size: 36px; font-weight: 900; margin: 10px 0 0; letter-spacing: -1px; }
        .rev-box.featured { background: linear-gradient(135deg, var(--primary), #818cf8); border: none; }
        .rev-box.featured p { color: rgba(255,255,255,0.7); }

        /* TABLE */
        .modern-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        .modern-table th { text-align: left; padding: 20px; color: var(--text-dim); font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; border-bottom: 1px solid var(--border); }
        .modern-table td { padding: 20px; border-bottom: 1px solid rgba(255,255,255,0.02); font-size: 14px; vertical-align: middle; }
        .user-id { display: flex; align-items: center; gap: 15px; }
        .user-id img { width: 38px; height: 38px; border-radius: 12px; }
        .user-id div { display: flex; flex-direction: column; }
        .user-id small { color: var(--text-dim); font-size: 11px; }
        .pill { padding: 5px 12px; border-radius: 10px; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; }
        .pill.blue { background: rgba(99, 102, 241, 0.1); color: var(--primary); }
        .pill.gold { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
        .pill.slate { background: rgba(156, 163, 175, 0.1); color: var(--text-dim); }
        .pill.danger { background: rgba(239, 68, 68, 0.1); color: #ef4444; }

        .manage-btn { background: rgba(255,255,255,0.03); border: 1px solid var(--border); color: white; padding: 8px 18px; border-radius: 12px; cursor: pointer; font-weight: 700; font-size: 12px; transition: 0.2s; }
        .manage-btn:hover { background: var(--primary); border-color: var(--primary); transform: translateY(-2px); }

        /* REPORTS */
        .reports-masonry { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; margin-top: 25px; }
        .report-card { background: rgba(255,255,255,0.02); padding: 25px; border-radius: 24px; border: 1px solid var(--border); }
        .r-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
        .r-target { font-weight: 900; font-size: 16px; }
        .evidence-img { width: 100%; border-radius: 16px; margin: 15px 0; cursor: pointer; border: 1px solid var(--border); }
        .ban-cta { width: 100%; background: #ef4444; color: white; border: none; padding: 12px; border-radius: 12px; font-weight: 900; cursor: pointer; transition: 0.3s; }
        .ban-cta:hover { background: #dc2626; box-shadow: 0 0 20px rgba(239, 68, 68, 0.4); }

        /* MODAL */
        .command-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); backdrop-filter: blur(10px); z-index: 2000; display: flex; align-items: center; justify-content: center; }
        .command-modal { background: #030712; border: 1px solid var(--border); width: 480px; border-radius: 40px; overflow: hidden; box-shadow: 0 0 100px rgba(99, 102, 241, 0.2); }
        .modal-header { padding: 30px; background: rgba(255,255,255,0.02); border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; }
        .modal-header h2 { margin: 0; font-size: 20px; font-weight: 900; }
        .close-x { background: none; border: none; color: var(--text-dim); font-size: 28px; cursor: pointer; }
        .modal-body { padding: 35px; }
        .input-group { margin-bottom: 25px; }
        .input-group label { display: block; font-size: 11px; font-weight: 900; color: var(--text-dim); text-transform: uppercase; margin-bottom: 10px; letter-spacing: 1px; }
        .input-group select { width: 100%; background: rgba(255,255,255,0.03); border: 1px solid var(--border); padding: 15px; border-radius: 16px; color: white; outline: none; font-family: inherit; }
        .check-group { display: flex; align-items: center; gap: 12px; }
        .check-group input { width: 20px; height: 20px; accent-color: var(--primary); }
        .check-group label { margin: 0; text-transform: none; font-size: 14px; color: var(--text); }
        .execute-btn { width: 100%; background: var(--primary); color: white; border: none; padding: 18px; border-radius: 18px; font-weight: 900; font-size: 16px; cursor: pointer; margin-top: 10px; box-shadow: 0 10px 30px rgba(99, 102, 241, 0.3); }

        /* LOADING */
        .loading-container { height: 100vh; background: var(--bg); display: flex; flex-direction: column; align-items: center; justify-content: center; }
        .loader-glow { width: 100px; height: 100px; border: 4px solid var(--border); border-top-color: var(--primary); border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 30px; }

        @keyframes spin { to { transform: rotate(360deg); } }
        .coin-gradient { background: linear-gradient(135deg, #1e293b, #334155); border: 1px solid rgba(251, 191, 36, 0.2); }
        .icon-box.gold { color: #fbbf24; }
        .icon-box.blue { color: #60a5fa; }
        .icon-box.purple { color: #a78bfa; }
        .icon-box.green { color: #34d399; }
        .trend.gold { background: rgba(251, 191, 36, 0.1); color: #fbbf24; }
        .trend.purple { background: rgba(167, 139, 250, 0.1); color: #a78bfa; }
        .trend.green { background: rgba(52, 211, 153, 0.1); color: #34d399; }
        @keyframes pulse { 0% { transform: scale(1); opacity: 0.5; } 100% { transform: scale(2.5); opacity: 0; } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in { animation: fadeIn 0.4s ease-out; }
        .slide-down { animation: fadeIn 0.3s ease-out; }
        .dashboard-header-flex { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; }
        .guardian-status { background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.2); padding: 12px 25px; border-radius: 20px; display: flex; align-items: center; gap: 15px; color: #10b981; }
        .pulse-icon { width: 40px; height: 40px; background: rgba(16, 185, 129, 0.2); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 20px; position: relative; }
        .pulse-icon::after { content: ''; position: absolute; width: 100%; height: 100%; border: 2px solid #10b981; border-radius: inherit; animation: pulse 2s infinite; }
        .guardian-status strong { display: block; font-size: 14px; }
        .guardian-status small { font-size: 11px; opacity: 0.8; }

        @media (max-width: 768px) {
           .admin-wrapper { flex-direction: column; }
           .sidebar-glass { position: relative; width: 100%; height: auto; border-right: none; border-bottom: 1px solid var(--border); padding: 20px; z-index: 10; }
           .brand { justify-content: center; margin-bottom: 20px; }
           .nav-menu { display: flex; overflow-x: auto; flex-wrap: nowrap; gap: 10px; padding-bottom: 10px; }
           .nav-item { flex: 0 0 auto; padding: 10px 15px; margin-bottom: 0; }
           .sidebar-footer { display: none; }
           
           .content-area { margin-left: 0; padding: 15px; width: 100vw; overflow-x: hidden; }
           .glass-header { flex-direction: column; gap: 15px; padding: 15px; align-items: stretch; text-align: center; }
           .header-left h1 { font-size: 22px; }
           .header-right { flex-direction: column; gap: 15px; width: 100%; }
           .search-pill { width: 100%; justify-content: center; }
           .search-pill input { width: 100%; }
           .admin-badge { justify-content: center; }

           .stats-row { grid-template-columns: 1fr !important; gap: 15px; }
           .main-grid { grid-template-columns: 1fr; }
           .revenue-summary { grid-template-columns: 1fr; }
           .reports-masonry { grid-template-columns: 1fr; }
           
           .table-box { padding: 15px; overflow-x: auto; }
           .modern-table { display: block; width: 100%; overflow-x: auto; white-space: nowrap; }
           
           .command-modal { width: 95%; max-width: none; }
           .modal-header { padding: 20px; }
           .modal-body { padding: 20px; }

           .login-card { padding: 2rem 1.5rem; width: 90%; }
           .zonemeet-logo { font-size: 2.5rem; }
           h1 { font-size: 1.5rem; }
           .otp-btn { padding: 0 1rem; font-size: 0.75rem; }
        }
      `}</style>
    </div>
  );
}
