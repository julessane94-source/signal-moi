/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  i18n: {
    locales: ['fr'],
    defaultLocale: 'fr',
  },
  images: {
    domains: (function(){
      const defaults = ['localhost', 'signal-moi.vercel.app', 'signal-moi-api.onrender.com']
      try {
        const api = process.env.NEXT_PUBLIC_API_URL
        if (!api) return defaults
        const u = new URL(api)
        const host = u.hostname
        if (!defaults.includes(host)) defaults.push(host)
      } catch (e) {
        // ignore invalid env
      }
      return defaults
    })(),
  },
  async headers() {
    return [
      // Home page: no-cache
      {
        source: '/',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'Permissions-Policy',
            value: 'geolocation=(self), microphone=(self), camera=(self)',
          },
        ],
      },
      // Apply no-cache to all non-static, non-api routes (pages rendered by Next)
      {
        // negative lookahead to exclude _next and api paths
        source: '/((?!_next/|api/).*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'Permissions-Policy',
            value: 'geolocation=(self), microphone=(self), camera=(self)',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
