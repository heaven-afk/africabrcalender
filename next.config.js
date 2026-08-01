/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow fs and path in API routes / server components
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Do not bundle fs/path/net on the client side
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
