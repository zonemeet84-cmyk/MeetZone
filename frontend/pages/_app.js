import '../styles/globals.css'
import { SessionProvider } from "next-auth/react"
import Head from 'next/head'
import { useEffect } from 'react'
import axios from 'axios'
import { useRouter } from 'next/router'

function MyApp({ Component, pageProps: { session, ...pageProps } }) {
  const router = useRouter();

  useEffect(() => {
    // Setup Axios Interceptor for 401 Unauthorized errors
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        // If 401 and we haven't retried yet
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            // Attempt to get a new access token using the HttpOnly refresh cookie
            const res = await axios.post("https://api.zonemeet.chat/api/auth/refresh_token", {}, {
              withCredentials: true
            });
            
            if (res.data.token) {
              // Update token in localStorage
              localStorage.setItem("token", res.data.token);
              localStorage.setItem("user", JSON.stringify(res.data.user));
              
              // Update the failed request's auth header and retry it
              originalRequest.headers['Authorization'] = `Bearer ${res.data.token}`;
              return axios(originalRequest);
            }
          } catch (refreshError) {
            // Refresh token failed/expired, force logout
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            if (router.pathname !== '/login' && router.pathname !== '/signup') {
              router.push("/login");
            }
          }
        }
        return Promise.reject(error);
      }
    );

    // Also add default Authorization header for requests if token exists
    axios.interceptors.request.use((config) => {
      const token = localStorage.getItem("token");
      if (token && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, [router]);

  return (
    <SessionProvider session={session}>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" href="/favicon.png" type="image/png" />
      </Head>
      <Component {...pageProps} />
    </SessionProvider>
  )
}

export default MyApp
