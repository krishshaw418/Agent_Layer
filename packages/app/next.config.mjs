/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["ox"],
  serverExternalPackages: ["ws"],
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

