import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: { unoptimized: true },
  transpilePackages: ['@hivora/shared'],
}

export default nextConfig
