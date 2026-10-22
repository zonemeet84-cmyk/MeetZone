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
  
  const [incomingCall, setIncomingCall] = useState(null); // { fromUser, fromSocketId, roomId, callType }
  const [outgoingCall, setOutgoingCall] = useState(null); // { friend, callType, roomId }
  const [activeRoom, setActiveRoom] = useState(null);
  const [showPremiumPopup, setShowPremiumPopup] = useState(false);
  const [mobileTab, setMobileTab] = useState("friends"); // 'friends' | 'add' | 'requests'
  const [friendSearch, setFriendSearch] = useState("");

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
    
        newSocket.on("direct-call-accepted", ({ roomId, callType }) => {
      setOutgoingCall(null);
      const mode = callType || "video";
      router.push(`/chat?room=${roomId}&mode=${mode}`);
    });

    newSocket.on("friend-request-received", () => {
      fetchFriends(token);
    });
    
    newSocket.on("direct-call-rejected", () => {
      setOutgoingCall(null);
      alert("Call request was declined or user is busy.");
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

    const startDirectCall = (friend, callType = "video") => {
    if (!friend.online) {
      alert(`${friend.name} is currently offline!`);
      return;
    }
    const roomId = `room_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    setActiveRoom(roomId);
    setOutgoingCall({ friend, callType, roomId });
    socket.emit("direct-call-request", { 
      toUserId: friend.id, 
      fromUser: user, 
      roomId, 
      callType 
    });
  };

  const cancelOutgoingCall = () => {
    if (outgoingCall && socket) {
      socket.emit("direct-call-reject", { toSocketId: null });
    }
    setOutgoingCall(null);
  };

  const acceptCall = () => {
    if (!incomingCall) return;
    const mode = incomingCall.callType === "text" ? "text" : "video";
    socket.emit("direct-call-accept", { 
      toSocketId: incomingCall.fromSocketId, 
      roomId: incomingCall.roomId, 
      callType: mode 
    });
    router.push(`/chat?room=${incomingCall.roomId}&mode=${mode}`);
    setIncomingCall(null);
  };

  const rejectCall = () => {
    if (incomingCall && socket) {
      socket.emit("direct-call-reject", { toSocketId: incomingCall.fromSocketId });
    }
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

      {/* Full-Screen Glass Header */}
      <header className="premium-header">
        <div className="header-content">
          <div className="brand-group" onClick={() => router.push("/")}>
            <span className="brand-logo-icon">⚡</span>
            <h1>ZoneMeet</h1>
            <span className="brand-badge">VIP ELITE</span>
          </div>

          <nav className="header-nav">
            <button className="nav-link" onClick={() => router.push("/")}>
              Home
            </button>
            <button className="nav-link active">
              Friends
            </button>
            <button className="nav-link" onClick={() => router.push("/chat?mode=video")}>
              📹 Video Chat
            </button>
            <button className="nav-link" onClick={() => router.push("/chat?mode=text")}>
              💬 Text Chat
            </button>
          </nav>
          
          <div className="header-actions">
            <div className={`status-indicator ${isOnline && isSocketConnected ? 'online' : 'offline'}`}>
              <span className="pulse-dot"></span>
              <span className="status-text">{isOnline && isSocketConnected ? 'Connected' : !isOnline ? 'No Internet' : 'Connecting...'}</span>
            </div>
            <div className="user-profile-pill">
              <span className="user-avatar-badge">{user.name.charAt(0).toUpperCase()}</span>
              <span className="user-name">{user.name}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Tab Switcher */}
      <div className="mobile-tabs-bar">
        <button 
          className={`tab-btn ${mobileTab === 'friends' ? 'active' : ''}`}
          onClick={() => setMobileTab('friends')}
        >
          <span>👥 Friends ({friends.length})</span>
        </button>
        <button 
          className={`tab-btn ${mobileTab === 'add' ? 'active' : ''}`}
          onClick={() => setMobileTab('add')}
        >
          <span>➕ Add Friend</span>
        </button>
        <button 
          className={`tab-btn ${mobileTab === 'requests' ? 'active' : ''}`}
          onClick={() => setMobileTab('requests')}
        >
          <span>🔔 Requests {requests.length > 0 && `(${requests.length})`}</span>
        </button>
      </div>

            {/* Outgoing Calling Popup */}
      {outgoingCall && (
        <div className="modal-overlay">
          <div className="modal-card incoming-call-card outgoing-card">
            <div className="call-avatar pulsing-call">
              {outgoingCall.callType === 'text' ? '💬' : '📹'}
            </div>
            <h2>Calling {outgoingCall.friend.name}...</h2>
            <p>
              Sending request for a{" "}
              <strong style={{ color: outgoingCall.callType === 'text' ? '#00f2fe' : '#b224ef' }}>
                {outgoingCall.callType === 'text' ? 'Private Text Chat' : 'Live Video Call'}
              </strong>
            </p>
            <div className="modal-actions">
              <button className="btn-decline" onClick={cancelOutgoingCall}>Cancel Request</button>
            </div>
          </div>
        </div>
      )}

      {/* Incoming Call Popup */}
      {incomingCall && (
        <div className="modal-overlay">
          <div className="modal-card incoming-call-card">
            <div className="call-avatar pulsing-call">
              {incomingCall.callType === 'text' ? '💬' : '📹'}
            </div>
            <h2>{incomingCall.callType === 'text' ? 'Incoming Text Chat' : 'Incoming Video Call'}</h2>
            <p>
              <strong>{incomingCall.fromUser?.name || 'A Friend'}</strong> sent you a request for a{" "}
              <strong style={{ color: incomingCall.callType === 'text' ? '#00f2fe' : '#b224ef' }}>
                {incomingCall.callType === 'text' ? 'Private Text Chat' : 'Live Video Call'}
              </strong>!
            </p>
            <div className="modal-actions">
              <button className="btn-accept" onClick={acceptCall}>
                ✓ Accept {incomingCall.callType === 'text' ? 'Text Chat' : 'Video Call'}
              </button>
              <button className="btn-decline" onClick={rejectCall}>✕ Decline</button>
            </div>
          </div>
        </div>
      )}

      {/* Full-Screen Modern Dashboard */}
      <main className="dashboard-hero">
        
        {/* LEFT / MAIN PANEL: Friends List */}
        <section className={`friends-panel ${mobileTab !== 'friends' ? 'mobile-hidden' : ''}`}>
          <div className="glass-panel main-panel">
            <div className="panel-header">
              <div className="title-group">
                <h2>My Friends</h2>
                <span className="friend-count-badge">{friends.length} Total</span>
              </div>
              {friends.length > 0 && (
                <div className="friend-search-filter">
                  <span className="filter-icon">🔍</span>
                  <input 
                    type="text" 
                    placeholder="Filter friends..." 
                    value={friendSearch}
                    onChange={(e) => setFriendSearch(e.target.value)}
                  />
                  {friendSearch && (
                    <button className="clear-btn" onClick={() => setFriendSearch("")}>×</button>
                  )}
                </div>
              )}
            </div>

            <div className="divider"></div>
            
            {friends.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon-circle">👥</div>
                <h3>No friends added yet</h3>
                <p>Connect with awesome people in live video or text rooms, or search for users on the right to build your friends list!</p>
                <div className="empty-actions">
                  <button className="empty-cta-btn" onClick={() => router.push("/chat?mode=video")}>
                    📹 Find Strangers in Video Chat
                  </button>
                  <button className="empty-cta-btn cyan" onClick={() => router.push("/chat?mode=text")}>
                    💬 Start Text Chat
                  </button>
                </div>
              </div>
            ) : (
              <div className="friends-list-grid">
                {friends
                  .filter(f => !friendSearch.trim() || f.name.toLowerCase().includes(friendSearch.toLowerCase()))
                  .map(f => (
                    <div key={f.id} className="friend-card">
                      <div className="friend-info">
                        <div className={`avatar-status-wrap ${f.online ? 'is-online' : 'is-offline'}`}>
                          <div className="avatar-placeholder">{f.name.charAt(0).toUpperCase()}</div>
                          <span className="status-dot"></span>
                        </div>
                        <div className="friend-details">
                          <div className="friend-name-row">
                            <h3 className="friend-name">{f.name}</h3>
                            {getFlagUrl(f.country) && (
                              <img 
                                src={getFlagUrl(f.country)} 
                                alt={f.country} 
                                title={getCountryName(f.country)} 
                                className="country-flag" 
                              />
                            )}
                          </div>
                          <span className={`status-pill ${f.online ? 'online' : 'offline'}`}>
                            {f.online ? '🟢 Online & Ready' : '⚪ Offline'}
                          </span>
                        </div>
                      </div>

                                            <div className="friend-call-actions">
                        <button 
                          className={`call-action-btn video ${f.online ? 'active' : 'disabled'}`}
                          disabled={!f.online}
                          onClick={() => startDirectCall(f, 'video')}
                          title={f.online ? `Start video call with ${f.name}` : `${f.name} is offline`}
                        >
                          <span className="call-btn-icon">📹</span>
                          <span>{f.online ? 'Video Call' : 'Offline'}</span>
                        </button>
                        <button 
                          className={`call-action-btn text ${f.online ? 'active' : 'disabled'}`}
                          disabled={!f.online}
                          onClick={() => startDirectCall(f, 'text')}
                          title={f.online ? `Start text chat with ${f.name}` : `${f.name} is offline`}
                        >
                          <span className="call-btn-icon">💬</span>
                          <span>{f.online ? 'Text Chat' : 'Offline'}</span>
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </section>

        {/* RIGHT / SIDE PANEL: Search & Requests */}
        <section className={`actions-panel ${mobileTab === 'friends' ? 'mobile-hidden' : ''}`}>
          
          {/* Add Friend Card */}
          <div className={`glass-panel search-panel ${mobileTab === 'requests' ? 'mobile-hidden' : ''}`}>
            <div className="panel-header">
              <div className="title-group">
                <h3>Add New Friend</h3>
              </div>
            </div>
            
            <form className="friend-search-form" onSubmit={handleSearch}>
              <div className="search-input-wrapper">
                <span className="search-icon">🔍</span>
                <input 
                  type="text" 
                  value={searchQuery} 
                  onChange={(e) => setSearchQuery(e.target.value)} 
                  placeholder="Search by name or email..." 
                  required 
                />
              </div>
              <button type="submit" className="btn-search">Search</button>
            </form>
            
            {searchResults.length > 0 && (
              <div className="search-results-list">
                <div className="results-label">Search Results:</div>
                {searchResults.map(u => (
                  <div key={u.id} className="search-result-card">
                    <div className="result-info">
                      <div className="avatar-mini">{u.name.charAt(0).toUpperCase()}</div>
                      <div className="result-text">
                        <span className="result-name">{u.name}</span>
                        {u.email && <span className="result-email">{u.email}</span>}
                      </div>
                    </div>
                    <button className="btn-add" onClick={() => sendRequest(u.id)}>
                      + Add
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Friend Requests Card */}
          <div className={`glass-panel requests-panel ${mobileTab === 'add' ? 'mobile-hidden' : ''}`}>
            <div className="panel-header">
              <div className="title-group">
                <h3>Pending Requests</h3>
                {requests.length > 0 && (
                  <span className="request-badge">{requests.length}</span>
                )}
              </div>
            </div>
            
            {requests.length === 0 ? (
              <div className="empty-state small">
                <span className="empty-bell">🔔</span>
                <p>No pending friend requests</p>
                <small>Incoming requests will show up here</small>
              </div>
            ) : (
              <div className="requests-list">
                {requests.map(r => (
                  <div key={r.id} className="request-item">
                    <div className="request-info">
                      <div className="avatar-mini">{r.name.charAt(0).toUpperCase()}</div>
                      <div className="request-details">
                        <div className="req-name-row">
                          <span className="request-name">{r.name}</span>
                          {getFlagUrl(r.country) && (
                            <img src={getFlagUrl(r.country)} alt={r.country} title={getCountryName(r.country)} className="country-flag" />
                          )}
                        </div>
                        <span className="req-sub">Wants to connect</span>
                      </div>
                    </div>
                    <button className="btn-accept-small" onClick={() => acceptRequest(r.id)}>
                      ✓ Accept
                    </button>
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
        width: 100%;
        color: #fff;
        font-family: 'Outfit', sans-serif;
        padding-bottom: 60px;
        position: relative;
        overflow-x: hidden;
      }
      
      .bg-gradient {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: radial-gradient(circle at 15% 10%, rgba(99, 102, 241, 0.18) 0%, transparent 45%),
                    radial-gradient(circle at 85% 90%, rgba(236, 72, 153, 0.12) 0%, transparent 45%),
                    #030712;
        z-index: -1;
      }

      /* Full-Screen Glass Header */
      .premium-header {
        position: sticky;
        top: 0;
        z-index: 100;
        background: rgba(3, 7, 18, 0.85);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        width: 100%;
      }

      .header-content {
        max-width: 1600px;
        width: 100%;
        margin: 0 auto;
        padding: 16px 36px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 20px;
      }

      .brand-group {
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 10px;
        user-select: none;
      }

      .brand-logo-icon {
        font-size: 1.4rem;
        background: linear-gradient(135deg, #a855f7, #ec4899);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }

      .brand-group h1 {
        margin: 0;
        font-size: 1.8rem;
        font-weight: 900;
        background: linear-gradient(135deg, #a855f7, #ec4899);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        letter-spacing: -0.5px;
      }

      .brand-badge {
        background: linear-gradient(135deg, #f59e0b, #d97706);
        color: #000;
        font-size: 0.65rem;
        font-weight: 900;
        padding: 3px 8px;
        border-radius: 6px;
        letter-spacing: 0.5px;
      }

      .header-nav {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .nav-link {
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.08);
        color: #cbd5e1;
        padding: 8px 18px;
        border-radius: 9999px;
        font-weight: 600;
        font-size: 0.9rem;
        cursor: pointer;
        transition: all 0.25s;
        font-family: inherit;
      }

      .nav-link:hover {
        background: rgba(255, 255, 255, 0.1);
        color: #fff;
        transform: translateY(-1px);
      }

      .nav-link.active {
        background: linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(168, 85, 247, 0.25));
        border-color: rgba(99, 102, 241, 0.5);
        color: #fff;
        box-shadow: 0 0 15px rgba(99, 102, 241, 0.3);
      }

      .header-actions {
        display: flex;
        align-items: center;
        gap: 16px;
      }

      .status-indicator {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 14px;
        border-radius: 9999px;
        font-size: 0.8rem;
        font-weight: 700;
        border: 1px solid;
      }

      .status-indicator.online {
        background: rgba(16, 185, 129, 0.12);
        border-color: rgba(16, 185, 129, 0.35);
        color: #10b981;
      }

      .status-indicator.offline {
        background: rgba(239, 68, 68, 0.12);
        border-color: rgba(239, 68, 68, 0.35);
        color: #ef4444;
      }

      .pulse-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: currentColor;
      }

      .status-indicator.online .pulse-dot {
        box-shadow: 0 0 10px #10b981;
        animation: statusPulse 2s infinite;
      }

      @keyframes statusPulse {
        0% { transform: scale(0.9); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
        70% { transform: scale(1.1); box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); }
        100% { transform: scale(0.9); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
      }

      .user-profile-pill {
        display: flex;
        align-items: center;
        gap: 10px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        padding: 5px 14px 5px 6px;
        border-radius: 9999px;
      }

      .user-avatar-badge {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: linear-gradient(135deg, #a855f7, #ec4899);
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 800;
        font-size: 0.95rem;
        color: #fff;
      }

      .user-name {
        font-weight: 700;
        font-size: 0.95rem;
        color: #f8fafc;
      }

      /* Mobile Tabs Bar */
      .mobile-tabs-bar {
        display: none;
        width: 100%;
        background: rgba(15, 23, 42, 0.9);
        backdrop-filter: blur(15px);
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        padding: 10px 14px;
        gap: 8px;
        overflow-x: auto;
      }

      .tab-btn {
        flex: 1;
        padding: 10px 12px;
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 12px;
        color: #94a3b8;
        font-size: 0.88rem;
        font-weight: 700;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        white-space: nowrap;
        font-family: inherit;
        transition: all 0.2s;
      }

      .tab-btn.active {
        background: linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(168, 85, 247, 0.25));
        border-color: #6366f1;
        color: #fff;
        box-shadow: 0 0 14px rgba(99, 102, 241, 0.35);
      }

      /* Full-Screen Dashboard Grid */
      .dashboard-hero {
        max-width: 1600px;
        width: 100%;
        margin: 28px auto;
        padding: 0 36px;
        display: grid;
        grid-template-columns: minmax(0, 1fr) 420px;
        gap: 30px;
        align-items: start;
      }

      /* Glass Panels */
      .glass-panel {
        background: rgba(15, 23, 42, 0.7);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 26px;
        padding: 28px 32px;
        box-shadow: 0 25px 60px rgba(0, 0, 0, 0.45);
      }

      .main-panel {
        min-height: 65vh;
      }

      .panel-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 16px;
        margin-bottom: 22px;
        flex-wrap: wrap;
      }

      .title-group {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .panel-header h2 {
        margin: 0;
        font-size: 1.65rem;
        font-weight: 800;
        color: #fff;
        letter-spacing: -0.02em;
      }

      .panel-header h3 {
        margin: 0;
        font-size: 1.3rem;
        font-weight: 700;
        color: #f1f5f9;
      }

      .friend-count-badge {
        background: rgba(99, 102, 241, 0.2);
        color: #a5b4fc;
        border: 1px solid rgba(99, 102, 241, 0.35);
        padding: 4px 14px;
        border-radius: 9999px;
        font-size: 0.85rem;
        font-weight: 700;
      }

      .friend-search-filter {
        position: relative;
        display: flex;
        align-items: center;
        min-width: 220px;
      }

      .friend-search-filter input {
        width: 100%;
        background: rgba(0, 0, 0, 0.35);
        border: 1px solid rgba(255, 255, 255, 0.1);
        padding: 8px 30px 8px 36px;
        border-radius: 9999px;
        color: #fff;
        font-size: 0.85rem;
        font-family: inherit;
        outline: none;
        transition: 0.2s;
      }

      .friend-search-filter input:focus {
        border-color: #6366f1;
        box-shadow: 0 0 12px rgba(99, 102, 241, 0.25);
      }

      .filter-icon {
        position: absolute;
        left: 12px;
        font-size: 0.85rem;
        opacity: 0.6;
        pointer-events: none;
      }

      .clear-btn {
        position: absolute;
        right: 10px;
        background: none;
        border: none;
        color: #94a3b8;
        font-size: 1.1rem;
        cursor: pointer;
        padding: 0;
      }

      .divider {
        height: 1px;
        background: linear-gradient(90deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.02) 100%);
        margin-bottom: 24px;
      }

      /* Friends List Grid */
      .friends-list-grid {
        display: flex;
        flex-direction: column;
        gap: 14px;
      }

      .friend-card {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        padding: 16px 22px;
        background: rgba(255, 255, 255, 0.025);
        border: 1px solid rgba(255, 255, 255, 0.06);
        border-radius: 20px;
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .friend-card:hover {
        background: rgba(255, 255, 255, 0.05);
        border-color: rgba(99, 102, 241, 0.35);
        transform: translateY(-2px);
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.35);
      }

      .friend-info {
        display: flex;
        align-items: center;
        gap: 16px;
        min-width: 0;
      }

      .avatar-status-wrap {
        position: relative;
        flex-shrink: 0;
      }

      .avatar-placeholder {
        width: 52px;
        height: 52px;
        border-radius: 50%;
        background: linear-gradient(135deg, #6366f1, #a855f7);
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 800;
        font-size: 1.4rem;
        box-shadow: 0 6px 18px rgba(99, 102, 241, 0.35);
      }

      .avatar-status-wrap .status-dot {
        position: absolute;
        bottom: 2px;
        right: 2px;
        width: 14px;
        height: 14px;
        border-radius: 50%;
        border: 2.5px solid #0f172a;
      }

      .avatar-status-wrap.is-online .status-dot {
        background: #10b981;
        box-shadow: 0 0 10px #10b981;
      }

      .avatar-status-wrap.is-offline .status-dot {
        background: #64748b;
      }

      .friend-details {
        display: flex;
        flex-direction: column;
        gap: 4px;
        min-width: 0;
      }

      .friend-name-row {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
      }

      .friend-name {
        margin: 0;
        font-size: 1.15rem;
        font-weight: 700;
        color: #f8fafc;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .country-flag {
        width: 20px;
        height: 14px;
        border-radius: 2px;
        box-shadow: 0 1px 4px rgba(0,0,0,0.3);
      }

      .status-pill {
        font-size: 0.8rem;
        font-weight: 600;
      }

      .status-pill.online {
        color: #34d399;
      }

      .status-pill.offline {
        color: #64748b;
      }

            .friend-call-actions {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-shrink: 0;
      }

      .call-action-btn {
        padding: 8px 15px;
        border-radius: 12px;
        font-weight: 700;
        font-size: 0.85rem;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        transition: all 0.25s;
        border: none;
        flex-shrink: 0;
        font-family: inherit;
        white-space: nowrap;
      }

      .call-action-btn.video.active {
        background: linear-gradient(135deg, #7928ca, #b224ef);
        color: #ffffff;
        box-shadow: 0 4px 14px rgba(178, 36, 239, 0.35);
      }

      .call-action-btn.video.active:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 22px rgba(178, 36, 239, 0.6);
        filter: brightness(1.12);
      }

      .call-action-btn.text.active {
        background: linear-gradient(135deg, #0072ff, #00f2fe);
        color: #030d1e;
        box-shadow: 0 4px 14px rgba(0, 242, 254, 0.35);
      }

      .call-action-btn.text.active:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 22px rgba(0, 242, 254, 0.6);
        filter: brightness(1.12);
      }

      .call-action-btn.disabled {
        background: rgba(255, 255, 255, 0.05);
        color: #64748b;
        cursor: not-allowed;
      }

      .pulsing-call {
        animation: pulseAvatar 1.6s infinite ease-in-out;
      }

      @keyframes pulseAvatar {
        0% { transform: scale(0.96); box-shadow: 0 0 0 0 rgba(0, 242, 254, 0.6); }
        70% { transform: scale(1.05); box-shadow: 0 0 0 14px rgba(0, 242, 254, 0); }
        100% { transform: scale(0.96); box-shadow: 0 0 0 0 rgba(0, 242, 254, 0); }
      }

      /* Empty States */
      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        padding: 60px 24px;
        color: #94a3b8;
      }

      .empty-state.small {
        padding: 30px 20px;
      }

      .empty-icon-circle {
        font-size: 3.5rem;
        margin-bottom: 16px;
        filter: drop-shadow(0 0 20px rgba(99, 102, 241, 0.3));
      }

      .empty-bell {
        font-size: 2.4rem;
        margin-bottom: 10px;
        opacity: 0.6;
      }

      .empty-state h3 {
        color: #f1f5f9;
        font-size: 1.4rem;
        margin: 0 0 8px 0;
      }

      .empty-state p {
        margin: 0 0 20px 0;
        font-size: 1rem;
        color: #94a3b8;
        max-width: 440px;
        line-height: 1.5;
      }

      .empty-state small {
        color: #64748b;
        font-size: 0.85rem;
      }

      .empty-actions {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
        justify-content: center;
      }

      .empty-cta-btn {
        background: linear-gradient(135deg, #6366f1, #8b5cf6);
        color: #fff;
        border: none;
        padding: 12px 24px;
        border-radius: 9999px;
        font-weight: 700;
        font-size: 0.95rem;
        cursor: pointer;
        transition: 0.25s;
        font-family: inherit;
      }

      .empty-cta-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 25px rgba(99, 102, 241, 0.4);
      }

      .empty-cta-btn.cyan {
        background: linear-gradient(135deg, rgba(6, 182, 212, 0.25), rgba(14, 165, 233, 0.35));
        border: 1.5px solid #00f2fe;
      }

      .empty-cta-btn.cyan:hover {
        box-shadow: 0 10px 25px rgba(0, 242, 254, 0.35);
      }

      /* Actions Panel */
      .actions-panel {
        display: flex;
        flex-direction: column;
        gap: 24px;
      }

      .friend-search-form {
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin-top: 14px;
      }

      .search-input-wrapper {
        position: relative;
        display: flex;
        align-items: center;
      }

      .search-icon {
        position: absolute;
        left: 16px;
        color: #94a3b8;
        font-size: 0.95rem;
      }

      .search-input-wrapper input {
        width: 100%;
        background: rgba(0, 0, 0, 0.35);
        border: 1px solid rgba(255, 255, 255, 0.1);
        padding: 13px 16px 13px 44px;
        border-radius: 14px;
        color: white;
        font-size: 0.95rem;
        transition: all 0.25s;
        font-family: inherit;
        outline: none;
      }

      .search-input-wrapper input:focus {
        border-color: #6366f1;
        box-shadow: 0 0 14px rgba(99, 102, 241, 0.25);
      }

      .btn-search {
        background: linear-gradient(135deg, rgba(99, 102, 241, 0.3), rgba(168, 85, 247, 0.3));
        border: 1px solid rgba(99, 102, 241, 0.5);
        color: white;
        padding: 12px;
        border-radius: 14px;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.25s;
        font-family: inherit;
      }

      .btn-search:hover {
        background: linear-gradient(135deg, #6366f1, #8b5cf6);
        box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
        transform: translateY(-1px);
      }

      .search-results-list {
        margin-top: 18px;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .results-label {
        font-size: 0.8rem;
        color: #94a3b8;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .search-result-card {
        padding: 12px 16px;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 14px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
      }

      .result-info {
        display: flex;
        align-items: center;
        gap: 12px;
        min-width: 0;
      }

      .avatar-mini {
        width: 38px;
        height: 38px;
        border-radius: 50%;
        background: linear-gradient(135deg, #475569, #334155);
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 800;
        color: white;
        flex-shrink: 0;
      }

      .result-text {
        display: flex;
        flex-direction: column;
        min-width: 0;
      }

      .result-name {
        font-weight: 700;
        font-size: 0.95rem;
        color: white;
      }

      .result-email {
        font-size: 0.78rem;
        color: #94a3b8;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .btn-add {
        background: #10b981;
        color: white;
        border: none;
        padding: 8px 18px;
        border-radius: 10px;
        font-weight: 700;
        font-size: 0.85rem;
        cursor: pointer;
        transition: 0.2s;
        font-family: inherit;
        flex-shrink: 0;
      }

      .btn-add:hover {
        background: #059669;
        transform: scale(1.05);
      }

      /* Requests Panel */
      .request-badge {
        background: #ec4899;
        color: white;
        padding: 2px 10px;
        border-radius: 9999px;
        font-size: 0.8rem;
        font-weight: 800;
      }

      .requests-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin-top: 14px;
      }

      .request-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: rgba(255, 255, 255, 0.03);
        padding: 12px 16px;
        border-radius: 16px;
        border: 1px solid rgba(255, 255, 255, 0.06);
        gap: 12px;
      }

      .request-info {
        display: flex;
        align-items: center;
        gap: 12px;
        min-width: 0;
      }

      .request-details {
        display: flex;
        flex-direction: column;
        gap: 2px;
        min-width: 0;
      }

      .req-name-row {
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .request-name {
        font-weight: 700;
        font-size: 0.95rem;
        color: #f1f5f9;
      }

      .req-sub {
        font-size: 0.75rem;
        color: #94a3b8;
      }

      .btn-accept-small {
        background: rgba(99, 102, 241, 0.25);
        color: #a5b4fc;
        border: 1px solid rgba(99, 102, 241, 0.5);
        padding: 8px 16px;
        border-radius: 10px;
        font-weight: 700;
        font-size: 0.85rem;
        cursor: pointer;
        transition: 0.2s;
        font-family: inherit;
        flex-shrink: 0;
      }

      .btn-accept-small:hover {
        background: #6366f1;
        color: white;
        transform: translateY(-1px);
      }

      /* Modals */
      .modal-overlay {
        position: fixed;
        top: 0; left: 0; width: 100vw; height: 100vh;
        background: rgba(0, 0, 0, 0.85);
        backdrop-filter: blur(16px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 99999;
        padding: 20px;
        animation: fadeIn 0.3s ease;
      }

      .modal-card {
        background: rgba(15, 23, 42, 0.96);
        border: 1px solid rgba(255, 255, 255, 0.12);
        padding: 36px 30px;
        border-radius: 26px;
        width: 100%;
        max-width: 440px;
        text-align: center;
        box-shadow: 0 30px 80px rgba(0, 0, 0, 0.8);
      }

      .modal-card h2 {
        margin: 0 0 10px 0;
        font-size: 1.5rem;
        font-weight: 800;
      }

      .modal-card p {
        color: #cbd5e1;
        line-height: 1.5;
        margin-bottom: 25px;
        font-size: 0.95rem;
      }

      .premium-icon {
        font-size: 3.5rem;
        margin-bottom: 12px;
      }

      .modal-actions {
        display: flex;
        gap: 14px;
        justify-content: center;
      }

      .modal-actions button {
        padding: 12px 24px;
        border-radius: 14px;
        font-weight: 700;
        cursor: pointer;
        border: none;
        transition: 0.25s;
        font-family: inherit;
      }

      .btn-premium { background: linear-gradient(135deg, #f59e0b, #d97706); color: white; }
      .btn-premium:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(245, 158, 11, 0.4); }
      
      .btn-accept { background: #10b981; color: white; }
      .btn-decline { background: rgba(239, 68, 68, 0.2); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.4); }
      .btn-secondary { background: rgba(255,255,255,0.08); color: white; }

      .call-avatar {
        width: 76px;
        height: 76px;
        border-radius: 50%;
        background: rgba(99, 102, 241, 0.2);
        color: #818cf8;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 2.2rem;
        margin: 0 auto 18px auto;
        position: relative;
        box-shadow: 0 0 25px rgba(99, 102, 241, 0.5);
      }

      @keyframes fadeIn {
        from { opacity: 0; transform: scale(0.96); }
        to { opacity: 1; transform: scale(1); }
      }

      /* Mobile Phone Optimization */
      @media (max-width: 900px) {
        .header-content {
          padding: 12px 18px;
        }

        .header-nav {
          display: none;
        }

        .mobile-tabs-bar {
          display: flex;
        }

        .dashboard-hero {
          grid-template-columns: 1fr;
          margin: 14px auto;
          padding: 0 14px;
          gap: 16px;
        }

        .glass-panel {
          padding: 20px 16px;
          border-radius: 20px;
        }

        .mobile-hidden {
          display: none !important;
        }

        .panel-header {
          flex-direction: column;
          align-items: flex-start;
          gap: 12px;
        }

        .friend-search-filter {
          width: 100%;
        }

        .friend-card {
          padding: 12px 14px;
        }

        .avatar-placeholder {
          width: 44px;
          height: 44px;
          font-size: 1.2rem;
        }

        .friend-name {
          font-size: 1rem;
        }

        .call-action-btn {
          padding: 8px 16px;
          font-size: 0.85rem;
        }
      }

    `}</style>
    </div>
  );
}
