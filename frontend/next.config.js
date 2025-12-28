/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'res.cloudinary.com',
      'scontent.fdad1-3.fna.fbcdn.net',
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'scontent.fdad1-3.fna.fbcdn.net',
      },
    ],
  },
}

module.exports = nextConfig

