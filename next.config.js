// next.config.js - Next.js 설정
/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    swcMinify: true,
    experimental: {
      serverComponentsExternalPackages: ['@prisma/client', 'bcryptjs']
    },
    webpack: (config) => {
      config.externals.push('@prisma/client');
      return config;
    }
  };
  
  module.exports = nextConfig;