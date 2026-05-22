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
  const [searchEmail, setSearchEmail] = useState("");
  const [searchResult, setSearchResult] = useState(null);
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
    const token = sessionStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    const storedUser = sessionStorage.getItem("user") ? JSON.parse(sessionStorage.getItem("user")) : null;
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
    const token = sessionStorage.getItem("token");
    try {
      const res = await axios.get(`https://api.zonemeet.chat/api/users/search?email=${searchEmail}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSearchResult(res.data);
    } catch (err) {
      alert("User not found");
      setSearchResult(null);
    }
  };

  const sendRequest = async () => {
    const token = sessionStorage.getItem("token");
    try {
      await axios.post("https://api.zonemeet.chat/api/friends/request", { targetId: searchResult.id }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("Friend request sent!");
      setSearchResult(null);
      setSearchEmail("");
    } catch (err) {
      if (err.response?.data?.requiresPremium) {
        setShowPremiumPopup(true);
      } else {
        alert(err.response?.data?.message || "Failed to send request");
      }
    }
  };

  const acceptRequest = async (requesterId) => {
    const token = sessionStorage.getItem("token");
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

      <div className="header">
        <div className="brand-group" onClick={() => router.push("/")} style={{ cursor: "pointer" }}>
          <h1>ZoneMeet</h1>
        </div>
        
        <button className="btn btn-secondary btn-sm" onClick={() => router.push("/")} style={{ fontWeight: 'bold' }}>
          🏠 Go Home
        </button>

        <div className="user-info" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div className={`status-pill ${isOnline && isSocketConnected ? 'online' : 'offline'}`}>
            <span className="dot"></span>
            {isOnline && isSocketConnected ? 'Connected' : !isOnline ? 'No Internet' : 'Connecting...'}
          </div>
          <span>{user.name}</span>
        </div>
      </div>

      {incomingCall && (
        <div className="payment-modal-overlay" style={{ zIndex: 9999 }}>
          <div className="payment-modal-card">
            <h2>Incoming Call...</h2>
            <p>{incomingCall.fromUser.name} is calling you!</p>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'center' }}>
              <button className="btn btn-primary" onClick={acceptCall} style={{ backgroundColor: '#2ecc71' }}>Accept</button>
              <button className="btn btn-secondary" onClick={rejectCall} style={{ backgroundColor: '#e74c3c' }}>Decline</button>
            </div>
          </div>
        </div>
      )}

      {showPremiumPopup && (
        <div className="payment-modal-overlay" style={{ zIndex: 9999 }}>
          <div className="payment-modal-card">
            <h2>Friend Limit Reached!</h2>
            <p style={{ marginTop: '10px' }}>Free plan allows a maximum of 5 friends. Upgrade to a premium subscription to add more friends and unlock exclusive features!</p>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'center' }}>
              <button className="btn btn-primary" onClick={() => router.push("/")} style={{ backgroundColor: '#f59e0b' }}>Upgrade Now</button>
              <button className="btn btn-secondary" onClick={() => setShowPremiumPopup(false)}>Maybe Later</button>
            </div>
          </div>
        </div>
      )}

      <main className="dashboard-hero" style={{ padding: '20px', display: 'flex', gap: '40px', alignItems: 'flex-start' }}>
        
        {/* LEFT PANEL: Friends List */}
        <div className="pricing-card" style={{ flex: 2, background: 'rgba(255,255,255,0.05)', textAlign: 'left', minHeight: '60vh' }}>
          <h2>My Friends</h2>
          <hr className="dropdown-divider" />
          
          {friends.length === 0 ? (
            <p style={{ color: '#aaa', marginTop: '20px' }}>You have no friends yet. Add some!</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
              {friends.map(f => (
                <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: f.online ? '#2ecc71' : '#95a5a6', boxShadow: f.online ? '0 0 8px #2ecc71' : 'none' }}></div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {f.name}
                        {getFlagUrl(f.country) && <img src={getFlagUrl(f.country)} alt={f.country} title={getCountryName(f.country)} style={{ width: '16px', height: '12px', borderRadius: '2px' }} />}
                      </h3>
                      <span style={{ fontSize: '0.85rem', color: '#aaa' }}>{f.online ? '🟢 Online' : '⚪ Offline'}</span>
                    </div>
                  </div>
                  <button 
                    className="btn btn-primary btn-sm" 
                    disabled={!f.online}
                    onClick={() => startDirectCall(f)}
                    style={{ opacity: f.online ? 1 : 0.5 }}
                  >
                    📞 Call
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT PANEL: Search & Requests */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div className="pricing-card" style={{ background: 'rgba(255,255,255,0.05)', textAlign: 'left' }}>
            <h3>Add Friend</h3>
            <form className="friend-search-form" onSubmit={handleSearch} style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
              <input 
                type="email" 
                value={searchEmail} 
                onChange={(e) => setSearchEmail(e.target.value)} 
                placeholder="Friend's email" 
                className="styled-input" 
                required 
              />
              <button type="submit" className="btn btn-secondary btn-sm">Search</button>
            </form>
            
            {searchResult && (
              <div style={{ marginTop: '20px', padding: '15px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#fff' }}>{searchResult.name}</span>
                <button className="btn btn-primary btn-sm" onClick={sendRequest}>Add</button>
              </div>
            )}
          </div>

          <div className="pricing-card" style={{ background: 'rgba(255,255,255,0.05)', textAlign: 'left' }}>
            <h3>Friend Requests</h3>
            {requests.length === 0 ? (
              <p style={{ color: '#aaa', fontSize: '0.9rem', marginTop: '10px' }}>No pending requests.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '15px' }}>
                {requests.map(r => (
                  <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: '#fff', fontSize: '0.9rem' }}>{r.name}</span>
                      {getFlagUrl(r.country) && <img src={getFlagUrl(r.country)} alt={r.country} title={getCountryName(r.country)} style={{ width: '16px', height: '12px', borderRadius: '2px' }} />}
                    </div>
                    <button className="btn btn-primary btn-sm" onClick={() => acceptRequest(r.id)}>Accept</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </main>
    <style jsx>{`
      .status-pill {
        display: flex;
        align-items: center;
        gap: 6px;
        background: rgba(255, 255, 255, 0.05);
        padding: 4px 10px;
        border-radius: 50px;
        font-size: 0.75rem;
        font-weight: 700;
        border: 1px solid rgba(255, 255, 255, 0.1);
      }
      .status-pill.online { color: #2ecc71; border-color: rgba(46, 204, 113, 0.3); }
      .status-pill.offline { color: #e74c3c; border-color: rgba(231, 76, 60, 0.3); }
      .dot {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: currentColor;
        box-shadow: 0 0 8px currentColor;
      }

      /* MOBILE RESPONSIVENESS FOR FRIENDS */
      @media (max-width: 1024px) {
        .dashboard-hero {
          flex-direction: column !important;
          gap: 30px !important;
        }
        .pricing-card {
          width: 100% !important;
          flex: none !important;
        }
      }

      @media (max-width: 768px) {
        .header {
          padding: 10px 15px !important;
          flex-direction: row;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 10px;
        }
        .header h1 {
          font-size: 1.2rem;
          margin: 0;
        }
        .user-info {
          flex-direction: row;
          justify-content: center;
          width: 100%;
          gap: 10px !important;
        }
        .dashboard-hero {
          padding: 10px !important;
        }
        .pricing-card {
          padding: 15px !important;
        }
        .payment-modal-card {
          width: 90% !important;
          padding: 30px 20px !important;
        }
        .friend-search-form {
          flex-direction: column !important;
        }
        .friend-search-form input, .friend-search-form button {
          width: 100% !important;
        }
      }
    `}</style>
    </div>
  );
}
