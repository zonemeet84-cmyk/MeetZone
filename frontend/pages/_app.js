import '../styles/globals.css'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'], display: 'swap' });

import { SessionProvider } from "next-auth/react"
import Head from 'next/head'
import { useEffect } from 'react'
import axios from 'axios'
import { useRouter } from 'next/router'
import Script from 'next/script'

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

    // Setup Google Analytics page tracking on route change
    const handleRouteChange = (url) => {
      if (window.gtag) {
        window.gtag('config', 'G-31YSDTY29W', {
          page_path: url,
        });
      }
    };
    router.events.on('routeChangeComplete', handleRouteChange);

    return () => {
      axios.interceptors.response.eject(interceptor);
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router]);

  return (
    <SessionProvider session={session}>
      {/* Global Site Tag (gtag.js) - Google Analytics */}
      <Script
        strategy="afterInteractive"
        src="https://www.googletagmanager.com/gtag/js?id=G-31YSDTY29W"
      />
      <Script
        id="gtag-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-31YSDTY29W', {
              page_path: window.location.pathname,
            });
          `,
        }}
      />
      <style jsx global>{`
        html, body {
          font-family: ${inter.style.fontFamily};
        }
      `}</style>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.png" type="image/png" />
      </Head>
      <Component {...pageProps} />
    </SessionProvider>
  )
}

export default MyApp
