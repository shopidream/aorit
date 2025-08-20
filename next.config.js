// next.config.js - Next.js 설정 (환경변수 강제 로드)
const path = require('path');

// PM2 환경에서 .env.local 강제 로드
if (process.env.NODE_ENV === 'production') {
  require('dotenv').config({ 
    path: path.resolve(process.cwd(), '.env.local'),
    override: false 
  });
}

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