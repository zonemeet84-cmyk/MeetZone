import { useState, useEffect, useRef } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import axios from "axios";
import io from "socket.io-client";

export default function Friends() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [socket, setSocket] = useState(null);
  const [isOnline, setIsOnline] = useState(true);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  
  const [incomingCall, setIncomingCall] = useState(null); // { fromUser, fromSocketId, roomId }
  const [activeRoom, setActiveRoom] = useState(null);
  const [showPremiumPopup, setShowPremiumPopup] = useState(false);

  useEffect(() => {
    const updateOnlineStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);
    setIsOnline(navigator.onLine);
    return () => {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
    };
  }, []);

  // Helper to get Country Flag Image URL
  const getFlagUrl = (countryCode) => {
    if (!countryCode || countryCode.length !== 2) return null;
    return `https://flagcdn.com/w20/${countryCode.toLowerCase()}.png`;
  };

  // Helper to convert ISO code to Full Country Name
  const getCountryName = (countryCode) => {
    if (!countryCode) return "Unknown";
    try {
      const displayNames = new Intl.DisplayNames(['en'], { type: 'region' });
      return displayNames.of(countryCode.toUpperCase());
    } catch (e) {
      return countryCode;
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    const storedUser = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")) : null;
    if (!storedUser || !storedUser.id) {
      router.push("/login");
      return;
    }
    setUser(storedUser);

    const newSocket = io("https://api.zonemeet.chat");
    setSocket(newSocket);

    newSocket.on("connect", () => {
      newSocket.emit("register-user", storedUser.id);
      setIsSocketConnected(true);
    });

    newSocket.on("disconnect", () => {
      setIsSocketConnected(false);
    });

    newSocket.on("friend-status", ({ friendId, online }) => {
      setFriends(prev => prev.map(f => f.id === friendId ? { ...f, online } : f));
    });

    newSocket.on("incoming-direct-call", (callInfo) => {
      setIncomingCall(callInfo);
    });
    
    newSocket.on("direct-call-accepted", ({ roomId }) => {
      router.push(`/chat?room=${roomId}`);
    });

    newSocket.on("friend-request-received", () => {
      fetchFriends(token);
    });
    
    newSocket.on("direct-call-rejected", () => {
      alert("Call was declined.");
    });

    fetchFriends(token);

    return () => {
      newSocket.disconnect();
    };
  }, [router]);

  const fetchFriends = async (token) => {
    try {
      const res = await axios.get("https://api.zonemeet.chat/api/friends/list", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFriends(res.data.friends);
      setRequests(res.data.requests);
    } catch (err) {
      console.error("Failed to fetch friends", err);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const token = localStorage.getItem("token");
    try {
      const res = await axios.get(`https://api.zonemeet.chat/api/users/search?query=${searchQuery}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSearchResults(res.data);
    } catch (err) {
      alert("No users found matching your search.");
      setSearchResults([]);
    }
  };

  const sendRequest = async (targetId) => {
    const token = localStorage.getItem("token");
    try {
      await axios.post("https://api.zonemeet.chat/api/friends/request", { targetId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("Friend request sent!");
      setSearchResults(prev => prev.filter(u => u.id !== targetId));
    } catch (err) {
      if (err.response?.data?.requiresPremium) {
        setShowPremiumPopup(true);
      } else {
        alert(err.response?.data?.message || "Failed to send request");
      }
    }
  };

  const acceptRequest = async (requesterId) => {
    const token = localStorage.getItem("token");
    try {
      await axios.post("https://api.zonemeet.chat/api/friends/accept", { requesterId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchFriends(token);
    } catch (err) {
      if (err.response?.data?.requiresPremium) {
        setShowPremiumPopup(true);
      } else {
        alert(err.response?.data?.message || "Failed to accept");
      }
    }
  };

  const startDirectCall = (friend) => {
    if (!friend.online) {
      alert("User is offline!");
      return;
    }
    const roomId = `room_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    setActiveRoom(roomId);
    socket.emit("direct-call-request", { toUserId: friend.id, fromUser: user, roomId });
    alert("Ringing " + friend.name + "...");
  };

  const acceptCall = () => {
    socket.emit("direct-call-accept", { toSocketId: incomingCall.fromSocketId, roomId: incomingCall.roomId });
    router.push(`/chat?room=${incomingCall.roomId}`);
  };

  const rejectCall = () => {
    socket.emit("direct-call-reject", { toSocketId: incomingCall.fromSocketId });
    setIncomingCall(null);
  };

  if (!user) return <div className="loading-dots">Loading...</div>;

  return (
    <div className="container">
      <Head>
        <title>Friends | ZoneMeet</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </Head>

      <div className="bg-gradient" />

      {/* Premium Glass Header */}
      <header className="premium-header">
        <div className="header-content">
          <div className="brand-group" onClick={() => router.push("/")}>
            <h1>ZoneMeet</h1>
          </div>
          
          <div className="header-actions">
            <button className="home-btn" onClick={() => router.push("/")}>
              <i className="fa-solid fa-house"></i> Home
            </button>
            <div className="user-profile">
              <div className={`status-indicator ${isOnline && isSocketConnected ? 'online' : 'offline'}`}>
                <span className="pulse-dot"></span>
                <span className="status-text">{isOnline && isSocketConnected ? 'Connected' : !isOnline ? 'No Internet' : 'Connecting...'}</span>
              </div>
              <span className="user-name">{user.name}</span>
            </div>
          </div>
        </div>
      </header>

      {incomingCall && (
        <div className="modal-overlay">
          <div className="modal-card incoming-call-card">
            <div className="call-avatar"><i className="fa-solid fa-phone-volume ring-animation"></i></div>
            <h2>Incoming Call...</h2>
            <p><strong>{incomingCall.fromUser.name}</strong> is calling you!</p>
            <div className="modal-actions">
              <button className="btn-accept" onClick={acceptCall}>Accept</button>
              <button className="btn-decline" onClick={rejectCall}>Decline</button>
            </div>
          </div>
        </div>
      )}

      {showPremiumPopup && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="premium-icon">👑</div>
            <h2>Friend Limit Reached</h2>
            <p>Free plan allows a maximum of 5 friends. Upgrade to a premium subscription to add more friends and unlock exclusive features!</p>
            <div className="modal-actions">
              <button className="btn-premium" onClick={() => router.push("/")}>Upgrade Now</button>
              <button className="btn-secondary" onClick={() => setShowPremiumPopup(false)}>Maybe Later</button>
            </div>
          </div>
        </div>
      )}

      <main className="dashboard-hero">
        
        {/* LEFT PANEL: Friends List */}
        <section className="friends-panel">
          <div className="glass-panel main-panel">
            <div className="panel-header">
              <h2>My Friends</h2>
              <span className="friend-count">{friends.length} Friends</span>
            </div>
            <div className="divider"></div>
            
            {friends.length === 0 ? (
              <div className="empty-state">
                <i className="fa-solid fa-user-group"></i>
                <p>You have no friends yet.</p>
                <span>Search for a friend on the right to start connecting!</span>
              </div>
            ) : (
              <div className="friends-list">
                {friends.map(f => (
                  <div key={f.id} className="friend-item">
                    <div className="friend-info">
                      <div className={`status-ring ${f.online ? 'online' : 'offline'}`}>
                        <div className="avatar-placeholder">{f.name.charAt(0).toUpperCase()}</div>
                      </div>
                      <div className="friend-details">
                        <h3 className="friend-name">
                          {f.name}
                          {getFlagUrl(f.country) && <img src={getFlagUrl(f.country)} alt={f.country} title={getCountryName(f.country)} className="country-flag" />}
                        </h3>
                        <span className={`status-label ${f.online ? 'online' : 'offline'}`}>
                          {f.online ? 'Online' : 'Offline'}
                        </span>
                      </div>
                    </div>
                    <button 
                      className="call-btn" 
                      disabled={!f.online}
                      onClick={() => startDirectCall(f)}
                    >
                      <i className="fa-solid fa-phone"></i> Call
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* RIGHT PANEL: Search & Requests */}
        <section className="actions-panel">
          
          <div className="glass-panel">
            <div className="panel-header">
              <h3>Add Friend</h3>
            </div>
            <form className="friend-search-form" onSubmit={handleSearch}>
              <div className="search-input-wrapper">
                <i className="fa-solid fa-search"></i>
                <input 
                  type="text" 
                  value={searchQuery} 
                  onChange={(e) => setSearchQuery(e.target.value)} 
                  placeholder="Search by name or email" 
                  required 
                />
              </div>
              <button type="submit" className="btn-search">Search</button>
            </form>
            
            {searchResults.length > 0 && (
              <div className="search-results-list" style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {searchResults.map(user => (
                  <div key={user.id} className="search-result-card" style={{ marginTop: 0 }}>
                    <div className="result-info">
                      <div className="avatar-mini">{user.name.charAt(0).toUpperCase()}</div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span className="result-name">{user.name}</span>
                        {user.email && <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{user.email}</span>}
                      </div>
                    </div>
                    <button className="btn-add" onClick={() => sendRequest(user.id)}>Add</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="glass-panel">
            <div className="panel-header">
              <h3>Friend Requests</h3>
              {requests.length > 0 && <span className="request-badge">{requests.length}</span>}
            </div>
            
            {requests.length === 0 ? (
              <div className="empty-state small">
                <i className="fa-regular fa-bell"></i>
                <p>No pending requests.</p>
              </div>
            ) : (
              <div className="requests-list">
                {requests.map(r => (
                  <div key={r.id} className="request-item">
                    <div className="request-info">
                      <div className="avatar-mini">{r.name.charAt(0).toUpperCase()}</div>
                      <div className="request-details">
                        <span className="request-name">{r.name}</span>
                        {getFlagUrl(r.country) && <img src={getFlagUrl(r.country)} alt={r.country} title={getCountryName(r.country)} className="country-flag" />}
                      </div>
                    </div>
                    <button className="btn-accept-small" onClick={() => acceptRequest(r.id)}>Accept</button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </section>
      </main>

    <style jsx>{`
      .container {
        min-height: 100vh;
        color: #fff;
        font-family: 'Outfit', sans-serif;
        padding-bottom: 50px;
      }
      
      .bg-gradient {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: radial-gradient(circle at 20% 0%, rgba(99, 102, 241, 0.15) 0%, transparent 40%),
                    radial-gradient(circle at 80% 100%, rgba(236, 72, 153, 0.1) 0%, transparent 40%),
                    #030712;
        z-index: -1;
      }

      /* Premium Header */
      .premium-header {
        position: sticky;
        top: 0;
        z-index: 100;
        background: rgba(3, 7, 18, 0.7);
        backdrop-filter: blur(20px);
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        padding: 15px 0;
      }

      .header-content {
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .brand-group {
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .brand-group h1 {
        margin: 0;
        font-size: 1.8rem;
        font-weight: 800;
        background: linear-gradient(135deg, #a855f7, #ec4899);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        letter-spacing: -0.5px;
      }

      .header-actions {
        display: flex;
        align-items: center;
        gap: 20px;
      }

      .home-btn {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: #e2e8f0;
        padding: 8px 16px;
        border-radius: 20px;
        font-weight: 600;
        font-size: 0.9rem;
        cursor: pointer;
        transition: all 0.3s;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .home-btn:hover {
        background: rgba(255, 255, 255, 0.1);
        transform: translateY(-2px);
      }

      .user-profile {
        display: flex;
        align-items: center;
        gap: 15px;
      }

      .status-indicator {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 12px;
        border-radius: 20px;
        font-size: 0.8rem;
        font-weight: 700;
        border: 1px solid;
      }

      .status-indicator.online {
        background: rgba(46, 204, 113, 0.1);
        border-color: rgba(46, 204, 113, 0.3);
        color: #2ecc71;
      }

      .status-indicator.offline {
        background: rgba(231, 76, 60, 0.1);
        border-color: rgba(231, 76, 60, 0.3);
        color: #e74c3c;
      }

      .pulse-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: currentColor;
      }

      .status-indicator.online .pulse-dot {
        box-shadow: 0 0 10px #2ecc71;
        animation: pulse 2s infinite;
      }

      @keyframes pulse {
        0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(46, 204, 113, 0.7); }
        70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(46, 204, 113, 0); }
        100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(46, 204, 113, 0); }
      }

      .user-name {
        font-weight: 600;
        color: #f1f5f9;
        font-size: 1rem;
      }

      /* Dashboard Layout */
      .dashboard-hero {
        max-width: 1200px;
        margin: 40px auto;
        padding: 0 20px;
        display: grid;
        grid-template-columns: 1fr 400px;
        gap: 30px;
        align-items: start;
      }

      /* Glass Panels */
      .glass-panel {
        background: rgba(17, 24, 39, 0.6);
        backdrop-filter: blur(16px);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 24px;
        padding: 30px;
        box-shadow: 0 20px 40px rgba(0,0,0,0.2);
      }

      .main-panel {
        min-height: 60vh;
      }

      .panel-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
      }

      .panel-header h2 {
        margin: 0;
        font-size: 1.5rem;
        font-weight: 700;
        color: #fff;
      }

      .panel-header h3 {
        margin: 0;
        font-size: 1.2rem;
        font-weight: 600;
        color: #e2e8f0;
      }

      .friend-count {
        background: rgba(99, 102, 241, 0.2);
        color: #a5b4fc;
        padding: 4px 12px;
        border-radius: 12px;
        font-size: 0.85rem;
        font-weight: 600;
      }
      
      .request-badge {
        background: #ec4899;
        color: white;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        font-size: 0.8rem;
        font-weight: 700;
      }

      .divider {
        height: 1px;
        background: linear-gradient(90deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%);
        margin-bottom: 25px;
      }

      /* Empty States */
      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        padding: 60px 20px;
        color: #94a3b8;
      }

      .empty-state.small {
        padding: 30px 20px;
      }

      .empty-state i {
        font-size: 3rem;
        margin-bottom: 15px;
        opacity: 0.5;
      }

      .empty-state p {
        margin: 0 0 8px 0;
        font-size: 1.2rem;
        color: #cbd5e1;
        font-weight: 500;
      }

      .empty-state span {
        font-size: 0.9rem;
      }

      /* Friend List */
      .friends-list {
        display: flex;
        flex-direction: column;
        gap: 15px;
      }

      .friend-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.05);
        padding: 16px 20px;
        border-radius: 16px;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .friend-item:hover {
        background: rgba(255, 255, 255, 0.06);
        transform: translateY(-3px);
        box-shadow: 0 10px 20px rgba(0,0,0,0.2);
        border-color: rgba(255, 255, 255, 0.1);
      }

      .friend-info {
        display: flex;
        align-items: center;
        gap: 16px;
        flex: 1;
        min-width: 0; /* allows text truncation */
      }

      .status-ring {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        padding: 3px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .status-ring.online {
        background: linear-gradient(135deg, #2ecc71, #10b981);
      }
      
      .status-ring.offline {
        background: rgba(255,255,255,0.1);
      }

      .avatar-placeholder {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        background: #1e293b;
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.2rem;
        font-weight: 700;
        border: 2px solid #0f172a;
      }

      .friend-details {
        display: flex;
        flex-direction: column;
        gap: 4px;
        overflow: hidden;
      }

      .friend-name {
        margin: 0;
        font-size: 1.1rem;
        font-weight: 600;
        color: #f8fafc;
        display: flex;
        align-items: center;
        gap: 8px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .country-flag {
        width: 18px;
        height: 13px;
        border-radius: 2px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        flex-shrink: 0;
      }

      .status-label {
        font-size: 0.85rem;
        font-weight: 500;
      }
      
      .status-label.online { color: #2ecc71; }
      .status-label.offline { color: #64748b; }

      .call-btn {
        background: linear-gradient(135deg, #6366f1, #8b5cf6);
        color: white;
        border: none;
        padding: 10px 24px;
        border-radius: 12px;
        font-weight: 600;
        font-size: 0.95rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
        transition: all 0.3s;
        box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3);
        flex-shrink: 0;
      }

      .call-btn:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(99, 102, 241, 0.5);
      }

      .call-btn:disabled {
        background: rgba(255, 255, 255, 0.05);
        color: #64748b;
        box-shadow: none;
        cursor: not-allowed;
      }

      /* Actions Panel */
      .actions-panel {
        display: flex;
        flex-direction: column;
        gap: 30px;
      }

      .friend-search-form {
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin-top: 20px;
      }

      .search-input-wrapper {
        position: relative;
        display: flex;
        align-items: center;
      }

      .search-input-wrapper i {
        position: absolute;
        left: 16px;
        color: #94a3b8;
      }

      .search-input-wrapper input {
        width: 100%;
        background: rgba(0, 0, 0, 0.3);
        border: 1px solid rgba(255, 255, 255, 0.1);
        padding: 14px 16px 14px 45px;
        border-radius: 12px;
        color: white;
        font-size: 0.95rem;
        transition: all 0.3s;
        font-family: inherit;
      }

      .search-input-wrapper input:focus {
        outline: none;
        border-color: #6366f1;
        background: rgba(0, 0, 0, 0.5);
        box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
      }

      .btn-search {
        background: rgba(255, 255, 255, 0.1);
        color: white;
        border: 1px solid rgba(255, 255, 255, 0.1);
        padding: 14px;
        border-radius: 12px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s;
      }

      .btn-search:hover {
        background: rgba(255, 255, 255, 0.15);
      }

      .search-result-card {
        margin-top: 20px;
        padding: 15px;
        background: rgba(99, 102, 241, 0.1);
        border: 1px solid rgba(99, 102, 241, 0.3);
        border-radius: 12px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        animation: fadeIn 0.3s ease;
      }

      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
      }

      .result-info {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .avatar-mini {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: #334155;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        color: white;
      }

      .result-name {
        font-weight: 600;
        color: white;
      }

      .btn-add {
        background: #10b981;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
        transition: 0.3s;
      }

      .btn-add:hover {
        background: #059669;
        transform: scale(1.05);
      }

      /* Requests List */
      .requests-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .request-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: rgba(0, 0, 0, 0.2);
        padding: 12px;
        border-radius: 12px;
        border: 1px solid rgba(255,255,255,0.05);
      }

      .request-info {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .request-details {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .request-name {
        font-weight: 600;
        font-size: 0.95rem;
        color: #f1f5f9;
      }

      .btn-accept-small {
        background: rgba(99, 102, 241, 0.2);
        color: #818cf8;
        border: 1px solid rgba(99, 102, 241, 0.4);
        padding: 6px 14px;
        border-radius: 8px;
        font-weight: 600;
        font-size: 0.85rem;
        cursor: pointer;
        transition: 0.3s;
      }

      .btn-accept-small:hover {
        background: #6366f1;
        color: white;
      }

      /* Modals */
      .modal-overlay {
        position: fixed;
        top: 0; left: 0; width: 100vw; height: 100vh;
        background: rgba(0, 0, 0, 0.8);
        backdrop-filter: blur(8px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        animation: fadeIn 0.3s ease;
      }

      .modal-card {
        background: rgba(15, 23, 42, 0.95);
        border: 1px solid rgba(255, 255, 255, 0.1);
        padding: 40px;
        border-radius: 24px;
        width: 90%;
        max-width: 450px;
        text-align: center;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
      }

      .modal-card h2 {
        margin: 0 0 10px 0;
        font-size: 1.5rem;
      }

      .modal-card p {
        color: #cbd5e1;
        line-height: 1.5;
        margin-bottom: 25px;
      }

      .premium-icon {
        font-size: 4rem;
        margin-bottom: 15px;
      }

      .modal-actions {
        display: flex;
        gap: 15px;
        justify-content: center;
      }

      .modal-actions button {
        padding: 12px 24px;
        border-radius: 12px;
        font-weight: 600;
        cursor: pointer;
        border: none;
        transition: 0.3s;
      }

      .btn-premium { background: linear-gradient(135deg, #f59e0b, #d97706); color: white; }
      .btn-premium:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(245, 158, 11, 0.4); }
      
      .btn-accept { background: #10b981; color: white; }
      .btn-decline { background: rgba(239, 68, 68, 0.2); color: #ef4444; }
      .btn-secondary { background: rgba(255,255,255,0.1); color: white; }

      .call-avatar {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        background: rgba(99, 102, 241, 0.2);
        color: #818cf8;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 2rem;
        margin: 0 auto 20px auto;
        position: relative;
      }

      .ring-animation {
        animation: ring 1.5s infinite ease-in-out;
      }

      @keyframes ring {
        0% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.2); opacity: 0.8; }
        100% { transform: scale(1); opacity: 1; }
      }

      /* Mobile Responsive */
      @media (max-width: 900px) {
        .dashboard-hero {
          grid-template-columns: 1fr;
        }
        
        .header-content {
          flex-direction: column;
          gap: 15px;
        }
        
        .header-actions {
          width: 100%;
          justify-content: space-between;
        }
        
        .friend-item {
          flex-direction: column;
          gap: 15px;
          align-items: flex-start;
        }
        
        .call-btn {
          width: 100%;
          justify-content: center;
        }
      }
    `}</style>
    </div>
  );
}
