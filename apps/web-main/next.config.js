/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    // Allow importing the copied visualization from outside the app directory
    externalDir: true,
  },
};

module.exports = nextConfig;
