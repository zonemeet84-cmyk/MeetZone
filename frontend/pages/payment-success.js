import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import axios from 'axios';

export default function PaymentSuccess() {
  const router = useRouter();
  const [status, setStatus] = useState("loading"); // loading, success, error
  const [message, setMessage] = useState("Verifying your payment...");

  useEffect(() => {
    // Wait until router is ready
    if (!router.isReady) return;

    const { 
      cf_order, 
      cf_sub, 
      order_id, 
      plan, 
      email, 
      token, // PayPal sends token for orderId
      paypal_order, 
      paypal_sub, 
      subscription_id // PayPal sends subscription_id for subs
    } = router.query;

    const verifyPayment = async () => {
      try {
        let endpoint = "";
        let payload = {};

        // 1. CASHFREE ORDER VERIFICATION
        if (cf_order || order_id || cf_sub) {
          endpoint = "https://api.zonemeet.chat/api/payment/cashfree/verify";
          
          // cf_order is from frontend checkout redirect, order_id is from backend redirect, cf_sub from sub checkout
          const actualOrderId = cf_order || order_id || cf_sub;
          
          let userEmail = email;
          let planName = plan;
          
          // Try to get from localStorage if missing in URL
          if (!userEmail || !planName) {
            const userStr = localStorage.getItem("user");
            if (userStr) {
              const u = JSON.parse(userStr);
              if (!userEmail) userEmail = u.email;
            }
          }

          payload = {
            orderId: actualOrderId,
            userEmail,
            planName
          };
        } 
        // 2. PAYPAL ORDER VERIFICATION (token usually holds the PayPal order ID)
        else if (token || paypal_order) {
          endpoint = "https://api.zonemeet.chat/api/payment/paypal/capture";
          
          const pendingStr = localStorage.getItem("paypal_pending");
          if (!pendingStr) {
            throw new Error("No pending PayPal transaction found in local storage.");
          }
          const pendingData = JSON.parse(pendingStr);
          
          payload = {
            orderId: token || pendingData.orderId,
            userEmail: pendingData.userEmail,
            planName: pendingData.planName,
            giftRecipientId: pendingData.giftRecipientId
          };
        }
        // 3. PAYPAL SUBSCRIPTION VERIFICATION
        else if (subscription_id || paypal_sub) {
          endpoint = "https://api.zonemeet.chat/api/payment/paypal/verify-subscription";
          
          const pendingStr = localStorage.getItem("paypal_pending");
          let pendingData = null;
          if (pendingStr) {
            pendingData = JSON.parse(pendingStr);
          }
          
          // If we don't have pending data, try to get email from user session
          let userEmail = pendingData ? pendingData.userEmail : null;
          if (!userEmail) {
             const userStr = localStorage.getItem("user");
             if (userStr) {
               userEmail = JSON.parse(userStr).email;
             }
          }
          
          payload = {
            subscriptionId: subscription_id,
            userEmail: userEmail,
            planName: pendingData ? pendingData.planName : null
          };
        } else {
          // No recognizable parameters
          setStatus("error");
          setMessage("No payment parameters found in URL. Verification aborted.");
          return;
        }

        // Make the API call to verify
        const response = await axios.post(endpoint, payload);
        
        if (response.data.success) {
          setStatus("success");
          setMessage("Payment verified successfully! Your account has been updated.");
          
          // Update local user data if returned
          if (response.data.user) {
            localStorage.setItem("user", JSON.stringify(response.data.user));
          }
          
          // Clean up pending data
          localStorage.removeItem("paypal_pending");
        } else {
          setStatus("error");
          setMessage(response.data.message || "Payment verification failed.");
        }
      } catch (error) {
        console.error("Verification Error:", error);
        setStatus("error");
        setMessage(error.response?.data?.message || error.message || "An error occurred during verification.");
      }
    };

    verifyPayment();
  }, [router.isReady, router.query]);

  return (
    <>
      <Head>
        <title>Payment Status - ZoneMeet</title>
      </Head>
      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Inter', sans-serif",
        color: "white",
        padding: "20px"
      }}>
        <div style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.1)",
          backdropFilter: "blur(20px)",
          borderRadius: "24px",
          padding: "50px 40px",
          maxWidth: "500px",
          width: "100%",
          textAlign: "center",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
        }}>
          {status === "loading" && (
            <>
              <div style={{ display: "inline-block", position: "relative", width: "80px", height: "80px" }}>
                <div style={{
                  position: "absolute",
                  top: 0, left: 0, right: 0, bottom: 0,
                  border: "4px solid rgba(99, 102, 241, 0.2)",
                  borderRadius: "50%",
                }}></div>
                <div style={{
                  position: "absolute",
                  top: 0, left: 0, right: 0, bottom: 0,
                  border: "4px solid #6366f1",
                  borderRadius: "50%",
                  borderTopColor: "transparent",
                  animation: "spin 1s linear infinite"
                }}></div>
              </div>
              <h2 style={{ fontSize: "1.75rem", fontWeight: "700", marginTop: "30px", marginBottom: "15px" }}>
                Verifying Payment...
              </h2>
              <p style={{ color: "#94a3b8", fontSize: "1rem" }}>
                Please wait a moment while we confirm your transaction securely.
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <div style={{
                width: "80px",
                height: "80px",
                background: "rgba(16, 185, 129, 0.1)",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto",
                border: "2px solid #10b981",
                boxShadow: "0 0 30px rgba(16, 185, 129, 0.3)"
              }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
              <h2 style={{ fontSize: "1.75rem", fontWeight: "700", marginTop: "30px", marginBottom: "15px", color: "#10b981" }}>
                Payment Successful!
              </h2>
              <p style={{ color: "#e2e8f0", fontSize: "1.1rem", marginBottom: "30px" }}>
                {message}
              </p>
              <button 
                onClick={() => router.push("/")}
                style={{
                  background: "linear-gradient(135deg, #3b82f6 0%, #4f46e5 100%)",
                  color: "white",
                  border: "none",
                  padding: "15px 30px",
                  borderRadius: "12px",
                  fontSize: "1.1rem",
                  fontWeight: "600",
                  cursor: "pointer",
                  width: "100%",
                  transition: "all 0.2s"
                }}
                onMouseOver={(e) => e.target.style.transform = "translateY(-2px)"}
                onMouseOut={(e) => e.target.style.transform = "translateY(0)"}
              >
                Return to Dashboard
              </button>
            </>
          )}

          {status === "error" && (
            <>
              <div style={{
                width: "80px",
                height: "80px",
                background: "rgba(239, 68, 68, 0.1)",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto",
                border: "2px solid #ef4444",
                boxShadow: "0 0 30px rgba(239, 68, 68, 0.3)"
              }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </div>
              <h2 style={{ fontSize: "1.75rem", fontWeight: "700", marginTop: "30px", marginBottom: "15px", color: "#ef4444" }}>
                Verification Failed
              </h2>
              <p style={{ color: "#e2e8f0", fontSize: "1.1rem", marginBottom: "30px" }}>
                {message}
              </p>
              <button 
                onClick={() => router.push("/")}
                style={{
                  background: "rgba(255, 255, 255, 0.1)",
                  color: "white",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  padding: "15px 30px",
                  borderRadius: "12px",
                  fontSize: "1.1rem",
                  fontWeight: "600",
                  cursor: "pointer",
                  width: "100%",
                  transition: "all 0.2s"
                }}
                onMouseOver={(e) => e.target.style.background = "rgba(255, 255, 255, 0.15)"}
                onMouseOut={(e) => e.target.style.background = "rgba(255, 255, 255, 0.1)"}
              >
                Go Back
              </button>
            </>
          )}
        </div>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </>
  );
}
