/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    externalDir: true
  },
  webpack(config) {
    config.ignoreWarnings = [
      { module: /node_modules\/ox\/_esm\/tempo\/internal\/virtualMasterPool\.js/ },
    ];
    return config;
  },
};

export default nextConfig;

