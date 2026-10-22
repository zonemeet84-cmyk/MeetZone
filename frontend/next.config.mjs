/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  compress: true,
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...(config.externals || []), "nsfwjs", "@tensorflow/tfjs"];
    }
    return config;
  },
};
export default nextConfig;
