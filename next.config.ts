import { withSentryConfig } from '@sentry/nextjs'
import path from 'node:path'
import type { NextConfig } from 'next'

const modernNextPolyfillModule = path.resolve(
  __dirname,
  'lib/polyfills/next-polyfill-module-modern.js'
)
const modernNextPolyfillModuleForTurbopack = './lib/polyfills/next-polyfill-module-modern.js'
const nextPolyfillModuleRequests = [
  '../build/polyfills/polyfill-module',
  '../build/polyfills/polyfill-module.js',
  'next/dist/build/polyfills/polyfill-module',
  'next/dist/build/polyfills/polyfill-module.js',
]
const nextPolyfillModuleAliasesForTurbopack = Object.fromEntries(
  nextPolyfillModuleRequests.map(request => [request, modernNextPolyfillModuleForTurbopack])
)
const APP_BUILD_VERSION =
  process.env.NEXT_PUBLIC_APP_BUILD_VERSION?.trim() ||
  process.env.GITHUB_SHA?.slice(0, 12) ||
  process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) ||
  Date.now().toString(36)
const NO_STORE_HEADERS = [
  {
    key: 'Cache-Control',
    value: 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0',
  },
  {
    key: 'Pragma',
    value: 'no-cache',
  },
  {
    key: 'Expires',
    value: '0',
  },
]

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ['127.0.0.1'],
  env: {
    NEXT_PUBLIC_APP_BUILD_VERSION: APP_BUILD_VERSION,
  },
  generateBuildId: async () => APP_BUILD_VERSION,
  async redirects() {
    return [
      {
        source: '/chat',
        destination: 'https://chat.dogeow.com/chat',
        permanent: true,
      },
      {
        source: '/about/site',
        destination: 'https://status.dogeow.com/',
        permanent: true,
      },
    ]
  },
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [...NO_STORE_HEADERS, { key: 'Service-Worker-Allowed', value: '/' }],
      },
      {
        source: '/manifest.webmanifest',
        headers: NO_STORE_HEADERS,
      },
      {
        source: '/:path*',
        has: [
          {
            type: 'header',
            key: 'accept',
            value: '.*text/html.*',
          },
        ],
        headers: NO_STORE_HEADERS,
      },
    ]
  },
  // 将 Next 默认的 module polyfills 缩减到仅保留当前目标浏览器仍缺失的 URL.canParse。
  turbopack: {
    // Deployer builds inside /var/www/dogeow/releases/<n> while older releases and
    // the deploy root also contain package-lock.json. Pin the project root to this
    // release directory so Next.js does not infer /var/www/dogeow as a workspace.
    root: __dirname,
    resolveAlias: nextPolyfillModuleAliasesForTurbopack,
  },
  webpack: config => {
    config.resolve ??= {}
    config.resolve.alias ??= {}
    config.resolve.alias['@'] = path.join(__dirname)
    Object.assign(
      config.resolve.alias,
      Object.fromEntries(
        nextPolyfillModuleRequests.map(request => [`${request}$`, modernNextPolyfillModule])
      )
    )
    return config
  },
  images: {
    // 允许本地开发时加载 127.0.0.1/localhost 图片资源（生产环境保持默认安全策略）
    dangerouslyAllowLocalIP: process.env.NODE_ENV === 'development',
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '8000',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: 'next-api.dogeow.com',
      },
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
      },
      {
        protocol: 'https',
        hostname: 'ui-avatars.com',
      },
      {
        protocol: 'https',
        hostname: 'robohash.org',
      },
      {
        protocol: 'https',
        hostname: 'public.blob.vercel-storage.com',
      },
      {
        protocol: 'https',
        hostname: 'upyun.dogeow.com',
        pathname: '/**',
      },
    ],
    // 优化设备尺寸，添加更多小尺寸选项以匹配卡片大小
    deviceSizes: [
      24, 32, 48, 56, 64, 80, 96, 120, 150, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1200,
    ],
    qualities: [75, 85],
    // 添加imageSizes配置，用于响应式图片
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // 禁用对 SVG 的优化，因为 dicebear 返回的是 SVG
    unoptimized: false,
    // 添加加载器配置
    loader: 'default',
  },
}

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: 'none-v49',

  project: 'dogeow',

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: '/monitoring',

  webpack: {
    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,

    // Tree-shaking options for reducing bundle size
    treeshake: {
      // Automatically tree-shake Sentry logger statements to reduce bundle size
      removeDebugLogging: true,
    },
  },
})
