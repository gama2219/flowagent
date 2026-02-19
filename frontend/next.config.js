/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  experimental: {
    optimizePackageImports: ["@supabase/ssr"],
  },
  
  async rewrites() {
    return [
      {
        source: '/langgraph/:path*',      // Matches /langgraph/ANYTHING
        destination: 'http://localhost:2024/:path*'  // → LangGraph
      }
    ];
  }
}

module.exports = nextConfig
