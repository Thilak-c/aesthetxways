/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  allowedDevOrigins: ['fee568a0f5638e.lhr.life', '*.trycloudflare.com', 'localhost'],
};

export default nextConfig;
