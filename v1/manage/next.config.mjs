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
  allowedDevOrigins: [
    '192.0.0.2',
    '*.*.*.*',
    '*.*.*',
    '*.*',
    'localhost',
    '*.localhost',
    '*.local',
    '**.local',
    '*.trycloudflare.com',
    '**.trycloudflare.com',
    '*.lhr.life',
    '**.lhr.life',
    '*.ngrok-free.app',
    '**.ngrok-free.app',
    '*.loca.lt',
    '**.loca.lt',
    ...(process.env.ALLOWED_DEV_ORIGINS ? process.env.ALLOWED_DEV_ORIGINS.split(',') : [])
  ],
};

export default nextConfig;
